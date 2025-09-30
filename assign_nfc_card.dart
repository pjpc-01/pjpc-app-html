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
    
    // 要分配的新NFC ID
    final newNfcId = '3739513092';
    // Lu You Jia 的学生ID
    final studentId = '78oxmfyvytmagx4';
    
    print('\n=== 分配NFC卡 ===');
    print('新NFC ID: $newNfcId');
    print('学生ID: $studentId');
    
    // 更新学生的NFC卡号
    try {
      final updatedStudent = await pb.collection('students').update(studentId, body: {
        'cardNumber': newNfcId,
        'nfc_associated_at': DateTime.now().toIso8601String(),
        'nfc_last_used': DateTime.now().toIso8601String(),
        'nfc_usage_count': 0,
      });
      
      print('✅ 更新成功！');
      print('学生姓名: ${updatedStudent.getStringValue('student_name')}');
      print('新的NFC卡号: ${updatedStudent.getStringValue('cardNumber')}');
      
      // 验证更新
      print('\n=== 验证更新 ===');
      final verifyResult = await pb.collection('students').getList(
        filter: 'cardNumber = "$newNfcId"',
        perPage: 1,
      );
      
      if (verifyResult.items.isNotEmpty) {
        final student = verifyResult.items.first;
        print('✅ 验证成功！找到学生: ${student.getStringValue('student_name')}');
        print('NFC卡号: ${student.getStringValue('cardNumber')}');
      } else {
        print('❌ 验证失败！未找到学生');
      }
      
    } catch (e) {
      print('❌ 更新失败: $e');
    }
    
  } catch (e) {
    print('操作失败: $e');
  }
}

