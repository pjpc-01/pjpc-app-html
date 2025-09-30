import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/attendance/providers/attendance_provider.dart';
import '../../features/finance/providers/teacher_salary_provider.dart';
import '../../features/leave/providers/teacher_leave_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../features/nfc/screens/nfc_management_optimized_v2.dart';
import '../../features/attendance/screens/attendance_records_screen.dart';
import '../../features/attendance/screens/attendance_management_screen.dart';
import '../../features/teacher/screens/teacher_salary_management_screen.dart';
import '../../features/teacher/screens/teacher_leave_management_screen.dart';

class TeacherProfileScreen extends StatefulWidget {
  const TeacherProfileScreen({super.key});

  @override
  State<TeacherProfileScreen> createState() => _TeacherProfileScreenState();
}

class _TeacherProfileScreenState extends State<TeacherProfileScreen> {
  bool _isLoading = false;
  int _selectedIndex = 0; // 当前选中的页面索引

  // 页面选项
  final List<ProfilePage> _pages = [
    ProfilePage(
      title: '个人信息',
      icon: Icons.person_outline,
      color: Colors.blue,
    ),
    ProfilePage(
      title: '考勤记录',
      icon: Icons.access_time_outlined,
      color: Colors.green,
    ),
    ProfilePage(
      title: '我的薪资',
      icon: Icons.payment_outlined,
      color: Colors.orange,
    ),
    ProfilePage(
      title: '我的请假',
      icon: Icons.event_available_outlined,
      color: Colors.purple,
    ),
    ProfilePage(
      title: '教学信息',
      icon: Icons.school_outlined,
      color: Colors.teal,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final currentUserId = authProvider.user?.id;
      
      if (currentUserId != null) {
        // 并行加载所有数据
        await Future.wait([
          // 加载教师考勤记录
          Provider.of<AttendanceProvider>(context, listen: false).loadTeacherAttendanceRecords(),
          // 加载教师薪资记录
          Provider.of<TeacherSalaryProvider>(context, listen: false).loadSalaryRecords(teacherId: currentUserId),
          // 加载教师请假记录
          Provider.of<TeacherLeaveProvider>(context, listen: false).loadLeaveRecords(teacherId: currentUserId),
        ]);
      }
      
    } catch (e) {
      // 静默处理错误
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final user = authProvider.user;
          if (user == null) {
            return const Center(
              child: Text('用户信息加载失败'),
            );
          }

          return Column(
            children: [
              _buildHeader(user),
              _buildNavigationTabs(),
              Expanded(
                child: _buildContent(user),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildHeader(dynamic user) {
    final userName = user.getStringValue('name') ?? '教师';
    final userEmail = user.getStringValue('email') ?? '';
    final userRole = '教师';

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF059669),
            Color(0xFF10B981),
          ],
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // 顶部操作栏
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                  ),
                  Text(
                    '个人中心',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  PopupMenuButton<String>(
                    icon: const Icon(Icons.more_vert, color: Colors.white),
                    onSelected: (value) {
                      if (value == 'logout') {
                        _performLogout();
                      }
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'logout',
                        child: Row(
                          children: [
                            Icon(Icons.logout, color: Colors.red),
                            SizedBox(width: 8),
                            Text('退出登录'),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),
              // 用户信息
              Row(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: Colors.white.withOpacity(0.2),
                    child: const Icon(
                      Icons.school,
                      size: 40,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          userName,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          userEmail,
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.white.withOpacity(0.8),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            userRole,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.white,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavigationTabs() {
    return Container(
      color: Colors.white,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: _pages.asMap().entries.map((entry) {
            final index = entry.key;
            final page = entry.value;
            final isSelected = _selectedIndex == index;
            
            return GestureDetector(
              onTap: () {
                setState(() {
                  _selectedIndex = index;
                });
              },
              child: Container(
                margin: const EdgeInsets.only(right: 12),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: isSelected ? page.color.withOpacity(0.1) : Colors.grey[100],
                  borderRadius: BorderRadius.circular(25),
                  border: isSelected 
                    ? Border.all(color: page.color, width: 2)
                    : null,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      page.icon,
                      size: 20,
                      color: isSelected ? page.color : Colors.grey[600],
                    ),
                    const SizedBox(width: 8),
                    Text(
                      page.title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                        color: isSelected ? page.color : Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildContent(dynamic user) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    switch (_selectedIndex) {
      case 0:
        return _buildPersonalInfoTab(user);
      case 1:
        return _buildAttendanceTab();
      case 2:
        return _buildMySalaryTab();
      case 3:
        return _buildMyLeaveTab();
      case 4:
        return _buildTeachingTab(user);
      default:
        return _buildPersonalInfoTab(user);
    }
  }

  Widget _buildPersonalInfoTab(dynamic user) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildInfoCard('基本信息', [
            _buildInfoRow('姓名', user.getStringValue('name') ?? ''),
            _buildInfoRow('邮箱', user.getStringValue('email') ?? ''),
            _buildInfoRow('电话', user.getStringValue('phone') ?? ''),
            _buildInfoRow('角色', '教师'),
            _buildInfoRow('工号', user.getStringValue('teacher_id') ?? ''),
            _buildInfoRow('部门', user.getStringValue('department') ?? ''),
            _buildInfoRow('职位', user.getStringValue('position') ?? ''),
          ]),
          const SizedBox(height: 16),
          _buildInfoCard('NFC信息', [
            _buildInfoRow('NFC卡号', user.getStringValue('cardNumber') ?? ''),
            _buildInfoRow('发卡日期', user.getStringValue('nfc_card_issued_date') ?? ''),
            _buildInfoRow('过期日期', user.getStringValue('nfc_card_expiry_date') ?? ''),
          ]),
          const SizedBox(height: 16),
          _buildActionCard(),
        ],
      ),
    );
  }

  Widget _buildInfoCard(String title, List<Widget> children) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: AppTheme.textSecondary,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value.isEmpty ? '未设置' : value,
              style: const TextStyle(
                fontSize: 14,
                color: AppTheme.textPrimary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '快速操作',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildActionButton(
                    'NFC管理',
                    Icons.nfc,
                    Colors.blue,
                    () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const NfcManagementOptimizedV2(),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildActionButton(
                    '修改密码',
                    Icons.lock,
                    Colors.orange,
                    () {
                      // TODO: 实现修改密码功能
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('修改密码功能开发中')),
                      );
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton(String title, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttendanceTab() {
    return const AttendanceManagementScreen();
  }

  Widget _buildMySalaryTab() {
    return Consumer2<TeacherSalaryProvider, AuthProvider>(
      builder: (context, salaryProvider, authProvider, child) {
        if (salaryProvider.isLoading) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }

        if (salaryProvider.error != null) {
          // 检查是否是数据库表不存在的错误
          final isTableNotFound = salaryProvider.error!.contains('teacher_salary_record') ||
                                 salaryProvider.error!.contains('不存在') ||
                                 salaryProvider.error!.contains('not found');
          
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  isTableNotFound ? Icons.construction : Icons.error_outline,
                  size: 64,
                  color: isTableNotFound ? Colors.orange[400] : Colors.red[400],
                ),
                const SizedBox(height: 16),
                Text(
                  isTableNotFound ? '功能暂未开放' : '加载失败',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Text(
                    isTableNotFound 
                        ? '薪资管理功能正在开发中，敬请期待！\n\n如需查看薪资信息，请联系管理员。'
                        : salaryProvider.error!,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                if (!isTableNotFound) ...[
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadData,
                    child: const Text('重试'),
                  ),
                ],
              ],
            ),
          );
        }

        final salaryRecords = salaryProvider.salaryRecords;
        final salarySummary = salaryProvider.getSalarySummary();

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              // 薪资概览卡片
              _buildSalaryOverviewCard(salarySummary),
              const SizedBox(height: 16),
              // 最近薪资记录
              _buildRecentSalaryRecords(salaryRecords),
              const SizedBox(height: 16),
              // 查看全部按钮
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TeacherSalaryManagementScreen(),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    '查看全部薪资记录',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMyLeaveTab() {
    return Consumer2<TeacherLeaveProvider, AuthProvider>(
      builder: (context, leaveProvider, authProvider, child) {
        if (leaveProvider.isLoading) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }

        if (leaveProvider.error != null) {
          // 检查是否是数据库表不存在的错误
          final isTableNotFound = leaveProvider.error!.contains('teacher_leave_record') ||
                                 leaveProvider.error!.contains('不存在') ||
                                 leaveProvider.error!.contains('not found');
          
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  isTableNotFound ? Icons.construction : Icons.error_outline,
                  size: 64,
                  color: isTableNotFound ? Colors.orange[400] : Colors.red[400],
                ),
                const SizedBox(height: 16),
                Text(
                  isTableNotFound ? '功能暂未开放' : '加载失败',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Text(
                    isTableNotFound 
                        ? '请假管理功能正在开发中，敬请期待！\n\n如需申请请假，请联系管理员。'
                        : leaveProvider.error!,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                if (!isTableNotFound) ...[
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadData,
                    child: const Text('重试'),
                  ),
                ],
              ],
            ),
          );
        }

        final leaveRecords = leaveProvider.leaveRecords;
        final leaveSummary = leaveProvider.getLeaveSummary();

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              // 请假概览卡片
              _buildLeaveOverviewCard(leaveSummary),
              const SizedBox(height: 16),
              // 最近请假记录
              _buildRecentLeaveRecords(leaveRecords),
              const SizedBox(height: 16),
              // 查看全部按钮
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TeacherLeaveManagementScreen(),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    '查看全部请假记录',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTeachingTab(dynamic user) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildInfoCard('教学信息', [
            _buildInfoRow('任教班级', '未设置'),
            _buildInfoRow('任教科目', '未设置'),
            _buildInfoRow('教学经验', '未设置'),
            _buildInfoRow('入职时间', '未设置'),
          ]),
          const SizedBox(height: 16),
          _buildInfoCard('权限信息', [
            _buildInfoRow('学生管理', '查看权限'),
            _buildInfoRow('考勤管理', '完整权限'),
            _buildInfoRow('成绩管理', '查看权限'),
            _buildInfoRow('通知管理', '查看权限'),
          ]),
        ],
      ),
    );
  }

  // 薪资相关辅助方法
  Widget _buildSalaryOverviewCard(Map<String, double> summary) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.account_balance_wallet,
                  color: AppTheme.primaryColor,
                  size: 24,
                ),
                const SizedBox(width: 8),
                Text(
                  '薪资概览',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildSummaryItem('总薪资', summary['total_salary'] ?? 0.0, Colors.blue),
                ),
                Expanded(
                  child: _buildSummaryItem('总奖金', summary['total_bonus'] ?? 0.0, Colors.green),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildSummaryItem('总扣除', summary['total_deduction'] ?? 0.0, Colors.red),
                ),
                Expanded(
                  child: _buildSummaryItem('实发工资', summary['net_salary'] ?? 0.0, AppTheme.primaryColor),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryItem(String label, double value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'RM ${value.toStringAsFixed(2)}',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildRecentSalaryRecords(List<dynamic> records) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '最近薪资记录',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            if (records.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: Text(
                    '暂无薪资记录',
                    style: TextStyle(
                      color: Colors.grey,
                      fontSize: 14,
                    ),
                  ),
                ),
              )
            else
              ...records.take(5).map((record) => _buildSalaryRecordItem(record)),
          ],
        ),
      ),
    );
  }

  Widget _buildSalaryRecordItem(dynamic record) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(
            Icons.payment,
            color: AppTheme.primaryColor,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  record.getStringValue('salary_type') ?? '月薪',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  record.getStringValue('salary_date') ?? '',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Text(
            'RM ${(record.getDoubleValue('amount') ?? 0.0).toStringAsFixed(2)}',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }

  // 请假相关辅助方法
  Widget _buildLeaveOverviewCard(Map<String, dynamic> summary) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.event_available,
                  color: AppTheme.primaryColor,
                  size: 24,
                ),
                const SizedBox(width: 8),
                Text(
                  '请假概览',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildLeaveSummaryItem('总请假', summary['total_leaves']?.toDouble() ?? 0.0, Colors.blue),
                ),
                Expanded(
                  child: _buildLeaveSummaryItem('待审批', summary['pending_leaves']?.toDouble() ?? 0.0, Colors.orange),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildLeaveSummaryItem('已批准', summary['approved_leaves']?.toDouble() ?? 0.0, Colors.green),
                ),
                Expanded(
                  child: _buildLeaveSummaryItem('已拒绝', summary['rejected_leaves']?.toDouble() ?? 0.0, Colors.red),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLeaveSummaryItem(String label, double value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '${value.toInt()} 天',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildRecentLeaveRecords(List<dynamic> records) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '最近请假记录',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            if (records.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: Text(
                    '暂无请假记录',
                    style: TextStyle(
                      color: Colors.grey,
                      fontSize: 14,
                    ),
                  ),
                ),
              )
            else
              ...records.take(5).map((record) => _buildLeaveRecordItem(record)),
          ],
        ),
      ),
    );
  }

  Widget _buildLeaveRecordItem(dynamic record) {
    final status = record.getStringValue('status') ?? 'pending';
    final statusColor = _getLeaveStatusColor(status);
    final statusText = _getLeaveStatusText(status);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(
            Icons.event_available,
            color: statusColor,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  record.getStringValue('leave_type') ?? '事假',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  '${record.getStringValue('start_date') ?? ''} - ${record.getStringValue('end_date') ?? ''}',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              statusText,
              style: TextStyle(
                fontSize: 12,
                color: statusColor,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getLeaveStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      case 'pending':
      default:
        return Colors.orange;
    }
  }

  String _getLeaveStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return '已批准';
      case 'rejected':
        return '已拒绝';
      case 'pending':
      default:
        return '待审批';
    }
  }

  Future<void> _performLogout() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      await authProvider.logout();
      
      // 导航到登录页面
      Navigator.of(context).pushNamedAndRemoveUntil(
        '/login',
        (route) => false,
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('退出登录失败: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}

class ProfilePage {
  final String title;
  final IconData icon;
  final Color color;

  ProfilePage({
    required this.title,
    required this.icon,
    required this.color,
  });
}
