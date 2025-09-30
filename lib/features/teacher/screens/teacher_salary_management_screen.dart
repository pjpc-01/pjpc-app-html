import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../finance/providers/teacher_salary_provider.dart';
import '../../teacher/providers/teacher_provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/services/permission_manager.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/loading_widget.dart';
import 'add_edit_salary_record_screen.dart';
import 'add_edit_salary_structure_screen.dart';

class TeacherSalaryManagementScreen extends StatefulWidget {
  const TeacherSalaryManagementScreen({super.key});

  @override
  State<TeacherSalaryManagementScreen> createState() => _TeacherSalaryManagementScreenState();
}

class _TeacherSalaryManagementScreenState extends State<TeacherSalaryManagementScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  String _selectedTeacherId = '';
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
    final salaryProvider = context.read<TeacherSalaryProvider>();
    final teacherProvider = context.read<TeacherProvider>();
    final authProvider = context.read<AuthProvider>();
    
    // 根据用户角色加载数据
    if (authProvider.isAdmin) {
      // 管理员：加载所有教师和薪资数据
      await teacherProvider.loadTeachers();
      await salaryProvider.loadSalaryRecords();
      await salaryProvider.loadSalaryStructures();
      await salaryProvider.loadSalaryStats();
    } else {
      // 教师：只加载自己的数据
      final currentUserId = authProvider.user?.id;
      if (currentUserId != null) {
        await salaryProvider.loadSalaryRecords(teacherId: currentUserId);
        await salaryProvider.loadSalaryStructures(teacherId: currentUserId);
        await salaryProvider.loadSalaryStats(teacherId: currentUserId);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        // 检查权限 - 管理员可以管理所有薪资，教师只能查看自己的薪资
        if (!PermissionManager.canAccessFeature('teacher_salary_management', authProvider) && 
            !PermissionManager.canAccessFeature('my_salary_records', authProvider)) {
          return Scaffold(
            backgroundColor: AppTheme.backgroundColor,
            appBar: AppBar(title: const Text('教师薪资管理')),
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
            title: Text(authProvider.isAdmin ? '教师薪资管理' : '我的薪资'),
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
                    _buildSalaryRecordsTab(),
                    _buildSalaryStructuresTab(),
                    _buildSalaryStatsTab(),
                  ],
                ),
              ),
            ],
          ),
          floatingActionButton: _buildFloatingActionButton(),
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
                      child: TextButton.icon(
                        onPressed: _selectDateRange,
                        icon: const Icon(Icons.date_range),
                        label: Text(_startDate == null
                            ? '选择日期范围'
                            : '${_startDate!.toLocal().toString().split(' ')[0]} - ${_endDate!.toLocal().toString().split(' ')[0]}'),
                      ),
                    ),
                  ],
                );
              } else {
                // 教师：只显示日期选择器
                return Row(
                  children: [
                    Expanded(
                      child: TextButton.icon(
                        onPressed: _selectDateRange,
                        icon: const Icon(Icons.date_range),
                        label: Text(_startDate == null
                            ? '选择日期范围'
                            : '${_startDate!.toLocal().toString().split(' ')[0]} - ${_endDate!.toLocal().toString().split(' ')[0]}'),
                      ),
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
          Tab(text: '薪资记录', icon: Icon(Icons.payment)),
          Tab(text: '薪资结构', icon: Icon(Icons.account_balance_wallet)),
          Tab(text: '统计报表', icon: Icon(Icons.analytics)),
        ],
      ),
    );
  }

  Widget _buildSalaryRecordsTab() {
    return Consumer<TeacherSalaryProvider>(
      builder: (context, salaryProvider, child) {
        if (salaryProvider.isLoading) {
          return const LoadingWidget();
        }

        if (salaryProvider.error != null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('错误: ${salaryProvider.error!}'),
                ElevatedButton(
                  onPressed: _loadData,
                  child: const Text('重试'),
                ),
              ],
            ),
          );
        }

        final records = _filterSalaryRecords(salaryProvider.salaryRecords);

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: records.length,
          itemBuilder: (context, index) {
            final record = records[index];
            return _buildSalaryRecordCard(record);
          },
        );
      },
    );
  }

  Widget _buildSalaryStructuresTab() {
    return Consumer<TeacherSalaryProvider>(
      builder: (context, salaryProvider, child) {
        if (salaryProvider.isLoading) {
          return const LoadingWidget();
        }

        if (salaryProvider.error != null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('错误: ${salaryProvider.error!}'),
                ElevatedButton(
                  onPressed: _loadData,
                  child: const Text('重试'),
                ),
              ],
            ),
          );
        }

        final structures = _filterSalaryStructures(salaryProvider.salaryStructures);

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: structures.length,
          itemBuilder: (context, index) {
            final structure = structures[index];
            return _buildSalaryStructureCard(structure);
          },
        );
      },
    );
  }

  Widget _buildSalaryStatsTab() {
    return Consumer<TeacherSalaryProvider>(
      builder: (context, salaryProvider, child) {
        if (salaryProvider.isLoading) {
          return const LoadingWidget();
        }

        if (salaryProvider.error != null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('错误: ${salaryProvider.error!}'),
                ElevatedButton(
                  onPressed: _loadData,
                  child: const Text('重试'),
                ),
              ],
            ),
          );
        }

        final stats = salaryProvider.salaryStats;
        final summary = salaryProvider.getSalarySummary();

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildStatsCard('薪资统计', stats),
              const SizedBox(height: 16),
              _buildSummaryCard('薪资汇总', summary),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSalaryRecordCard(RecordModel record) {
    final baseSalary = record.getDoubleValue('base_salary') ?? 0.0;
    final bonus = record.getDoubleValue('bonus') ?? 0.0;
    final deduction = record.getDoubleValue('deduction') ?? 0.0;
    final netSalary = baseSalary + bonus - deduction;
    final salaryDate = record.getStringValue('salary_date') ?? '';
    final teacherName = record.getStringValue('teacher_name') ?? '未知教师';

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
          teacherName,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('薪资日期: $salaryDate'),
            Text('基本工资: ¥${baseSalary.toStringAsFixed(2)}'),
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
                fontSize: 18,
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
        onTap: () => _editSalaryRecord(record),
      ),
    );
  }

  Widget _buildSalaryStructureCard(RecordModel structure) {
    final teacherName = structure.getStringValue('teacher_name') ?? '未知教师';
    final baseSalary = structure.getDoubleValue('base_salary') ?? 0.0;
    final position = structure.getStringValue('position') ?? '未知职位';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppTheme.secondaryColor.withOpacity(0.1),
          child: Icon(
            Icons.account_balance_wallet,
            color: AppTheme.secondaryColor,
          ),
        ),
        title: Text(
          teacherName,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text('职位: $position'),
        trailing: Text(
          '¥${baseSalary.toStringAsFixed(2)}',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.green,
          ),
        ),
        onTap: () => _editSalaryStructure(structure),
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
                    '总记录数',
                    '${stats['total_records'] ?? 0}',
                    Icons.list,
                    Colors.blue,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    '总薪资',
                    '¥${(stats['total_salary'] ?? 0.0).toStringAsFixed(2)}',
                    Icons.attach_money,
                    Colors.green,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    '总奖金',
                    '¥${(stats['total_bonus'] ?? 0.0).toStringAsFixed(2)}',
                    Icons.card_giftcard,
                    Colors.orange,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    '总扣除',
                    '¥${(stats['total_deduction'] ?? 0.0).toStringAsFixed(2)}',
                    Icons.remove_circle,
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

  Widget _buildSummaryCard(String title, Map<String, double> summary) {
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
            _buildSummaryItem('基本工资', summary['total_salary'] ?? 0.0),
            _buildSummaryItem('奖金', summary['total_bonus'] ?? 0.0),
            _buildSummaryItem('扣除', summary['total_deduction'] ?? 0.0),
            const Divider(),
            _buildSummaryItem(
              '实发工资',
              summary['net_salary'] ?? 0.0,
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

  Widget _buildSummaryItem(String label, double value, {bool isTotal = false}) {
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
            '¥${value.toStringAsFixed(2)}',
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

  Widget _buildFloatingActionButton() {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        // 检查是否有创建权限 - 管理员可以创建，教师不能创建
        bool canCreate = false;
        if (_tabController.index == 0) {
          canCreate = PermissionManager.canPerformAction('create_salary_record', authProvider);
        } else if (_tabController.index == 1) {
          canCreate = PermissionManager.canPerformAction('create_salary_record', authProvider);
        }

        if (!canCreate) {
          return const SizedBox.shrink();
        }

        return FloatingActionButton(
          onPressed: () {
            if (_tabController.index == 0) {
              _addSalaryRecord();
            } else if (_tabController.index == 1) {
              _addSalaryStructure();
            }
          },
          backgroundColor: AppTheme.primaryColor,
          child: const Icon(Icons.add, color: Colors.white),
        );
      },
    );
  }

  List<RecordModel> _filterSalaryRecords(List<RecordModel> records) {
    var filtered = records;

    if (_selectedTeacherId.isNotEmpty) {
      filtered = filtered.where((r) => r.getStringValue('teacher_id') == _selectedTeacherId).toList();
    }

    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((r) {
        final teacherName = r.getStringValue('teacher_name') ?? '';
        return teacherName.toLowerCase().contains(_searchQuery.toLowerCase());
      }).toList();
    }

    return filtered;
  }

  List<RecordModel> _filterSalaryStructures(List<RecordModel> structures) {
    var filtered = structures;

    if (_selectedTeacherId.isNotEmpty) {
      filtered = filtered.where((s) => s.getStringValue('teacher_id') == _selectedTeacherId).toList();
    }

    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((s) {
        final teacherName = s.getStringValue('teacher_name') ?? '';
        return teacherName.toLowerCase().contains(_searchQuery.toLowerCase());
      }).toList();
    }

    return filtered;
  }

  void _applyFilters() {
    final salaryProvider = context.read<TeacherSalaryProvider>();
    salaryProvider.loadSalaryRecords(
      teacherId: _selectedTeacherId.isEmpty ? null : _selectedTeacherId,
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

  void _addSalaryRecord() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AddEditSalaryRecordScreen(),
      ),
    ).then((_) => _loadData());
  }

  void _editSalaryRecord(RecordModel record) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditSalaryRecordScreen(record: record),
      ),
    ).then((_) => _loadData());
  }

  void _addSalaryStructure() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AddEditSalaryStructureScreen(),
      ),
    ).then((_) => _loadData());
  }

  void _editSalaryStructure(RecordModel structure) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditSalaryStructureScreen(structure: structure),
      ),
    ).then((_) => _loadData());
  }
}
