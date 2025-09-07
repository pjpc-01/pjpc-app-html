import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:nfc_manager/nfc_manager.dart';
import '../../providers/attendance_provider.dart';
import '../../providers/student_provider.dart';
import '../../services/pocketbase_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/statistics_card.dart';

class NfcAttendanceScreen extends StatefulWidget {
  const NfcAttendanceScreen({super.key});

  @override
  State<NfcAttendanceScreen> createState() => _NfcAttendanceScreenState();
}

class _NfcAttendanceScreenState extends State<NfcAttendanceScreen> {
  bool _isScanning = false;
  String _scanStatus = '准备扫描';
  String _lastScannedStudent = '';
  DateTime? _lastScanTime;

  @override
  void initState() {
    super.initState();
    _checkNfcAvailability();
  }

  Future<void> _checkNfcAvailability() async {
    bool isAvailable = await NfcManager.instance.isAvailable();
    if (!isAvailable) {
      setState(() {
        _scanStatus = 'NFC不可用，请检查设备设置';
      });
    }
  }

  Future<void> _startNfcScan() async {
    if (_isScanning) return;

    setState(() {
      _isScanning = true;
      _scanStatus = '请将NFC卡片靠近设备...';
    });

    try {
      await NfcManager.instance.startSession(
        onDiscovered: (NfcTag tag) async {
          await _handleNfcTag(tag);
        },
        pollingOptions: {
          NfcPollingOption.iso14443,
          NfcPollingOption.iso15693,
        },
      );
    } catch (e) {
      setState(() {
        _scanStatus = 'NFC扫描失败: $e';
        _isScanning = false;
      });
    }
  }

  Future<void> _stopNfcScan() async {
    await NfcManager.instance.stopSession();
    setState(() {
      _isScanning = false;
      _scanStatus = '扫描已停止';
    });
  }

  Future<void> _handleNfcTag(NfcTag tag) async {
    try {
      // 简化处理：直接使用模拟数据
      // 在实际应用中，这里应该读取NFC卡片中的URL
      String studentUrl = 'https://example.com/student/STU001';
      
      // 根据URL查找学生
      final studentProvider = Provider.of<StudentProvider>(context, listen: false);
      final student = await studentProvider.getStudentByNfcUrl(studentUrl);

      if (student == null) {
        setState(() {
          _scanStatus = '未找到对应的学生: $studentUrl';
        });
        return;
      }

      // 记录考勤
      await _recordAttendance(student);

    } catch (e) {
      setState(() {
        _scanStatus = '处理NFC数据失败: $e';
      });
    }
  }

  Future<void> _recordAttendance(dynamic student) async {
    try {
      final studentId = student.getStringValue('id');
      final studentName = student.getStringValue('student_name');
      final center = student.getStringValue('center');
      final branchName = student.getStringValue('branch_name') ?? '总校';
      
      final now = DateTime.now();
      final today = now.toIso8601String().split('T')[0];
      final timeString = now.toIso8601String().split('T')[1].split('.')[0];

      // 检查今天是否已经签到
      final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
      final todayAttendance = attendanceProvider.attendanceRecords
          .where((record) => 
              record.getStringValue('student_id') == studentId &&
              record.getStringValue('date') == today)
          .toList();

      String status = 'present';
      String notes = 'NFC签到';
      String checkInTime = timeString;
      String checkOutTime = '';

      if (todayAttendance.isNotEmpty) {
        // 已有记录，执行签退
        final existingRecord = todayAttendance.first;
        if (existingRecord.getStringValue('check_out')?.isNotEmpty == true) {
          setState(() {
            _scanStatus = '今天已经完成签到和签退';
            _lastScannedStudent = studentName;
            _lastScanTime = now;
          });
          return;
        } else {
          // 执行签退
          checkOutTime = timeString;
          notes = 'NFC签退';
        }
      }

      // 创建考勤记录
      final attendanceData = {
        'student_id': studentId,
        'student_name': studentName,
        'center': center,
        'branch_name': branchName,
        'check_in': checkInTime,
        'check_out': checkOutTime,
        'status': status,
        'notes': notes,
        'teacher_id': 'TCH001', // 可以从当前登录用户获取
        'method': 'NFC',
        'date': today,
      };

      // 保存到PocketBase
      final pocketbaseService = PocketBaseService();
      await pocketbaseService.createAttendanceRecord(attendanceData);

      // 刷新考勤数据
      await attendanceProvider.loadAttendanceRecords();

      setState(() {
        _scanStatus = '考勤记录成功';
        _lastScannedStudent = studentName;
        _lastScanTime = now;
      });

      // 显示成功消息
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${checkInTime.isNotEmpty ? '签到' : '签退'}成功: $studentName'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }

    } catch (e) {
      setState(() {
        _scanStatus = '保存考勤记录失败: $e';
      });
    }
  }

  @override
  void dispose() {
    NfcManager.instance.stopSession();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('NFC考勤扫描'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(_isScanning ? Icons.stop : Icons.refresh),
            onPressed: _isScanning ? _stopNfcScan : _startNfcScan,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildScanStatusCard(),
            const SizedBox(height: AppSpacing.lg),
            _buildLastScanCard(),
            const SizedBox(height: AppSpacing.lg),
            _buildInstructionsCard(),
            const SizedBox(height: AppSpacing.lg),
            _buildStatisticsCard(),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _isScanning ? _stopNfcScan : _startNfcScan,
        icon: Icon(_isScanning ? Icons.stop : Icons.nfc),
        label: Text(_isScanning ? '停止扫描' : '开始扫描'),
        backgroundColor: _isScanning ? AppTheme.errorColor : AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
    );
  }

  Widget _buildScanStatusCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  _isScanning ? Icons.nfc : Icons.nfc_outlined,
                  color: _isScanning ? AppTheme.successColor : AppTheme.textSecondary,
                  size: 24,
                ),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  '扫描状态',
                  style: AppTextStyles.headline6?.copyWith(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: _isScanning 
                    ? AppTheme.successColor.withOpacity(0.1)
                    : AppTheme.textSecondary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppRadius.sm),
                border: Border.all(
                  color: _isScanning 
                      ? AppTheme.successColor
                      : AppTheme.textSecondary,
                ),
              ),
              child: Text(
                _scanStatus,
                style: AppTextStyles.bodyMedium?.copyWith(
                  color: _isScanning 
                      ? AppTheme.successColor
                      : AppTheme.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLastScanCard() {
    if (_lastScannedStudent.isEmpty) {
      return const SizedBox.shrink();
    }

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '最近扫描',
              style: AppTextStyles.headline6?.copyWith(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                  child: Text(
                    _lastScannedStudent.isNotEmpty ? _lastScannedStudent[0].toUpperCase() : '?',
                    style: const TextStyle(
                      color: AppTheme.primaryColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _lastScannedStudent,
                        style: AppTextStyles.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (_lastScanTime != null)
                        Text(
                          '扫描时间: ${_lastScanTime!.toString().split('.')[0]}',
                          style: AppTextStyles.bodySmall?.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInstructionsCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '使用说明',
              style: AppTextStyles.headline6?.copyWith(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            _buildInstructionItem('1', '点击"开始扫描"按钮启动NFC扫描'),
            _buildInstructionItem('2', '将学生NFC卡片靠近设备背面'),
            _buildInstructionItem('3', '系统会自动识别学生并记录考勤'),
            _buildInstructionItem('4', '首次扫描为签到，再次扫描为签退'),
            _buildInstructionItem('5', '扫描完成后会显示成功提示'),
          ],
        ),
      ),
    );
  }

  Widget _buildInstructionItem(String number, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                number,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              text,
              style: AppTextStyles.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatisticsCard() {
    return Consumer<AttendanceProvider>(
      builder: (context, attendanceProvider, child) {
        final todayRecords = attendanceProvider.attendanceRecords
            .where((record) => record.getStringValue('date') == 
                DateTime.now().toIso8601String().split('T')[0])
            .toList();

        return Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '今日统计',
                  style: AppTextStyles.headline6?.copyWith(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: StatisticsCard(
                        title: '总考勤',
                        value: todayRecords.length.toString(),
                        subtitle: '次',
                        icon: Icons.people,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: StatisticsCard(
                        title: '出勤',
                        value: todayRecords
                            .where((r) => r.getStringValue('status') == 'present')
                            .length
                            .toString(),
                        subtitle: '次',
                        icon: Icons.check_circle,
                        color: AppTheme.successColor,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}