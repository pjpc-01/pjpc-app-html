import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import 'package:provider/provider.dart';
import '../../../shared/services/pocketbase_service.dart';
import '../../../shared/services/error_handler_service.dart';
import '../../../shared/services/realtime_service.dart' as app_realtime;
import '../../auth/providers/auth_provider.dart';
import '../../teacher/providers/teacher_provider.dart';

class StudentProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  AuthProvider? _authProvider;
  BuildContext? _context;
  
  bool _isLoading = false;
  String? _error;
  List<RecordModel> _students = [];
  List<RecordModel> _feeItems = [];
  List<RecordModel> _studentFees = [];
  Map<String, bool> _expandedCategories = {};

  StudentProvider({PocketBaseService? pocketBaseService, AuthProvider? authProvider}) 
      : _pocketBaseService = pocketBaseService ?? PocketBaseService.instance,
        _authProvider = authProvider {
    _setupRealtimeUpdates();
  }
  
  /// 设置AuthProvider引用
  void setAuthProvider(AuthProvider authProvider) {
    _authProvider = authProvider;
  }
  
  void setContext(BuildContext context) {
    _context = context;
  }
  
  /// 当教师数据更新时重新过滤学生
  void onTeacherDataUpdated() {
    notifyListeners();
  }

  
  /// 设置实时更新
  void _setupRealtimeUpdates() {
    try {
      // 订阅学生数据更新
      app_realtime.RealtimeService.instance.subscribeToStudents((data) {
        _handleStudentUpdate(data);
      });
      
      // 订阅费用项目更新
      app_realtime.RealtimeService.instance.subscribeToFeeItems((data) {
        _handleFeeItemUpdate(data);
      });
      
      // 订阅学生费用更新
      app_realtime.RealtimeService.instance.subscribeToStudentFees((data) {
        _handleStudentFeeUpdate(data);
      });
    } catch (e) {
    }
  }
  
  /// 清理实时更新
  void _cleanupRealtimeUpdates() {
    try {
      app_realtime.RealtimeService.instance.unsubscribeFromStudents();
      app_realtime.RealtimeService.instance.unsubscribeFromFeeItems();
      app_realtime.RealtimeService.instance.unsubscribeFromStudentFees();
    } catch (e) {
    }
  }
  
  /// 处理学生数据更新
  void _handleStudentUpdate(Map<String, dynamic> data) {
    // 这里可以添加具体的更新逻辑
    // 例如：更新本地学生列表
    // 可以在这里触发数据刷新
    loadStudents(useCache: false);
  }
  
  /// 处理费用项目更新
  void _handleFeeItemUpdate(Map<String, dynamic> data) {
    loadFeeItems();
  }
  
  /// 处理学生费用更新
  void _handleStudentFeeUpdate(Map<String, dynamic> data) {
    loadStudentFees();
  }

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<RecordModel> get students => _students;
  List<RecordModel> get feeItems => _feeItems;
  List<RecordModel> get studentFees => _studentFees;
  Map<String, bool> get expandedCategories => _expandedCategories;

  // Load students
  Future<void> loadStudents({bool useCache = true}) async {
    _setLoading(true);
    _clearError();

    try {
      // 检查认证状态
      if (!_pocketBaseService.isAuthenticated) {
        throw Exception('用户未认证，请先登录');
      }
      
      _students = await _pocketBaseService.getStudents(
        perPage: 200,
        useCache: useCache,
      );
      notifyListeners();
    } catch (e) {
      _setError(ErrorHandlerService.getErrorMessage(e));
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

  /// 根据用户角色过滤学生数据
  List<RecordModel> getFilteredStudentsByRole() {
    if (_authProvider == null) return _students;
    
    // 管理员可以查看所有学生
    if (_authProvider!.isAdmin) {
      return _students;
    }
    
    // 老师只能查看自己班级的学生
    if (_authProvider!.isTeacher) {
      return _getStudentsForTeacher();
    }
    
    // 家长只能查看自己的孩子
    if (_authProvider!.isParent) {
      return _getStudentsForParent();
    }
    
    // 其他角色返回空列表
    return [];
  }

  /// 获取老师班级的学生
  List<RecordModel> _getStudentsForTeacher() {
    if (_authProvider?.userProfile == null) return [];
    
    // 获取当前用户的邮箱，用于查找对应的教师记录
    if (_authProvider?.userProfile == null) {
      return [];
    }
    
    final userEmail = _authProvider!.userProfile!.getStringValue('email') ?? '';
    if (userEmail.isEmpty) {
      return [];
    }
    
    
    // 通过邮箱查找对应的教师记录
    final teacherRecord = _getTeacherByEmail(userEmail);
    if (teacherRecord == null) {
      return [];
    }
    
    
    // 获取老师负责的班级
    final teacherClasses = teacherRecord.getStringValue('assigned_classes') ?? '';
    if (teacherClasses.isEmpty) {
      return [];
    }
    
    
    // 获取老师分配的中心（relation字段）
    final teacherCenterId = teacherRecord.getStringValue('center_assignment') ?? '';
    
    // 解析班级列表（假设用逗号分隔）
    final classList = teacherClasses.split(',').map((c) => c.trim()).toList();
    
    
    final filteredStudents = _students.where((student) {
      final studentClass = student.getStringValue('standard');
      final studentCenter = student.getStringValue('center');
      
      // 检查班级匹配
      final classMatch = classList.contains(studentClass);
      
      if (classMatch) {
      }
      
      // 如果老师有分配中心，还要检查中心匹配
      // 注意：center_assignment是relation字段，存储的是中心记录的ID
      // 而学生的center字段是select类型，存储的是中心名称/代码
      if (teacherCenterId.isNotEmpty) {
        // 这里需要根据中心ID获取中心名称进行匹配
        // 暂时先跳过中心匹配，只按班级匹配
        // TODO: 实现中心ID到中心名称的转换逻辑
        return classMatch;
      }
      
      return classMatch;
    }).toList();
    
    return filteredStudents;
  }

  /// 通过邮箱获取教师记录
  RecordModel? _getTeacherByEmail(String email) {
    if (_context == null) {
      return null;
    }
    
    try {
      // 从教师提供者获取教师数据
      final teacherProvider = Provider.of<TeacherProvider>(_context!, listen: false);
      
      if (teacherProvider.teachers.isEmpty) {
        return null;
      }
      
      
      for (final teacher in teacherProvider.teachers) {
        final teacherEmail = teacher.getStringValue('email');
        if (teacherEmail == email) {
          return teacher;
        }
      }
      
      return null;
    } catch (e) {
      // 如果无法获取TeacherProvider，返回null而不是抛出异常
      return null;
    }
  }

  /// 获取家长的孩子
  List<RecordModel> _getStudentsForParent() {
    if (_authProvider?.userProfile == null) return [];
    
    // 获取家长的邮箱或手机号
    final parentEmail = _authProvider!.userProfile!.getStringValue('email') ?? '';
    final parentPhone = _authProvider!.userProfile!.getStringValue('phone') ?? '';
    
    return _students.where((student) {
      final studentParentEmail = student.getStringValue('parent_email') ?? '';
      final studentParentPhone = student.getStringValue('parent_phone') ?? '';
      
      return studentParentEmail == parentEmail || studentParentPhone == parentPhone;
    }).toList();
  }

  /// 检查用户是否有权限查看特定学生
  bool canViewStudent(String studentId) {
    if (_authProvider == null) return false;
    
    // 管理员可以查看所有学生
    if (_authProvider!.isAdmin) return true;
    
    // 老师只能查看自己班级的学生
    if (_authProvider!.isTeacher) {
      final filteredStudents = _getStudentsForTeacher();
      return filteredStudents.any((s) => s.id == studentId);
    }
    
    // 家长只能查看自己的孩子
    if (_authProvider!.isParent) {
      final filteredStudents = _getStudentsForParent();
      return filteredStudents.any((s) => s.id == studentId);
    }
    
    return false;
  }

  /// 检查用户是否有权限编辑特定学生
  bool canEditStudent(String studentId) {
    if (_authProvider == null) return false;
    
    // 只有管理员可以编辑学生信息
    if (_authProvider!.isAdmin) return true;
    
    // 教师、家长和会计都不能编辑学生信息
    return false;
  }

  /// 检查用户是否有权限添加学生
  bool canAddStudent() {
    if (_authProvider == null) return false;
    
    // 只有管理员可以添加学生
    return _authProvider!.isAdmin;
  }

  /// 检查用户是否有权限删除学生
  bool canDeleteStudent(String studentId) {
    if (_authProvider == null) return false;
    
    // 只有管理员可以删除学生
    return _authProvider!.isAdmin;
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

  // Get student by NFC URL
  Future<RecordModel?> getStudentByNfcUrl(String nfcUrl) async {
    try {
      return await _pocketBaseService.getStudentByNfcUrl(nfcUrl);
    } catch (e) {
      return null;
    }
  }
  
  @override
  void dispose() {
    _cleanupRealtimeUpdates();
    super.dispose();
  }
}
