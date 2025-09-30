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
    
    final scannedNfcId = '3739513092';
    print('\n=== 验证NFC扫描 ===');
    print('扫描的NFC ID: $scannedNfcId');
    
    // 模拟NFC扫描服务的查找逻辑
    print('\n--- 查找学生 ---');
    try {
      final studentResult = await pb.collection('students').getList(
        filter: 'cardNumber = "$scannedNfcId"',
        perPage: 1,
      );
      
      if (studentResult.items.isNotEmpty) {
        final student = studentResult.items.first;
        print('✅ 找到学生！');
        print('学生姓名: ${student.getStringValue('student_name')}');
        print('学生ID: ${student.getStringValue('student_id')}');
        print('分行: ${student.getStringValue('center')}');
        print('NFC卡号: ${student.getStringValue('cardNumber')}');
        print('状态: ${student.getStringValue('status')}');
      } else {
        print('❌ 未找到学生');
      }
    } catch (e) {
      print('❌ 学生查询失败: $e');
    }
    
    print('\n--- 查找教师 ---');
    try {
      final teacherResult = await pb.collection('teachers').getList(
        filter: 'cardNumber = "$scannedNfcId"',
        perPage: 1,
      );
      
      if (teacherResult.items.isNotEmpty) {
        final teacher = teacherResult.items.first;
        print('✅ 找到教师！');
        print('教师姓名: ${teacher.getStringValue('name')}');
        print('工号: ${teacher.getStringValue('teacher_id')}');
        print('NFC卡号: ${teacher.getStringValue('cardNumber')}');
      } else {
        print('❌ 未找到教师');
      }
    } catch (e) {
      print('❌ 教师查询失败: $e');
    }
    
    // 测试格式转换
    print('\n--- 测试格式转换 ---');
    final rawId = '04D6E1AF672681'; // 假设这是手机扫描的原始ID
    print('原始扫描ID: $rawId');
    
    // 模拟转换逻辑
    String convertedId = rawId;
    if (rawId.length == 14 && rawId.startsWith('04')) {
      // 取前4个字节并转换为小端序
      String first4Bytes = rawId.substring(0, 8);
      List<String> bytes = [];
      for (int i = 0; i < first4Bytes.length; i += 2) {
        bytes.add(first4Bytes.substring(i, i + 2));
      }
      String littleEndian = bytes.reversed.join('');
      int decimal = int.parse(littleEndian, radix: 16);
      convertedId = decimal.toString();
      print('转换后的ID: $convertedId');
    }
    
    // 用转换后的ID查询
    try {
      final convertedResult = await pb.collection('students').getList(
        filter: 'cardNumber = "$convertedId"',
        perPage: 1,
      );
      
      if (convertedResult.items.isNotEmpty) {
        final student = convertedResult.items.first;
        print('✅ 转换查询成功！找到学生: ${student.getStringValue('student_name')}');
      } else {
        print('❌ 转换查询未找到学生');
      }
    } catch (e) {
      print('❌ 转换查询失败: $e');
    }
    
  } catch (e) {
    print('测试失败: $e');
  }
}

