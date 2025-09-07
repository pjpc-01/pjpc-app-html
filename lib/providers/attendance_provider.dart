import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import '../services/pocketbase_service.dart';

class AttendanceProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  List<RecordModel> _attendanceRecords = [];
  Map<String, dynamic> _attendanceStats = {};

  AttendanceProvider({PocketBaseService? pocketBaseService}) 
      : _pocketBaseService = pocketBaseService ?? PocketBaseService.instance;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<RecordModel> get attendanceRecords => _attendanceRecords;
  Map<String, dynamic> get attendanceStats => _attendanceStats;

  // Load attendance records
  Future<void> loadAttendanceRecords() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _attendanceRecords = await _pocketBaseService.getStudentAttendanceRecords();
    } catch (e) {
      _error = '加载考勤记录失败: ${e.toString()}';
      _attendanceRecords = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Create attendance record
  Future<bool> createAttendanceRecord(Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.createStudentAttendanceRecord(data);
      _attendanceRecords.add(record);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('创建考勤记录失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Get attendance records for student
  List<RecordModel> getAttendanceRecordsForStudent(String studentId) {
    return _attendanceRecords.where((a) => a.getStringValue('student') == studentId).toList();
  }

  // Get attendance records by date
  List<RecordModel> getAttendanceRecordsByDate(DateTime date) {
    final dateStr = date.toIso8601String().split('T')[0];
    return _attendanceRecords.where((a) {
      final recordDate = a.getStringValue('date');
      return recordDate.startsWith(dateStr);
    }).toList();
  }

  // Get attendance records by date range
  List<RecordModel> getAttendanceRecordsByDateRange(DateTime startDate, DateTime endDate) {
    return _attendanceRecords.where((a) {
      final recordDate = DateTime.tryParse(a.getStringValue('date'));
      if (recordDate == null) return false;
      
      return recordDate.isAfter(startDate.subtract(const Duration(days: 1))) &&
             recordDate.isBefore(endDate.add(const Duration(days: 1)));
    }).toList();
  }

  // Get attendance records by type (check_in, check_out)
  List<RecordModel> getAttendanceRecordsByType(String type) {
    return _attendanceRecords.where((a) => a.getStringValue('type') == type).toList();
  }

  // Get today's attendance
  List<RecordModel> getTodaysAttendance() {
    final today = DateTime.now();
    return getAttendanceRecordsByDate(today);
  }

  // Get attendance statistics
  Future<void> loadAttendanceStats() async {
    _setLoading(true);
    _clearError();

    try {
      await loadAttendanceRecords();
      _calculateAttendanceStats();
      notifyListeners();
    } catch (e) {
      _setError('加载考勤统计失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  void _calculateAttendanceStats() {
    final today = DateTime.now();
    final todayRecords = getTodaysAttendance();
    final thisWeekRecords = getAttendanceRecordsByDateRange(
      today.subtract(Duration(days: today.weekday - 1)),
      today,
    );
    final thisMonthRecords = getAttendanceRecordsByDateRange(
      DateTime(today.year, today.month, 1),
      today,
    );

    final checkInToday = todayRecords.where((r) => r.getStringValue('type') == 'check_in').length;
    final checkOutToday = todayRecords.where((r) => r.getStringValue('type') == 'check_out').length;
    final checkInThisWeek = thisWeekRecords.where((r) => r.getStringValue('type') == 'check_in').length;
    final checkInThisMonth = thisMonthRecords.where((r) => r.getStringValue('type') == 'check_in').length;

    _attendanceStats = {
      'today_check_in': checkInToday,
      'today_check_out': checkOutToday,
      'this_week_check_in': checkInThisWeek,
      'this_month_check_in': checkInThisMonth,
      'total_records': _attendanceRecords.length,
    };
  }

  // Check if student has checked in today
  bool hasStudentCheckedInToday(String studentId) {
    final today = DateTime.now();
    final todayRecords = getAttendanceRecordsByDate(today);
    
    return todayRecords.any((r) => 
      r.getStringValue('student') == studentId && 
      r.getStringValue('type') == 'check_in'
    );
  }

  // Check if student has checked out today
  bool hasStudentCheckedOutToday(String studentId) {
    final today = DateTime.now();
    final todayRecords = getAttendanceRecordsByDate(today);
    
    return todayRecords.any((r) => 
      r.getStringValue('student') == studentId && 
      r.getStringValue('type') == 'check_out'
    );
  }

  // Get student's attendance summary
  Map<String, dynamic> getStudentAttendanceSummary(String studentId) {
    final studentRecords = getAttendanceRecordsForStudent(studentId);
    final checkInCount = studentRecords.where((r) => r.getStringValue('type') == 'check_in').length;
    final checkOutCount = studentRecords.where((r) => r.getStringValue('type') == 'check_out').length;
    
    return {
      'total_check_ins': checkInCount,
      'total_check_outs': checkOutCount,
      'attendance_rate': studentRecords.isNotEmpty ? (checkInCount / studentRecords.length) * 100 : 0.0,
    };
  }

  // Search attendance records
  List<RecordModel> searchAttendanceRecords(String query) {
    if (query.isEmpty) return _attendanceRecords;
    
    return _attendanceRecords.where((a) {
      final studentName = a.getStringValue('student_name');
      final type = a.getStringValue('type');
      final searchQuery = query.toLowerCase();
      
      return studentName.toLowerCase().contains(searchQuery) ||
             type.toLowerCase().contains(searchQuery);
    }).toList();
  }

  // Get attendance records by NFC card ID
  List<RecordModel> getAttendanceRecordsByNfcCard(String nfcCardId) {
    return _attendanceRecords.where((a) => a.getStringValue('nfc_card_id') == nfcCardId).toList();
  }

  // Get recent attendance records (last N records)
  List<RecordModel> getRecentAttendanceRecords(int count) {
    final sortedRecords = List<RecordModel>.from(_attendanceRecords);
    sortedRecords.sort((a, b) => b.getStringValue('created').compareTo(a.getStringValue('created')));
    return sortedRecords.take(count).toList();
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _clearError();
  }

  // Mark student as late
  Future<bool> markStudentLate(String studentId, String studentName, String reason) async {
    final record = {
      'student': studentId,
      'student_name': studentName,
      'type': 'check_in',
      'date': DateTime.now().toIso8601String().split('T')[0],
      'check_in_time': DateTime.now().toIso8601String().split('T')[1].split('.')[0],
      'status': 'late',
      'notes': '迟到: $reason',
    };

    return await createAttendanceRecord(record);
  }

  // Mark student as absent
  Future<bool> markStudentAbsent(String studentId, String studentName, String reason) async {
    final record = {
      'student': studentId,
      'student_name': studentName,
      'type': 'check_in',
      'date': DateTime.now().toIso8601String().split('T')[0],
      'check_in_time': DateTime.now().toIso8601String().split('T')[1].split('.')[0],
      'status': 'absent',
      'notes': '缺勤: $reason',
    };

    return await createAttendanceRecord(record);
  }

  // Mark student as early leave
  Future<bool> markStudentEarlyLeave(String studentId, String studentName, String reason) async {
    final record = {
      'student': studentId,
      'student_name': studentName,
      'type': 'check_out',
      'date': DateTime.now().toIso8601String().split('T')[0],
      'check_out_time': DateTime.now().toIso8601String().split('T')[1].split('.')[0],
      'status': 'early_leave',
      'notes': '早退: $reason',
    };

    return await createAttendanceRecord(record);
  }

  // Get attendance exceptions for a period
  List<RecordModel> getAttendanceExceptions(DateTime startDate, DateTime endDate) {
    return _attendanceRecords.where((record) {
      final recordDate = DateTime.tryParse(record.getStringValue('date') ?? '');
      if (recordDate == null) return false;
      
      final isInRange = recordDate.isAfter(startDate.subtract(const Duration(days: 1))) &&
                       recordDate.isBefore(endDate.add(const Duration(days: 1)));
      
      if (!isInRange) return false;
      
      final status = record.getStringValue('status') ?? '';
      return status == 'late' || status == 'absent' || status == 'early_leave';
    }).toList();
  }

  // Update attendance record
  Future<bool> updateAttendanceRecord(String recordId, Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.updateStudentAttendanceRecord(recordId, data);
      
      // Update local record
      final index = _attendanceRecords.indexWhere((r) => r.id == recordId);
      if (index != -1) {
        _attendanceRecords[index] = record;
      }
      
      notifyListeners();
      return true;
    } catch (e) {
      _setError('更新考勤记录失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Delete attendance record
  Future<bool> deleteAttendanceRecord(String recordId) async {
    _setLoading(true);
    _clearError();

    try {
      await _pocketBaseService.deleteStudentAttendanceRecord(recordId);
      
      // Remove from local records
      _attendanceRecords.removeWhere((r) => r.id == recordId);
      
      notifyListeners();
      return true;
    } catch (e) {
      _setError('删除考勤记录失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }
}
