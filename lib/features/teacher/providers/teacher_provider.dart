import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../shared/services/pocketbase_service.dart';

class TeacherProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  List<RecordModel> _teachers = [];
  
  // 回调函数，当教师数据更新时调用
  Function()? _onDataUpdated;

  TeacherProvider() : _pocketBaseService = PocketBaseService.instance;

  // 设置数据更新回调
  void setOnDataUpdated(Function() callback) {
    _onDataUpdated = callback;
  }

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
      
      // 通知其他Provider数据已更新
      _onDataUpdated?.call();
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
      // 调试信息：检查本地教师列表
      
      // 尝试使用简化的更新方法
      try {
        final record = await _pocketBaseService.updateTeacherSimple(id, data);
        final index = _teachers.indexWhere((t) => t.id == id);
        if (index != -1) {
          _teachers[index] = record;
          notifyListeners();
        } else {
          // 如果本地没有找到，添加到列表中
          _teachers.add(record);
          notifyListeners();
        }
        return true;
      } catch (simpleError) {
        
        // 如果简化更新失败，尝试完整的更新方法
        final record = await _pocketBaseService.updateTeacher(id, data);
        final index = _teachers.indexWhere((t) => t.id == id);
        if (index != -1) {
          _teachers[index] = record;
          notifyListeners();
        } else {
          // 如果本地没有找到，添加到列表中
          _teachers.add(record);
          notifyListeners();
        }
        return true;
      }
    } catch (e) {
      // 提供更详细的错误信息
      String errorMessage = '更新教师失败: ${e.toString()}';
      
      if (e.toString().contains('404')) {
        errorMessage = '教师记录不存在 (ID: $id)。可能的原因：\n'
            '1. 记录已被删除\n'
            '2. ID 不正确\n'
            '3. 权限不足\n\n'
            '建议：刷新教师列表后重试';
      } else if (e.toString().contains('403')) {
        errorMessage = '权限不足，无法更新教师记录';
      } else if (e.toString().contains('400')) {
        errorMessage = '数据格式错误，请检查输入信息';
      }
      
      _setError(errorMessage);
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

  // 强制刷新教师数据（清除本地缓存）
  Future<void> forceRefreshTeachers() async {
    _setLoading(true);
    _clearError();

    try {
      
      // 清除本地缓存
      _teachers.clear();
      
      // 重新加载数据
      _teachers = await _pocketBaseService.getTeachers();
      
      
      if (_teachers.isEmpty) {
        _setError('服务器端没有教师记录，请检查数据或添加新教师');
      }
      
      notifyListeners();
    } catch (e) {
      _setError('强制刷新教师数据失败: ${e.toString()}');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Refresh teachers data
  Future<void> refreshTeachers() async {
    await loadTeachers();
  }

  // Check if teacher exists
  bool teacherExists(String id) {
    return _teachers.any((t) => t.id == id);
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
