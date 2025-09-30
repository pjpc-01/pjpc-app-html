import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../shared/services/pocketbase_service.dart';
import '../models/schedule_model.dart';

class ScheduleProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  List<ScheduleModel> _schedules = [];
  Map<String, List<ScheduleModel>> _schedulesByDate = {};
  Map<String, List<ScheduleModel>> _schedulesByTeacher = {};

  ScheduleProvider({PocketBaseService? pocketBaseService}) 
      : _pocketBaseService = pocketBaseService ?? PocketBaseService.instance;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<ScheduleModel> get schedules => _schedules;
  Map<String, List<ScheduleModel>> get schedulesByDate => _schedulesByDate;
  Map<String, List<ScheduleModel>> get schedulesByTeacher => _schedulesByTeacher;

  // 加载所有排班记录
  Future<void> loadSchedules({
    String? teacherId,
    String? classId,
    String? status,
    String? scheduleType,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final records = await _pocketBaseService.getSchedules(
        teacherId: teacherId,
        classId: classId,
        status: status,
        scheduleType: scheduleType,
        startDate: startDate,
        endDate: endDate,
      );
      
      _schedules = records.map((record) => ScheduleModel.fromRecord(record)).toList();
      _organizeSchedules();
      notifyListeners();
    } catch (e) {
      _setError('加载排班记录失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // 按日期和按教师组织排班数据
  void _organizeSchedules() {
    try {
      _schedulesByDate.clear();
      _schedulesByTeacher.clear();

      for (final schedule in _schedules) {
        // 按日期组织
        final dateKey = schedule.date.toIso8601String().split('T')[0];
        if (!_schedulesByDate.containsKey(dateKey)) {
          _schedulesByDate[dateKey] = [];
        }
        _schedulesByDate[dateKey]!.add(schedule);

        // 按教师组织
        if (!_schedulesByTeacher.containsKey(schedule.teacherId)) {
          _schedulesByTeacher[schedule.teacherId] = [];
        }
        _schedulesByTeacher[schedule.teacherId]!.add(schedule);
      }
    } catch (e) {
      print('Error organizing schedules: $e');
      // 如果组织数据失败，至少确保列表是空的
      _schedulesByDate = {};
      _schedulesByTeacher = {};
    }
  }

  // 创建排班记录
  Future<bool> createSchedule(Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.createSchedule(data);
      final schedule = ScheduleModel.fromRecord(record);
      _schedules.add(schedule);
      _organizeSchedules();
      notifyListeners();
      return true;
    } catch (e) {
      _setError('创建排班记录失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 更新排班记录
  Future<bool> updateSchedule(String scheduleId, Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.updateSchedule(scheduleId, data);
      final schedule = ScheduleModel.fromRecord(record);
      
      final index = _schedules.indexWhere((s) => s.id == scheduleId);
      if (index != -1) {
        _schedules[index] = schedule;
        _organizeSchedules();
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('更新排班记录失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 删除排班记录
  Future<bool> deleteSchedule(String scheduleId) async {
    _setLoading(true);
    _clearError();

    try {
      await _pocketBaseService.deleteSchedule(scheduleId);
      _schedules.removeWhere((s) => s.id == scheduleId);
      _organizeSchedules();
      notifyListeners();
      return true;
    } catch (e) {
      _setError('删除排班记录失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 获取指定教师的排班
  List<ScheduleModel> getTeacherSchedules(String teacherId) {
    return _schedulesByTeacher[teacherId] ?? [];
  }

  // 获取指定日期的排班
  List<ScheduleModel> getDateSchedules(DateTime date) {
    final dateKey = date.toIso8601String().split('T')[0];
    return _schedulesByDate[dateKey] ?? [];
  }

  // 获取本周排班统计
  Map<String, dynamic> getWeeklyStats(String teacherId) {
    final teacherSchedules = getTeacherSchedules(teacherId);
    final activeSchedules = teacherSchedules.where((s) => s.status != 'cancelled').toList();
    
    double totalWorkHours = 0.0;
    int totalShifts = activeSchedules.length;
    
    for (final schedule in activeSchedules) {
      totalWorkHours += schedule.workHours;
    }

    return {
      'total_shifts': totalShifts,
      'total_work_hours': totalWorkHours,
      'average_work_hours_per_day': totalShifts > 0 ? totalWorkHours / totalShifts : 0.0,
      'schedules_by_date': _schedulesByDate,
    };
  }

  // 检查排班冲突
  bool hasScheduleConflict(String teacherId, DateTime date, String startTime, String endTime, {String? excludeId}) {
    final teacherSchedules = getTeacherSchedules(teacherId)
        .where((s) => s.date.year == date.year && s.date.month == date.month && s.date.day == date.day && s.id != excludeId)
        .toList();

    for (final schedule in teacherSchedules) {
      if (_isTimeOverlap(startTime, endTime, schedule.startTime, schedule.endTime)) {
        return true;
      }
    }
    return false;
  }

  // 检查时间重叠
  bool _isTimeOverlap(String start1, String end1, String start2, String end2) {
    try {
      final s1 = DateTime.parse('2024-01-01 $start1:00');
      final e1 = DateTime.parse('2024-01-01 $end1:00');
      final s2 = DateTime.parse('2024-01-01 $start2:00');
      final e2 = DateTime.parse('2024-01-01 $end2:00');

      return s1.isBefore(e2) && s2.isBefore(e1);
    } catch (e) {
      return false;
    }
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
  }
}