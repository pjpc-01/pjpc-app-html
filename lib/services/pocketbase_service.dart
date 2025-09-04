import 'package:pocketbase/pocketbase.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PocketBaseService {
  late PocketBase pb;
  static const String _baseUrlKey = 'pocketbase_url';
  static const String _defaultUrl = 'http://pjpc.tplinkdns.com:8090';
  bool _isInitialized = false;
  
  // 单例模式
  static PocketBaseService? _instance;
  static PocketBaseService get instance {
    _instance ??= PocketBaseService._internal();
    return _instance!;
  }
  
  PocketBaseService._internal() {
    _initializePocketBase();
  }
  
  // 私有构造函数，强制使用单例
  PocketBaseService() {
    throw UnsupportedError('Use PocketBaseService.instance instead of PocketBaseService()');
  }

  void _initializePocketBase() {
    // 直接使用默认URL初始化，不等待SharedPreferences
    pb = PocketBase(_defaultUrl);
    print('PocketBase initialized with URL: $_defaultUrl');
    _isInitialized = true;
    
    // 在后台清除可能存在的错误URL缓存
    _clearCachedUrl();
  }
  
  Future<void> _clearCachedUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_baseUrlKey);
      print('Cleared cached URL');
    } catch (e) {
      print('Error clearing cached URL: $e');
    }
  }

  Future<void> updateBaseUrl(String url) async {
    pb = PocketBase(url);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_baseUrlKey, url);
    print('PocketBase URL updated to: $url');
  }

  Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_baseUrlKey) ?? _defaultUrl;
  }

  // 强制重置到默认URL
  Future<void> resetToDefaultUrl() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_baseUrlKey);
    pb = PocketBase(_defaultUrl);
    print('PocketBase reset to default URL: $_defaultUrl');
  }

  // Test connection to server
  Future<bool> testConnection() async {
    try {
      print('Testing connection to: ${pb.baseUrl}');
      await pb.health.check();
      print('Connection test successful');
      return true;
    } catch (e) {
      print('Connection test failed: $e');
      return false;
    }
  }

  // Authentication methods
  Future<RecordAuth> login(String email, String password) async {
    try {
      print('Attempting login for: $email');
      print('PocketBase URL: ${pb.baseUrl}');
      
      // First test connection
      final isConnected = await testConnection();
      if (!isConnected) {
        throw Exception('无法连接到服务器，请检查网络连接或服务器地址');
      }
      
      final authData = await pb.collection('users').authWithPassword(email, password);
      print('Login successful for: $email');
      return authData;
    } catch (e) {
      print('Login error: $e');
      
      // Provide more specific error messages
      if (e.toString().contains('Failed to fetch') || e.toString().contains('ClientException')) {
        throw Exception('网络连接失败，请检查：\n1. 网络连接是否正常\n2. 服务器地址是否正确\n3. 防火墙设置');
      } else if (e.toString().contains('404')) {
        throw Exception('服务器未找到，请检查服务器地址');
      } else if (e.toString().contains('401') || e.toString().contains('403')) {
        throw Exception('用户名或密码错误');
      } else {
        throw Exception('登录失败: $e');
      }
    }
  }

  Future<void> logout() async {
    pb.authStore.clear();
  }

  Future<RecordModel> register({
    required String email,
    required String password,
    required String passwordConfirm,
    required String name,
    required String role,
  }) async {
    try {
      final record = await pb.collection('users').create(body: {
        'email': email,
        'password': password,
        'passwordConfirm': passwordConfirm,
        'name': name,
        'role': role,
        'status': 'pending',
      });
      return record;
    } catch (e) {
      throw Exception('Registration failed: ${e.toString()}');
    }
  }

  // Student management
  Future<List<RecordModel>> getStudents({int page = 1, int perPage = 200}) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      print('🔐 User authenticated: ${pb.authStore.record?.getStringValue('email')}');
      print('🔐 Auth token valid: ${pb.authStore.isValid}');
      
      final result = await pb.collection('students').getList(
        page: page,
        perPage: perPage,
        sort: 'student_name', // 使用student_name排序，这个字段存在
      );
      print('✅ Successfully fetched ${result.items.length} students');
      return result.items;
    } catch (e) {
      print('❌ Error fetching students: $e');
      throw Exception('Failed to fetch students: ${e.toString()}');
    }
  }

  Future<RecordModel> createStudent(Map<String, dynamic> data) async {
    try {
      final record = await pb.collection('students').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create student: ${e.toString()}');
    }
  }

  Future<RecordModel> updateStudent(String id, Map<String, dynamic> data) async {
    try {
      final record = await pb.collection('students').update(id, body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to update student: ${e.toString()}');
    }
  }

  Future<void> deleteStudent(String id) async {
    try {
      await pb.collection('students').delete(id);
    } catch (e) {
      throw Exception('Failed to delete student: ${e.toString()}');
    }
  }

  // Fee management
  Future<List<RecordModel>> getFeeItems({int page = 1, int perPage = 200}) async {
    try {
      final result = await pb.collection('fee_items').getList(
        page: page,
        perPage: perPage,
        sort: 'category,name',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch fee items: ${e.toString()}');
    }
  }

  Future<List<RecordModel>> getStudentFees({int page = 1, int perPage = 50}) async {
    try {
      final result = await pb.collection('student_fees').getList(
        page: page,
        perPage: perPage,
        expand: 'student,fee_item',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch student fees: ${e.toString()}');
    }
  }

  Future<RecordModel> assignFeeToStudent(String studentId, String feeItemId) async {
    try {
      final record = await pb.collection('student_fees').create(body: {
        'student': studentId,
        'fee_item': feeItemId,
        'assigned': true,
      });
      return record;
    } catch (e) {
      throw Exception('Failed to assign fee: ${e.toString()}');
    }
  }

  Future<void> removeFeeFromStudent(String studentFeeId) async {
    try {
      await pb.collection('student_fees').delete(studentFeeId);
    } catch (e) {
      throw Exception('Failed to remove fee: ${e.toString()}');
    }
  }

  // Student Attendance management
  Future<List<RecordModel>> getStudentAttendanceRecords({int page = 1, int perPage = 200}) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final result = await pb.collection('student_attendance').getList(
        page: page,
        perPage: perPage,
        sort: 'student_name', // 使用student_name排序
        expand: 'student',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch student attendance records: ${e.toString()}');
    }
  }

  Future<RecordModel> createStudentAttendanceRecord(Map<String, dynamic> data) async {
    try {
      final record = await pb.collection('student_attendance').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create student attendance record: ${e.toString()}');
    }
  }

  // Teacher Attendance management
  Future<List<RecordModel>> getTeacherAttendanceRecords({int page = 1, int perPage = 50}) async {
    try {
      final result = await pb.collection('teacher_attendance').getList(
        page: page,
        perPage: perPage,
        sort: '-created',
        expand: 'teacher',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch teacher attendance records: ${e.toString()}');
    }
  }

  // Invoice management
  Future<List<RecordModel>> getInvoices({int page = 1, int perPage = 50}) async {
    try {
      final result = await pb.collection('invoices').getList(
        page: page,
        perPage: perPage,
        sort: '-created',
        expand: 'student',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch invoices: ${e.toString()}');
    }
  }

  Future<RecordModel> createInvoice(Map<String, dynamic> data) async {
    try {
      final record = await pb.collection('invoices').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create invoice: ${e.toString()}');
    }
  }

  // Payment management
  Future<List<RecordModel>> getPayments({int page = 1, int perPage = 50}) async {
    try {
      final result = await pb.collection('payments').getList(
        page: page,
        perPage: perPage,
        sort: '-created',
        expand: 'student,invoice',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch payments: ${e.toString()}');
    }
  }

  Future<RecordModel> createPayment(Map<String, dynamic> data) async {
    try {
      final record = await pb.collection('payments').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create payment: ${e.toString()}');
    }
  }

  // Class management
  Future<List<RecordModel>> getClasses({int page = 1, int perPage = 50}) async {
    try {
      final result = await pb.collection('classes').getList(
        page: page,
        perPage: perPage,
        sort: 'name',
        expand: 'teacher',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch classes: ${e.toString()}');
    }
  }

  Future<RecordModel> createClass(Map<String, dynamic> data) async {
    try {
      final record = await pb.collection('classes').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create class: ${e.toString()}');
    }
  }

  Future<RecordModel> updateClass(String id, Map<String, dynamic> data) async {
    try {
      final record = await pb.collection('classes').update(id, body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to update class: ${e.toString()}');
    }
  }

  Future<void> deleteClass(String id) async {
    try {
      await pb.collection('classes').delete(id);
    } catch (e) {
      throw Exception('Failed to delete class: ${e.toString()}');
    }
  }

  // Teacher management
  Future<List<RecordModel>> getTeachers({int page = 1, int perPage = 50}) async {
    try {
      final result = await pb.collection('teachers').getList(
        page: page,
        perPage: perPage,
        sort: 'name',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch teachers: ${e.toString()}');
    }
  }

  // Parent management
  Future<List<RecordModel>> getParents({int page = 1, int perPage = 50}) async {
    try {
      final result = await pb.collection('parents').getList(
        page: page,
        perPage: perPage,
        sort: 'name',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch parents: ${e.toString()}');
    }
  }

  // Assignment management
  Future<List<RecordModel>> getAssignments({int page = 1, int perPage = 50}) async {
    try {
      final result = await pb.collection('assignments').getList(
        page: page,
        perPage: perPage,
        sort: '-created',
        expand: 'class,teacher',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch assignments: ${e.toString()}');
    }
  }

  // Student Points management
  Future<List<RecordModel>> getStudentPoints({int page = 1, int perPage = 50}) async {
    try {
      final result = await pb.collection('student_points').getList(
        page: page,
        perPage: perPage,
        sort: '-created',
        expand: 'student',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch student points: ${e.toString()}');
    }
  }

  Future<RecordModel> createStudentPoint(Map<String, dynamic> data) async {
    try {
      final record = await pb.collection('student_points').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create student point: ${e.toString()}');
    }
  }

  // Point Transactions management
  Future<List<RecordModel>> getPointTransactions({int page = 1, int perPage = 50}) async {
    try {
      final result = await pb.collection('point_transactions').getList(
        page: page,
        perPage: perPage,
        sort: '-created',
        expand: 'student',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch point transactions: ${e.toString()}');
    }
  }

  // Student Fee Matrix management
  Future<List<RecordModel>> getStudentFeeMatrix({int page = 1, int perPage = 50}) async {
    try {
      final result = await pb.collection('student_fee_matrix').getList(
        page: page,
        perPage: perPage,
        sort: 'student,created',
        expand: 'student,fee_item',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch student fee matrix: ${e.toString()}');
    }
  }

  // Check if service is initialized
  bool get isInitialized => _isInitialized;
  
  // Check if user is authenticated
  bool get isAuthenticated => _isInitialized && pb.authStore.isValid;

  // Get current user
  RecordModel? get currentUser => pb.authStore.record;

  // Get current user profile
  RecordModel? get currentUserProfile {
    if (pb.authStore.record != null) {
      return pb.authStore.record;
    }
    return null;
  }
}
