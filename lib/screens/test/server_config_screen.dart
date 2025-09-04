import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../services/pocketbase_service.dart';

class ServerConfigScreen extends StatefulWidget {
  const ServerConfigScreen({super.key});

  @override
  State<ServerConfigScreen> createState() => _ServerConfigScreenState();
}

class _ServerConfigScreenState extends State<ServerConfigScreen> {
  final TextEditingController _urlController = TextEditingController();
  String _testResult = '';
  bool _isTesting = false;

  final List<String> _commonUrls = [
    'https://pjpc.tplinkdns.com:8090',
    'http://pjpc.tplinkdns.com:8090',
    'https://175.143.212.118:8090',
    'http://175.143.212.118:8090',
    'https://pjpc.tplinkdns.com',
    'http://pjpc.tplinkdns.com',
    'https://175.143.212.118',
    'http://175.143.212.118',
  ];

  @override
  void initState() {
    super.initState();
    _urlController.text = 'https://pjpc.tplinkdns.com:8090';
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('服务器配置'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 服务器地址输入
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'PocketBase 服务器地址',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _urlController,
                      decoration: const InputDecoration(
                        labelText: '服务器URL',
                        hintText: 'https://your-server.com:8090',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _isTesting ? null : _testServer,
                            icon: _isTesting 
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Icon(Icons.network_check),
                            label: Text(_isTesting ? '测试中...' : '测试连接'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton.icon(
                          onPressed: _isTesting ? null : _saveServer,
                          icon: const Icon(Icons.save),
                          label: const Text('保存'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // 常见配置
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '常见配置（点击测试）',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _commonUrls.map((url) {
                        return ActionChip(
                          label: Text(url),
                          onPressed: () {
                            _urlController.text = url;
                            _testServer();
                          },
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // 测试结果
            if (_testResult.isNotEmpty) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '测试结果',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: Text(
                          _testResult,
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
            
            const SizedBox(height: 16),
            
            // 故障排除
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '故障排除指南',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      '1. 确认PocketBase服务器正在运行\n'
                      '2. 检查端口8090是否开放\n'
                      '3. 尝试HTTP和HTTPS两种协议\n'
                      '4. 检查防火墙设置\n'
                      '5. 联系服务器管理员确认服务状态\n'
                      '6. 如果使用域名，检查DNS解析\n'
                      '7. 如果使用IP，确保IP地址正确',
                      style: TextStyle(height: 1.5),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _testServer() async {
    setState(() {
      _isTesting = true;
      _testResult = '';
    });

    try {
      final url = _urlController.text.trim();
      if (url.isEmpty) {
        setState(() {
          _testResult = '请输入服务器地址';
        });
        return;
      }

      _testResult = '测试服务器: $url\n\n';
      
      // 创建临时PocketBase实例进行测试
      final testPb = PocketBase(url);
      
      try {
        // 测试基本连接
        _testResult += '1. 测试基本连接...\n';
        await testPb.collection('users').getList(page: 1, perPage: 1);
        _testResult += '✅ 基本连接成功\n\n';
        
        // 测试健康检查端点
        _testResult += '2. 测试健康检查...\n';
        try {
          await testPb.send('/api/health');
          _testResult += '✅ 健康检查成功\n\n';
        } catch (e) {
          _testResult += '⚠️ 健康检查失败: $e\n\n';
        }
        
        // 测试认证端点
        _testResult += '3. 测试认证端点...\n';
        try {
          await testPb.collection('users').authWithPassword('test@test.com', 'test');
          _testResult += '✅ 认证端点可访问\n\n';
        } catch (e) {
          if (e.toString().contains('Invalid login credentials')) {
            _testResult += '✅ 认证端点可访问（凭据无效是正常的）\n\n';
          } else {
            _testResult += '❌ 认证端点不可访问: $e\n\n';
          }
        }
        
        _testResult += '🎉 服务器连接测试完成！\n';
        _testResult += '这个服务器地址可以正常使用。';
        
      } catch (e) {
        _testResult += '❌ 连接失败: $e\n\n';
        _testResult += '请检查：\n';
        _testResult += '- 服务器是否正在运行\n';
        _testResult += '- 端口8090是否开放\n';
        _testResult += '- 网络连接是否正常\n';
        _testResult += '- 防火墙设置是否正确';
      }
      
    } catch (e) {
      setState(() {
        _testResult = '测试过程中发生错误: $e';
      });
    } finally {
      setState(() {
        _isTesting = false;
      });
    }
  }

  Future<void> _saveServer() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请输入服务器地址')),
      );
      return;
    }

    try {
      final pocketBaseService = Provider.of<PocketBaseService>(context, listen: false);
      await pocketBaseService.updateBaseUrl(url);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('服务器地址已保存: $url')),
      );
      
      Navigator.of(context).pop();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('保存失败: $e')),
      );
    }
  }
}
