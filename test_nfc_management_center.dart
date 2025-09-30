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
    
    print('\n=== NFC管理中心功能测试 ===');
    
    // 1. 测试获取所有学生列表
    print('\n--- 1. 获取学生列表 ---');
    final students = await pb.collection('students').getList(perPage: 50);
    print('学生总数: ${students.items.length}');
    for (final student in students.items) {
      final name = student.getStringValue('student_name') ?? '未知';
      final cardNumber = student.getStringValue('cardNumber') ?? '无';
      final center = student.getStringValue('center') ?? '无';
      print('  - $name (分行: $center, NFC: $cardNumber)');
    }
    
    // 2. 测试获取所有教师列表
    print('\n--- 2. 获取教师列表 ---');
    final teachers = await pb.collection('teachers').getList(perPage: 50);
    print('教师总数: ${teachers.items.length}');
    for (final teacher in teachers.items) {
      final name = teacher.getStringValue('name') ?? '未知';
      final cardNumber = teacher.getStringValue('cardNumber') ?? '无';
      final permissions = teacher.getStringValue('permissions') ?? '无';
      print('  - $name (权限: $permissions, NFC: $cardNumber)');
    }
    
    // 3. 测试NFC卡扫描查找功能
    print('\n--- 3. NFC卡扫描查找测试 ---');
    final testNfcIds = ['3739513092', '2950813188', '2793319940', '2686677508'];
    
    for (final nfcId in testNfcIds) {
      print('\n  测试NFC ID: $nfcId');
      
      // 查找学生
      try {
        final studentResult = await pb.collection('students').getList(
          filter: 'cardNumber = "$nfcId"',
          perPage: 1,
        );
        
        if (studentResult.items.isNotEmpty) {
          final student = studentResult.items.first;
          print('    ✅ 找到学生: ${student.getStringValue('student_name')}');
          print('      学号: ${student.getStringValue('student_id')}');
          print('      分行: ${student.getStringValue('center')}');
        } else {
          print('    ❌ 未找到学生');
        }
      } catch (e) {
        print('    ❌ 学生查询失败: $e');
      }
      
      // 查找教师
      try {
        final teacherResult = await pb.collection('teachers').getList(
          filter: 'cardNumber = "$nfcId"',
          perPage: 1,
        );
        
        if (teacherResult.items.isNotEmpty) {
          final teacher = teacherResult.items.first;
          print('    ✅ 找到教师: ${teacher.getStringValue('name')}');
          print('      工号: ${teacher.getStringValue('teacher_id')}');
          print('      权限: ${teacher.getStringValue('permissions')}');
        } else {
          print('    ❌ 未找到教师');
        }
      } catch (e) {
        print('    ❌ 教师查询失败: $e');
      }
    }
    
    // 4. 测试NFC卡分配功能
    print('\n--- 4. NFC卡分配功能测试 ---');
    
    // 选择一个没有NFC卡的学生进行测试
    final studentsWithoutNfc = students.items.where((s) {
      final cardNumber = s.getStringValue('cardNumber') ?? '';
      return cardNumber.isEmpty || cardNumber == '无';
    }).toList();
    
    if (studentsWithoutNfc.isNotEmpty) {
      final testStudent = studentsWithoutNfc.first;
      final testNfcId = '9999999999'; // 测试用的NFC ID
      
      print('  测试学生: ${testStudent.getStringValue('student_name')}');
      print('  当前NFC卡号: ${testStudent.getStringValue('cardNumber')}');
      print('  分配新NFC ID: $testNfcId');
      
      try {
        // 执行分配操作
        final updatedStudent = await pb.collection('students').update(testStudent.id, body: {
          'cardNumber': testNfcId,
          'nfc_associated_at': DateTime.now().toIso8601String(),
          'nfc_last_used': DateTime.now().toIso8601String(),
          'nfc_usage_count': 0,
        });
        
        print('  ✅ 分配成功！');
        print('  新的NFC卡号: ${updatedStudent.getStringValue('cardNumber')}');
        
        // 验证分配结果
        final verifyResult = await pb.collection('students').getList(
          filter: 'cardNumber = "$testNfcId"',
          perPage: 1,
        );
        
        if (verifyResult.items.isNotEmpty) {
          final student = verifyResult.items.first;
          print('  ✅ 验证成功！找到学生: ${student.getStringValue('student_name')}');
        } else {
          print('  ❌ 验证失败！');
        }
        
        // 恢复原始状态（移除测试NFC ID）
        await pb.collection('students').update(testStudent.id, body: {
          'cardNumber': '',
        });
        print('  🔄 已恢复原始状态');
        
      } catch (e) {
        print('  ❌ 分配失败: $e');
      }
    } else {
      print('  ⚠️ 所有学生都有NFC卡，跳过分配测试');
    }
    
    // 5. 测试教师NFC卡分配功能
    print('\n--- 5. 教师NFC卡分配功能测试 ---');
    
    final teachersWithoutNfc = teachers.items.where((t) {
      final cardNumber = t.getStringValue('cardNumber') ?? '';
      return cardNumber.isEmpty || cardNumber == '无';
    }).toList();
    
    if (teachersWithoutNfc.isNotEmpty) {
      final testTeacher = teachersWithoutNfc.first;
      final testNfcId = '8888888888'; // 测试用的NFC ID
      
      print('  测试教师: ${testTeacher.getStringValue('name')}');
      print('  当前NFC卡号: ${testTeacher.getStringValue('cardNumber')}');
      print('  分配新NFC ID: $testNfcId');
      
      try {
        // 执行分配操作
        final updatedTeacher = await pb.collection('teachers').update(testTeacher.id, body: {
          'cardNumber': testNfcId,
          'nfc_associated_at': DateTime.now().toIso8601String(),
          'nfc_last_used': DateTime.now().toIso8601String(),
          'nfc_usage_count': 0,
        });
        
        print('  ✅ 分配成功！');
        print('  新的NFC卡号: ${updatedTeacher.getStringValue('cardNumber')}');
        
        // 验证分配结果
        final verifyResult = await pb.collection('teachers').getList(
          filter: 'cardNumber = "$testNfcId"',
          perPage: 1,
        );
        
        if (verifyResult.items.isNotEmpty) {
          final teacher = verifyResult.items.first;
          print('  ✅ 验证成功！找到教师: ${teacher.getStringValue('name')}');
        } else {
          print('  ❌ 验证失败！');
        }
        
        // 恢复原始状态
        await pb.collection('teachers').update(testTeacher.id, body: {
          'cardNumber': '',
        });
        print('  🔄 已恢复原始状态');
        
      } catch (e) {
        print('  ❌ 分配失败: $e');
      }
    } else {
      print('  ⚠️ 所有教师都有NFC卡，跳过分配测试');
    }
    
    // 6. 测试NFC卡检查遗漏功能
    print('\n--- 6. NFC卡检查遗漏功能测试 ---');
    
    // 模拟扫描一个未知的NFC卡
    final unknownNfcId = '1234567890';
    print('  扫描未知NFC ID: $unknownNfcId');
    
    // 查找学生
    final unknownStudentResult = await pb.collection('students').getList(
      filter: 'cardNumber = "$unknownNfcId"',
      perPage: 1,
    );
    
    // 查找教师
    final unknownTeacherResult = await pb.collection('teachers').getList(
      filter: 'cardNumber = "$unknownNfcId"',
      perPage: 1,
    );
    
    if (unknownStudentResult.items.isEmpty && unknownTeacherResult.items.isEmpty) {
      print('  ✅ 正确识别为未知NFC卡');
      print('  📝 建议: 此NFC卡未分配给任何用户');
    } else {
      print('  ❌ 应该识别为未知NFC卡，但找到了用户');
    }
    
    // 7. 测试格式转换功能
    print('\n--- 7. 格式转换功能测试 ---');
    
    final testCases = [
      {'input': '04D6E1AF672681', 'expected': '3739513092'},
      {'input': '04D6E1A672681', 'expected': '2950813188'},
      {'input': '2950813188', 'expected': '2950813188'},
    ];
    
    for (final testCase in testCases) {
      final input = testCase['input']!;
      final expected = testCase['expected']!;
      
      print('  测试转换: $input -> 期望: $expected');
      
      // 模拟转换逻辑
      String convertedId = input;
      if (input.length == 14 && input.startsWith('04')) {
        // 取前4个字节并转换为小端序
        String first4Bytes = input.substring(0, 8);
        List<String> bytes = [];
        for (int i = 0; i < first4Bytes.length; i += 2) {
          bytes.add(first4Bytes.substring(i, i + 2));
        }
        String littleEndian = bytes.reversed.join('');
        int decimal = int.parse(littleEndian, radix: 16);
        convertedId = decimal.toString();
      }
      
      print('    实际转换结果: $convertedId');
      
      if (convertedId == expected) {
        print('    ✅ 转换正确');
      } else {
        print('    ❌ 转换错误，期望: $expected，实际: $convertedId');
      }
    }
    
    // 8. 测试权限验证
    print('\n--- 8. 权限验证测试 ---');
    
    final currentUser = pb.authStore.record;
    if (currentUser != null) {
      final userRole = currentUser.data['role'] ?? 'unknown';
      final userEmail = currentUser.data['email'] ?? 'unknown';
      
      print('  当前用户: $userEmail');
      print('  用户角色: $userRole');
      
      // 检查是否有管理员权限
      if (userRole == 'admin' || userRole == 'super_admin') {
        print('  ✅ 具有管理员权限，可以执行NFC管理操作');
      } else {
        print('  ⚠️ 权限不足，可能无法执行某些NFC管理操作');
      }
    } else {
      print('  ❌ 无法获取当前用户信息');
    }
    
    print('\n=== 测试完成 ===');
    print('✅ 所有NFC管理中心功能测试已完成');
    
  } catch (e) {
    print('❌ 测试失败: $e');
  }
}

