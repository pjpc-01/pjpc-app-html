import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class RecentActivityItem extends StatelessWidget {
  final String studentName;
  final String action;
  final String time;
  final String status; // 'success', 'warning', 'error'

  const RecentActivityItem({
    super.key,
    required this.studentName,
    required this.action,
    required this.time,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      child: Row(
        children: [
          _buildStatusIndicator(),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  studentName,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  action,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Text(
            time,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppTheme.textTertiary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusIndicator() {
    Color color;
    IconData icon;
    
    switch (status) {
      case 'success':
        color = AppTheme.successColor;
        icon = Icons.check_circle;
        break;
      case 'warning':
        color = AppTheme.warningColor;
        icon = Icons.warning;
        break;
      case 'error':
        color = AppTheme.errorColor;
        icon = Icons.error;
        break;
      default:
        color = AppTheme.textTertiary;
        icon = Icons.info;
    }

    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
      ),
    );
  }
}

