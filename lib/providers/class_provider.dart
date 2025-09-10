import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import '../services/pocketbase_service.dart';

class ClassProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  List<RecordModel> _classes = [];

  ClassProvider() : _pocketBaseService = PocketBaseService.instance;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<RecordModel> get classes => _classes;

  // Load classes
  Future<void> loadClasses() async {
    _setLoading(true);
    _clearError();

    try {
      _classes = await _pocketBaseService.getClasses();
      // 为每个班级加载学生数量
      await _loadStudentCounts();
      notifyListeners();
    } catch (e) {
      _setError('加载班级数据失败: ${e.toString()}');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // 为每个班级加载学生数量
  Future<void> _loadStudentCounts() async {
    for (int i = 0; i < _classes.length; i++) {
      try {
        final students = await _pocketBaseService.getClassStudents(_classes[i].id);
        // 更新班级数据中的学生数量
        final updatedData = Map<String, dynamic>.from(_classes[i].data);
        updatedData['current_students'] = students.length;
        _classes[i] = RecordModel.fromJson({
          'id': _classes[i].id,
          'created': _classes[i].created,
          'updated': _classes[i].updated,
          'collectionId': _classes[i].collectionId,
          'collectionName': _classes[i].collectionName,
          'data': updatedData,
        });
      } catch (e) {
        // 如果获取学生数量失败，设置为0
        final updatedData = Map<String, dynamic>.from(_classes[i].data);
        updatedData['current_students'] = 0;
        _classes[i] = RecordModel.fromJson({
          'id': _classes[i].id,
          'created': _classes[i].created,
          'updated': _classes[i].updated,
          'collectionId': _classes[i].collectionId,
          'collectionName': _classes[i].collectionName,
          'data': updatedData,
        });
      }
    }
  }

  // Create class
  Future<bool> createClass(Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.createClass(data);
      _classes.add(record);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('创建班级失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update class
  Future<bool> updateClass(String id, Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.updateClass(id, data);
      final index = _classes.indexWhere((c) => c.id == id);
      if (index != -1) {
        _classes[index] = record;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('更新班级失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Delete class
  Future<bool> deleteClass(String id) async {
    _setLoading(true);
    _clearError();

    try {
      await _pocketBaseService.deleteClass(id);
      _classes.removeWhere((c) => c.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('删除班级失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Get classes by center
  List<RecordModel> getClassesByCenter(String center) {
    return _classes.where((c) => c.getStringValue('center') == center).toList();
  }

  // Get classes by level
  List<RecordModel> getClassesByLevel(String level) {
    return _classes.where((c) => c.getStringValue('level') == level).toList();
  }

  // Get active classes
  List<RecordModel> get activeClasses {
    return _classes.where((c) => c.getStringValue('status') == 'active').toList();
  }

  // Get classes with available spots
  List<RecordModel> get classesWithAvailableSpots {
    return _classes.where((c) {
      final currentStudents = c.getIntValue('current_students');
      final maxCapacity = c.getIntValue('max_capacity');
      return currentStudents < maxCapacity;
    }).toList();
  }

  // Get all unique centers
  List<String> get centers {
    final centerSet = _classes.map((c) => c.getStringValue('center')).toSet();
    centerSet.remove(''); // Remove empty values
    return centerSet.toList()..sort();
  }

  // Get all unique levels
  List<String> get levels {
    final levelSet = _classes.map((c) => c.getStringValue('level')).toSet();
    levelSet.remove(''); // Remove empty values
    return levelSet.toList()..sort();
  }

  // Get class by ID
  RecordModel? getClassById(String id) {
    try {
      return _classes.firstWhere((c) => c.id == id);
    } catch (e) {
      return null;
    }
  }

  // Search classes
  List<RecordModel> searchClasses(String query) {
    if (query.isEmpty) return _classes;
    
    return _classes.where((c) {
      final name = c.getStringValue('name');
      final description = c.getStringValue('description');
      final center = c.getStringValue('center');
      final level = c.getStringValue('level');
      final searchQuery = query.toLowerCase();
      
      return name.toLowerCase().contains(searchQuery) ||
             description.toLowerCase().contains(searchQuery) ||
             center.toLowerCase().contains(searchQuery) ||
             level.toLowerCase().contains(searchQuery);
    }).toList();
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

  // Class-Student association methods
  Future<List<RecordModel>> getClassStudents(String classId) async {
    _setLoading(true);
    _clearError();

    try {
      final students = await _pocketBaseService.getClassStudents(classId);
      return students;
    } catch (e) {
      _setError('加载班级学生失败: ${e.toString()}');
      return [];
    } finally {
      _setLoading(false);
    }
  }

  Future<List<RecordModel>> getUnassignedStudents() async {
    _setLoading(true);
    _clearError();

    try {
      final students = await _pocketBaseService.getUnassignedStudents();
      return students;
    } catch (e) {
      _setError('加载未分配学生失败: ${e.toString()}');
      return [];
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> assignStudentToClass(String studentId, String classId) async {
    _setLoading(true);
    _clearError();

    try {
      await _pocketBaseService.assignStudentToClass(studentId, classId);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('分配学生到班级失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> removeStudentFromClass(String studentId) async {
    _setLoading(true);
    _clearError();

    try {
      await _pocketBaseService.removeStudentFromClass(studentId);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('从班级移除学生失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> assignMultipleStudentsToClass(List<String> studentIds, String classId) async {
    _setLoading(true);
    _clearError();

    try {
      await _pocketBaseService.assignMultipleStudentsToClass(studentIds, classId);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('批量分配学生到班级失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }
}
