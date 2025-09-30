import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/attendance/providers/attendance_provider.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../../core/theme/app_theme.dart';

class ParentProfileScreen extends StatefulWidget {
  const ParentProfileScreen({super.key});

  @override
  State<ParentProfileScreen> createState() => _ParentProfileScreenState();
}

class _ParentProfileScreenState extends State<ParentProfileScreen> 
    with TickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadData();
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
      // 加载学生考勤记录
      await Provider.of<AttendanceProvider>(context, listen: false).loadAttendanceRecords();
      // 加载学生数据
      await Provider.of<StudentProvider>(context, listen: false).loadStudents();
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
        backgroundColor: const Color(0xFFDC2626),
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
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
    final userName = user.getStringValue('name') ?? '家长';
    final userEmail = user.getStringValue('email') ?? '';
    final userRole = '家长';

    return SliverToBoxAdapter(
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFDC2626),
              Color(0xFFEF4444),
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
                        Icons.family_restroom,
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
        // 获取关联的学生数量
        final linkedStudents = studentProvider.students.where((student) {
          final parentEmail = student.getStringValue('parent_email');
          final parentPhone = student.getStringValue('parent_phone');
          // 这里可以根据当前用户的邮箱或电话匹配
          return parentEmail != null || parentPhone != null;
        }).length;
        
        // 计算所有关联学生的本月出勤情况
        final now = DateTime.now();
        final thisMonth = now.month;
        final thisYear = now.year;
        
        int totalAttendance = 0;
        for (final student in studentProvider.students) {
          final studentRecords = attendanceProvider.attendanceRecords.where((record) {
            final recordStudentId = record.getStringValue('student_id') ?? 
                                   record.getStringValue('student') ??
                                   record.getStringValue('user_id');
            final recordStudentName = record.getStringValue('student_name');
            final studentName = student.getStringValue('student_name');
            
            return recordStudentId == student.id || 
                   recordStudentName == studentName;
          }).toList();
          
          final monthRecords = studentRecords.where((r) {
            final date = DateTime.tryParse(r.getStringValue('date') ?? '');
            return date != null && date.month == thisMonth && date.year == thisYear;
          }).toList();
          
          totalAttendance += monthRecords.length;
        }
        
        // 通知消息数量（这里可以集成通知系统）
        final notificationCount = 0; // 暂时设为0，后续可以集成通知系统
        
        return Row(
          children: [
            Expanded(
              child: _buildStatCard(
                '关联学生',
                '$linkedStudents',
                Icons.child_care,
                const Color(0xFF10B981),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                '本月出勤',
                '$totalAttendance',
                Icons.access_time,
                const Color(0xFF3B82F6),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                '通知消息',
                '$notificationCount',
                Icons.notifications,
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(
            icon,
            color: Colors.white,
            size: 24,
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
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
            Tab(text: '学生信息', icon: Icon(Icons.child_care, size: 16)),
            Tab(text: '考勤记录', icon: Icon(Icons.access_time, size: 16)),
            Tab(text: '设置', icon: Icon(Icons.settings, size: 16)),
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
          _buildStudentInfoTab(),
          _buildAttendanceTab(),
          _buildSettingsTab(),
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
            _buildInfoRow('角色', '家长'),
            _buildInfoRow('注册时间', user.getStringValue('created') ?? ''),
          ]),
          const SizedBox(height: 16),
          _buildInfoCard('联系信息', [
            _buildInfoRow('备用电话', user.getStringValue('backup_phone') ?? ''),
            _buildInfoRow('地址', user.getStringValue('address') ?? ''),
            _buildInfoRow('紧急联系人', user.getStringValue('emergency_contact') ?? ''),
          ]),
        ],
      ),
    );
  }

  Widget _buildStudentInfoTab() {
    return Consumer<StudentProvider>(
      builder: (context, studentProvider, child) {
        final students = studentProvider.students;
        
        if (_isLoading) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }

        if (students.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.child_care_outlined,
                  size: 64,
                  color: Colors.grey,
                ),
                SizedBox(height: 16),
                Text(
                  '暂无关联学生',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  '请联系管理员关联学生信息',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: students.length,
          itemBuilder: (context, index) {
            final student = students[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                  child: const Icon(
                    Icons.person,
                    color: AppTheme.primaryColor,
                  ),
                ),
                title: Text(
                  student.getStringValue('student_name') ?? '未知学生',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: Text(
                  '${student.getStringValue('student_id')} · ${student.getStringValue('standard')}',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // 查看学生详情
                },
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildAttendanceTab() {
    return Consumer2<AttendanceProvider, StudentProvider>(
      builder: (context, attendanceProvider, studentProvider, child) {
        try {
          final allRecords = attendanceProvider.attendanceRecords;
          final students = studentProvider.students;
          
          
          // 获取关联学生的ID列表
          final studentIds = students.map((student) => student.id).toList();
          
          // 过滤出关联学生的考勤记录
          final records = allRecords.where((record) {
            final recordStudentId = record.getStringValue('student_id') ?? 
                                   record.getStringValue('student') ?? 
                                   record.getStringValue('student_user_id');
            return studentIds.contains(recordStudentId);
          }).toList();
          
          
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
                    Icons.access_time_outlined,
                    size: 64,
                    color: Colors.grey,
                  ),
                  SizedBox(height: 16),
                  Text(
                    '暂无考勤记录',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '学生的考勤记录将显示在这里',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: records.length,
            itemBuilder: (context, index) {
              // 安全检查：确保索引在有效范围内
              if (index >= records.length) {
                return const SizedBox.shrink();
              }
              
              final record = records[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                  child: Icon(
                    record.getStringValue('type') == 'check_in' 
                        ? Icons.login 
                        : Icons.logout,
                    color: AppTheme.primaryColor,
                  ),
                ),
                title: Text(
                  record.getStringValue('student_name') ?? '未知学生',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: Text(
                  '${record.getStringValue('date')} - ${record.getStringValue('type') == 'check_in' ? '签到' : '签退'}',
                ),
                trailing: Text(
                  record.getStringValue('created')?.split('T')[1]?.split('.')[0] ?? '',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
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
          _buildSettingsCard('账户设置', [
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
          ]),
          const SizedBox(height: 16),
          _buildSettingsCard('通知设置', [
            _buildSettingsItem(
              '考勤通知',
              Icons.access_time,
              () {
                // 考勤通知设置
              },
            ),
            _buildSettingsItem(
              '积分通知',
              Icons.stars,
              () {
                // 积分通知设置
              },
            ),
            _buildSettingsItem(
              '系统通知',
              Icons.notifications,
              () {
                // 系统通知设置
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
}
