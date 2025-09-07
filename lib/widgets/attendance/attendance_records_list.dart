import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

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
              '开始扫描NFC卡片或手动录入考勤',
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
                      onTap: () => _editRecord(record),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    _buildActionButton(
                      icon: Icons.delete_outline,
                      label: '删除',
                      onTap: () => _deleteRecord(record),
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
      case 'manual':
        return '手动签到';
      case 'late':
        return '迟到';
      case 'absent':
        return '缺勤';
      default:
        return '未知类型';
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

  void _editRecord(dynamic record) {
    // 编辑记录
  }

  void _deleteRecord(dynamic record) {
    // 删除记录
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

