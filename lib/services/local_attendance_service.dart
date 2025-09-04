import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class LocalAttendanceService {
  static const String _attendanceKey = 'local_attendance_records';
  
  // 获取本地考勤记录
  static Future<List<Map<String, dynamic>>> getAttendanceRecords() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final recordsJson = prefs.getString(_attendanceKey);
      
      if (recordsJson != null) {
        final List<dynamic> records = json.decode(recordsJson);
        return records.cast<Map<String, dynamic>>();
      }
      
      return [];
    } catch (e) {
      print('Error loading local attendance records: $e');
      return [];
    }
  }
  
  // 保存考勤记录
  static Future<void> saveAttendanceRecord(Map<String, dynamic> record) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final existingRecords = await getAttendanceRecords();
      
      // 添加新记录
      existingRecords.add({
        ...record,
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'created': DateTime.now().toIso8601String(),
      });
      
      // 保存到本地存储
      final recordsJson = json.encode(existingRecords);
      await prefs.setString(_attendanceKey, recordsJson);
      
      print('Saved attendance record: ${record['student_name']} - ${record['type']}');
    } catch (e) {
      print('Error saving attendance record: $e');
    }
  }
  
  // 创建考勤记录
  static Future<Map<String, dynamic>> createAttendanceRecord({
    required String studentId,
    required String studentName,
    required String type, // 'check_in' or 'check_out'
    String? nfcCardId,
    String? notes,
  }) async {
    final now = DateTime.now();
    final record = {
      'student': studentId,
      'student_name': studentName,
      'type': type,
      'nfc_card_id': nfcCardId ?? '',
      'date': now.toIso8601String().split('T')[0],
      'time': now.toIso8601String().split('T')[1].split('.')[0],
      'notes': notes ?? '',
    };
    
    await saveAttendanceRecord(record);
    return record;
  }
  
  // 获取学生的考勤记录
  static Future<List<Map<String, dynamic>>> getStudentAttendanceRecords(String studentId) async {
    final allRecords = await getAttendanceRecords();
    return allRecords.where((record) => record['student'] == studentId).toList();
  }
  
  // 获取今天的考勤记录
  static Future<List<Map<String, dynamic>>> getTodaysAttendanceRecords() async {
    final allRecords = await getAttendanceRecords();
    final today = DateTime.now().toIso8601String().split('T')[0];
    
    return allRecords.where((record) => record['date'] == today).toList();
  }
  
  // 检查学生今天是否已签到
  static Future<bool> hasStudentCheckedInToday(String studentId) async {
    final todayRecords = await getTodaysAttendanceRecords();
    return todayRecords.any((record) => 
      record['student'] == studentId && record['type'] == 'check_in'
    );
  }
  
  // 检查学生今天是否已签退
  static Future<bool> hasStudentCheckedOutToday(String studentId) async {
    final todayRecords = await getTodaysAttendanceRecords();
    return todayRecords.any((record) => 
      record['student'] == studentId && record['type'] == 'check_out'
    );
  }
  
  // 清除所有考勤记录（用于测试）
  static Future<void> clearAllRecords() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_attendanceKey);
      print('Cleared all attendance records');
    } catch (e) {
      print('Error clearing attendance records: $e');
    }
  }
}
