import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/attendance_provider.dart';
import '../../screens/student/student_list_screen.dart';
import '../../screens/attendance/attendance_screen.dart';
import '../../screens/class/class_management_screen.dart';
import '../../screens/points/points_management_screen.dart';
import '../../screens/reports/reports_screen.dart';
import '../../widgets/dashboard/stats_card.dart';
import '../../widgets/dashboard/feature_card.dart';
import '../../widgets/dashboard/quick_action_card.dart';
import '../../widgets/dashboard/recent_activity_card.dart';

class TeacherDashboard extends StatefulWidget {
  const TeacherDashboard({super.key});

  @override
  State<TeacherDashboard> createState() => _TeacherDashboardState();
}

class _TeacherDashboardState extends State<TeacherDashboard> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final studentProvider = Provider.of<StudentProvider>(context, listen: false);
    final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);

    await Future.wait([
      studentProvider.loadStudents(),
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
                    Color(0xFF059669),
                    Color(0xFF10B981),
                    Color(0xFF34D399),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.green.withOpacity(0.3),
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
                          Icons.school,
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
                              '教师工作台',
                              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Consumer<AuthProvider>(
                              builder: (context, authProvider, child) {
                                return Text(
                                  '欢迎回来，${authProvider.userProfile?.getStringValue('name') ?? '老师'}！',
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

            // Teaching Overview Section
            Text(
              '教学概览',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1E293B),
                fontSize: 20,
              ),
            ),
            const SizedBox(height: 16),

            Consumer2<StudentProvider, AttendanceProvider>(
              builder: (context, studentProvider, attendanceProvider, child) {
                return GridView.count(
                  crossAxisCount: 4,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  childAspectRatio: 1.2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  children: [
                    StatsCard(
                      title: '我的学生',
                      value: '${studentProvider.students.length}',
                      icon: Icons.people,
                      color: const Color(0xFF10B981),
                      trend: '+2',
                      trendUp: true,
                    ),
                    StatsCard(
                      title: '今日签到',
                      value: '${attendanceProvider.attendanceStats['today_check_in'] ?? 0}',
                      icon: Icons.check_circle,
                      color: const Color(0xFF3B82F6),
                      trend: '+5%',
                      trendUp: true,
                    ),
                    StatsCard(
                      title: '本周签到',
                      value: '${attendanceProvider.attendanceStats['this_week_check_in'] ?? 0}',
                      icon: Icons.calendar_today,
                      color: const Color(0xFFF59E0B),
                      trend: '+12%',
                      trendUp: true,
                    ),
                    StatsCard(
                      title: '本月签到',
                      value: '${attendanceProvider.attendanceStats['this_month_check_in'] ?? 0}',
                      icon: Icons.trending_up,
                      color: const Color(0xFF8B5CF6),
                      trend: '+8%',
                      trendUp: true,
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
                    subtitle: '查看和管理班级学生',
                    icon: Icons.people,
                    color: const Color(0xFF10B981),
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
                    subtitle: '记录和查看学生考勤',
                    icon: Icons.schedule,
                    color: const Color(0xFF3B82F6),
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
                const SizedBox(width: 16),
                Expanded(
                  child: QuickActionCard(
                    title: '积分管理',
                    subtitle: '管理学生积分和奖励',
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
                ),
              ],
            ),

            const SizedBox(height: 32),

            // Teaching Tools Section
            Text(
              '教学工具',
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
                  title: '课程表',
                  icon: Icons.calendar_month,
                  color: const Color(0xFF06B6D4),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('课程表功能开发中...'),
                        backgroundColor: Color(0xFF06B6D4),
                      ),
                    );
                  },
                ),
                FeatureCard(
                  title: '作业管理',
                  icon: Icons.assignment,
                  color: const Color(0xFFF59E0B),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('作业管理功能开发中...'),
                        backgroundColor: Color(0xFFF59E0B),
                      ),
                    );
                  },
                ),
                FeatureCard(
                  title: '成绩管理',
                  icon: Icons.grade,
                  color: const Color(0xFF84CC16),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('成绩管理功能开发中...'),
                        backgroundColor: Color(0xFF84CC16),
                      ),
                    );
                  },
                ),
                FeatureCard(
                  title: '家长沟通',
                  icon: Icons.chat,
                  color: const Color(0xFF8B5CF6),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('家长沟通功能开发中...'),
                        backgroundColor: Color(0xFF8B5CF6),
                      ),
                    );
                  },
                ),
                FeatureCard(
                  title: '教学资源',
                  icon: Icons.library_books,
                  color: const Color(0xFFEF4444),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('教学资源功能开发中...'),
                        backgroundColor: Color(0xFFEF4444),
                      ),
                    );
                  },
                ),
                FeatureCard(
                  title: '报表分析',
                  icon: Icons.analytics,
                  color: const Color(0xFF64748B),
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

            // Quick Tips Section
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFFF0F9FF),
                    Color(0xFFE0F2FE),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFF0EA5E9).withOpacity(0.2),
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0EA5E9).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.lightbulb,
                      color: Color(0xFF0EA5E9),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '教学提示',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF0C4A6E),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '记得及时记录学生考勤，定期更新学生积分，保持与家长的沟通。',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFF0369A1),
                          ),
                        ),
                      ],
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