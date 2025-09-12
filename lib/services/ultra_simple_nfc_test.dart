import 'dart:async';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';

/// 超简单NFC测试 - 使用不同的方法
class UltraSimpleNFCTest {
  static final UltraSimpleNFCTest _instance = UltraSimpleNFCTest._internal();
  factory UltraSimpleNFCTest() => _instance;
  UltraSimpleNFCTest._internal();
  
  static UltraSimpleNFCTest get instance => _instance;
  
  /// 超简单NFC测试 - 不使用poll，直接检查标签
  Future<UltraSimpleResult> ultraSimpleTest() async {
    try {
      print('🔬 开始超简单NFC测试...');
      
      // 1. 检查NFC可用性
      print('📱 检查NFC可用性...');
      final availability = await FlutterNfcKit.nfcAvailability;
      print('📱 NFC可用性: $availability');
      
      if (availability != NFCAvailability.available) {
        return UltraSimpleResult.error('NFC不可用: $availability');
      }
      
      print('✅ NFC可用，开始简单扫描...');
      
      // 2. 使用更长的超时时间
      print('📡 开始NFC轮询（10秒超时）...');
      final tag = await FlutterNfcKit.poll(
        timeout: const Duration(seconds: 10), // 更长超时
        iosMultipleTagMessage: "发现多个标签！",
        iosAlertMessage: "将设备靠近NFC标签"
      );
      
      print('📱 NFC标签检测成功: ${tag.type}');
      
      // 3. 立即关闭NFC会话，不读取数据
      print('🔒 立即关闭NFC会话...');
      await FlutterNfcKit.finish();
      print('✅ NFC会话已关闭');
      
      // 4. 添加缓冲时间
      print('⏳ 等待1.5秒缓冲时间...');
      await Future.delayed(const Duration(milliseconds: 1500));
      print('✅ 缓冲时间结束');
      
      print('✅ 超简单测试成功');
      return UltraSimpleResult.success('NFC标签检测成功: ${tag.type}');
      
    } catch (e) {
      print('❌ 超简单测试失败: $e');
      
      // 确保NFC会话被正确关闭
      try {
        await FlutterNfcKit.finish();
        print('🔒 NFC会话已强制关闭');
      } catch (_) {
        print('⚠️ NFC会话关闭失败');
      }
      
      return UltraSimpleResult.error('测试失败: $e');
    }
  }
  
  /// 只检查NFC可用性，不进行扫描
  Future<UltraSimpleResult> availabilityOnlyTest() async {
    try {
      print('🔍 开始NFC可用性测试...');
      
      final availability = await FlutterNfcKit.nfcAvailability;
      print('📱 NFC可用性: $availability');
      
      if (availability == NFCAvailability.available) {
        return UltraSimpleResult.success('NFC可用');
      } else {
        return UltraSimpleResult.error('NFC不可用: $availability');
      }
      
    } catch (e) {
      print('❌ NFC可用性测试失败: $e');
      return UltraSimpleResult.error('可用性测试失败: $e');
    }
  }
}

/// 超简单测试结果
class UltraSimpleResult {
  final bool isSuccess;
  final String? errorMessage;
  final String? result;
  
  UltraSimpleResult._({
    required this.isSuccess,
    this.errorMessage,
    this.result,
  });
  
  factory UltraSimpleResult.success(String result) {
    return UltraSimpleResult._(
      isSuccess: true,
      result: result,
    );
  }
  
  factory UltraSimpleResult.error(String message) {
    return UltraSimpleResult._(
      isSuccess: false,
      errorMessage: message,
    );
  }
}
