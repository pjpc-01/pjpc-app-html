import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../features/attendance/providers/attendance_provider.dart';
import '../../../features/auth/providers/auth_provider.dart';

class AttendanceRecordsListEnhanced extends StatelessWidget {
  final bool isSmallScreen;
  final String filter;
  final String searchQuery;
  final bool showStudentRecords;
  final bool showTeacherRecords;
  final bool showPersonalRecords;

  const AttendanceRecordsListEnhanced({
    super.key,
    required this.isSmallScreen,
    required this.filter,
    required this.searchQuery,
    this.showStudentRecords = false,
    this.showTeacherRecords = false,
    this.showPersonalRecords = false,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<AttendanceProvider>(
      builder: (context, attendanceProvider, child) {
        return Consumer<AuthProvider>(
          builder: (context, authProvider, child) {
            List<dynamic> records = _getFilteredRecords(attendanceProvider, authProvider);
            
            if (records.isEmpty) {
              return _buildEmptyState();
            }

            return RefreshIndicator(
              onRefresh: () async => _refreshData(attendanceProvider, authProvider),
              color: AppTheme.primaryColor,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: records.length,
                itemBuilder: (context, index) {
                  final record = records[index];
                  return _buildRecordCard(context, record, index);
                },
              ),
            );
          },
        );
      },
    );
  }

  List<dynamic> _getFilteredRecords(AttendanceProvider attendanceProvider, AuthProvider authProvider) {
    List<dynamic> records = [];
    
    if (showStudentRecords) {
      records.addAll(attendanceProvider.attendanceRecords);
    }
    
    if (showTeacherRecords) {
      records.addAll(attendanceProvider.teacherAttendanceRecords);
    }
    
    if (showPersonalRecords) {
      // 只显示当前用户的考勤记录
      final currentUserId = authProvider.user?.id;
      if (currentUserId != null) {
        if (authProvider.isTeacher) {
          // 教师：显示自己的教师考勤记录
          records = attendanceProvider.teacherAttendanceRecords
              .where((record) => record.getStringValue('teacher_id') == currentUserId)
              .toList();
        } else {
          // 学生：显示自己的学生考勤记录
          records = attendanceProvider.attendanceRecords
              .where((record) => record.getStringValue('student_id') == currentUserId)
              .toList();
        }
      }
    }
    
    // 应用搜索过滤
    if (searchQuery.isNotEmpty) {
      records = records.where((record) {
        final name = record.getStringValue('name') ?? '';
        final studentName = record.getStringValue('student_name') ?? '';
        final teacherName = record.getStringValue('teacher_name') ?? '';
        return name.toLowerCase().contains(searchQuery.toLowerCase()) ||
               studentName.toLowerCase().contains(searchQuery.toLowerCase()) ||
               teacherName.toLowerCase().contains(searchQuery.toLowerCase());
      }).toList();
    }
    
    // 应用时间过滤
    records = _applyTimeFilter(records, filter);
    
    return records;
  }

  List<dynamic> _applyTimeFilter(List<dynamic> records, String filter) {
    final now = DateTime.now();
    
    switch (filter) {
      case 'today':
        return records.where((record) {
          final dateStr = record.getStringValue('date') ?? record.getStringValue('attendance_date');
          if (dateStr == null) return false;
          final recordDate = DateTime.tryParse(dateStr);
          if (recordDate == null) return false;
          return recordDate.year == now.year && 
                 recordDate.month == now.month && 
                 recordDate.day == now.day;
        }).toList();
        
      case 'week':
        final weekStart = now.subtract(Duration(days: now.weekday - 1));
        return records.where((record) {
          final dateStr = record.getStringValue('date') ?? record.getStringValue('attendance_date');
          if (dateStr == null) return false;
          final recordDate = DateTime.tryParse(dateStr);
          if (recordDate == null) return false;
          return recordDate.isAfter(weekStart.subtract(const Duration(days: 1))) &&
                 recordDate.isBefore(now.add(const Duration(days: 1)));
        }).toList();
        
      case 'month':
        return records.where((record) {
          final dateStr = record.getStringValue('date') ?? record.getStringValue('attendance_date');
          if (dateStr == null) return false;
          final recordDate = DateTime.tryParse(dateStr);
          if (recordDate == null) return false;
          return recordDate.year == now.year && recordDate.month == now.month;
        }).toList();
        
      case 'year':
        return records.where((record) {
          final dateStr = record.getStringValue('date') ?? record.getStringValue('attendance_date');
          if (dateStr == null) return false;
          final recordDate = DateTime.tryParse(dateStr);
          if (recordDate == null) return false;
          return recordDate.year == now.year;
        }).toList();
        
      default:
        return records;
    }
  }

  Future<void> _refreshData(AttendanceProvider attendanceProvider, AuthProvider authProvider) async {
    if (showStudentRecords) {
      await attendanceProvider.loadAttendanceRecords();
    }
    if (showTeacherRecords) {
      await attendanceProvider.loadTeacherAttendanceRecords();
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
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
            const SizedBox(height: 24),
            Text(
              '暂无考勤记录',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '当前筛选条件下没有找到考勤记录',
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecordCard(BuildContext context, dynamic record, int index) {
    final isStudentRecord = record.getStringValue('student_id') != null;
    final isTeacherRecord = record.getStringValue('teacher_id') != null;
    
    String name = '';
    String role = '';
    String status = record.getStringValue('status') ?? 'unknown';
    String date = record.getStringValue('date') ?? record.getStringValue('attendance_date') ?? '';
    String checkInTime = record.getStringValue('check_in_time') ?? '';
    String checkOutTime = record.getStringValue('check_out_time') ?? '';
    
    if (isStudentRecord) {
      name = record.getStringValue('student_name') ?? '未知学生';
      role = '学生';
    } else if (isTeacherRecord) {
      name = record.getStringValue('teacher_name') ?? '未知教师';
      role = '教师';
    }
    
    Color statusColor = _getStatusColor(status);
    String statusText = _getStatusText(status);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    isStudentRecord ? Icons.school : Icons.person,
                    color: statusColor,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      Text(
                        role,
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    statusText,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(
                  Icons.calendar_today,
                  size: 16,
                  color: AppTheme.textSecondary,
                ),
                const SizedBox(width: 8),
                Text(
                  date,
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(width: 24),
                if (checkInTime.isNotEmpty) ...[
                  Icon(
                    Icons.login,
                    size: 16,
                    color: AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    checkInTime,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
                if (checkOutTime.isNotEmpty) ...[
                  const SizedBox(width: 16),
                  Icon(
                    Icons.logout,
                    size: 16,
                    color: AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    checkOutTime,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'present':
      case 'checked_in':
        return Colors.green;
      case 'absent':
        return Colors.red;
      case 'late':
        return Colors.orange;
      case 'early_leave':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'present':
      case 'checked_in':
        return '已签到';
      case 'absent':
        return '缺勤';
      case 'late':
        return '迟到';
      case 'early_leave':
        return '早退';
      default:
        return '未知';
    }
  }
}
