import 'package:pocketbase/pocketbase.dart';

void main() async {
  print('测试PocketBase连接...');
  
  // 主要测试目标URL
  final targetUrl = 'http://pjpc.tplinkdns.com:8090';
  
  print('\n测试目标URL: $targetUrl');
  try {
    final pb = PocketBase(targetUrl);
    pb.httpClient.timeout = const Duration(seconds: 10);
    
    // 测试健康检查
    print('正在测试健康检查...');
    await pb.health.check();
    print('✅ 健康检查成功');
    
    // 测试用户认证端点
    print('正在测试用户认证端点...');
    try {
      // 尝试访问认证端点（应该返回405 Method Not Allowed，因为需要POST）
      await pb.collection('users').authWithPassword('test@test.com', 'test123');
    } catch (e) {
      if (e.toString().contains('Failed to fetch') || e.toString().contains('ClientException')) {
        print('❌ 网络连接失败: $e');
      } else if (e.toString().contains('400') || e.toString().contains('401')) {
        print('✅ 认证端点可访问（返回认证错误是正常的）');
      } else {
        print('⚠️ 认证端点测试: $e');
      }
    }
    
    print('✅ 服务器连接正常: $targetUrl');
    
  } catch (e) {
    print('❌ 连接失败: $e');
    print('\n请检查：');
    print('1. 网络连接是否正常');
    print('2. 服务器是否运行在 $targetUrl');
    print('3. 防火墙设置');
  }
  
  print('\n测试完成！');
}
