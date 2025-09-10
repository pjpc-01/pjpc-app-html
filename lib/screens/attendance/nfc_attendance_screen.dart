import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:nfc_manager/nfc_manager.dart';
import '../../providers/attendance_provider.dart';
import '../../providers/student_provider.dart';
import '../../services/pocketbase_service.dart';
import '../../services/encryption_service.dart';
import '../../services/security_service.dart';
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
  
  // 安全服务
  late SecurityService _securityService;
  late EncryptionService _encryptionService;

  @override
  void initState() {
    super.initState();
    _securityService = SecurityService();
    _encryptionService = EncryptionService();
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
      // 停止扫描
      await _stopNfcScan();
      
      setState(() {
        _scanStatus = '正在处理NFC数据...';
      });

      // 读取NFC标签数据
      String nfcData = '';
      try {
        // 尝试读取NFC标签的文本数据
        if (tag.data is Map) {
          final data = tag.data as Map;
          // 尝试不同的数据格式
          if (data.containsKey('ndef')) {
            // NDEF格式
            final ndefData = data['ndef'];
            if (ndefData is Map && ndefData.containsKey('records')) {
              final records = ndefData['records'] as List;
              if (records.isNotEmpty) {
                final record = records.first;
                if (record is Map && record.containsKey('payload')) {
                  final payload = record['payload'] as List<int>;
                  nfcData = String.fromCharCodes(payload);
                }
              }
            }
          } else if (data.containsKey('text')) {
            // 文本格式
            nfcData = data['text'] as String;
          } else if (data.containsKey('url')) {
            // URL格式
            nfcData = data['url'] as String;
          }
        }
      } catch (e) {
        print('读取NFC数据失败: $e');
      }

      if (nfcData.isEmpty) {
        setState(() {
          _scanStatus = 'NFC数据读取失败，请重试';
        });
        return;
      }
      
      // 尝试解密NFC数据
      String decryptedData = '';
      String salt = '';
      bool isEncrypted = false;
      
      try {
        // 尝试解密（假设数据格式为 "encryptedData:salt"）
        if (nfcData.contains(':')) {
          final parts = nfcData.split(':');
          if (parts.length == 2) {
            decryptedData = _encryptionService.decryptNFCData(parts[0], parts[1]);
            salt = parts[1];
            isEncrypted = true;
          }
        } else {
          // 未加密数据，直接使用
          decryptedData = nfcData;
        }
      } catch (e) {
        // 解密失败，尝试作为普通数据使用
        decryptedData = nfcData;
        print('解密失败，使用原始数据: $e');
      }
      
      // 根据解密后的数据查找学生
      final studentProvider = Provider.of<StudentProvider>(context, listen: false);
      dynamic student;
      
      if (isEncrypted) {
        // 使用解密后的学生ID查找
        student = await studentProvider.getStudentById(decryptedData);
      } else {
        // 使用URL查找（兼容旧系统）
        student = await studentProvider.getStudentByNfcUrl(decryptedData);
      }

      if (student == null) {
        setState(() {
          _scanStatus = '未找到对应的学生: $decryptedData';
        });
        return;
      }

      // 安全检查
      final studentId = student.getStringValue('student_id') ?? student.id;
      final isLocked = await _securityService.isUserLocked(studentId, 'student');
      
      if (isLocked) {
        final lockReason = student.getStringValue('lock_reason') ?? '未知原因';
        setState(() {
          _scanStatus = '🚫 学生 ${student.getStringValue('student_name')} 已被锁定: $lockReason';
        });
        return;
      }

      // 显示签到/签退选择对话框（包含安全监控数据）
      await _showAttendanceChoiceDialog(student, nfcData);

    } catch (e) {
      setState(() {
        _scanStatus = '处理NFC数据失败: $e';
      });
    }
  }

  /// 显示签到/签退选择对话框
  Future<void> _showAttendanceChoiceDialog(dynamic student, String nfcData) async {
    final studentName = student.getStringValue('student_name') ?? '未知学生';
    final studentId = student.getStringValue('id');
    
    // 检查今天的考勤状态
    final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
    final today = DateTime.now().toIso8601String().split('T')[0];
    final todayAttendance = attendanceProvider.attendanceRecords
        .where((record) => 
            record.getStringValue('student_id') == studentId &&
            record.getStringValue('date') == today)
        .toList();

    bool hasCheckedIn = todayAttendance.isNotEmpty;
    bool hasCheckedOut = hasCheckedIn && 
        (todayAttendance.first.getStringValue('check_out')?.isNotEmpty == true);

    if (!mounted) return;

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Row(
            children: [
              CircleAvatar(
                backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                child: Text(
                  studentName.isNotEmpty ? studentName[0].toUpperCase() : '?',
                  style: const TextStyle(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      studentName,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    Text(
                      '请选择考勤操作',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (hasCheckedOut)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.warningColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.warningColor),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info, color: AppTheme.warningColor, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '今天已完成签到和签退',
                          style: TextStyle(
                            color: AppTheme.warningColor,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              else if (hasCheckedIn)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.successColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.successColor),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, color: AppTheme.successColor, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '今天已签到，可以进行签退',
                          style: TextStyle(
                            color: AppTheme.successColor,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.primaryColor),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.login, color: AppTheme.primaryColor, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '今天尚未签到，可以进行签到',
                          style: TextStyle(
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 16),
              if (!hasCheckedOut) ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: hasCheckedIn ? null : () async {
                      Navigator.of(context).pop();
                      await _recordAttendance(student, 'check_in', nfcData);
                    },
                    icon: const Icon(Icons.login),
                    label: const Text('签到'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: hasCheckedIn ? AppTheme.textSecondary : AppTheme.successColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: !hasCheckedIn ? null : () async {
                      Navigator.of(context).pop();
                      await _recordAttendance(student, 'check_out', nfcData);
                    },
                    icon: const Icon(Icons.logout),
                    label: const Text('签退'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: !hasCheckedIn ? AppTheme.textSecondary : AppTheme.errorColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                setState(() {
                  _scanStatus = '操作已取消';
                });
              },
              child: const Text('取消'),
            ),
          ],
        );
      },
    );
  }

  /// 记录考勤
  Future<void> _recordAttendance(dynamic student, String action, String nfcData) async {
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
      String notes = action == 'check_in' ? 'NFC签到' : 'NFC签退';
      String checkInTime = '';
      String checkOutTime = '';

      if (action == 'check_in') {
        // 签到操作
        if (todayAttendance.isNotEmpty) {
          setState(() {
            _scanStatus = '今天已经签到过了';
            _lastScannedStudent = studentName;
            _lastScanTime = now;
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('$studentName 今天已经签到过了'),
                backgroundColor: AppTheme.warningColor,
              ),
            );
          }
          return;
        }
        checkInTime = timeString;
      } else {
        // 签退操作
        if (todayAttendance.isEmpty) {
          setState(() {
            _scanStatus = '请先签到再签退';
            _lastScannedStudent = studentName;
            _lastScanTime = now;
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('$studentName 请先签到再签退'),
                backgroundColor: AppTheme.warningColor,
              ),
            );
          }
          return;
        }
        
        final existingRecord = todayAttendance.first;
        if (existingRecord.getStringValue('check_out')?.isNotEmpty == true) {
          setState(() {
            _scanStatus = '今天已经签退过了';
            _lastScannedStudent = studentName;
            _lastScanTime = now;
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('$studentName 今天已经签退过了'),
                backgroundColor: AppTheme.warningColor,
              ),
            );
          }
          return;
        }
        
        // 更新现有记录，添加签退时间
        checkInTime = existingRecord.getStringValue('check_in') ?? '';
        checkOutTime = timeString;
        
        // 更新现有记录而不是创建新记录
        final updateData = {
          'check_out': checkOutTime,
          'notes': 'NFC签退',
        };
        
        final pocketbaseService = PocketBaseService();
        await pocketbaseService.updateStudentAttendanceRecord(existingRecord.id, updateData);
        
        // 刷新考勤数据
        await attendanceProvider.loadAttendanceRecords();
        
        setState(() {
          _scanStatus = '签退成功';
          _lastScannedStudent = studentName;
          _lastScanTime = now;
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('签退成功: $studentName'),
              backgroundColor: AppTheme.successColor,
            ),
          );
        }
        return;
      }

      // 创建考勤记录（包含安全监控数据）
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
        'timestamp': DateTime.now().toIso8601String(),
        'nfc_data': nfcData,
        'device_id': 'nfc_scanner_001', // 设备ID
        'location': 'NFC考勤点', // 刷卡地点
        'ip_address': '192.168.1.100', // 实际应用中获取真实IP
        'user_agent': 'NFC Scanner App', // 用户代理
        // 安全监控字段
        'encryption_version': 2,
        'encryption_algorithm': 'AES-256',
      };

      // 保存到PocketBase
      final pocketbaseService = PocketBaseService();
      await pocketbaseService.createAttendanceRecord(attendanceData);

      // 刷新考勤数据
      await attendanceProvider.loadAttendanceRecords();

      setState(() {
        _scanStatus = '签到成功';
        _lastScannedStudent = studentName;
        _lastScanTime = now;
      });

      // 显示成功消息
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('签到成功: $studentName'),
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
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          _buildSmartHeader(),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildScanStatusCard(),
                  const SizedBox(height: 16),
                  _buildLastScanCard(),
                  const SizedBox(height: 16),
                  _buildInstructionsCard(),
                  const SizedBox(height: 16),
                  _buildStatisticsCard(),
                ],
              ),
            ),
          ),
        ],
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

  Widget _buildSmartHeader() {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF3B82F6),
              Color(0xFF1D4ED8),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF3B82F6).withOpacity(0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.nfc_rounded,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'NFC考勤扫描',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        '快速扫描学生NFC卡片进行考勤',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _isScanning ? '扫描中' : '待机',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            _buildNfcQuickActions(),
          ],
        ),
      ),
    );
  }

  Widget _buildNfcQuickActions() {
    return Row(
      children: [
        Expanded(
          child: _buildActionButton(
            _isScanning ? '停止扫描' : '开始扫描',
            _isScanning ? Icons.stop : Icons.nfc,
            _isScanning ? const Color(0xFFEF4444) : const Color(0xFF10B981),
            _isScanning ? _stopNfcScan : _startNfcScan,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            '查看记录',
            Icons.history,
            const Color(0xFF8B5CF6),
            () {
              // TODO: 导航到考勤记录
            },
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton(String title, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Colors.white.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: Colors.white,
              size: 18,
            ),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
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