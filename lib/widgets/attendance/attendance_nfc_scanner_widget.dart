import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import 'dart:convert';
import '../../providers/attendance_provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/teacher_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/pocketbase_service.dart';
import '../../services/nfc_safe_scanner_service.dart';
import '../../services/app_state_manager.dart';
import '../../theme/app_theme.dart';

class AttendanceNFCScannerWidget extends StatefulWidget {
  const AttendanceNFCScannerWidget({super.key});

  @override
  State<AttendanceNFCScannerWidget> createState() => _AttendanceNFCScannerWidgetState();
}

class _AttendanceNFCScannerWidgetState extends State<AttendanceNFCScannerWidget>
    with TickerProviderStateMixin {
  bool _isScanning = false;
  String _statusMessage = '准备扫描';
  late AnimationController _pulseController;
  late AnimationController _scanController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _scanAnimation;

  // NFC服务
  final NFCSafeScannerService _nfcService = NFCSafeScannerService.instance;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _scanController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 0.8,
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

    _pulseController.repeat(reverse: true);

    // 自动开始扫描
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startScanning();
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _scanController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenHeight < 700 || screenWidth < 360;
    
    return Container(
      height: isSmallScreen ? screenHeight * 0.7 : screenHeight * 0.85,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFF8FAFC),
            Color(0xFFF1F5F9),
          ],
        ),
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(28),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildEnterpriseHeader(isSmallScreen),
          Expanded(
            child: _buildEnterpriseScannerContent(isSmallScreen),
          ),
          _buildEnterpriseActionButtons(isSmallScreen),
        ],
      ),
    );
  }

  Widget _buildEnterpriseHeader(bool isSmallScreen) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        isSmallScreen ? 20 : 24,
        isSmallScreen ? 16 : 20,
        isSmallScreen ? 20 : 24,
        isSmallScreen ? 12 : 16,
      ),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF059669),
            Color(0xFF10B981),
          ],
        ),
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(28),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.access_time,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'NFC考勤扫描',
                  style: TextStyle(
                    fontSize: isSmallScreen ? 18 : 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '扫描学生NFC卡进行考勤',
                  style: TextStyle(
                    fontSize: isSmallScreen ? 12 : 14,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(
              Icons.close,
              color: Colors.white,
              size: 24,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnterpriseScannerContent(bool isSmallScreen) {
    return Padding(
      padding: EdgeInsets.all(isSmallScreen ? 20 : 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // NFC扫描动画区域
          Container(
            width: isSmallScreen ? 200 : 240,
            height: isSmallScreen ? 200 : 240,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  const Color(0xFF059669).withOpacity(0.1),
                  const Color(0xFF10B981).withOpacity(0.05),
                ],
              ),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // 外层脉冲动画
                AnimatedBuilder(
                  animation: _pulseAnimation,
                  builder: (context, child) {
                    return Transform.scale(
                      scale: _pulseAnimation.value,
                      child: Container(
                        width: isSmallScreen ? 180 : 220,
                        height: isSmallScreen ? 180 : 220,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFF059669).withOpacity(0.3),
                            width: 2,
                          ),
                        ),
                      ),
                    );
                  },
                ),
                // 内层扫描动画
                AnimatedBuilder(
                  animation: _scanAnimation,
                  builder: (context, child) {
                    return Container(
                      width: isSmallScreen ? 120 : 140,
                      height: isSmallScreen ? 120 : 140,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            const Color(0xFF059669).withOpacity(0.8),
                            const Color(0xFF10B981).withOpacity(0.6),
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF059669).withOpacity(0.3),
                            blurRadius: 20,
                            spreadRadius: 5,
                          ),
                        ],
                      ),
                      child: Icon(
                        _isScanning ? Icons.nfc : Icons.nfc_rounded,
                        color: Colors.white,
                        size: isSmallScreen ? 40 : 48,
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 32),
          
          // 状态信息
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                Text(
                  _statusMessage,
                  style: TextStyle(
                    fontSize: isSmallScreen ? 16 : 18,
                    fontWeight: FontWeight.w600,
                    color: _isScanning ? const Color(0xFF059669) : const Color(0xFF6B7280),
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  _isScanning 
                    ? '请将NFC卡靠近设备进行扫描'
                    : '点击下方按钮开始扫描',
                  style: TextStyle(
                    fontSize: isSmallScreen ? 12 : 14,
                    color: const Color(0xFF6B7280),
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnterpriseActionButtons(bool isSmallScreen) {
    return Container(
      padding: EdgeInsets.all(isSmallScreen ? 20 : 24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFF8FAFC),
            Color(0xFFF1F5F9),
          ],
        ),
        borderRadius: const BorderRadius.vertical(
          bottom: Radius.circular(28),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildEnterpriseActionButton(
              _isScanning ? '停止扫描' : '开始扫描',
              _isScanning ? Icons.stop_circle : Icons.play_circle,
              _isScanning ? const Color(0xFFEF4444) : const Color(0xFF059669),
              _isScanning ? _stopScanning : _startScanning,
              isSmallScreen,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnterpriseActionButton(
    String text,
    IconData icon,
    Color color,
    VoidCallback onPressed,
    bool isSmallScreen,
  ) {
    return Container(
      height: isSmallScreen ? 56 : 64,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            color,
            color.withOpacity(0.8),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: isSmallScreen ? 20 : 24),
        label: Text(
          text,
          style: TextStyle(
            fontSize: isSmallScreen ? 16 : 18,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.white,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  Future<void> _startScanning() async {
    if (_isScanning) return;

    setState(() {
      _isScanning = true;
      _statusMessage = '正在扫描...';
    });

    _scanController.repeat();

    try {
      final result = await _nfcService.safeScanNFC(
        timeout: const Duration(seconds: 30),
        requireStudent: false,
        requireTeacher: false,
      );

      if (result.isSuccess && (result.student != null || result.teacher != null)) {
        if (result.student != null) {
          await _processStudentAttendance(result.student!);
        } else if (result.teacher != null) {
          await _processTeacherAttendance(result.teacher!);
        }
      } else {
        setState(() {
          _statusMessage = result.errorMessage ?? '扫描失败';
        });
      }
    } catch (e) {
      setState(() {
        _statusMessage = '扫描失败: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isScanning = false;
      });
      _scanController.stop();
    }
  }

  Future<void> _stopScanning() async {
    if (!_isScanning) return;
    
    setState(() {
      _isScanning = false;
      _statusMessage = '扫描已停止';
    });
    
    _scanController.stop();
    
    try {
      await FlutterNfcKit.finish();
    } catch (e) {
    }
  }

  Future<void> _processStudentAttendance(RecordModel student) async {
    try {
      final attendanceProvider = context.read<AttendanceProvider>();
      
      final studentName = student.getStringValue('student_name') ?? '未知学生';
      final studentId = student.getStringValue('student_id') ?? student.id;

      setState(() {
        _statusMessage = '找到学生: $studentName';
      });

      // 显示考勤选择对话框
      _showStudentAttendanceDialog(student);
      
    } catch (e) {
      setState(() {
        _statusMessage = '处理学生考勤失败';
      });
    }
  }

  Future<void> _processTeacherAttendance(RecordModel teacher) async {
    try {
      final teacherName = teacher.getStringValue('name') ?? '未知教师';
      final teacherId = teacher.getStringValue('teacher_id') ?? teacher.id;

      setState(() {
        _statusMessage = '找到教师: $teacherName';
      });

      // 显示教师考勤选择对话框
      _showTeacherAttendanceDialog(teacher);
      
    } catch (e) {
      setState(() {
        _statusMessage = '处理教师考勤失败';
      });
    }
  }

  Future<void> _showStudentAttendanceDialog(RecordModel student) async {
    final studentName = student.getStringValue('student_name') ?? '未知学生';
    final studentId = student.getStringValue('student_id') ?? student.id;

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
        'type': 'check_in',
        'date': DateTime.now().toIso8601String().split('T')[0],
        'nfc_tag_id': student.getStringValue('cardNumber'),
        'location': 'NFC扫描',
        'device_id': 'mobile_app',
      };

      await attendanceProvider.createAttendanceRecord(record);
      
      setState(() {
        _statusMessage = '签到成功: $studentName';
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('签到成功: $studentName'),
            backgroundColor: const Color(0xFF059669),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _statusMessage = '签到失败: $e';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('签到失败: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
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
        'type': 'check_out',
        'date': DateTime.now().toIso8601String().split('T')[0],
        'nfc_tag_id': student.getStringValue('cardNumber'),
        'location': 'NFC扫描',
        'device_id': 'mobile_app',
      };

      await attendanceProvider.createAttendanceRecord(record);
      
      setState(() {
        _statusMessage = '签退成功: $studentName';
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('签退成功: $studentName'),
            backgroundColor: const Color(0xFF059669),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _statusMessage = '签退失败: $e';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('签退失败: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
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
        'time': DateTime.now().toIso8601String(),
        'nfc_tag_id': teacher.getStringValue('nfc_card_number'),
      };

      await attendanceProvider.createAttendanceRecord(record);
      
      setState(() {
        _statusMessage = '教师签到成功: $teacherName';
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('教师签到成功: $teacherName'),
            backgroundColor: const Color(0xFF059669),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _statusMessage = '教师签到失败: $e';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('教师签到失败: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
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
        'time': DateTime.now().toIso8601String(),
        'nfc_tag_id': teacher.getStringValue('nfc_card_number'),
      };

      await attendanceProvider.createAttendanceRecord(record);
      
      setState(() {
        _statusMessage = '教师签退成功: $teacherName';
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('教师签退成功: $teacherName'),
            backgroundColor: const Color(0xFF059669),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _statusMessage = '教师签退失败: $e';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('教师签退失败: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }
}
