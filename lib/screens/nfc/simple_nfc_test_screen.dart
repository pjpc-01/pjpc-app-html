import 'package:flutter/material.dart';
import '../../services/standalone_nfc_test.dart';
import '../../services/ultra_simple_nfc_test.dart';
import '../../theme/app_theme.dart';

/// 最简单的NFC测试界面
class SimpleNFCTestScreen extends StatefulWidget {
  const SimpleNFCTestScreen({super.key});

  @override
  State<SimpleNFCTestScreen> createState() => _SimpleNFCTestScreenState();
}

class _SimpleNFCTestScreenState extends State<SimpleNFCTestScreen> {
  String _testResult = '准备测试';
  bool _isTesting = false;
  
  /// 执行完全独立的NFC测试
  Future<void> _runStandaloneTest() async {
    if (_isTesting) return;
    
    setState(() {
      _isTesting = true;
      _testResult = '正在测试...';
    });
    
    try {
      print('🚀 开始完全独立NFC测试...');
      
      final result = await StandaloneNFCTest.instance.standaloneTest();
      
      if (result.isSuccess) {
        setState(() {
          _testResult = '✅ 测试成功!\nNFC数据: ${result.nfcData}';
        });
        print('✅ 完全独立测试成功: ${result.nfcData}');
      } else {
        setState(() {
          _testResult = '❌ 测试失败: ${result.errorMessage}';
        });
        print('❌ 完全独立测试失败: ${result.errorMessage}');
      }
      
    } catch (e) {
      setState(() {
        _testResult = '❌ 测试异常: $e';
      });
      print('❌ 完全独立测试异常: $e');
    } finally {
      setState(() {
        _isTesting = false;
      });
    }
  }
  
  /// 执行超简单NFC测试
  Future<void> _runUltraSimpleTest() async {
    if (_isTesting) return;
    
    setState(() {
      _isTesting = true;
      _testResult = '正在超简单测试...';
    });
    
    try {
      print('🔬 开始超简单NFC测试...');
      
      final result = await UltraSimpleNFCTest.instance.ultraSimpleTest();
      
      if (result.isSuccess) {
        setState(() {
          _testResult = '✅ 超简单测试成功!\n结果: ${result.result}';
        });
        print('✅ 超简单测试成功: ${result.result}');
      } else {
        setState(() {
          _testResult = '❌ 超简单测试失败: ${result.errorMessage}';
        });
        print('❌ 超简单测试失败: ${result.errorMessage}');
      }
      
    } catch (e) {
      setState(() {
        _testResult = '❌ 超简单测试异常: $e';
      });
      print('❌ 超简单测试异常: $e');
    } finally {
      setState(() {
        _isTesting = false;
      });
    }
  }
  
  /// 只测试NFC可用性
  Future<void> _runAvailabilityTest() async {
    if (_isTesting) return;
    
    setState(() {
      _isTesting = true;
      _testResult = '正在检查NFC可用性...';
    });
    
    try {
      print('🔍 开始NFC可用性测试...');
      
      final result = await UltraSimpleNFCTest.instance.availabilityOnlyTest();
      
      if (result.isSuccess) {
        setState(() {
          _testResult = '✅ NFC可用性测试成功!\n结果: ${result.result}';
        });
        print('✅ NFC可用性测试成功: ${result.result}');
      } else {
        setState(() {
          _testResult = '❌ NFC可用性测试失败: ${result.errorMessage}';
        });
        print('❌ NFC可用性测试失败: ${result.errorMessage}');
      }
      
    } catch (e) {
      setState(() {
        _testResult = '❌ NFC可用性测试异常: $e';
      });
      print('❌ NFC可用性测试异常: $e');
    } finally {
      setState(() {
        _isTesting = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('NFC独立测试'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // 测试结果显示
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: Text(
                _testResult,
                style: const TextStyle(
                  fontSize: 16,
                  fontFamily: 'monospace',
                ),
                textAlign: TextAlign.center,
              ),
            ),
            
            const SizedBox(height: 40),
            
            // 测试按钮组
            Column(
              children: [
                // 可用性测试按钮
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: _isTesting ? null : _runAvailabilityTest,
                    icon: const Icon(Icons.check_circle),
                    label: const Text('NFC可用性测试'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 12),
                
                // 超简单测试按钮
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: _isTesting ? null : _runUltraSimpleTest,
                    icon: const Icon(Icons.science),
                    label: const Text('超简单NFC测试'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 12),
                
                // 完整测试按钮
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: _isTesting ? null : _runStandaloneTest,
                    icon: const Icon(Icons.nfc),
                    label: const Text('完整NFC测试'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 20),
            
            // 说明文字
            const Text(
              '请按顺序测试：\n1. 先测试NFC可用性\n2. 再测试超简单扫描\n3. 最后测试完整功能\n\n如果任何测试都重启应用，说明问题出在NFC库或Android配置',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
