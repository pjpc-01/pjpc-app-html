import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/encryption_service.dart';
import '../../services/pocketbase_service.dart';
import '../../theme/app_theme.dart';

class NFCDebugTool extends StatefulWidget {
  const NFCDebugTool({super.key});

  @override
  State<NFCDebugTool> createState() => _NFCDebugToolState();
}

class _NFCDebugToolState extends State<NFCDebugTool> {
  final _encryptionService = EncryptionService();
  String _debugInfo = '';
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('NFC调试工具'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ElevatedButton(
              onPressed: _checkEncryptionKeys,
              child: const Text('检查加密密钥状态'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _testEncryptionDecryption,
              child: const Text('测试加密/解密'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _checkPocketBaseKeys,
              child: const Text('检查PocketBase密钥集合'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _forceResetKeys,
              style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
              child: const Text('强制重置为内置密钥'),
            ),
            const SizedBox(height: 16),
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else
              Expanded(
                child: SingleChildScrollView(
                  child: Text(
                    _debugInfo,
                    style: const TextStyle(fontFamily: 'monospace'),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _checkEncryptionKeys() async {
    setState(() {
      _isLoading = true;
      _debugInfo = '正在检查加密密钥...\n';
    });

    try {
      await _encryptionService.ensureKeysLoaded();
      _encryptionService.logAvailableVersions();
      
      setState(() {
        _debugInfo += '✅ 密钥加载完成\n';
      });
    } catch (e) {
      setState(() {
        _debugInfo += '❌ 密钥加载失败: $e\n';
      });
    }

    setState(() {
      _isLoading = false;
    });
  }

  Future<void> _testEncryptionDecryption() async {
    setState(() {
      _isLoading = true;
      _debugInfo += '\n=== 测试加密/解密 ===\n';
    });

    try {
      // 测试数据
      const testData = 'TCH001_ABC12345';
      final salt = _encryptionService.generateSalt();
      
      setState(() {
        _debugInfo += '原始数据: $testData\n';
        _debugInfo += '盐值: $salt\n';
      });

      // 加密
      final encrypted = _encryptionService.encryptNFCData(testData, salt);
      setState(() {
        _debugInfo += '加密后: $encrypted\n';
      });

      // 解密
      final decrypted = _encryptionService.decryptNFCData(encrypted, salt);
      setState(() {
        _debugInfo += '解密后: $decrypted\n';
        _debugInfo += '匹配: ${testData == decrypted ? '✅' : '❌'}\n';
      });

    } catch (e) {
      setState(() {
        _debugInfo += '❌ 测试失败: $e\n';
      });
    }

    setState(() {
      _isLoading = false;
    });
  }

  Future<void> _checkPocketBaseKeys() async {
    setState(() {
      _isLoading = true;
      _debugInfo += '\n=== 检查PocketBase密钥集合 ===\n';
    });

    try {
      final pb = PocketBaseService.instance.pb;
      final result = await pb.collection('encryption_keys').getList(perPage: 50);
      
      setState(() {
        _debugInfo += '找到 ${result.items.length} 条密钥记录\n';
      });

      for (final item in result.items) {
        final version = item.getIntValue('version');
        final key = item.getStringValue('master_key');
        final status = item.getStringValue('status');
        final algorithm = item.getStringValue('algorithm');
        
        setState(() {
          _debugInfo += '版本: $version, 状态: $status, 算法: $algorithm\n';
          _debugInfo += '密钥: ${key?.substring(0, 10)}...\n';
        });
      }

    } catch (e) {
      setState(() {
        _debugInfo += '❌ 检查失败: $e\n';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _forceResetKeys() async {
    setState(() {
      _isLoading = true;
      _debugInfo += '\n=== 强制重置密钥 ===\n';
    });

    try {
      _encryptionService.forceResetToBuiltinKeys();
      setState(() {
        _debugInfo += '✅ 已强制重置为内置密钥\n';
      });
      
      // 重新测试加密/解密
      await _testEncryptionDecryption();
      
    } catch (e) {
      setState(() {
        _debugInfo += '❌ 重置失败: $e\n';
      });
    }

    setState(() {
      _isLoading = false;
    });
  }

}