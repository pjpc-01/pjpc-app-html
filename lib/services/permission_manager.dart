import '../../providers/auth_provider.dart';

class PermissionManager {
  /// 检查用户是否可以访问特定功能
  static bool canAccessFeature(String feature, AuthProvider authProvider) {
    final activeRole = authProvider.activeRole;
    
    switch (feature) {
      case 'student_management':
        return ['admin', 'teacher'].contains(activeRole);
      case 'teacher_management':
        return activeRole == 'admin';
      case 'class_management':
        return activeRole == 'admin';
      case 'attendance_management':
        return ['admin', 'teacher'].contains(activeRole);
      case 'nfc_management':
        return ['admin', 'teacher'].contains(activeRole);
      case 'points_management':
        return ['admin', 'teacher', 'parent'].contains(activeRole);
      case 'notification_management':
        return activeRole == 'admin';
      case 'reports_statistics':
        return activeRole == 'admin';
      case 'system_settings':
        return activeRole == 'admin';
      case 'view_child_data':
        return ['admin', 'parent'].contains(activeRole);
      case 'view_all_data':
        return activeRole == 'admin';
      case 'view_assigned_classes':
        return activeRole == 'teacher';
      case 'my_students':
        return activeRole == 'teacher';
      case 'my_classes':
        return activeRole == 'teacher';
      case 'nfc_attendance':
        return activeRole == 'teacher';
      case 'homework_grades':
        return activeRole == 'teacher';
      case 'notifications':
        return ['admin', 'teacher', 'parent'].contains(activeRole);
      default:
        return false;
    }
  }
  
  /// 获取用户可访问的功能列表
  static List<String> getAccessibleFeatures(AuthProvider authProvider) {
    final activeRole = authProvider.activeRole;
    
    switch (activeRole) {
      case 'admin':
        return [
          'student_management',
          'teacher_management',
          'class_management',
          'attendance_management',
          'nfc_management',
          'points_management',
          'notification_management',
          'reports_statistics',
          'system_settings',
          'notifications',
        ];
      case 'teacher':
        return [
          'student_management',
          'attendance_management',
          'nfc_management',
          'points_management',
          'my_students',
          'my_classes',
          'nfc_attendance',
          'homework_grades',
          'notifications',
        ];
      case 'parent':
        return [
          'points_management',
          'view_child_data',
          'notifications',
        ];
      case 'accountant':
        return [
          'points_management',
          'reports_statistics',
        ];
      default:
        return [];
    }
  }
  
  /// 获取功能显示名称
  static String getFeatureDisplayName(String feature) {
    switch (feature) {
      case 'student_management':
        return '学生管理';
      case 'teacher_management':
        return '教师管理';
      case 'class_management':
        return '班级管理';
      case 'attendance_management':
        return '考勤管理';
      case 'nfc_management':
        return 'NFC管理';
      case 'points_management':
        return '积分管理';
      case 'notification_management':
        return '通知管理';
      case 'reports_statistics':
        return '报告统计';
      case 'system_settings':
        return '系统设置';
      case 'view_child_data':
        return '查看孩子数据';
      case 'view_all_data':
        return '查看所有数据';
      case 'view_assigned_classes':
        return '查看分配班级';
      case 'my_students':
        return '我的学生';
      case 'my_classes':
        return '我的班级';
      case 'nfc_attendance':
        return 'NFC考勤';
      case 'homework_grades':
        return '作业成绩';
      case 'notifications':
        return '通知';
      default:
        return feature;
    }
  }
  
  /// 获取功能图标
  static String getFeatureIcon(String feature) {
    switch (feature) {
      case 'student_management':
        return 'people';
      case 'teacher_management':
        return 'school';
      case 'class_management':
        return 'class';
      case 'attendance_management':
        return 'access_time';
      case 'nfc_management':
        return 'nfc';
      case 'points_management':
        return 'stars';
      case 'notification_management':
        return 'notifications';
      case 'reports_statistics':
        return 'bar_chart';
      case 'system_settings':
        return 'settings';
      case 'view_child_data':
        return 'child_care';
      case 'view_all_data':
        return 'visibility';
      case 'view_assigned_classes':
        return 'class';
      case 'my_students':
        return 'people';
      case 'my_classes':
        return 'class';
      case 'nfc_attendance':
        return 'nfc';
      case 'homework_grades':
        return 'assignment';
      case 'notifications':
        return 'notifications';
      default:
        return 'help';
    }
  }
  
  /// 检查用户是否可以执行特定操作
  static bool canPerformAction(String action, AuthProvider authProvider) {
    final activeRole = authProvider.activeRole;
    
    switch (action) {
      case 'create_student':
        return ['admin', 'teacher'].contains(activeRole);
      case 'edit_student':
        return ['admin', 'teacher'].contains(activeRole);
      case 'delete_student':
        return activeRole == 'admin';
      case 'create_teacher':
        return activeRole == 'admin';
      case 'edit_teacher':
        return activeRole == 'admin';
      case 'delete_teacher':
        return activeRole == 'admin';
      case 'mark_attendance':
        return ['admin', 'teacher'].contains(activeRole);
      case 'view_attendance':
        return ['admin', 'teacher', 'parent'].contains(activeRole);
      case 'manage_points':
        return ['admin', 'teacher'].contains(activeRole);
      case 'view_points':
        return ['admin', 'teacher', 'parent'].contains(activeRole);
      case 'send_notification':
        return activeRole == 'admin';
      case 'view_notification':
        return ['admin', 'teacher', 'parent'].contains(activeRole);
      case 'view_reports':
        return ['admin', 'teacher'].contains(activeRole);
      case 'manage_system':
        return activeRole == 'admin';
      default:
        return false;
    }
  }
}
