import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import '../services/pocketbase_service.dart';

class TeacherProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  List<RecordModel> _teachers = [];

  TeacherProvider() : _pocketBaseService = PocketBaseService.instance;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<RecordModel> get teachers => _teachers;

  // Load teachers
  Future<void> loadTeachers() async {
    _setLoading(true);
    _clearError();

    try {
      _teachers = await _pocketBaseService.getTeachers();
      
      // 打印教师详细信息
      for (int i = 0; i < _teachers.length; i++) {
        final teacher = _teachers[i];
      }
      
      notifyListeners();
    } catch (e) {
      _setError('加载教师数据失败: ${e.toString()}');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Create teacher
  Future<bool> createTeacher(Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.createTeacher(data);
      _teachers.add(record);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('创建教师失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update teacher
  Future<bool> updateTeacher(String id, Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.updateTeacher(id, data);
      final index = _teachers.indexWhere((t) => t.id == id);
      if (index != -1) {
        _teachers[index] = record;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('更新教师失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Delete teacher
  Future<bool> deleteTeacher(String id) async {
    _setLoading(true);
    _clearError();

    try {
      await _pocketBaseService.deleteTeacher(id);
      _teachers.removeWhere((t) => t.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('删除教师失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Get teacher by ID
  RecordModel? getTeacherById(String id) {
    try {
      return _teachers.firstWhere((t) => t.id == id);
    } catch (e) {
      return null;
    }
  }

  // Get active teachers
  List<RecordModel> get activeTeachers {
    return _teachers.where((t) => t.getStringValue('status') == 'active').toList();
  }

  // Get teachers by permission level
  List<RecordModel> getTeachersByPermission(String permission) {
    return _teachers.where((t) => t.getStringValue('permissions') == permission).toList();
  }

  // Search teachers
  List<RecordModel> searchTeachers(String query) {
    if (query.isEmpty) return _teachers;
    
    final lowercaseQuery = query.toLowerCase();
    return _teachers.where((teacher) {
      final name = teacher.getStringValue('name') ?? '';
      final email = teacher.getStringValue('email') ?? '';
      final phone = teacher.getStringValue('phone') ?? '';
      final department = teacher.getStringValue('department') ?? '';
      final position = teacher.getStringValue('position') ?? '';
      
      return name.toLowerCase().contains(lowercaseQuery) ||
             email.toLowerCase().contains(lowercaseQuery) ||
             phone.toLowerCase().contains(lowercaseQuery) ||
             department.toLowerCase().contains(lowercaseQuery) ||
             position.toLowerCase().contains(lowercaseQuery);
    }).toList();
  }

  // Filter teachers by status
  List<RecordModel> filterTeachersByStatus(String status) {
    if (status == 'all') return _teachers;
    return _teachers.where((t) => t.getStringValue('status') == status).toList();
  }

  // Filter teachers by department
  List<RecordModel> filterTeachersByDepartment(String department) {
    if (department == 'all') return _teachers;
    return _teachers.where((t) => t.getStringValue('department') == department).toList();
  }

  // Get unique departments
  List<String> get departments {
    final deptSet = <String>{};
    for (final teacher in _teachers) {
      final dept = teacher.getStringValue('department');
      if (dept != null && dept.isNotEmpty) {
        deptSet.add(dept);
      }
    }
    return deptSet.toList()..sort();
  }

  // Get statistics
  Map<String, int> get statistics {
    final stats = <String, int>{
      'total': _teachers.length,
      'active': 0,
      'inactive': 0,
      'normal_teacher': 0,
      'senior_teacher': 0,
    };

    for (final teacher in _teachers) {
      final status = teacher.getStringValue('status');
      final permission = teacher.getStringValue('permissions');
      
      if (status == 'active') {
        stats['active'] = stats['active']! + 1;
      } else if (status == 'inactive') {
        stats['inactive'] = stats['inactive']! + 1;
      }
      
      if (permission == 'normal_teacher') {
        stats['normal_teacher'] = stats['normal_teacher']! + 1;
      } else if (permission == 'senior_teacher') {
        stats['senior_teacher'] = stats['senior_teacher']! + 1;
      }
    }

    return stats;
  }

  // Private methods
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
}