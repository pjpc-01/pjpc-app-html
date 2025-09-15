import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/attendance_provider.dart';
import '../../providers/notification_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/app_logo.dart';
import '../attendance/attendance_dashboard_screen.dart';
import '../attendance/nfc_attendance_screen.dart';
import '../student/student_management_screen.dart';
import '../academic/homework_grades_screen.dart';
import '../reports/reports_screen.dart';
import '../settings/settings_screen.dart';
import '../notification/notification_screen.dart';
import '../profile/profile_screen.dart';
import '../notification/admin_notification_screen.dart';
import '../../widgets/common/quick_action_card.dart';
import '../../widgets/common/statistics_card.dart';
import '../../widgets/common/recent_activity_item.dart';
import '../../widgets/common/role_switcher_widget.dart';
import '../points/points_management_screen.dart';
import '../nfc/nfc_management_screen.dart';
import '../class/class_management_screen.dart';
import '../teacher/teacher_management_screen.dart';
import '../../widgets/attendance/attendance_nfc_scanner_widget.dart';
import '../../services/permission_manager.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  // 根据用户角色动态生成屏幕列表
  List<Widget> get _screens {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    if (authProvider.isAdmin) {
      return [
        const HomeDashboard(),
        const StudentManagementScreen(),
        const TeacherManagementScreen(),
        const NfcManagementScreen(),
        const ProfileScreen(),
      ];
    } else if (authProvider.isTeacher) {
      return [
        const HomeDashboard(),
        const AttendanceDashboardScreen(),
        const StudentManagementScreen(),
        const PointsManagementScreen(),
        const ProfileScreen(),
      ];
    } else {
      return [
        const HomeDashboard(),
        const PointsManagementScreen(),
        const ProfileScreen(),
      ];
    }
  }

  // 根据用户角色动态生成导航栏项目
  List<BottomNavigationBarItem> get _navigationItems {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    if (authProvider.isAdmin) {
      return const [
        BottomNavigationBarItem(
          icon: Icon(Icons.dashboard_outlined),
          activeIcon: Icon(Icons.dashboard),
          label: '首页',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.people_outline),
          activeIcon: Icon(Icons.people),
          label: '学生',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.school_outlined),
          activeIcon: Icon(Icons.school),
          label: '教师',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.admin_panel_settings_outlined),
          activeIcon: Icon(Icons.admin_panel_settings),
          label: 'NFC',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person_outline),
          activeIcon: Icon(Icons.person),
          label: '个人',
        ),
      ];
    } else if (authProvider.isTeacher) {
      return const [
        BottomNavigationBarItem(
          icon: Icon(Icons.dashboard_outlined),
          activeIcon: Icon(Icons.dashboard),
          label: '首页',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.access_time_outlined),
          activeIcon: Icon(Icons.access_time),
          label: '考勤',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.people_outline),
          activeIcon: Icon(Icons.people),
          label: '学生',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.stars_outlined),
          activeIcon: Icon(Icons.stars),
          label: '积分',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person_outline),
          activeIcon: Icon(Icons.person),
          label: '个人',
        ),
      ];
    } else {
      return const [
        BottomNavigationBarItem(
          icon: Icon(Icons.dashboard_outlined),
          activeIcon: Icon(Icons.dashboard),
          label: '首页',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.stars_outlined),
          activeIcon: Icon(Icons.stars),
          label: '积分',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person_outline),
          activeIcon: Icon(Icons.person),
          label: '个人',
        ),
      ];
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Color(0x0A000000),
              blurRadius: 8,
              offset: Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: (index) => setState(() => _selectedIndex = index),
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: AppTheme.primaryColor,
          unselectedItemColor: AppTheme.textTertiary,
          selectedLabelStyle: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.normal,
          ),
          items: _navigationItems,
        ),
      ),
    );
  }
}

class HomeDashboard extends StatefulWidget {
  const HomeDashboard({super.key});

  @override
  State<HomeDashboard> createState() => _HomeDashboardState();
}

class _HomeDashboardState extends State<HomeDashboard> {
  @override
  void initState() {
    super.initState();
    // 加载数据
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AttendanceProvider>(context, listen: false).loadAttendanceRecords();
      Provider.of<StudentProvider>(context, listen: false).loadStudents();
      Provider.of<NotificationProvider>(context, listen: false).loadNotifications();
    });
  }

  Widget _buildModernAppBar() {
    return SliverAppBar(
      expandedHeight: 140,
      floating: false,
      pinned: true,
      backgroundColor: const Color(0xFF1E293B),
      foregroundColor: Colors.white,
      flexibleSpace: FlexibleSpaceBar(
        title: const Text(
          '智能管理中心',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF1E293B),
                Color(0xFF334155),
                Color(0xFF475569),
              ],
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                right: -50,
                top: -50,
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.1),
                  ),
                ),
              ),
              Positioned(
                left: -30,
                bottom: -30,
                child: Container(
                  width: 150,
                  height: 150,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.05),
                  ),
                ),
              ),
              // Logo
              Positioned(
                left: 20,
                top: 20,
                child: const AppLogo(
                  size: 50,
                  showText: false,
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.notifications_rounded),
          onPressed: () {
            // TODO: 实现通知功能
          },
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  String _getCurrentDateString() {
    final now = DateTime.now();
    return '${now.day} ${_getMonthName(now.month)} ${now.year}';
  }
  
  /// 获取功能图标
  IconData _getFeatureIcon(String feature) {
    switch (feature) {
      case 'student_management':
        return Icons.people;
      case 'teacher_management':
        return Icons.school;
      case 'class_management':
        return Icons.class_;
      case 'attendance_management':
        return Icons.access_time;
      case 'nfc_management':
        return Icons.nfc;
      case 'points_management':
        return Icons.stars;
      case 'notification_management':
        return Icons.notifications;
      case 'reports_statistics':
        return Icons.bar_chart;
      case 'system_settings':
        return Icons.settings;
      case 'view_child_data':
        return Icons.child_care;
      case 'view_all_data':
        return Icons.visibility;
      case 'view_assigned_classes':
        return Icons.class_;
      case 'my_students':
        return Icons.people;
      case 'my_classes':
        return Icons.class_;
      case 'nfc_attendance':
        return Icons.nfc;
      case 'homework_grades':
        return Icons.assignment;
      case 'notifications':
        return Icons.notifications;
      default:
        return Icons.help;
    }
  }
  
  /// 导航到功能页面
  void _navigateToFeature(String feature, BuildContext context) {
    switch (feature) {
      case 'student_management':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const StudentManagementScreen()),
        );
        break;
      case 'teacher_management':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const TeacherManagementScreen()),
        );
        break;
      case 'class_management':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const ClassManagementScreen()),
        );
        break;
      case 'attendance_management':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const AttendanceDashboardScreen()),
        );
        break;
      case 'nfc_management':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const NfcManagementScreen()),
        );
        break;
      case 'points_management':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const PointsManagementScreen()),
        );
        break;
      case 'notification_management':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const AdminNotificationScreen()),
        );
        break;
      case 'reports_statistics':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const ReportsScreen()),
        );
        break;
      case 'system_settings':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const SettingsScreen()),
        );
        break;
      case 'my_students':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const StudentManagementScreen()),
        );
        break;
      case 'my_classes':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const ClassManagementScreen()),
        );
        break;
      case 'nfc_attendance':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const NfcAttendanceScreen()),
        );
        break;
      case 'homework_grades':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const HomeworkGradesScreen()),
        );
        break;
      case 'notifications':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const NotificationScreen()),
        );
        break;
      default:
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('功能暂未开放')),
        );
    }
  }

  String _getMonthName(int month) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Column(
              children: [
                _buildWelcomeSection(context),
                const RoleSwitcherWidget(), // 添加角色切换器
                _buildQuickActionsSection(context),
                _buildStatisticsSection(context),
                _buildRecentActivitySection(context),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWelcomeSection(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final userName = authProvider.user?.getStringValue('name') ?? '用户';
        final userRole = authProvider.roleDisplayName;
        
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF3B82F6),
                Color(0xFF1D4ED8),
                Color(0xFF1E40AF),
              ],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF3B82F6).withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.waving_hand_rounded,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '欢迎回来，$userName！',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '今天是美好的一天，继续加油！',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.9),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      userRole,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.calendar_today_rounded,
                          color: Colors.white,
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          _getCurrentDateStringChinese(),
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.white,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.access_time_rounded,
                          color: Colors.white,
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          _getCurrentTimeString(),
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.white,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildQuickActionsSection(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 28,
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 16),
              Text(
                '快速操作',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1E293B),
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),
          Consumer<AuthProvider>(
            builder: (context, authProvider, child) {
              if (authProvider.isAdmin) {
                // 管理员工作台 - 3x3网格
                return GridView.count(
                  crossAxisCount: 3,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  childAspectRatio: 1.0,
                  crossAxisSpacing: AppSpacing.md,
                  mainAxisSpacing: AppSpacing.md,
                  children: [
                    _buildModernActionCard(
                      title: '学生管理',
                      icon: Icons.people_rounded,
                      color: const Color(0xFF10B981),
                      onTap: () => _navigateToStudents(context),
                    ),
                    _buildModernActionCard(
                      title: '教师管理',
                      icon: Icons.school_rounded,
                      color: const Color(0xFF8B5CF6),
                      onTap: () => _navigateToTeacherManagement(context),
                    ),
                    _buildModernActionCard(
                      title: '班级管理',
                      icon: Icons.class_rounded,
                      color: const Color(0xFF06B6D4),
                      onTap: () => _navigateToClassManagement(context),
                    ),
                    _buildModernActionCard(
                      title: 'NFC管理',
                      icon: Icons.admin_panel_settings_rounded,
                      color: const Color(0xFFEF4444),
                      onTap: () => _navigateToNfcManagement(context),
                    ),
                    _buildModernActionCard(
                      title: '考勤管理',
                      icon: Icons.assessment_rounded,
                      color: const Color(0xFF3B82F6),
                      onTap: () => _navigateToReports(context),
                    ),
                    _buildModernActionCard(
                      title: '积分管理',
                      icon: Icons.stars_rounded,
                      color: const Color(0xFFEC4899),
                      onTap: () => _navigateToPoints(context),
                    ),
                    _buildModernActionCard(
                      title: '通知管理',
                      icon: Icons.notifications_active_rounded,
                      color: const Color(0xFF10B981),
                      onTap: () => _navigateToAdminNotification(context),
                    ),
                    _buildModernActionCard(
                      title: '报告统计',
                      icon: Icons.analytics_rounded,
                      color: const Color(0xFFF59E0B),
                      onTap: () => _navigateToReports(context),
                    ),
                    _buildModernActionCard(
                      title: '系统设置',
                      icon: Icons.settings_rounded,
                      color: const Color(0xFF6B7280),
                      onTap: () => _navigateToSettings(context),
                    ),
                  ],
                );
              } else if (authProvider.isTeacher) {
                // 教师工作台 - 2x3网格
                return GridView.count(
                  crossAxisCount: 3,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  childAspectRatio: 1.0,
                  crossAxisSpacing: AppSpacing.md,
                  mainAxisSpacing: AppSpacing.md,
                  children: [
                    _buildModernActionCard(
                      title: '我的学生',
                      icon: Icons.people_rounded,
                      color: const Color(0xFF10B981),
                      onTap: () => _navigateToStudents(context),
                    ),
                    _buildModernActionCard(
                      title: '我的班级',
                      icon: Icons.class_rounded,
                      color: const Color(0xFF06B6D4),
                      onTap: () => _navigateToClassManagement(context),
                    ),
                    _buildModernActionCard(
                      title: 'NFC考勤',
                      icon: Icons.nfc_rounded,
                      color: const Color(0xFF3B82F6),
                      onTap: () => _navigateToNfcAttendance(context),
                    ),
                    _buildModernActionCard(
                      title: '作业成绩',
                      icon: Icons.assignment_rounded,
                      color: const Color(0xFFF59E0B),
                      onTap: () => _navigateToHomeworkGrades(context),
                    ),
                    _buildModernActionCard(
                      title: '积分管理',
                      icon: Icons.stars_rounded,
                      color: const Color(0xFFEC4899),
                      onTap: () => _navigateToPoints(context),
                    ),
                    Consumer<NotificationProvider>(
                      builder: (context, notificationProvider, child) {
                        return _buildNotificationActionCard(
                          title: '通知公告',
                          icon: Icons.notifications_rounded,
                          color: const Color(0xFF10B981),
                          unreadCount: notificationProvider.unreadCount,
                          onTap: () => _navigateToNotification(context),
                        );
                      },
                    ),
                  ],
                );
              } else {
                // 其他角色 - 基础功能
                return GridView.count(
                  crossAxisCount: 3,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  childAspectRatio: 1.0,
                  crossAxisSpacing: AppSpacing.md,
                  mainAxisSpacing: AppSpacing.md,
                  children: [
                    _buildModernActionCard(
                      title: '积分管理',
                      icon: Icons.stars_rounded,
                      color: const Color(0xFFEC4899),
                      onTap: () => _navigateToPoints(context),
                    ),
                    _buildModernActionCard(
                      title: '系统设置',
                      icon: Icons.settings_rounded,
                      color: const Color(0xFF6B7280),
                      onTap: () => _navigateToSettings(context),
                    ),
                  ],
                );
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildModernActionCard({
    required String title,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppTheme.cardColor,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppTheme.dividerColor),
          boxShadow: AppTheme.cardShadow,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Icon(
                icon,
                color: color,
                size: 24,
              ),
            ),
            SizedBox(height: AppSpacing.sm),
            Text(
              title,
              style: AppTextStyles.bodySmall.copyWith(
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationActionCard({
    required String title,
    required IconData icon,
    required Color color,
    required int unreadCount,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: color.withOpacity(0.15),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.08),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    icon,
                    color: color,
                    size: 28,
                  ),
                ),
                if (unreadCount > 0)
                  Positioned(
                    top: -2,
                    right: -2,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Color(0xFFEF4444),
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 20,
                        minHeight: 20,
                      ),
                      child: Text(
                        '$unreadCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF374151),
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatisticsSection(BuildContext context) {
    return Consumer<AttendanceProvider>(
      builder: (context, attendanceProvider, child) {
        // 计算今日统计数据
        final today = DateTime.now();
        final todayRecords = attendanceProvider.getTodaysAttendance();
        
        final checkInCount = todayRecords.where((r) => r.getStringValue('type') == 'check_in').length;
        final checkOutCount = todayRecords.where((r) => r.getStringValue('type') == 'check_out').length;
        final lateCount = todayRecords.where((r) => r.getStringValue('status') == 'late').length;
        final absentCount = todayRecords.where((r) => r.getStringValue('status') == 'absent').length;
        
        // 计算出勤率（假设总学生数为50，这里可以根据实际情况调整）
        final totalStudents = 50; // 可以从学生提供者获取实际数量
        final attendanceRate = totalStudents > 0 ? ((checkInCount / totalStudents) * 100).round() : 0;
        
        return Container(
          margin: EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
          padding: EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: AppTheme.cardColor,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppTheme.dividerColor),
            boxShadow: AppTheme.cardShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 28,
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      SizedBox(width: AppSpacing.md),
                      Text(
                        '今日概览',
                        style: AppTextStyles.headline5,
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: () => _navigateToAttendance(context),
                    child: const Text('详情'),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                childAspectRatio: 1.2,
                crossAxisSpacing: AppSpacing.md,
                mainAxisSpacing: AppSpacing.md,
              children: [
                StatisticsCard(
                  title: '今日签到',
                  value: checkInCount.toString(),
                  change: '',
                  isPositive: true,
                  icon: Icons.check_circle,
                  color: AppTheme.successColor,
                ),
                StatisticsCard(
                  title: '出勤率',
                  value: '$attendanceRate%',
                  change: '',
                  isPositive: true,
                  icon: Icons.trending_up,
                  color: AppTheme.primaryColor,
                ),
                StatisticsCard(
                  title: '迟到人数',
                  value: lateCount.toString(),
                  change: '',
                  isPositive: lateCount == 0,
                  icon: Icons.schedule,
                  color: AppTheme.warningColor,
                ),
                StatisticsCard(
                  title: '缺勤人数',
                  value: absentCount.toString(),
                  change: '',
                  isPositive: absentCount == 0,
                  icon: Icons.person_off,
                  color: AppTheme.errorColor,
                ),
                StatisticsCard(
                  title: '今日签退',
                  value: checkOutCount.toString(),
                  change: '',
                  isPositive: true,
                  icon: Icons.logout,
                  color: AppTheme.primaryVariant,
                ),
                StatisticsCard(
                  title: '总记录数',
                  value: todayRecords.length.toString(),
                  change: '',
                  isPositive: true,
                  icon: Icons.list_alt,
                  color: AppTheme.accentColor,
                ),
              ],
            ),
          ],
        ),
        );
      },
    );
  }

  Widget _buildRecentActivitySection(BuildContext context) {
    return Consumer<AttendanceProvider>(
      builder: (context, attendanceProvider, child) {
        // 获取最近的考勤记录
        final recentRecords = attendanceProvider.getRecentAttendanceRecords(4);
        
        return Container(
          margin: EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
          padding: EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: AppTheme.cardColor,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppTheme.dividerColor),
            boxShadow: AppTheme.cardShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 28,
                        decoration: BoxDecoration(
                          color: const Color(0xFF3B82F6),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Text(
                        '最近活动',
                        style: AppTextStyles.headline5,
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: () => _navigateToAttendance(context),
                    child: const Text('查看全部'),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Container(
                decoration: BoxDecoration(
                  color: AppTheme.cardColor,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(color: AppTheme.dividerColor),
                  boxShadow: AppTheme.cardShadow,
                ),
              child: recentRecords.isEmpty
                  ? Padding(
                      padding: const EdgeInsets.all(16),
                      child: Center(
                        child: Text(
                          '暂无最近活动',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 14,
                          ),
                        ),
                      ),
                    )
                  : Column(
                      children: recentRecords.asMap().entries.map((entry) {
                        final index = entry.key;
                        final record = entry.value;
                        final studentName = record.getStringValue('student_name') ?? '未知学生';
                        final type = record.getStringValue('type') ?? '';
                        final created = record.getStringValue('created') ?? '';
                        
                        final action = type == 'check_in' ? '签到' : '签退';
                        final time = _formatTime(created);
                        final status = 'success';
                        
                        return Column(
                          children: [
                            RecentActivityItem(
                              studentName: studentName,
                              action: action,
                              time: time,
                              status: status,
                            ),
                            if (index < recentRecords.length - 1) const Divider(height: 1),
                          ],
                        );
                      }).toList(),
                    ),
            ),
          ],
        ),
        );
      },
    );
  }

  String _getGreeting(int hour) {
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }

  String _formatTime(String isoString) {
    try {
      final dateTime = DateTime.parse(isoString);
      final now = DateTime.now();
      final difference = now.difference(dateTime);

      if (difference.inMinutes < 1) {
        return '刚刚';
      } else if (difference.inMinutes < 60) {
        return '${difference.inMinutes}分钟前';
      } else if (difference.inHours < 24) {
        return '${difference.inHours}小时前';
      } else {
        return '${difference.inDays}天前';
      }
    } catch (e) {
      return '未知时间';
    }
  }

  String _getCurrentDateStringChinese() {
    final now = DateTime.now();
    final weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    final months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    return '${weekdays[now.weekday - 1]} · ${months[now.month - 1]}${now.day}日';
  }

  String _getCurrentTimeString() {
    final now = DateTime.now();
    return '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
  }

  void _navigateToAttendance(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AttendanceDashboardScreen(),
      ),
    );
  }

  void _navigateToNfcAttendance(BuildContext context) {
    // 弹出 NFC 扫描器窗口，就像积分界面一样
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const AttendanceNFCScannerWidget(),
    );
  }

  void _navigateToStudents(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const StudentManagementScreen(),
      ),
    );
  }

  void _navigateToClassManagement(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ClassManagementScreen(),
      ),
    );
  }


  void _navigateToTeacherManagement(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const TeacherManagementScreen(),
      ),
    );
  }

  void _navigateToHomeworkGrades(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const HomeworkGradesScreen(),
      ),
    );
  }

  void _navigateToPoints(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const PointsManagementScreen(),
      ),
    );
  }

  void _navigateToReports(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const ReportsScreen(),
      ),
    );
  }


  void _navigateToNfcManagement(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const NfcManagementScreen(),
      ),
    );
  }

  void _navigateToSettings(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const SettingsScreen(),
      ),
    );
  }

  void _navigateToNotification(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const NotificationScreen(),
      ),
    );
  }

  void _navigateToAdminNotification(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AdminNotificationScreen(),
      ),
    );
  }


}

