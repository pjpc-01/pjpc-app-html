import 'package:pocketbase/pocketbase.dart';
import 'pocketbase_service.dart';

class AlertService {
  final PocketBaseService _pocketBaseService;
  
  AlertService() : _pocketBaseService = PocketBaseService.instance;
  
  // 高风险自动锁定学生
  Future<void> handleHighRiskStudent(String studentId, int riskScore) async {
    try {
      if (riskScore >= 80) {
        final lockUntil = DateTime.now().add(Duration(minutes: 30));
        
        await _pocketBaseService.pb.collection('students').update(studentId, body: {
          'security_status': 'locked',
          'auto_lock_until': lockUntil.toIso8601String(),
          'lock_reason': '高风险刷卡检测',
        });
        
        // 发送通知给管理员
        await sendAlertToAdmin('student', studentId, "高风险刷卡检测", riskScore);
        
        print('学生 $studentId 已被自动锁定30分钟');
      }
    } catch (e) {
      print('处理高风险学生失败: $e');
    }
  }
  
  // 高风险自动锁定教师
  Future<void> handleHighRiskTeacher(String teacherId, int riskScore) async {
    try {
      if (riskScore >= 80) {
        final lockUntil = DateTime.now().add(Duration(minutes: 30));
        
        await _pocketBaseService.pb.collection('teachers').update(teacherId, body: {
          'security_status': 'locked',
          'auto_lock_until': lockUntil.toIso8601String(),
          'lock_reason': '高风险刷卡检测',
        });
        
        // 发送通知给管理员
        await sendAlertToAdmin('teacher', teacherId, "高风险刷卡检测", riskScore);
        
        print('教师 $teacherId 已被自动锁定30分钟');
      }
    } catch (e) {
      print('处理高风险教师失败: $e');
    }
  }
  
  // 发送通知给管理员
  Future<void> sendAlertToAdmin(String userType, String userId, String message, int riskScore) async {
    try {
      // 这里可以集成邮件、短信或推送通知
      // 目前先打印到控制台
      print('🚨 安全警报 🚨');
      print('用户类型: $userType');
      print('用户ID: $userId');
      print('风险评分: $riskScore');
      print('警报信息: $message');
      print('时间: ${DateTime.now()}');
      print('==================');
      
      // TODO: 集成实际的通知服务
      // - 邮件通知
      // - 短信通知
      // - 推送通知
      // - 系统日志
      
    } catch (e) {
      print('发送警报失败: $e');
    }
  }
  
  // 检查并解除过期的锁定
  Future<void> checkAndUnlockExpired() async {
    try {
      final now = DateTime.now();
      
      // 检查学生锁定
      final lockedStudents = await _pocketBaseService.pb.collection('students').getList(
        filter: 'security_status = "locked" && auto_lock_until < "$now"',
        perPage: 100,
      );
      
      for (final student in lockedStudents.items) {
        await _pocketBaseService.pb.collection('students').update(student.id, body: {
          'security_status': 'normal',
          'auto_lock_until': null,
          'lock_reason': '',
        });
        print('学生 ${student.getStringValue('student_id')} 锁定已自动解除');
      }
      
      // 检查教师锁定
      final lockedTeachers = await _pocketBaseService.pb.collection('teachers').getList(
        filter: 'security_status = "locked" && auto_lock_until < "$now"',
        perPage: 100,
      );
      
      for (final teacher in lockedTeachers.items) {
        await _pocketBaseService.pb.collection('teachers').update(teacher.id, body: {
          'security_status': 'normal',
          'auto_lock_until': null,
          'lock_reason': '',
        });
        print('教师 ${teacher.getStringValue('name')} 锁定已自动解除');
      }
      
    } catch (e) {
      print('检查过期锁定失败: $e');
    }
  }
  
  // 手动解锁用户
  Future<void> manualUnlockUser(String userType, String userId) async {
    try {
      final collection = userType == 'student' ? 'students' : 'teachers';
      final idField = userType == 'student' ? 'student_id' : 'name';
      
      // 查找用户
      final result = await _pocketBaseService.pb.collection(collection).getList(
        filter: '$idField = "$userId"',
        perPage: 1,
      );
      
      if (result.items.isNotEmpty) {
        final user = result.items.first;
        await _pocketBaseService.pb.collection(collection).update(user.id, body: {
          'security_status': 'normal',
          'auto_lock_until': null,
          'lock_reason': '',
        });
        
        print('用户 $userId 已被手动解锁');
      }
    } catch (e) {
      print('手动解锁用户失败: $e');
    }
  }
  
  // 获取安全统计
  Future<Map<String, dynamic>> getSecurityStats() async {
    try {
      // 获取锁定学生数量
      final lockedStudents = await _pocketBaseService.pb.collection('students').getList(
        filter: 'security_status = "locked"',
        perPage: 1,
      );
      
      // 获取锁定教师数量
      final lockedTeachers = await _pocketBaseService.pb.collection('teachers').getList(
        filter: 'security_status = "locked"',
        perPage: 1,
      );
      
      // 获取今日可疑活动数量
      final today = DateTime.now().toIso8601String().split('T')[0];
      final suspiciousStudents = await _pocketBaseService.pb.collection('students').getList(
        filter: 'suspicious_activities > 0 && created ~ "$today"',
        perPage: 1,
      );
      
      return {
        'locked_students': lockedStudents.totalItems,
        'locked_teachers': lockedTeachers.totalItems,
        'suspicious_activities_today': suspiciousStudents.totalItems,
        'last_check': DateTime.now().toIso8601String(),
      };
    } catch (e) {
      print('获取安全统计失败: $e');
      return {
        'locked_students': 0,
        'locked_teachers': 0,
        'suspicious_activities_today': 0,
        'last_check': DateTime.now().toIso8601String(),
      };
    }
  }
}
