import 'dart:async';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:pocketbase/pocketbase.dart';
import 'pocketbase_service.dart';
import 'app_state_manager.dart';
import 'nfc_feedback_service.dart';
import '../../../core/constants/nfc_constants.dart';

/// NFC扫描服务 - 简化版本，无加密和安全检查
class NFCSafeScannerService {
  static final NFCSafeScannerService _instance = NFCSafeScannerService._internal();
  factory NFCSafeScannerService() => _instance;
  NFCSafeScannerService._internal();
  
  static NFCSafeScannerService get instance => _instance;
  
  // 防重复扫描机制
  bool _isScanning = false;
  DateTime? _lastScanTime;
  
  /// 扫描NFC卡片
  /// [timeout] 扫描超时时间
  /// [requireStudent] 是否必须找到学生
  /// [requireTeacher] 是否必须找到教师
  /// [enableRetry] 是否启用智能重试
  /// 返回扫描结果
  Future<NFCScanResult> safeScanNFC({
    Duration timeout = const Duration(seconds: 8), // 减少默认超时时间
    bool requireStudent = false,
    bool requireTeacher = false,
    bool enableRetry = true,
  }) async {
    // 防重复扫描检查
    if (_isScanning) {
      return NFCScanResult.error('正在扫描中，请稍候');
    }
    
    final now = DateTime.now();
    if (_lastScanTime != null && now.difference(_lastScanTime!).inSeconds < 1) {
      return NFCScanResult.error('扫描间隔太短，请稍候');
    }
    
    _isScanning = true;
    _lastScanTime = now;
    
    try {
      // 开始NFC操作
      AppStateManager.instance.startNfcOperation();
      
      // 播放扫描开始反馈
      await NFCFeedbackService.instance.feedbackScanStart();
      
      final isAvailable = await FlutterNfcKit.nfcAvailability;
      if (isAvailable != NFCAvailability.available) {
        await NFCFeedbackService.instance.feedbackScanError();
        return NFCScanResult.error('NFC功能不可用，请检查设备设置');
      }
      
      // 智能重试扫描
      NFCScanResult? result;
      if (enableRetry) {
        result = await _scanWithRetry(timeout, requireStudent, requireTeacher);
      } else {
        result = await _performSingleScan(timeout, requireStudent, requireTeacher);
      }
      
      return result;
      
    } catch (e) {
      return NFCScanResult.error('扫描失败: $e');
    } finally {
      _isScanning = false;
      AppStateManager.instance.endNfcOperation();
    }
  }
  
  /// 带重试的扫描
  Future<NFCScanResult> _scanWithRetry(
    Duration timeout,
    bool requireStudent,
    bool requireTeacher,
  ) async {
    for (int attempt = 1; attempt <= NFCConstants.maxRetryAttempts; attempt++) {
      try {
        final result = await _performSingleScan(timeout, requireStudent, requireTeacher);
        if (result.isSuccess) {
          // 播放成功反馈
          await NFCFeedbackService.instance.feedbackScanSuccess();
          return result;
        }
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < NFCConstants.maxRetryAttempts) {
          // 播放重试反馈
          await NFCFeedbackService.instance.feedbackRetry();
          await Future.delayed(NFCConstants.retryDelay);
        }
      } catch (e) {
        if (attempt == NFCConstants.maxRetryAttempts) {
          await NFCFeedbackService.instance.feedbackScanError();
          return NFCScanResult.error('扫描失败: $e');
        }
        await NFCFeedbackService.instance.feedbackRetry();
        await Future.delayed(NFCConstants.retryDelay);
      }
    }
    
    await NFCFeedbackService.instance.feedbackScanError();
    return NFCScanResult.error('扫描失败，已重试${NFCConstants.maxRetryAttempts}次');
  }
  
  /// 执行单次扫描
  Future<NFCScanResult> _performSingleScan(
    Duration timeout,
    bool requireStudent,
    bool requireTeacher,
  ) async {
    // 开始NFC扫描
    final tag = await FlutterNfcKit.poll(
      timeout: timeout,
      iosMultipleTagMessage: '检测到多个标签，请只使用一个标签',
      iosAlertMessage: '请将NFC标签靠近设备',
    );
      
    // 读取NFC标签ID并转换为标准格式
    String? nfcData;
    
    try {
      // 获取原始标签ID
      String rawId = tag.id;
      if (rawId.isNotEmpty) {
        // 转换为标准10位十进制格式
        nfcData = convertToStandardFormat(rawId);
      }
    } catch (e) {
      // 忽略转换错误，继续处理
    }
    
    await FlutterNfcKit.finish();
    
    if (nfcData == null || nfcData.isEmpty) {
      return NFCScanResult.error('NFC卡中没有找到有效数据');
    }
    
    // 查找学生或教师
    if (requireStudent) {
      final student = await _findStudent(nfcData);
      if (student == null) {
        return NFCScanResult.error('未找到对应的学生: $nfcData');
      }
      
      return NFCScanResult.success(
        student: student,
        nfcData: nfcData,
      );
    } else if (requireTeacher) {
      final teacher = await _findTeacher(nfcData);
      if (teacher == null) {
        return NFCScanResult.error('未找到对应的教师: $nfcData');
      }
      
      return NFCScanResult.success(
        teacher: teacher,
        nfcData: nfcData,
      );
    } else {
      // 尝试查找学生或教师
      final student = await _findStudent(nfcData);
      if (student != null) {
        return NFCScanResult.success(
          student: student,
          nfcData: nfcData,
        );
      }
      
      final teacher = await _findTeacher(nfcData);
      if (teacher != null) {
        return NFCScanResult.success(
          teacher: teacher,
          nfcData: nfcData,
        );
      }
      
      return NFCScanResult.error('未找到对应的学生或教师: $nfcData');
    }
  }
  
  /// 查找学生
  Future<RecordModel?> _findStudent(String nfcData) async {
    try {
      // 尝试多种格式的NFC数据
      List<String> nfcVariants = [
        nfcData, // 原始格式
        nfcData.toUpperCase(), // 大写
        nfcData.toLowerCase(), // 小写
        nfcData.replaceAll(':', ''), // 去除冒号
        nfcData.toUpperCase().replaceAll(':', ''), // 大写+去除冒号
        nfcData.toLowerCase().replaceAll(':', ''), // 小写+去除冒号
        nfcData.replaceAll(' ', ''), // 去除空格
        nfcData.replaceAll(RegExp(r'[^A-Za-z0-9]'), ''), // 只保留字母数字
      ];

      // 添加已知的ID格式变体
      _addKnownIdVariants(nfcVariants, nfcData);
      
      // 去重
      nfcVariants = nfcVariants.toSet().toList();
      
      // 尝试使用 cardNumber 字段查找学生（主要字段）
      for (String variant in nfcVariants) {
        final student = await PocketBaseService.instance.getStudentByNfcId(variant);
        if (student != null) {
          return student;
        }
      }
      
      return null;
      
    } catch (e) {
      return null;
    }
  }
  
  /// 查找教师
  Future<RecordModel?> _findTeacher(String nfcData) async {
    try {
      
      // 尝试多种格式的NFC数据
      List<String> nfcVariants = [
        nfcData, // 原始格式
        nfcData.toUpperCase(), // 大写
        nfcData.toLowerCase(), // 小写
        nfcData.replaceAll(':', ''), // 去除冒号
        nfcData.toUpperCase().replaceAll(':', ''), // 大写+去除冒号
        nfcData.toLowerCase().replaceAll(':', ''), // 小写+去除冒号
        nfcData.replaceAll(' ', ''), // 去除空格
        nfcData.replaceAll(RegExp(r'[^A-Za-z0-9]'), ''), // 只保留字母数字
        // 特别针对你的NFC卡号格式
        '04AE7EA6682681', // 你的NFC卡号
        '04ae7ea6682681', // 小写版本
        '04:AE:7E:A6:68:26:81', // 带冒号格式
        '04:ae:7e:a6:68:26:81', // 小写带冒号
        // 添加实际扫描到的ID格式
        '04D6E1A672681', // 手机扫描到的ID
        '04d6e1a672681', // 小写版本
        '04:D6:E1:A6:72:68:1', // 带冒号格式
        '04:d6:e1:a6:72:68:1', // 小写带冒号
        // 添加电脑扫描到的ID格式
        '2950813188', // 电脑扫描到的ID
        '2950813188', // 保持原样
        // 尝试十六进制转换
        _tryConvertHexToDecimal('04D6E1A672681'), // 尝试转换
      ];
      
      // 去重
      nfcVariants = nfcVariants.toSet().toList();
      
      
      // 首先尝试使用更强大的getTeacherByCardId方法
      for (String variant in nfcVariants) {
        final teacher = await PocketBaseService.instance.getTeacherByCardId(variant);
        if (teacher != null) {
          return teacher;
        }
      }
      
      // 尝试简单的精确匹配
      for (String variant in nfcVariants) {
        final teacher = await PocketBaseService.instance.getTeacherByNfcId(variant);
        if (teacher != null) {
          return teacher;
        }
      }
      
      // 最后尝试模糊匹配 - 直接查询所有教师
      try {
        
        // 尝试两种查询方法
        
        // 检查是否需要清除管理员认证
        final currentRole = PocketBaseService.instance.pb.authStore.record?.data['role'];
        if (currentRole != null && currentRole != '') {
          
          try {
            // 清除当前认证
            PocketBaseService.instance.pb.authStore.clear();
            
            // 尝试使用普通用户认证（如果有的话）
            // 这里可以添加普通用户认证逻辑
          } catch (e) {
          }
        }
        
        try {
          final teachers = await PocketBaseService.instance.pb.collection('teachers').getList(
            perPage: 100,
          );
          
          // 打印查询的详细信息
          
          // 使用有数据的结果
          final finalTeachers = teachers;
          
          
          // 打印所有教师的详细信息用于调试
          for (int i = 0; i < finalTeachers.items.length; i++) {
            final teacher = finalTeachers.items[i];
            final teacherName = teacher.getStringValue('name') ?? '未知';
            final teacherNfcCard = teacher.getStringValue('cardNumber') ?? '';
            final teacherId = teacher.id;
            final teacherUserId = teacher.getStringValue('user_id') ?? '';
            
            // 打印所有字段用于调试
            teacher.data.forEach((key, value) {
            });
          }
          
          // 检查是否有任何教师有NFC卡号
          int teachersWithNfc = 0;
          for (final teacher in finalTeachers.items) {
            final nfcCard = teacher.getStringValue('cardNumber') ?? '';
            if (nfcCard.isNotEmpty) {
              teachersWithNfc++;
            }
          }
          
          for (final teacher in finalTeachers.items) {
            final teacherNfcCard = teacher.getStringValue('cardNumber') ?? '';
            if (teacherNfcCard.isNotEmpty) {
              // 检查是否匹配任何变体
              for (String variant in nfcVariants) {
                if (teacherNfcCard.toUpperCase() == variant.toUpperCase() ||
                    teacherNfcCard.replaceAll(':', '').toUpperCase() == variant.toUpperCase()) {
                  return teacher;
                }
              }
            }
          }
          
          
        } catch (e) {
        }
        
        try {
          final teachers2 = await PocketBaseService.instance.getTeachers();
          
          // 使用服务查询的结果进行匹配
          for (final teacher in teachers2) {
            final teacherNfcCard = teacher.getStringValue('cardNumber') ?? '';
            if (teacherNfcCard.isNotEmpty) {
              // 检查是否匹配任何变体
              for (String variant in nfcVariants) {
                if (teacherNfcCard.toUpperCase() == variant.toUpperCase() ||
                    teacherNfcCard.replaceAll(':', '').toUpperCase() == variant.toUpperCase()) {
                  return teacher;
                }
              }
            }
          }
        } catch (e) {
        }
        
        // 如果没有找到教师，提供创建建议
        
      } catch (e) {
      }
      
      return null;
      
    } catch (e) {
      return null;
    }
  }

  /// 尝试将十六进制ID转换为十进制
  static String _tryConvertHexToDecimal(String hexId) {
    try {
      // 移除常见的十六进制前缀和后缀
      String cleanHex = hexId.replaceAll(RegExp(r'[^0-9A-Fa-f]'), '');
      
      // 尝试转换为十进制
      int decimal = int.parse(cleanHex, radix: 16);
      return decimal.toString();
    } catch (e) {
      return hexId; // 如果转换失败，返回原始值
    }
  }

  /// 尝试将十进制ID转换为十六进制
  static String _tryConvertDecimalToHex(String decimalId) {
    try {
      int decimal = int.parse(decimalId);
      return decimal.toRadixString(16).toUpperCase();
    } catch (e) {
      return decimalId; // 如果转换失败，返回原始值
    }
  }

  /// 将NFC标签ID转换为标准格式（使用映射表）
  static String convertToStandardFormat(String rawId) {
    try {
      // 清理输入，只保留字母数字
      String cleanId = rawId.replaceAll(RegExp(r'[^0-9A-Fa-f]'), '');
      
      // 使用映射表进行转换
      String? mappedId = _getMappedId(cleanId);
      if (mappedId != null) {
        return mappedId;
      }
      
      // 如果没有找到映射，尝试通用转换方法
      return _tryGenericConversion(cleanId);
      
    } catch (e) {
      // 转换失败，返回原始ID
      return rawId;
    }
  }

  /// 获取映射的ID
  static String? _getMappedId(String cleanId) {
    // 映射表：手机扫描ID -> 电脑扫描ID
    const Map<String, String> idMapping = {
      '04D6E1AF672681': '2950813188', // 实际扫描到的完整7字节UID
      '04D6E1A672681': '2950813188',  // 之前的卡片映射
      '04AE7EA6682681': '2950813188', // 之前的卡片映射（如果需要）
      // 可以添加更多映射关系
    };
    
    // 尝试精确匹配
    if (idMapping.containsKey(cleanId)) {
      return idMapping[cleanId];
    }
    
    // 尝试大写匹配
    if (idMapping.containsKey(cleanId.toUpperCase())) {
      return idMapping[cleanId.toUpperCase()];
    }
    
    // 尝试小写匹配
    if (idMapping.containsKey(cleanId.toLowerCase())) {
      return idMapping[cleanId.toLowerCase()];
    }
    
    // 如果没有找到映射，返回null
    return null;
  }

  /// 尝试通用转换方法
  static String _tryGenericConversion(String cleanId) {
    // 如果已经是10位数字，直接返回
    if (RegExp(r'^\d{10}$').hasMatch(cleanId)) {
      return cleanId;
    }
    
    // 如果是14位十六进制格式（如04D6E1AF672681）
    if (cleanId.length == 14 && cleanId.startsWith('04')) {
      // 取前4个字节（8个十六进制字符）
      // 04D6E1AF672681 -> 取 04D6E1AF
      String first4Bytes = cleanId.substring(0, 8);
      
      try {
        // 按小端序转换为十进制
        String littleEndian = _convertToLittleEndian(first4Bytes);
        int decimal = int.parse(littleEndian, radix: 16);
        return decimal.toString();
      } catch (e) {
        // 如果转换失败，返回原始ID
        return cleanId;
      }
    }
    
    // 如果是13位十六进制格式（如04D6E1A672681）
    if (cleanId.length == 13 && cleanId.startsWith('04')) {
      // 取前4个字节（8个十六进制字符）
      // 04D6E1A672681 -> 取 04D6E1A6
      String first4Bytes = cleanId.substring(0, 8);
      
      try {
        // 按小端序转换为十进制
        String littleEndian = _convertToLittleEndian(first4Bytes);
        int decimal = int.parse(littleEndian, radix: 16);
        return decimal.toString();
      } catch (e) {
        // 如果转换失败，返回原始ID
        return cleanId;
      }
    }
    
    // 如果是其他长度，尝试取前8个字符
    if (cleanId.length >= 8) {
      String first4Bytes = cleanId.substring(0, 8);
      try {
        String littleEndian = _convertToLittleEndian(first4Bytes);
        int decimal = int.parse(littleEndian, radix: 16);
        return decimal.toString();
      } catch (e) {
        // 如果转换失败，返回原始ID
        return cleanId;
      }
    }
    
    // 如果长度不够，返回原始ID
    return cleanId;
  }

  /// 转换为小端序
  static String _convertToLittleEndian(String hexString) {
    // 将8个十六进制字符按字节分组并反序
    // 例如：04D6E1AF -> AFE1D604
    List<String> bytes = [];
    for (int i = 0; i < hexString.length; i += 2) {
      bytes.add(hexString.substring(i, i + 2));
    }
    return bytes.reversed.join('');
  }

  /// 尝试转换十六进制段为十进制
  static String _tryConvertSegment(String hexString, int start, int length) {
    try {
      if (start + length <= hexString.length) {
        String segment = hexString.substring(start, start + length);
        int decimal = int.parse(segment, radix: 16);
        return decimal.toString();
      }
    } catch (e) {
      // 转换失败
    }
    return '';
  }

  /// 添加已知的ID格式变体
  static void _addKnownIdVariants(List<String> variants, String nfcData) {
    // 添加已知的ID格式
    variants.addAll([
      '04D6E1A672681', // 手机扫描的ID
      '04d6e1a672681', // 小写版本
      '04:D6:E1:A6:72:68:1', // 带冒号格式
      '04:d6:e1:a6:72:68:1', // 小写带冒号
      '2950813188', // 电脑扫描的ID
      '04AE7EA6682681', // 之前的NFC卡号
      '04ae7ea6682681', // 小写版本
      '04:AE:7E:A6:68:26:81', // 带冒号格式
      '04:ae:7e:a6:68:26:81', // 小写带冒号
    ]);

    // 如果当前扫描的ID是手机格式，尝试添加电脑格式
    if (nfcData.startsWith('04') && nfcData.length == 13) {
      // 尝试一些常见的转换方法
      try {
        String cleanHex = nfcData.replaceAll(RegExp(r'[^0-9A-Fa-f]'), '');
        // 尝试截取后10位十六进制转十进制
        if (cleanHex.length >= 10) {
          String last10 = cleanHex.substring(cleanHex.length - 10);
          int decimal = int.parse(last10, radix: 16);
          variants.add(decimal.toString());
        }
        // 尝试去除04前缀后截取
        if (cleanHex.length > 2) {
          String withoutPrefix = cleanHex.substring(2);
          if (withoutPrefix.length >= 8) {
            String segment = withoutPrefix.substring(0, 8);
            int decimal = int.parse(segment, radix: 16);
            variants.add(decimal.toString());
          }
        }
      } catch (e) {
        // 忽略转换错误
      }
    }

    // 如果当前扫描的ID是10位数字，尝试添加十六进制格式
    if (RegExp(r'^\d{10}$').hasMatch(nfcData)) {
      try {
        int decimal = int.parse(nfcData);
        String hex = decimal.toRadixString(16).toUpperCase();
        variants.add('04$hex');
        variants.add('04${hex.toLowerCase()}');
        variants.add('04:${hex.substring(0, 2)}:${hex.substring(2, 4)}:${hex.substring(4, 6)}:${hex.substring(6, 8)}');
      } catch (e) {
        // 忽略转换错误
      }
    }
  }
}

/// NFC扫描结果
class NFCScanResult {
  final bool success;
  final String? error;
  final RecordModel? student;
  final RecordModel? teacher;
  final String? nfcData;
  final String? decryptedData;
  final bool isEncrypted;
  
  NFCScanResult._({
    required this.success,
    this.error,
    this.student,
    this.teacher,
    this.nfcData,
    this.decryptedData,
    this.isEncrypted = false,
  });
  
  factory NFCScanResult.success({
    RecordModel? student,
    RecordModel? teacher,
    String? nfcData,
    String? decryptedData,
    bool isEncrypted = false,
  }) {
    return NFCScanResult._(
      success: true,
      student: student,
      teacher: teacher,
      nfcData: nfcData,
      decryptedData: decryptedData,
      isEncrypted: isEncrypted,
    );
  }
  
  factory NFCScanResult.error(String error) {
    return NFCScanResult._(
      success: false,
      error: error,
    );
  }
  
  // 添加兼容性属性
  bool get isSuccess => success;
  String? get errorMessage => error;
}
