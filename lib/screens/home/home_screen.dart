import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../attendance/attendance_dashboard_screen.dart';
import '../attendance/nfc_attendance_screen.dart';
import '../student/student_management_screen.dart';
import '../academic/homework_grades_screen.dart';
import '../reports/reports_screen.dart';
import '../settings/settings_screen.dart';
import '../../widgets/common/quick_action_card.dart';
import '../../widgets/common/statistics_card.dart';
import '../../widgets/common/recent_activity_item.dart';
import '../points/points_management_screen.dart';
import '../nfc/teacher_nfc_management_screen.dart';
import '../nfc/admin_nfc_management_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const HomeDashboard(),
    const AttendanceDashboardScreen(),
    const StudentManagementScreen(),
    const PointsManagementScreen(),
    const SettingsScreen(),
  ];

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
          items: const [
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
              icon: Icon(Icons.settings_outlined),
              activeIcon: Icon(Icons.settings),
              label: '设置',
            ),
          ],
        ),
      ),
    );
  }
}

class HomeDashboard extends StatelessWidget {
  const HomeDashboard({super.key});

  Widget _buildModernAppBar() {
    return SliverAppBar(
      expandedHeight: 120,
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
          _buildModernAppBar(),
          SliverToBoxAdapter(
            child: Column(
              children: [
                _buildWelcomeSection(context),
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
        final currentTime = DateTime.now();
        final greeting = _getGreeting(currentTime.hour);
        
        return Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppTheme.primaryColor,
                AppTheme.primaryVariant,
              ],
            ),
            borderRadius: BorderRadius.circular(AppRadius.lg),
            boxShadow: AppTheme.elevatedShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: Colors.white.withOpacity(0.2),
                    child: const Icon(
                      Icons.person,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$greeting, $userName',
                          style: AppTextStyles.headline5.copyWith(
                            color: Colors.white,
                            fontSize: 16,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _getCurrentDateStringChinese(),
                          style: AppTextStyles.bodySmall.copyWith(
                            color: Colors.white.withOpacity(0.9),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: AppSpacing.xs,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Text(
                      _getCurrentTimeString(),
                      style: AppTextStyles.bodySmall.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 11,
                      ),
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
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '快速操作',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 20),
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.0,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            children: [
              _buildModernActionCard(
                title: 'NFC考勤',
                icon: Icons.nfc_rounded,
                color: const Color(0xFF3B82F6),
                onTap: () => _navigateToNfcAttendance(context),
              ),
              _buildModernActionCard(
                title: '学生管理',
                icon: Icons.people_rounded,
                color: const Color(0xFF10B981),
                onTap: () => _navigateToStudents(context),
              ),
              _buildModernActionCard(
                title: '作业成绩',
                icon: Icons.assignment_rounded,
                color: const Color(0xFFF59E0B),
                onTap: () => _navigateToHomeworkGrades(context),
              ),
              _buildModernActionCard(
                title: '考勤报告',
                icon: Icons.assessment_rounded,
                color: const Color(0xFF8B5CF6),
                onTap: () => _navigateToReports(context),
              ),
              _buildModernActionCard(
                title: '积分管理',
                icon: Icons.stars_rounded,
                color: const Color(0xFFEC4899),
                onTap: () => _navigateToPoints(context),
              ),
              Consumer<AuthProvider>(
                builder: (context, authProvider, child) {
                  if (authProvider.isAdmin) {
                    return _buildModernActionCard(
                      title: 'NFC管理',
                      icon: Icons.admin_panel_settings_rounded,
                      color: const Color(0xFFEF4444),
                      onTap: () => _navigateToAdminNfcManagement(context),
                    );
                  } else if (authProvider.isTeacher) {
                    return _buildModernActionCard(
                      title: 'NFC管理',
                      icon: Icons.settings_rounded,
                      color: const Color(0xFFEF4444),
                      onTap: () => _navigateToTeacherNfcManagement(context),
                    );
                  } else {
                    return _buildModernActionCard(
                      title: '系统设置',
                      icon: Icons.settings_rounded,
                      color: const Color(0xFF6B7280),
                      onTap: () => _navigateToSettings(context),
                    );
                  }
                },
              ),
            ],
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
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: color.withOpacity(0.2),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: color,
                size: 24,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF374151),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatisticsSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '今日概览',
              style: AppTextStyles.headline5,
            ),
            TextButton(
              onPressed: () => _navigateToAttendance(context),
              child: const Text('详情'),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 1.4,
          crossAxisSpacing: AppSpacing.sm,
          mainAxisSpacing: AppSpacing.sm,
          children: [
            StatisticsCard(
              title: '今日签到',
              value: '24',
              change: '+12%',
              isPositive: true,
              icon: Icons.check_circle,
              color: AppTheme.successColor,
            ),
            StatisticsCard(
              title: '出勤率',
              value: '96%',
              change: '+2%',
              isPositive: true,
              icon: Icons.trending_up,
              color: AppTheme.primaryColor,
            ),
            StatisticsCard(
              title: '迟到人数',
              value: '3',
              change: '-1',
              isPositive: true,
              icon: Icons.schedule,
              color: AppTheme.warningColor,
            ),
            StatisticsCard(
              title: '缺勤人数',
              value: '1',
              change: '0',
              isPositive: true,
              icon: Icons.person_off,
              color: AppTheme.errorColor,
            ),
            StatisticsCard(
              title: '本周累计加分',
              value: '—',
              change: '',
              isPositive: true,
              icon: Icons.stars,
              color: AppTheme.primaryVariant,
            ),
            StatisticsCard(
              title: '今日兑换次数',
              value: '—',
              change: '',
              isPositive: true,
              icon: Icons.card_giftcard,
              color: AppTheme.accentColor,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRecentActivitySection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '最近活动',
              style: AppTextStyles.headline4,
            ),
            TextButton(
              onPressed: () => _navigateToAttendance(context),
              child: const Text('查看全部'),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Container(
          decoration: BoxDecoration(
            color: AppTheme.cardColor,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppTheme.dividerColor),
            boxShadow: AppTheme.cardShadow,
          ),
          child: Column(
            children: [
              RecentActivityItem(
                studentName: '系统',
                action: '数据同步',
                time: '刚刚',
                status: 'success',
              ),
              const Divider(height: 1),
              RecentActivityItem(
                studentName: '系统',
                action: '界面更新',
                time: '刚刚',
                status: 'success',
              ),
              const Divider(height: 1),
              RecentActivityItem(
                studentName: '系统',
                action: '功能优化',
                time: '刚刚',
                status: 'success',
              ),
              const Divider(height: 1),
              RecentActivityItem(
                studentName: '系统',
                action: '性能提升',
                time: '刚刚',
                status: 'success',
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getGreeting(int hour) {
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
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
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const NfcAttendanceScreen(),
      ),
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

  void _navigateToTeacherNfcManagement(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const TeacherNfcManagementScreen(),
      ),
    );
  }

  void _navigateToAdminNfcManagement(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AdminNfcManagementScreen(),
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


}

