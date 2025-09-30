import 'package:pocketbase/pocketbase.dart';

void main() async {
  final pb = PocketBase('http://pjpc.tplinkdns.com:8090');
  
  try {
    print('=== 尝试管理员登录 ===');
    // 尝试管理员登录
    try {
      final authData = await pb.collection('users').authWithPassword(
        'pjpcemerlang@gmail.com',
        '0122270775Sw!',
      );
      print('管理员登录成功: ${authData.record?.id}');
    } catch (e) {
      print('管理员登录失败: $e');
      return;
    }
    
    // 尝试获取学生记录
    print('\n=== 检查学生集合字段 ===');
    final students = await pb.collection('students').getList(perPage: 5);
    print('学生记录数量: ${students.items.length}');
    if (students.items.isNotEmpty) {
      final student = students.items.first;
      print('第一个学生记录ID: ${student.id}');
      print('第一个学生记录字段:');
      student.data.forEach((key, value) {
        print('  $key: $value');
      });
    }
    
    print('\n=== 检查教师集合字段 ===');
    final teachers = await pb.collection('teachers').getList(perPage: 5);
    print('教师记录数量: ${teachers.items.length}');
    if (teachers.items.isNotEmpty) {
      final teacher = teachers.items.first;
      print('第一个教师记录ID: ${teacher.id}');
      print('第一个教师记录字段:');
      teacher.data.forEach((key, value) {
        print('  $key: $value');
      });
    }
    
    // 查找有NFC卡号的学生和教师
    print('\n=== 查找有NFC卡号的学生 ===');
    final studentsWithNfc = await pb.collection('students').getList(
      filter: 'cardNumber != "" && cardNumber != null',
      perPage: 10,
    );
    print('有NFC卡号的学生数量: ${studentsWithNfc.items.length}');
    for (final student in studentsWithNfc.items) {
      final name = student.getStringValue('student_name') ?? '未知';
      final cardNumber = student.getStringValue('cardNumber') ?? '无';
      print('  学生: $name, NFC卡号: $cardNumber');
    }
    
    print('\n=== 查找有NFC卡号的教师 ===');
    final teachersWithNfc = await pb.collection('teachers').getList(
      filter: 'cardNumber != "" && cardNumber != null',
      perPage: 10,
    );
    print('有NFC卡号的教师数量: ${teachersWithNfc.items.length}');
    for (final teacher in teachersWithNfc.items) {
      final name = teacher.getStringValue('name') ?? '未知';
      final cardNumber = teacher.getStringValue('cardNumber') ?? '无';
      print('  教师: $name, NFC卡号: $cardNumber');
    }
    
  } catch (e) {
    print('调试失败: $e');
  }
}
