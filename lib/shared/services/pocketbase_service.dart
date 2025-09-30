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
      
      
      // 清除缓存，强制下次刷新
      PocketBaseCacheService.clearCache('students');
      
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

  // 获取教师考勤详细统计
  Future<Map<String, dynamic>> getTeacherAttendanceDetailedStats({
    String? teacherId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
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
        perPage: 1000,
        filter: filter.isNotEmpty ? filter : null,
        expand: 'teacher',
      );
      
      final records = result.items;
      
      // 按日期分组统计
      final Map<String, List<RecordModel>> recordsByDate = {};
      for (final record in records) {
        final date = record.getStringValue('date');
        if (date != null) {
          recordsByDate.putIfAbsent(date, () => []).add(record);
        }
      }
      
      // 计算各种统计指标
      int totalDays = recordsByDate.length;
      int completeDays = 0; // 有签到和签退的完整天数
      int incompleteDays = 0; // 只有签到没有签退的天数
      int absentDays = 0; // 完全缺席的天数
      int lateDays = 0; // 迟到的天数
      int earlyLeaveDays = 0; // 早退的天数
      
      double totalWorkHours = 0.0;
      double totalOvertimeHours = 0.0;
      
      for (final date in recordsByDate.keys) {
        final dayRecords = recordsByDate[date]!;
        final checkInRecord = dayRecords.firstWhere(
          (r) => r.getStringValue('check_in') != null && r.getStringValue('check_in')!.isNotEmpty,
          orElse: () => RecordModel(),
        );
        final checkOutRecord = dayRecords.firstWhere(
          (r) => r.getStringValue('check_out') != null && r.getStringValue('check_out')!.isNotEmpty,
          orElse: () => RecordModel(),
        );
        
        if (checkInRecord.id.isNotEmpty && checkOutRecord.id.isNotEmpty) {
          completeDays++;
          
          // 计算工作时长
          try {
            final checkInTime = DateTime.parse(checkInRecord.getStringValue('check_in')!);
            final checkOutTime = DateTime.parse(checkOutRecord.getStringValue('check_out')!);
            final workDuration = checkOutTime.difference(checkInTime);
            final workHours = workDuration.inMinutes / 60.0;
            totalWorkHours += workHours;
            
            // 检查是否加班（超过8小时）
            if (workHours > 8.0) {
              totalOvertimeHours += workHours - 8.0;
            }
            
            // 检查是否迟到（9点后签到）
            if (checkInTime.hour > 9 || (checkInTime.hour == 9 && checkInTime.minute > 0)) {
              lateDays++;
            }
            
            // 检查是否早退（17点前签退）
            if (checkOutTime.hour < 17) {
              earlyLeaveDays++;
            }
          } catch (e) {
            // 忽略日期解析错误
          }
        } else if (checkInRecord.id.isNotEmpty) {
          incompleteDays++;
        } else {
          absentDays++;
        }
      }
      
      // 计算平均工作时长
      final averageWorkHours = completeDays > 0 ? totalWorkHours / completeDays : 0.0;
      
      // 计算考勤率
      final attendanceRate = totalDays > 0 ? (completeDays / totalDays) * 100 : 0.0;
      
      // 计算准时率
      final punctualityRate = completeDays > 0 ? ((completeDays - lateDays) / completeDays) * 100 : 0.0;
      
      return {
        'total_days': totalDays,
        'complete_days': completeDays,
        'incomplete_days': incompleteDays,
        'absent_days': absentDays,
        'late_days': lateDays,
        'early_leave_days': earlyLeaveDays,
        'total_work_hours': totalWorkHours,
        'total_overtime_hours': totalOvertimeHours,
        'average_work_hours': averageWorkHours,
        'attendance_rate': attendanceRate,
        'punctuality_rate': punctualityRate,
        'efficiency_score': _calculateEfficiencyScore(completeDays, lateDays, earlyLeaveDays, totalDays),
      };
    } catch (e) {
      throw Exception('Failed to get detailed teacher attendance stats: ${e.toString()}');
    }
  }

  // 计算效率分数
  double _calculateEfficiencyScore(int completeDays, int lateDays, int earlyLeaveDays, int totalDays) {
    if (totalDays == 0) return 0.0;
    
    final attendanceScore = (completeDays / totalDays) * 40; // 考勤占40分
    final punctualityScore = completeDays > 0 ? ((completeDays - lateDays) / completeDays) * 30 : 0; // 准时率占30分
    final completionScore = completeDays > 0 ? ((completeDays - earlyLeaveDays) / completeDays) * 30 : 0; // 完成度占30分
    
    return (attendanceScore + punctualityScore + completionScore).clamp(0.0, 100.0);
  }

  // 获取教师考勤月度报表
  Future<List<Map<String, dynamic>>> getTeacherAttendanceMonthlyReport({
    String? teacherId,
    required int year,
    required int month,
  }) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final startDate = DateTime(year, month, 1);
      final endDate = DateTime(year, month + 1, 0);
      
      String filter = '';
      if (teacherId != null) {
        filter += 'teacher_id = "$teacherId"';
      }
      
      final startDateStr = startDate.toIso8601String().split('T')[0];
      final endDateStr = endDate.toIso8601String().split('T')[0];
      if (filter.isNotEmpty) {
        filter += ' && ';
      }
      filter += 'date >= "$startDateStr" && date <= "$endDateStr"';
      
      final result = await pb.collection('teacher_attendance').getList(
        page: 1,
        perPage: 1000,
        filter: filter,
        expand: 'teacher',
      );
      
      // 按日期分组
      final Map<String, List<RecordModel>> recordsByDate = {};
      for (final record in result.items) {
        final date = record.getStringValue('date');
        if (date != null) {
          recordsByDate.putIfAbsent(date, () => []).add(record);
        }
      }
      
      // 生成月度报表
      final List<Map<String, dynamic>> monthlyReport = [];
      for (int day = 1; day <= endDate.day; day++) {
        final date = DateTime(year, month, day);
        final dateStr = date.toIso8601String().split('T')[0];
        final dayRecords = recordsByDate[dateStr] ?? [];
        
        String status = 'absent';
        String checkInTime = '';
        String checkOutTime = '';
        double workHours = 0.0;
        String notes = '';
        
        if (dayRecords.isNotEmpty) {
          final checkInRecord = dayRecords.firstWhere(
            (r) => r.getStringValue('check_in') != null && r.getStringValue('check_in')!.isNotEmpty,
            orElse: () => RecordModel(),
          );
          final checkOutRecord = dayRecords.firstWhere(
            (r) => r.getStringValue('check_out') != null && r.getStringValue('check_out')!.isNotEmpty,
            orElse: () => RecordModel(),
          );
          
          if (checkInRecord.id.isNotEmpty && checkOutRecord.id.isNotEmpty) {
            status = 'present';
            checkInTime = checkInRecord.getStringValue('check_in')!;
            checkOutTime = checkOutRecord.getStringValue('check_out')!;
            
            try {
              final checkIn = DateTime.parse(checkInTime);
              final checkOut = DateTime.parse(checkOutTime);
              workHours = checkOut.difference(checkIn).inMinutes / 60.0;
            } catch (e) {
              workHours = 0.0;
            }
          } else if (checkInRecord.id.isNotEmpty) {
            status = 'incomplete';
            checkInTime = checkInRecord.getStringValue('check_in')!;
          }
          
          notes = dayRecords.first.getStringValue('notes') ?? '';
        }
        
        monthlyReport.add({
          'date': dateStr,
          'day': day,
          'weekday': date.weekday,
          'status': status,
          'check_in_time': checkInTime,
          'check_out_time': checkOutTime,
          'work_hours': workHours,
          'notes': notes,
        });
      }
      
      return monthlyReport;
    } catch (e) {
      throw Exception('Failed to get teacher attendance monthly report: ${e.toString()}');
    }
  }

  // 获取教师考勤异常记录
  Future<List<RecordModel>> getTeacherAttendanceAnomalies({
    String? teacherId,
    DateTime? startDate,
    DateTime? endDate,
    String? anomalyType, // 'late', 'early_leave', 'absent', 'incomplete'
  }) async {
    try {
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
        perPage: 1000,
        filter: filter.isNotEmpty ? filter : null,
        expand: 'teacher',
        sort: '-date',
      );
      
      final records = result.items;
      List<RecordModel> anomalies = [];
      
      // 按日期分组查找异常
      final Map<String, List<RecordModel>> recordsByDate = {};
      for (final record in records) {
        final date = record.getStringValue('date');
        if (date != null) {
          recordsByDate.putIfAbsent(date, () => []).add(record);
        }
      }
      
      for (final date in recordsByDate.keys) {
        final dayRecords = recordsByDate[date]!;
        final checkInRecord = dayRecords.firstWhere(
          (r) => r.getStringValue('check_in') != null && r.getStringValue('check_in')!.isNotEmpty,
          orElse: () => RecordModel(),
        );
        final checkOutRecord = dayRecords.firstWhere(
          (r) => r.getStringValue('check_out') != null && r.getStringValue('check_out')!.isNotEmpty,
          orElse: () => RecordModel(),
        );
        
        if (checkInRecord.id.isEmpty && checkOutRecord.id.isEmpty) {
          // 完全缺席
          if (anomalyType == null || anomalyType == 'absent') {
            anomalies.add(checkInRecord.id.isNotEmpty ? checkInRecord : dayRecords.first);
          }
        } else if (checkInRecord.id.isNotEmpty && checkOutRecord.id.isEmpty) {
          // 只有签到没有签退
          if (anomalyType == null || anomalyType == 'incomplete') {
            anomalies.add(checkInRecord);
          }
        } else if (checkInRecord.id.isNotEmpty && checkOutRecord.id.isNotEmpty) {
          // 检查是否迟到或早退
          try {
            final checkInTime = DateTime.parse(checkInRecord.getStringValue('check_in')!);
            final checkOutTime = DateTime.parse(checkOutRecord.getStringValue('check_out')!);
            
            if (checkInTime.hour > 9 || (checkInTime.hour == 9 && checkInTime.minute > 0)) {
              if (anomalyType == null || anomalyType == 'late') {
                anomalies.add(checkInRecord);
              }
            }
            
            if (checkOutTime.hour < 17) {
              if (anomalyType == null || anomalyType == 'early_leave') {
                anomalies.add(checkOutRecord);
              }
            }
          } catch (e) {
            // 忽略日期解析错误
          }
        }
      }
      
      return anomalies;
    } catch (e) {
      throw Exception('Failed to get teacher attendance anomalies: ${e.toString()}');
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
      
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        try {
          await authenticateAdmin();
        } catch (e) {
          throw Exception('用户未认证，请重新登录');
        }
      }
      
      // 尝试获取数据
      final result = await pb.collection('teachers').getList(
        page: page,
        perPage: perPage,
        filter: filter,
        sort: sort ?? 'name',
        fields: fields?.join(','),
      );
      
      
      // 打印前几条记录用于调试
      for (int i = 0; i < result.items.length && i < 3; i++) {
        final teacher = result.items[i];
      }
      
      return result.items;
    } catch (e) {
      
      // 尝试备用方法
      try {
        pb.authStore.clear();
        final result = await pb.collection('teachers').getList(
          page: page,
          perPage: perPage,
          filter: filter,
          sort: sort ?? 'name',
          fields: fields?.join(','),
        );
        
        
        // 恢复认证
        await authenticateAdmin();
        
        return result.items;
      } catch (backupError) {
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
      
      // 强制重新认证
      await authenticateAdmin();
      
      // 直接查询服务器端记录
      final record = await pb.collection('teachers').getOne(id);
      
      return record;
    } catch (e) {
      return null;
    }
  }

  // 调试方法：获取服务器端所有教师记录
  Future<List<RecordModel>> getAllTeachersFromServer() async {
    try {
      
      // 强制重新认证
      await authenticateAdmin();
      
      // 尝试多种查询方法
      List<RecordModel> teachers = [];
      
      // 方法1：直接查询
      try {
        final result = await pb.collection('teachers').getList(perPage: 200);
        teachers = result.items;
      } catch (e1) {
        
        // 方法2：清除认证后查询
        try {
          pb.authStore.clear();
          final result = await pb.collection('teachers').getList(perPage: 200);
          teachers = result.items;
          
          // 恢复认证
          await authenticateAdmin();
        } catch (e2) {
          
          // 方法3：使用不同的认证方式
          try {
            await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!');
            final result = await pb.collection('teachers').getList(perPage: 200);
            teachers = result.items;
          } catch (e3) {
            throw Exception('所有查询方法都失败了');
          }
        }
      }
      
      
      for (int i = 0; i < teachers.length; i++) {
        final teacher = teachers[i];
      }
      
      return teachers;
    } catch (e) {
      return [];
    }
  }

  // 简化的教师更新方法
  Future<RecordModel> updateTeacherSimple(String id, Map<String, dynamic> data) async {
    try {
      
      // 先获取服务器端所有记录，看看实际的ID
      final serverTeachers = await getAllTeachersFromServer();
      
      // 尝试通过邮箱找到正确的ID
      final email = data['email'];
      if (email != null) {
        final matchingTeacher = serverTeachers.firstWhere(
          (t) => t.getStringValue('email') == email,
          orElse: () => throw Exception('未找到匹配的教师记录'),
        );
        
        
        // 使用找到的正确ID进行更新
        final record = await pb.collection('teachers').update(matchingTeacher.id, body: data);
        
        // 清除缓存，强制下次刷新
        PocketBaseCacheService.clearCache('teachers');
        
        return record;
      }
      
      // 如果无法通过邮箱匹配，直接尝试更新
      final record = await pb.collection('teachers').update(id, body: data);
      
      // 清除缓存，强制下次刷新
      PocketBaseCacheService.clearCache('teachers');
      
      return record;
    } catch (e) {
      throw Exception('简化更新失败: ${e.toString()}');
    }
  }

  Future<RecordModel> updateTeacher(String id, Map<String, dynamic> data) async {
    try {
      // 强制重新认证以确保权限
      try {
        await authenticateAdmin();
      } catch (authError) {
        throw Exception('用户未认证，请重新登录: ${authError.toString()}');
      }

      // 调试信息

      // 测试管理员权限
      try {
        final testResult = await pb.collection('teachers').getList(perPage: 1);
      } catch (permError) {
        throw Exception('管理员权限不足，无法访问teachers集合: ${permError.toString()}');
      }

      // 验证服务器端记录状态
      try {
        final serverRecord = await pb.collection('teachers').getOne(id);
        
        // 如果验证成功，尝试更新记录
        final record = await pb.collection('teachers').update(id, body: data);
        
        // 清除缓存，强制下次刷新
        PocketBaseCacheService.clearCache('teachers');
        
        return record;
      } catch (serverError) {
        if (serverError.toString().contains('404')) {
          // 尝试使用调试方法再次查询
          final debugRecord = await getTeacherByIdFromServer(id);
          if (debugRecord != null) {
            try {
              final record = await pb.collection('teachers').update(id, body: data);
              
              // 清除缓存，强制下次刷新
              PocketBaseCacheService.clearCache('teachers');
              
              return record;
            } catch (updateError) {
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
      
      // 方法4: 通过电邮查找（新增方法）
      try {
        // 获取当前用户的邮箱
        final currentUser = pb.authStore.record;
        if (currentUser != null) {
          final userEmail = currentUser.getStringValue('email');
          if (userEmail != null && userEmail.isNotEmpty) {
            
            final result = await pb.collection('teachers').getList(
              filter: 'email = "${userEmail.trim()}"',
              perPage: 1,
            );
            
            if (result.items.isNotEmpty) {
              return result.items.first;
            } else {
            }
          } else {
          }
        } else {
        }
      } catch (e) {
      }
      
      // 方法5: 通过用户名查找（备用方法）
      try {
        final currentUser = pb.authStore.record;
        if (currentUser != null) {
          final userName = currentUser.getStringValue('name');
          if (userName != null && userName.isNotEmpty) {
            
            final result = await pb.collection('teachers').getList(
              filter: 'name = "${userName.trim()}"',
              perPage: 1,
            );
            
            if (result.items.isNotEmpty) {
              return result.items.first;
            } else {
            }
          }
        }
      } catch (e) {
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }

  /// 根据电邮获取教师信息
  Future<RecordModel?> getTeacherByEmail(String email) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      
      final result = await pb.collection('teachers').getList(
        filter: 'email = "${email.trim()}"',
        perPage: 1,
      );
      
      if (result.items.isNotEmpty) {
        return result.items.first;
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }

  /// 根据用户名获取教师信息
  Future<RecordModel?> getTeacherByName(String name) async {
    try {
      // 确保用户已认证
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      
      final result = await pb.collection('teachers').getList(
        filter: 'name = "${name.trim()}"',
        perPage: 1,
      );
      
      if (result.items.isNotEmpty) {
        return result.items.first;
      } else {
        return null;
      }
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
      } catch (usersError) {
        // 如果 users 集合失败，尝试 _superusers
        await pb.collection('_superusers').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!');
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
      
      
      final result = await pb.collection('notifications').getList(
        page: page,
        perPage: perPage,
        sort: '-created',
      );
      
      
      // 打印前几个通知的详细信息
      for (int i = 0; i < result.items.length && i < 5; i++) {
        final notification = result.items[i];
      }
      
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch all notifications: ${e.toString()}');
    }
  }

  // 根据角色获取通知
  Future<List<RecordModel>> getNotificationsForRole(String role) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      
      final result = await pb.collection('notifications').getList(
        page: 1,
        perPage: 100,
        sort: '-created',
        filter: 'recipient_role = "$role"',
      );
      
      
      return result.items;
    } catch (e) {
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
      
      
      String filter = '';
      
      // 根据用户角色过滤通知
      if (userRole.isNotEmpty) {
        filter = '(recipient_role = "$userRole" || recipient_role = "all")';
      } else {
        // 如果没有角色信息，获取所有通知
      }
      
      if (isRead != null) {
        if (filter.isNotEmpty) filter += ' && ';
        filter += 'is_read = $isRead';
      }
      
      
      final result = await pb.collection('notifications').getList(
        page: page,
        perPage: perPage,
        sort: '-created',
        filter: filter.isNotEmpty ? filter : null,
      );
      
      
      // 如果没有找到通知，尝试获取所有通知（用于调试）
      if (result.items.isEmpty) {
        final allResult = await pb.collection('notifications').getList(
          page: 1,
          perPage: 10,
          sort: '-created',
        );
        for (int i = 0; i < allResult.items.length; i++) {
          final notification = allResult.items[i];
        }
      }
      
      return result.items;
    } catch (e) {
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
      
      
      final record = await pb.collection('notifications').create(body: notificationData);
      return record;
    } catch (e) {
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
  Future<RecordModel?> getStudentByNfcId(String nfcId) async {
    try {
      // 尝试使用 cardNumber 字段查找学生（这是学生集合中实际使用的字段）
      final records = await pb.collection('students').getList(
        filter: 'cardNumber = "$nfcId"',
        perPage: 1,
      );
      if (records.items.isNotEmpty) {
        return records.items.first;
      }
      
      // 如果没找到，尝试使用 nfc_tag_id 字段（备用字段）
      // 注意：如果这个字段不存在，查询会失败，这是正常的
      try {
        final records2 = await pb.collection('students').getList(
          filter: 'nfc_tag_id = "$nfcId"',
          perPage: 1,
        );
        return records2.items.isNotEmpty ? records2.items.first : null;
      } catch (e) {
        // nfc_tag_id 字段不存在，这是正常的，直接返回null
        return null;
      }
    } catch (e) {
      return null;
    }
  }

  Future<RecordModel?> getTeacherByCardId(String cardId) async {
    try {
      // 尝试使用 cardNumber 字段查找教师（统一字段）
      final records = await pb.collection('teachers').getList(
        filter: 'cardNumber = "$cardId"',
        perPage: 1,
      );
      if (records.items.isNotEmpty) {
        return records.items.first;
      }
      
      // 如果没找到，尝试使用 card_id 字段（备用字段）
      final records2 = await pb.collection('teachers').getList(
        filter: 'card_id = "$cardId"',
        perPage: 1,
      );
      return records2.items.isNotEmpty ? records2.items.first : null;
    } catch (e) {
      return null;
    }
  }

  Future<RecordModel?> getTeacherByNfcId(String nfcId) async {
    try {
      // 尝试使用 cardNumber 字段查找教师（统一字段）
      final records = await pb.collection('teachers').getList(
        filter: 'cardNumber = "$nfcId"',
        perPage: 1,
      );
      if (records.items.isNotEmpty) {
        return records.items.first;
      }
      
      // 如果没找到，尝试使用 nfc_tag_id 字段（备用字段）
      // 注意：如果这个字段不存在，查询会失败，这是正常的
      try {
        final records2 = await pb.collection('teachers').getList(
          filter: 'nfc_tag_id = "$nfcId"',
          perPage: 1,
        );
        return records2.items.isNotEmpty ? records2.items.first : null;
      } catch (e) {
        // nfc_tag_id 字段不存在，这是正常的，直接返回null
        return null;
      }
    } catch (e) {
      return null;
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

  // ==================== 教师薪资管理 ====================
  

  // 创建薪资记录
  Future<RecordModel> createSalaryRecord(Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }

      final record = await pb.collection('teacher_salary_record').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create salary record: ${e.toString()}');
    }
  }

  // 更新薪资记录
  Future<RecordModel> updateSalaryRecord(String recordId, Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }

      final record = await pb.collection('teacher_salary_record').update(recordId, body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to update salary record: ${e.toString()}');
    }
  }

  // 根据ID获取记录
  Future<RecordModel> getRecordById(String collection, String id) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }

      final record = await pb.collection(collection).getOne(id);
      return record;
    } catch (e) {
      throw Exception('Failed to get record: ${e.toString()}');
    }
  }

  // 获取教师薪资记录
  Future<List<RecordModel>> getTeacherSalaryRecords({
    String? teacherId,
    DateTime? startDate,
    DateTime? endDate,
    int page = 1,
    int perPage = 50,
  }) async {
    try {
      print('=== PocketBase API 调试 ===');
      print('认证状态: ${pb.authStore.isValid}');
      print('当前用户: ${pb.authStore.record?.id}');
      print('用户角色: ${pb.authStore.record?.getStringValue('role')}');
      
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      String filter = '';
      if (teacherId != null) {
        // 首先尝试直接匹配teacher_id
        // 如果失败，则通过teachers表查找对应的teacher_id
        try {
          // 检查当前用户是否在teachers表中
          final teachers = await pb.collection('teachers').getList(
            filter: 'id = "$teacherId"',
            perPage: 1,
          );
          
          if (teachers.items.isNotEmpty) {
            // 用户ID就是teacher_id
            filter += 'teacher_id = "$teacherId"';
            print('直接匹配teacher_id: $teacherId');
          } else {
            // 用户ID不是teacher_id，需要通过email查找对应的teacher
            final currentUser = pb.authStore.record;
            if (currentUser != null) {
              final userEmail = currentUser.getStringValue('email');
              final teacherRecords = await pb.collection('teachers').getList(
                filter: 'email = "$userEmail"',
                perPage: 1,
              );
              
              if (teacherRecords.items.isNotEmpty) {
                final actualTeacherId = teacherRecords.items.first.id;
                filter += 'teacher_id = "$actualTeacherId"';
                print('通过email找到teacher_id: $actualTeacherId');
              } else {
                // 没有找到对应的teacher记录
                filter += 'teacher_id = "nonexistent"';
                print('没有找到对应的teacher记录');
              }
            }
          }
        } catch (e) {
          // 如果查询失败，使用原始逻辑
          filter += 'teacher_id = "$teacherId"';
          print('查询teacher失败，使用原始逻辑: $e');
        }
      }
      
      if (startDate != null && endDate != null) {
        final startDateStr = startDate.toIso8601String().split('T')[0];
        final endDateStr = endDate.toIso8601String().split('T')[0];
        if (filter.isNotEmpty) {
          filter += ' && ';
        }
        filter += 'effective_date >= "$startDateStr" && effective_date <= "$endDateStr"';
      }
      
      print('过滤条件: $filter');
      print('页码: $page, 每页数量: $perPage');
      
      // 首先测试集合是否存在
      try {
        print('测试集合访问...');
        final testResult = await pb.collection('teacher_salary_record').getList(
          page: 1,
          perPage: 1,
        );
        print('集合访问成功，总记录数: ${testResult.totalItems}');
      } catch (testError) {
        print('集合访问失败: $testError');
        throw Exception('数据库表 teacher_salary_record 不存在或无法访问: $testError');
      }
      
      final result = await pb.collection('teacher_salary_record').getList(
        page: page,
        perPage: perPage,
        filter: filter.isNotEmpty ? filter : null,
        sort: '-effective_date',
        expand: 'teacher',
      );
      
      print('API请求成功，返回记录数: ${result.items.length}');
      return result.items;
    } catch (e) {
      print('API请求失败: $e');
      throw Exception('Failed to fetch teacher salary records: ${e.toString()}');
    }
  }

  // 创建教师薪资记录
  Future<RecordModel> createTeacherSalaryRecord(Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final record = await pb.collection('teacher_salary_record').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create teacher salary record: ${e.toString()}');
    }
  }

  // 更新教师薪资记录
  Future<RecordModel> updateTeacherSalaryRecord(String id, Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final record = await pb.collection('teacher_salary_record').update(id, body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to update teacher salary record: ${e.toString()}');
    }
  }

  // 删除教师薪资记录
  Future<void> deleteTeacherSalaryRecord(String id) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      await pb.collection('teacher_salary_record').delete(id);
    } catch (e) {
      throw Exception('Failed to delete teacher salary record: ${e.toString()}');
    }
  }

  // 获取教师薪资结构
  Future<List<RecordModel>> getTeacherSalaryStructures({
    String? teacherId,
    int page = 1,
    int perPage = 50,
  }) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      String filter = '';
      if (teacherId != null) {
        filter = 'teacher_id = "$teacherId"';
      }
      
      final result = await pb.collection('teacher_salary_structure').getList(
        page: page,
        perPage: perPage,
        filter: filter.isNotEmpty ? filter : null,
        sort: '-created',
        expand: 'teacher',
      );
      
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch teacher salary structures: ${e.toString()}');
    }
  }

  // 创建教师薪资结构
  Future<RecordModel> createTeacherSalaryStructure(Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final record = await pb.collection('teacher_salary_structure').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create teacher salary structure: ${e.toString()}');
    }
  }

  // 更新教师薪资结构
  Future<RecordModel> updateTeacherSalaryStructure(String id, Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final record = await pb.collection('teacher_salary_structure').update(id, body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to update teacher salary structure: ${e.toString()}');
    }
  }

  // 获取教师薪资统计
  Future<Map<String, dynamic>> getTeacherSalaryStats({
    String? teacherId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
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
        filter += 'effective_date >= "$startDateStr" && effective_date <= "$endDateStr"';
      }
      
      final result = await pb.collection('teacher_salary_record').getList(
        page: 1,
        perPage: 1000,
        filter: filter.isNotEmpty ? filter : null,
        expand: 'teacher',
      );
      
      final records = result.items;
      double totalSalary = 0.0;
      double totalBonus = 0.0;
      double totalDeduction = 0.0;
      int recordCount = records.length;
      
      for (final record in records) {
        totalSalary += record.getDoubleValue('base_salary') ?? 0.0;
        totalBonus += record.getDoubleValue('bonus') ?? 0.0;
        totalDeduction += record.getDoubleValue('deduction') ?? 0.0;
      }
      
      return {
        'total_records': recordCount,
        'total_salary': totalSalary,
        'total_bonus': totalBonus,
        'total_deduction': totalDeduction,
        'net_salary': totalSalary + totalBonus - totalDeduction,
        'average_salary': recordCount > 0 ? (totalSalary + totalBonus - totalDeduction) / recordCount : 0.0,
      };
    } catch (e) {
      throw Exception('Failed to get teacher salary stats: ${e.toString()}');
    }
  }

  // ==================== 排班模板管理 ====================
  
  // 获取排班模板
  Future<List<RecordModel>> getScheduleTemplates({
    String? type,
    bool? isActive,
    int page = 1,
    int perPage = 50,
  }) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }

      String filter = '';
      if (type != null) {
        filter += 'type = "$type"';
      }
      
      if (isActive != null) {
        if (filter.isNotEmpty) filter += ' && ';
        filter += 'is_active = $isActive';
      }

      final result = await pb.collection('schedule_templates').getList(
        page: page,
        perPage: perPage,
        filter: filter.isNotEmpty ? filter : null,
        sort: 'name',
      );

      return result.items ?? [];
    } catch (e) {
      throw Exception('Failed to fetch schedule templates: ${e.toString()}');
    }
  }

  // 创建排班模板
  Future<RecordModel> createScheduleTemplate(Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }

      final record = await pb.collection('schedule_templates').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create schedule template: ${e.toString()}');
    }
  }

  // 更新排班模板
  Future<RecordModel> updateScheduleTemplate(String templateId, Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }

      final record = await pb.collection('schedule_templates').update(templateId, body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to update schedule template: ${e.toString()}');
    }
  }

  // 删除排班模板
  Future<void> deleteScheduleTemplate(String templateId) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }

      await pb.collection('schedule_templates').delete(templateId);
    } catch (e) {
      throw Exception('Failed to delete schedule template: ${e.toString()}');
    }
  }

  // ==================== 排班管理 ====================
  
  // 获取排班记录
  Future<List<RecordModel>> getSchedules({
    String? teacherId,
    String? classId,
    String? status,
    String? scheduleType,
    DateTime? startDate,
    DateTime? endDate,
    int page = 1,
    int perPage = 50,
  }) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }

      String filter = '';
      if (teacherId != null) {
        filter += 'teacher_id = "$teacherId"';
      }
      
      if (classId != null) {
        if (filter.isNotEmpty) filter += ' && ';
        filter += 'class_id = "$classId"';
      }
      
      if (status != null) {
        if (filter.isNotEmpty) filter += ' && ';
        filter += 'status = "$status"';
      }
      
      if (scheduleType != null) {
        if (filter.isNotEmpty) filter += ' && ';
        filter += 'schedule_type = "$scheduleType"';
      }
      
      if (startDate != null && endDate != null) {
        if (filter.isNotEmpty) filter += ' && ';
        final startDateStr = startDate.toIso8601String().split('T')[0];
        final endDateStr = endDate.toIso8601String().split('T')[0];
        filter += 'date >= "$startDateStr" && date <= "$endDateStr"';
      }

      final result = await pb.collection('schedules').getList(
        page: page,
        perPage: perPage,
        filter: filter.isNotEmpty ? filter : null,
        sort: 'date,start_time',
        expand: 'teacher_id,class_id',
      );

      return result.items ?? [];
    } catch (e) {
      throw Exception('Failed to fetch schedules: ${e.toString()}');
    }
  }

  // 创建排班记录
  Future<RecordModel> createSchedule(Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }

      final record = await pb.collection('schedules').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create schedule: ${e.toString()}');
    }
  }

  // 更新排班记录
  Future<RecordModel> updateSchedule(String scheduleId, Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }

      final record = await pb.collection('schedules').update(scheduleId, body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to update schedule: ${e.toString()}');
    }
  }

  // 删除排班记录
  Future<void> deleteSchedule(String scheduleId) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }

      await pb.collection('schedules').delete(scheduleId);
    } catch (e) {
      throw Exception('Failed to delete schedule: ${e.toString()}');
    }
  }

  // 获取排班统计
  Future<Map<String, dynamic>> getScheduleStats({
    String? teacherId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }

      String filter = '';
      if (teacherId != null) {
        filter += 'teacher_id = "$teacherId"';
      }

      final result = await pb.collection('teacher_schedule').getList(
        page: 1,
        perPage: 1000,
        filter: filter.isNotEmpty ? filter : null,
        expand: 'teacher',
      );

      final schedules = result.items;
      final activeSchedules = schedules.where((s) => s.getBoolValue('is_active') ?? true).toList();
      
      // 按天统计
      final Map<String, int> schedulesByDay = {};
      double totalWorkHours = 0.0;
      
      for (final schedule in activeSchedules) {
        final dayOfWeek = schedule.getStringValue('day_of_week') ?? '';
        schedulesByDay[dayOfWeek] = (schedulesByDay[dayOfWeek] ?? 0) + 1;
        
        // 计算工作时长
        final startTime = schedule.getStringValue('start_time') ?? '';
        final endTime = schedule.getStringValue('end_time') ?? '';
        if (startTime.isNotEmpty && endTime.isNotEmpty) {
          try {
            final start = DateTime.parse('2024-01-01 $startTime:00');
            final end = DateTime.parse('2024-01-01 $endTime:00');
            final workHours = end.difference(start).inHours.toDouble();
            totalWorkHours += workHours;
          } catch (e) {
            // 忽略时间解析错误
          }
        }
      }

      return {
        'total_schedules': activeSchedules.length,
        'total_work_hours_per_week': totalWorkHours,
        'schedules_by_day': schedulesByDay,
        'average_work_hours_per_day': schedulesByDay.isNotEmpty ? totalWorkHours / schedulesByDay.length : 0.0,
      };
    } catch (e) {
      throw Exception('Failed to get schedule stats: ${e.toString()}');
    }
  }

  // ==================== 教师请假管理 ====================
  
  // 获取教师请假记录
  Future<List<RecordModel>> getTeacherLeaveRecords({
    String? teacherId,
    String? status,
    DateTime? startDate,
    DateTime? endDate,
    int page = 1,
    int perPage = 50,
  }) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      String filter = '';
      if (teacherId != null) {
        filter += 'teacher_id = "$teacherId"';
      }
      
      if (status != null && status.isNotEmpty) {
        if (filter.isNotEmpty) {
          filter += ' && ';
        }
        filter += 'status = "$status"';
      }
      
      if (startDate != null && endDate != null) {
        final startDateStr = startDate.toIso8601String().split('T')[0];
        final endDateStr = endDate.toIso8601String().split('T')[0];
        if (filter.isNotEmpty) {
          filter += ' && ';
        }
        filter += 'leave_start_date >= "$startDateStr" && leave_end_date <= "$endDateStr"';
      }
      
      final result = await pb.collection('teacher_leave_record').getList(
        page: page,
        perPage: perPage,
        filter: filter.isNotEmpty ? filter : null,
        sort: '-created',
        expand: 'teacher',
      );
      
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch teacher leave records: ${e.toString()}');
    }
  }

  // 创建教师请假记录
  Future<RecordModel> createTeacherLeaveRecord(Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final record = await pb.collection('teacher_leave_record').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create teacher leave record: ${e.toString()}');
    }
  }

  // 更新教师请假记录
  Future<RecordModel> updateTeacherLeaveRecord(String id, Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final record = await pb.collection('teacher_leave_record').update(id, body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to update teacher leave record: ${e.toString()}');
    }
  }

  // 删除教师请假记录
  Future<void> deleteTeacherLeaveRecord(String id) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      await pb.collection('teacher_leave_record').delete(id);
    } catch (e) {
      throw Exception('Failed to delete teacher leave record: ${e.toString()}');
    }
  }

  // 获取教师请假余额
  Future<List<RecordModel>> getTeacherLeaveBalances({
    String? teacherId,
    int page = 1,
    int perPage = 50,
  }) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      String filter = '';
      if (teacherId != null) {
        filter = 'teacher_id = "$teacherId"';
      }
      
      final result = await pb.collection('teacher_leave_balance').getList(
        page: page,
        perPage: perPage,
        filter: filter.isNotEmpty ? filter : null,
        sort: '-created',
        expand: 'teacher',
      );
      
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch teacher leave balances: ${e.toString()}');
    }
  }

  // 更新教师请假余额
  Future<RecordModel> updateTeacherLeaveBalance(String id, Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final record = await pb.collection('teacher_leave_balance').update(id, body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to update teacher leave balance: ${e.toString()}');
    }
  }

  // 获取教师请假统计
  Future<Map<String, dynamic>> getTeacherLeaveStats({
    String? teacherId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
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
        filter += 'leave_start_date >= "$startDateStr" && leave_end_date <= "$endDateStr"';
      }
      
      final result = await pb.collection('teacher_leave_record').getList(
        page: 1,
        perPage: 1000,
        filter: filter.isNotEmpty ? filter : null,
        expand: 'teacher',
      );
      
      final records = result.items;
      int totalLeaves = records.length;
      int pendingLeaves = records.where((r) => r.getStringValue('status') == 'pending').length;
      int approvedLeaves = records.where((r) => r.getStringValue('status') == 'approved').length;
      int rejectedLeaves = records.where((r) => r.getStringValue('status') == 'rejected').length;
      
      int totalLeaveDays = 0;
      for (final record in records) {
        final startDate = record.getStringValue('leave_start_date');
        final endDate = record.getStringValue('leave_end_date');
        if (startDate != null && endDate != null) {
          try {
            final start = DateTime.parse(startDate);
            final end = DateTime.parse(endDate);
            totalLeaveDays += end.difference(start).inDays + 1;
          } catch (e) {
            // 忽略日期解析错误
          }
        }
      }
      
      return {
        'total_leaves': totalLeaves,
        'pending_leaves': pendingLeaves,
        'approved_leaves': approvedLeaves,
        'rejected_leaves': rejectedLeaves,
        'total_leave_days': totalLeaveDays,
        'approval_rate': totalLeaves > 0 ? (approvedLeaves / totalLeaves) * 100 : 0.0,
      };
    } catch (e) {
      throw Exception('Failed to get teacher leave stats: ${e.toString()}');
    }
  }

  // ==================== 教师绩效评估 ====================
  
  // 获取教师绩效评估记录
  Future<List<RecordModel>> getTeacherPerformanceEvaluations({
    String? teacherId,
    DateTime? startDate,
    DateTime? endDate,
    int page = 1,
    int perPage = 50,
  }) async {
    try {
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
        filter += 'evaluation_date >= "$startDateStr" && evaluation_date <= "$endDateStr"';
      }
      
      final result = await pb.collection('teacher_performance_evaluation').getList(
        page: page,
        perPage: perPage,
        filter: filter.isNotEmpty ? filter : null,
        sort: '-evaluation_date',
        expand: 'teacher',
      );
      
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch teacher performance evaluations: ${e.toString()}');
    }
  }

  // 创建教师绩效评估记录
  Future<RecordModel> createTeacherPerformanceEvaluation(Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final record = await pb.collection('teacher_performance_evaluation').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create teacher performance evaluation: ${e.toString()}');
    }
  }

  // 更新教师绩效评估记录
  Future<RecordModel> updateTeacherPerformanceEvaluation(String id, Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final record = await pb.collection('teacher_performance_evaluation').update(id, body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to update teacher performance evaluation: ${e.toString()}');
    }
  }

  // ==================== 教师培训记录 ====================
  
  // 获取教师培训记录
  Future<List<RecordModel>> getTeacherTrainingRecords({
    String? teacherId,
    DateTime? startDate,
    DateTime? endDate,
    int page = 1,
    int perPage = 50,
  }) async {
    try {
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
        filter += 'training_date >= "$startDateStr" && training_date <= "$endDateStr"';
      }
      
      final result = await pb.collection('teacher_training_record').getList(
        page: page,
        perPage: perPage,
        filter: filter.isNotEmpty ? filter : null,
        sort: '-training_date',
        expand: 'teacher',
      );
      
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch teacher training records: ${e.toString()}');
    }
  }

  // 创建教师培训记录
  Future<RecordModel> createTeacherTrainingRecord(Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final record = await pb.collection('teacher_training_record').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create teacher training record: ${e.toString()}');
    }
  }

  // 更新教师培训记录
  Future<RecordModel> updateTeacherTrainingRecord(String id, Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final record = await pb.collection('teacher_training_record').update(id, body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to update teacher training record: ${e.toString()}');
    }
  }

  // ==================== 教师认证管理 ====================
  
  // 获取教师认证记录
  Future<List<RecordModel>> getTeacherCertifications({
    String? teacherId,
    int page = 1,
    int perPage = 50,
  }) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      String filter = '';
      if (teacherId != null) {
        filter = 'teacher_id = "$teacherId"';
      }
      
      final result = await pb.collection('teacher_certification').getList(
        page: page,
        perPage: perPage,
        filter: filter.isNotEmpty ? filter : null,
        sort: '-certification_date',
        expand: 'teacher',
      );
      
      return result.items;
    } catch (e) {
      throw Exception('Failed to fetch teacher certifications: ${e.toString()}');
    }
  }

  // 创建教师认证记录
  Future<RecordModel> createTeacherCertification(Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final record = await pb.collection('teacher_certification').create(body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to create teacher certification: ${e.toString()}');
    }
  }

  // 更新教师认证记录
  Future<RecordModel> updateTeacherCertification(String id, Map<String, dynamic> data) async {
    try {
      if (!pb.authStore.isValid) {
        throw Exception('User not authenticated. Please login first.');
      }
      
      final record = await pb.collection('teacher_certification').update(id, body: data);
      return record;
    } catch (e) {
      throw Exception('Failed to update teacher certification: ${e.toString()}');
    }
  }

}
