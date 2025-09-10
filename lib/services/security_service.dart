import 'package:pocketbase/pocketbase.dart';
import 'pocketbase_service.dart';

class SecurityService {
  final PocketBaseService _pocketBaseService;
  
  SecurityService() : _pocketBaseService = PocketBaseService.instance;
  
  // 检测快速连续刷卡
  Future<bool> detectRapidSuccessiveSwipes(String studentId) async {
    try {
      final now = DateTime.now();
      final fiveMinutesAgo = now.subtract(Duration(minutes: 5));
      
      final result = await _pocketBaseService.pb.collection('student_attendance').getList(
        filter: 'student_id = "$studentId" && created > "$fiveMinutesAgo"',
        perPage: 10,
      );
      
      return result.items.length > 3; // 5分钟内超过3次刷卡
    } catch (e) {
      print('检测快速连续刷卡失败: $e');
      return false;
    }
  }
  
  // 检测教师快速连续刷卡
  Future<bool> detectTeacherRapidSuccessiveSwipes(String teacherId) async {
    try {
      final now = DateTime.now();
      final fiveMinutesAgo = now.subtract(Duration(minutes: 5));
      
      final result = await _pocketBaseService.pb.collection('teacher_attendance').getList(
        filter: 'teacher_id = "$teacherId" && created > "$fiveMinutesAgo"',
        perPage: 10,
      );
      
      return result.items.length > 3; // 5分钟内超过3次刷卡
    } catch (e) {
      print('检测教师快速连续刷卡失败: $e');
      return false;
    }
  }
  
  // 检测异常时间
  bool detectUnusualTime(DateTime swipeTime) {
    final hour = swipeTime.hour;
    // 允许时间范围: 06:00-22:00
    return hour < 6 || hour > 22;
  }
  
  // 计算风险评分
  Future<int> calculateRiskScore(String studentId, Map<String, dynamic> swipeData) async {
    int score = 0;
    
    try {
      // 检测快速连续刷卡 (30分)
      if (await detectRapidSuccessiveSwipes(studentId)) {
        score += 30;
      }
      
      // 检测异常时间 (20分)
      if (detectUnusualTime(DateTime.parse(swipeData['timestamp'] ?? DateTime.now().toIso8601String()))) {
        score += 20;
      }
      
      // 检测位置不匹配 (25分)
      if (swipeData['location'] == 'unknown' || swipeData['location'] == null) {
        score += 25;
      }
      
      // 检测设备不匹配 (25分)
      if (swipeData['device_id'] == 'unknown' || swipeData['device_id'] == null) {
        score += 25;
      }
      
      return score;
    } catch (e) {
      print('计算风险评分失败: $e');
      return 0;
    }
  }
  
  // 更新学生安全状态
  Future<void> updateStudentSecurityStatus(String studentId, Map<String, dynamic> data) async {
    try {
      await _pocketBaseService.pb.collection('students').update(studentId, body: data);
    } catch (e) {
      print('更新学生安全状态失败: $e');
    }
  }
  
  // 更新教师安全状态
  Future<void> updateTeacherSecurityStatus(String teacherId, Map<String, dynamic> data) async {
    try {
      await _pocketBaseService.pb.collection('teachers').update(teacherId, body: data);
    } catch (e) {
      print('更新教师安全状态失败: $e');
    }
  }
  
  // 记录刷卡安全信息
  Future<void> recordSwipeSecurity(String attendanceId, Map<String, dynamic> securityData) async {
    try {
      await _pocketBaseService.pb.collection('student_attendance').update(attendanceId, body: securityData);
    } catch (e) {
      print('记录刷卡安全信息失败: $e');
    }
  }
  
  // 记录教师刷卡安全信息
  Future<void> recordTeacherSwipeSecurity(String attendanceId, Map<String, dynamic> securityData) async {
    try {
      await _pocketBaseService.pb.collection('teacher_attendance').update(attendanceId, body: securityData);
    } catch (e) {
      print('记录教师刷卡安全信息失败: $e');
    }
  }
  
  // 获取学生今日刷卡次数
  Future<int> getStudentSwipeCountToday(String studentId) async {
    try {
      final today = DateTime.now().toIso8601String().split('T')[0];
      final result = await _pocketBaseService.pb.collection('student_attendance').getList(
        filter: 'student_id = "$studentId" && created ~ "$today"',
        perPage: 100,
      );
      return result.items.length;
    } catch (e) {
      print('获取学生今日刷卡次数失败: $e');
      return 0;
    }
  }
  
  // 获取教师今日刷卡次数
  Future<int> getTeacherSwipeCountToday(String teacherId) async {
    try {
      final today = DateTime.now().toIso8601String().split('T')[0];
      final result = await _pocketBaseService.pb.collection('teacher_attendance').getList(
        filter: 'teacher_id = "$teacherId" && created ~ "$today"',
        perPage: 100,
      );
      return result.items.length;
    } catch (e) {
      print('获取教师今日刷卡次数失败: $e');
      return 0;
    }
  }
  
  // 检查用户是否被锁定
  Future<bool> isUserLocked(String userId, String userType) async {
    try {
      final collection = userType == 'student' ? 'students' : 'teachers';
      final user = await _pocketBaseService.pb.collection(collection).getOne(userId);
      
      final securityStatus = user.getStringValue('security_status');
      final autoLockUntil = user.getStringValue('auto_lock_until');
      
      if (securityStatus == 'locked') {
        // 检查是否已过锁定时间
        if (autoLockUntil != null) {
          final lockUntil = DateTime.parse(autoLockUntil);
          if (DateTime.now().isAfter(lockUntil)) {
            // 自动解锁
            await _unlockUser(userId, userType, '自动解锁（锁定时间已过）');
            return false;
          }
        }
        return true;
      }
      
      return false;
    } catch (e) {
      print('检查用户锁定状态失败: $e');
      return false;
    }
  }
  
  // 锁定用户
  Future<void> lockUser(String userId, String userType, String reason, {Duration? duration}) async {
    try {
      final collection = userType == 'student' ? 'students' : 'teachers';
      final lockDuration = duration ?? const Duration(minutes: 30);
      final lockUntil = DateTime.now().add(lockDuration);
      
      await _pocketBaseService.pb.collection(collection).update(userId, body: {
        'security_status': 'locked',
        'auto_lock_until': lockUntil.toIso8601String(),
        'lock_reason': reason,
      });
      
      print('已锁定$userType: $userId, 原因: $reason');
    } catch (e) {
      print('锁定用户失败: $e');
    }
  }
  
  // 解锁用户
  Future<void> _unlockUser(String userId, String userType, String reason) async {
    try {
      final collection = userType == 'student' ? 'students' : 'teachers';
      
      await _pocketBaseService.pb.collection(collection).update(userId, body: {
        'security_status': 'normal',
        'auto_lock_until': null,
        'lock_reason': reason,
      });
      
      print('已解锁$userType: $userId, 原因: $reason');
    } catch (e) {
      print('解锁用户失败: $e');
    }
  }
  
  // 手动解锁用户
  Future<void> manualUnlockUser(String userId, String userType, String adminId, String reason) async {
    await _unlockUser(userId, userType, '由管理员 $adminId 手动解锁: $reason');
  }
  
  // 获取用户安全状态
  Future<Map<String, dynamic>> getUserSecurityStatus(String userId, String userType) async {
    try {
      final collection = userType == 'student' ? 'students' : 'teachers';
      final user = await _pocketBaseService.pb.collection(collection).getOne(userId);
      
      return {
        'security_status': user.getStringValue('security_status') ?? 'normal',
        'risk_score': user.getIntValue('risk_score') ?? 0,
        'verification_level': user.getStringValue('verification_level') ?? 'normal',
        'suspicious_activities': user.getIntValue('suspicious_activities') ?? 0,
        'last_swipe_time': user.getStringValue('last_swipe_time'),
        'swipe_count_today': user.getIntValue('swipe_count_today') ?? 0,
        'lock_reason': user.getStringValue('lock_reason'),
        'auto_lock_until': user.getStringValue('auto_lock_until'),
      };
    } catch (e) {
      print('获取用户安全状态失败: $e');
      return {};
    }
  }
  
  // 更新用户风险评分
  Future<void> updateUserRiskScore(String userId, String userType, int riskScore) async {
    try {
      final collection = userType == 'student' ? 'students' : 'teachers';
      final verificationLevel = riskScore >= 80 ? 'emergency' : (riskScore >= 50 ? 'high' : 'normal');
      
      await _pocketBaseService.pb.collection(collection).update(userId, body: {
        'risk_score': riskScore,
        'verification_level': verificationLevel,
      });
    } catch (e) {
      print('更新用户风险评分失败: $e');
    }
  }
}
