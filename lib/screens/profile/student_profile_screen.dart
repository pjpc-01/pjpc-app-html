import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/attendance_provider.dart';
import '../../providers/student_provider.dart';
import '../../theme/app_theme.dart';

class StudentProfileScreen extends StatefulWidget {
  const StudentProfileScreen({super.key});

  @override
  State<StudentProfileScreen> createState() => _StudentProfileScreenState();
}

class _StudentProfileScreenState extends State<StudentProfileScreen> 
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
    final userName = user.getStringValue('name') ?? '学生';
    final userEmail = user.getStringValue('email') ?? '';
    final userRole = '学生';

    return SliverToBoxAdapter(
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF7C3AED),
              Color(0xFF8B5CF6),
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
                        Icons.person,
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
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            '本月出勤',
            '0',
            Icons.access_time,
            const Color(0xFF10B981),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            '当前积分',
            '0',
            Icons.stars,
            const Color(0xFFF59E0B),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            '迟到次数',
            '0',
            Icons.schedule,
            const Color(0xFFEF4444),
          ),
        ),
      ],
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
            Tab(text: '考勤记录', icon: Icon(Icons.access_time, size: 16)),
            Tab(text: '积分记录', icon: Icon(Icons.stars, size: 16)),
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
          _buildAttendanceTab(),
          _buildPointsTab(),
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
            _buildInfoRow('角色', '学生'),
            _buildInfoRow('学号', user.getStringValue('student_id') ?? ''),
            _buildInfoRow('年级', user.getStringValue('standard') ?? ''),
            _buildInfoRow('中心', user.getStringValue('center') ?? ''),
          ]),
          const SizedBox(height: 16),
          _buildInfoCard('NFC信息', [
            _buildInfoRow('NFC卡号', user.getStringValue('cardNumber') ?? ''),
            _buildInfoRow('发卡日期', user.getStringValue('issuedDate') ?? ''),
            _buildInfoRow('过期日期', user.getStringValue('expiryDate') ?? ''),
          ]),
        ],
      ),
    );
  }

  Widget _buildAttendanceTab() {
    return Consumer2<AttendanceProvider, AuthProvider>(
      builder: (context, attendanceProvider, authProvider, child) {
        try {
          final allRecords = attendanceProvider.attendanceRecords;
          final currentUser = authProvider.user;
          final currentUserId = currentUser?.id;
          
          
          // 过滤出当前学生的考勤记录
          final records = allRecords.where((record) {
            final recordStudentId = record.getStringValue('student_id') ?? 
                                   record.getStringValue('student') ?? 
                                   record.getStringValue('student_user_id');
            return recordStudentId == currentUserId;
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
                    '请使用NFC卡进行签到/签退',
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

  Widget _buildPointsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildInfoCard('积分统计', [
            _buildInfoRow('当前积分', '0'),
            _buildInfoRow('本月获得', '0'),
            _buildInfoRow('本月使用', '0'),
            _buildInfoRow('历史最高', '0'),
          ]),
          const SizedBox(height: 16),
          _buildInfoCard('积分记录', [
            const Center(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Text(
                  '暂无积分记录',
                  style: TextStyle(
                    color: Colors.grey,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
          ]),
        ],
      ),
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
          _buildSettingsCard('NFC设置', [
            _buildSettingsItem(
              'NFC卡补办',
              Icons.card_membership,
              () {
                // NFC卡补办
              },
            ),
            _buildSettingsItem(
              'NFC使用记录',
              Icons.history,
              () {
                // NFC使用记录
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
