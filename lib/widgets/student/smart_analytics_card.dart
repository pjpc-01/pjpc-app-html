import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class SmartAnalyticsCard extends StatelessWidget {
  final String title;
  final List<AnalyticsItem> items;
  final VoidCallback? onTap;

  const SmartAnalyticsCard({
    super.key,
    required this.title,
    required this.items,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.analytics,
                    color: AppTheme.primaryColor,
                    size: 20,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    title,
                    style: AppTextStyles.headline6.copyWith(
                      color: AppTheme.primaryColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  if (onTap != null)
                    Icon(
                      Icons.arrow_forward_ios,
                      size: 16,
                      color: AppTheme.textTertiary,
                    ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              ...items.map((item) => _buildAnalyticsItem(item)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAnalyticsItem(AnalyticsItem item) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: item.color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              item.label,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
          ),
          Text(
            item.value,
            style: AppTextStyles.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
              color: item.color,
            ),
          ),
          if (item.trend != null) ...[
            const SizedBox(width: AppSpacing.xs),
            Icon(
              item.trend! > 0 ? Icons.trending_up : Icons.trending_down,
              size: 14,
              color: item.trend! > 0 ? AppTheme.successColor : AppTheme.errorColor,
            ),
            Text(
              '${item.trend!.abs()}%',
              style: AppTextStyles.caption.copyWith(
                color: item.trend! > 0 ? AppTheme.successColor : AppTheme.errorColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class AnalyticsItem {
  final String label;
  final String value;
  final Color color;
  final double? trend;

  const AnalyticsItem({
    required this.label,
    required this.value,
    required this.color,
    this.trend,
  });
}
