import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../providers/attendance_provider.dart';
import '../../services/pocketbase_service.dart';
import '../../services/encryption_service.dart';
import '../../theme/app_theme.dart';

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
  final EncryptionService _encryptionService = EncryptionService();
  late Animation<double> _scanAnimation;

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
    final isSmallScreen = screenHeight < 700;
    
    return Container(
      height: isSmallScreen ? screenHeight * 0.6 : screenHeight * 0.8,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppRadius.xl),
        ),
      ),
      child: Column(
        children: [
          _buildHeader(isSmallScreen),
          Expanded(
            child: _buildScannerContent(isSmallScreen),
          ),
          _buildActionButtons(),
        ],
      ),
    );
  }

  Widget _buildHeader(bool isSmallScreen) {
    return Container(
      padding: EdgeInsets.all(isSmallScreen ? AppSpacing.md : AppSpacing.lg),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppTheme.dividerColor),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.nfc,
            color: AppTheme.primaryColor,
            size: isSmallScreen ? 20 : 24,
          ),
          const SizedBox(width: AppSpacing.sm),
          Text(
            'NFC考勤扫描',
            style: TextStyle(
              fontSize: isSmallScreen ? 16 : 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const Spacer(),
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: Icon(
              Icons.close,
              size: isSmallScreen ? 20 : 24,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScannerContent(bool isSmallScreen) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isSmallScreen ? AppSpacing.lg : AppSpacing.xl),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildScannerCircle(),
          SizedBox(height: isSmallScreen ? AppSpacing.lg : AppSpacing.xl),
          _buildStatusMessage(),
          SizedBox(height: isSmallScreen ? AppSpacing.md : AppSpacing.lg),
          _buildInstructions(),
        ],
      ),
    );
  }

  Widget _buildScannerCircle() {
    return AnimatedBuilder(
      animation: Listenable.merge([_pulseAnimation, _scanAnimation]),
      builder: (context, child) {
        return Container(
          width: 200,
          height: 200,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                AppTheme.primaryColor.withOpacity(0.1),
                AppTheme.primaryColor.withOpacity(0.3),
                AppTheme.primaryColor.withOpacity(0.6),
              ],
              stops: const [0.0, 0.5, 1.0],
            ),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryColor.withOpacity(0.3),
                blurRadius: 20,
                spreadRadius: 5,
              ),
            ],
          ),
          child: Transform.scale(
            scale: _isScanning ? _pulseAnimation.value : 1.0,
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _isScanning ? AppTheme.primaryColor : AppTheme.textTertiary,
                boxShadow: [
                  BoxShadow(
                    color: (_isScanning ? AppTheme.primaryColor : AppTheme.textTertiary)
                        .withOpacity(0.3),
                    blurRadius: 15,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Icon(
                _isScanning ? Icons.nfc : Icons.nfc_outlined,
                size: 80,
                color: Colors.white,
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusMessage() {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: _getStatusColor().withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(
          color: _getStatusColor().withOpacity(0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _getStatusIcon(),
            color: _getStatusColor(),
            size: 20,
          ),
          const SizedBox(width: AppSpacing.sm),
          Text(
            _statusMessage,
            style: AppTextStyles.bodyLarge.copyWith(
              color: _getStatusColor(),
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInstructions() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppTheme.dividerColor),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.info_outline,
            color: AppTheme.primaryColor,
            size: 32,
          ),
          const SizedBox(height: AppSpacing.md),
          const Text(
            '使用说明',
            style: AppTextStyles.headline6,
          ),
          const SizedBox(height: AppSpacing.sm),
          const Text(
            '1. 确保NFC功能已开启\n'
            '2. 将学生NFC卡片靠近设备背面\n'
            '3. 保持卡片稳定直到扫描完成\n'
            '4. 系统将自动识别学生并记录考勤',
            style: AppTextStyles.bodyMedium,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: const BoxDecoration(
        border: Border(
          top: BorderSide(color: AppTheme.dividerColor),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _isScanning ? _stopScanning : _startScanning,
              icon: Icon(_isScanning ? Icons.stop : Icons.play_arrow),
              label: Text(_isScanning ? '停止扫描' : '开始扫描'),
              style: OutlinedButton.styleFrom(
                foregroundColor: _isScanning ? AppTheme.errorColor : AppTheme.primaryColor,
                side: BorderSide(
                  color: _isScanning ? AppTheme.errorColor : AppTheme.primaryColor,
                ),
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
              ),
            ),
          ),
        ],
      ),
    );
  }




  Color _getStatusColor() {
    if (_statusMessage.contains('成功')) return AppTheme.successColor;
    if (_statusMessage.contains('失败') || _statusMessage.contains('错误')) return AppTheme.errorColor;
    if (_statusMessage.contains('扫描中')) return AppTheme.primaryColor;
    return AppTheme.textSecondary;
  }

  IconData _getStatusIcon() {
    if (_statusMessage.contains('成功')) return Icons.check_circle;
    if (_statusMessage.contains('失败') || _statusMessage.contains('错误')) return Icons.error;
    if (_statusMessage.contains('扫描中')) return Icons.nfc;
    return Icons.info;
  }

  void _startScanning() async {
    final isAvailable = await FlutterNfcKit.nfcAvailability;
    if (isAvailable != NFCAvailability.available) {
      _updateStatus('NFC功能不可用', isError: true);
      return;
    }

    setState(() {
      _isScanning = true;
      _statusMessage = '正在扫描...';
    });

    _pulseController.repeat(reverse: true);
    _scanController.forward();

    try {
      await FlutterNfcKit.poll(
        timeout: Duration(seconds: 30),
        iosAlertMessage: "请将NFC卡靠近设备",
        iosMultipleTagMessage: "检测到多个NFC标签，请只使用一个",
      ).then((tag) async {
        await _processNFCTag(tag);
      }).catchError((error) {
        _updateStatus('NFC扫描失败: $error', isError: true);
        _stopScanning();
      });
    } catch (e) {
      _updateStatus('扫描失败: $e', isError: true);
      _stopScanning();
    }
  }

  void _stopScanning() {
    FlutterNfcKit.finish();
    setState(() {
      _isScanning = false;
      _statusMessage = '扫描已停止';
    });
    _pulseController.stop();
    _scanController.reset();
  }

  Future<void> _processNFCTag(dynamic tag) async {
    try {
      // 1. 读取 NFC 数据
      final nfcData = await _extractDataFromNfcTag(tag);
      if (nfcData == null || nfcData.isEmpty) {
        _updateStatus('NFC卡中没有找到有效数据', isError: true);
        _stopScanning();
        return;
      }

      _updateStatus('正在处理NFC数据...', isError: false);

      // 2. 尝试解密NFC数据
      String studentId = '';
      bool isEncrypted = false;
      
      try {
        // 检查是否是加密数据（格式: "encryptedData:salt"）
        if (nfcData.contains(':')) {
          final parts = nfcData.split(':');
          if (parts.length == 2) {
            studentId = _encryptionService.decryptNFCData(parts[0], parts[1]);
            isEncrypted = true;
          }
        } else if (nfcData.contains('docs.google.com/forms') || nfcData.startsWith('http')) {
          // URL格式（向后兼容）
          studentId = nfcData;
        } else {
          // 可能是未加密的学生ID
          studentId = nfcData;
        }
      } catch (e) {
        // 解密失败，尝试作为普通数据使用
        studentId = nfcData;
        print('解密失败，使用原始数据: $e');
      }

      _updateStatus('正在查找学生信息...', isError: false);

      // 3. 根据数据类型查找学生
      RecordModel? student;
      if (isEncrypted || (!studentId.startsWith('http') && !studentId.contains('docs.google.com'))) {
        // 使用学生ID查找
        student = await PocketBaseService.instance.getStudentByStudentId(studentId);
      } else {
        // 使用URL查找（向后兼容）
        student = await PocketBaseService.instance.getStudentByNfcUrl(studentId);
      }

      if (student == null) {
        _updateStatus('未找到对应的学生，请检查NFC卡数据是否正确', isError: true);
        _stopScanning();
        return;
      }

      // 获取学生ID
      final studentIdFromRecord = student.getStringValue("student_id") ?? 
                       student.getStringValue("studentId") ?? 
                       student.getStringValue("id");
      final studentName = student.getStringValue("student_name");
      _updateStatus('找到学生: $studentName', isError: false);

      // 3. 记录考勤
      final today = DateTime.now().toIso8601String().split("T").first;
      final now = DateTime.now().toIso8601String();

      // 获取当前登录用户信息
      final currentUser = PocketBaseService.instance.currentUser;
      final teacherId = currentUser?.getStringValue("id");
      final teacherName = currentUser?.getStringValue("name") ?? currentUser?.getStringValue("email");

      await PocketBaseService.instance.createAttendanceRecord({
        "student_id": studentIdFromRecord,
        "student_name": student.getStringValue("student_name"),
        "center": student.getStringValue("center"),
        "branch_name": student.getStringValue("branch_name"),
        "teacher_id": teacherId,
        "teacher_name": teacherName,
        "check_in": now,
        "status": "present",
        "notes": "NFC扫描签到",
      });
      _updateStatus('考勤记录成功: $studentName', isError: false);
      _stopScanning();

    } catch (e) {
      _updateStatus('处理失败: $e', isError: true);
      _stopScanning();
    }
  }

  // 从NFC标签提取数据（支持加密和URL格式）
  Future<String?> _extractDataFromNfcTag(dynamic tag) async {
    try {
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
                return String.fromCharCodes(payload);
              }
            }
          }
        } else if (data.containsKey('text')) {
          // 文本格式
          return data['text'] as String;
        } else if (data.containsKey('url')) {
          // URL格式
          return data['url'] as String;
        }
      }
      return null;
    } catch (e) {
      print('提取NFC数据失败: $e');
      return null;
    }
  }

  /// 从NFC标签中提取URL
  Future<String?> _extractUrlFromNfcTag(dynamic tag) async {
    try {
      final ndefRecords = await FlutterNfcKit.readNDEFRecords();

      for (var record in ndefRecords) {
        final payload = record.payload;
        if (payload == null || payload.isEmpty) continue;

        var content = String.fromCharCodes(payload);

        // 直接使用NFC卡中的原始URL，不添加https://前缀
        // Google Forms
        if (content.contains('docs.google.com/forms')) {
          return content;
        }

        // 普通 URL
        if (content.startsWith('http')) {
          return content;
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  Future<void> _recordAttendance(Map<String, dynamic> studentInfo) async {
    try {
      final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
      
      final now = DateTime.now();
      final today = now.toIso8601String().split('T')[0];
      final timeString = now.toIso8601String().split('T')[1].split('.')[0];
      
      // 检查今天是否已经签到
      final todayAttendance = attendanceProvider.attendanceRecords
          .where((record) => 
              record.getStringValue('student') == studentInfo['id'] &&
              record.getStringValue('date') == today)
          .toList();

      String status = 'present';
      String notes = 'NFC签到';
      String checkInTime = timeString;
      String checkOutTime = '';

      if (todayAttendance.isNotEmpty) {
        // 已有记录，执行签退
        final existingRecord = todayAttendance.first;
        if (existingRecord.getStringValue('check_out_time')?.isNotEmpty == true) {
          _updateStatus('今天已经完成签到和签退', isError: true);
          return;
        } else {
          // 执行签退
          checkOutTime = timeString;
          notes = 'NFC签退';
        }
      }
      
      final attendanceData = {
        'student': studentInfo['id'],
        'student_name': studentInfo['name'],
        'center': studentInfo['center'],
        'standard': studentInfo['class'],
        'check_in_time': checkInTime,
        'check_out_time': checkOutTime,
        'status': status,
        'date': today,
        'method': 'NFC',
        'studentUrl': studentInfo['url'],
        'notes': notes,
      };

      final success = await attendanceProvider.createAttendanceRecord(attendanceData);
      
      if (success) {
        final action = checkOutTime.isNotEmpty ? '签退' : '签到';
        _updateStatus('${studentInfo['name']} $action 成功！', isSuccess: true);
        _stopScanning();
        
        // 显示成功动画
        _showSuccessAnimation();
      } else {
        _updateStatus('考勤记录失败，请重试', isError: true);
      }
    } catch (e) {
      _updateStatus('记录考勤失败: $e', isError: true);
    }
  }

  void _updateStatus(String message, {bool isError = false, bool isSuccess = false}) {
    setState(() {
      _statusMessage = message;
    });

    if (isSuccess) {
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted && Navigator.canPop(context)) {
          Navigator.pop(context);
        }
      });
    }
  }

  void _showSuccessAnimation() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.xl),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(AppRadius.xl),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.check_circle,
                color: AppTheme.successColor,
                size: 64,
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                '签到成功！',
                style: AppTextStyles.headline4.copyWith(
                  color: AppTheme.successColor,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                _statusMessage,
                style: AppTextStyles.bodyLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.lg),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('确定'),
              ),
            ],
          ),
        ),
      ),
    );
  }

}