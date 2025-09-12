import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:ndef/record.dart';
import 'package:pocketbase/pocketbase.dart';
import 'pocketbase_service.dart';
import 'security_service.dart';
import 'encryption_service.dart';
import 'crash_prevention_service.dart';
import 'app_state_manager.dart';

/// NFC安全扫描服务 - 统一处理所有NFC扫描操作
class NFCSafeScannerService {
  static final NFCSafeScannerService _instance = NFCSafeScannerService._internal();
  factory NFCSafeScannerService() => _instance;
  NFCSafeScannerService._internal();
  
  static NFCSafeScannerService get instance => _instance;
  
  // 防重复扫描机制
  bool _isScanning = false;
  DateTime? _lastScanTime;
  String? _lastScanData;
  
  final SecurityService _securityService = SecurityService();
  final EncryptionService _encryptionService = EncryptionService();
  
  /// 安全扫描NFC卡片
  /// [timeout] 扫描超时时间
  /// [requireStudent] 是否必须找到学生
  /// 返回扫描结果
  Future<NFCScanResult> safeScanNFC({
    Duration timeout = const Duration(seconds: 10),
    bool requireStudent = true,
  }) async {
    // 防重复扫描检查
    if (_isScanning) {
      print('⚠️ 正在扫描中，忽略重复请求');
      return NFCScanResult.error('正在扫描中，请稍候');
    }
    
    final now = DateTime.now();
    if (_lastScanTime != null && now.difference(_lastScanTime!).inSeconds < 3) {
      print('⚠️ 扫描间隔太短，忽略重复扫描');
      return NFCScanResult.error('扫描间隔太短，请稍候');
    }
    
    _isScanning = true;
    _lastScanTime = now;
    
    try {
      return await NFCOperationWrapper.execute(() async {
        try {
          // 检查NFC可用性
          final availability = await FlutterNfcKit.nfcAvailability;
          if (availability != NFCAvailability.available) {
            return NFCScanResult.error('NFC不可用，请检查设备设置');
          }
          
          // 添加Activity状态检查
          await _checkActivityState();
          
          // 开始扫描
          final tag = await FlutterNfcKit.poll(
            timeout: timeout,
            iosMultipleTagMessage: "发现多个标签！请移除所有标签，然后重试。",
            iosAlertMessage: "将设备靠近NFC标签"
          );
          
          await FlutterNfcKit.setIosAlertMessage("正在读取...");
          
          // 读取NFC数据
          String? nfcData;
          if (tag.ndefAvailable ?? false) {
            final records = await FlutterNfcKit.readNDEFRecords(cached: false);
            
            print('📋 读取到 ${records.length} 条NDEF记录');
            
            for (var record in records) {
              final payload = record.payload;
              if (payload == null) continue;

              try {
                List<int> bytes;
                if (payload is Uint8List) {
                  bytes = payload;
                } else if (payload is List<int>) {
                  bytes = payload;
                } else if (payload is String) {
                  // 十六进制字符串
                  final hexString = payload as String;
                  bytes = <int>[];
                  for (int i = 0; i < hexString.length; i += 2) {
                    bytes.add(int.parse(hexString.substring(i, i + 2), radix: 16));
                  }
                } else {
                  // 未知类型，跳过
                  continue;
                }

                if (bytes.isEmpty) continue;

                final status = bytes[0];
                final languageCodeLength = status & 0x1F; // 低5位为语言码长度
                final textStartIndex = 1 + languageCodeLength;
                if (textStartIndex <= bytes.length) {
                  final textBytes = bytes.sublist(textStartIndex);
                  nfcData = utf8.decode(textBytes);
                  if (nfcData?.isNotEmpty == true) {
                    print('✅ 成功读取数据: $nfcData');
                    break;
                  }
                }
              } catch (e) {
                print('⚠️ NDEF Text 解析失败: $e; payload类型=${payload.runtimeType}');
                continue;
              }
            }
          }
          
          await FlutterNfcKit.finish();
          
          // 添加缓冲时间
          print('⏳ 等待3秒缓冲时间...');
          await Future.delayed(const Duration(milliseconds: 3000));
          print('✅ 缓冲时间结束');
          
          if (nfcData == null || nfcData.isEmpty) {
            return NFCScanResult.error('NFC卡中没有找到有效数据');
          }
          
          // 解密数据
          final decryptedData = await _decryptNFCData(nfcData);
          
          // 查找学生
          if (requireStudent) {
            final student = await _findStudent(decryptedData);
            if (student == null) {
              return NFCScanResult.error('未找到对应的学生: $decryptedData');
            }
            
            // 安全检查
            final securityCheck = await _performSecurityCheck(student);
            if (!securityCheck.isAllowed) {
              return NFCScanResult.securityBlocked(securityCheck.reason ?? '未知安全原因');
            }
            
            return NFCScanResult.success(
              nfcData: nfcData,
              decryptedData: decryptedData,
              student: student,
              isEncrypted: decryptedData != nfcData,
            );
          } else {
            return NFCScanResult.success(
              nfcData: nfcData,
              decryptedData: decryptedData,
              isEncrypted: decryptedData != nfcData,
            );
          }
          
        } catch (e) {
          // 确保NFC会话被正确关闭
          try {
            await FlutterNfcKit.finish();
          } catch (_) {
            // 忽略关闭时的错误
          }
          
          // 检查是否是activity相关的错误
          if (e.toString().contains('not attached to activity') || 
              e.toString().contains('Activity')) {
            return NFCScanResult.error('NFC操作失败：应用状态异常，请重新打开应用后重试');
          }
          
          return NFCScanResult.error('NFC扫描失败: $e');
        }
      }, timeout: timeout);
    } finally {
      // 重置扫描状态
      _isScanning = false;
    }
  }
  
  /// 检查Activity状态
  Future<void> _checkActivityState() async {
    try {
      // 添加短暂延迟确保Activity已附加
      await Future.delayed(const Duration(milliseconds: 100));
      
      // 尝试一个简单的NFC操作来检查Activity状态
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability == NFCAvailability.not_supported) {
        throw Exception('NFC not supported');
      }
    } catch (e) {
      if (e.toString().contains('not attached to activity')) {
        throw Exception('Activity not attached, please restart the app');
      }
      rethrow;
    }
  }
  
  /// 解密NFC数据
  Future<String> _decryptNFCData(String nfcData) async {
    try {
      await _encryptionService.ensureKeysLoaded();
      // 检查是否是加密数据（格式: "encryptedData:salt"）
      if (nfcData.contains(':')) {
        final parts = nfcData.split(':');
        if (parts.length == 2) {
          final encryptedPart = parts[0].trim();
          final saltPart = parts[1].trim();
          final normalizedEncrypted = encryptedPart.replaceAll('-', '+').replaceAll('_', '/');
          final decrypted = _encryptionService.decryptNFCData(normalizedEncrypted, saltPart);
          // 明文应为 学号_随机串，提取学号部分
          final idx = decrypted.indexOf('_');
          final studentId = idx > 0 ? decrypted.substring(0, idx) : decrypted;
          print('🔓 解密成功: plaintext='+decrypted+' → studentId='+studentId);
          return studentId;
        }
      }
      
      // 未加密数据，直接返回
      return nfcData;
    } catch (e) {
      print('🔴 解密失败，使用原始数据: $e');
      return nfcData;
    }
  }
  
  /// 查找学生
  Future<RecordModel?> _findStudent(String data) async {
    try {
      print('🔍 查找学生，数据: $data');
      
      // 清理数据
      final cleanData = data.trim();
      
      // 判断数据类型
      if (cleanData.startsWith('http') || cleanData.contains('docs.google.com')) {
        // URL格式（向后兼容）
        print('🔗 检测到URL格式，使用URL查找');
        return await PocketBaseService.instance.getStudentByNfcUrl(cleanData);
      } else if (cleanData.startsWith('STUDENT_ID:')) {
        // 新格式：STUDENT_ID:xxx
        final studentId = cleanData.substring('STUDENT_ID:'.length).trim();
        print('👨‍🎓 检测到学生ID格式: $studentId');
        return await PocketBaseService.instance.getStudentByStudentId(studentId);
      } else {
        // 直接作为学生ID
        print('🔍 直接作为学生ID查找: $cleanData');
        return await PocketBaseService.instance.getStudentByStudentId(cleanData);
      }
    } catch (e) {
      print('❌ 查找学生失败: $e');
      return null;
    }
  }
  
  /// 执行安全检查
  Future<SecurityCheckResult> _performSecurityCheck(RecordModel student) async {
    try {
      final studentId = student.getStringValue('student_id') ?? student.id;
      final isLocked = await _securityService.isUserLocked(studentId, 'student');
      
      if (isLocked) {
        final lockReason = student.getStringValue('lock_reason') ?? '未知原因';
        return SecurityCheckResult.blocked('学生 ${student.getStringValue('student_name')} 已被锁定: $lockReason');
      }
      
      return SecurityCheckResult.allowed();
    } catch (e) {
      print('安全检查失败: $e');
      // 安全检查失败时，允许继续操作
      return SecurityCheckResult.allowed();
    }
  }
  
  /// 根据NFC数据查找学生
  Future<RecordModel?> findStudentByNfcData(String nfcData) async {
    try {
      print('🔍 根据NFC数据查找学生: $nfcData');
      
      // 先尝试解密数据
      String searchData = nfcData;
      try {
        final decryptedData = await _decryptNFCData(nfcData);
        if (decryptedData != nfcData) {
          searchData = decryptedData;
          print('✅ 使用解密数据查找: $searchData');
        } else {
          print('⚠️ 解密失败，使用原始数据: $searchData');
        }
      } catch (e) {
        print('⚠️ 解密失败，使用原始数据: $e');
        searchData = nfcData;
      }
      
      // 查找学生
      final student = await _findStudent(searchData);
      
      if (student != null) {
        print('✅ 找到学生: ${student.getStringValue('student_name')}');
        print('📋 学生详细信息:');
        print('   - ID: ${student.id}');
        print('   - 学生ID: ${student.getStringValue('student_id')}');
        print('   - 姓名: ${student.getStringValue('student_name')}');
        print('   - 班级: ${student.getStringValue('class_name')}');
      } else {
        print('❌ 未找到对应的学生');
        print('🔍 尝试其他匹配方式...');
        
        // 尝试多种匹配方式
        final alternativeMatches = await _tryAlternativeMatches(searchData);
        if (alternativeMatches != null) {
          print('✅ 通过替代方式找到学生: ${alternativeMatches.getStringValue('student_name')}');
          return alternativeMatches;
        }
      }
      
      return student;
    } catch (e) {
      print('❌ 查找学生失败: $e');
      return null;
    }
  }
  
  /// 尝试替代匹配方式
  Future<RecordModel?> _tryAlternativeMatches(String data) async {
    try {
      final cleanData = data.trim();
      
      // 1. 尝试按姓名查找
      print('🔍 尝试按姓名查找: $cleanData');
      final studentsByName = await PocketBaseService.instance.pb.collection('students').getList(
        filter: 'student_name ~ "$cleanData"',
        perPage: 10,
      );
      
      if (studentsByName.items.isNotEmpty) {
        print('✅ 按姓名找到 ${studentsByName.items.length} 个学生');
        return studentsByName.items.first;
      }
      
      // 2. 尝试按ID查找（去掉前缀）
      if (cleanData.contains(':')) {
        final parts = cleanData.split(':');
        if (parts.length > 1) {
          final idPart = parts.last.trim();
          print('🔍 尝试按ID部分查找: $idPart');
          final studentById = await PocketBaseService.instance.getStudentByStudentId(idPart);
          if (studentById != null) {
            return studentById;
          }
        }
      }
      
      // 3. 尝试模糊匹配学生ID
      print('🔍 尝试模糊匹配学生ID: $cleanData');
      final studentsByFuzzyId = await PocketBaseService.instance.pb.collection('students').getList(
        filter: 'student_id ~ "$cleanData"',
        perPage: 10,
      );
      
      if (studentsByFuzzyId.items.isNotEmpty) {
        print('✅ 模糊匹配找到 ${studentsByFuzzyId.items.length} 个学生');
        return studentsByFuzzyId.items.first;
      }
      
      // 4. 列出所有学生供调试
      print('🔍 列出所有学生供调试...');
      final allStudents = await PocketBaseService.instance.pb.collection('students').getList(
        perPage: 5,
      );
      
      print('📋 数据库中的学生示例:');
      for (var student in allStudents.items) {
        print('   - ID: ${student.id}, 学生ID: ${student.getStringValue('student_id')}, 姓名: ${student.getStringValue('student_name')}');
      }
      
      return null;
    } catch (e) {
      print('❌ 替代匹配失败: $e');
      return null;
    }
  }
  Future<bool> safeWriteNFC(String data, {Duration timeout = const Duration(seconds: 10)}) async {
    try {
      // 检查NFC可用性
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability != NFCAvailability.available) {
        throw Exception('NFC不可用，请检查设备设置');
      }
      
      // 开始写入
      final tag = await FlutterNfcKit.poll(
        timeout: timeout,
        iosMultipleTagMessage: "发现多个标签！请移除所有标签，然后重试。",
        iosAlertMessage: "将设备靠近要写入的NFC标签",
      );
      
      await FlutterNfcKit.setIosAlertMessage("正在写入...");
      
      // 检查标签是否支持NDEF
      if (tag.ndefAvailable != true) {
        throw Exception('NFC标签不支持NDEF格式');
      }
      
      // 将字符串转换为十六进制格式
      final dataBytes = data.codeUnits;
      final hexData = dataBytes.map((byte) => byte.toRadixString(16).padLeft(2, '0')).join('');
      
      // 写入NDEF记录
      await FlutterNfcKit.writeNDEFRawRecords([
        NDEFRawRecord(
          "",                     // id字段使用空字符串
          hexData,                // payload使用十六进制字符串
          "T",                    // type字段使用字符串
          TypeNameFormat.nfcWellKnown,
        )
      ]);
      
      await FlutterNfcKit.finish();
      return true;
      
    } catch (e) {
      // 确保NFC会话被正确关闭
      try {
        await FlutterNfcKit.finish();
      } catch (_) {
        // 忽略关闭时的错误
      }
      
      // 检查是否是activity相关的错误
      if (e.toString().contains('not attached to activity') || 
          e.toString().contains('Activity')) {
        throw Exception('NFC操作失败：应用状态异常，请重新打开应用后重试');
      }
      
      throw Exception('NFC写入失败: $e');
    }
  }
}

/// NFC扫描结果
class NFCScanResult {
  final bool isSuccess;
  final String? errorMessage;
  final String? nfcData;
  final String? decryptedData;
  final RecordModel? student;
  final bool isEncrypted;
  final bool isSecurityBlocked;
  final String? securityReason;
  
  NFCScanResult._({
    required this.isSuccess,
    this.errorMessage,
    this.nfcData,
    this.decryptedData,
    this.student,
    this.isEncrypted = false,
    this.isSecurityBlocked = false,
    this.securityReason,
  });
  
  factory NFCScanResult.success({
    required String nfcData,
    required String decryptedData,
    RecordModel? student,
    bool isEncrypted = false,
  }) {
    return NFCScanResult._(
      isSuccess: true,
      nfcData: nfcData,
      decryptedData: decryptedData,
      student: student,
      isEncrypted: isEncrypted,
    );
  }
  
  factory NFCScanResult.error(String message) {
    return NFCScanResult._(
      isSuccess: false,
      errorMessage: message,
    );
  }
  
  factory NFCScanResult.securityBlocked(String reason) {
    return NFCScanResult._(
      isSuccess: false,
      isSecurityBlocked: true,
      securityReason: reason,
      errorMessage: reason,
    );
  }
}

/// 安全检查结果
class SecurityCheckResult {
  final bool isAllowed;
  final String? reason;
  
  SecurityCheckResult._({
    required this.isAllowed,
    this.reason,
  });
  
  factory SecurityCheckResult.allowed() {
    return SecurityCheckResult._(isAllowed: true);
  }
  
  factory SecurityCheckResult.blocked(String reason) {
    return SecurityCheckResult._(isAllowed: false, reason: reason);
  }
}
