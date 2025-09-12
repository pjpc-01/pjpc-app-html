import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:pocketbase/pocketbase.dart';
import 'dart:convert';
import '../../services/pocketbase_service.dart';
import '../../services/app_state_manager.dart';
import '../../services/ultra_simple_nfc_scanner.dart';

/// NFC问题诊断工具
class NFCDiagnosticTool extends StatefulWidget {
  const NFCDiagnosticTool({super.key});

  @override
  State<NFCDiagnosticTool> createState() => _NFCDiagnosticToolState();
}

class _NFCDiagnosticToolState extends State<NFCDiagnosticTool> {
  List<String> _logs = [];
  bool _isScanning = false;
  
  void _addLog(String message) {
    setState(() {
      _logs.insert(0, '${DateTime.now().toString().substring(11, 19)} - $message');
      if (_logs.length > 20) {
        _logs.removeLast();
      }
    });
    print('🔍 NFC诊断: $message');
  }
  
  /// 测试NFC可用性
  Future<void> _testNfcAvailability() async {
    try {
      _addLog('开始测试NFC可用性...');
      final availability = await FlutterNfcKit.nfcAvailability;
      _addLog('NFC可用性: $availability');
      
      if (availability == NFCAvailability.available) {
        _addLog('✅ NFC可用');
      } else {
        _addLog('❌ NFC不可用: $availability');
      }
    } catch (e) {
      _addLog('❌ NFC可用性测试失败: $e');
    }
  }
  
  /// 超简单NFC扫描测试（完全避免复杂处理）
  Future<void> _testUltraSimpleScan() async {
    if (_isScanning) return;
    
    setState(() {
      _isScanning = true;
    });
    
    try {
      _addLog('开始超简单NFC扫描测试...');
      
      // 使用超简单扫描服务
      final result = await UltraSimpleNFCScanner.instance.ultraSimpleScan(
        timeout: const Duration(seconds: 8),
      );
      
      if (result.isSuccess) {
        _addLog('✅ 超简单扫描成功: ${result.nfcData}');
        
        // 尝试查找学生
        await _testUltraSimpleStudentLookup(result.nfcData!);
      } else {
        _addLog('❌ 超简单扫描失败: ${result.errorMessage}');
      }
      
    } catch (e) {
      _addLog('❌ 超简单扫描异常: $e');
    } finally {
      setState(() {
        _isScanning = false;
      });
    }
  }
  
  /// 超简单学生查找测试
  Future<void> _testUltraSimpleStudentLookup(String nfcData) async {
    try {
      _addLog('开始超简单学生查找: $nfcData');
      
      final student = await UltraSimpleNFCScanner.instance.ultraSimpleFindStudent(nfcData);
      
      if (student != null) {
        _addLog('✅ 找到学生: ${student.getStringValue('student_name')}');
        _addLog('学号: ${student.getStringValue('student_id')}');
        _addLog('班级: ${student.getStringValue('standard')}');
      } else {
        _addLog('❌ 未找到对应的学生');
      }
      
    } catch (e) {
      _addLog('❌ 超简单学生查找失败: $e');
    }
  }
  
  /// 简单NFC扫描测试（无加密）
  Future<void> _testSimpleScan() async {
    if (_isScanning) return;
    
    setState(() {
      _isScanning = true;
    });
    
    try {
      _addLog('开始简单NFC扫描测试...');
      
      // 使用应用状态管理
      AppStateManager.instance.startNfcOperation();
      _addLog('🔒 应用状态管理已激活');
      
      // 检查NFC可用性
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability != NFCAvailability.available) {
        _addLog('❌ NFC不可用，停止测试');
        return;
      }
      
      _addLog('开始NFC轮询...');
      
      // 开始扫描
      final tag = await FlutterNfcKit.poll(
        timeout: const Duration(seconds: 10),
        iosMultipleTagMessage: "发现多个标签！请移除所有标签，然后重试。",
        iosAlertMessage: "将设备靠近NFC标签"
      );
      
      _addLog('NFC标签检测成功');
      
      await FlutterNfcKit.setIosAlertMessage("正在读取...");
      
      // 读取NFC数据
      String? nfcData;
      if (tag.ndefAvailable ?? false) {
        _addLog('开始读取NDEF记录...');
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
                    _addLog('读取到NDEF文本: $content');
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
                      _addLog('读取到NDEF文本(hex): $content');
                      break;
                    }
                  }
                } catch (e) {
                  _addLog('解析十六进制payload失败: $e');
                }
              }
            }
          }
        }
      }
      
      await FlutterNfcKit.finish();
      _addLog('NFC会话已关闭');
      
      if (nfcData == null || nfcData.isEmpty) {
        _addLog('❌ NFC卡中没有找到有效数据');
      } else {
        _addLog('✅ NFC扫描成功: $nfcData');
        
        // 尝试查找学生
        await _testStudentLookup(nfcData);
      }
      
    } catch (e) {
      _addLog('❌ NFC扫描失败: $e');
      
      // 确保NFC会话被正确关闭
      try {
        await FlutterNfcKit.finish();
        _addLog('NFC会话已强制关闭');
      } catch (_) {
        _addLog('NFC会话关闭失败');
      }
    } finally {
      AppStateManager.instance.endNfcOperation();
      _addLog('🔓 应用状态管理已释放');
      
      setState(() {
        _isScanning = false;
      });
    }
  }
  
  /// 测试学生查找
  Future<void> _testStudentLookup(String nfcData) async {
    try {
      _addLog('开始查找学生: $nfcData');
      
      RecordModel? student;
      if (nfcData.startsWith('http') || nfcData.contains('docs.google.com')) {
        // URL格式
        student = await PocketBaseService.instance.getStudentByNfcUrl(nfcData);
        _addLog('通过URL查找学生');
      } else {
        // 学生ID格式
        student = await PocketBaseService.instance.getStudentByStudentId(nfcData);
        _addLog('通过学生ID查找学生');
      }
      
      if (student != null) {
        _addLog('✅ 找到学生: ${student.getStringValue('student_name')}');
        _addLog('学号: ${student.getStringValue('student_id')}');
        _addLog('班级: ${student.getStringValue('standard')}');
      } else {
        _addLog('❌ 未找到对应的学生');
      }
      
    } catch (e) {
      _addLog('❌ 学生查找失败: $e');
    }
  }
  
  /// 清除日志
  void _clearLogs() {
    setState(() {
      _logs.clear();
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('NFC诊断工具'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // 控制按钮
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _testNfcAvailability,
                        icon: const Icon(Icons.nfc),
                        label: const Text('测试NFC可用性'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _isScanning ? null : _testUltraSimpleScan,
                        icon: Icon(_isScanning ? Icons.stop : Icons.play_arrow),
                        label: Text(_isScanning ? '扫描中...' : '超简单扫描'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isScanning ? Colors.grey : Colors.blue,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _clearLogs,
                        icon: const Icon(Icons.clear),
                        label: const Text('清除日志'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                        },
                        icon: const Icon(Icons.arrow_back),
                        label: const Text('返回'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.grey,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // 日志显示
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '诊断日志:',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: _logs.isEmpty
                        ? const Text(
                            '暂无日志',
                            style: TextStyle(color: Colors.grey),
                          )
                        : ListView.builder(
                            itemCount: _logs.length,
                            itemBuilder: (context, index) {
                              final log = _logs[index];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Text(
                                  log,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
