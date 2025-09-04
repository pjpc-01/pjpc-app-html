import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/finance_provider.dart';
import '../../providers/attendance_provider.dart';
import '../../screens/student/student_list_screen.dart';
import '../../screens/attendance/attendance_screen.dart';
import '../../screens/finance/finance_screen.dart';
import '../../screens/class/class_management_screen.dart';
import '../../screens/points/points_management_screen.dart';
import '../../screens/payment/payment_screen.dart';
import '../../screens/reports/reports_screen.dart';
import '../../screens/settings/settings_screen.dart';
import '../../widgets/dashboard/stats_card.dart';
import '../../widgets/dashboard/feature_card.dart';
import '../../widgets/dashboard/quick_action_card.dart';
import '../../widgets/dashboard/recent_activity_card.dart';

class AdminDashboard extends StatefulWidget {
  const AdminDashboard({super.key});

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final studentProvider = Provider.of<StudentProvider>(context, listen: false);
    final financeProvider = Provider.of<FinanceProvider>(context, listen: false);
    final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);

    await Future.wait([
      studentProvider.loadStudents(),
      financeProvider.loadFinancialData(),
      attendanceProvider.loadAttendanceRecords(),
    ]);
  }

  String _getCurrentDate() {
    final now = DateTime.now();
    final weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    final months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    return '${now.year}年${months[now.month - 1]}${now.day}日 ${weekdays[now.weekday - 1]}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Section
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF1E3A8A),
                    Color(0xFF3B82F6),
                    Color(0xFF60A5FA),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.blue.withOpacity(0.3),
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
                          Icons.admin_panel_settings,
                          color: Colors.white,
                          size: 32,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '欢迎回来！',
                              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Consumer<AuthProvider>(
                              builder: (context, authProvider, child) {
                                return Text(
                                  authProvider.userProfile?.getStringValue('name') ?? '管理员',
                                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                    color: Colors.white.withOpacity(0.9),
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          _getCurrentDate(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Key Metrics Section
            Text(
              '核心指标',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1E293B),
                fontSize: 20,
              ),
            ),
            const SizedBox(height: 16),

            Consumer2<StudentProvider, FinanceProvider>(
              builder: (context, studentProvider, financeProvider, child) {
                return GridView.count(
                  crossAxisCount: 4,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  childAspectRatio: 1.2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  children: [
                    StatsCard(
                      title: '学生总数',
                      value: '${studentProvider.students.length}',
                      icon: Icons.people,
                      color: const Color(0xFF3B82F6),
                      trend: '+12%',
                      trendUp: true,
                    ),
                    Consumer<AttendanceProvider>(
                      builder: (context, attendanceProvider, child) {
                        return StatsCard(
                          title: '今日出勤',
                          value: '${attendanceProvider.attendanceStats['today_check_in'] ?? 0}',
                          icon: Icons.check_circle,
                          color: const Color(0xFF10B981),
                          trend: '+5%',
                          trendUp: true,
                        );
                      },
                    ),
                    StatsCard(
                      title: '本月收入',
                      value: 'RM ${financeProvider.financialStats['total_payments']?.toStringAsFixed(0) ?? '0'}',
                      icon: Icons.attach_money,
                      color: const Color(0xFFF59E0B),
                      trend: '+8%',
                      trendUp: true,
                    ),
                    StatsCard(
                      title: '待收费用',
                      value: 'RM ${financeProvider.financialStats['pending_amount']?.toStringAsFixed(0) ?? '0'}',
                      icon: Icons.pending_actions,
                      color: const Color(0xFFEF4444),
                      trend: '-3%',
                      trendUp: false,
                    ),
                  ],
                );
              },
            ),

            const SizedBox(height: 32),

            // Quick Actions Section
            Text(
              '快速操作',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1E293B),
                fontSize: 20,
              ),
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: QuickActionCard(
                    title: '学生管理',
                    subtitle: '查看和管理所有学生信息',
                    icon: Icons.people,
                    color: const Color(0xFF3B82F6),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const StudentListScreen(),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: QuickActionCard(
                    title: '考勤管理',
                    subtitle: '查看和管理学生考勤记录',
                    icon: Icons.schedule,
                    color: const Color(0xFF10B981),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const AttendanceScreen(),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: QuickActionCard(
                    title: '财务管理',
                    subtitle: '管理学费和财务记录',
                    icon: Icons.account_balance_wallet,
                    color: const Color(0xFFF59E0B),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const FinanceScreen(),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: QuickActionCard(
                    title: '班级管理',
                    subtitle: '管理班级和课程信息',
                    icon: Icons.class_,
                    color: const Color(0xFF8B5CF6),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const ClassManagementScreen(),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),

            const SizedBox(height: 32),

            // Management Tools Section
            Text(
              '管理工具',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1E293B),
                fontSize: 20,
              ),
            ),
            const SizedBox(height: 16),

            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 1.1,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              children: [
                FeatureCard(
                  title: '积分管理',
                  icon: Icons.stars,
                  color: const Color(0xFFEC4899),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const PointsManagementScreen(),
                      ),
                    );
                  },
                ),
                FeatureCard(
                  title: '支付管理',
                  icon: Icons.payment,
                  color: const Color(0xFF06B6D4),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const PaymentScreen(),
                      ),
                    );
                  },
                ),
                FeatureCard(
                  title: '报表分析',
                  icon: Icons.analytics,
                  color: const Color(0xFF84CC16),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const ReportsScreen(),
                      ),
                    );
                  },
                ),
              ],
            ),

            const SizedBox(height: 32),

            // Recent Activity Section
            RecentActivityCard(),

            const SizedBox(height: 32),

            // System Settings
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFFE2E8F0),
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.settings,
                      color: Color(0xFF64748B),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '系统设置',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '管理用户权限、系统配置和通知设置',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const SettingsScreen(),
                        ),
                      );
                    },
                    icon: const Icon(
                      Icons.arrow_forward_ios,
                      color: Color(0xFF64748B),
                      size: 16,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}