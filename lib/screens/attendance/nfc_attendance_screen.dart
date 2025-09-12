import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:pocketbase/pocketbase.dart';
import 'dart:convert';
import '../../providers/attendance_provider.dart';
import '../../providers/student_provider.dart';
import '../../services/pocketbase_service.dart';
import '../../services/encryption_service.dart';
import '../../services/security_service.dart';
import '../../services/nfc_safe_scanner_service.dart';
import '../../services/app_state_manager.dart';
import '../../services/ultra_simple_nfc_scanner.dart';
import '../../services/minimal_nfc_scanner.dart';
import '../../services/ultra_minimal_nfc_scanner.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/statistics_card.dart';
import 'attendance_records_screen.dart';

class NfcAttendanceScreen extends StatefulWidget {
  const NfcAttendanceScreen({super.key});

  @override
  State<NfcAttendanceScreen> createState() => _NfcAttendanceScreenState();
}

class _NfcAttendanceScreenState extends State<NfcAttendanceScreen> {
  bool _isScanning = false;
  String _scanStatus = '准备扫描';
  String _lastScannedStudent = '';
  String _lastScanResult = '';
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
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      bool isAvailable = availability == NFCAvailability.available;
      if (!isAvailable) {
        setState(() {
          _scanStatus = 'NFC不可用，请检查设备设置';
        });
      }
    } catch (e) {
      setState(() {
        _scanStatus = 'NFC检查失败: $e';
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
      print('🎯 开始NFC考勤扫描...');
      
      // 使用修复后的NFC扫描服务（已包含1.5秒缓冲时间）
      final result = await NFCSafeScannerService.instance.safeScanNFC(
        timeout: const Duration(seconds: 10),
        requireStudent: true,
      );
      
      if (result.isSuccess && result.student != null) {
        print('✅ NFC扫描成功: ${result.student!.getStringValue('student_name')}');
        setState(() {
          _lastScannedStudent = result.student!.getStringValue('student_name');
          _lastScanResult = '成功';
          _lastScanTime = DateTime.now();
        });
        
        // 显示考勤面板（参考积分管理页面）
        _showAttendancePanel(context, result.student!, allowActions: true);
      } else {
        print('❌ NFC扫描失败: ${result.errorMessage}');
        setState(() {
          _scanStatus = result.errorMessage ?? 'NFC扫描失败';
          _lastScanResult = '失败';
          _lastScanTime = DateTime.now();
        });
      }
      
    } catch (e) {
      print('❌ NFC扫描异常: $e');
      setState(() {
        _scanStatus = 'NFC扫描失败: $e';
        _lastScanResult = '异常';
        _lastScanTime = DateTime.now();
      });
    } finally {
      setState(() {
        _isScanning = false;
      });
    }
  }
  
  /// 检查Activity状态
  Future<void> _checkActivityState() async {
    try {
      // 添加短暂延迟确保Activity已附加
      await Future.delayed(const Duration(milliseconds: 200));
      
      // 检查NFC可用性作为Activity状态检查
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability == NFCAvailability.not_supported) {
        throw Exception('NFC not supported');
      }
    } catch (e) {
      if (e.toString().contains('not attached to activity')) {
        throw Exception('Activity not attached, please restart the app');
      }
      rethrow;
    }
  }

  Future<void> _stopNfcScan() async {
    try {
      await FlutterNfcKit.finish();
    } catch (e) {
      // 忽略关闭时的错误
    }
    setState(() {
      _isScanning = false;
      _scanStatus = '扫描已停止';
    });
  }
  


  Future<void> _handleNfcTag(NFCTag tag) async {
    try {
      // 停止扫描
      await _stopNfcScan();
      
      setState(() {
        _scanStatus = '正在处理NFC数据...';
      });

      // 读取NFC标签数据
      String nfcData = '';
      try {
        // 尝试读取NFC标签的NDEF数据
        if (tag.ndefAvailable ?? false) {
          List<dynamic> records = await FlutterNfcKit.readNDEFRecords(cached: false);
          
          for (var record in records) {
            if (record.payload != null) {
              // 处理NDEF Text记录
              if (record.payload is List<int>) {
                final payloadBytes = record.payload as List<int>;
                if (payloadBytes.isNotEmpty) {
                  // 跳过状态字节和语言代码长度
                  final statusByte = payloadBytes[0];
                  final languageCodeLength = statusByte & 0x3F; // 取低6位
                  
                  if (payloadBytes.length > languageCodeLength + 1) {
                    // 提取文本内容
                    final textBytes = payloadBytes.sublist(1 + languageCodeLength);
                    final content = utf8.decode(textBytes);
                    if (content.isNotEmpty) {
                      nfcData = content;
                      print('📖 考勤页面读取到NDEF文本: $content');
                      break;
                    }
                  }
                }
              } else if (record.payload is String) {
                // 处理十六进制字符串
                final payloadHex = record.payload as String;
                if (payloadHex.isNotEmpty) {
                  try {
                    final payloadBytes = List<int>.generate(
                      payloadHex.length ~/ 2,
                      (i) => int.parse(payloadHex.substring(i * 2, i * 2 + 2), radix: 16),
                    );
                    
                    // 跳过状态字节和语言代码长度
                    final statusByte = payloadBytes[0];
                    final languageCodeLength = statusByte & 0x3F;
                    
                    if (payloadBytes.length > languageCodeLength + 1) {
                      final textBytes = payloadBytes.sublist(1 + languageCodeLength);
                      final content = utf8.decode(textBytes);
                      if (content.isNotEmpty) {
                        nfcData = content;
                        print('📖 考勤页面读取到NDEF文本(hex): $content');
                        break;
                      }
                    }
                  } catch (e) {
                    print('考勤页面解析十六进制payload失败: $e');
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        print('考勤页面读取NFC数据失败: $e');
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
        // 确保密钥已加载
        await _encryptionService.ensureKeysLoaded();
        
        // 尝试解密（假设数据格式为 "encryptedData:salt"）
        if (nfcData.contains(':')) {
          final parts = nfcData.split(':');
          if (parts.length == 2) {
            final encryptedPart = parts[0].trim();
            final saltPart = parts[1].trim();
            print('🔎 考勤页面待解密数据: encrypted="'+encryptedPart+'" salt="'+saltPart+'"');
            
            // 兼容可能的 url-safe base64
            final normalizedEncrypted = encryptedPart.replaceAll('-', '+').replaceAll('_', '/');
            _encryptionService.logAvailableVersions();
            decryptedData = _encryptionService.decryptNFCData(normalizedEncrypted, saltPart);
            print('🔓 考勤页面解密明文: '+decryptedData);
            salt = saltPart;
            isEncrypted = true;
          }
        } else {
          // 未加密数据，直接使用
          decryptedData = nfcData;
        }
      } catch (e) {
        // 解密失败，尝试作为普通数据使用
        decryptedData = nfcData;
        print('考勤页面解密失败，使用原始数据: $e');
      }
      
      // 根据解密后的数据查找学生
      final studentProvider = Provider.of<StudentProvider>(context, listen: false);
      dynamic student;
      
      try {
        if (isEncrypted && decryptedData.contains('_')) {
          // 从解密后的数据中提取学生ID（格式：学生ID_随机字符串）
          final parts = decryptedData.split('_');
          if (parts.length >= 2) {
            final studentId = parts[0]; // 第一部分是学生ID
            print('✅ 考勤页面成功解析学生ID: $studentId (完整数据: $decryptedData)');
            
            // 使用学生ID查找学生
            student = await studentProvider.getStudentById(studentId);
          }
        } else {
          // 使用URL查找（兼容旧系统）
          student = await studentProvider.getStudentByNfcUrl(decryptedData);
        }
      } catch (e) {
        print('考勤页面查找学生失败: $e');
        setState(() {
          _scanStatus = '查找学生信息失败: $e';
        });
        return;
      }

      if (student == null) {
        setState(() {
          _scanStatus = '未找到对应的学生: $decryptedData';
        });
        return;
      }

      // 安全检查
      final studentId = student.getStringValue('student_id') ?? student.id;
      bool isLocked = false;
      String lockReason = '未知原因';
      
      try {
        isLocked = await _securityService.isUserLocked(studentId, 'student');
        if (isLocked) {
          lockReason = student.getStringValue('lock_reason') ?? '未知原因';
        }
      } catch (e) {
        print('安全检查失败: $e');
        // 安全检查失败时，允许继续操作，但记录错误
        isLocked = false;
      }
      
      if (isLocked) {
        setState(() {
          _scanStatus = '🚫 学生 ${student.getStringValue('student_name')} 已被锁定: $lockReason';
        });
        return;
      }

      // 显示签到/签退选择对话框（包含安全监控数据）
      await _showAttendanceChoiceDialog(student, nfcData);

    } catch (e) {
      print('处理NFC标签失败: $e');
      setState(() {
        _scanStatus = '处理NFC数据失败: $e';
      });
    }
  }

  /// 显示考勤面板（参考积分管理页面）
  void _showAttendancePanel(BuildContext context, RecordModel student, {required bool allowActions}) {
    final attendanceProvider = context.read<AttendanceProvider>();
    final today = DateTime.now().toIso8601String().split('T')[0];
    final todayAttendance = attendanceProvider.attendanceRecords
        .where((record) => 
            record.getStringValue('student_id') == student.id &&
            record.getStringValue('date') == today)
        .toList();

    bool hasCheckedIn = todayAttendance.isNotEmpty;
    bool hasCheckedOut = hasCheckedIn && 
        (todayAttendance.first.getStringValue('check_out')?.isNotEmpty == true);

    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) {
        return SizedBox(
          height: MediaQuery.of(ctx).size.height * 0.6,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 标题栏
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                      child: Text(
                        student.getStringValue('student_name').isNotEmpty 
                            ? student.getStringValue('student_name')[0].toUpperCase() 
                            : '?',
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
                            '考勤管理 - ${student.getStringValue('student_name')}',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            '${student.getStringValue('student_id')} · ${student.getStringValue('class_name')}',
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
              ),
              const Divider(height: 1),
              
              // 今日考勤状态
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '今日考勤状态',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatusCard(
                            '签到',
                            hasCheckedIn ? '已签到' : '未签到',
                            hasCheckedIn ? AppTheme.successColor : AppTheme.textSecondary,
                            hasCheckedIn ? Icons.check_circle : Icons.cancel,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatusCard(
                            '签退',
                            hasCheckedOut ? '已签退' : '未签退',
                            hasCheckedOut ? AppTheme.successColor : AppTheme.textSecondary,
                            hasCheckedOut ? Icons.check_circle : Icons.cancel,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              const Divider(height: 1),
              
              // 考勤操作按钮
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      if (!allowActions) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.warningColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.warningColor.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.info_outline, color: AppTheme.warningColor, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  '请先通过NFC扫描学生卡以启用操作',
                                  style: TextStyle(color: AppTheme.warningColor, fontSize: 14),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      
                      // 签到按钮
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: allowActions && !hasCheckedIn 
                              ? () => _performCheckIn(student) 
                              : null,
                          icon: const Icon(Icons.login),
                          label: Text(hasCheckedIn ? '已签到' : '签到'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: allowActions && !hasCheckedIn 
                                ? AppTheme.successColor 
                                : AppTheme.textSecondary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      
                      // 签退按钮
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: allowActions && hasCheckedIn && !hasCheckedOut 
                              ? () => _performCheckOut(student) 
                              : null,
                          icon: const Icon(Icons.logout),
                          label: Text(hasCheckedOut ? '已签退' : '签退'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: allowActions && hasCheckedIn && !hasCheckedOut 
                                ? AppTheme.errorColor 
                                : AppTheme.textSecondary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                        ),
                      ),
                      
                      // 快速操作提示
                      if (allowActions) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.lightbulb_outline, color: AppTheme.primaryColor, size: 16),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  '签到后即可进行签退操作',
                                  style: TextStyle(color: AppTheme.primaryColor, fontSize: 12),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
  
  /// 构建状态卡片
  Widget _buildStatusCard(String title, String status, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            status,
            style: TextStyle(
              fontSize: 11,
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
  
  /// 执行签到
  Future<void> _performCheckIn(RecordModel student) async {
    try {
      final attendanceProvider = context.read<AttendanceProvider>();
      final studentName = student.getStringValue('student_name');
      
      final record = {
        'student': student.id,
        'student_name': studentName,
        'type': 'check_in',
        'date': DateTime.now().toIso8601String().split('T')[0],
        'check_in_time': DateTime.now().toIso8601String().split('T')[1].split('.')[0],
        'status': 'present',
      };
      
      final success = await attendanceProvider.createAttendanceRecord(record);
      
      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$studentName 签到成功'),
              backgroundColor: AppTheme.successColor,
            ),
          );
          Navigator.of(context).pop(); // 关闭面板
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('签到失败: ${attendanceProvider.error}'),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('签到失败: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }
  
  /// 执行签退
  Future<void> _performCheckOut(RecordModel student) async {
    try {
      final attendanceProvider = context.read<AttendanceProvider>();
      final studentName = student.getStringValue('student_name');
      
      final record = {
        'student': student.id,
        'student_name': studentName,
        'type': 'check_out',
        'date': DateTime.now().toIso8601String().split('T')[0],
        'check_out_time': DateTime.now().toIso8601String().split('T')[1].split('.')[0],
        'status': 'present',
      };
      
      final success = await attendanceProvider.createAttendanceRecord(record);
      
      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$studentName 签退成功'),
              backgroundColor: AppTheme.successColor,
            ),
          );
          Navigator.of(context).pop(); // 关闭面板
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('签退失败: ${attendanceProvider.error}'),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('签退失败: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  /// 显示签到/签退选择对话框（保留原方法作为备用）
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
    try {
      FlutterNfcKit.finish();
    } catch (e) {
      // 忽略关闭时的错误
    }
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
        heroTag: "scan_button",
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
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const AttendanceRecordsScreen(),
                      ),
                    );
                  },
                  icon: const Icon(Icons.history, color: Colors.white, size: 18),
                  label: const Text(
                    '查看记录',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                  ),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  // 已精简：移除顶部快捷扫描按钮，仅保留悬浮按钮入口

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