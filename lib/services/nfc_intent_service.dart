import 'package:flutter/material.dart';
import 'package:nfc_manager/nfc_manager.dart';

/// NFC Intent处理服务
/// 专门处理应用启动时的NFC intent，阻止浏览器打开
class NFCIntentService {
  static final NFCIntentService _instance = NFCIntentService._internal();
  factory NFCIntentService() => _instance;
  NFCIntentService._internal();

  bool _isProcessing = false;
  Function(String)? _onUrlDetected;
  Function(String)? _onCardDetected;

  /// 初始化NFC Intent处理
  Future<void> initialize({
    Function(String)? onUrlDetected,
    Function(String)? onCardDetected,
  }) async {
    _onUrlDetected = onUrlDetected;
    _onCardDetected = onCardDetected;

    try {
      // 检查NFC是否可用
      final isAvailable = await NfcManager.instance.isAvailable();
      if (!isAvailable) {
        print('❌ NFC不可用，无法初始化Intent服务');
        return;
      }
      
      print('🔗 NFC Intent Service已初始化');
      
      // 尝试处理应用启动时的NFC数据
      await _handleInitialNfcData();
    } catch (e) {
      print('❌ NFC Intent Service初始化失败: $e');
    }
  }
  
  /// 处理应用启动时的NFC数据
  Future<void> _handleInitialNfcData() async {
    try {
      // 注意：getInitialTag() 方法在当前版本的nfc_manager中不存在
      // 但我们可以尝试其他方法来检测启动时的NFC数据
      print('🔍 检查应用启动时的NFC数据...');
      
      // 这里可以添加更多的启动时NFC检测逻辑
      // 目前主要依赖扫描时的处理
    } catch (e) {
      print('❌ 处理启动时NFC数据失败: $e');
    }
  }

  /// 处理NFC标签
  Future<void> _processNfcTag(NfcTag tag) async {
    try {
      print('🔍 NFC Intent Service处理标签...');
      
      // 立即停止任何可能的系统默认行为
      await NfcManager.instance.stopSession();
      
      // 获取URL数据
      final urlData = _getNfcUrlData(tag);
      final cardId = _getNfcTagId(tag);
      
      print('📱 NFC Intent Service结果 - URL: $urlData, CardID: $cardId');
      
      if (urlData != null) {
        _onUrlDetected?.call(urlData);
      } else if (cardId.isNotEmpty) {
        _onCardDetected?.call(cardId);
      }
    } catch (e) {
      print('❌ NFC Intent Service处理失败: $e');
    }
  }

  /// 获取NFC URL数据
  String? _getNfcUrlData(NfcTag tag) {
    try {
      print('🔍 NFC Intent Service开始解析NFC标签数据...');
      print('🔍 标签类型: ${tag.runtimeType}');
      
      // 尝试不同的数据访问方式
      dynamic data;
      try {
        if (tag.data is Map<String, dynamic>) {
          data = tag.data as Map<String, dynamic>;
          print('🔍 使用Map方式访问数据');
        } else {
          // 尝试直接访问属性
          data = {
            'ndef': (tag.data as dynamic)['ndef'],
            'type': (tag.data as dynamic)['type'],
            'id': (tag.data as dynamic)['id'],
          };
          print('🔍 使用属性方式访问数据');
        }
      } catch (e) {
        print('❌ 无法访问标签数据: $e');
        return null;
      }
      
      print('🔍 标签数据: $data');
      
      // 检查NDEF数据
      if (data['ndef'] != null) {
        final ndef = data['ndef'];
        print('🔍 NDEF数据: $ndef');
        
        if (ndef is Map<String, dynamic>) {
          final records = ndef['records'] as List<dynamic>?;
          print('🔍 NDEF记录数量: ${records?.length ?? 0}');
          
          if (records != null) {
            for (int i = 0; i < records.length; i++) {
              final record = records[i];
              print('🔍 记录 $i: $record');
              
              if (record is Map<String, dynamic>) {
                final type = record['type'] as List<int>?;
                final payload = record['payload'] as List<int>?;
                
                print('🔍 记录类型: $type');
                print('🔍 记录载荷: $payload');
                
                if (type != null && payload != null) {
                  final typeString = String.fromCharCodes(type);
                  print('🔍 类型字符串: $typeString');
                  
                  if (typeString == 'U' || typeString == 'urn:nfc:wkt:U') {
                    final urlBytes = payload;
                    if (urlBytes.isNotEmpty) {
                      // 跳过第一个字节（URL前缀标识符）
                      final urlString = String.fromCharCodes(urlBytes.skip(1));
                      print('🔗 NFC Intent Service检测到URL: $urlString');
                      return urlString;
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      // 尝试其他可能的URL存储方式
      if (data is Map<String, dynamic>) {
        // 检查是否有直接的URL字段
        for (final key in data.keys) {
          final value = data[key];
          if (value is String && value.startsWith('http')) {
            print('🔗 在字段 $key 中找到URL: $value');
            return value;
          }
        }
      }
      
      print('❌ 未找到有效的URL数据');
      return null;
    } catch (e) {
      print('❌ NFC Intent Service解析URL失败: $e');
      print('❌ 错误类型: ${e.runtimeType}');
      return null;
    }
  }

  /// 获取NFC标签ID
  String _getNfcTagId(NfcTag tag) {
    try {
      // 尝试不同的数据访问方式
      if (tag.data is Map<String, dynamic>) {
        final data = tag.data as Map<String, dynamic>;
        
        if (data['nfca'] != null) {
          final nfca = data['nfca'] as Map<String, dynamic>;
          final identifier = nfca['identifier'] as List<int>?;
          if (identifier != null) {
            return identifier.map((e) => e.toRadixString(16).padLeft(2, '0')).join(':').toUpperCase();
          }
        }
      } else {
        // 尝试直接访问ID属性
        try {
          return (tag.data as dynamic)['id']?.toString() ?? 'Unknown';
        } catch (e) {
          print('❌ 无法访问标签ID: $e');
        }
      }
      
      return 'Unknown';
    } catch (e) {
      print('❌ NFC Intent Service获取标签ID失败: $e');
      return 'Unknown';
    }
  }

  /// 重置处理状态
  void reset() {
    _isProcessing = false;
  }
}
