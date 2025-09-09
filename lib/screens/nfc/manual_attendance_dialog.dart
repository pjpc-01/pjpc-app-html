import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/attendance_provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';

class ManualAttendanceDialog extends StatefulWidget {
  final dynamic student;

  const ManualAttendanceDialog({
    super.key,
    this.student,
  });

  @override
  State<ManualAttendanceDialog> createState() => _ManualAttendanceDialogState();
}

class _ManualAttendanceDialogState extends State<ManualAttendanceDialog> {
  dynamic _selectedStudent;
  String _selectedAction = 'check_in';
  final _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _selectedStudent = widget.student;
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('手动考勤记录'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // 学生选择
            if (widget.student == null) ...[
              const Text(
                '选择学生',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Consumer<StudentProvider>(
                builder: (context, studentProvider, child) {
                  return DropdownButtonFormField<dynamic>(
                    value: _selectedStudent,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    hint: const Text('请选择学生'),
                    items: studentProvider.students.map((student) {
                      final name = student.getStringValue('student_name') ?? '未知学生';
                      final studentId = student.getStringValue('student_id') ?? '';
                      return DropdownMenuItem(
                        value: student,
                        child: Text('$name ($studentId)'),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedStudent = value;
                      });
                    },
                    validator: (value) {
                      if (value == null) {
                        return '请选择学生';
                      }
                      return null;
                    },
                  );
                },
              ),
              const SizedBox(height: 16),
            ],

            // 考勤操作选择
            const Text(
              '考勤操作',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: RadioListTile<String>(
                    title: const Text('签到'),
                    value: 'check_in',
                    groupValue: _selectedAction,
                    onChanged: (value) {
                      setState(() {
                        _selectedAction = value!;
                      });
                    },
                    activeColor: AppTheme.successColor,
                  ),
                ),
                Expanded(
                  child: RadioListTile<String>(
                    title: const Text('签退'),
                    value: 'check_out',
                    groupValue: _selectedAction,
                    onChanged: (value) {
                      setState(() {
                        _selectedAction = value!;
                      });
                    },
                    activeColor: AppTheme.errorColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // 备注
            const Text(
              '备注',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _notesController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: '请输入备注信息（可选）',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('取消'),
        ),
        ElevatedButton(
          onPressed: _submitAttendance,
          child: const Text('记录考勤'),
        ),
      ],
    );
  }

  void _submitAttendance() async {
    if (_selectedStudent == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('请选择学生'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    try {
      final now = DateTime.now();
      final today = now.toIso8601String().split('T')[0];
      final timeString = now.toIso8601String().split('T')[1].split('.')[0];

      final studentId = _selectedStudent.id;
      final studentName = _selectedStudent.getStringValue('student_name') ?? '未知学生';
      final center = _selectedStudent.getStringValue('center') ?? '';
      final branchName = _selectedStudent.getStringValue('branch_name') ?? '总校';

      // 检查今天的考勤状态
      final todayAttendance = attendanceProvider.attendanceRecords
          .where((record) => 
              record.getStringValue('student_id') == studentId &&
              record.getStringValue('date') == today)
          .toList();

      if (_selectedAction == 'check_in') {
        // 签到操作
        if (todayAttendance.isNotEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$studentName 今天已经签到过了'),
              backgroundColor: AppTheme.warningColor,
            ),
          );
          return;
        }

        // 创建签到记录
        final attendanceData = {
          'student_id': studentId,
          'student_name': studentName,
          'center': center,
          'branch_name': branchName,
          'check_in': timeString,
          'check_out': '',
          'status': 'present',
          'notes': _notesController.text.isNotEmpty ? _notesController.text : '手动签到',
          'teacher_id': authProvider.user?.id ?? '',
          'method': 'Manual',
          'date': today,
        };

        await attendanceProvider.createAttendanceRecord(attendanceData);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$studentName 签到成功'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      } else {
        // 签退操作
        if (todayAttendance.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$studentName 请先签到再签退'),
              backgroundColor: AppTheme.warningColor,
            ),
          );
          return;
        }

        final existingRecord = todayAttendance.first;
        if (existingRecord.getStringValue('check_out')?.isNotEmpty == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$studentName 今天已经签退过了'),
              backgroundColor: AppTheme.warningColor,
            ),
          );
          return;
        }

        // 更新签退记录
        final updateData = {
          'check_out': timeString,
          'notes': _notesController.text.isNotEmpty ? _notesController.text : '手动签退',
        };

        await attendanceProvider.updateAttendanceRecord(existingRecord.id, updateData);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$studentName 签退成功'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }

      Navigator.of(context).pop();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('记录考勤失败: $e'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }
}
