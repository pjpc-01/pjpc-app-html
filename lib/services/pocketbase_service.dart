import 'package:pocketbase/pocketbase.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';
import 'dart:async';
import 'pocketbase_cache_service.dart';

class PocketBaseService {
  late PocketBase pb;
  static const String _baseUrlKey = 'pocketbase_url';
  static const String _defaultUrl = 'http://pjpc.tplinkdns.com:8090';
  static const Duration _connectionTimeout = Duration(seconds: 10);
  static const int _maxRetryAttempts = 3;
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
    // 使用默认初始化，避免HTTP客户端类型问题
    pb = PocketBase(_defaultUrl);
    _isInitialized = true;
    
    // 在后台清除可能存在的错误URL缓存
    _clearCachedUrl();
    
    // 恢复缓存
    PocketBaseCacheService.restoreCache();
  }
  
  Future<void> _clearCachedUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_baseUrlKey);
    } catch (e) {
      // 静默处理错误
    }
  }

  Future<void> updateBaseUrl(String url) async {
    pb = PocketBase(url);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_baseUrlKey, url);
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
  }

  // 重试机制
  Future<T> _retryOperation<T>(Future<T> Function() operation) async {
    int attempts = 0;
    while (attempts < _maxRetryAttempts) {
      try {
        return await operation();
      } catch (e) {
        attempts++;
        if (attempts >= _maxRetryAttempts) {
          rethrow;
        }
        await Future.delayed(Duration(seconds: attempts * 2));
      }
    }
    throw Exception('操作失败，已达到最大重试次数');
  }

  // Test connection to server
  Future<bool> testConnection() async {
    try {
      await _retryOperation(() => pb.health.check());
      return true;
    } catch (e) {
      return false;
    }
  }

  // Authentication methods
  Future<RecordAuth> login(String email, String password) async {
    try {
      // First test connection
      final isConnected = await testConnection();
      if (!isConnected) {
        throw Exception('无法连接到服务器，请检查网络连接或服务器地址');
      }
      
      final authData = await pb.collection('users').authWithPassword(email, password);
      return authData;
    } catch (e) {
      
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
  Future<List<RecordModel>> getStudents({
    int page = 1, 
    int perPage = 200,
    String? filter,
    String? sort,
    List<String>? fields,
    bool useCache = true,
  }) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      const collection = 'students';
      
      // 检查缓存
      if (useCache && !PocketBaseCacheService.shouldRefresh(collection)) {
        final cachedData = PocketBaseCacheService.getCachedData(collection);
        if (cachedData != null) {
          return cachedData;
        }
      }
      
      
      final result = await _retryOperation(() async {
        return await pb.collection('students').getList(
          page: page,
          perPage: perPage,
          filter: filter,
          sort: sort ?? 'student_name',
          fields: fields?.join(','),
        );
      });
      
      // 缓存结果
      if (useCache) {
        PocketBaseCacheService.cacheData(collection, result.items, queryParams: {
          'page': page,
          'perPage': perPage,
          'filter': filter,
          'sort': sort,
          'fields': fields,
        });
      }
      
      return result.items;
    } catch (e) {
      
      // 如果网络失败，尝试返回缓存数据
      if (useCache) {
        final cachedData = PocketBaseCacheService.getCachedData('students');
        if (cachedData != null) {
          return cachedData;
        }
      }
      
      throw Exception('Failed to fetch students: ${e.toString()}');
    }
  }

  // 优化的查询方法
  Future<List<RecordModel>> getActiveStudents({bool useCache = true}) async {
    return await getStudents(
      filter: 'status = "active"',
      fields: ['id', 'student_name', 'student_id', 'standard', 'center', 'status'],
      useCache: useCache,
    );
  }
  
  Future<List<RecordModel>> getStudentsByGrade(String grade, {bool useCache = true}) async {
    return await getStudents(
      filter: 'standard = "$grade"',
      useCache: useCache,
    );
  }
  
  Future<List<RecordModel>> getStudentsByCenter(String center, {bool useCache = true}) async {
    return await getStudents(
      filter: 'center = "$center"',
      useCache: useCache,
    );
  }

  // 根据NFC URL查找学生
  Future<RecordModel?> getStudentByNfcUrl(String nfcUrl) async {
    try {
      final cleanUrl = nfcUrl.trim(); // 去掉前后空格
      
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      // 查询所有学生记录，查找匹配的URL
      final allStudents = await pb.collection('students').getList(perPage: 200);
      
      // 在所有学生中查找匹配的URL
      for (int i = 0; i < allStudents.items.length; i++) {
        final student = allStudents.items[i];
        final studentUrl = student.getStringValue("studentUrl")?.trim();
        final registerFormUrl = student.getStringValue("register_form_url")?.trim();
        final studentName = student.getStringValue("student_name");
        
        
        // 智能URL匹配
        bool isMatch = false;
        String? matchedUrl;
        
        // 1. 精确匹配
        if (studentUrl == cleanUrl || registerFormUrl == cleanUrl) {
          isMatch = true;
          matchedUrl = studentUrl == cleanUrl ? studentUrl : registerFormUrl;
        }
        
        // 2. 去除协议后的匹配
        if (!isMatch) {
          String cleanStudentUrl = studentUrl?.replaceAll(RegExp(r'^https?://'), '') ?? '';
          String cleanRegisterUrl = registerFormUrl?.replaceAll(RegExp(r'^https?://'), '') ?? '';
          String cleanTargetUrl = cleanUrl.replaceAll(RegExp(r'^https?://'), '');
          
          if (cleanStudentUrl == cleanTargetUrl || cleanRegisterUrl == cleanTargetUrl) {
            isMatch = true;
            matchedUrl = cleanStudentUrl == cleanTargetUrl ? studentUrl : registerFormUrl;
          }
        }
        
        // 3. 核心部分匹配（提取Google Forms ID）
        if (!isMatch) {
          String extractFormId(String url) {
            final match = RegExp(r'/forms/d/e/([^/]+)').firstMatch(url);
            return match?.group(1) ?? '';
          }
          
          String targetFormId = extractFormId(cleanUrl);
          String studentFormId = extractFormId(studentUrl ?? '');
          String registerFormId = extractFormId(registerFormUrl ?? '');
          
          if (targetFormId.isNotEmpty && (targetFormId == studentFormId || targetFormId == registerFormId)) {
            isMatch = true;
            matchedUrl = targetFormId == studentFormId ? studentUrl : registerFormUrl;
          }
        }
        
        // 4. 相似度匹配（允许1-2个字符差异）
        if (!isMatch) {
          int calculateSimilarity(String s1, String s2) {
            int maxLen = s1.length > s2.length ? s1.length : s2.length;
            int minLen = s1.length < s2.length ? s1.length : s2.length;
            if (maxLen == 0) return 100;
            
            int matches = 0;
            for (int i = 0; i < minLen; i++) {
              if (s1[i] == s2[i]) matches++;
            }
            
            return (matches * 100 / maxLen).round();
          }
          
          int studentSimilarity = calculateSimilarity(cleanUrl, studentUrl ?? '');
          int registerSimilarity = calculateSimilarity(cleanUrl, registerFormUrl ?? '');
          
          if (studentSimilarity >= 95 || registerSimilarity >= 95) {
            isMatch = true;
            matchedUrl = studentSimilarity >= registerSimilarity ? studentUrl : registerFormUrl;
          }
        }
        
        if (isMatch) {
          return student;
        }
      }
      
      // 尝试不同的字段名查询
      final result1 = await pb.collection('students').getList(
        filter: 'studentUrl = "${cleanUrl.replaceAll('"', '\\"')}"',
        perPage: 1,
      );
      
      if (result1.items.isNotEmpty) {
        return result1.items.first;
      }
      
      final result2 = await pb.collection('students').getList(
        filter: 'register_form_url = "${cleanUrl.replaceAll('"', '\\"')}"',
        perPage: 1,
      );
      
      if (result2.items.isNotEmpty) {
        return result2.items.first;
      }
      
      // 如果精确匹配失败，尝试包含查询
      final result3 = await pb.collection('students').getList(
        filter: 'studentUrl ~ "${cleanUrl.replaceAll('"', '\\"')}"',
        perPage: 1,
      );
      
      if (result3.items.isNotEmpty) {
        return result3.items.first;
      }
      
      // 尝试在 register_form_url 字段进行包含查询
      final result4 = await pb.collection('students').getList(
        filter: 'register_form_url ~ "${cleanUrl.replaceAll('"', '\\"')}"',
        perPage: 1,
      );
      
      if (result4.items.isNotEmpty) {
        return result4.items.first;
      }

      // 所有查询都失败，返回null
      return null;
    } catch (e) {
      throw Exception('Failed to find student by NFC URL: ${e.toString()}');
    }
  }

  Future<RecordModel> createStudent(Map<String, dynamic> data) async {
    try {
      final record = await _retryOperation(() async {
        return await pb.collection('students').create(body: data);
      });
      
      // 清除缓存，强制下次刷新
      PocketBaseCacheService.clearCache('students');
      
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

  Future<RecordModel> updateStudentAttendanceRecord(String recordId, Map<String, dynamic> data) async {
    try {
      final record = await pb.collection('student_attendance').update(recordId, body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to update student attendance record: ${e.toString()}');
    }
  }

  Future<void> deleteStudentAttendanceRecord(String recordId) async {
    try {
      await pb.collection('student_attendance').delete(recordId);
    } catch (e) {
      throw Exception('Failed to delete student attendance record: ${e.toString()}');
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

  // Create attendance record
  Future<RecordModel> createAttendanceRecord(Map<String, dynamic> data) async {
    try {
      final record = await pb.collection('student_attendance').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create attendance record: ${e.toString()}');
    }
  }


}
