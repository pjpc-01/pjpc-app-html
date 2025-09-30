import 'package:pocketbase/pocketbase.dart';

void main() async {
  final pb = PocketBase('http://pjpc.tplinkdns.com:8090');
  
  try {
    // 尝试获取一个学生记录来查看字段
    print('=== 检查学生集合字段 ===');
    final students = await pb.collection('students').getList(perPage: 1);
    if (students.items.isNotEmpty) {
      final student = students.items.first;
      print('学生记录ID: ${student.id}');
      print('学生记录字段:');
      student.data.forEach((key, value) {
        print('  $key: $value');
      });
    } else {
      print('没有学生记录');
    }
    
    print('\n=== 检查教师集合字段 ===');
    final teachers = await pb.collection('teachers').getList(perPage: 1);
    if (teachers.items.isNotEmpty) {
      final teacher = teachers.items.first;
      print('教师记录ID: ${teacher.id}');
      print('教师记录字段:');
      teacher.data.forEach((key, value) {
        print('  $key: $value');
      });
    } else {
      print('没有教师记录');
    }
    
    // 尝试查询特定的NFC ID
    print('\n=== 测试NFC查询 ===');
    final testId = '3739513092';
    
    // 测试学生查询
    try {
      final studentResult = await pb.collection('students').getList(
        filter: 'cardNumber = "$testId"',
        perPage: 1,
      );
      print('学生查询结果 (cardNumber): ${studentResult.items.length} 条记录');
      if (studentResult.items.isNotEmpty) {
        print('找到学生: ${studentResult.items.first.getStringValue('student_name')}');
      }
    } catch (e) {
      print('学生查询失败 (cardNumber): $e');
    }
    
    try {
      final studentResult2 = await pb.collection('students').getList(
        filter: 'nfc_tag_id = "$testId"',
        perPage: 1,
      );
      print('学生查询结果 (nfc_tag_id): ${studentResult2.items.length} 条记录');
      if (studentResult2.items.isNotEmpty) {
        print('找到学生: ${studentResult2.items.first.getStringValue('student_name')}');
      }
    } catch (e) {
      print('学生查询失败 (nfc_tag_id): $e');
    }
    
    // 测试教师查询
    try {
      final teacherResult = await pb.collection('teachers').getList(
        filter: 'cardNumber = "$testId"',
        perPage: 1,
      );
      print('教师查询结果 (cardNumber): ${teacherResult.items.length} 条记录');
      if (teacherResult.items.isNotEmpty) {
        print('找到教师: ${teacherResult.items.first.getStringValue('name')}');
      }
    } catch (e) {
      print('教师查询失败 (cardNumber): $e');
    }
    
    try {
      final teacherResult2 = await pb.collection('teachers').getList(
        filter: 'nfc_card_number = "$testId"',
        perPage: 1,
      );
      print('教师查询结果 (nfc_card_number): ${teacherResult2.items.length} 条记录');
      if (teacherResult2.items.isNotEmpty) {
        print('找到教师: ${teacherResult2.items.first.getStringValue('name')}');
      }
    } catch (e) {
      print('教师查询失败 (nfc_card_number): $e');
    }
    
  } catch (e) {
    print('调试失败: $e');
  }
}

