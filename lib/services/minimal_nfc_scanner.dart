import 'dart:async';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:pocketbase/pocketbase.dart';
import 'dart:convert';
import 'pocketbase_service.dart';

/// 最简NFC扫描服务 - 完全避免复杂处理
class MinimalNFCScanner {
  static final MinimalNFCScanner _instance = MinimalNFCScanner._internal();
  factory MinimalNFCScanner() => _instance;
  MinimalNFCScanner._internal();
  
  static MinimalNFCScanner get instance => _instance;
  
  /// 最简扫描 - 只读取原始数据，不进行任何复杂处理
  Future<MinimalResult> minimalScan({
    Duration timeout = const Duration(seconds: 5),
  }) async {
    try {
      print('🔍 开始最简NFC扫描...');
      
      // 检查NFC可用性
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability != NFCAvailability.available) {
        return MinimalResult.error('NFC不可用');
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
          if (record.payload != null) {
            // 处理NDEF Text记录
            if (record.payload is List<int>) {
              final payloadBytes = record.payload as List<int>;
              if (payloadBytes.isNotEmpty) {
                // 跳过状态字节和语言代码长度
                final statusByte = payloadBytes[0];
                final languageCodeLength = statusByte & 0x3F; // 取低6位
                
                if (payloadBytes.length > languageCodeLength + 1) {
                  // 提取文本内容
                  final textBytes = payloadBytes.sublist(1 + languageCodeLength);
                  final content = utf8.decode(textBytes);
                  if (content.isNotEmpty) {
                    nfcData = content;
                    print('📄 读取到NDEF文本: $content');
                    break;
                  }
                }
              }
            } else if (record.payload is String) {
              // 处理十六进制字符串
              final payloadHex = record.payload as String;
              if (payloadHex.isNotEmpty) {
                try {
                  final payloadBytes = List<int>.generate(
                    payloadHex.length ~/ 2,
                    (i) => int.parse(payloadHex.substring(i * 2, i * 2 + 2), radix: 16),
                  );
                  
                  // 跳过状态字节和语言代码长度
                  final statusByte = payloadBytes[0];
                  final languageCodeLength = statusByte & 0x3F;
                  
                  if (payloadBytes.length > languageCodeLength + 1) {
                    final textBytes = payloadBytes.sublist(1 + languageCodeLength);
                    final content = utf8.decode(textBytes);
                    if (content.isNotEmpty) {
                      nfcData = content;
                      print('📄 读取到NDEF文本(hex): $content');
                      break;
                    }
                  }
                } catch (e) {
                  print('解析十六进制payload失败: $e');
                }
              }
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
        return MinimalResult.error('NFC卡中没有找到有效数据');
      }
      
      print('✅ 最简扫描成功: $nfcData');
      return MinimalResult.success(nfcData);
      
    } catch (e) {
      print('❌ 最简扫描失败: $e');
      
      // 确保NFC会话被正确关闭
      try {
        await FlutterNfcKit.finish();
        print('🔒 NFC会话已强制关闭');
      } catch (_) {
        print('⚠️ NFC会话关闭失败');
      }
      
      return MinimalResult.error('扫描失败: $e');
    }
  }
  
  /// 最简学生查找 - 直接使用原始数据
  Future<RecordModel?> minimalFindStudent(String nfcData) async {
    try {
      print('🔍 开始最简学生查找: $nfcData');
      
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
      print('❌ 最简学生查找失败: $e');
      return null;
    }
  }
}

/// 最简结果
class MinimalResult {
  final bool isSuccess;
  final String? errorMessage;
  final String? nfcData;
  
  MinimalResult._({
    required this.isSuccess,
    this.errorMessage,
    this.nfcData,
  });
  
  factory MinimalResult.success(String nfcData) {
    return MinimalResult._(
      isSuccess: true,
      nfcData: nfcData,
    );
  }
  
  factory MinimalResult.error(String message) {
    return MinimalResult._(
      isSuccess: false,
      errorMessage: message,
    );
  }
}
