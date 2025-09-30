import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../providers/schedule_provider.dart';
import '../models/schedule_model.dart';
import 'add_edit_schedule_screen.dart';
import 'schedule_template_management_screen.dart';

class ScheduleManagementScreen extends StatefulWidget {
  const ScheduleManagementScreen({super.key});

  @override
  State<ScheduleManagementScreen> createState() => _ScheduleManagementScreenState();
}

class _ScheduleManagementScreenState extends State<ScheduleManagementScreen> {
  String? _selectedTeacherId;
  String? _selectedStatus;
  String? _selectedScheduleType;
  DateTime? _selectedDate;

  @override
  void initState() {
    super.initState();
    _loadSchedules();
  }

  Future<void> _loadSchedules() async {
    await Provider.of<ScheduleProvider>(context, listen: false).loadSchedules(
      teacherId: _selectedTeacherId,
      status: _selectedStatus,
      scheduleType: _selectedScheduleType,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('排班管理'),
        actions: [
          IconButton(
            icon: const Icon(Icons.schedule),
            onPressed: () => _navigateToTemplateManagement(context),
            tooltip: '排班模板',
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _navigateToAddEditSchedule(context),
            tooltip: '添加排班',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadSchedules,
            tooltip: '刷新',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildFilterSection(),
          Expanded(
            child: Consumer<ScheduleProvider>(
              builder: (context, scheduleProvider, child) {
                if (scheduleProvider.isLoading) {
                  return const LoadingWidget();
                }

                if (scheduleProvider.error != null) {
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
                          '加载失败',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey[800],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          scheduleProvider.error!,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadSchedules,
                          child: const Text('重试'),
                        ),
                      ],
                    ),
                  );
                }

                final schedules = scheduleProvider.schedules;

                if (schedules.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.schedule,
                          size: 64,
                          color: Colors.grey,
                        ),
                        SizedBox(height: 16),
                        Text(
                          '暂无排班记录',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          '点击右上角的 + 按钮添加排班',
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
                  itemCount: schedules.length,
                  itemBuilder: (context, index) {
                    final schedule = schedules[index];
                    return _buildScheduleCard(schedule, scheduleProvider);
                  },
                );
              },
            ),
          ),
        ],
      ),
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
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _selectedStatus,
                  decoration: const InputDecoration(
                    labelText: '状态',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: const [
                    DropdownMenuItem(value: null, child: Text('全部状态')),
                    DropdownMenuItem(value: 'scheduled', child: Text('已排班')),
                    DropdownMenuItem(value: 'confirmed', child: Text('已确认')),
                    DropdownMenuItem(value: 'in_progress', child: Text('进行中')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _selectedStatus = value;
                    });
                    _loadSchedules();
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _selectedScheduleType,
                  decoration: const InputDecoration(
                    labelText: '类型',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: const [
                    DropdownMenuItem(value: null, child: Text('全部类型')),
                    DropdownMenuItem(value: 'fulltime', child: Text('全职')),
                    DropdownMenuItem(value: 'parttime', child: Text('兼职')),
                    DropdownMenuItem(value: 'teaching_only', child: Text('仅教学')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _selectedScheduleType = value;
                    });
                    _loadSchedules();
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildScheduleCard(ScheduleModel schedule, ScheduleProvider scheduleProvider) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    schedule.teacherName ?? '未知教师',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
                _buildStatusChip(schedule.status),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.access_time, size: 18, color: AppTheme.textSecondary),
                const SizedBox(width: 8),
                Text(
                  '${schedule.date.toLocal().toString().split(' ')[0]} ${schedule.shiftDisplayName}',
                  style: TextStyle(fontSize: 15, color: AppTheme.textSecondary),
                ),
              ],
            ),
            if (schedule.center != null && schedule.center!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Row(
                  children: [
                    const Icon(Icons.location_on, size: 18, color: AppTheme.textSecondary),
                    const SizedBox(width: 8),
                    Text(
                      schedule.center!,
                      style: TextStyle(fontSize: 15, color: AppTheme.textSecondary),
                    ),
                  ],
                ),
              ),
            if (schedule.room != null && schedule.room!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Row(
                  children: [
                    const Icon(Icons.room, size: 18, color: AppTheme.textSecondary),
                    const SizedBox(width: 8),
                    Text(
                      schedule.room!,
                      style: TextStyle(fontSize: 15, color: AppTheme.textSecondary),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 8),
            Row(
              children: [
                _buildTypeChip(schedule.scheduleType),
                const Spacer(),
                if (schedule.hourlyRate != null)
                  Text(
                    'RM ${schedule.hourlyRate!.toStringAsFixed(2)}/小时',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.accentColor,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  icon: const Icon(Icons.edit, color: AppTheme.accentColor),
                  onPressed: () => _navigateToAddEditSchedule(context, schedule: schedule),
                ),
                IconButton(
                  icon: const Icon(Icons.delete, color: AppTheme.errorColor),
                  onPressed: () => _confirmDeleteSchedule(context, schedule, scheduleProvider),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    String text;
    
    switch (status) {
      case 'scheduled':
        color = Colors.orange;
        text = '已排班';
        break;
      case 'confirmed':
        color = Colors.blue;
        text = '已确认';
        break;
      case 'in_progress':
        color = Colors.green;
        text = '进行中';
        break;
      default:
        color = Colors.grey;
        text = status;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }

  Widget _buildTypeChip(String type) {
    Color color;
    String text;
    
    switch (type) {
      case 'fulltime':
        color = Colors.blue;
        text = '全职';
        break;
      case 'parttime':
        color = Colors.green;
        text = '兼职';
        break;
      case 'teaching_only':
        color = Colors.purple;
        text = '仅教学';
        break;
      default:
        color = Colors.grey;
        text = type;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }

  void _navigateToTemplateManagement(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const ScheduleTemplateManagementScreen(),
      ),
    );
  }

  void _navigateToAddEditSchedule(BuildContext context, {ScheduleModel? schedule}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditScheduleScreen(schedule: schedule),
      ),
    ).then((_) => _loadSchedules());
  }

  Future<void> _confirmDeleteSchedule(
      BuildContext context, ScheduleModel schedule, ScheduleProvider scheduleProvider) async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('删除排班记录'),
        content: Text('确定要删除 ${schedule.teacherName} 的排班记录吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.errorColor),
            child: const Text('删除'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final success = await scheduleProvider.deleteSchedule(schedule.id);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('排班记录删除成功'), backgroundColor: Colors.green),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(scheduleProvider.error ?? '删除失败'), backgroundColor: Colors.red),
        );
      }
    }
  }
}