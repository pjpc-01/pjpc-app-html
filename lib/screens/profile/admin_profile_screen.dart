import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/attendance/providers/attendance_provider.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../../features/integration/screens/integrated_report_screen.dart';
import '../../../core/theme/app_theme.dart';

class AdminProfileScreen extends StatefulWidget {
  const AdminProfileScreen({super.key});

  @override
  State<AdminProfileScreen> createState() => _AdminProfileScreenState();
}

class _AdminProfileScreenState extends State<AdminProfileScreen> 
    with TickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    // 延迟加载数据，避免在构建过程中调用 setState
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // 加载考勤记录
      await Provider.of<AttendanceProvider>(context, listen: false).loadAttendanceRecords();
    } catch (e) {
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('退出登录'),
          content: const Text('确定要退出登录吗？'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('取消'),
            ),
            TextButton(
              onPressed: () async {
                Navigator.of(context).pop();
                await _performLogout();
              },
              child: const Text('确定'),
            ),
          ],
        );
      },
    );
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          '个人资料',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF1E3A8A),
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final user = authProvider.user;
          if (user == null) {
            return const Center(
              child: Text('用户信息加载失败'),
            );
          }

          return CustomScrollView(
            slivers: [
              _buildHeader(user),
              _buildTabBar(),
              _buildTabContent(user),
            ],
          );
        },
      ),
    );
  }

  Widget _buildHeader(dynamic user) {
    final userName = user.getStringValue('name') ?? '管理员';
    final userEmail = user.getStringValue('email') ?? '';
    final userRole = '管理员';

    return SliverToBoxAdapter(
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF1E3A8A),
              Color(0xFF3B82F6),
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: Colors.white.withOpacity(0.2),
                      child: const Icon(
                        Icons.admin_panel_settings,
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
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            userEmail,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              userRole,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        // 编辑个人资料
                      },
                      icon: const Icon(
                        Icons.edit,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                _buildQuickStats(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuickStats() {
    return Consumer2<StudentProvider, AttendanceProvider>(
      builder: (context, studentProvider, attendanceProvider, child) {
        // 获取实际的学生和教师数量
        final totalStudents = studentProvider.students.length;
        
        // 计算今日考勤记录数
        final today = DateTime.now().toIso8601String().split('T')[0];
        final todayAttendance = attendanceProvider.attendanceRecords.where((record) {
          final recordDate = record.getStringValue('date');
          return recordDate == today;
        }).length;
        
        // 计算教师数量（从考勤记录中获取唯一教师）
        final uniqueTeachers = attendanceProvider.teacherAttendanceRecords
            .map((record) => record.getStringValue('teacher_name'))
            .where((name) => name != null && name.isNotEmpty)
            .toSet()
            .length;
        
        return Row(
          children: [
            Expanded(
              child: _buildStatCard(
                '总学生数',
                '$totalStudents',
                Icons.people,
                const Color(0xFF10B981),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                '总教师数',
                '$uniqueTeachers',
                Icons.school,
                const Color(0xFF3B82F6),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                '今日考勤',
                '$todayAttendance',
                Icons.access_time,
                const Color(0xFFF59E0B),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Column(
        children: [
          Icon(
            icon,
            color: Colors.white,
            size: 14,
          ),
          SizedBox(height: AppSpacing.xs),
          Text(
            value,
            style: AppTextStyles.headline4.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          SizedBox(height: AppSpacing.xs),
          Text(
            title,
            style: AppTextStyles.bodySmall.copyWith(
              color: Colors.white70,
              fontSize: 10,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return SliverToBoxAdapter(
      child: Container(
        color: Colors.white,
        child: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primaryColor,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: '个人信息', icon: Icon(Icons.person, size: 16)),
            Tab(text: '考勤记录', icon: Icon(Icons.access_time, size: 16)),
            Tab(text: '个人设置', icon: Icon(Icons.account_circle, size: 16)),
            Tab(text: '数据统计', icon: Icon(Icons.analytics, size: 16)),
            Tab(text: '综合报表', icon: Icon(Icons.assessment, size: 16)),
          ],
        ),
      ),
    );
  }

  Widget _buildTabContent(dynamic user) {
    return SliverFillRemaining(
      child: TabBarView(
        controller: _tabController,
        children: [
          _buildPersonalInfoTab(user),
          _buildAttendanceTab(),
          _buildSettingsTab(),
          _buildAnalyticsTab(),
          _buildIntegratedReportTab(),
        ],
      ),
    );
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
            _buildInfoRow('角色', '管理员'),
            _buildInfoRow('注册时间', user.getStringValue('created') ?? ''),
          ]),
          const SizedBox(height: 16),
          _buildInfoCard('权限信息', [
            _buildInfoRow('系统管理', '完全权限'),
            _buildInfoRow('用户管理', '完全权限'),
            _buildInfoRow('数据查看', '完全权限'),
            _buildInfoRow('系统设置', '完全权限'),
          ]),
        ],
      ),
    );
  }

  Widget _buildAttendanceTab() {
    return Consumer<AttendanceProvider>(
      builder: (context, attendanceProvider, child) {
        try {
          // 管理员个人页面应该显示管理员自己的考勤记录
          // 管理员通常没有考勤记录，所以这里应该显示空状态
          final records = <RecordModel>[];
          
          
          if (_isLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (records.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.admin_panel_settings,
                    size: 64,
                    color: Colors.grey,
                  ),
                  SizedBox(height: 16),
                  Text(
                    '管理员无需考勤记录',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '如需查看考勤管理，请使用考勤管理功能',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: records.length,
            separatorBuilder: (context, index) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              
              // 安全检查：确保索引在有效范围内
              if (index >= records.length) {
                return const SizedBox.shrink();
              }
              
              final record = records[index];
              
              // 判断是学生记录还是教师记录
              final isTeacherRecord = record.getStringValue('teacher_id') != null || 
                                    record.getStringValue('teacher_name') != null;
              
              return Card(
                margin: EdgeInsets.zero,
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: isTeacherRecord 
                        ? Colors.blue.withOpacity(0.1)
                        : AppTheme.primaryColor.withOpacity(0.1),
                    child: Icon(
                      isTeacherRecord 
                          ? Icons.school
                          : (record.getStringValue('type') == 'check_in' 
                              ? Icons.login 
                              : Icons.logout),
                      color: isTeacherRecord 
                          ? Colors.blue
                          : AppTheme.primaryColor,
                    ),
                  ),
                  title: Text(
                    isTeacherRecord 
                        ? (record.getStringValue('teacher_name') ?? '未知教师')
                        : (record.getStringValue('student_name') ?? '未知学生'),
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text(
                    isTeacherRecord 
                        ? '${record.getStringValue('date')} - 教师考勤'
                        : '${record.getStringValue('date')} - ${record.getStringValue('type') == 'check_in' ? '签到' : '签退'}',
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        record.getStringValue('created')?.split('T')[1]?.split('.')[0] ?? '',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                      if (isTeacherRecord)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.blue.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            '教师',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.blue,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          );
        } catch (e) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline,
                  size: 64,
                  color: Colors.red,
                ),
                const SizedBox(height: 16),
                Text(
                  '加载考勤记录时出错',
                  style: const TextStyle(
                    fontSize: 16,
                    color: Colors.red,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '错误: $e',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => _loadData(),
                  child: const Text('重新加载'),
                ),
              ],
            ),
          );
        }
      },
    );
  }

  Widget _buildSettingsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildSettingsCard('个人账户设置', [
            _buildSettingsItem(
              '修改密码',
              Icons.lock,
              () {
                // 修改密码
              },
            ),
            _buildSettingsItem(
              '更新邮箱',
              Icons.email,
              () {
                // 更新邮箱
              },
            ),
            _buildSettingsItem(
              '更新电话',
              Icons.phone,
              () {
                // 更新电话
              },
            ),
            _buildSettingsItem(
              '编辑个人资料',
              Icons.edit,
              () {
                // 编辑个人资料
              },
            ),
          ]),
          const SizedBox(height: 16),
          _buildSettingsCard('应用设置', [
            _buildSettingsItem(
              '通知设置',
              Icons.notifications,
              () {
                // 通知设置
              },
            ),
            _buildSettingsItem(
              '主题设置',
              Icons.palette,
              () {
                // 主题设置
              },
            ),
            _buildSettingsItem(
              '语言设置',
              Icons.language,
              () {
                // 语言设置
              },
            ),
          ]),
          const SizedBox(height: 16),
          _buildSettingsCard('账户管理', [
            _buildSettingsItem(
              '退出登录',
              Icons.logout,
              () => _showLogoutDialog(),
            ),
          ]),
          const SizedBox(height: 16),
          _buildSettingsCard('系统管理', [
            _buildSettingsItem(
              '系统设置',
              Icons.settings,
              () {
                // 导航到系统设置页面
                Navigator.pushNamed(context, '/settings');
              },
            ),
            _buildSettingsItem(
              '数据备份',
              Icons.backup,
              () {
                // 数据备份
              },
            ),
          ]),
        ],
      ),
    );
  }

  Widget _buildAnalyticsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildAnalyticsCard('今日统计', [
            _buildAnalyticsRow('学生签到', '0', const Color(0xFF10B981)),
            _buildAnalyticsRow('教师签到', '0', const Color(0xFF3B82F6)),
            _buildAnalyticsRow('迟到人数', '0', const Color(0xFFEF4444)),
            _buildAnalyticsRow('早退人数', '0', const Color(0xFFF59E0B)),
          ]),
          const SizedBox(height: 16),
          _buildAnalyticsCard('本周统计', [
            _buildAnalyticsRow('平均出勤率', '0%', const Color(0xFF10B981)),
            _buildAnalyticsRow('总考勤次数', '0', const Color(0xFF3B82F6)),
            _buildAnalyticsRow('异常记录', '0', const Color(0xFFEF4444)),
          ]),
        ],
      ),
    );
  }

  Widget _buildInfoCard(String title, List<Widget> children) {
    return Card(
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
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 14,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value.isEmpty ? '未设置' : value,
              style: const TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsCard(String title, List<Widget> children) {
    return Card(
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

  Widget _buildSettingsItem(String title, IconData icon, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primaryColor),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }

  Widget _buildAnalyticsCard(String title, List<Widget> children) {
    return Card(
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

  Widget _buildAnalyticsRow(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 14,
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              value,
              style: TextStyle(
                color: color,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIntegratedReportTab() {
    return const IntegratedReportScreen();
  }
}
