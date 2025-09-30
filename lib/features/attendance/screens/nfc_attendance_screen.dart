import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import 'dart:convert';
import '../../../features/attendance/providers/attendance_provider.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../../shared/services/pocketbase_service.dart';
import '../../../shared/services/nfc_safe_scanner_service.dart';
import '../../../shared/services/app_state_manager.dart';
import '../../../core/theme/app_theme.dart';

class NfcAttendanceScreen extends StatefulWidget {
  const NfcAttendanceScreen({super.key});

  @override
  State<NfcAttendanceScreen> createState() => _NfcAttendanceScreenState();
}

class _NfcAttendanceScreenState extends State<NfcAttendanceScreen> {
  bool _isNfcAvailable = false;
  bool _isScanning = false;
  String _scanStatus = '准备扫描';
  String _lastScannedStudent = '';
  String _lastScanResult = '';
  DateTime? _lastScanTime;
  
  // NFC服务
  final NFCSafeScannerService _nfcService = NFCSafeScannerService.instance;

  @override
  void initState() {
    super.initState();
    _checkNfcAvailability();
  }

  Future<void> _checkNfcAvailability() async {
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      bool isAvailable = availability == NFCAvailability.available;
        setState(() {
        _isNfcAvailable = isAvailable;
        _scanStatus = isAvailable ? '准备扫描' : 'NFC不可用';
        });
    } catch (e) {
      setState(() {
        _isNfcAvailable = false;
        _scanStatus = '检查NFC状态失败';
      });
    }
  }

  Future<void> _startNfcScan() async {
    if (_isScanning || !_isNfcAvailable) return;

    setState(() {
      _isScanning = true;
      _scanStatus = '正在扫描...';
    });

    try {
      final result = await _nfcService.safeScanNFC(
        timeout: const Duration(seconds: 10),
        requireStudent: false,
        requireTeacher: false,
      );
      
      if (result.isSuccess) {
        if (result.student != null) {
          await _showAttendanceDialog(result.student!);
        } else if (result.teacher != null) {
          await _showTeacherAttendanceDialog(result.teacher!);
        }
      } else {
        setState(() {
          _scanStatus = result.errorMessage ?? '扫描失败';
          _lastScanResult = '扫描失败：${result.errorMessage ?? '未知错误'}';
        });
      }
    } catch (e) {
      setState(() {
        _scanStatus = '扫描失败: ${e.toString()}';
        _lastScanResult = '扫描失败';
      });
    } finally {
      setState(() {
        _isScanning = false;
        _lastScanTime = DateTime.now();
      });
    }
  }

  Future<void> _stopNfcScan() async {
    if (!_isScanning) return;
    
    setState(() {
      _isScanning = false;
      _scanStatus = '扫描已停止';
    });
    
    try {
      // 使用正确的API停止NFC会话
      await FlutterNfcKit.finish();
                  } catch (e) {
    }
  }
  
  Future<void> _showAttendanceDialog(RecordModel student) async {
    final studentName = student.getStringValue('student_name') ?? '未知学生';
      final studentId = student.getStringValue('student_id') ?? student.id;
    
        setState(() {
      _lastScannedStudent = studentName;
      _scanStatus = '扫描成功: $studentName';
    });

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('学生考勤'),
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

  Future<void> _showTeacherAttendanceDialog(RecordModel teacher) async {
    final teacherName = teacher.getStringValue('name') ?? '未知教师';
    final teacherId = teacher.getStringValue('teacher_id') ?? teacher.id;
    
    setState(() {
      _lastScannedStudent = teacherName;
      _scanStatus = '扫描成功: $teacherName';
    });

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
  
  Future<void> _performCheckIn(RecordModel student) async {
    try {
      final attendanceProvider = context.read<AttendanceProvider>();
      final studentName = student.getStringValue('student_name') ?? '未知学生';
      final studentId = student.getStringValue('student_id') ?? student.id;
      
      final record = {
        'student_id': studentId,
        'student_name': studentName,
        'attendance_type': 'check_in',
        'date': DateTime.now().toIso8601String().split('T')[0],
        'timestamp': DateTime.now().toIso8601String(),
        'location': 'NFC扫描',
        'device_id': 'mobile_app',
      };
      
      final success = await attendanceProvider.createAttendanceRecord(record);
      
        if (success) {
        setState(() {
          _lastScanResult = '签到成功: $studentName';
        });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$studentName 签到成功'),
              backgroundColor: AppTheme.successColor,
            ),
          );
        } else {
        setState(() {
          _lastScanResult = '签到失败';
        });
          ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('签到失败，请重试'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _lastScanResult = '签到失败: $e';
      });
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
        'date': DateTime.now().toIso8601String().split('T')[0],
        'timestamp': DateTime.now().toIso8601String(),
        'location': 'NFC扫描',
        'device_id': 'mobile_app',
      };
      
      final success = await attendanceProvider.createAttendanceRecord(record);
      
        if (success) {
        setState(() {
          _lastScanResult = '签退成功: $studentName';
        });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$studentName 签退成功'),
              backgroundColor: AppTheme.successColor,
            ),
          );
        } else {
        setState(() {
          _lastScanResult = '签退失败';
        });
          ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('签退失败，请重试'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _lastScanResult = '签退失败: $e';
      });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('签退失败: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _performTeacherCheckIn(RecordModel teacher) async {
    try {
      final attendanceProvider = context.read<AttendanceProvider>();
      final teacherName = teacher.getStringValue('name') ?? '未知教师';
      final teacherId = teacher.getStringValue('teacher_id') ?? teacher.id;
      
      final record = {
        'teacher_id': teacherId,
        'teacher_name': teacherName,
        'type': 'check_in',
        'date': DateTime.now().toIso8601String().split('T')[0],
        'timestamp': DateTime.now().toIso8601String(),
        'location': 'NFC扫描',
        'device_id': 'mobile_app',
        'user_type': 'teacher',
      };
      
      final success = await attendanceProvider.createAttendanceRecord(record);
      
      if (success) {
        setState(() {
          _lastScanResult = '教师签到成功: $teacherName';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$teacherName 教师签到成功'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      } else {
        setState(() {
          _lastScanResult = '教师签到失败';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('教师签到失败，请重试'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _lastScanResult = '教师签到失败: $e';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('教师签到失败: $e'),
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
        'type': 'check_out',
        'date': DateTime.now().toIso8601String().split('T')[0],
        'timestamp': DateTime.now().toIso8601String(),
        'location': 'NFC扫描',
        'device_id': 'mobile_app',
        'user_type': 'teacher',
      };
      
      final success = await attendanceProvider.createAttendanceRecord(record);
      
      if (success) {
        setState(() {
          _lastScanResult = '教师签退成功: $teacherName';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$teacherName 教师签退成功'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      } else {
        setState(() {
          _lastScanResult = '教师签退失败';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('教师签退失败，请重试'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _lastScanResult = '教师签退失败: $e';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('教师签退失败: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('NFC考勤'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
                child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
            // NFC状态卡片 - 优化布局
            Card(
              elevation: 6,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              child: Container(
                padding: const EdgeInsets.all(24.0),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      _isNfcAvailable 
                          ? AppTheme.successColor.withOpacity(0.1)
                          : AppTheme.errorColor.withOpacity(0.1),
                      Colors.white,
                  ],
                ),
              ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
            children: [
                    Row(
                      children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                            color: _isNfcAvailable 
                                ? AppTheme.successColor
                                : AppTheme.errorColor,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: (_isNfcAvailable 
                                    ? AppTheme.successColor 
                                    : AppTheme.errorColor).withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Icon(
                            _isNfcAvailable ? Icons.nfc : Icons.nfc_outlined,
                            color: Colors.white,
                            size: 28,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'NFC状态',
                                style: AppTheme.headingStyle.copyWith(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _scanStatus,
                                style: AppTheme.bodyStyle.copyWith(
                                  fontSize: 16,
                                  color: _isNfcAvailable 
                                      ? AppTheme.successColor 
                                      : AppTheme.errorColor,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                        ),
                      ),
                    ],
                  ),
                    
                    if (_lastScannedStudent.isNotEmpty || _lastScanTime != null) ...[
                      const SizedBox(height: 20),
                Container(
                        padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppTheme.primaryColor.withOpacity(0.2),
                            width: 1,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                            if (_lastScannedStudent.isNotEmpty) ...[
                              Row(
                                children: [
                                  Icon(
                                    Icons.person,
                                    size: 18,
                            color: AppTheme.primaryColor,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '最后扫描: $_lastScannedStudent',
                                    style: AppTheme.captionStyle.copyWith(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                              if (_lastScanTime != null) const SizedBox(height: 8),
                            ],
                            if (_lastScanTime != null)
                              Row(
                                children: [
                                  Icon(
                                    Icons.access_time,
                                    size: 18,
                                    color: AppTheme.primaryColor,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '扫描时间: ${_lastScanTime!.toString().substring(0, 19)}',
                                    style: AppTheme.captionStyle.copyWith(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                          ],
                  ),
                ),
              ],
            ],
          ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // 企业级扫描按钮 - 与积分页面保持一致
            Container(
              height: 80,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    _isScanning ? const Color(0xFFEF4444) : const Color(0xFFF59E0B),
                    _isScanning ? const Color(0xFFEF4444).withOpacity(0.8) : const Color(0xFFF59E0B).withOpacity(0.8),
                  ],
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: (_isScanning ? const Color(0xFFEF4444) : const Color(0xFFF59E0B)).withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: ElevatedButton.icon(
                onPressed: _isNfcAvailable && !_isScanning ? _startNfcScan : _isScanning ? _stopNfcScan : null,
                icon: _isScanning 
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 3,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Icon(
                      _isScanning ? Icons.stop_circle : Icons.play_circle,
                      size: 28,
                    ),
                label: Text(
                  _isScanning ? '停止扫描' : '开始扫描',
                  style: AppTheme.bodyStyle.copyWith(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  elevation: 0,
                  shadowColor: Colors.transparent,
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // 结果显示 - 优化设计
            if (_lastScanResult.isNotEmpty)
              Card(
                elevation: 6,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
      child: Container(
                  padding: const EdgeInsets.all(24.0),
        decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
                        AppTheme.primaryColor.withOpacity(0.1),
                        Colors.white,
                      ],
                    ),
        ),
        child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                              color: AppTheme.primaryColor,
                    borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.primaryColor.withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Icon(
                              Icons.check_circle_outline,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                      Text(
                            '扫描结果',
                            style: AppTheme.headingStyle.copyWith(
                              fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                      const SizedBox(height: 16),
                Container(
                        padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppTheme.primaryColor.withOpacity(0.2),
                            width: 1,
                          ),
                  ),
                  child: Text(
                          _lastScanResult,
                          style: AppTheme.bodyStyle.copyWith(
                            fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                    ],
                  ),
                ),
              ),
            
            const SizedBox(height: 24),
            
            // 考勤记录标题
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.history,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  '考勤记录',
                  style: AppTheme.headingStyle.copyWith(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // 考勤记录列表 - 优化设计
            Container(
              height: 300,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppTheme.primaryColor.withOpacity(0.2),
                  width: 1,
                ),
              ),
              child: Consumer<AttendanceProvider>(
                builder: (context, attendanceProvider, child) {
                  final records = attendanceProvider.attendanceRecords;
                  
                  if (records.isEmpty) {
                    return Center(
        child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
          children: [
                          Icon(
                            Icons.inbox_outlined,
                            size: 64,
                            color: Colors.grey[400],
                          ),
                          const SizedBox(height: 16),
                      Text(
                            '暂无考勤记录',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey[600],
                              fontWeight: FontWeight.w500,
                          ),
                        ),
                    ],
      ),
    );
  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: records.length,
                    itemBuilder: (context, index) {
                      final record = records[index];
                      final userType = record.getStringValue('user_type') ?? 'student';
                      final studentName = record.getStringValue('student_name') ?? '未知学生';
                      final teacherName = record.getStringValue('teacher_name') ?? '未知教师';
                      final userName = userType == 'teacher' ? teacherName : studentName;
                      final attendanceType = record.getStringValue('attendance_type') ?? 'unknown';
                      final timestamp = record.getStringValue('timestamp') ?? '';
                      
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.grey.withOpacity(0.1),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: attendanceType == 'check_in' 
                                  ? AppTheme.successColor.withOpacity(0.1)
                                  : AppTheme.warningColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              attendanceType == 'check_in' ? Icons.login : Icons.logout,
                              color: attendanceType == 'check_in' 
                                  ? AppTheme.successColor 
                                  : AppTheme.warningColor,
                              size: 20,
                            ),
                          ),
                          title: Row(
                            children: [
                              Text(
                                userName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 16,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: userType == 'teacher' 
                                      ? AppTheme.primaryColor.withOpacity(0.1)
                                      : AppTheme.secondaryColor.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  userType == 'teacher' ? '教师' : '学生',
                                  style: TextStyle(
                                    color: userType == 'teacher' 
                                        ? AppTheme.primaryColor 
                                        : AppTheme.secondaryColor,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          subtitle: Text(
                            timestamp.isNotEmpty ? timestamp.substring(0, 19) : '未知时间',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 14,
                            ),
                          ),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: attendanceType == 'check_in' 
                                  ? AppTheme.successColor.withOpacity(0.1)
                                  : AppTheme.warningColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              attendanceType == 'check_in' ? '签到' : '签退',
                              style: TextStyle(
                                color: attendanceType == 'check_in' 
                                    ? AppTheme.successColor 
                                    : AppTheme.warningColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
                ),
              ],
            ),
          ),
    );
  }
}
