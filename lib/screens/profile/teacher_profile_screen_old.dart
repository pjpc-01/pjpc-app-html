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

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    super.dispose();
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



  String _formatTime(String? timeString) {
    if (timeString == null) return '';
    try {
      final dateTime = DateTime.parse(timeString);
      return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return timeString;
    }
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return '';
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final recordDate = DateTime(date.year, date.month, date.day);
      
      if (recordDate == today) {
        return '今天 (${date.month}/${date.day})';
      } else if (recordDate == today.subtract(const Duration(days: 1))) {
        return '昨天 (${date.month}/${date.day})';
      } else {
        return '${date.year}年${date.month}月${date.day}日';
      }
    } catch (e) {
      return dateString;
    }
  }

  List<dynamic> _getFilteredRecords(List<dynamic> records) {
    final now = DateTime.now();
    
    switch (_selectedFilter) {
      case 'today':
        final today = now.toIso8601String().split('T')[0];
        return records.where((record) {
          final recordDate = record.getStringValue('date') ?? '';
          return recordDate == today;
        }).toList();
        
      case 'week':
        final weekStart = now.subtract(Duration(days: now.weekday - 1));
        return records.where((record) {
          final recordDate = DateTime.tryParse(record.getStringValue('date') ?? '');
          if (recordDate == null) return false;
          return recordDate.isAfter(weekStart.subtract(const Duration(days: 1))) &&
                 recordDate.isBefore(now.add(const Duration(days: 1)));
        }).toList();
        
      case 'month':
        return records.where((record) {
          final recordDate = DateTime.tryParse(record.getStringValue('date') ?? '');
          if (recordDate == null) return false;
          return recordDate.year == now.year && recordDate.month == now.month;
        }).toList();
        
      case 'year':
        return records.where((record) {
          final recordDate = DateTime.tryParse(record.getStringValue('date') ?? '');
          if (recordDate == null) return false;
          return recordDate.year == now.year;
        }).toList();
        
      default:
        return records;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'present':
      case 'complete':
        return Colors.green;
      case 'absent':
        return Colors.red;
      case 'sick':
        return Colors.orange;
      case 'leave':
        return Colors.blue;
      case 'checked_in':
        return Colors.blue;
      case 'checked_out':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  Widget _buildFilterChip(String filter, String label) {
    final isSelected = _selectedFilter == filter;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedFilter = filter;
        });
      },
      selectedColor: AppTheme.primaryColor.withOpacity(0.2),
      checkmarkColor: AppTheme.primaryColor,
    );
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
              _buildModernHeader(user),
              _buildQuickActions(),
              _buildMainContent(user),
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

    return SliverToBoxAdapter(
      child: Container(
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
    return Consumer2<AttendanceProvider, AuthProvider>(
      builder: (context, attendanceProvider, authProvider, child) {
        final currentUser = authProvider.user;
        final allRecords = attendanceProvider.teacherAttendanceRecords;
        
        // 过滤当前用户的记录
        final records = allRecords.where((record) {
          final recordTeacherId = record.getStringValue('teacher_id') ?? 
                                 record.getStringValue('teacher_user_id') ?? 
                                 record.getStringValue('teacher') ??
                                 record.getStringValue('user_id') ??
                                 record.getStringValue('teacher_name');
          final recordTeacherName = record.getStringValue('teacher_name');
          final currentUserName = currentUser?.getStringValue('name');
          
          return recordTeacherId == currentUser?.id || 
                 recordTeacherName == currentUserName ||
                 recordTeacherId == currentUserName;
        }).toList();
        
        // 计算统计数据
        final now = DateTime.now();
        final thisMonth = now.month;
        final thisYear = now.year;
        
        // 本月记录
        final monthRecords = records.where((r) {
          final date = DateTime.tryParse(r.getStringValue('date') ?? '');
          return date != null && date.month == thisMonth && date.year == thisYear;
        }).toList();
        
        // 完整考勤天数（有签到和签退）
        final completeDays = monthRecords.where((r) {
          final checkIn = r.getStringValue('check_in');
          final checkOut = r.getStringValue('check_out');
          return checkIn != null && checkIn.isNotEmpty && checkOut != null && checkOut.isNotEmpty;
        }).length;
        
        // 迟到次数（签到时间晚于9:00）
        final lateCount = monthRecords.where((r) {
          final checkIn = r.getStringValue('check_in');
          if (checkIn == null || checkIn.isEmpty) return false;
          try {
            final checkInTime = DateTime.parse(checkIn);
            return checkInTime.hour > 9 || (checkInTime.hour == 9 && checkInTime.minute > 0);
          } catch (e) {
            return false;
          }
        }).length;
        
        // 请假天数（状态为请假）
        final leaveDays = monthRecords.where((r) {
          final status = r.getStringValue('status')?.toLowerCase();
          return status == 'leave' || status == 'absent' || status == 'sick';
        }).length;
        
        return Row(
          children: [
            Expanded(
              child: _buildStatCard(
                '本月出勤',
                '$completeDays',
                '天',
                Icons.access_time,
                const Color(0xFF10B981),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                '迟到次数',
                '$lateCount',
                '次',
                Icons.schedule,
                const Color(0xFFF59E0B),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                '请假天数',
                '$leaveDays',
                '天',
                Icons.event_busy,
                const Color(0xFFEF4444),
              ),
            ),
          ],
        );
      },
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
            Tab(text: '我的薪资', icon: Icon(Icons.payment, size: 16)),
            Tab(text: '我的请假', icon: Icon(Icons.event_available, size: 16)),
            Tab(text: '教学信息', icon: Icon(Icons.school, size: 16)),
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
          _buildMySalaryTab(),
          _buildMyLeaveTab(),
          _buildTeachingTab(),
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
        ],
      ),
    );
  }

  Widget _buildAttendanceTab() {
    return const AttendanceManagementScreen();
  }

  Widget _buildTeachingTab() {
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
            _buildInfoRow('考勤管理', '完全权限'),
            _buildInfoRow('积分管理', '完全权限'),
            _buildInfoRow('作业管理', '完全权限'),
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
                // 导航到NFC管理页面的补办功能
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const NFCManagementOptimizedV2(
                      initialTab: 2, // 补办申请标签页
                    ),
                  ),
                );
              },
            ),
            _buildSettingsItem(
              'NFC使用记录',
              Icons.history,
              () {
                // 导航到考勤记录页面查看NFC使用记录
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const AttendanceRecordsScreen(),
                  ),
                );
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





  // 企业级考勤概览卡片
  Widget _buildAttendanceOverview(List<dynamic> records) {
    final now = DateTime.now();
    final today = now.toIso8601String().split('T')[0];
    final thisMonth = now.month;
    final thisYear = now.year;
    
    // 计算统计数据
    final todayRecords = records.where((r) => r.getStringValue('date') == today).toList();
    final monthRecords = records.where((r) {
      final date = DateTime.tryParse(r.getStringValue('date') ?? '');
      return date != null && date.month == thisMonth && date.year == thisYear;
    }).toList();
    
    final totalDays = monthRecords.length;
    final completeDays = monthRecords.where((r) {
      final checkIn = r.getStringValue('check_in');
      final checkOut = r.getStringValue('check_out');
      return checkIn != null && checkIn.isNotEmpty && checkOut != null && checkOut.isNotEmpty;
    }).length;
    
    final attendanceRate = totalDays > 0 ? (completeDays / totalDays * 100).round() : 0;
    
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppTheme.primaryColor,
              AppTheme.primaryColor.withOpacity(0.8),
            ],
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primaryColor.withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
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
                      Icons.analytics_outlined,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '考勤概览',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '${now.year}年${now.month}月',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.8),
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      '本月出勤',
                      '$totalDays',
                      '天',
                      Icons.calendar_today,
                      Colors.white.withOpacity(0.2),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildStatCard(
                      '完整考勤',
                      '$completeDays',
                      '天',
                      Icons.check_circle,
                      Colors.white.withOpacity(0.2),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      '出勤率',
                      '$attendanceRate',
                      '%',
                      Icons.trending_up,
                      Colors.white.withOpacity(0.2),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildStatCard(
                      '今日状态',
                      todayRecords.isNotEmpty ? '已记录' : '未记录',
                      '',
                      Icons.today,
                      Colors.white.withOpacity(0.2),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, String unit, IconData icon, Color iconBg) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: 20,
            ),
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
          Text(
            unit,
            style: TextStyle(
              color: Colors.white.withOpacity(0.8),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              color: Colors.white.withOpacity(0.8),
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // 快速操作区域
  Widget _buildQuickActions() {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.flash_on,
                    color: AppTheme.primaryColor,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                const Text(
                  '快速操作',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton(String title, IconData icon, Color color, VoidCallback onPressed) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: color.withOpacity(0.1),
        foregroundColor: color,
        elevation: 0,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: color.withOpacity(0.3)),
        ),
      ),
      child: Column(
        children: [
          Icon(icon, size: 24),
          const SizedBox(height: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  // 考勤统计图表
  Widget _buildAttendanceCharts(List<dynamic> records) {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.bar_chart,
                    color: Colors.blue,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                const Text(
                  '考勤趋势',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // 这里可以添加图表组件
            Container(
              height: 200,
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.grey.withOpacity(0.2),
                  width: 1,
                ),
              ),
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.show_chart,
                      size: 48,
                      color: Colors.grey,
                    ),
                    SizedBox(height: 8),
                    Text(
                      '考勤趋势图表',
                      style: TextStyle(
                        color: Colors.grey,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      '（图表组件待实现）',
                      style: TextStyle(
                        color: Colors.grey,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 考勤记录列表
  Widget _buildAttendanceRecordsList(List<dynamic> records) {
    if (records.isEmpty) {
      return SliverToBoxAdapter(
        child: Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(40),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Column(
            children: [
              Icon(
                Icons.access_time_outlined,
                size: 64,
                color: Colors.grey[400],
              ),
              const SizedBox(height: 16),
              Text(
                '暂无考勤记录',
                style: TextStyle(
                  fontSize: 18,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '请使用上方快速操作进行签到/签退',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
        ),
      );
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final record = records[index];
          return _buildAttendanceRecordCard(record, index);
        },
        childCount: records.length,
      ),
    );
  }

  Widget _buildAttendanceRecordCard(dynamic record, int index) {
    final checkIn = record.getStringValue('check_in');
    final checkOut = record.getStringValue('check_out');
    final status = record.getStringValue('status') ?? 'present';
    final date = record.getStringValue('date');
    
    // 确定显示类型和图标
    String displayType;
    IconData iconData;
    Color iconColor;
    
    if (checkIn != null && checkOut != null) {
      displayType = '完整考勤';
      iconData = Icons.check_circle;
      iconColor = Colors.green;
    } else if (checkIn != null) {
      displayType = '已签到';
      iconData = Icons.login;
      iconColor = Colors.blue;
    } else if (checkOut != null) {
      displayType = '已签退';
      iconData = Icons.logout;
      iconColor = Colors.orange;
    } else {
      displayType = '状态: ${status}';
      iconData = Icons.info;
      iconColor = Colors.grey;
    }
    
    return Container(
      margin: EdgeInsets.fromLTRB(16, index == 0 ? 0 : 8, 16, 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: iconColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    iconData,
                    color: iconColor,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _formatDate(date),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        displayType,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    status,
                    style: TextStyle(
                      color: _getStatusColor(status),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: checkIn != null && checkIn.isNotEmpty 
                          ? Colors.green.withOpacity(0.1)
                          : Colors.grey.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.login,
                          color: checkIn != null && checkIn.isNotEmpty 
                              ? Colors.green[700]
                              : Colors.grey[600],
                          size: 20,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          checkIn != null && checkIn.isNotEmpty
                              ? _formatTime(checkIn)
                              : '未记录',
                          style: TextStyle(
                            color: checkIn != null && checkIn.isNotEmpty 
                                ? Colors.green[700]
                                : Colors.grey[600],
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          '签到',
                          style: TextStyle(
                            color: checkIn != null && checkIn.isNotEmpty 
                                ? Colors.green[700]
                                : Colors.grey[600],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: checkOut != null && checkOut.isNotEmpty 
                          ? Colors.orange.withOpacity(0.1)
                          : Colors.grey.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.logout,
                          color: checkOut != null && checkOut.isNotEmpty 
                              ? Colors.orange[700]
                              : Colors.grey[600],
                          size: 20,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          checkOut != null && checkOut.isNotEmpty
                              ? _formatTime(checkOut)
                              : '未记录',
                          style: TextStyle(
                            color: checkOut != null && checkOut.isNotEmpty 
                                ? Colors.orange[700]
                                : Colors.grey[600],
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          '签退',
                          style: TextStyle(
                            color: checkOut != null && checkOut.isNotEmpty 
                                ? Colors.orange[700]
                                : Colors.grey[600],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 薪资概览卡片
              _buildSalaryOverviewCard(salarySummary),
              const SizedBox(height: 16),
              
              // 标题和查看全部按钮
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '最近薪资记录',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const TeacherSalaryManagementScreen(),
                        ),
                      );
                    },
                    child: const Text('查看全部'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // 薪资记录列表
              if (salaryRecords.isEmpty)
                _buildEmptySalaryState()
              else
                _buildSalaryRecordsList(salaryRecords.take(5).toList()),
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 请假概览卡片
              _buildLeaveOverviewCard(leaveSummary),
              const SizedBox(height: 16),
              
              // 标题和查看全部按钮
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '最近请假记录',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const TeacherLeaveManagementScreen(),
                        ),
                      );
                    },
                    child: const Text('查看全部'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // 请假记录列表
              if (leaveRecords.isEmpty)
                _buildEmptyLeaveState()
              else
                _buildLeaveRecordsList(leaveRecords.take(5).toList()),
            ],
          ),
        );
      },
    );
  }

  // 薪资概览卡片
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
                  child: _buildSummaryItem(
                    '总薪资',
                    '¥${(summary['total_salary'] ?? 0.0).toStringAsFixed(2)}',
                    Icons.attach_money,
                    Colors.green,
                  ),
                ),
                Expanded(
                  child: _buildSummaryItem(
                    '总奖金',
                    '¥${(summary['total_bonus'] ?? 0.0).toStringAsFixed(2)}',
                    Icons.card_giftcard,
                    Colors.orange,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildSummaryItem(
                    '总扣除',
                    '¥${(summary['total_deduction'] ?? 0.0).toStringAsFixed(2)}',
                    Icons.remove_circle,
                    Colors.red,
                  ),
                ),
                Expanded(
                  child: _buildSummaryItem(
                    '实发工资',
                    '¥${(summary['net_salary'] ?? 0.0).toStringAsFixed(2)}',
                    Icons.payment,
                    AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // 请假概览卡片
  Widget _buildLeaveOverviewCard(Map<String, int> summary) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.event_note,
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
                  child: _buildSummaryItem(
                    '总请假',
                    '${summary['total_leaves'] ?? 0}',
                    Icons.event_available,
                    Colors.blue,
                  ),
                ),
                Expanded(
                  child: _buildSummaryItem(
                    '待审批',
                    '${summary['pending_leaves'] ?? 0}',
                    Icons.pending,
                    Colors.orange,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildSummaryItem(
                    '已批准',
                    '${summary['approved_leaves'] ?? 0}',
                    Icons.check_circle,
                    Colors.green,
                  ),
                ),
                Expanded(
                  child: _buildSummaryItem(
                    '已拒绝',
                    '${summary['rejected_leaves'] ?? 0}',
                    Icons.cancel,
                    Colors.red,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // 概览项目
  Widget _buildSummaryItem(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  // 空薪资状态
  Widget _buildEmptySalaryState() {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          Icon(
            Icons.payment_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            '暂无薪资记录',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '您的薪资记录将在这里显示',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  // 空请假状态
  Widget _buildEmptyLeaveState() {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          Icon(
            Icons.event_available_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            '暂无请假记录',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '您的请假记录将在这里显示',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  // 薪资记录列表
  Widget _buildSalaryRecordsList(List<dynamic> records) {
    return Column(
      children: records.map((record) => _buildSalaryRecordCard(record)).toList(),
    );
  }

  // 薪资记录卡片
  Widget _buildSalaryRecordCard(dynamic record) {
    final baseSalary = record.getDoubleValue('base_salary') ?? 0.0;
    final bonus = record.getDoubleValue('bonus') ?? 0.0;
    final deduction = record.getDoubleValue('deduction') ?? 0.0;
    final netSalary = baseSalary + bonus - deduction;
    final salaryDate = record.getStringValue('salary_date') ?? '';
    final salaryType = record.getStringValue('salary_type') ?? 'monthly';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
          child: Icon(
            Icons.payment,
            color: AppTheme.primaryColor,
          ),
        ),
        title: Text(
          _formatSalaryDate(salaryDate),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('类型: ${_getSalaryTypeText(salaryType)}'),
            if (bonus > 0) Text('奖金: ¥${bonus.toStringAsFixed(2)}'),
            if (deduction > 0) Text('扣除: ¥${deduction.toStringAsFixed(2)}'),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '¥${netSalary.toStringAsFixed(2)}',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: netSalary > 0 ? Colors.green : Colors.red,
              ),
            ),
            Text(
              '实发工资',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 请假记录列表
  Widget _buildLeaveRecordsList(List<dynamic> records) {
    return Column(
      children: records.map((record) => _buildLeaveRecordCard(record)).toList(),
    );
  }

  // 请假记录卡片
  Widget _buildLeaveRecordCard(dynamic record) {
    final leaveType = record.getStringValue('leave_type') ?? 'unknown';
    final startDate = record.getStringValue('leave_start_date') ?? '';
    final endDate = record.getStringValue('leave_end_date') ?? '';
    final status = record.getStringValue('status') ?? 'pending';
    final reason = record.getStringValue('reason') ?? '';
    
    final statusColor = _getLeaveStatusColor(status);
    final statusText = _getLeaveStatusText(status);
    final leaveDays = _calculateLeaveDays(startDate, endDate);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: statusColor.withOpacity(0.1),
          child: Icon(
            _getLeaveStatusIcon(status),
            color: statusColor,
          ),
        ),
        title: Text(
          _getLeaveTypeText(leaveType),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('时间: ${_formatLeaveDate(startDate)} - ${_formatLeaveDate(endDate)}'),
            Text('天数: $leaveDays 天'),
            if (reason.isNotEmpty) Text('原因: $reason'),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                statusText,
                style: TextStyle(
                  color: statusColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '$leaveDays 天',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 辅助方法
  String _formatSalaryDate(String dateStr) {
    if (dateStr.isEmpty) return '未知日期';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.year}年${date.month}月${date.day}日';
    } catch (e) {
      return dateStr;
    }
  }

  String _getSalaryTypeText(String type) {
    switch (type) {
      case 'monthly': return '月薪';
      case 'hourly': return '时薪';
      case 'bonus': return '奖金';
      case 'overtime': return '加班费';
      default: return '其他';
    }
  }

  String _formatLeaveDate(String dateStr) {
    if (dateStr.isEmpty) return '未知';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.month}/${date.day}';
    } catch (e) {
      return dateStr;
    }
  }

  String _getLeaveTypeText(String type) {
    switch (type) {
      case 'sick': return '病假';
      case 'personal': return '事假';
      case 'annual': return '年假';
      case 'maternity': return '产假';
      case 'paternity': return '陪产假';
      case 'bereavement': return '丧假';
      case 'other': return '其他';
      default: return '未知类型';
    }
  }

  Color _getLeaveStatusColor(String status) {
    switch (status) {
      case 'pending': return Colors.orange;
      case 'approved': return Colors.green;
      case 'rejected': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _getLeaveStatusText(String status) {
    switch (status) {
      case 'pending': return '待审批';
      case 'approved': return '已批准';
      case 'rejected': return '已拒绝';
      default: return '未知';
    }
  }

  IconData _getLeaveStatusIcon(String status) {
    switch (status) {
      case 'pending': return Icons.pending;
      case 'approved': return Icons.check_circle;
      case 'rejected': return Icons.cancel;
      default: return Icons.help;
    }
  }

  int _calculateLeaveDays(String startDate, String endDate) {
    try {
      final start = DateTime.parse(startDate);
      final end = DateTime.parse(endDate);
      return end.difference(start).inDays + 1;
    } catch (e) {
      return 0;
    }
  }
}
