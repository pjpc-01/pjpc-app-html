import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/attendance_provider.dart';
import '../../theme/app_theme.dart';
import '../nfc/nfc_management_screen.dart';
import '../attendance/attendance_records_screen.dart';

class TeacherProfileScreen extends StatefulWidget {
  const TeacherProfileScreen({super.key});

  @override
  State<TeacherProfileScreen> createState() => _TeacherProfileScreenState();
}

class _TeacherProfileScreenState extends State<TeacherProfileScreen> 
    with TickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = false;
  String _selectedFilter = 'all'; // all, today, week, month, year

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
      
      // 加载教师考勤记录
      await Provider.of<AttendanceProvider>(context, listen: false).loadTeacherAttendanceRecords();
      
    } catch (e) {
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
            _buildInfoRow('NFC卡号', user.getStringValue('nfc_card_number') ?? ''),
            _buildInfoRow('发卡日期', user.getStringValue('nfc_card_issued_date') ?? ''),
            _buildInfoRow('过期日期', user.getStringValue('nfc_card_expiry_date') ?? ''),
          ]),
        ],
      ),
    );
  }

  Widget _buildAttendanceTab() {
    return Consumer2<AttendanceProvider, AuthProvider>(
      builder: (context, attendanceProvider, authProvider, child) {
        try {
          final allRecords = attendanceProvider.teacherAttendanceRecords;
          final currentUser = authProvider.user;
          final currentUserId = currentUser?.id;
          
        
        // 过滤出当前用户的考勤记录
        final records = allRecords.where((record) {
          // 尝试多种可能的字段名
          final recordTeacherId = record.getStringValue('teacher_id') ?? 
                                 record.getStringValue('teacher_user_id') ?? 
                                 record.getStringValue('teacher') ??
                                 record.getStringValue('user_id') ??
                                 record.getStringValue('teacher_name');
          
          // 也检查记录中是否有当前用户的姓名匹配
          final recordTeacherName = record.getStringValue('teacher_name');
          final currentUserName = currentUser?.getStringValue('name');
          
          return recordTeacherId == currentUserId || 
                 recordTeacherName == currentUserName ||
                 recordTeacherId == currentUserName;
        }).toList();
        
        // 调试信息
        if (allRecords.isNotEmpty) {
          try {
            final firstRecord = allRecords.first;
          } catch (e) {
          }
        }
        
        // 如果没有记录，显示创建测试记录的按钮
        if (records.isEmpty && allRecords.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.access_time_outlined,
                  size: 64,
                  color: Colors.grey,
                ),
                const SizedBox(height: 16),
                const Text(
                  '暂无考勤记录',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
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
        
        if (_isLoading) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }

        if (records.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
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
                    fontSize: 16,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '请使用NFC卡进行签到/签退',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          );
        }

        final filteredRecords = _getFilteredRecords(records);
        
        return Column(
          children: [
            // 筛选器区域
            Container(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildFilterChip('all', '全部'),
                      _buildFilterChip('today', '今天'),
                      _buildFilterChip('week', '本周'),
                      _buildFilterChip('month', '本月'),
                      _buildFilterChip('year', '今年'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '显示 ${filteredRecords.length} 条记录',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            // 考勤记录列表
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: filteredRecords.length,
                itemBuilder: (context, index) {
            // 安全检查：确保索引在有效范围内
            if (index >= filteredRecords.length) {
              return const SizedBox.shrink();
            }
            
            final record = filteredRecords[index];
            final checkIn = record.getStringValue('check_in');
            final checkOut = record.getStringValue('check_out');
            final status = record.getStringValue('status') ?? 'present';
            final date = record.getStringValue('date');
            
            // 调试信息
            
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
            
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: iconColor.withOpacity(0.1),
                  child: Icon(
                    iconData,
                    color: iconColor,
                  ),
                ),
                title: Text(
                  displayType,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _formatDate(date),
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: checkIn != null && checkIn.isNotEmpty 
                                  ? Colors.green.withOpacity(0.1)
                                  : Colors.grey.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              checkIn != null && checkIn.isNotEmpty
                                  ? '签到: ${_formatTime(checkIn)}'
                                  : '签到: 未记录',
                              style: TextStyle(
                                color: checkIn != null && checkIn.isNotEmpty 
                                    ? Colors.green[700]
                                    : Colors.grey[600],
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: checkOut != null && checkOut.isNotEmpty 
                                  ? Colors.orange.withOpacity(0.1)
                                  : Colors.grey.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              checkOut != null && checkOut.isNotEmpty
                                  ? '签退: ${_formatTime(checkOut)}'
                                  : '签退: 未记录',
                              style: TextStyle(
                                color: checkOut != null && checkOut.isNotEmpty 
                                    ? Colors.orange[700]
                                    : Colors.grey[600],
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (record.getStringValue('notes')?.isNotEmpty == true) ...[
                      const SizedBox(height: 8),
                      Text(
                        '备注: ${record.getStringValue('notes')}',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ],
                ),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      status,
                      style: TextStyle(
                        color: _getStatusColor(status),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (checkIn != null || checkOut != null)
                      Text(
                        _formatTime(checkIn ?? checkOut!),
                        style: TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 10,
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
            ),
          ],
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
                    builder: (context) => const NfcManagementScreen(
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
}
