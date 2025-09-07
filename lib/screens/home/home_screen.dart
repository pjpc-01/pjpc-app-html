import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../attendance/attendance_dashboard_screen.dart';
import '../attendance/nfc_attendance_screen.dart';
import '../student/student_management_screen.dart';
import '../academic/homework_grades_screen.dart';
import '../reports/analytics_screen.dart';
import '../settings/settings_screen.dart';
import '../../widgets/common/quick_action_card.dart';
import '../../widgets/common/statistics_card.dart';
import '../../widgets/common/recent_activity_item.dart';

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
    const AnalyticsScreen(),
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
              icon: Icon(Icons.analytics_outlined),
              activeIcon: Icon(Icons.analytics),
              label: '分析',
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 欢迎区域
              _buildWelcomeSection(context),
              const SizedBox(height: AppSpacing.lg),
              
              // 快速操作
              _buildQuickActionsSection(context),
              const SizedBox(height: AppSpacing.lg),
              
              // 统计概览
              _buildStatisticsSection(context),
              const SizedBox(height: AppSpacing.lg),
              
              // 最近活动
              _buildRecentActivitySection(context),
            ],
          ),
        ),
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
                          _getCurrentDateString(),
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '快速操作',
          style: AppTextStyles.headline5,
        ),
        const SizedBox(height: AppSpacing.sm),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 1.3,
          crossAxisSpacing: AppSpacing.sm,
          mainAxisSpacing: AppSpacing.sm,
          children: [
            QuickActionCard(
              title: 'NFC考勤',
              subtitle: '扫描NFC卡片考勤',
              icon: Icons.nfc,
              color: AppTheme.accentColor,
              onTap: () => _navigateToNfcAttendance(context),
            ),
            QuickActionCard(
              title: '手动签到',
              subtitle: '手动录入考勤',
              icon: Icons.edit_calendar,
              color: AppTheme.primaryColor,
              onTap: () => _showManualCheckInDialog(context),
            ),
            QuickActionCard(
              title: '学生管理',
              subtitle: '查看学生信息',
              icon: Icons.people,
              color: AppTheme.accentColor,
              onTap: () => _navigateToStudents(context),
            ),
            QuickActionCard(
              title: '作业成绩',
              subtitle: '管理作业与成绩',
              icon: Icons.assignment,
              color: AppTheme.primaryColor,
              onTap: () => _navigateToHomeworkGrades(context),
            ),
            QuickActionCard(
              title: '考勤报告',
              subtitle: '查看详细报告',
              icon: Icons.assessment,
              color: AppTheme.warningColor,
              onTap: () => _navigateToReports(context),
            ),
          ],
        ),
      ],
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
                studentName: '张三',
                action: 'NFC签到',
                time: '09:15',
                status: 'success',
              ),
              const Divider(height: 1),
              RecentActivityItem(
                studentName: '李四',
                action: '手动签到',
                time: '09:20',
                status: 'success',
              ),
              const Divider(height: 1),
              RecentActivityItem(
                studentName: '王五',
                action: '迟到',
                time: '09:35',
                status: 'warning',
              ),
              const Divider(height: 1),
              RecentActivityItem(
                studentName: '赵六',
                action: '缺勤',
                time: '--',
                status: 'error',
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

  String _getCurrentDateString() {
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
    // 导航到学生管理页面
  }

  void _navigateToHomeworkGrades(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const HomeworkGradesScreen(),
      ),
    );
  }

  void _navigateToReports(BuildContext context) {
    // 导航到报告页面
  }


  void _showManualCheckInDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('手动签到'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              decoration: InputDecoration(
                labelText: '学生姓名或学号',
                hintText: '请输入学生信息',
              ),
            ),
            SizedBox(height: 16),
            TextField(
              decoration: InputDecoration(
                labelText: '备注',
                hintText: '可选',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('签到成功'),
                  backgroundColor: AppTheme.successColor,
                ),
              );
            },
            child: const Text('确认'),
          ),
        ],
      ),
    );
  }
}

