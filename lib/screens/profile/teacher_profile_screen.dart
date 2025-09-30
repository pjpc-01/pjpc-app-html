import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/attendance/providers/attendance_provider.dart';
import '../../features/finance/providers/teacher_salary_provider.dart';
import '../../features/leave/providers/teacher_leave_provider.dart';
import '../../features/integration/screens/integrated_report_screen.dart';
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
    ProfilePage(
      title: '综合报表',
      icon: Icons.assessment_outlined,
      color: Colors.indigo,
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
      body: Builder(
        builder: (context) {
          try {
            return Consumer<AuthProvider>(
              builder: (context, authProvider, child) {
                // 添加空值检查
                if (authProvider == null) {
                  return const Center(
                    child: CircularProgressIndicator(),
                  );
                }
                
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
            );
          } catch (e) {
            // 错误边界 - 捕获运行时错误
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.red[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '页面加载出错',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '请重新启动应用或联系技术支持',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _selectedIndex = 0;
                      });
                    },
                    child: const Text('重试'),
                  ),
                ],
              ),
            );
          }
        },
      ),
    );
  }

  Widget _buildHeader(dynamic user) {
    // 安全获取用户数据
    String safeGetStringValue(dynamic user, String key) {
      try {
        if (user == null) return '';
        return user.getStringValue(key) ?? '';
      } catch (e) {
        return '';
      }
    }
    
    final userName = safeGetStringValue(user, 'name').isEmpty ? '教师' : safeGetStringValue(user, 'name');
    final userEmail = safeGetStringValue(user, 'email');
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
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: _pages.asMap().entries.map((entry) {
            final index = entry.key;
            final page = entry.value;
            final isSelected = _selectedIndex == index;
            
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                  right: index < _pages.length - 1 ? 8 : 0,
                ),
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedIndex = index;
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                    decoration: BoxDecoration(
                      color: isSelected ? page.color.withOpacity(0.1) : Colors.grey[100],
                      borderRadius: BorderRadius.circular(20),
                      border: isSelected 
                        ? Border.all(color: page.color, width: 2)
                        : null,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          page.icon,
                          size: 16,
                          color: isSelected ? page.color : Colors.grey[600],
                        ),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            page.title,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                              color: isSelected ? page.color : Colors.grey[600],
                            ),
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    ),
                  ),
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
      case 5:
        return _buildIntegratedReportTab();
      default:
        return _buildPersonalInfoTab(user);
    }
  }

  Widget _buildPersonalInfoTab(dynamic user) {
    // 添加安全的用户数据访问
    String safeGetStringValue(dynamic user, String key) {
      try {
        if (user == null) return '';
        return user.getStringValue(key) ?? '';
      } catch (e) {
        return '';
      }
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildInfoCard('基本信息', [
            _buildInfoRow('姓名', safeGetStringValue(user, 'name')),
            _buildInfoRow('邮箱', safeGetStringValue(user, 'email')),
            _buildInfoRow('电话', safeGetStringValue(user, 'phone')),
            _buildInfoRow('角色', '教师'),
            _buildInfoRow('工号', safeGetStringValue(user, 'teacher_id')),
            _buildInfoRow('部门', safeGetStringValue(user, 'department')),
            _buildInfoRow('职位', safeGetStringValue(user, 'position')),
          ]),
          const SizedBox(height: 16),
          _buildInfoCard('NFC信息', [
            _buildInfoRow('NFC卡号', safeGetStringValue(user, 'cardNumber')),
            _buildInfoRow('发卡日期', safeGetStringValue(user, 'nfc_card_issued_date')),
            _buildInfoRow('过期日期', safeGetStringValue(user, 'nfc_card_expiry_date')),
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
                          builder: (context) => const NFCManagementOptimizedV2(),
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
    return Consumer2<AttendanceProvider, AuthProvider>(
      builder: (context, attendanceProvider, authProvider, child) {
        // 添加空值检查
        if (attendanceProvider == null || authProvider == null) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }
        
        if (attendanceProvider.isLoading) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }

        final currentUserId = authProvider.user?.id;
        if (currentUserId == null) {
          return const Center(
            child: Text('无法获取用户信息'),
          );
        }

        // 获取当前教师的考勤记录
        final attendanceRecords = attendanceProvider.teacherAttendanceRecords
            .where((record) => record.getStringValue('teacher_id') == currentUserId)
            .toList();

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 考勤统计卡片
              _buildAttendanceStatsCard(attendanceRecords),
              const SizedBox(height: 16),
              // 考勤记录列表
              _buildAttendanceRecordsList(attendanceRecords),
              const SizedBox(height: 16),
              // 查看全部按钮
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const AttendanceManagementScreen(),
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
                    '查看全部考勤记录',
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

  Widget _buildMySalaryTab() {
    return Consumer2<TeacherSalaryProvider, AuthProvider>(
      builder: (context, salaryProvider, authProvider, child) {
        // 添加空值检查
        if (salaryProvider == null || authProvider == null) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }
        
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

        // 检查是否有薪资记录
        final salaryRecords = salaryProvider.salaryRecords;
        if (salaryRecords.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
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
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Text(
                    '您还没有薪资记录。\n\n薪资记录将由管理员创建和管理。',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _loadData,
                  child: const Text('刷新'),
                ),
              ],
            ),
          );
        }
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
        // 添加空值检查
        if (leaveProvider == null || authProvider == null) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }
        
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

        // 检查是否有请假记录
        final leaveRecords = leaveProvider.leaveRecords;
        if (leaveRecords.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
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
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Text(
                    '您还没有请假记录。\n\n如需申请请假，请联系管理员。',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _loadData,
                  child: const Text('刷新'),
                ),
              ],
            ),
          );
        }
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

  Widget _buildIntegratedReportTab() {
    return const IntegratedReportScreen();
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

  // 考勤统计卡片
  Widget _buildAttendanceStatsCard(List<dynamic> records) {
    // 计算统计数据
    final today = DateTime.now();
    final todayRecords = records.where((record) {
      final recordDate = DateTime.tryParse(record.getStringValue('date') ?? '');
      if (recordDate == null) return false;
      return recordDate.year == today.year && 
             recordDate.month == today.month && 
             recordDate.day == today.day;
    }).toList();

    final thisWeekRecords = records.where((record) {
      final recordDate = DateTime.tryParse(record.getStringValue('date') ?? '');
      if (recordDate == null) return false;
      final weekStart = today.subtract(Duration(days: today.weekday - 1));
      final weekEnd = weekStart.add(const Duration(days: 6));
      return recordDate.isAfter(weekStart.subtract(const Duration(days: 1))) && 
             recordDate.isBefore(weekEnd.add(const Duration(days: 1)));
    }).toList();

    final totalRecords = records.length;
    final todayCount = todayRecords.length;
    final weekCount = thisWeekRecords.length;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.access_time,
                  color: AppTheme.primaryColor,
                  size: 24,
                ),
                const SizedBox(width: 8),
                Text(
                  '考勤统计',
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
                  child: _buildAttendanceStatItem('今日打卡', todayCount.toString(), Colors.blue),
                ),
                Expanded(
                  child: _buildAttendanceStatItem('本周打卡', weekCount.toString(), Colors.green),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildAttendanceStatItem('总记录数', totalRecords.toString(), AppTheme.primaryColor),
                ),
                Expanded(
                  child: _buildAttendanceStatItem('出勤率', '${totalRecords > 0 ? ((weekCount / 7) * 100).toInt() : 0}%', Colors.orange),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttendanceStatItem(String label, String value, Color color) {
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
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  // 考勤记录列表
  Widget _buildAttendanceRecordsList(List<dynamic> records) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '最近考勤记录',
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
                    '暂无考勤记录',
                    style: TextStyle(
                      color: Colors.grey,
                      fontSize: 14,
                    ),
                  ),
                ),
              )
            else
              ...records.take(10).map((record) => _buildAttendanceRecordItem(record)),
          ],
        ),
      ),
    );
  }

  Widget _buildAttendanceRecordItem(dynamic record) {
    final date = record.getStringValue('date') ?? '';
    final checkInTime = record.getStringValue('check_in_time') ?? '';
    final checkOutTime = record.getStringValue('check_out_time') ?? '';
    final status = record.getStringValue('status') ?? 'present';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(
            _getAttendanceIcon(status),
            color: _getAttendanceColor(status),
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _formatDate(date),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (checkInTime.isNotEmpty || checkOutTime.isNotEmpty)
                  Text(
                    '${checkInTime.isNotEmpty ? '上班: $checkInTime' : ''}${checkInTime.isNotEmpty && checkOutTime.isNotEmpty ? ' | ' : ''}${checkOutTime.isNotEmpty ? '下班: $checkOutTime' : ''}',
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
              color: _getAttendanceColor(status).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              _getAttendanceStatusText(status),
              style: TextStyle(
                fontSize: 12,
                color: _getAttendanceColor(status),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _getAttendanceIcon(String status) {
    switch (status.toLowerCase()) {
      case 'present':
        return Icons.check_circle;
      case 'late':
        return Icons.schedule;
      case 'absent':
        return Icons.cancel;
      case 'half_day':
        return Icons.hourglass_empty;
      default:
        return Icons.help;
    }
  }

  Color _getAttendanceColor(String status) {
    switch (status.toLowerCase()) {
      case 'present':
        return Colors.green;
      case 'late':
        return Colors.orange;
      case 'absent':
        return Colors.red;
      case 'half_day':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  String _getAttendanceStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'present':
        return '正常';
      case 'late':
        return '迟到';
      case 'absent':
        return '缺勤';
      case 'half_day':
        return '半天';
      default:
        return '未知';
    }
  }

  String _formatDate(String? dateString) {
    if (dateString == null || dateString.isEmpty) return '';
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
