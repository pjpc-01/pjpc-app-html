import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../providers/attendance_provider.dart';
import '../../providers/student_provider.dart';

class NFCScanner extends StatefulWidget {
  const NFCScanner({super.key});

  @override
  State<NFCScanner> createState() => _NFCScannerState();
}

class _NFCScannerState extends State<NFCScanner> {
  bool _isScanning = false;
  String _statusMessage = '点击开始扫描NFC卡片';
  String? _lastScannedCard;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // NFC Scanner Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Icon(
                    Icons.nfc,
                    size: 64,
                    color: _isScanning 
                        ? Theme.of(context).colorScheme.primary
                        : Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _isScanning ? '正在扫描NFC卡片...' : 'NFC考勤打卡',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _statusMessage,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  
                  // Scan Button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _isScanning ? null : _startNFCScan,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(24),
                        ),
                      ),
                      child: _isScanning
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text('开始扫描'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Recent Scans
          if (_lastScannedCard != null) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '最近扫描',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.nfc,
                          size: 20,
                          color: Colors.green,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '卡片ID: $_lastScannedCard',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
          
          const SizedBox(height: 24),
          
          // Instructions
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '使用说明',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    '1. 确保设备NFC功能已开启\n'
                    '2. 点击"开始扫描"按钮\n'
                    '3. 将NFC卡片靠近设备背面\n'
                    '4. 等待扫描完成并确认考勤',
                    style: TextStyle(height: 1.5),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _startNFCScan() async {
    // Check NFC availability
    final nfcAvailable = await FlutterNfcKit.nfcAvailability;
    if (nfcAvailable != NFCAvailability.available) {
      setState(() {
        _statusMessage = 'NFC功能不可用，请检查设备设置';
      });
      return;
    }

    // Check permissions
    final permission = await Permission.location.status;
    if (!permission.isGranted) {
      final result = await Permission.location.request();
      if (!result.isGranted) {
        setState(() {
          _statusMessage = '需要位置权限才能使用此功能';
        });
        return;
      }
    }

    setState(() {
      _isScanning = true;
      _statusMessage = '请将NFC卡片靠近设备...';
    });

    try {
      // Start NFC session
      await FlutterNfcKit.poll(
        timeout: const Duration(seconds: 30),
        iosAlertMessage: '将NFC卡片靠近设备',
      );

      // Read NFC data
      final tag = await FlutterNfcKit.poll();
      if (tag != null) {
        final cardId = tag.id;
        setState(() {
          _lastScannedCard = cardId;
          _statusMessage = 'NFC卡片扫描成功！';
        });

        // Process attendance
        await _processAttendance(cardId);
      }
    } catch (e) {
      setState(() {
        _statusMessage = '扫描失败: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isScanning = false;
      });
    }
  }

  Future<void> _processAttendance(String cardId) async {
    try {
      // Find student by NFC card ID
      final studentProvider = Provider.of<StudentProvider>(context, listen: false);
      final students = studentProvider.students;
      
      final student = students.firstWhere(
        (s) => s.getStringValue('nfc_card_id') == cardId,
        orElse: () => RecordModel(),
      );

      if (student.id.isEmpty) {
        setState(() {
          _statusMessage = '未找到对应的学生信息';
        });
        return;
      }

      // Check if already checked in today
      final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
      final today = DateTime.now();
      final todayRecords = attendanceProvider.getAttendanceRecordsByDate(today);
      
      final hasCheckedIn = todayRecords.any((r) => 
        r.getStringValue('student') == student.id && 
        r.getStringValue('type') == 'check_in'
      );
      
      final hasCheckedOut = todayRecords.any((r) => 
        r.getStringValue('student') == student.id && 
        r.getStringValue('type') == 'check_out'
      );

      String attendanceType;
      if (!hasCheckedIn) {
        attendanceType = 'check_in';
      } else if (!hasCheckedOut) {
        attendanceType = 'check_out';
      } else {
        setState(() {
          _statusMessage = '今日已完成考勤打卡';
        });
        return;
      }

      // Create attendance record
      await attendanceProvider.createAttendanceRecord({
        'student': student.id,
        'student_name': student.getStringValue('name'),
        'type': attendanceType,
        'nfc_card_id': cardId,
        'date': today.toIso8601String().split('T')[0],
        'time': DateTime.now().toIso8601String(),
      });

      setState(() {
        _statusMessage = '考勤${attendanceType == 'check_in' ? '签到' : '签退'}成功！';
      });

      // Show success message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${student.getStringValue('name')} ${attendanceType == 'check_in' ? '签到' : '签退'}成功！',
            ),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _statusMessage = '处理考勤失败: ${e.toString()}';
      });
    }
  }
}
