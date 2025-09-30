import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class AttendanceChartWidget extends StatelessWidget {
  final String title;
  final List<Map<String, dynamic>> data;
  final String? subtitle;

  const AttendanceChartWidget({
    Key? key,
    required this.title,
    required this.data,
    this.subtitle,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppTheme.dividerColor),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.headline5,
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      subtitle!,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ],
              ),
              IconButton(
                onPressed: () {
                  // TODO: 实现图表详情页面
                },
                icon: const Icon(
                  Icons.more_horiz,
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          if (data.isEmpty)
            Container(
              height: 200,
              decoration: BoxDecoration(
                color: AppTheme.backgroundColor,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.bar_chart,
                      size: 48,
                      color: AppTheme.textTertiary,
                    ),
                    SizedBox(height: 8),
                    Text(
                      '暂无数据',
                      style: AppTextStyles.bodyMedium,
                    ),
                  ],
                ),
              ),
            )
          else
            Container(
              height: 200,
              decoration: BoxDecoration(
                color: AppTheme.backgroundColor,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: _buildSimpleChart(),
            ),
        ],
      ),
    );
  }

  Widget _buildSimpleChart() {
    if (data.isEmpty) return const SizedBox.shrink();

    final maxValue = data.map((e) => e['value'] as num).reduce((a, b) => a > b ? a : b);
    
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        children: [
          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: data.map((item) {
                final value = item['value'] as num;
                final height = maxValue > 0 ? (value / maxValue) * 120 : 0.0;
                
                return Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Container(
                      width: 30,
                      height: height,
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withOpacity(0.7),
                        borderRadius: BorderRadius.circular(AppRadius.xs),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item['label'] ?? '',
                      style: AppTextStyles.caption.copyWith(
                        fontSize: 10,
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: data.map((item) {
              return Text(
                '${item['value']}',
                style: AppTextStyles.caption.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
