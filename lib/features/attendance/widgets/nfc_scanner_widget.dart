import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import 'dart:convert';
import 'dart:typed_data';
import '../../../features/attendance/providers/attendance_provider.dart';
import '../../../shared/services/pocketbase_service.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/services/nfc_safe_scanner_service.dart';

class NFCScannerWidget extends StatefulWidget {
  const NFCScannerWidget({super.key});

  @override
  State<NFCScannerWidget> createState() => _NFCScannerWidgetState();
}

class _NFCScannerWidgetState extends State<NFCScannerWidget>
    with TickerProviderStateMixin {
  bool _isScanning = false;
  String _statusMessage = '准备扫描';
  late AnimationController _pulseController;
  late AnimationController _scanController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _scanAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _scanController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _scanAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _scanController,
      curve: Curves.easeInOut,
    ));

    // 自动开始扫描
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startScan();
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _scanController.dispose();
    super.dispose();
  }

  Future<void> _startScan() async {
    if (_isScanning) return;

    setState(() {
      _isScanning = true;
      _statusMessage = '正在扫描NFC卡...';
    });

    _pulseController.repeat(reverse: true);
    _scanController.repeat();

    try {
      final result = await NFCSafeScannerService.instance.safeScanNFC(
        timeout: const Duration(seconds: 10),
        requireStudent: false,
        requireTeacher: false,
      );

      if (result.isSuccess && (result.student != null || result.teacher != null)) {
        if (result.student != null) {
          await _handleSuccessfulStudentScan(result.student!);
        } else if (result.teacher != null) {
          await _handleSuccessfulTeacherScan(result.teacher!);
        }
      } else {
        setState(() {
          _statusMessage = result.errorMessage ?? '扫描失败';
        });
      }
    } catch (e) {
      setState(() {
        _statusMessage = '扫描失败: $e';
      });
    } finally {
      setState(() {
        _isScanning = false;
      });
      _pulseController.stop();
      _scanController.stop();
    }
  }

  Future<void> _handleSuccessfulStudentScan(RecordModel student) async {
    final studentName = student.getStringValue('student_name') ?? '未知学生';
    
    setState(() {
      _statusMessage = '扫描成功: $studentName';
    });

    // 显示考勤选择对话框
    _showAttendanceDialog(student);
  }

  Future<void> _handleSuccessfulTeacherScan(RecordModel teacher) async {
    final teacherName = teacher.getStringValue('name') ?? '未知教师';
    
    setState(() {
      _statusMessage = '扫描成功: $teacherName';
    });

    // 显示教师考勤选择对话框
    _showTeacherAttendanceDialog(teacher);
  }

  void _showAttendanceDialog(RecordModel student) {
    final studentName = student.getStringValue('student_name') ?? '未知学生';
    final studentId = student.getStringValue('student_id') ?? student.id;

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('学生考勤'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('学生姓名: $studentName'),
              Text('学生ID: $studentId'),
              const SizedBox(height: 16),
              const Text('请选择考勤类型:'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('取消'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _performCheckIn(student);
              },
              child: const Text('签到'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _performCheckOut(student);
              },
              child: const Text('签退'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _performCheckIn(RecordModel student) async {
    try {
      final attendanceProvider = context.read<AttendanceProvider>();
      final studentName = student.getStringValue('student_name') ?? '未知学生';
      final studentId = student.getStringValue('student_id') ?? student.id;
      
      final record = {
        'student_id': studentId,
        'student_name': studentName,
        'attendance_type': 'check_in',
        'timestamp': DateTime.now().toIso8601String(),
        'location': 'NFC扫描',
        'device_id': 'mobile_app',
      };
      
      final success = await attendanceProvider.createAttendanceRecord(record);
      
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$studentName 签到成功'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('签到失败，请重试'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('签到失败: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _performCheckOut(RecordModel student) async {
    try {
      final attendanceProvider = context.read<AttendanceProvider>();
      final studentName = student.getStringValue('student_name') ?? '未知学生';
      final studentId = student.getStringValue('student_id') ?? student.id;
      
      final record = {
        'student_id': studentId,
        'student_name': studentName,
        'attendance_type': 'check_out',
        'timestamp': DateTime.now().toIso8601String(),
        'location': 'NFC扫描',
        'device_id': 'mobile_app',
      };
      
      final success = await attendanceProvider.createAttendanceRecord(record);
      
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$studentName 签退成功'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('签退失败，请重试'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('签退失败: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showTeacherAttendanceDialog(RecordModel teacher) {
    final teacherName = teacher.getStringValue('name') ?? '未知教师';
    final teacherId = teacher.getStringValue('teacher_id') ?? teacher.id;

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('教师考勤'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('教师姓名: $teacherName'),
              Text('教师ID: $teacherId'),
              const SizedBox(height: 16),
              const Text('请选择考勤类型:'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('取消'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _performTeacherCheckIn(teacher);
              },
              child: const Text('签到'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _performTeacherCheckOut(teacher);
              },
              child: const Text('签退'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _performTeacherCheckIn(RecordModel teacher) async {
    try {
      final attendanceProvider = context.read<AttendanceProvider>();
      final teacherName = teacher.getStringValue('name') ?? '未知教师';
      final teacherId = teacher.getStringValue('teacher_id') ?? teacher.id;
      
      final record = {
        'teacher_id': teacherId,
        'teacher_name': teacherName,
        'attendance_type': 'check_in',
        'timestamp': DateTime.now().toIso8601String(),
        'location': 'NFC扫描',
        'device_id': 'mobile_app',
      };
      
      final success = await attendanceProvider.createAttendanceRecord(record);
      
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$teacherName 签到成功'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('签到失败，请重试'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('签到失败: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _performTeacherCheckOut(RecordModel teacher) async {
    try {
      final attendanceProvider = context.read<AttendanceProvider>();
      final teacherName = teacher.getStringValue('name') ?? '未知教师';
      final teacherId = teacher.getStringValue('teacher_id') ?? teacher.id;
      
      final record = {
        'teacher_id': teacherId,
        'teacher_name': teacherName,
        'attendance_type': 'check_out',
        'timestamp': DateTime.now().toIso8601String(),
        'location': 'NFC扫描',
        'device_id': 'mobile_app',
      };
      
      final success = await attendanceProvider.createAttendanceRecord(record);
      
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$teacherName 签退成功'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('签退失败，请重试'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('签退失败: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            AnimatedBuilder(
              animation: _pulseAnimation,
              builder: (context, child) {
                return Transform.scale(
                  scale: _isScanning ? _pulseAnimation.value : 1.0,
        child: Container(
                    width: 100,
                    height: 100,
          decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _isScanning ? AppTheme.primaryColor : Colors.grey[300],
                      boxShadow: _isScanning ? [
                        BoxShadow(
                          color: AppTheme.primaryColor.withOpacity(0.3),
                          blurRadius: 20,
                          spreadRadius: 5,
                        ),
                      ] : null,
                    ),
                    child: Icon(
                      Icons.nfc,
                      size: 50,
                      color: _isScanning ? Colors.white : Colors.grey[600],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 16),
              Text(
                _statusMessage,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _isScanning ? null : _startScan,
              icon: _isScanning 
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.nfc),
              label: Text(_isScanning ? '正在扫描...' : '开始扫描'),
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
}
