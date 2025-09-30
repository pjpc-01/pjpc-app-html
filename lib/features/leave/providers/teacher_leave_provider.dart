import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../shared/services/pocketbase_service.dart';

class TeacherLeaveProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  List<RecordModel> _leaveRecords = [];
  List<RecordModel> _leaveBalances = [];
  Map<String, dynamic> _leaveStats = {};

  TeacherLeaveProvider() : _pocketBaseService = PocketBaseService.instance;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<RecordModel> get leaveRecords => _leaveRecords;
  List<RecordModel> get leaveBalances => _leaveBalances;
  Map<String, dynamic> get leaveStats => _leaveStats;

  // 设置加载状态
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  // 设置错误信息
  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  // 清除错误信息
  void _clearError() {
    _error = null;
    notifyListeners();
  }

  // 加载教师请假记录
  Future<void> loadLeaveRecords({
    String? teacherId,
    String? status,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      _leaveRecords = await _pocketBaseService.getTeacherLeaveRecords(
        teacherId: teacherId,
        status: status,
        startDate: startDate,
        endDate: endDate,
      );
      notifyListeners();
    } catch (e) {
      _setError('加载请假记录失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // 加载教师请假余额
  Future<void> loadLeaveBalances({String? teacherId}) async {
    _setLoading(true);
    _clearError();

    try {
      _leaveBalances = await _pocketBaseService.getTeacherLeaveBalances(
        teacherId: teacherId,
      );
      notifyListeners();
    } catch (e) {
      _setError('加载请假余额失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // 加载请假统计
  Future<void> loadLeaveStats({
    String? teacherId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      _leaveStats = await _pocketBaseService.getTeacherLeaveStats(
        teacherId: teacherId,
        startDate: startDate,
        endDate: endDate,
      );
      notifyListeners();
    } catch (e) {
      _setError('加载请假统计失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // 创建请假记录
  Future<bool> createLeaveRecord(Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.createTeacherLeaveRecord(data);
      _leaveRecords.insert(0, record);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('创建请假记录失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 更新请假记录
  Future<bool> updateLeaveRecord(String id, Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.updateTeacherLeaveRecord(id, data);
      final index = _leaveRecords.indexWhere((r) => r.id == id);
      if (index != -1) {
        _leaveRecords[index] = record;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('更新请假记录失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 删除请假记录
  Future<bool> deleteLeaveRecord(String id) async {
    _setLoading(true);
    _clearError();

    try {
      await _pocketBaseService.deleteTeacherLeaveRecord(id);
      _leaveRecords.removeWhere((r) => r.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('删除请假记录失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 更新请假余额
  Future<bool> updateLeaveBalance(String id, Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.updateTeacherLeaveBalance(id, data);
      final index = _leaveBalances.indexWhere((r) => r.id == id);
      if (index != -1) {
        _leaveBalances[index] = record;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('更新请假余额失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 获取指定教师的请假记录
  List<RecordModel> getLeaveRecordsForTeacher(String teacherId) {
    return _leaveRecords.where((r) => r.getStringValue('teacher_id') == teacherId).toList();
  }

  // 获取指定状态的请假记录
  List<RecordModel> getLeaveRecordsByStatus(String status) {
    return _leaveRecords.where((r) => r.getStringValue('status') == status).toList();
  }

  // 获取待审批的请假记录
  List<RecordModel> getPendingLeaveRecords() {
    return getLeaveRecordsByStatus('pending');
  }

  // 获取已批准的请假记录
  List<RecordModel> getApprovedLeaveRecords() {
    return getLeaveRecordsByStatus('approved');
  }

  // 获取已拒绝的请假记录
  List<RecordModel> getRejectedLeaveRecords() {
    return getLeaveRecordsByStatus('rejected');
  }

  // 获取指定月份的请假记录
  List<RecordModel> getLeaveRecordsForMonth(DateTime month) {
    final monthStr = '${month.year}-${month.month.toString().padLeft(2, '0')}';
    return _leaveRecords.where((r) {
      final startDate = r.getStringValue('leave_start_date') ?? '';
      final endDate = r.getStringValue('leave_end_date') ?? '';
      return startDate.startsWith(monthStr) || endDate.startsWith(monthStr);
    }).toList();
  }

  // 计算请假天数
  int calculateLeaveDays(String startDate, String endDate) {
    try {
      final start = DateTime.parse(startDate);
      final end = DateTime.parse(endDate);
      return end.difference(start).inDays + 1;
    } catch (e) {
      return 0;
    }
  }

  // 获取请假记录统计
  Map<String, int> getLeaveSummary() {
    int totalLeaves = _leaveRecords.length;
    int pendingLeaves = getPendingLeaveRecords().length;
    int approvedLeaves = getApprovedLeaveRecords().length;
    int rejectedLeaves = getRejectedLeaveRecords().length;
    
    int totalLeaveDays = 0;
    for (final record in _leaveRecords) {
      final startDate = record.getStringValue('leave_start_date') ?? '';
      final endDate = record.getStringValue('leave_end_date') ?? '';
      totalLeaveDays += calculateLeaveDays(startDate, endDate);
    }
    
    return {
      'total_leaves': totalLeaves,
      'pending_leaves': pendingLeaves,
      'approved_leaves': approvedLeaves,
      'rejected_leaves': rejectedLeaves,
      'total_leave_days': totalLeaveDays,
    };
  }

  // 检查是否有足够的请假余额
  bool hasEnoughLeaveBalance(String teacherId, int requestedDays, String leaveType) {
    final balance = _leaveBalances.firstWhere(
      (b) => b.getStringValue('teacher_id') == teacherId && b.getStringValue('leave_type') == leaveType,
      orElse: () => RecordModel(),
    );
    
    if (balance.id.isEmpty) return false;
    
    final availableDays = balance.getIntValue('available_days') ?? 0;
    return availableDays >= requestedDays;
  }

  // 刷新所有数据
  Future<void> refreshAll() async {
    await loadLeaveRecords();
    await loadLeaveBalances();
    await loadLeaveStats();
  }

  // 清除所有数据
  void clearAll() {
    _leaveRecords.clear();
    _leaveBalances.clear();
    _leaveStats.clear();
    _error = null;
    notifyListeners();
  }
}
