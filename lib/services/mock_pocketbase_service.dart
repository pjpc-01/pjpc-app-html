import 'package:pocketbase/pocketbase.dart';

class MockPocketBaseService {
  // 模拟用户数据
  static final List<Map<String, dynamic>> _mockUsers = [
    {
      'id': 'user1',
      'email': 'admin@pjpc.com',
      'name': '管理员',
      'role': 'admin',
      'status': 'active',
    },
    {
      'id': 'user2', 
      'email': 'teacher@pjpc.com',
      'name': '张老师',
      'role': 'teacher',
      'status': 'active',
    },
    {
      'id': 'user3',
      'email': 'parent@pjpc.com', 
      'name': '李家长',
      'role': 'parent',
      'status': 'active',
    },
  ];

  // 模拟学生数据
  static final List<Map<String, dynamic>> _mockStudents = [
    {
      'id': 'student1',
      'name': '张三',
      'grade': '小学一年级',
      'gender': '男',
      'phone': '1234567890',
      'points': 100,
      'nfc_card_id': 'NFC001',
    },
    {
      'id': 'student2',
      'name': '李四',
      'grade': '小学二年级', 
      'gender': '女',
      'phone': '0987654321',
      'points': 85,
      'nfc_card_id': 'NFC002',
    },
  ];

  // 模拟登录
  static Future<Map<String, dynamic>> login(String email, String password) async {
    // 模拟网络延迟
    await Future.delayed(const Duration(seconds: 1));
    
    final user = _mockUsers.firstWhere(
      (u) => u['email'] == email,
      orElse: () => throw Exception('用户不存在'),
    );
    
    if (password != '123456') {
      throw Exception('密码错误');
    }
    
    return {
      'token': 'mock_token_${user['id']}',
      'record': user,
    };
  }

  // 模拟获取学生列表
  static Future<List<Map<String, dynamic>>> getStudents() async {
    await Future.delayed(const Duration(milliseconds: 500));
    return _mockStudents;
  }

  // 模拟健康检查
  static Future<bool> healthCheck() async {
    await Future.delayed(const Duration(milliseconds: 200));
    return true;
  }
}
