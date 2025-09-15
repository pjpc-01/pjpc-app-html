import 'package:pocketbase/pocketbase.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';
import 'dart:async';
import 'pocketbase_cache_service.dart';
import 'package:http/http.dart' as http;
// import 'security_service.dart';
// import 'alert_service.dart';

class PocketBaseService {
  late PocketBase pb;
  static const String _baseUrlKey = 'pocketbase_url';
  static const String _defaultUrl = 'http://pjpc.tplinkdns.com:8090';
  static const Duration _connectionTimeout = Duration(seconds: 10);
  static const int _maxRetryAttempts = 3;
  bool _isInitialized = false;
  
  // 安全服务 - 移除循环依赖
  // late SecurityService _securityService;
  // late AlertService _alertService;
  
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
    
    // 初始化安全服务
    // 移除循环依赖 - 安全服务将在需要时单独初始化
    // _securityService = SecurityService();
    // _alertService = AlertService();
    
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
        try {
          await authenticateAdmin();
        } catch (e) {
          throw Exception('用户未认证，请重新登录');
        }
      }
      
      
      final result = await pb.collection('student_attendance').getList(
        page: page,
        perPage: perPage,
        sort: 'student_name', // 使用student_name排序
        expand: 'student',
      );
      
      
      // 打印前几条记录用于调试
      for (int i = 0; i < result.items.length && i < 3; i++) {
        final record = result.items[i];
      }
      
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch student attendance records: ${e.toString()}');
    }
  }

  Future<RecordModel> createStudentAttendanceRecord(Map<String, dynamic> data) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final studentId = data['student_id'] ?? '';
      final studentName = data['student_name'] ?? '';
      final attendanceType = data['type'] ?? data['attendance_type'] ?? 'check_in';
      final date = data['date'] ?? DateTime.now().toIso8601String().split('T')[0];
      final currentTime = DateTime.now().toIso8601String();
      
      
      // 直接查询该学生的所有记录，然后手动过滤今天的
      final allRecords = await pb.collection('student_attendance').getList(
        filter: 'student_id = "$studentId"',
        perPage: 50,
        sort: '-created',
      );
      
      
      // 手动过滤今天的记录
      final today = DateTime.now().toIso8601String().split('T')[0];
      final records = allRecords.items.where((record) {
        final recordDate = record.getStringValue('date');
        return recordDate.contains(today);
      }).toList();
      
      
      // 查找是否有未完成的记录（只有签到没有签退）
      RecordModel? incompleteRecord;
      for (final record in records) {
        final checkIn = record.getStringValue('check_in');
        final checkOut = record.getStringValue('check_out');
        
        
        // 检查是否有签到时间但没有签退时间
        if (checkIn.isNotEmpty && checkIn != 'null' && 
            (checkOut.isEmpty || checkOut == 'null' || checkOut == '')) {
          incompleteRecord = record;
          break;
        }
      }
      
      if (attendanceType == 'check_in') {
        // 签到：创建新记录
        final attendanceData = <String, dynamic>{
          'student_id': studentId,
          'student_name': studentName,
          'date': date,
          'check_in': currentTime,
          'check_out': '', // 明确设置为空字符串
          'nfc_tag_id': data['nfc_tag_id'] ?? '',
          'location': data['location'] ?? 'NFC扫描',
          'device_id': data['device_id'] ?? 'mobile_app',
          'notes': data['notes'] ?? '',
        };
        
        final record = await pb.collection('student_attendance').create(body: attendanceData);
        
        return record;
        
      } else if (attendanceType == 'check_out') {
        // 签退：更新最新的未完成记录
        if (incompleteRecord == null) {
          for (final record in records) {
          }
          throw Exception('学生还没有签到记录，不能签退');
        }
        
        // 更新现有记录，添加签退时间
        final updateData = <String, dynamic>{
          'check_out': currentTime,
        };
        
        final updatedRecord = await pb.collection('student_attendance').update(
          incompleteRecord.id, 
          body: updateData
        );
        
        return updatedRecord;
      }
      
      throw Exception('无效的考勤类型');
    } catch (e) {
      throw Exception('Failed to create student attendance record: ${e.toString()}');
    }
  }

  Future<RecordModel> updateStudentAttendanceRecord(String recordId, Map<String, dynamic> data) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final record = await pb.collection('student_attendance').update(recordId, body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to update student attendance record: ${e.toString()}');
    }
  }

  Future<void> deleteStudentAttendanceRecord(String recordId) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      await pb.collection('student_attendance').delete(recordId);
    } catch (e) {
      throw Exception('Failed to delete student attendance record: ${e.toString()}');
    }
  }

  // Teacher Attendance management
  Future<List<RecordModel>> getTeacherAttendanceRecords({int page = 1, int perPage = 50}) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        try {
          await authenticateAdmin();
        } catch (e) {
          throw Exception('用户未认证，请重新登录');
        }
      }
      
      
      final result = await pb.collection('teacher_attendance').getList(
        page: page,
        perPage: perPage,
        sort: '-created',
        expand: 'teacher',
      );
      
      
      // 打印前几条记录用于调试
      for (int i = 0; i < result.items.length && i < 3; i++) {
        final record = result.items[i];
      }
      
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch teacher attendance records: ${e.toString()}');
    }
  }

  Future<RecordModel> createTeacherAttendanceRecord(Map<String, dynamic> data) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final teacherId = data['teacher_id'] ?? '';
      final date = data['date'] ?? DateTime.now().toIso8601String().split('T')[0];
      final type = data['type'] ?? 'check_in';
      final currentTime = DateTime.now().toIso8601String();
      
      
      // 直接查询该教师的所有记录，然后手动过滤今天的
      final allRecords = await pb.collection('teacher_attendance').getList(
        filter: 'teacher_id = "$teacherId"',
        perPage: 50,
        sort: '-created',
      );
      
      
      // 手动过滤今天的记录
      final today = DateTime.now().toIso8601String().split('T')[0];
      final records = allRecords.items.where((record) {
        final recordDate = record.getStringValue('date');
        return recordDate.contains(today);
      }).toList();
      
      
      // 查找是否有未完成的记录（只有签到没有签退）
      RecordModel? incompleteRecord;
      for (final record in records) {
        final checkIn = record.getStringValue('check_in');
        final checkOut = record.getStringValue('check_out');
        
        
        // 检查是否有签到时间但没有签退时间
        if (checkIn.isNotEmpty && checkIn != 'null' && 
            (checkOut.isEmpty || checkOut == 'null' || checkOut == '')) {
          incompleteRecord = record;
          break;
        }
      }
      
      if (type == 'check_in') {
        // 签到：创建新记录
        final attendanceData = <String, dynamic>{
          'teacher_id': teacherId,
          'teacher_name': data['teacher_name'] ?? '',
          'branch_code': data['branch_code'] ?? '',
          'branch_name': data['branch_name'] ?? '',
          'date': date,
          'check_in': currentTime,
          'check_out': '', // 明确设置为空字符串
          'status': 'present',
          'notes': data['notes'] ?? '',
        };
        
        final record = await pb.collection('teacher_attendance').create(body: attendanceData);
        
        return record;
        
      } else if (type == 'check_out') {
        // 签退：更新最新的未完成记录
        if (incompleteRecord == null) {
          for (final record in records) {
          }
          throw Exception('教师还没有签到记录，不能签退');
        }
        
        // 更新现有记录，添加签退时间
        final updateData = <String, dynamic>{
          'check_out': currentTime,
          'status': 'present', // 完整考勤
        };
        
        final updatedRecord = await pb.collection('teacher_attendance').update(
          incompleteRecord.id, 
          body: updateData
        );
        
        return updatedRecord;
      }
      
      throw Exception('无效的考勤类型');
    } catch (e) {
      throw Exception('Failed to create teacher attendance record: ${e.toString()}');
    }
  }

  // 更新教师考勤记录
  Future<RecordModel> updateTeacherAttendanceRecord(String recordId, Map<String, dynamic> data) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final record = await pb.collection('teacher_attendance').update(recordId, body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to update teacher attendance record: ${e.toString()}');
    }
  }

  // 删除教师考勤记录
  Future<void> deleteTeacherAttendanceRecord(String recordId) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      await pb.collection('teacher_attendance').delete(recordId);
    } catch (e) {
      throw Exception('Failed to delete teacher attendance record: ${e.toString()}');
    }
  }

  // 按日期范围获取教师考勤记录
  Future<List<RecordModel>> getTeacherAttendanceRecordsByDateRange(
    DateTime startDate, 
    DateTime endDate, {
    int page = 1,
    int perPage = 200,
  }) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final startDateStr = startDate.toIso8601String().split('T')[0];
      final endDateStr = endDate.toIso8601String().split('T')[0];
      
      final result = await pb.collection('teacher_attendance').getList(
        page: page,
        perPage: perPage,
        filter: 'date >= "$startDateStr" && date <= "$endDateStr"',
        sort: '-date',
        expand: 'teacher',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch teacher attendance records by date range: ${e.toString()}');
    }
  }

  // 按教师ID获取考勤记录
  Future<List<RecordModel>> getTeacherAttendanceRecordsByTeacherId(
    String teacherId, {
    int page = 1,
    int perPage = 100,
  }) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final result = await pb.collection('teacher_attendance').getList(
        page: page,
        perPage: perPage,
        filter: 'teacher_id = "$teacherId"',
        sort: '-date',
        expand: 'teacher',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch teacher attendance records by teacher ID: ${e.toString()}');
    }
  }

  // 获取教师考勤统计
  Future<Map<String, dynamic>> getTeacherAttendanceStats({
    String? teacherId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      String filter = '';
      if (teacherId != null) {
        filter += 'teacher_id = "$teacherId"';
      }
      
      if (startDate != null && endDate != null) {
        final startDateStr = startDate.toIso8601String().split('T')[0];
        final endDateStr = endDate.toIso8601String().split('T')[0];
        if (filter.isNotEmpty) {
          filter += ' && ';
        }
        filter += 'date >= "$startDateStr" && date <= "$endDateStr"';
      }
      
      final result = await pb.collection('teacher_attendance').getList(
        page: 1,
        perPage: 1000, // 获取足够多的记录进行统计
        filter: filter.isNotEmpty ? filter : null,
        expand: 'teacher',
      );
      
      final records = result.items;
      final checkIns = records.where((r) => r.getStringValue('type') == 'check_in').length;
      final checkOuts = records.where((r) => r.getStringValue('type') == 'check_out').length;
      final lateCount = records.where((r) => r.getStringValue('status') == 'late').length;
      final absentCount = records.where((r) => r.getStringValue('status') == 'absent').length;
      
      return {
        'total_records': records.length,
        'check_ins': checkIns,
        'check_outs': checkOuts,
        'late_count': lateCount,
        'absent_count': absentCount,
        'attendance_rate': records.isNotEmpty ? ((checkIns - absentCount) / records.length) * 100 : 0.0,
      };
    } catch (e) {
      throw Exception('Failed to get teacher attendance stats: ${e.toString()}');
    }
  }

  // 获取考勤异常记录
  Future<List<RecordModel>> getAttendanceExceptions({
    DateTime? startDate,
    DateTime? endDate,
    bool includeTeachers = true,
    int page = 1,
    int perPage = 100,
  }) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      List<RecordModel> exceptions = [];
      
      // 获取学生考勤异常
      String studentFilter = 'status = "late" || status = "absent" || status = "early_leave"';
      if (startDate != null && endDate != null) {
        final startDateStr = startDate.toIso8601String().split('T')[0];
        final endDateStr = endDate.toIso8601String().split('T')[0];
        studentFilter += ' && date >= "$startDateStr" && date <= "$endDateStr"';
      }
      
      final studentResult = await pb.collection('student_attendance').getList(
        page: page,
        perPage: perPage,
        filter: studentFilter,
        sort: '-date',
        expand: 'student',
      );
      exceptions.addAll(studentResult.items);
      
      // 获取教师考勤异常
      if (includeTeachers) {
        String teacherFilter = 'status = "late" || status = "absent"';
        if (startDate != null && endDate != null) {
          final startDateStr = startDate.toIso8601String().split('T')[0];
          final endDateStr = endDate.toIso8601String().split('T')[0];
          teacherFilter += ' && date >= "$startDateStr" && date <= "$endDateStr"';
        }
        
        final teacherResult = await pb.collection('teacher_attendance').getList(
          page: page,
          perPage: perPage,
          filter: teacherFilter,
          sort: '-date',
          expand: 'teacher',
        );
        exceptions.addAll(teacherResult.items);
      }
      
      // 按日期排序
      exceptions.sort((a, b) => b.getStringValue('date').compareTo(a.getStringValue('date')));
      
      return exceptions;
    } catch (e) {
      throw Exception('Failed to get attendance exceptions: ${e.toString()}');
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

  // Class-Student association management
  Future<List<RecordModel>> getClassStudents(String classId, {int page = 1, int perPage = 50}) async {
    try {
      final result = await pb.collection('students').getList(
        page: page,
        perPage: perPage,
        filter: 'class_id = "$classId"',
        sort: 'student_name',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch class students: ${e.toString()}');
    }
  }

  Future<List<RecordModel>> getUnassignedStudents({int page = 1, int perPage = 50}) async {
    try {
      final result = await pb.collection('students').getList(
        page: page,
        perPage: perPage,
        filter: 'class_id = "" || class_id = null',
        sort: 'student_name',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch unassigned students: ${e.toString()}');
    }
  }

  Future<void> assignStudentToClass(String studentId, String classId) async {
    try {
      await pb.collection('students').update(studentId, body: {
        'class_id': classId,
      });
    } catch (e) {
      throw Exception('Failed to assign student to class: ${e.toString()}');
    }
  }

  Future<void> removeStudentFromClass(String studentId) async {
    try {
      await pb.collection('students').update(studentId, body: {
        'class_id': '',
      });
    } catch (e) {
      throw Exception('Failed to remove student from class: ${e.toString()}');
    }
  }

  Future<void> assignMultipleStudentsToClass(List<String> studentIds, String classId) async {
    try {
      for (final studentId in studentIds) {
        await pb.collection('students').update(studentId, body: {
          'class_id': classId,
        });
      }
    } catch (e) {
      throw Exception('Failed to assign multiple students to class: ${e.toString()}');
    }
  }

  // 获取所有用户
  Future<List<RecordModel>> getAllUsers({int perPage = 200}) async {
    try {
      await authenticateAdmin();
      
      final result = await pb.collection('users').getList(
        perPage: perPage,
        sort: '-created',
      );
      
      return result.items;
    } catch (e) {
      print('获取用户列表失败: $e');
      return [];
    }
  }

  // Teacher management
  Future<List<RecordModel>> getTeachers({
    int page = 1, 
    int perPage = 50,
    String? filter,
    String? sort,
    List<String>? fields,
  }) async {
    try {
      print('=== 获取教师列表 ===');
      print('当前认证状态: ${pb.authStore.isValid}');
      print('当前用户角色: ${pb.authStore.record?.data['role']}');
      
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        print('用户未认证，尝试认证...');
        try {
          await authenticateAdmin();
          print('认证成功');
        } catch (e) {
          print('认证失败: $e');
          throw Exception('用户未认证，请重新登录');
        }
      }
      
      // 尝试获取数据
      print('尝试获取教师数据...');
      final result = await pb.collection('teachers').getList(
        page: page,
        perPage: perPage,
        filter: filter,
        sort: sort ?? 'name',
        fields: fields?.join(','),
      );
      
      print('获取到 ${result.items.length} 个教师记录');
      
      // 打印前几条记录用于调试
      for (int i = 0; i < result.items.length && i < 3; i++) {
        final teacher = result.items[i];
        print('教师 $i: ID=${teacher.id}, 姓名=${teacher.getStringValue('name')}');
      }
      
      return result.items;
    } catch (e) {
      print('获取教师列表失败: $e');
      
      // 尝试备用方法
      try {
        print('尝试备用方法：清除认证后查询');
        pb.authStore.clear();
        final result = await pb.collection('teachers').getList(
          page: page,
          perPage: perPage,
          filter: filter,
          sort: sort ?? 'name',
          fields: fields?.join(','),
        );
        
        print('备用方法成功，获取到 ${result.items.length} 个教师记录');
        
        // 恢复认证
        await authenticateAdmin();
        
        return result.items;
      } catch (backupError) {
        print('备用方法也失败: $backupError');
        throw Exception('Failed to fetch teachers: ${e.toString()}');
      }
    }
  }

  Future<RecordModel> createTeacher(Map<String, dynamic> data) async {
    try {
      final record = await pb.collection('teachers').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create teacher: ${e.toString()}');
    }
  }

  // 调试方法：直接获取服务器端教师记录
  Future<RecordModel?> getTeacherByIdFromServer(String id) async {
    try {
      print('=== 服务器端教师记录查询 ===');
      print('查询ID: $id');
      
      // 强制重新认证
      await authenticateAdmin();
      
      // 直接查询服务器端记录
      final record = await pb.collection('teachers').getOne(id);
      print('服务器端记录找到: ${record.id}');
      print('记录名称: ${record.getStringValue('name')}');
      print('记录邮箱: ${record.getStringValue('email')}');
      print('记录状态: ${record.getStringValue('status')}');
      
      return record;
    } catch (e) {
      print('服务器端记录查询失败: $e');
      return null;
    }
  }

  // 调试方法：获取服务器端所有教师记录
  Future<List<RecordModel>> getAllTeachersFromServer() async {
    try {
      print('=== 获取服务器端所有教师记录 ===');
      
      // 强制重新认证
      await authenticateAdmin();
      
      // 尝试多种查询方法
      List<RecordModel> teachers = [];
      
      // 方法1：直接查询
      try {
        print('尝试方法1：直接查询');
        final result = await pb.collection('teachers').getList(perPage: 200);
        teachers = result.items;
        print('方法1成功，记录数量: ${teachers.length}');
      } catch (e1) {
        print('方法1失败: $e1');
        
        // 方法2：清除认证后查询
        try {
          print('尝试方法2：清除认证后查询');
          pb.authStore.clear();
          final result = await pb.collection('teachers').getList(perPage: 200);
          teachers = result.items;
          print('方法2成功，记录数量: ${teachers.length}');
          
          // 恢复认证
          await authenticateAdmin();
        } catch (e2) {
          print('方法2失败: $e2');
          
          // 方法3：使用不同的认证方式
          try {
            print('尝试方法3：使用users集合认证');
            await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!');
            final result = await pb.collection('teachers').getList(perPage: 200);
            teachers = result.items;
            print('方法3成功，记录数量: ${teachers.length}');
          } catch (e3) {
            print('方法3失败: $e3');
            throw Exception('所有查询方法都失败了');
          }
        }
      }
      
      print('最终服务器端教师记录数量: ${teachers.length}');
      
      for (int i = 0; i < teachers.length; i++) {
        final teacher = teachers[i];
        print('教师 $i: ID=${teacher.id}, 姓名=${teacher.getStringValue('name')}, 邮箱=${teacher.getStringValue('email')}');
      }
      
      return teachers;
    } catch (e) {
      print('获取服务器端教师记录失败: $e');
      return [];
    }
  }

  // 简化的教师更新方法
  Future<RecordModel> updateTeacherSimple(String id, Map<String, dynamic> data) async {
    try {
      print('=== 简化教师更新 ===');
      print('更新ID: $id');
      print('更新数据: $data');
      
      // 先获取服务器端所有记录，看看实际的ID
      final serverTeachers = await getAllTeachersFromServer();
      
      // 尝试通过邮箱找到正确的ID
      final email = data['email'];
      if (email != null) {
        final matchingTeacher = serverTeachers.firstWhere(
          (t) => t.getStringValue('email') == email,
          orElse: () => throw Exception('未找到匹配的教师记录'),
        );
        
        print('通过邮箱找到匹配的教师: ID=${matchingTeacher.id}, 姓名=${matchingTeacher.getStringValue('name')}');
        
        // 使用找到的正确ID进行更新
        final record = await pb.collection('teachers').update(matchingTeacher.id, body: data);
        print('简化更新成功: ${record.id}');
        return record;
      }
      
      // 如果无法通过邮箱匹配，直接尝试更新
      final record = await pb.collection('teachers').update(id, body: data);
      print('简化更新成功: ${record.id}');
      return record;
    } catch (e) {
      print('简化更新失败: $e');
      throw Exception('简化更新失败: ${e.toString()}');
    }
  }

  Future<RecordModel> updateTeacher(String id, Map<String, dynamic> data) async {
    try {
      // 强制重新认证以确保权限
      try {
        await authenticateAdmin();
        print('重新认证成功');
      } catch (authError) {
        print('重新认证失败: $authError');
        throw Exception('用户未认证，请重新登录: ${authError.toString()}');
      }

      // 调试信息
      print('=== 教师更新调试信息 ===');
      print('尝试更新教师记录 ID: $id');
      print('更新数据: $data');
      print('当前认证状态: ${pb.authStore.isValid}');
      print('当前用户ID: ${pb.authStore.model?.id}');
      print('当前用户邮箱: ${pb.authStore.model?.getStringValue('email')}');
      print('当前用户角色: ${pb.authStore.model?.getStringValue('role')}');
      print('认证令牌: ${pb.authStore.token}');
      print('========================');

      // 测试管理员权限
      try {
        print('测试管理员权限...');
        final testResult = await pb.collection('teachers').getList(perPage: 1);
        print('权限测试成功，可以访问teachers集合');
      } catch (permError) {
        print('权限测试失败: $permError');
        throw Exception('管理员权限不足，无法访问teachers集合: ${permError.toString()}');
      }

      // 验证服务器端记录状态
      try {
        print('验证服务器端记录状态...');
        final serverRecord = await pb.collection('teachers').getOne(id);
        print('服务器端记录存在: ${serverRecord.id}');
        print('服务器端记录名称: ${serverRecord.getStringValue('name')}');
        print('服务器端记录邮箱: ${serverRecord.getStringValue('email')}');
        print('服务器端记录状态: ${serverRecord.getStringValue('status')}');
        
        // 如果验证成功，尝试更新记录
        print('开始更新记录...');
        final record = await pb.collection('teachers').update(id, body: data);
        print('更新成功，返回记录: ${record.id}');
        return record;
      } catch (serverError) {
        print('服务器端记录验证失败: $serverError');
        if (serverError.toString().contains('404')) {
          // 尝试使用调试方法再次查询
          print('尝试使用调试方法查询...');
          final debugRecord = await getTeacherByIdFromServer(id);
          if (debugRecord != null) {
            print('调试方法找到记录，尝试更新...');
            try {
              final record = await pb.collection('teachers').update(id, body: data);
              print('调试更新成功: ${record.id}');
              return record;
            } catch (updateError) {
              print('调试更新失败: $updateError');
              throw Exception('记录存在但更新失败: ${updateError.toString()}');
            }
          } else {
            throw Exception('服务器端记录不存在 (ID: $id)。可能的原因：\n'
                '1. 记录已被删除\n'
                '2. 本地缓存过期\n'
                '3. 数据不同步\n\n'
                '建议：刷新教师列表后重试');
          }
        }
        throw Exception('无法验证服务器端记录: ${serverError.toString()}');
      }
    } catch (e) {
      print('更新失败: $e');
      throw Exception('Failed to update teacher: ${e.toString()}');
    }
  }

  Future<void> deleteTeacher(String id) async {
    try {
      await pb.collection('teachers').delete(id);
    } catch (e) {
      throw Exception('Failed to delete teacher: ${e.toString()}');
    }
  }

  Future<RecordModel> getTeacherById(String id) async {
    try {
      final record = await pb.collection('teachers').getOne(id);
      return record;
    } catch (e) {
      throw Exception('Failed to fetch teacher: ${e.toString()}');
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

  Future<RecordModel> createAssignment(Map<String, dynamic> data) async {
    try {
      
      // 检查是否是管理员认证
      final isAdmin = pb.authStore.record?.collectionName == '_superusers';
      
      final record = await pb.collection('assignments').create(body: data);
      return record;
    } catch (e) {
      
      // 提供更详细的错误信息
      if (e.toString().contains('Failed to create record')) {
      }
      
      throw Exception('Failed to create assignment: ${e.toString()}');
    }
  }

  // 更新作业
  Future<RecordModel> updateAssignment(String id, Map<String, dynamic> data) async {
    try {
      
      // 检查是否是管理员认证
      final isAdmin = pb.authStore.record?.collectionName == '_superusers';
      
      final record = await pb.collection('assignments').update(id, body: data);
      return record;
    } catch (e) {
      
      // 提供更详细的错误信息
      if (e.toString().contains('Failed to update record')) {
      }
      
      throw Exception('Failed to update assignment: ${e.toString()}');
    }
  }

  // 删除作业
  Future<void> deleteAssignment(String id) async {
    try {
      
      // 检查是否是管理员认证
      final isAdmin = pb.authStore.record?.collectionName == '_superusers';
      
      await pb.collection('assignments').delete(id);
    } catch (e) {
      
      // 提供更详细的错误信息
      if (e.toString().contains('Failed to delete record')) {
      }
      
      throw Exception('Failed to delete assignment: ${e.toString()}');
    }
  }

  // 学生作业提交管理 (assignment_records 集合)
  Future<List<RecordModel>> getAssignmentRecords({String? assignmentId, int page = 1, int perPage = 50}) async {
    try {
      String filter = '';
      if (assignmentId != null) {
        filter = 'assignment_id = "$assignmentId"';
      }
      
      final result = await pb.collection('assignment_records').getList(
        page: page,
        perPage: perPage,
        sort: '-created',
        filter: filter,
        expand: 'student,assignment',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch assignment records: ${e.toString()}');
    }
  }

  Future<RecordModel> createAssignmentRecord(Map<String, dynamic> data) async {
    try {
      
      final record = await pb.collection('assignment_records').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create assignment record: ${e.toString()}');
    }
  }

  Future<RecordModel> updateAssignmentRecord(String id, Map<String, dynamic> data) async {
    try {
      
      final record = await pb.collection('assignment_records').update(id, body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to update assignment record: ${e.toString()}');
    }
  }

  Future<void> deleteAssignmentRecord(String id) async {
    try {
      
      await pb.collection('assignment_records').delete(id);
    } catch (e) {
      throw Exception('Failed to delete assignment record: ${e.toString()}');
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

  // Student points summary by student_id (upsert semantics)
  Future<RecordModel> upsertStudentPointsSummary({
    required String studentId,
    int deltaEarned = 0,
    int deltaSpent = 0,
    int? seasonNumber,
    DateTime? seasonStart,
    DateTime? seasonEnd,
  }) async {
    try {
      // find existing summary
      final list = await pb.collection('student_points').getList(
        perPage: 1,
        filter: 'student_id = "$studentId"',
      );
      if (list.items.isEmpty) {
        final record = await pb.collection('student_points').create(body: {
          'student_id': studentId,
          'current_points': (deltaEarned - deltaSpent).clamp(0, 1 << 31),
          'total_earned': deltaEarned,
          'total_spent': deltaSpent,
          if (seasonNumber != null) 'season_number': seasonNumber,
          if (seasonStart != null) 'season_start_date': seasonStart.toIso8601String(),
          if (seasonEnd != null) 'season_end_date': seasonEnd.toIso8601String(),
        });
        return record;
      } else {
        final current = list.items.first;
        final currentPoints = current.getIntValue('current_points');
        final totalEarned = current.getIntValue('total_earned');
        final totalSpent = current.getIntValue('total_spent');
        final updated = await pb.collection('student_points').update(current.id, body: {
          'current_points': (currentPoints + deltaEarned - deltaSpent).clamp(0, 1 << 31),
          'total_earned': totalEarned + deltaEarned,
          'total_spent': totalSpent + deltaSpent,
          if (seasonNumber != null) 'season_number': seasonNumber,
          if (seasonStart != null) 'season_start_date': seasonStart.toIso8601String(),
          if (seasonEnd != null) 'season_end_date': seasonEnd.toIso8601String(),
        });
        return updated;
      }
    } catch (e) {
      throw Exception('Failed to upsert student points summary: ${e.toString()}');
    }
  }

  // 根据学生ID查找学生
  Future<RecordModel?> getStudentByStudentId(String studentId) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      // 查询学生记录
      final students = await pb.collection('students').getList(
        filter: 'student_id = "${studentId.trim()}"',
        perPage: 1,
      );
      
      if (students.items.isNotEmpty) {
        return students.items.first;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }

  /// 根据教师ID获取教师信息
  Future<RecordModel?> getTeacherByTeacherId(String teacherId) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      // 查询教师记录
      final teachers = await pb.collection('teachers').getList(
        filter: 'teacher_id = "${teacherId.trim()}"',
        perPage: 1,
      );
      
      if (teachers.items.isNotEmpty) {
        return teachers.items.first;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }

  /// 根据用户ID获取教师信息
  Future<RecordModel?> getTeacherByUserId(String userId) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      
      // 方法1: 通过user_id字段查找（主要方法）
      try {
        final result = await pb.collection('teachers').getList(
          filter: 'user_id = "${userId.trim()}"',
          perPage: 1,
        );
        
        if (result.items.isNotEmpty) {
          return result.items.first;
        } else {
        }
      } catch (e) {
      }
      
      // 方法2: 通过id字段查找（备用方法）
      try {
        final result = await pb.collection('teachers').getList(
          filter: 'id = "${userId.trim()}"',
          perPage: 1,
        );
        
        if (result.items.isNotEmpty) {
          return result.items.first;
        } else {
        }
      } catch (e) {
      }
      
      // 方法3: 通过teacher_id字段查找（备用方法）
      try {
        final result = await pb.collection('teachers').getList(
          filter: 'teacher_id = "${userId.trim()}"',
          perPage: 1,
        );
        
        if (result.items.isNotEmpty) {
          return result.items.first;
        } else {
        }
      } catch (e) {
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<RecordModel?> getStudentPointsSummary(String studentId) async {
    try {
      final list = await pb.collection('student_points').getList(
        perPage: 1,
        filter: 'student_id = "$studentId"',
      );
      if (list.items.isEmpty) return null;
      return list.items.first;
    } catch (e) {
      throw Exception('Failed to get student points summary: ${e.toString()}');
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

  Future<RecordModel> createPointTransaction({
    required String studentId,
    required String teacherId,
    required int pointsChange,
    required String transactionType, // add_points | deduct_points | redeem
    String? reason,
    File? proofImage,
    int? seasonNumber,
    String status = 'approved',
  }) async {
    try {
      final body = {
        'student_id': studentId,
        'teacher_id': teacherId,
        'points_change': pointsChange,
        'transaction_type': transactionType,
        if (reason != null) 'reason': reason,
        if (seasonNumber != null) 'season_number': seasonNumber,
        'status': status,
      };
      final files = <http.MultipartFile>[];
      if (proofImage != null) {
        files.add(await http.MultipartFile.fromPath('proof_image', proofImage.path));
      }
      final record = await pb.collection('point_transactions').create(body: body, files: files);
      return record;
    } catch (e) {
      throw Exception('Failed to create point transaction: ${e.toString()}');
    }
  }




  // NFC卡补办申请管理
  
  /// 获取所有待处理的NFC卡补办申请
  Future<List<RecordModel>> getPendingNfcReplacementRequests({int page = 1, int perPage = 50}) async {
    try {
      final result = await pb.collection('nfc_cards').getList(
        page: page,
        perPage: perPage,
        filter: 'replacement_status = "pending"',
        sort: '-replacement_request_date',
        expand: 'student',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch pending NFC replacement requests: ${e.toString()}');
    }
  }

  /// 获取所有NFC卡补办申请（包括已处理的）
  Future<List<RecordModel>> getAllNfcReplacementRequests({int page = 1, int perPage = 50}) async {
    try {
      final result = await pb.collection('nfc_cards').getList(
        page: page,
        perPage: perPage,
        sort: '-replacement_request_date',
        expand: 'student',
      );
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch NFC replacement requests: ${e.toString()}');
    }
  }

  /// 更新NFC卡补办申请状态
  Future<RecordModel> updateNfcReplacementStatus(String cardId, String status, {String? notes}) async {
    try {
      final updateData = <String, dynamic>{
        'replacement_status': status,
        'updated': DateTime.now().toIso8601String(),
      };
      
      if (notes != null && notes.isNotEmpty) {
        updateData['replacement_notes'] = notes;
      }
      
      final record = await pb.collection('nfc_cards').update(cardId, body: updateData);
      return record;
    } catch (e) {
      throw Exception('Failed to update NFC replacement status: ${e.toString()}');
    }
  }

  /// 创建NFC卡补办申请
  Future<RecordModel> createNfcReplacementRequest({
    required String studentId,
    required String reason,
    required String lostDate,
    required String lostLocation,
    required String urgency,
    String? notes,
  }) async {
    try {
      // 验证输入参数
      if (studentId.trim().isEmpty) {
        throw Exception('学生ID不能为空');
      }
      if (reason.trim().isEmpty) {
        throw Exception('丢失原因不能为空');
      }
      if (lostLocation.trim().isEmpty) {
        throw Exception('丢失地点不能为空');
      }
      if (urgency.trim().isEmpty) {
        throw Exception('紧急程度不能为空');
      }

      // 验证日期格式
      DateTime? parsedDate;
      try {
        parsedDate = DateTime.parse(lostDate);
      } catch (e) {
        throw Exception('日期格式不正确');
      }

      // 检查用户认证状态（带自动重新认证）
      final isAuthenticated = await isAuthenticatedWithReauth();
      if (!isAuthenticated) {
        throw Exception('用户未认证，请重新登录');
      }

      // 检查学生是否存在
      try {
        final student = await pb.collection('students').getOne(studentId);
        if (student == null) {
          throw Exception('学生不存在');
        }
      } catch (e) {
        throw Exception('学生ID无效或学生不存在');
      }


      final requestData = <String, dynamic>{
        'student': studentId,
        'card_status': 'lost',
        'replacement_reason': reason,
        'replacement_lost_date': lostDate,
        'replacement_lost_location': lostLocation,
        'replacement_urgency': urgency,
        'replacement_status': 'pending',
        'replacement_request_date': DateTime.now().toIso8601String(),
      };
      
      if (notes != null && notes.isNotEmpty) {
        requestData['replacement_notes'] = notes;
      }
      
      
      final record = await pb.collection('nfc_cards').create(body: requestData);
      
      
      return record;
    } catch (e) {
      throw Exception('创建NFC补办申请失败: ${e.toString()}');
    }
  }

  /// 获取NFC卡补办申请统计
  Future<Map<String, int>> getNfcReplacementStats() async {
    try {
      final pending = await pb.collection('nfc_cards').getList(
        filter: 'replacement_status = "pending"',
        perPage: 1,
      );
      
      final approved = await pb.collection('nfc_cards').getList(
        filter: 'replacement_status = "approved"',
        perPage: 1,
      );
      
      final rejected = await pb.collection('nfc_cards').getList(
        filter: 'replacement_status = "rejected"',
        perPage: 1,
      );
      
      return {
        'pending': pending.totalItems,
        'approved': approved.totalItems,
        'rejected': rejected.totalItems,
        'total': pending.totalItems + approved.totalItems + rejected.totalItems,
      };
    } catch (e) {
      throw Exception('Failed to get NFC replacement stats: ${e.toString()}');
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
  
  // Check if user is authenticated with auto-reauth attempt
  Future<bool> isAuthenticatedWithReauth() async {
    if (!_isInitialized) return false;
    
    // 如果认证有效，直接返回true
    if (pb.authStore.isValid) return true;
    
    // 如果认证无效，尝试自动重新认证
    try {
      await _attemptAutoReauth();
      return pb.authStore.isValid;
    } catch (e) {
      return false;
    }
  }
  
  // 尝试自动重新认证
  Future<void> _attemptAutoReauth() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final email = prefs.getString('saved_email');
      final password = prefs.getString('saved_password');
      
      if (email != null && password != null) {
        await pb.collection('users').authWithPassword(email, password);
      } else {
        throw Exception('没有保存的认证凭据');
      }
    } catch (e) {
      // 清除无效的凭据
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('saved_email');
      await prefs.remove('saved_password');
      await prefs.remove('is_logged_in');
      rethrow;
    }
  }

  // Get current user
  RecordModel? get currentUser => pb.authStore.record;
  
  // Check if admin is authenticated
  bool get isAdminAuthenticated => _isInitialized && pb.authStore.isValid && pb.authStore.record != null;
  
  // Authenticate as admin
  Future<void> authenticateAdmin() async {
    try {
      if (isAdminAuthenticated) {
        return;
      }
      
      // 尝试使用 users 集合而不是 _superusers
      try {
        await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!');
        print('使用 users 集合认证成功');
      } catch (usersError) {
        print('users 集合认证失败: $usersError');
        // 如果 users 集合失败，尝试 _superusers
        await pb.collection('_superusers').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!');
        print('使用 _superusers 集合认证成功');
      }
    } catch (e) {
      throw Exception('Admin authentication failed: ${e.toString()}');
    }
  }
  
  // 快速测试教师集合访问
  Future<void> quickTestTeachersCollection() async {
    try {
      
      // 检查当前状态
      
      // 尝试获取教师数据
      final teachers = await getTeachers(perPage: 5);
      
      if (teachers.isNotEmpty) {
        for (int i = 0; i < teachers.length; i++) {
          final teacher = teachers[i];
          final name = teacher.getStringValue('name') ?? '未知';
          final nfcCard = teacher.getStringValue('nfc_card_number') ?? '';
        }
      } else {
      }
    } catch (e) {
    }
  }

  // 获取所有通知（管理员专用）
  Future<List<RecordModel>> getAllNotifications({
    int page = 1,
    int perPage = 200,
  }) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      print('=== 获取所有通知（管理员） ===');
      print('当前认证状态: ${pb.authStore.isValid}');
      
      final result = await pb.collection('notifications').getList(
        page: page,
        perPage: perPage,
        sort: '-created',
      );
      
      print('获取到 ${result.items.length} 个通知记录');
      
      // 打印前几个通知的详细信息
      for (int i = 0; i < result.items.length && i < 5; i++) {
        final notification = result.items[i];
        print('通知 $i: recipient_role=${notification.getStringValue('recipient_role')}, title=${notification.getStringValue('title')}, created=${notification.created}');
      }
      
      return result.items;
    } catch (e) {
      print('获取所有通知失败: $e');
      throw Exception('Failed to fetch all notifications: ${e.toString()}');
    }
  }

  // 根据角色获取通知
  Future<List<RecordModel>> getNotificationsForRole(String role) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      print('获取角色 $role 的通知');
      
      final result = await pb.collection('notifications').getList(
        page: 1,
        perPage: 100,
        sort: '-created',
        filter: 'recipient_role = "$role"',
      );
      
      print('获取到 ${result.items.length} 个 $role 角色的通知');
      
      return result.items;
    } catch (e) {
      print('获取 $role 角色通知失败: $e');
      return [];
    }
  }

  // Notification management
  Future<List<RecordModel>> getNotifications({
    String? userId,
    bool? isRead,
    int page = 1,
    int perPage = 50,
  }) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      // 获取当前用户信息
      final currentUser = pb.authStore.record;
      final userRole = currentUser?.getStringValue('role') ?? '';
      final userEmail = currentUser?.getStringValue('email') ?? '';
      
      print('=== 获取通知列表 ===');
      print('当前认证状态: ${pb.authStore.isValid}');
      print('当前用户角色: $userRole');
      print('当前用户邮箱: $userEmail');
      
      String filter = '';
      
      // 根据用户角色过滤通知
      if (userRole.isNotEmpty) {
        filter = '(recipient_role = "$userRole" || recipient_role = "all")';
      } else {
        // 如果没有角色信息，获取所有通知
        print('警告: 用户没有角色信息，获取所有通知');
      }
      
      if (isRead != null) {
        if (filter.isNotEmpty) filter += ' && ';
        filter += 'is_read = $isRead';
      }
      
      print('过滤条件: $filter');
      
      final result = await pb.collection('notifications').getList(
        page: page,
        perPage: perPage,
        sort: '-created',
        filter: filter.isNotEmpty ? filter : null,
      );
      
      print('获取到 ${result.items.length} 个通知记录');
      
      // 如果没有找到通知，尝试获取所有通知（用于调试）
      if (result.items.isEmpty) {
        print('没有找到通知，尝试获取所有通知进行调试...');
        final allResult = await pb.collection('notifications').getList(
          page: 1,
          perPage: 10,
          sort: '-created',
        );
        print('数据库中总共有 ${allResult.items.length} 个通知');
        for (int i = 0; i < allResult.items.length; i++) {
          final notification = allResult.items[i];
          print('通知 $i: recipient_role=${notification.getStringValue('recipient_role')}, title=${notification.getStringValue('title')}, created=${notification.created}');
        }
      }
      
      return result.items;
    } catch (e) {
      print('获取通知失败: $e');
      throw Exception('Failed to fetch notifications: ${e.toString()}');
    }
  }

  Future<void> updateNotificationStatus(String notificationId, bool isRead) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      // 获取当前通知记录
      final notification = await pb.collection('notifications').getOne(notificationId);
      final currentReadCount = notification.getIntValue('read_count') ?? 0;
      
      // 更新通知状态和已读计数
      await pb.collection('notifications').update(notificationId, body: {
        'is_read': isRead,
        'read_count': isRead ? currentReadCount + 1 : currentReadCount,
        'read_at': isRead ? DateTime.now().toIso8601String() : null,
      });
    } catch (e) {
      throw Exception('Failed to update notification status: ${e.toString()}');
    }
  }

  Future<RecordModel> createNotification(Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      // 计算接收者总数
      final recipientRole = data['recipient_role'] ?? 'all';
      int totalCount = 0;
      
      if (recipientRole == 'all') {
        // 获取所有用户数量
        final users = await getAllUsers();
        totalCount = users.length;
      } else {
        // 根据角色获取用户数量
        final users = await getAllUsers();
        totalCount = users.where((user) {
          final userRole = user.getStringValue('role') ?? '';
          return userRole.toLowerCase() == recipientRole.toLowerCase();
        }).length;
      }
      
      // 添加统计信息
      final notificationData = {
        ...data,
        'read_count': 0,
        'total_count': totalCount,
        'created_at': DateTime.now().toIso8601String(),
      };
      
      // 如果sender_id为空或无效，移除该字段
      if (notificationData['sender_id'] == null || notificationData['sender_id'] == '') {
        notificationData.remove('sender_id');
      }
      
      print('创建通知数据: $notificationData');
      
      final record = await pb.collection('notifications').create(body: notificationData);
      return record;
    } catch (e) {
      print('创建通知失败: $e');
      throw Exception('Failed to create notification: ${e.toString()}');
    }
  }

  Future<void> deleteNotification(String notificationId) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      await pb.collection('notifications').delete(notificationId);
    } catch (e) {
      throw Exception('Failed to delete notification: ${e.toString()}');
    }
  }

  // Additional getter for compatibility
  RecordModel? get currentUserProfile => pb.authStore.record;

  // Additional method for compatibility
  Future<RecordModel> createPointsTransaction(Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final record = await pb.collection('point_transactions').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create points transaction: ${e.toString()}');
    }
  }

  // Additional missing methods for compatibility
  Future<RecordModel> getStudentByNfcId(String nfcId) async {
    try {
      final records = await pb.collection('students').getList(
        filter: 'nfc_tag_id = "$nfcId"',
        perPage: 1,
      );
      return records.items.isNotEmpty ? records.items.first : throw Exception('Student not found');
    } catch (e) {
      throw Exception('Failed to get student by NFC ID: ${e.toString()}');
    }
  }

  Future<RecordModel> getTeacherByCardId(String cardId) async {
    try {
      final records = await pb.collection('teachers').getList(
        filter: 'card_id = "$cardId"',
        perPage: 1,
      );
      return records.items.isNotEmpty ? records.items.first : throw Exception('Teacher not found');
    } catch (e) {
      throw Exception('Failed to get teacher by card ID: ${e.toString()}');
    }
  }

  Future<RecordModel> getTeacherByNfcId(String nfcId) async {
    try {
      final records = await pb.collection('teachers').getList(
        filter: 'nfc_tag_id = "$nfcId"',
        perPage: 1,
      );
      return records.items.isNotEmpty ? records.items.first : throw Exception('Teacher not found');
    } catch (e) {
      throw Exception('Failed to get teacher by NFC ID: ${e.toString()}');
    }
  }

  // 获取所有分行
  Future<List<RecordModel>> getCenters() async {
    try {
      final records = await pb.collection('centers').getList(
        perPage: 200,
        sort: 'name',
      );
      return records.items;
    } catch (e) {
      throw Exception('Failed to get centers: ${e.toString()}');
    }
  }

  // 创建分行
  Future<bool> createCenter(Map<String, dynamic> data) async {
    try {
      await pb.collection('centers').create(body: data);
      return true;
    } catch (e) {
      throw Exception('Failed to create center: ${e.toString()}');
    }
  }

  // 更新分行
  Future<bool> updateCenter(String id, Map<String, dynamic> data) async {
    try {
      await pb.collection('centers').update(id, body: data);
      return true;
    } catch (e) {
      throw Exception('Failed to update center: ${e.toString()}');
    }
  }

  // 删除分行
  Future<bool> deleteCenter(String id) async {
    try {
      await pb.collection('centers').delete(id);
      return true;
    } catch (e) {
      throw Exception('Failed to delete center: ${e.toString()}');
    }
  }

}
