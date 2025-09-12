import 'dart:async';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:pocketbase/pocketbase.dart';
import 'pocketbase_service.dart';

/// 超简单NFC扫描服务 - 完全避免加密和复杂处理
class UltraSimpleNFCScanner {
  static final UltraSimpleNFCScanner _instance = UltraSimpleNFCScanner._internal();
  factory UltraSimpleNFCScanner() => _instance;
  UltraSimpleNFCScanner._internal();
  
  static UltraSimpleNFCScanner get instance => _instance;
  
  /// 超简单扫描 - 只读取原始数据
  Future<UltraSimpleResult> ultraSimpleScan({
    Duration timeout = const Duration(seconds: 8),
  }) async {
    try {
      print('🔍 开始超简单NFC扫描...');
      
      // 检查NFC可用性
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability != NFCAvailability.available) {
        return UltraSimpleResult.error('NFC不可用');
      }
      
      print('✅ NFC可用，开始扫描...');
      
      // 开始扫描
      final tag = await FlutterNfcKit.poll(
        timeout: timeout,
        iosMultipleTagMessage: "发现多个标签！请移除所有标签，然后重试。",
        iosAlertMessage: "将设备靠近NFC标签"
      );
      
      print('📱 NFC标签检测成功');
      
      // 读取NFC数据
      String? nfcData;
      if (tag.ndefAvailable ?? false) {
        print('📖 开始读取NDEF记录...');
        final records = await FlutterNfcKit.readNDEFRecords(cached: false);
        
        for (var record in records) {
          if (record.payload != null && record.payload!.isNotEmpty) {
            final content = String.fromCharCodes(record.payload!);
            if (content.isNotEmpty) {
              nfcData = content;
              print('📄 读取到NFC数据: $content');
              break;
            }
          }
        }
      }
      
      // 关闭NFC会话
      await FlutterNfcKit.finish();
      print('🔒 NFC会话已关闭');
      
      // 添加缓冲时间
      print('⏳ 等待1.5秒缓冲时间...');
      await Future.delayed(const Duration(milliseconds: 1500));
      print('✅ 缓冲时间结束');
      
      if (nfcData == null || nfcData.isEmpty) {
        return UltraSimpleResult.error('NFC卡中没有找到有效数据');
      }
      
      print('✅ 超简单扫描成功: $nfcData');
      return UltraSimpleResult.success(nfcData);
      
    } catch (e) {
      print('❌ 超简单扫描失败: $e');
      
      // 确保NFC会话被正确关闭
      try {
        await FlutterNfcKit.finish();
        print('🔒 NFC会话已强制关闭');
      } catch (_) {
        print('⚠️ NFC会话关闭失败');
      }
      
      return UltraSimpleResult.error('扫描失败: $e');
    }
  }
  
  /// 超简单学生查找
  Future<RecordModel?> ultraSimpleFindStudent(String nfcData) async {
    try {
      print('🔍 开始超简单学生查找: $nfcData');
      
      RecordModel? student;
      if (nfcData.startsWith('http') || nfcData.contains('docs.google.com')) {
        // URL格式
        student = await PocketBaseService.instance.getStudentByNfcUrl(nfcData);
        print('🌐 通过URL查找学生');
      } else {
        // 学生ID格式
        student = await PocketBaseService.instance.getStudentByStudentId(nfcData);
        print('🆔 通过学生ID查找学生');
      }
      
      if (student != null) {
        print('✅ 找到学生: ${student.getStringValue('student_name')}');
      } else {
        print('❌ 未找到对应的学生');
      }
      
      return student;
    } catch (e) {
      print('❌ 超简单学生查找失败: $e');
      return null;
    }
  }
}

/// 超简单结果
class UltraSimpleResult {
  final bool isSuccess;
  final String? errorMessage;
  final String? nfcData;
  
  UltraSimpleResult._({
    required this.isSuccess,
    this.errorMessage,
    this.nfcData,
  });
  
  factory UltraSimpleResult.success(String nfcData) {
    return UltraSimpleResult._(
      isSuccess: true,
      nfcData: nfcData,
    );
  }
  
  factory UltraSimpleResult.error(String message) {
    return UltraSimpleResult._(
      isSuccess: false,
      errorMessage: message,
    );
  }
}
