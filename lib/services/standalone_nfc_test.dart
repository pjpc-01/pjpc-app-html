import 'dart:async';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';

/// 完全独立的NFC测试 - 不依赖任何其他服务
class StandaloneNFCTest {
  static final StandaloneNFCTest _instance = StandaloneNFCTest._internal();
  factory StandaloneNFCTest() => _instance;
  StandaloneNFCTest._internal();
  
  static StandaloneNFCTest get instance => _instance;
  
  /// 完全独立的NFC测试
  Future<StandaloneResult> standaloneTest() async {
    try {
      print('🔍 开始完全独立NFC测试...');
      
      // 1. 检查NFC可用性
      print('📱 检查NFC可用性...');
      final availability = await FlutterNfcKit.nfcAvailability;
      print('📱 NFC可用性: $availability');
      
      if (availability != NFCAvailability.available) {
        return StandaloneResult.error('NFC不可用: $availability');
      }
      
      print('✅ NFC可用，开始扫描...');
      
      // 2. 开始扫描
      print('📡 开始NFC轮询（10秒超时）...');
      final tag = await FlutterNfcKit.poll(
        timeout: const Duration(seconds: 10), // 更长超时
        iosMultipleTagMessage: "发现多个标签！请移除所有标签，然后重试。",
        iosAlertMessage: "将设备靠近NFC标签"
      );
      
      print('📱 NFC标签检测成功');
      
      // 3. 读取NFC数据
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
      
      // 4. 立即关闭NFC会话
      print('🔒 关闭NFC会话...');
      await FlutterNfcKit.finish();
      print('✅ NFC会话已关闭');
      
      // 5. 添加缓冲时间
      print('⏳ 等待1.5秒缓冲时间...');
      await Future.delayed(const Duration(milliseconds: 1500));
      print('✅ 缓冲时间结束');
      
      if (nfcData == null || nfcData.isEmpty) {
        return StandaloneResult.error('NFC卡中没有找到有效数据');
      }
      
      print('✅ 完全独立测试成功: $nfcData');
      return StandaloneResult.success(nfcData);
      
    } catch (e) {
      print('❌ 完全独立测试失败: $e');
      
      // 确保NFC会话被正确关闭
      try {
        await FlutterNfcKit.finish();
        print('🔒 NFC会话已强制关闭');
      } catch (_) {
        print('⚠️ NFC会话关闭失败');
      }
      
      return StandaloneResult.error('测试失败: $e');
    }
  }
}

/// 独立测试结果
class StandaloneResult {
  final bool isSuccess;
  final String? errorMessage;
  final String? nfcData;
  
  StandaloneResult._({
    required this.isSuccess,
    this.errorMessage,
    this.nfcData,
  });
  
  factory StandaloneResult.success(String nfcData) {
    return StandaloneResult._(
      isSuccess: true,
      nfcData: nfcData,
    );
  }
  
  factory StandaloneResult.error(String message) {
    return StandaloneResult._(
      isSuccess: false,
      errorMessage: message,
    );
  }
}
