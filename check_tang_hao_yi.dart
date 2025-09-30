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
    
    print('\n=== 查找 Tang Hao Yi 学生 ===');
    
    // 搜索包含 "tang hao yi" 的学生
    try {
      final searchResult = await pb.collection('students').getList(
        filter: 'student_name ~ "tang hao yi" || student_name ~ "Tang Hao Yi"',
        perPage: 10,
      );
      
      print('找到学生数量: ${searchResult.items.length}');
      
      for (final student in searchResult.items) {
        print('\n--- 学生信息 ---');
        print('ID: ${student.id}');
        print('姓名: ${student.getStringValue('student_name')}');
        print('学号: ${student.getStringValue('student_id')}');
        print('分行: ${student.getStringValue('center')}');
        print('当前cardNumber: "${student.getStringValue('cardNumber')}"');
        print('状态: ${student.getStringValue('status')}');
        
        // 显示所有NFC相关字段
        print('\n--- NFC相关字段 ---');
        final nfcFields = ['cardNumber', 'nfc_tag_id', 'nfc_card_number', 'nfc_associated_at', 'nfc_last_used'];
        for (final field in nfcFields) {
          final value = student.getStringValue(field);
          print('$field: "${value ?? 'null'}"');
        }
        
        // 显示所有字段（用于调试）
        print('\n--- 所有字段 ---');
        student.data.forEach((key, value) {
          if (value != null && value.toString().isNotEmpty) {
            print('$key: $value');
          }
        });
      }
    } catch (e) {
      print('搜索失败: $e');
    }
    
    // 也尝试搜索可能的名字变体
    print('\n=== 搜索名字变体 ===');
    final nameVariants = ['tang', 'hao', 'yi', 'Tang', 'Hao', 'Yi'];
    
    for (final variant in nameVariants) {
      try {
        final result = await pb.collection('students').getList(
          filter: 'student_name ~ "$variant"',
          perPage: 5,
        );
        
        if (result.items.isNotEmpty) {
          print('\n搜索 "$variant" 找到 ${result.items.length} 个学生:');
          for (final student in result.items.take(3)) {
            final name = student.getStringValue('student_name') ?? '未知';
            final cardNumber = student.getStringValue('cardNumber') ?? '无';
            print('  - $name (NFC: $cardNumber)');
          }
        }
      } catch (e) {
        print('搜索 "$variant" 失败: $e');
      }
    }
    
    // 检查最近的NFC分配记录
    print('\n=== 检查最近的NFC分配 ===');
    try {
      final recentStudents = await pb.collection('students').getList(
        filter: 'cardNumber != "" && cardNumber != null',
        perPage: 10,
        sort: '-updated',
      );
      
      print('最近有NFC卡的学生:');
      for (final student in recentStudents.items) {
        final name = student.getStringValue('student_name') ?? '未知';
        final cardNumber = student.getStringValue('cardNumber') ?? '无';
        final updated = student.updated;
        print('  - $name (NFC: $cardNumber, 更新: $updated)');
      }
    } catch (e) {
      print('检查最近分配失败: $e');
    }
    
  } catch (e) {
    print('操作失败: $e');
  }
}

