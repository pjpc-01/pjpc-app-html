import 'package:pocketbase/pocketbase.dart';

void main() async {
  final pb = PocketBase('http://pjpc.tplinkdns.com:8090');
  
  try {
    print('=== 登录测试 ===');
    final authData = await pb.collection('users').authWithPassword(
      'pjpcemerlang@gmail.com',
      '0122270775Sw!',
    );
    print('登录成功: ${authData.record?.id}');
    
    final testId = '3739513092';
    print('\n=== 测试NFC ID: $testId ===');
    
    // 测试学生查询
    print('\n--- 学生查询 ---');
    try {
      final studentResult = await pb.collection('students').getList(
        filter: 'cardNumber = "$testId"',
        perPage: 10,
      );
      print('找到学生: ${studentResult.items.length} 条记录');
      for (final student in studentResult.items) {
        final name = student.getStringValue('student_name') ?? '未知';
        final cardNumber = student.getStringValue('cardNumber') ?? '无';
        print('  学生: $name, NFC卡号: $cardNumber');
      }
    } catch (e) {
      print('学生查询失败: $e');
    }
    
    // 测试教师查询
    print('\n--- 教师查询 ---');
    try {
      final teacherResult = await pb.collection('teachers').getList(
        filter: 'cardNumber = "$testId"',
        perPage: 10,
      );
      print('找到教师: ${teacherResult.items.length} 条记录');
      for (final teacher in teacherResult.items) {
        final name = teacher.getStringValue('name') ?? '未知';
        final cardNumber = teacher.getStringValue('cardNumber') ?? '无';
        print('  教师: $name, NFC卡号: $cardNumber');
      }
    } catch (e) {
      print('教师查询失败: $e');
    }
    
    // 测试所有可能的字段查询
    print('\n--- 测试所有字段查询 ---');
    final fields = ['cardNumber', 'nfc_tag_id', 'nfc_card_number', 'nfc_id'];
    
    for (final field in fields) {
      try {
        final result = await pb.collection('students').getList(
          filter: '$field = "$testId"',
          perPage: 1,
        );
        if (result.items.isNotEmpty) {
          final student = result.items.first;
          print('✅ 在字段 $field 中找到学生: ${student.getStringValue('student_name')}');
        }
      } catch (e) {
        print('❌ 字段 $field 查询失败: ${e.toString().contains('400') ? '字段不存在' : e}');
      }
    }
    
    // 检查Lu You Jia的详细信息
    print('\n--- Lu You Jia 详细信息 ---');
    try {
      final luYouJia = await pb.collection('students').getList(
        filter: 'student_name ~ "Lu You Jia" || student_name ~ "卢友佳"',
        perPage: 10,
      );
      if (luYouJia.items.isNotEmpty) {
        final student = luYouJia.items.first;
        print('学生ID: ${student.id}');
        print('学生姓名: ${student.getStringValue('student_name')}');
        print('NFC卡号: ${student.getStringValue('cardNumber')}');
        print('所有字段:');
        student.data.forEach((key, value) {
          if (value.toString().isNotEmpty) {
            print('  $key: $value');
          }
        });
      }
    } catch (e) {
      print('查询Lu You Jia失败: $e');
    }
    
  } catch (e) {
    print('测试失败: $e');
  }
}

