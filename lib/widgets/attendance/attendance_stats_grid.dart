import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/attendance_provider.dart';
import '../../theme/app_theme.dart';

class AttendanceStatsGrid extends StatelessWidget {
  const AttendanceStatsGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AttendanceProvider>(
      builder: (context, attendanceProvider, child) {
        final stats = _calculateStats(attendanceProvider.attendanceRecords);
        
        return GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 1.1,
          crossAxisSpacing: AppSpacing.sm,
          mainAxisSpacing: AppSpacing.sm,
          children: [
            _buildStatCard(
              title: '今日签到',
              value: stats['todayCheckIns'].toString(),
              change: '+${stats['todayChange']}',
              isPositive: stats['todayChange'] >= 0,
              icon: Icons.check_circle,
              color: AppTheme.successColor,
            ),
            _buildStatCard(
              title: '出勤率',
              value: '${stats['attendanceRate']}%',
              change: '+${stats['rateChange']}%',
              isPositive: stats['rateChange'] >= 0,
              icon: Icons.trending_up,
              color: AppTheme.primaryColor,
            ),
            _buildStatCard(
              title: '迟到人数',
              value: stats['lateCount'].toString(),
              change: '${stats['lateChange'] >= 0 ? '+' : ''}${stats['lateChange']}',
              isPositive: stats['lateChange'] <= 0,
              icon: Icons.schedule,
              color: AppTheme.warningColor,
            ),
            _buildStatCard(
              title: '缺勤人数',
              value: stats['absentCount'].toString(),
              change: '${stats['absentChange'] >= 0 ? '+' : ''}${stats['absentChange']}',
              isPositive: stats['absentChange'] <= 0,
              icon: Icons.person_off,
              color: AppTheme.errorColor,
            ),
          ],
        );
      },
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required String change,
    required bool isPositive,
    required IconData icon,
    required Color color,
  }) {
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
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.xs,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: isPositive 
                      ? AppTheme.successColor.withOpacity(0.1)
                      : AppTheme.errorColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isPositive ? Icons.trending_up : Icons.trending_down,
                      size: 10,
                      color: isPositive ? AppTheme.successColor : AppTheme.errorColor,
                    ),
                    const SizedBox(width: 2),
                    Text(
                      change,
                      style: AppTextStyles.caption.copyWith(
                        color: isPositive ? AppTheme.successColor : AppTheme.errorColor,
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
          Text(
            value,
            style: AppTextStyles.headline4.copyWith(
              color: AppTheme.textPrimary,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
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

  Map<String, dynamic> _calculateStats(List<dynamic> records) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    
    // 处理RecordModel和Map两种类型
    String getValue(dynamic record, String key) {
      if (record is Map<String, dynamic>) {
        return record[key]?.toString() ?? '';
      } else {
        return record.getStringValue(key) ?? '';
      }
    }
    
    // 今日记录
    final todayRecords = records.where((record) {
      final recordDate = DateTime.tryParse(getValue(record, 'date'));
      return recordDate != null && 
             recordDate.year == today.year &&
             recordDate.month == today.month &&
             recordDate.day == today.day;
    }).toList();
    
    // 昨日记录
    final yesterdayRecords = records.where((record) {
      final recordDate = DateTime.tryParse(getValue(record, 'date'));
      return recordDate != null && 
             recordDate.year == yesterday.year &&
             recordDate.month == yesterday.month &&
             recordDate.day == yesterday.day;
    }).toList();
    
    // 计算统计数据
    final todayCheckIns = todayRecords.length;
    final yesterdayCheckIns = yesterdayRecords.length;
    final todayChange = todayCheckIns - yesterdayCheckIns;
    
    // 出勤率计算（假设总学生数为30）
    const totalStudents = 30;
    final attendanceRate = totalStudents > 0 ? (todayCheckIns / totalStudents * 100).round() : 0;
    final yesterdayRate = totalStudents > 0 ? (yesterdayCheckIns / totalStudents * 100).round() : 0;
    final rateChange = attendanceRate - yesterdayRate;
    
    // 迟到和缺勤统计
    final lateCount = todayRecords.where((record) => 
      getValue(record, 'status') == 'late' || getValue(record, 'type') == 'late'
    ).length;
    
    final absentCount = totalStudents - todayCheckIns;
    
    // 昨日对比
    final yesterdayLateCount = yesterdayRecords.where((record) => 
      getValue(record, 'status') == 'late' || getValue(record, 'type') == 'late'
    ).length;
    
    final yesterdayAbsentCount = totalStudents - yesterdayCheckIns;
    
    return {
      'todayCheckIns': todayCheckIns,
      'todayChange': todayChange,
      'attendanceRate': attendanceRate,
      'rateChange': rateChange,
      'lateCount': lateCount,
      'lateChange': lateCount - yesterdayLateCount,
      'absentCount': absentCount,
      'absentChange': absentCount - yesterdayAbsentCount,
    };
  }
}
