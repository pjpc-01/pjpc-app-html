import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import '../services/pocketbase_service.dart';

class StudentProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  List<RecordModel> _students = [];
  List<RecordModel> _feeItems = [];
  List<RecordModel> _studentFees = [];
  Map<String, bool> _expandedCategories = {};

  StudentProvider({PocketBaseService? pocketBaseService}) 
      : _pocketBaseService = pocketBaseService ?? PocketBaseService.instance;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<RecordModel> get students => _students;
  List<RecordModel> get feeItems => _feeItems;
  List<RecordModel> get studentFees => _studentFees;
  Map<String, bool> get expandedCategories => _expandedCategories;

  // Load students
  Future<void> loadStudents() async {
    _setLoading(true);
    _clearError();

    try {
      // 检查认证状态
      if (!_pocketBaseService.isAuthenticated) {
        throw Exception('用户未认证，请先登录');
      }
      
      print('🔐 User is authenticated, loading students...');
      _students = await _pocketBaseService.getStudents(perPage: 200);
      print('✅ Loaded ${_students.length} students from PocketBase');
      notifyListeners();
    } catch (e) {
      print('❌ Error loading students: $e');
      _setError('加载学生数据失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Load fee items
  Future<void> loadFeeItems() async {
    _setLoading(true);
    _clearError();

    try {
      _feeItems = await _pocketBaseService.getFeeItems();
      notifyListeners();
    } catch (e) {
      _setError('加载费用项目失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Load student fees
  Future<void> loadStudentFees() async {
    _setLoading(true);
    _clearError();

    try {
      _studentFees = await _pocketBaseService.getStudentFees();
      notifyListeners();
    } catch (e) {
      _setError('加载学生费用失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Create student
  Future<bool> createStudent(Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.createStudent(data);
      _students.add(record);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('创建学生失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update student
  Future<bool> updateStudent(String id, Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.updateStudent(id, data);
      final index = _students.indexWhere((s) => s.id == id);
      if (index != -1) {
        _students[index] = record;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('更新学生失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Delete student
  Future<bool> deleteStudent(String id) async {
    _setLoading(true);
    _clearError();

    try {
      await _pocketBaseService.deleteStudent(id);
      _students.removeWhere((s) => s.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('删除学生失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Assign fee to student
  Future<bool> assignFeeToStudent(String studentId, String feeItemId) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.assignFeeToStudent(studentId, feeItemId);
      _studentFees.add(record);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('分配费用失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Remove fee from student
  Future<bool> removeFeeFromStudent(String studentFeeId) async {
    _setLoading(true);
    _clearError();

    try {
      await _pocketBaseService.removeFeeFromStudent(studentFeeId);
      _studentFees.removeWhere((sf) => sf.id == studentFeeId);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('移除费用失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Toggle category expansion
  void toggleCategory(String category) {
    _expandedCategories[category] = !(_expandedCategories[category] ?? false);
    notifyListeners();
  }

  // Get students by grade/standard
  List<RecordModel> getStudentsByGrade(String grade) {
    return _students.where((s) => s.getStringValue('standard') == grade).toList();
  }

  // Get students by center
  List<RecordModel> getStudentsByCenter(String center) {
    return _students.where((s) => s.getStringValue('center') == center).toList();
  }

  // Get active students only
  List<RecordModel> get activeStudents {
    return _students.where((s) => s.getStringValue('status') == 'active').toList();
  }

  // Get students with NFC cards
  List<RecordModel> get studentsWithCards {
    return _students.where((s) => 
      s.getStringValue('cardNumber').isNotEmpty && 
      s.getStringValue('cardStatus') == 'active'
    ).toList();
  }

  // Get all unique centers
  List<String> get centers {
    final centerSet = _students.map((s) => s.getStringValue('center')).toSet();
    centerSet.remove(''); // Remove empty values
    return centerSet.toList()..sort();
  }

  // Get all unique standards/grades
  List<String> get standards {
    final standardSet = _students.map((s) => s.getStringValue('standard')).toSet();
    standardSet.remove(''); // Remove empty values
    return standardSet.toList()..sort();
  }

  // Get primary students (grades 1-6)
  List<RecordModel> get primaryStudents {
    return _students.where((s) {
      final grade = s.getStringValue('standard');
      return grade.contains('一年级') || grade.contains('二年级') || grade.contains('三年级') || 
             grade.contains('四年级') || grade.contains('五年级') || grade.contains('六年级');
    }).toList();
  }

  // Get secondary students (grades 7-12)
  List<RecordModel> get secondaryStudents {
    return _students.where((s) {
      final grade = s.getStringValue('standard');
      return grade.contains('中一') || grade.contains('中二') || grade.contains('中三') || 
             grade.contains('中四') || grade.contains('中五') || grade.contains('中六');
    }).toList();
  }

  // Get fee items by category
  List<RecordModel> getFeeItemsByCategory(String category) {
    return _feeItems.where((f) => f.getStringValue('category') == category).toList();
  }

  // Get all categories
  List<String> get categories {
    final categories = _feeItems.map((f) => f.getStringValue('category')).toSet().toList();
    categories.sort();
    return categories;
  }

  // Get student fees for a specific student
  List<RecordModel> getStudentFeesForStudent(String studentId) {
    return _studentFees.where((sf) => sf.getStringValue('student') == studentId).toList();
  }

  // Check if fee is assigned to student
  bool isFeeAssignedToStudent(String studentId, String feeItemId) {
    return _studentFees.any((sf) => 
      sf.getStringValue('student') == studentId && 
      sf.getStringValue('fee_item') == feeItemId
    );
  }

  // Get total fee amount for student
  double getTotalFeeForStudent(String studentId) {
    final studentFees = getStudentFeesForStudent(studentId);
    double total = 0.0;
    
    for (final studentFee in studentFees) {
      final feeItemId = studentFee.getStringValue('fee_item');
      final feeItem = _feeItems.firstWhere(
        (f) => f.id == feeItemId,
        orElse: () => RecordModel(),
      );
      if (feeItem.id.isNotEmpty) {
        total += feeItem.getDoubleValue('amount');
      }
    }
    
    return total;
  }

  // Get student by ID
  RecordModel? getStudentById(String id) {
    try {
      return _students.firstWhere((s) => s.id == id);
    } catch (e) {
      return null;
    }
  }

  // Search students
  List<RecordModel> searchStudents(String query) {
    if (query.isEmpty) return _students;
    
    return _students.where((s) {
      final name = s.getStringValue('student_name');
      final studentId = s.getStringValue('student_id');
      final standard = s.getStringValue('standard');
      final searchQuery = query.toLowerCase();
      
      return name.toLowerCase().contains(searchQuery) ||
             studentId.toLowerCase().contains(searchQuery) ||
             standard.toLowerCase().contains(searchQuery);
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
}
