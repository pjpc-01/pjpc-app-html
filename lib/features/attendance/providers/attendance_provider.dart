import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../shared/services/pocketbase_service.dart';

class AttendanceProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  List<RecordModel> _attendanceRecords = [];
  List<RecordModel> _teacherAttendanceRecords = [];
  List<Map<String, dynamic>> _attendanceReports = [];
  Map<String, dynamic> _attendanceStats = {};

  AttendanceProvider({PocketBaseService? pocketBaseService}) 
      : _pocketBaseService = pocketBaseService ?? PocketBaseService.instance;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<RecordModel> get attendanceRecords => _attendanceRecords;
  List<RecordModel> get teacherAttendanceRecords => _teacherAttendanceRecords;
  List<Map<String, dynamic>> get attendanceReports => _attendanceReports;
  Map<String, dynamic> get attendanceStats => _attendanceStats;
  Map<String, dynamic> get teacherAttendanceStats => _calculateTeacherAttendanceStats();

  // Load teacher attendance records
  Future<void> loadTeacherAttendanceRecords() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _teacherAttendanceRecords = await _pocketBaseService.getTeacherAttendanceRecords();
    } catch (e) {
      _error = '加载教师考勤记录失败: ${e.toString()}';
      _teacherAttendanceRecords = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Load detailed teacher attendance stats
  Future<void> loadDetailedTeacherAttendanceStats({
    String? teacherId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      _attendanceStats = await _pocketBaseService.getTeacherAttendanceDetailedStats(
        teacherId: teacherId,
        startDate: startDate,
        endDate: endDate,
      );
      notifyListeners();
    } catch (e) {
      _setError('加载详细考勤统计失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Load teacher attendance monthly report
  Future<List<Map<String, dynamic>>> loadTeacherAttendanceMonthlyReport({
    String? teacherId,
    required int year,
    required int month,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final report = await _pocketBaseService.getTeacherAttendanceMonthlyReport(
        teacherId: teacherId,
        year: year,
        month: month,
      );
      return report;
    } catch (e) {
      _setError('加载月度考勤报表失败: ${e.toString()}');
      return [];
    } finally {
      _setLoading(false);
    }
  }

  // Load teacher attendance anomalies
  Future<List<RecordModel>> loadTeacherAttendanceAnomalies({
    String? teacherId,
    DateTime? startDate,
    DateTime? endDate,
    String? anomalyType,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final anomalies = await _pocketBaseService.getTeacherAttendanceAnomalies(
        teacherId: teacherId,
        startDate: startDate,
        endDate: endDate,
        anomalyType: anomalyType,
      );
      return anomalies;
    } catch (e) {
      _setError('加载考勤异常记录失败: ${e.toString()}');
      return [];
    } finally {
      _setLoading(false);
    }
  }

  // Load attendance reports
  Future<void> loadAttendanceReports({String period = 'week'}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Load both student and teacher attendance records
      await loadAttendanceRecords();
      await loadTeacherAttendanceRecords();
      
      // Generate reports based on period
      _generateAttendanceReports(period);
    } catch (e) {
      _error = '加载考勤报告失败: ${e.toString()}';
      _attendanceReports = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Export attendance report
  Map<String, dynamic> exportAttendanceReport() {
    return {
      'student_records': _attendanceRecords.map((r) => r.data).toList(),
      'teacher_records': _teacherAttendanceRecords.map((r) => r.data).toList(),
      'reports': _attendanceReports,
      'stats': _attendanceStats,
      'export_date': DateTime.now().toIso8601String(),
    };
  }

  void _generateAttendanceReports(String period) {
    _attendanceReports.clear();
    
    final now = DateTime.now();
    DateTime startDate;
    
    switch (period) {
      case 'day':
        startDate = DateTime(now.year, now.month, now.day);
        break;
      case 'week':
        startDate = now.subtract(Duration(days: now.weekday - 1));
        break;
      case 'month':
        startDate = DateTime(now.year, now.month, 1);
        break;
      default:
        startDate = now.subtract(const Duration(days: 7));
    }
    
    // Generate daily reports
    for (int i = 0; i < 7; i++) {
      final date = startDate.add(Duration(days: i));
      final dayRecords = getAttendanceRecordsByDate(date);
      final teacherDayRecords = _teacherAttendanceRecords.where((r) {
        final recordDate = DateTime.tryParse(r.getStringValue('date') ?? '');
        return recordDate != null && 
               recordDate.year == date.year &&
               recordDate.month == date.month &&
               recordDate.day == date.day;
      }).toList();
      
      _attendanceReports.add({
        'date': date.toIso8601String().split('T')[0],
        'student_check_ins': dayRecords.where((r) => r.getStringValue('type') == 'check_in').length,
        'student_check_outs': dayRecords.where((r) => r.getStringValue('type') == 'check_out').length,
        'teacher_check_ins': teacherDayRecords.where((r) => r.getStringValue('type') == 'check_in').length,
        'teacher_check_outs': teacherDayRecords.where((r) => r.getStringValue('type') == 'check_out').length,
        'late_count': dayRecords.where((r) => r.getStringValue('status') == 'late').length,
        'absent_count': dayRecords.where((r) => r.getStringValue('status') == 'absent').length,
      });
    }
  }

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
      // 判断是学生还是教师考勤记录
      if (data.containsKey('student_id') || data.containsKey('student_name')) {
        // 学生考勤记录
        final record = await _pocketBaseService.createStudentAttendanceRecord(data);
        _attendanceRecords.add(record);
      } else if (data.containsKey('teacher_id') || data.containsKey('teacher_name')) {
        // 教师考勤记录
        final record = await _pocketBaseService.createTeacherAttendanceRecord(data);
        _teacherAttendanceRecords.add(record);
      } else {
        throw Exception('无法确定考勤记录类型');
      }
      
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

  Map<String, dynamic> _calculateTeacherAttendanceStats() {
    final today = DateTime.now();
    final todayRecords = _teacherAttendanceRecords.where((r) {
      final recordDate = DateTime.tryParse(r.getStringValue('date') ?? '');
      return recordDate != null && 
             recordDate.year == today.year &&
             recordDate.month == today.month &&
             recordDate.day == today.day;
    }).toList();

    final thisWeekRecords = _teacherAttendanceRecords.where((r) {
      final recordDate = DateTime.tryParse(r.getStringValue('date') ?? '');
      if (recordDate == null) return false;
      
      final weekStart = today.subtract(Duration(days: today.weekday - 1));
      return recordDate.isAfter(weekStart.subtract(const Duration(days: 1))) &&
             recordDate.isBefore(today.add(const Duration(days: 1)));
    }).toList();

    final thisMonthRecords = _teacherAttendanceRecords.where((r) {
      final recordDate = DateTime.tryParse(r.getStringValue('date') ?? '');
      if (recordDate == null) return false;
      
      return recordDate.year == today.year && recordDate.month == today.month;
    }).toList();

    final checkInToday = todayRecords.where((r) => r.getStringValue('type') == 'check_in').length;
    final checkOutToday = todayRecords.where((r) => r.getStringValue('type') == 'check_out').length;
    final checkInThisWeek = thisWeekRecords.where((r) => r.getStringValue('type') == 'check_in').length;
    final checkInThisMonth = thisMonthRecords.where((r) => r.getStringValue('type') == 'check_in').length;

    return {
      'today_check_in': checkInToday,
      'today_check_out': checkOutToday,
      'this_week_check_in': checkInThisWeek,
      'this_month_check_in': checkInThisMonth,
      'total_records': _teacherAttendanceRecords.length,
    };
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
