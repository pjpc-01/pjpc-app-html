import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class StatisticsCard extends StatelessWidget {
  final String title;
  final String value;
  final String? subtitle;
  final String? change;
  final bool? isPositive;
  final IconData icon;
  final Color color;

  const StatisticsCard({
    super.key,
    required this.title,
    required this.value,
    this.subtitle,
    this.change,
    this.isPositive,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppTheme.dividerColor),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(AppSpacing.xs),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 16,
                ),
              ),
              if (change != null && isPositive != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xs,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: isPositive! 
                        ? AppTheme.successColor.withOpacity(0.1)
                        : AppTheme.errorColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isPositive! ? Icons.trending_up : Icons.trending_down,
                        size: 10,
                        color: isPositive! ? AppTheme.successColor : AppTheme.errorColor,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        change!,
                        style: AppTextStyles.caption.copyWith(
                          color: isPositive! ? AppTheme.successColor : AppTheme.errorColor,
                          fontWeight: FontWeight.w600,
                          fontSize: 9,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: AppTextStyles.headline4.copyWith(
                  color: AppTheme.textPrimary,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(width: 2),
                Text(
                  subtitle!,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppTheme.textSecondary,
                    fontSize: 11,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppTheme.textSecondary,
              fontSize: 11,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
