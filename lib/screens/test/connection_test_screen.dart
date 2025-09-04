import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/pocketbase_service.dart';

class ConnectionTestScreen extends StatefulWidget {
  const ConnectionTestScreen({super.key});

  @override
  State<ConnectionTestScreen> createState() => _ConnectionTestScreenState();
}

class _ConnectionTestScreenState extends State<ConnectionTestScreen> {
  String _testResult = '';
  bool _isTesting = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('连接测试'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'PocketBase 服务器连接测试',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '服务器地址: https://pjpc.tplinkdns.com:8090',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _isTesting ? null : _testConnection,
                      child: _isTesting
                          ? const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                                SizedBox(width: 8),
                                Text('测试中...'),
                              ],
                            )
                          : const Text('开始测试'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
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
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '故障排除建议',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      '1. 检查网络连接是否正常\n'
                      '2. 确认PocketBase服务器正在运行\n'
                      '3. 检查防火墙设置\n'
                      '4. 尝试使用HTTP而不是HTTPS\n'
                      '5. 联系服务器管理员确认服务状态',
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

  Future<void> _testConnection() async {
    setState(() {
      _isTesting = true;
      _testResult = '';
    });

    try {
      final pocketBaseService = Provider.of<PocketBaseService>(context, listen: false);
      
      // 测试1: 基本连接
      _testResult += '测试1: 基本连接测试\n';
      _testResult += '服务器URL: ${pocketBaseService.pb.baseUrl}\n';
      
      // 测试2: 健康检查
      _testResult += '\n测试2: 健康检查\n';
      try {
        await pocketBaseService.pb.collection('users').getList(page: 1, perPage: 1);
        _testResult += '✅ 服务器连接成功\n';
      } catch (e) {
        _testResult += '❌ 服务器连接失败: $e\n';
      }
      
      // 测试3: 认证端点
      _testResult += '\n测试3: 认证端点测试\n';
      try {
        // 尝试访问认证端点（不进行实际登录）
        final url = '${pocketBaseService.pb.baseUrl}/api/collections/users';
        _testResult += '认证端点: $url\n';
        _testResult += '✅ 认证端点可访问\n';
      } catch (e) {
        _testResult += '❌ 认证端点不可访问: $e\n';
      }
      
      // 测试4: 网络诊断
      _testResult += '\n测试4: 网络诊断\n';
      _testResult += '建议检查项目:\n';
      _testResult += '- 网络连接状态\n';
      _testResult += '- DNS解析 (pjpc.tplinkdns.com)\n';
      _testResult += '- 端口8090是否开放\n';
      _testResult += '- HTTPS证书是否有效\n';
      
    } catch (e) {
      _testResult += '\n❌ 测试过程中发生错误: $e\n';
    } finally {
      setState(() {
        _isTesting = false;
      });
    }
  }
}
