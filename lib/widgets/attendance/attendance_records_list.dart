import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/app_theme.dart';
import '../../providers/attendance_provider.dart';

class AttendanceRecordsList extends StatelessWidget {
  final List<dynamic> records;
  final VoidCallback onRefresh;

  const AttendanceRecordsList({
    super.key,
    required this.records,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (records.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      color: AppTheme.primaryColor,
      child: ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.lg),
        itemCount: records.length,
        itemBuilder: (context, index) {
          final record = records[index];
          return _buildRecordCard(context, record, index);
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.xl),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.access_time,
                size: 64,
                color: AppTheme.primaryColor.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              '暂无考勤记录',
              style: AppTextStyles.headline5.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              '开始扫描NFC卡片进行考勤',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppTheme.textTertiary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.lg),
            ElevatedButton.icon(
              onPressed: onRefresh,
              icon: const Icon(Icons.refresh),
              label: const Text('刷新'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecordCard(BuildContext context, dynamic record, int index) {
    // 处理RecordModel和Map两种类型
    String getValue(String key) {
      if (record is Map<String, dynamic>) {
        return record[key]?.toString() ?? '';
      } else {
        // 假设是RecordModel类型
        return record.getStringValue(key) ?? '';
      }
    }
    
    final studentName = getValue('student_name').isEmpty ? '未知学生' : getValue('student_name');
    final checkInTime = getValue('check_in_time').isEmpty ? '--' : getValue('check_in_time');
    final status = getValue('status').isEmpty ? 'unknown' : getValue('status');
    final type = getValue('type').isEmpty ? 'check_in' : getValue('type');
    final notes = getValue('notes');
    final date = getValue('date');

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppTheme.dividerColor),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _showRecordDetails(context, record),
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _buildStatusIndicator(status),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            studentName,
                            style: AppTextStyles.bodyLarge.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            _getTypeText(type),
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    _buildTimeInfo(checkInTime, date),
                  ],
                ),
                if (notes.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.sm),
                    decoration: BoxDecoration(
                      color: AppTheme.backgroundColor,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.note,
                          size: 16,
                          color: AppTheme.textTertiary,
                        ),
                        const SizedBox(width: AppSpacing.xs),
                        Expanded(
                          child: Text(
                            notes,
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    _buildActionButton(
                      icon: Icons.edit,
                      label: '编辑',
                      onTap: () => _editRecord(context, record),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    _buildActionButton(
                      icon: Icons.delete_outline,
                      label: '删除',
                      onTap: () => _deleteRecord(context, record),
                      isDestructive: true,
                    ),
                    const Spacer(),
                    _buildQuickActionChip(record),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusIndicator(String status) {
    Color color;
    IconData icon;
    
    switch (status.toLowerCase()) {
      case 'present':
        color = AppTheme.successColor;
        icon = Icons.check_circle;
        break;
      case 'late':
        color = AppTheme.warningColor;
        icon = Icons.schedule;
        break;
      case 'absent':
        color = AppTheme.errorColor;
        icon = Icons.person_off;
        break;
      default:
        color = AppTheme.textTertiary;
        icon = Icons.help_outline;
    }

    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(
        icon,
        color: color,
        size: 20,
      ),
    );
  }

  Widget _buildTimeInfo(String checkInTime, String date) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(
          checkInTime,
          style: AppTextStyles.bodyLarge.copyWith(
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          _formatDate(date),
          style: AppTextStyles.bodySmall.copyWith(
            color: AppTheme.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.sm),
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          color: isDestructive 
              ? AppTheme.errorColor.withOpacity(0.1)
              : AppTheme.primaryColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(AppRadius.sm),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isDestructive ? AppTheme.errorColor : AppTheme.primaryColor,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: AppTextStyles.caption.copyWith(
                color: isDestructive ? AppTheme.errorColor : AppTheme.primaryColor,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionChip(dynamic record) {
    // 处理RecordModel和Map两种类型
    String getValue(String key) {
      if (record is Map<String, dynamic>) {
        return record[key]?.toString() ?? '';
      } else {
        return record.getStringValue(key) ?? '';
      }
    }
    
    final status = getValue('status').isEmpty ? 'unknown' : getValue('status');
    
    if (status == 'present') {
      return Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          color: AppTheme.successColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(AppRadius.sm),
        ),
        child: Text(
          '已签到',
          style: AppTextStyles.caption.copyWith(
            color: AppTheme.successColor,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
    }
    
    return const SizedBox.shrink();
  }

  String _getTypeText(String type) {
    switch (type.toLowerCase()) {
      case 'check_in':
        return 'NFC签到';
      case 'late':
        return '迟到';
      case 'absent':
        return '缺勤';
      default:
        return 'NFC签到';
    }
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final recordDate = DateTime(date.year, date.month, date.day);
      
      if (recordDate == today) {
        return '今天';
      } else if (recordDate == today.subtract(const Duration(days: 1))) {
        return '昨天';
      } else {
        return '${date.month}月${date.day}日';
      }
    } catch (e) {
      return dateString;
    }
  }

  void _showRecordDetails(BuildContext context, dynamic record) {
    // 处理RecordModel和Map两种类型
    String getValue(String key) {
      if (record is Map<String, dynamic>) {
        return record[key]?.toString() ?? '';
      } else {
        return record.getStringValue(key) ?? '';
      }
    }
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(getValue('student_name').isEmpty ? '考勤记录' : getValue('student_name')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetailRow('学生姓名', getValue('student_name').isEmpty ? '--' : getValue('student_name')),
            _buildDetailRow('签到时间', getValue('check_in_time').isEmpty ? '--' : getValue('check_in_time')),
            _buildDetailRow('签退时间', getValue('check_out_time').isEmpty ? '--' : getValue('check_out_time')),
            _buildDetailRow('状态', getValue('status').isEmpty ? '--' : getValue('status')),
            _buildDetailRow('类型', getValue('type').isEmpty ? '--' : getValue('type')),
            _buildDetailRow('日期', getValue('date').isEmpty ? '--' : getValue('date')),
            if (getValue('notes').isNotEmpty)
              _buildDetailRow('备注', getValue('notes')),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('关闭'),
          ),
        ],
      ),
    );
  }

  void _editRecord(BuildContext context, dynamic record) {
    // 处理RecordModel和Map两种类型
    String getValue(String key) {
      if (record is Map<String, dynamic>) {
        return record[key]?.toString() ?? '';
      } else {
        return record.getStringValue(key) ?? '';
      }
    }
    
    final studentName = getValue('student_name');
    final type = getValue('type');
    final date = getValue('date');
    final checkInTime = getValue('check_in_time');
    final checkOutTime = getValue('check_out_time');
    final notes = getValue('notes');

    final dateController = TextEditingController(text: date);
    final timeController = TextEditingController(text: type == 'check_in' ? checkInTime : checkOutTime);
    final notesController = TextEditingController(text: notes);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('编辑${type == 'check_in' ? '签到' : '签退'}记录'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('学生: $studentName'),
              const SizedBox(height: 16),
              TextField(
                controller: dateController,
                decoration: const InputDecoration(
                  labelText: '日期',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.calendar_today),
                ),
                readOnly: true,
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: DateTime.tryParse(dateController.text) ?? DateTime.now(),
                    firstDate: DateTime(2020),
                    lastDate: DateTime.now(),
                  );
                  if (date != null) {
                    dateController.text = date.toIso8601String().split('T')[0];
                  }
                },
              ),
              const SizedBox(height: 16),
              TextField(
                controller: timeController,
                decoration: const InputDecoration(
                  labelText: '时间',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.access_time),
                ),
                readOnly: true,
                onTap: () async {
                  final time = await showTimePicker(
                    context: context,
                    initialTime: TimeOfDay.fromDateTime(
                      DateTime.tryParse('2023-01-01 ${timeController.text}') ?? DateTime.now(),
                    ),
                  );
                  if (time != null) {
                    timeController.text = '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
                  }
                },
              ),
              const SizedBox(height: 16),
              TextField(
                controller: notesController,
                decoration: const InputDecoration(
                  labelText: '备注',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.note),
                ),
                maxLines: 3,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () async {
              // 验证输入
              if (dateController.text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('请选择日期'),
                    backgroundColor: Color(0xFFEF4444),
                  ),
                );
                return;
              }
              
              if (timeController.text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('请选择时间'),
                    backgroundColor: Color(0xFFEF4444),
                  ),
                );
                return;
              }
              
              Navigator.pop(context);
              await _updateRecord(context, record, dateController.text, timeController.text, notesController.text);
            },
            child: const Text('保存'),
          ),
        ],
      ),
    );
  }

  void _deleteRecord(BuildContext context, dynamic record) {
    // 处理RecordModel和Map两种类型
    String getValue(String key) {
      if (record is Map<String, dynamic>) {
        return record[key]?.toString() ?? '';
      } else {
        return record.getStringValue(key) ?? '';
      }
    }
    
    final studentName = getValue('student_name');
    final type = getValue('type');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认删除'),
        content: Text('确定要删除 $studentName 的${type == 'check_in' ? '签到' : '签退'}记录吗？\n\n此操作无法撤销。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _performDelete(context, record);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
            ),
            child: const Text('删除'),
          ),
        ],
      ),
    );
  }

  Future<void> _updateRecord(BuildContext context, dynamic record, String date, String time, String notes) async {
    final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
    
    // 处理RecordModel和Map两种类型
    String getValue(String key) {
      if (record is Map<String, dynamic>) {
        return record[key]?.toString() ?? '';
      } else {
        return record.getStringValue(key) ?? '';
      }
    }
    
    final type = getValue('type');
    final studentName = getValue('student_name');
    final recordId = record is Map<String, dynamic> ? record['id'] : record.id;
    
    // 显示加载状态
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(),
      ),
    );
    
    try {
      final updateData = {
        'date': date,
        'notes': notes,
      };

      if (type == 'check_in') {
        updateData['check_in_time'] = time;
      } else {
        updateData['check_out_time'] = time;
      }

      final success = await attendanceProvider.updateAttendanceRecord(recordId, updateData);
      
      // 关闭加载对话框
      if (context.mounted) Navigator.pop(context);
      
      if (success) {
        // 刷新记录列表
        await attendanceProvider.loadAttendanceRecords();
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$studentName 的${type == 'check_in' ? '签到' : '签退'}记录更新成功'),
              backgroundColor: const Color(0xFF10B981),
              duration: const Duration(seconds: 3),
            ),
          );
        }
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('更新失败: ${attendanceProvider.error ?? '未知错误'}'),
              backgroundColor: const Color(0xFFEF4444),
              duration: const Duration(seconds: 5),
            ),
          );
        }
      }
    } catch (e) {
      // 关闭加载对话框
      if (context.mounted) Navigator.pop(context);
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('更新失败: ${e.toString()}'),
            backgroundColor: const Color(0xFFEF4444),
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  Future<void> _performDelete(BuildContext context, dynamic record) async {
    final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
    
    // 处理RecordModel和Map两种类型
    String getValue(String key) {
      if (record is Map<String, dynamic>) {
        return record[key]?.toString() ?? '';
      } else {
        return record.getStringValue(key) ?? '';
      }
    }
    
    final studentName = getValue('student_name');
    final type = getValue('type');
    final recordId = record is Map<String, dynamic> ? record['id'] : record.id;

    // 显示加载状态
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(),
      ),
    );

    try {
      final success = await attendanceProvider.deleteAttendanceRecord(recordId);
      
      // 关闭加载对话框
      if (context.mounted) Navigator.pop(context);
      
      if (success) {
        // 刷新记录列表
        await attendanceProvider.loadAttendanceRecords();
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$studentName 的${type == 'check_in' ? '签到' : '签退'}记录已删除'),
              backgroundColor: const Color(0xFF10B981),
              duration: const Duration(seconds: 3),
            ),
          );
        }
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('删除失败: ${attendanceProvider.error ?? '未知错误'}'),
              backgroundColor: const Color(0xFFEF4444),
              duration: const Duration(seconds: 5),
            ),
          );
        }
      }
    } catch (e) {
      // 关闭加载对话框
      if (context.mounted) Navigator.pop(context);
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('删除失败: ${e.toString()}'),
            backgroundColor: const Color(0xFFEF4444),
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: AppTextStyles.bodyMedium.copyWith(
                fontWeight: FontWeight.w500,
                color: AppTheme.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppTheme.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

