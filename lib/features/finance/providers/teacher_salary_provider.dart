import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../shared/services/pocketbase_service.dart';

class TeacherSalaryProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  List<RecordModel> _salaryRecords = [];
  List<RecordModel> _salaryStructures = [];
  Map<String, dynamic> _salaryStats = {};

  TeacherSalaryProvider() : _pocketBaseService = PocketBaseService.instance;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<RecordModel> get salaryRecords => _salaryRecords;
  List<RecordModel> get salaryStructures => _salaryStructures;
  Map<String, dynamic> get salaryStats => _salaryStats;

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

  // 加载教师薪资记录
  Future<void> loadSalaryRecords({
    String? teacherId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      // 添加调试信息
      print('=== 薪资记录加载调试 ===');
      print('教师ID: $teacherId');
      print('开始日期: $startDate');
      print('结束日期: $endDate');
      print('认证状态: ${_pocketBaseService.isAuthenticated}');
      print('当前用户: ${_pocketBaseService.currentUser?.id}');
      
      // 检查认证状态
      if (!_pocketBaseService.isAuthenticated) {
        throw Exception('用户未认证，请先登录');
      }
      
      // 检查服务连接
      final isConnected = await _pocketBaseService.testConnection();
      if (!isConnected) {
        throw Exception('无法连接到服务器，请检查网络连接');
      }
      
      _salaryRecords = await _pocketBaseService.getTeacherSalaryRecords(
        teacherId: teacherId,
        startDate: startDate,
        endDate: endDate,
      );
      
      print('成功加载薪资记录: ${_salaryRecords.length} 条');
      notifyListeners();
    } catch (e) {
      print('薪资记录加载失败: $e');
      _setError('加载薪资记录失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // 加载教师薪资结构
  Future<void> loadSalaryStructures({String? teacherId}) async {
    _setLoading(true);
    _clearError();

    try {
      _salaryStructures = await _pocketBaseService.getTeacherSalaryStructures(
        teacherId: teacherId,
      );
      notifyListeners();
    } catch (e) {
      _setError('加载薪资结构失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // 加载薪资统计
  Future<void> loadSalaryStats({
    String? teacherId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      _salaryStats = await _pocketBaseService.getTeacherSalaryStats(
        teacherId: teacherId,
        startDate: startDate,
        endDate: endDate,
      );
      notifyListeners();
    } catch (e) {
      _setError('加载薪资统计失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // 创建薪资记录
  Future<bool> createSalaryRecord(Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.createTeacherSalaryRecord(data);
      _salaryRecords.insert(0, record);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('创建薪资记录失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 更新薪资记录
  Future<bool> updateSalaryRecord(String id, Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.updateTeacherSalaryRecord(id, data);
      final index = _salaryRecords.indexWhere((r) => r.id == id);
      if (index != -1) {
        _salaryRecords[index] = record;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('更新薪资记录失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 删除薪资记录
  Future<bool> deleteSalaryRecord(String id) async {
    _setLoading(true);
    _clearError();

    try {
      await _pocketBaseService.deleteTeacherSalaryRecord(id);
      _salaryRecords.removeWhere((r) => r.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('删除薪资记录失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 创建薪资结构
  Future<bool> createSalaryStructure(Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.createTeacherSalaryStructure(data);
      _salaryStructures.insert(0, record);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('创建薪资结构失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 更新薪资结构
  Future<bool> updateSalaryStructure(String id, Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.updateTeacherSalaryStructure(id, data);
      final index = _salaryStructures.indexWhere((r) => r.id == id);
      if (index != -1) {
        _salaryStructures[index] = record;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('更新薪资结构失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 获取指定教师的薪资记录
  List<RecordModel> getSalaryRecordsForTeacher(String teacherId) {
    return _salaryRecords.where((r) => r.getStringValue('teacher_id') == teacherId).toList();
  }

  // 获取指定月份的薪资记录
  List<RecordModel> getSalaryRecordsForMonth(DateTime month) {
    final monthStr = '${month.year}-${month.month.toString().padLeft(2, '0')}';
    return _salaryRecords.where((r) {
      final salaryDate = r.getStringValue('salary_date') ?? '';
      return salaryDate.startsWith(monthStr);
    }).toList();
  }

  // 获取薪资记录统计
  Map<String, double> getSalarySummary() {
    double totalSalary = 0.0;
    double totalBonus = 0.0;
    double totalDeduction = 0.0;
    
    for (final record in _salaryRecords) {
      totalSalary += record.getDoubleValue('base_salary') ?? 0.0;
      totalBonus += record.getDoubleValue('bonus') ?? 0.0;
      totalDeduction += record.getDoubleValue('deduction') ?? 0.0;
    }
    
    return {
      'total_salary': totalSalary,
      'total_bonus': totalBonus,
      'total_deduction': totalDeduction,
      'net_salary': totalSalary + totalBonus - totalDeduction,
    };
  }

  // 刷新所有数据
  Future<void> refreshAll() async {
    await loadSalaryRecords();
    await loadSalaryStructures();
    await loadSalaryStats();
  }

  // 清除所有数据
  void clearAll() {
    _salaryRecords.clear();
    _salaryStructures.clear();
    _salaryStats.clear();
    _error = null;
    notifyListeners();
  }
}
