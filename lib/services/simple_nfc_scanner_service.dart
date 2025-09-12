import 'dart:async';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:pocketbase/pocketbase.dart';
import 'dart:convert';
import 'pocketbase_service.dart';
import 'app_state_manager.dart';

/// 简化的NFC扫描服务 - 避免加密导致的问题
class SimpleNFCScannerService {
  static final SimpleNFCScannerService _instance = SimpleNFCScannerService._internal();
  factory SimpleNFCScannerService() => _instance;
  SimpleNFCScannerService._internal();
  
  static SimpleNFCScannerService get instance => _instance;
  
  /// 简单扫描NFC卡片（不进行加密处理）
  Future<SimpleNFCScanResult> simpleScanNFC({
    Duration timeout = const Duration(seconds: 10),
  }) async {
    return await NFCOperationWrapper.execute(() async {
      try {
        // 检查NFC可用性
        final availability = await FlutterNfcKit.nfcAvailability;
        if (availability != NFCAvailability.available) {
          return SimpleNFCScanResult.error('NFC不可用，请检查设备设置');
        }
        
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
        
        await FlutterNfcKit.finish();
        
        // 添加缓冲时间
        print('⏳ 等待1.5秒缓冲时间...');
        await Future.delayed(const Duration(milliseconds: 1500));
        print('✅ 缓冲时间结束');
        
        if (nfcData == null || nfcData.isEmpty) {
          return SimpleNFCScanResult.error('NFC卡中没有找到有效数据');
        }
        
        // 直接返回原始数据，不进行加密处理
        return SimpleNFCScanResult.success(nfcData: nfcData);
        
      } catch (e) {
        // 确保NFC会话被正确关闭
        try {
          await FlutterNfcKit.finish();
        } catch (_) {
          // 忽略关闭时的错误
        }
        
        return SimpleNFCScanResult.error('NFC扫描失败: $e');
      }
    }, timeout: timeout);
  }
  
  /// 根据NFC数据查找学生（不进行加密处理）
  Future<RecordModel?> findStudentByNfcData(String nfcData) async {
    try {
      // 直接使用原始数据查找学生
      if (nfcData.startsWith('http') || nfcData.contains('docs.google.com')) {
        // URL格式
        return await PocketBaseService.instance.getStudentByNfcUrl(nfcData);
      } else {
        // 学生ID格式
        return await PocketBaseService.instance.getStudentByStudentId(nfcData);
      }
    } catch (e) {
      print('查找学生失败: $e');
      return null;
    }
  }
}

/// 简单NFC扫描结果
class SimpleNFCScanResult {
  final bool isSuccess;
  final String? errorMessage;
  final String? nfcData;
  
  SimpleNFCScanResult._({
    required this.isSuccess,
    this.errorMessage,
    this.nfcData,
  });
  
  factory SimpleNFCScanResult.success({required String nfcData}) {
    return SimpleNFCScanResult._(
      isSuccess: true,
      nfcData: nfcData,
    );
  }
  
  factory SimpleNFCScanResult.error(String message) {
    return SimpleNFCScanResult._(
      isSuccess: false,
      errorMessage: message,
    );
  }
}
