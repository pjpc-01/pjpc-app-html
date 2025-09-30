import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/student/providers/student_provider.dart';
import '../../features/attendance/providers/attendance_provider.dart';
import '../../features/notification/providers/notification_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/widgets/app_logo.dart';
import '../../features/attendance/screens/attendance_dashboard_screen.dart';
import '../../features/attendance/screens/attendance_management_screen.dart';
import '../../features/attendance/screens/nfc_attendance_screen.dart';
import '../../features/student/screens/student_management_screen.dart';
import '../academic/homework_grades_screen.dart';
import '../../features/reports/screens/reports_screen.dart';
import '../settings/settings_screen.dart';
import '../../features/notification/screens/notification_screen.dart';
import '../profile/profile_screen.dart';
import '../profile/teacher_profile_screen.dart';
import '../../features/notification/screens/admin_notification_screen.dart';
import '../../shared/widgets/recent_activity_item.dart';
import '../points/points_management_screen.dart';
import '../../features/nfc/screens/nfc_management_optimized_v2.dart';
import '../class/class_management_screen.dart';
import '../../features/teacher/screens/teacher_management_screen.dart';
import '../../features/teacher/screens/teacher_salary_management_screen.dart';
import '../../features/teacher/screens/teacher_leave_management_screen.dart';
import '../../features/schedule/screens/schedule_management_screen.dart';
import '../../features/attendance/widgets/attendance_nfc_scanner_widget.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  // 即时屏幕列表：直接响应角色变化，无缓存延迟
  List<Widget> get _screens {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    // 即时处理：如果用户信息未加载，返回默认屏幕
    if (authProvider.userProfile == null) {
      return [const HomeDashboard()];
    }
    
    // 即时响应：直接根据当前角色生成屏幕列表，无缓存
    if (authProvider.isAdmin) {
      return [
        const HomeDashboard(),
        const StudentManagementScreen(),
        const TeacherManagementScreen(),
        const NFCManagementOptimizedV2(),
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

  // 即时导航栏：直接响应角色变化，无缓存延迟
  List<BottomNavigationBarItem> get _navigationItems {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    // 即时处理：如果用户信息未加载，返回默认导航
    if (authProvider.userProfile == null) {
      return const [
        BottomNavigationBarItem(
          icon: Icon(Icons.dashboard_outlined),
          activeIcon: Icon(Icons.dashboard),
          label: '首页',
        ),
      ];
    }
    
    // 即时响应：直接根据当前角色生成导航栏，无缓存
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
          onTap: (index) {
            setState(() {
              _selectedIndex = index;
            });
          },
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
      // 移除全局的角色切换按钮，只在主页仪表板中显示
    );
  }

  // 角色切换对话框方法已移动到HomeDashboard中
}

class HomeDashboard extends StatefulWidget {
  const HomeDashboard({super.key});

  @override
  State<HomeDashboard> createState() => _HomeDashboardState();
}

class _HomeDashboardState extends State<HomeDashboard> {
  bool _hasLoadedData = false;

  @override
  void initState() {
    super.initState();
    _loadDataIfNeeded();
  }

  void _loadDataIfNeeded() {
    if (_hasLoadedData) return;
    
    // 智能预加载：立即开始加载，不显示加载状态
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // 立即开始加载，无延迟
      if (!mounted) return;
      
      try {
        // 静默并行加载数据
        Future.wait([
          Provider.of<AttendanceProvider>(context, listen: false).loadAttendanceRecords(),
          Provider.of<StudentProvider>(context, listen: false).loadStudents(),
          Provider.of<NotificationProvider>(context, listen: false).loadNotifications(),
        ]).then((_) {
          if (mounted) {
            setState(() {
              _hasLoadedData = true;
            });
          }
        }).catchError((e) {
          // 静默处理错误，不影响用户体验
          if (mounted) {
            setState(() {
              _hasLoadedData = true;
            });
          }
        });
      } catch (e) {
        // 静默处理错误
        if (mounted) {
          setState(() {
            _hasLoadedData = true;
          });
        }
      }
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // 当依赖项变化时，重新加载数据
    _hasLoadedData = false;
    _loadDataIfNeeded();
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
      case 'teacher_salary_management':
        return Icons.account_balance_wallet;
      case 'teacher_leave_management':
        return Icons.event_note;
      case 'my_salary_records':
        return Icons.payment;
      case 'my_leave_records':
        return Icons.event_available;
      case 'my_attendance_records':
        return Icons.schedule;
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
          MaterialPageRoute(builder: (context) => const NFCManagementOptimizedV2()),
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
      case 'teacher_salary_management':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const TeacherSalaryManagementScreen()),
        );
        break;
      case 'teacher_leave_management':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const TeacherLeaveManagementScreen()),
        );
        break;
      case 'my_salary_records':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const TeacherSalaryManagementScreen()),
        );
        break;
      case 'my_leave_records':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const TeacherLeaveManagementScreen()),
        );
        break;
      case 'schedule_management':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const ScheduleManagementScreen()),
        );
        break;
      case 'my_attendance_records':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const AttendanceDashboardScreen()),
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

  // 角色切换对话框方法
  void _showRoleSelectionDialog(BuildContext context, AuthProvider authProvider) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Row(
            children: [
              Icon(
                Icons.swap_horiz_rounded,
                color: AppTheme.primaryColor,
                size: 24,
              ),
              const SizedBox(width: 8),
              const Text('切换角色'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '选择您要切换的身份：',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              ...authProvider.userRoles.map((role) {
                final isActive = role == authProvider.activeRole;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isActive 
                            ? AppTheme.primaryColor.withOpacity(0.1)
                            : AppTheme.surfaceColor,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isActive 
                              ? AppTheme.primaryColor
                              : AppTheme.dividerColor,
                          width: isActive ? 2 : 1,
                        ),
                      ),
                      child: Icon(
                        _getRoleIcon(role),
                        color: isActive 
                            ? AppTheme.primaryColor
                            : AppTheme.textSecondary,
                        size: 20,
                      ),
                    ),
                    title: Text(
                      authProvider.getRoleDisplayName(role),
                      style: AppTextStyles.bodyLarge.copyWith(
                        fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                        color: isActive ? AppTheme.primaryColor : AppTheme.textPrimary,
                      ),
                    ),
                    subtitle: Text(
                      _getRoleDescription(role),
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    trailing: isActive
                        ? Icon(
                            Icons.check_circle,
                            color: AppTheme.primaryColor,
                            size: 24,
                          )
                        : null,
                    onTap: isActive ? null : () async {
                      try {
                        // 即时角色切换：立即关闭对话框并切换角色
                        Navigator.of(context).pop();
                        
                        // 立即切换角色，触发UI更新
                        await authProvider.switchRole(role);
                        
                        // 角色切换完成，UI会自动更新
                        
                        // 即时提示：简洁的成功反馈
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('已切换到${authProvider.getRoleDisplayName(role)}'),
                              backgroundColor: AppTheme.successColor,
                              duration: const Duration(milliseconds: 800),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      } catch (e) {
                        // 静默处理错误，不影响用户体验
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: const Text('切换失败，请重试'),
                              backgroundColor: AppTheme.errorColor,
                              duration: const Duration(milliseconds: 800),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      }
                    },
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    tileColor: isActive 
                        ? AppTheme.primaryColor.withOpacity(0.05)
                        : null,
                  ),
                );
              }).toList(),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('取消'),
            ),
          ],
        );
      },
    );
  }

  IconData _getRoleIcon(String role) {
    switch (role) {
      case 'admin':
        return Icons.admin_panel_settings_rounded;
      case 'teacher':
        return Icons.school_rounded;
      case 'parent':
        return Icons.family_restroom_rounded;
      case 'accountant':
        return Icons.account_balance_rounded;
      default:
        return Icons.person_rounded;
    }
  }

  String _getRoleDescription(String role) {
    switch (role) {
      case 'admin':
        return '系统管理员，拥有所有权限';
      case 'teacher':
        return '教师身份，管理班级和学生';
      case 'parent':
        return '家长身份，查看孩子信息';
      case 'accountant':
        return '会计身份，管理财务数据';
      default:
        return '用户身份';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildWelcomeSection(context),
              const SizedBox(height: 20),
                _buildQuickActionsSection(context),
              const SizedBox(height: 20),
                _buildStatisticsSection(context),
              const SizedBox(height: 20),
                _buildRecentActivitySection(context),
                const SizedBox(height: 20),
              ],
            ),
          ),
      ),
      // 只在主页仪表板中显示角色切换按钮
      floatingActionButton: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          // 只有当用户有多个角色时才显示浮动按钮
          if (authProvider.userProfile == null || !authProvider.hasMultipleRoles) {
            return const SizedBox.shrink();
          }
          
          return FloatingActionButton(
            onPressed: () => _showRoleSelectionDialog(context, authProvider),
            backgroundColor: AppTheme.primaryColor,
            foregroundColor: Colors.white,
            child: const Icon(Icons.swap_horiz_rounded),
            tooltip: '切换角色',
          );
        },
      ),
    );
  }

  Widget _buildWelcomeSection(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        // 智能处理：静默处理加载状态，提供流畅体验
        if (!authProvider.isAuthenticated || authProvider.userProfile == null) {
          return const SizedBox.shrink();
        }
        
        final userName = authProvider.user?.getStringValue('name') ?? '用户';
        final userRole = authProvider.roleDisplayName;
        
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF3B82F6),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.waving_hand_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '欢迎回来，$userName！',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
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
                  Row(
                    children: [
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
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () => _navigateToNotification(context),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            Icons.notifications_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                    ],
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
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
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
              // 智能处理：如果用户未认证，静默重定向到登录
              if (!authProvider.isAuthenticated) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
                });
                return const SizedBox.shrink();
              }
              
              // 智能处理：如果userProfile为空，使用默认数据继续渲染
              if (authProvider.userProfile == null) {
                // 静默处理，不显示加载状态
                return const SizedBox.shrink();
              }
              
              if (authProvider.isAdmin) {
                // 管理员工作台 - 使用Column+Row布局
                return Column(
                  children: [
                    Row(
                      children: [
                        Expanded(child: _buildModernActionCard(title: '学生管理', icon: Icons.people_rounded, color: const Color(0xFF10B981), onTap: () => _navigateToStudents(context))),
                        const SizedBox(width: 12),
                        Expanded(child: _buildModernActionCard(title: '教师管理', icon: Icons.school_rounded, color: const Color(0xFF8B5CF6), onTap: () => _navigateToTeacherManagement(context))),
                        const SizedBox(width: 12),
                        Expanded(child: _buildModernActionCard(title: '班级管理', icon: Icons.class_rounded, color: const Color(0xFF06B6D4), onTap: () => _navigateToClassManagement(context))),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(child: _buildModernActionCard(title: 'NFC管理', icon: Icons.admin_panel_settings_rounded, color: const Color(0xFFEF4444), onTap: () => _navigateToNfcManagement(context))),
                        const SizedBox(width: 12),
                        Expanded(child: _buildModernActionCard(title: '考勤管理', icon: Icons.assessment_rounded, color: const Color(0xFF3B82F6), onTap: () => _navigateToAttendance(context))),
                        const SizedBox(width: 12),
                        Expanded(child: _buildModernActionCard(title: '积分管理', icon: Icons.stars_rounded, color: const Color(0xFFEC4899), onTap: () => _navigateToPoints(context))),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(child: _buildModernActionCard(title: '教师薪资管理', icon: Icons.account_balance_wallet_rounded, color: const Color(0xFF10B981), onTap: () => _navigateToFeature('teacher_salary_management', context))),
                        const SizedBox(width: 12),
                        Expanded(child: _buildModernActionCard(title: '教师请假管理', icon: Icons.event_note_rounded, color: const Color(0xFF8B5CF6), onTap: () => _navigateToFeature('teacher_leave_management', context))),
                        const SizedBox(width: 12),
                        Expanded(child: _buildModernActionCard(title: '通知管理', icon: Icons.notifications_active_rounded, color: const Color(0xFFF59E0B), onTap: () => _navigateToAdminNotification(context))),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(child: _buildModernActionCard(title: '排班管理', icon: Icons.schedule_rounded, color: const Color(0xFF06B6D4), onTap: () => _navigateToFeature('schedule_management', context))),
                        const SizedBox(width: 12),
                        Expanded(child: _buildModernActionCard(title: '报告统计', icon: Icons.analytics_rounded, color: const Color(0xFFF59E0B), onTap: () => _navigateToReports(context))),
                        const SizedBox(width: 12),
                        Expanded(child: _buildModernActionCard(title: '系统设置', icon: Icons.settings_rounded, color: const Color(0xFF6B7280), onTap: () => _navigateToSettings(context))),
                      ],
                    ),
                  ],
                );
              } else if (authProvider.isTeacher) {
                // 教师工作台 - 使用Column+Row布局
                return Column(
                  children: [
                    Row(
                      children: [
                        Expanded(child: _buildModernActionCard(title: '我的学生', icon: Icons.people_rounded, color: const Color(0xFF10B981), onTap: () => _navigateToStudents(context))),
                        const SizedBox(width: 12),
                        Expanded(child: _buildModernActionCard(title: '我的班级', icon: Icons.class_rounded, color: const Color(0xFF06B6D4), onTap: () => _navigateToClassManagement(context))),
                        const SizedBox(width: 12),
                        Expanded(child: _buildModernActionCard(title: 'NFC考勤', icon: Icons.nfc_rounded, color: const Color(0xFF3B82F6), onTap: () => _navigateToNfcAttendance(context))),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(child: _buildModernActionCard(title: '我的考勤', icon: Icons.schedule_rounded, color: const Color(0xFF06B6D4), onTap: () => _navigateToFeature('my_attendance_records', context))),
                        const SizedBox(width: 12),
                        Expanded(child: _buildModernActionCard(title: '个人资料', icon: Icons.person_rounded, color: const Color(0xFF8B5CF6), onTap: () => _navigateToProfile(context))),
                        const SizedBox(width: 12),
                        Expanded(child: _buildModernActionCard(title: '设置', icon: Icons.settings_rounded, color: const Color(0xFF6B7280), onTap: () => _navigateToSettings(context))),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(child: _buildModernActionCard(title: '作业成绩', icon: Icons.assignment_rounded, color: const Color(0xFFF59E0B), onTap: () => _navigateToHomeworkGrades(context))),
                        const SizedBox(width: 12),
                        Expanded(child: _buildModernActionCard(title: '积分管理', icon: Icons.stars_rounded, color: const Color(0xFFEC4899), onTap: () => _navigateToPoints(context))),
                        const SizedBox(width: 12),
                        Expanded(child: Consumer<NotificationProvider>(
                      builder: (context, notificationProvider, child) {
                        return _buildModernActionCardWithBadge(
                          title: '通知公告',
                          icon: Icons.notifications_rounded,
                          color: const Color(0xFF10B981),
                          unreadCount: notificationProvider.unreadCount,
                          onTap: () => _navigateToNotification(context),
                        );
                      },
                        )),
                      ],
                    ),
                  ],
                );
              } else {
                // 其他角色 - 使用Column+Row布局
                return Column(
                  children: [
                    Row(
                      children: [
                        Expanded(child: _buildModernActionCard(title: '积分管理', icon: Icons.stars_rounded, color: const Color(0xFFEC4899), onTap: () => _navigateToPoints(context))),
                        const SizedBox(width: 12),
                        Expanded(child: _buildModernActionCard(title: '系统设置', icon: Icons.settings_rounded, color: const Color(0xFF6B7280), onTap: () => _navigateToSettings(context))),
                        const SizedBox(width: 12),
                        Expanded(child: _buildModernActionCard(title: '通知公告', icon: Icons.notifications_rounded, color: const Color(0xFF10B981), onTap: () => _navigateToNotification(context))),
                      ],
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
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppTheme.cardColor,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppTheme.dividerColor),
          boxShadow: AppTheme.cardShadow,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Icon(
                icon,
                color: color,
                size: 20,
              ),
            ),
            SizedBox(height: AppSpacing.xs),
            Flexible(
              child: Text(
                title,
                style: AppTextStyles.bodySmall.copyWith(
                  fontWeight: FontWeight.w600,
                  fontSize: 11,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModernActionCardWithBadge({
    required String title,
    required IconData icon,
    required Color color,
    required int unreadCount,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppTheme.cardColor,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppTheme.dividerColor),
          boxShadow: AppTheme.cardShadow,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: Icon(
                    icon,
                    color: color,
                    size: 20,
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
                        minWidth: 16,
                        minHeight: 16,
                      ),
                      child: Text(
                        unreadCount > 99 ? '99+' : '$unreadCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            SizedBox(height: AppSpacing.xs),
            Flexible(
              child: Text(
                title,
                style: AppTextStyles.bodySmall.copyWith(
                  fontWeight: FontWeight.w600,
                  fontSize: 11,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
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
      behavior: HitTestBehavior.opaque,
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
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE5E7EB)),
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
              SizedBox(
                child: Column(
              children: [
                    Row(
                      children: [
                        Expanded(child: _buildStatCard('今日签到', checkInCount.toString(), Icons.check_circle, AppTheme.successColor)),
                        const SizedBox(width: 12),
                        Expanded(child: _buildStatCard('出勤率', '$attendanceRate%', Icons.trending_up, AppTheme.primaryColor)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(child: _buildStatCard('迟到人数', lateCount.toString(), Icons.schedule, AppTheme.warningColor)),
                        const SizedBox(width: 12),
                        Expanded(child: _buildStatCard('缺勤人数', absentCount.toString(), Icons.person_off, AppTheme.errorColor)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(child: _buildStatCard('今日签退', checkOutCount.toString(), Icons.logout, AppTheme.primaryVariant)),
                        const SizedBox(width: 12),
                        Expanded(child: _buildStatCard('总记录数', todayRecords.length.toString(), Icons.list_alt, AppTheme.accentColor)),
                      ],
                    ),
                  ],
                ),
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
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE5E7EB)),
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

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dividerColor),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
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
        builder: (context) => const AttendanceManagementScreen(),
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
        builder: (context) => const NFCManagementOptimizedV2(),
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

  void _navigateToProfile(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const TeacherProfileScreen(),
      ),
    );
  }

}

