import 'dart:async';
import 'dart:math';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:ndef/record.dart';

/// NFC写入服务 - 统一处理所有NFC写入操作
class NFCWriteService {
  static final NFCWriteService _instance = NFCWriteService._internal();
  factory NFCWriteService() => _instance;
  NFCWriteService._internal();
  
  static NFCWriteService get instance => _instance;
  
  /// 写入文本数据到NFC卡
  Future<NFCWriteResult> writeText({
    required String text,
    Duration timeout = const Duration(seconds: 10),
  }) async {
    try {
      print('📝 开始写入文本数据: $text');
      
      // 检查NFC可用性
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability != NFCAvailability.available) {
        return NFCWriteResult.error('NFC不可用，请检查设备设置');
      }
      
      print('✅ NFC可用，开始写入...');
      
      // 开始扫描NFC卡
      final tag = await FlutterNfcKit.poll(
        timeout: timeout,
        iosMultipleTagMessage: "发现多个标签！请移除所有标签，然后重试。",
        iosAlertMessage: "将设备靠近NFC标签"
      );
      
      print('📱 NFC标签检测成功: ${tag.type}');
      
      // 检查标签是否支持NDEF
      if (tag.ndefAvailable != true) {
        await FlutterNfcKit.finish();
        return NFCWriteResult.error('NFC卡不支持NDEF格式');
      }
      
      // 使用原始NDEF记录格式写入
      await FlutterNfcKit.writeNDEFRawRecords([
        NDEFRawRecord(
          "",                     // id字段使用空字符串
          text,                   // payload直接使用字符串数据
          "T",                    // type字段使用字符串
          TypeNameFormat.nfcWellKnown,
        )
      ]);
      
      print('✅ NDEF记录写入成功');
      
      // 关闭NFC会话
      await FlutterNfcKit.finish();
      print('🔒 NFC会话已关闭');
      
      // 添加缓冲时间
      print('⏳ 等待1.5秒缓冲时间...');
      await Future.delayed(const Duration(milliseconds: 1500));
      print('✅ 缓冲时间结束');
      
      print('✅ 文本写入成功: $text');
      return NFCWriteResult.success('文本写入成功: $text');
      
    } catch (e) {
      print('❌ 文本写入失败: $e');
      
      // 确保NFC会话被正确关闭
      try {
        await FlutterNfcKit.finish();
        print('🔒 NFC会话已强制关闭');
      } catch (_) {
        print('⚠️ NFC会话关闭失败');
      }
      
      return NFCWriteResult.error('写入失败: $e');
    }
  }
  
  /// 写入学生ID到NFC卡（带加密）
  Future<NFCWriteResult> writeStudentId({
    required String studentId,
    Duration timeout = const Duration(seconds: 10),
  }) async {
    try {
      print('👨‍🎓 开始写入学生ID: $studentId');
      
      // 检查NFC可用性
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability != NFCAvailability.available) {
        return NFCWriteResult.error('NFC不可用，请检查设备设置');
      }
      
      print('✅ NFC可用，开始写入...');
      
      // 开始扫描NFC卡
      final tag = await FlutterNfcKit.poll(
        timeout: timeout,
        iosMultipleTagMessage: "发现多个标签！请移除所有标签，然后重试。",
        iosAlertMessage: "将设备靠近NFC标签"
      );
      
      print('📱 NFC标签检测成功: ${tag.type}');
      
      // 检查标签是否支持NDEF
      if (tag.ndefAvailable != true) {
        await FlutterNfcKit.finish();
        return NFCWriteResult.error('NFC卡不支持NDEF格式');
      }
      
      // 生成随机字符串
      final randomString = _generateRandomString(8);
      final combinedData = '${studentId}_$randomString';
      
      print('🔐 生成组合数据: $combinedData');
      
      // 使用原始NDEF记录格式写入学生ID+随机字符串
      await FlutterNfcKit.writeNDEFRawRecords([
        NDEFRawRecord(
          "",                     // id字段使用空字符串
          combinedData,           // payload使用学生ID+随机字符串
          "T",                    // type字段使用字符串
          TypeNameFormat.nfcWellKnown,
        )
      ]);
      
      print('✅ 学生ID记录写入成功');
      
      // 关闭NFC会话
      await FlutterNfcKit.finish();
      print('🔒 NFC会话已关闭');
      
      // 添加缓冲时间
      print('⏳ 等待1.5秒缓冲时间...');
      await Future.delayed(const Duration(milliseconds: 1500));
      print('✅ 缓冲时间结束');
      
      print('✅ 学生ID写入成功: $combinedData');
      return NFCWriteResult.success('学生ID写入成功: $combinedData');
      
    } catch (e) {
      print('❌ 学生ID写入失败: $e');
      
      // 确保NFC会话被正确关闭
      try {
        await FlutterNfcKit.finish();
        print('🔒 NFC会话已强制关闭');
      } catch (_) {
        print('⚠️ NFC会话关闭失败');
      }
      
      return NFCWriteResult.error('写入失败: $e');
    }
  }
  
  /// 生成随机字符串
  String _generateRandomString(int length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    final random = Random();
    return String.fromCharCodes(
      Iterable.generate(length, (_) => chars.codeUnitAt(random.nextInt(chars.length)))
    );
  }
  
}

/// NFC写入结果
class NFCWriteResult {
  final bool isSuccess;
  final String? errorMessage;
  final String? successMessage;
  
  NFCWriteResult._({
    required this.isSuccess,
    this.errorMessage,
    this.successMessage,
  });
  
  factory NFCWriteResult.success(String message) {
    return NFCWriteResult._(
      isSuccess: true,
      successMessage: message,
    );
  }
  
  factory NFCWriteResult.error(String message) {
    return NFCWriteResult._(
      isSuccess: false,
      errorMessage: message,
    );
  }
}