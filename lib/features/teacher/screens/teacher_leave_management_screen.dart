import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../leave/providers/teacher_leave_provider.dart';
import '../../teacher/providers/teacher_provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/services/permission_manager.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/loading_widget.dart';
import 'add_edit_leave_record_screen.dart';

class TeacherLeaveManagementScreen extends StatefulWidget {
  const TeacherLeaveManagementScreen({super.key});

  @override
  State<TeacherLeaveManagementScreen> createState() => _TeacherLeaveManagementScreenState();
}

class _TeacherLeaveManagementScreenState extends State<TeacherLeaveManagementScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  String _selectedTeacherId = '';
  String _selectedStatus = '';
  DateTime? _startDate;
  DateTime? _endDate;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final leaveProvider = context.read<TeacherLeaveProvider>();
    final teacherProvider = context.read<TeacherProvider>();
    final authProvider = context.read<AuthProvider>();
    
    // 根据用户角色加载数据
    if (authProvider.isAdmin) {
      // 管理员：加载所有教师和请假数据
      await teacherProvider.loadTeachers();
      await leaveProvider.loadLeaveRecords();
      await leaveProvider.loadLeaveBalances();
      await leaveProvider.loadLeaveStats();
    } else {
      // 教师：只加载自己的数据
      final currentUserId = authProvider.user?.id;
      if (currentUserId != null) {
        await leaveProvider.loadLeaveRecords(teacherId: currentUserId);
        await leaveProvider.loadLeaveBalances(teacherId: currentUserId);
        await leaveProvider.loadLeaveStats(teacherId: currentUserId);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        // 检查权限 - 管理员和教师都可以访问请假管理
        if (!PermissionManager.canAccessFeature('teacher_leave_management', authProvider) && 
            !PermissionManager.canAccessFeature('my_leave_records', authProvider)) {
          return Scaffold(
            backgroundColor: AppTheme.backgroundColor,
            appBar: AppBar(title: const Text('教师请假管理')),
            body: const Center(
              child: Text(
                '您没有权限访问此功能',
                style: TextStyle(fontSize: 16, color: Colors.red),
              ),
            ),
          );
        }

        return Scaffold(
          backgroundColor: AppTheme.backgroundColor,
          appBar: AppBar(
            title: Text(authProvider.isAdmin ? '教师请假管理' : '我的请假'),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: _loadData,
              ),
            ],
          ),
          body: Column(
            children: [
              _buildFilterSection(),
              _buildTabBar(),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildLeaveRecordsTab(),
                    _buildLeaveBalancesTab(),
                    _buildLeaveStatsTab(),
                  ],
                ),
              ),
            ],
          ),
          floatingActionButton: _buildFloatingActionButton(authProvider),
        );
      },
    );
  }

  Widget _buildFilterSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 3,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        children: [
          // 搜索栏
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: '搜索教师姓名或工号',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _searchQuery = '';
                        });
                      },
                    )
                  : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              filled: true,
              fillColor: Colors.grey[100],
            ),
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
              });
            },
          ),
          const SizedBox(height: 12),
          // 筛选选项 - 只有管理员才显示教师选择器
          Consumer<AuthProvider>(
            builder: (context, authProvider, child) {
              if (authProvider.isAdmin) {
                return Row(
                  children: [
                    Expanded(
                      child: Consumer<TeacherProvider>(
                        builder: (context, teacherProvider, child) {
                          return DropdownButtonFormField<String>(
                            value: _selectedTeacherId.isEmpty ? null : _selectedTeacherId,
                            decoration: const InputDecoration(
                              labelText: '选择教师',
                              border: OutlineInputBorder(),
                              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            ),
                            items: [
                              const DropdownMenuItem<String>(
                                value: '',
                                child: Text('所有教师'),
                              ),
                              ...teacherProvider.teachers.map((teacher) {
                                return DropdownMenuItem<String>(
                                  value: teacher.id,
                                  child: Text(teacher.getStringValue('name') ?? '未知'),
                                );
                              }),
                            ],
                            onChanged: (value) {
                              setState(() {
                                _selectedTeacherId = value ?? '';
                              });
                              _applyFilters();
                            },
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedStatus.isEmpty ? null : _selectedStatus,
                        decoration: const InputDecoration(
                          labelText: '请假状态',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        items: const [
                          DropdownMenuItem<String>(
                            value: '',
                            child: Text('所有状态'),
                          ),
                          DropdownMenuItem<String>(
                            value: 'pending',
                            child: Text('待审批'),
                          ),
                          DropdownMenuItem<String>(
                            value: 'approved',
                            child: Text('已批准'),
                          ),
                          DropdownMenuItem<String>(
                            value: 'rejected',
                            child: Text('已拒绝'),
                          ),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _selectedStatus = value ?? '';
                          });
                          _applyFilters();
                        },
                      ),
                    ),
                  ],
                );
              } else {
                // 教师：只显示状态和日期选择器
                return Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _selectedStatus.isEmpty ? null : _selectedStatus,
                            decoration: const InputDecoration(
                              labelText: '请假状态',
                              border: OutlineInputBorder(),
                              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            ),
                            items: const [
                              DropdownMenuItem<String>(
                                value: '',
                                child: Text('所有状态'),
                              ),
                              DropdownMenuItem<String>(
                                value: 'pending',
                                child: Text('待审批'),
                              ),
                              DropdownMenuItem<String>(
                                value: 'approved',
                                child: Text('已批准'),
                              ),
                              DropdownMenuItem<String>(
                                value: 'rejected',
                                child: Text('已拒绝'),
                              ),
                            ],
                            onChanged: (value) {
                              setState(() {
                                _selectedStatus = value ?? '';
                              });
                              _applyFilters();
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // 日期范围选择
                    TextButton.icon(
                      onPressed: _selectDateRange,
                      icon: const Icon(Icons.date_range),
                      label: Text(_startDate == null
                          ? '选择日期范围'
                          : '${_startDate!.toLocal().toString().split(' ')[0]} - ${_endDate!.toLocal().toString().split(' ')[0]}'),
                    ),
                  ],
                );
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      color: Colors.white,
      child: TabBar(
        controller: _tabController,
        labelColor: AppTheme.primaryColor,
        unselectedLabelColor: Colors.grey,
        indicatorColor: AppTheme.primaryColor,
        tabs: const [
          Tab(text: '请假记录', icon: Icon(Icons.event_note)),
          Tab(text: '请假余额', icon: Icon(Icons.account_balance)),
          Tab(text: '统计报表', icon: Icon(Icons.analytics)),
        ],
      ),
    );
  }

  Widget _buildLeaveRecordsTab() {
    return Consumer<TeacherLeaveProvider>(
      builder: (context, leaveProvider, child) {
        if (leaveProvider.isLoading) {
          return const LoadingWidget();
        }

        if (leaveProvider.error != null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('错误: ${leaveProvider.error!}'),
                ElevatedButton(
                  onPressed: _loadData,
                  child: const Text('重试'),
                ),
              ],
            ),
          );
        }

        final records = _filterLeaveRecords(leaveProvider.leaveRecords);

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: records.length,
          itemBuilder: (context, index) {
            final record = records[index];
            return _buildLeaveRecordCard(record);
          },
        );
      },
    );
  }

  Widget _buildLeaveBalancesTab() {
    return Consumer<TeacherLeaveProvider>(
      builder: (context, leaveProvider, child) {
        if (leaveProvider.isLoading) {
          return const LoadingWidget();
        }

        if (leaveProvider.error != null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('错误: ${leaveProvider.error!}'),
                ElevatedButton(
                  onPressed: _loadData,
                  child: const Text('重试'),
                ),
              ],
            ),
          );
        }

        final balances = _filterLeaveBalances(leaveProvider.leaveBalances);

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: balances.length,
          itemBuilder: (context, index) {
            final balance = balances[index];
            return _buildLeaveBalanceCard(balance);
          },
        );
      },
    );
  }

  Widget _buildLeaveStatsTab() {
    return Consumer<TeacherLeaveProvider>(
      builder: (context, leaveProvider, child) {
        if (leaveProvider.isLoading) {
          return const LoadingWidget();
        }

        if (leaveProvider.error != null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('错误: ${leaveProvider.error!}'),
                ElevatedButton(
                  onPressed: _loadData,
                  child: const Text('重试'),
                ),
              ],
            ),
          );
        }

        final stats = leaveProvider.leaveStats;
        final summary = leaveProvider.getLeaveSummary();

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildStatsCard('请假统计', stats),
              const SizedBox(height: 16),
              _buildSummaryCard('请假汇总', summary),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLeaveRecordCard(RecordModel record) {
    final teacherName = record.getStringValue('teacher_name') ?? '未知教师';
    final leaveType = record.getStringValue('leave_type') ?? '未知类型';
    final startDate = record.getStringValue('leave_start_date') ?? '';
    final endDate = record.getStringValue('leave_end_date') ?? '';
    final status = record.getStringValue('status') ?? 'pending';
    final reason = record.getStringValue('reason') ?? '';
    
    final statusColor = _getStatusColor(status);
    final statusText = _getStatusText(status);
    
    final leaveDays = _calculateLeaveDays(startDate, endDate);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: statusColor.withOpacity(0.1),
          child: Icon(
            _getStatusIcon(status),
            color: statusColor,
          ),
        ),
        title: Text(
          teacherName,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('请假类型: $leaveType'),
            Text('请假时间: $startDate 至 $endDate'),
            Text('请假天数: $leaveDays 天'),
            if (reason.isNotEmpty) Text('请假原因: $reason'),
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
        onTap: () => _editLeaveRecord(record),
      ),
    );
  }

  Widget _buildLeaveBalanceCard(RecordModel balance) {
    final teacherName = balance.getStringValue('teacher_name') ?? '未知教师';
    final leaveType = balance.getStringValue('leave_type') ?? '未知类型';
    final totalDays = balance.getIntValue('total_days') ?? 0;
    final usedDays = balance.getIntValue('used_days') ?? 0;
    final availableDays = totalDays - usedDays;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppTheme.secondaryColor.withOpacity(0.1),
          child: Icon(
            Icons.account_balance,
            color: AppTheme.secondaryColor,
          ),
        ),
        title: Text(
          teacherName,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text('请假类型: $leaveType'),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '$availableDays 天',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: availableDays > 0 ? Colors.green : Colors.red,
              ),
            ),
            Text(
              '剩余天数',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
            Text(
              '已用: $usedDays/$totalDays',
              style: TextStyle(
                fontSize: 10,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsCard(String title, Map<String, dynamic> stats) {
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
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    '总请假数',
                    '${stats['total_leaves'] ?? 0}',
                    Icons.event_note,
                    Colors.blue,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    '待审批',
                    '${stats['pending_leaves'] ?? 0}',
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
                  child: _buildStatItem(
                    '已批准',
                    '${stats['approved_leaves'] ?? 0}',
                    Icons.check_circle,
                    Colors.green,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    '已拒绝',
                    '${stats['rejected_leaves'] ?? 0}',
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

  Widget _buildSummaryCard(String title, Map<String, int> summary) {
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
              ),
            ),
            const SizedBox(height: 16),
            _buildSummaryItem('总请假数', summary['total_leaves'] ?? 0),
            _buildSummaryItem('待审批', summary['pending_leaves'] ?? 0),
            _buildSummaryItem('已批准', summary['approved_leaves'] ?? 0),
            _buildSummaryItem('已拒绝', summary['rejected_leaves'] ?? 0),
            const Divider(),
            _buildSummaryItem(
              '总请假天数',
              summary['total_leave_days'] ?? 0,
              isTotal: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 8),
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
    );
  }

  Widget _buildSummaryItem(String label, int value, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            '$value',
            style: TextStyle(
              fontSize: isTotal ? 18 : 14,
              fontWeight: FontWeight.bold,
              color: isTotal ? AppTheme.primaryColor : Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  List<RecordModel> _filterLeaveRecords(List<RecordModel> records) {
    var filtered = records;

    if (_selectedTeacherId.isNotEmpty) {
      filtered = filtered.where((r) => r.getStringValue('teacher_id') == _selectedTeacherId).toList();
    }

    if (_selectedStatus.isNotEmpty) {
      filtered = filtered.where((r) => r.getStringValue('status') == _selectedStatus).toList();
    }

    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((r) {
        final teacherName = r.getStringValue('teacher_name') ?? '';
        return teacherName.toLowerCase().contains(_searchQuery.toLowerCase());
      }).toList();
    }

    return filtered;
  }

  List<RecordModel> _filterLeaveBalances(List<RecordModel> balances) {
    var filtered = balances;

    if (_selectedTeacherId.isNotEmpty) {
      filtered = filtered.where((b) => b.getStringValue('teacher_id') == _selectedTeacherId).toList();
    }

    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((b) {
        final teacherName = b.getStringValue('teacher_name') ?? '';
        return teacherName.toLowerCase().contains(_searchQuery.toLowerCase());
      }).toList();
    }

    return filtered;
  }

  void _applyFilters() {
    final leaveProvider = context.read<TeacherLeaveProvider>();
    leaveProvider.loadLeaveRecords(
      teacherId: _selectedTeacherId.isEmpty ? null : _selectedTeacherId,
      status: _selectedStatus.isEmpty ? null : _selectedStatus,
      startDate: _startDate,
      endDate: _endDate,
    );
  }

  Future<void> _selectDateRange() async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: _startDate != null && _endDate != null
          ? DateTimeRange(start: _startDate!, end: _endDate!)
          : null,
    );

    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
      _applyFilters();
    }
  }

  Widget _buildFloatingActionButton(AuthProvider authProvider) {
    // 检查是否有创建权限 - 管理员和教师都可以创建请假记录
    if (!PermissionManager.canPerformAction('create_leave_record', authProvider)) {
      return const SizedBox.shrink();
    }

    return FloatingActionButton(
      onPressed: _addLeaveRecord,
      backgroundColor: AppTheme.primaryColor,
      child: const Icon(Icons.add, color: Colors.white),
    );
  }

  void _addLeaveRecord() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AddEditLeaveRecordScreen(),
      ),
    ).then((_) => _loadData());
  }

  void _editLeaveRecord(RecordModel record) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditLeaveRecordScreen(record: record),
      ),
    ).then((_) => _loadData());
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'approved':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'pending':
        return '待审批';
      case 'approved':
        return '已批准';
      case 'rejected':
        return '已拒绝';
      default:
        return '未知';
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'pending':
        return Icons.pending;
      case 'approved':
        return Icons.check_circle;
      case 'rejected':
        return Icons.cancel;
      default:
        return Icons.help;
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
