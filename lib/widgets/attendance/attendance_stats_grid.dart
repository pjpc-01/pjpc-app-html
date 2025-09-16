import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/attendance_provider.dart';
import '../../providers/student_provider.dart';
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
              onTap: () => _showAbsentStudentsDialog(context, stats['absentStudents']),
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
    VoidCallback? onTap,
  }) {
    Widget cardContent = Container(
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

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: cardContent,
      );
    }
    
    return cardContent;
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
    
    // 获取已签到的学生ID列表
    final checkedInStudentIds = todayRecords.map((record) => 
      getValue(record, 'student_id')
    ).toSet();
    
    // 获取未签到学生列表（这里需要从StudentProvider获取所有学生）
    final absentStudents = <Map<String, dynamic>>[];
    
    return {
      'todayCheckIns': todayCheckIns,
      'todayChange': todayChange,
      'attendanceRate': attendanceRate,
      'rateChange': rateChange,
      'lateCount': lateCount,
      'lateChange': lateCount - yesterdayLateCount,
      'absentCount': absentCount,
      'absentChange': absentCount - yesterdayAbsentCount,
      'absentStudents': absentStudents,
      'checkedInStudentIds': checkedInStudentIds,
    };
  }

  void _showAbsentStudentsDialog(BuildContext context, List<Map<String, dynamic>> absentStudents) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Consumer<StudentProvider>(
          builder: (context, studentProvider, child) {
            // 获取所有学生
            final allStudents = studentProvider.getFilteredStudentsByRole();
            
            // 调试：打印学生数据
            print('=== 学生数据调试 ===');
            print('总学生数: ${allStudents.length}');
            if (allStudents.isNotEmpty) {
              final firstStudent = allStudents.first;
              print('第一个学生数据:');
              print('- ID: ${firstStudent.id}');
              print('- student_name: ${firstStudent.getStringValue('student_name')}');
              print('- student_id: ${firstStudent.getStringValue('student_id')}');
              print('- standard: ${firstStudent.getStringValue('standard')}');
              print('- center: ${firstStudent.getStringValue('center')}');
              print('- status: ${firstStudent.getStringValue('status')}');
              print('- teacher_id: ${firstStudent.getStringValue('teacher_id')}');
              print('- branch_name: ${firstStudent.getStringValue('branch_name')}');
              print('- 所有字段: ${firstStudent.data.keys.toList()}');
            }
            
            // 获取今日已签到的学生ID
            final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
            final todayRecords = attendanceProvider.getTodaysAttendance();
            final checkedInStudentIds = todayRecords.map((record) => 
              record.getStringValue('student_id')
            ).toSet();
            
            // 找出未签到的学生
            final absentStudents = allStudents.where((student) {
              final studentId = student.getStringValue('student_id') ?? student.id;
              return !checkedInStudentIds.contains(studentId);
            }).toList();
            
            return AlertDialog(
              title: Row(
                children: [
                  Icon(
                    Icons.person_off,
                    color: AppTheme.errorColor,
                    size: 24,
                  ),
                  const SizedBox(width: 8),
                  const Text('未签到学生'),
                ],
              ),
              content: SizedBox(
                width: double.maxFinite,
                height: 400,
                child: absentStudents.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.check_circle,
                              size: 48,
                              color: Colors.green,
                            ),
                            SizedBox(height: 16),
                            Text(
                              '所有学生都已签到',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        itemCount: absentStudents.length,
                        itemBuilder: (context, index) {
                          final student = absentStudents[index];
                          final studentName = student.getStringValue('student_name') ?? '未知学生';
                          final studentId = student.getStringValue('student_id') ?? '';
                          final standard = student.getStringValue('standard') ?? '';
                          final center = student.getStringValue('center') ?? '';
                          final status = student.getStringValue('status') ?? '';
                          final teacherId = student.getStringValue('teacher_id') ?? '';
                          final branchName = student.getStringValue('branch_name') ?? '';
                          
                          // 调试：打印每个学生的详细信息
                          print('学生 $index: $studentName');
                          print('  - center: "$center"');
                          print('  - status: "$status"');
                          print('  - teacher_id: "$teacherId"');
                          print('  - branch_name: "$branchName"');
                          
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.backgroundColor,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.dividerColor),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: AppTheme.errorColor.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Icon(
                                    Icons.person_off,
                                    color: AppTheme.errorColor,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        studentName,
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      if (studentId.isNotEmpty) ...[
                                        const SizedBox(height: 2),
                                        Text(
                                          '学号: $studentId',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: AppTheme.textSecondary,
                                          ),
                                        ),
                                      ],
                                      if (standard.isNotEmpty) ...[
                                        const SizedBox(height: 2),
                                        Text(
                                          '班级: $standard',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: AppTheme.textSecondary,
                                          ),
                                        ),
                                      ],
                                      if (center.isNotEmpty) ...[
                                        const SizedBox(height: 2),
                                        Text(
                                          '中心: $center',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: AppTheme.textSecondary,
                                          ),
                                        ),
                                      ],
                                      if (status.isNotEmpty) ...[
                                        const SizedBox(height: 2),
                                        Text(
                                          '状态: $status',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: AppTheme.textSecondary,
                                          ),
                                        ),
                                      ],
                                      if (teacherId.isNotEmpty) ...[
                                        const SizedBox(height: 2),
                                        Text(
                                          '教师ID: $teacherId',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: AppTheme.textSecondary,
                                          ),
                                        ),
                                      ],
                                      if (branchName.isNotEmpty) ...[
                                        const SizedBox(height: 2),
                                        Text(
                                          '分校: $branchName',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: AppTheme.textSecondary,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppTheme.errorColor.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    '未签到',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: AppTheme.errorColor,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('关闭'),
                ),
              ],
            );
          },
        );
      },
    );
  }
}
