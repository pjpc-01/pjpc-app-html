import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class AttendanceExceptionItem extends StatelessWidget {
  final String name;
  final String type;
  final String date;
  final String time;
  final String status;
  final String? reason;
  final VoidCallback? onTap;

  const AttendanceExceptionItem({
    Key? key,
    required this.name,
    required this.type,
    required this.date,
    required this.time,
    required this.status,
    this.reason,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppTheme.dividerColor),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: _getStatusColor().withOpacity(0.1),
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
          child: Icon(
            _getStatusIcon(),
            color: _getStatusColor(),
            size: 20,
          ),
        ),
        title: Text(
          name,
          style: AppTextStyles.bodyLarge.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 2),
            Text(
              '$type • $date $time',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
            if (reason != null) ...[
              const SizedBox(height: 2),
              Text(
                reason!,
                style: AppTextStyles.caption.copyWith(
                  color: AppTheme.textTertiary,
                ),
              ),
            ],
          ],
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xs,
            vertical: 2,
          ),
          decoration: BoxDecoration(
            color: _getStatusColor().withOpacity(0.1),
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
          child: Text(
            _getStatusText(),
            style: AppTextStyles.caption.copyWith(
              color: _getStatusColor(),
              fontWeight: FontWeight.w600,
              fontSize: 10,
            ),
          ),
        ),
        onTap: onTap,
      ),
    );
  }

  Color _getStatusColor() {
    switch (status.toLowerCase()) {
      case 'late':
        return AppTheme.warningColor;
      case 'absent':
        return AppTheme.errorColor;
      case 'early_leave':
        return AppTheme.errorColor;
      default:
        return AppTheme.textSecondary;
    }
  }

  IconData _getStatusIcon() {
    switch (status.toLowerCase()) {
      case 'late':
        return Icons.schedule;
      case 'absent':
        return Icons.person_off;
      case 'early_leave':
        return Icons.exit_to_app;
      default:
        return Icons.info;
    }
  }

  String _getStatusText() {
    switch (status.toLowerCase()) {
      case 'late':
        return '迟到';
      case 'absent':
        return '缺勤';
      case 'early_leave':
        return '早退';
      default:
        return status;
    }
  }
}
