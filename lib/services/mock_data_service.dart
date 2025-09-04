import 'package:pocketbase/pocketbase.dart';

class MockDataService {
  static List<RecordModel> getMockStudents() {
    final students = [
      {
        'id': 'mock_student_1',
        'name': '张三',
        'student_id': 'S001',
        'class': '一年级A班',
        'grade': 'Standard 1A',
        'gender': 'male',
        'phone': '13800138001',
        'email': 'zhangsan@example.com',
        'parent_name': '张父',
        'parent_phone': '13900139001',
        'nfc_card_id': 'NFC001',
        'points': 100,
        'created': DateTime.now().toIso8601String(),
        'updated': DateTime.now().toIso8601String(),
      },
      {
        'id': 'mock_student_2',
        'name': '李四',
        'student_id': 'S002',
        'class': '一年级A班',
        'grade': 'Standard 1A',
        'gender': 'female',
        'phone': '13800138002',
        'email': 'lisi@example.com',
        'parent_name': '李母',
        'parent_phone': '13900139002',
        'nfc_card_id': 'NFC002',
        'points': 85,
        'created': DateTime.now().toIso8601String(),
        'updated': DateTime.now().toIso8601String(),
      },
      {
        'id': 'mock_student_3',
        'name': '王五',
        'student_id': 'S003',
        'class': '二年级B班',
        'grade': 'Standard 2B',
        'gender': 'male',
        'phone': '13800138003',
        'email': 'wangwu@example.com',
        'parent_name': '王父',
        'parent_phone': '13900139003',
        'nfc_card_id': 'NFC003',
        'points': 95,
        'created': DateTime.now().toIso8601String(),
        'updated': DateTime.now().toIso8601String(),
      },
    ];
    
    return students.map((data) => RecordModel.fromJson(data)).toList();
  }
  
  static List<RecordModel> getMockAttendanceRecords() {
    final attendanceRecords = [
      {
        'id': 'mock_attendance_1',
        'student': 'mock_student_1',
        'student_name': '张三',
        'type': 'check_in',
        'nfc_card_id': 'NFC001',
        'date': DateTime.now().toIso8601String().split('T')[0],
        'time': DateTime.now().toIso8601String().split('T')[1].split('.')[0],
        'created': DateTime.now().toIso8601String(),
        'updated': DateTime.now().toIso8601String(),
      },
      {
        'id': 'mock_attendance_2',
        'student': 'mock_student_1',
        'student_name': '张三',
        'type': 'check_out',
        'nfc_card_id': 'NFC001',
        'date': DateTime.now().toIso8601String().split('T')[0],
        'time': DateTime.now().add(const Duration(hours: 8)).toIso8601String().split('T')[1].split('.')[0],
        'created': DateTime.now().toIso8601String(),
        'updated': DateTime.now().toIso8601String(),
      },
      {
        'id': 'mock_attendance_3',
        'student': 'mock_student_2',
        'student_name': '李四',
        'type': 'check_in',
        'nfc_card_id': 'NFC002',
        'date': DateTime.now().toIso8601String().split('T')[0],
        'time': DateTime.now().toIso8601String().split('T')[1].split('.')[0],
        'created': DateTime.now().toIso8601String(),
        'updated': DateTime.now().toIso8601String(),
      },
    ];
    
    return attendanceRecords.map((data) => RecordModel.fromJson(data)).toList();
  }
}
