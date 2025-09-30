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
    
    // Tang Hao Yi 的学生ID
    final studentId = '2qx7zbbu1nccv2o';
    final studentName = 'Tang Hao Yi 邓浩毅';
    
    print('\n=== 为 Tang Hao Yi 分配NFC卡 ===');
    print('学生姓名: $studentName');
    print('学生ID: $studentId');
    
    // 先查看当前状态
    print('\n--- 当前状态 ---');
    try {
      final currentStudent = await pb.collection('students').getOne(studentId);
      print('当前cardNumber: "${currentStudent.getStringValue('cardNumber')}"');
      print('当前状态: ${currentStudent.getStringValue('status')}');
    } catch (e) {
      print('获取当前状态失败: $e');
    }
    
    // 分配NFC卡 - 使用您扫描到的ID
    final nfcId = '3739513092'; // 使用您之前扫描的ID
    print('\n--- 分配NFC卡 ---');
    print('分配的NFC ID: $nfcId');
    
    try {
      // 检查这个NFC ID是否已经被其他学生使用
      final existingStudent = await pb.collection('students').getList(
        filter: 'cardNumber = "$nfcId"',
        perPage: 1,
      );
      
      if (existingStudent.items.isNotEmpty) {
        final existing = existingStudent.items.first;
        print('⚠️ 警告: NFC ID $nfcId 已经被学生使用:');
        print('  学生姓名: ${existing.getStringValue('student_name')}');
        print('  学生ID: ${existing.id}');
        
        // 如果已经被Lu You Jia使用，我们需要先清除
        if (existing.id == '78oxmfyvytmagx4') {
          print('  这是Lu You Jia的NFC卡，先清除她的分配...');
          await pb.collection('students').update(existing.id, body: {
            'cardNumber': '',
          });
          print('  ✅ 已清除Lu You Jia的NFC分配');
        }
      }
      
      // 现在分配给Tang Hao Yi
      print('\n--- 执行分配 ---');
      final updatedStudent = await pb.collection('students').update(studentId, body: {
        'cardNumber': nfcId,
        'nfc_associated_at': DateTime.now().toIso8601String(),
        'nfc_last_used': DateTime.now().toIso8601String(),
        'nfc_usage_count': 0,
      });
      
      print('✅ 分配成功！');
      print('新的cardNumber: "${updatedStudent.getStringValue('cardNumber')}"');
      print('关联时间: ${updatedStudent.getStringValue('nfc_associated_at')}');
      
    } catch (e) {
      print('❌ 分配失败: $e');
      return;
    }
    
    // 验证分配结果
    print('\n--- 验证分配结果 ---');
    try {
      // 方法1: 直接查询学生记录
      final verifyStudent = await pb.collection('students').getOne(studentId);
      print('方法1 - 直接查询:');
      print('  学生姓名: ${verifyStudent.getStringValue('student_name')}');
      print('  cardNumber: "${verifyStudent.getStringValue('cardNumber')}"');
      
      // 方法2: 通过NFC ID查询
      final verifyByNfc = await pb.collection('students').getList(
        filter: 'cardNumber = "$nfcId"',
        perPage: 1,
      );
      
      print('\n方法2 - NFC ID查询:');
      if (verifyByNfc.items.isNotEmpty) {
        final student = verifyByNfc.items.first;
        print('  找到学生: ${student.getStringValue('student_name')}');
        print('  cardNumber: "${student.getStringValue('cardNumber')}"');
        print('  学生ID: ${student.id}');
        
        if (student.id == studentId) {
          print('  ✅ 验证成功！NFC卡已正确分配给Tang Hao Yi');
        } else {
          print('  ❌ 验证失败！NFC卡分配给了其他学生');
        }
      } else {
        print('  ❌ 验证失败！通过NFC ID未找到学生');
      }
      
    } catch (e) {
      print('验证失败: $e');
    }
    
    // 检查Lu You Jia的状态
    print('\n--- 检查Lu You Jia的状态 ---');
    try {
      final luYouJia = await pb.collection('students').getOne('78oxmfyvytmagx4');
      print('Lu You Jia当前cardNumber: "${luYouJia.getStringValue('cardNumber')}"');
    } catch (e) {
      print('检查Lu You Jia失败: $e');
    }
    
  } catch (e) {
    print('操作失败: $e');
  }
}

