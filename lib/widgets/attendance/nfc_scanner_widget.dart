import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import 'dart:convert';
import 'dart:typed_data';
import '../../providers/attendance_provider.dart';
import '../../services/pocketbase_service.dart';
import '../../services/encryption_service.dart';
import '../../services/security_service.dart';
import '../../providers/student_provider.dart';
import '../../theme/app_theme.dart';
import '../../services/nfc_safe_scanner_service.dart';

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
  final SecurityService _securityService = SecurityService();
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
            Color(0xFF10B981),
            Color(0xFF059669),
          ],
        ),
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(28),
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF10B981).withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.nfc,
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
                  'NFC 智能考勤',
                  style: TextStyle(
                    fontSize: isSmallScreen ? 18 : 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
                Text(
                  '企业级考勤管理系统',
                  style: TextStyle(
                    fontSize: isSmallScreen ? 12 : 14,
                    color: Colors.white.withOpacity(0.8),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(
                Icons.close,
                color: Colors.white,
                size: 24,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnterpriseScannerContent(bool isSmallScreen) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isSmallScreen ? 20 : 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildEnterpriseScannerCircle(),
          SizedBox(height: isSmallScreen ? 24 : 32),
          _buildEnterpriseStatusCard(),
          SizedBox(height: isSmallScreen ? 20 : 24),
          _buildEnterpriseInstructions(),
        ],
      ),
    );
  }

  Widget _buildEnterpriseScannerCircle() {
    return AnimatedBuilder(
      animation: Listenable.merge([_pulseAnimation, _scanAnimation]),
      builder: (context, child) {
        return Container(
          width: 240,
          height: 240,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                const Color(0xFF10B981).withOpacity(0.05),
                const Color(0xFF10B981).withOpacity(0.15),
                const Color(0xFF10B981).withOpacity(0.25),
                const Color(0xFF10B981).withOpacity(0.4),
              ],
              stops: const [0.0, 0.3, 0.6, 1.0],
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF10B981).withOpacity(0.2),
                blurRadius: 30,
                spreadRadius: 8,
              ),
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 15,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Transform.scale(
            scale: _isScanning ? _pulseAnimation.value : 1.0,
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: _isScanning 
                    ? [
                        const Color(0xFF10B981),
                        const Color(0xFF059669),
                      ]
                    : [
                        const Color(0xFF6B7280),
                        const Color(0xFF4B5563),
                      ],
                ),
                boxShadow: [
                  BoxShadow(
                    color: (_isScanning ? const Color(0xFF10B981) : const Color(0xFF6B7280))
                        .withOpacity(0.4),
                    blurRadius: 20,
                    spreadRadius: 3,
                  ),
                ],
                border: Border.all(
                  color: Colors.white.withOpacity(0.3),
                  width: 3,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Icon(
                      _isScanning ? Icons.nfc : Icons.nfc_outlined,
                      size: 60,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _isScanning ? '扫描中...' : '准备扫描',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildEnterpriseStatusCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white,
            const Color(0xFFF8FAFC),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
          BoxShadow(
            color: _getStatusColor().withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
        border: Border.all(
          color: _getStatusColor().withOpacity(0.2),
          width: 1.5,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _getStatusColor().withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              _getStatusIcon(),
              color: _getStatusColor(),
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '系统状态',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF6B7280),
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _statusMessage,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: _getStatusColor(),
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnterpriseInstructions() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFF8FAFC),
            Color(0xFFF1F5F9),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
        border: Border.all(
          color: const Color(0xFFE2E8F0),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [
                  Color(0xFF10B981),
                  Color(0xFF059669),
                ],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.info_outline,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            '使用指南',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                _buildInstructionStep('1', '确保NFC功能已开启'),
                const SizedBox(height: 12),
                _buildInstructionStep('2', '将学生NFC卡片靠近设备背面'),
                const SizedBox(height: 12),
                _buildInstructionStep('3', '保持卡片稳定直到扫描完成'),
                const SizedBox(height: 12),
                _buildInstructionStep('4', '系统将自动识别学生并记录考勤'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInstructionStep(String number, String text) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [
                Color(0xFF10B981),
                Color(0xFF059669),
              ],
            ),
            borderRadius: BorderRadius.circular(12),
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
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF374151),
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
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
              _isScanning ? const Color(0xFFEF4444) : const Color(0xFF10B981),
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
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onPressed,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  icon,
                  color: Colors.white,
                  size: isSmallScreen ? 20 : 24,
                ),
                const SizedBox(width: 12),
                Text(
                  text,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: isSmallScreen ? 16 : 18,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ),
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
      final result = await NFCSafeScannerService.instance.safeScanNFC(
        timeout: const Duration(seconds: 10),
        requireStudent: true,
      );

      if (!mounted) return;

      if (result.isSuccess && result.student != null) {
        _updateStatus('找到学生: ${result.student!.getStringValue('student_name')}', isError: false);

        try {
          final now = DateTime.now().toIso8601String();
          final student = result.student!;
          final studentIdFromRecord = student.getStringValue("student_id") ??
              student.getStringValue("studentId") ??
              student.getStringValue("id");
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

          _updateStatus('考勤记录成功: ${student.getStringValue('student_name')}', isError: false);
        } catch (e) {
          _updateStatus('记录考勤失败: $e', isError: true);
        }

        _stopScanning();
      } else {
        _updateStatus(result.errorMessage ?? '扫描失败', isError: true);
        _stopScanning();
      }
    } catch (e) {
      _updateStatus('扫描失败: $e', isError: true);
      _stopScanning();
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

      // 2. 尝试解密NFC数据（与管理界面一致）
      String studentId = '';
      bool isEncrypted = false;
      try {
        await _encryptionService.ensureKeysLoaded();
        if (nfcData.contains(':')) {
          final parts = nfcData.split(':');
          if (parts.length == 2) {
            final encryptedPart = parts[0].trim();
            final saltPart = parts[1].trim();
            final normalizedEncrypted = encryptedPart.replaceAll('-', '+').replaceAll('_', '/');
            final decrypted = _encryptionService.decryptNFCData(normalizedEncrypted, saltPart);
            // 明文应为 学号_随机串
            final idx = decrypted.indexOf('_');
            studentId = idx > 0 ? decrypted.substring(0, idx) : decrypted;
            isEncrypted = true;
            print('🔓 解密成功: plaintext='+decrypted+' → studentId='+studentId);
          }
        } else if (nfcData.contains('docs.google.com/forms') || nfcData.startsWith('http')) {
          // 兼容旧URL卡
          studentId = nfcData;
        } else {
          // 未加密纯ID
          studentId = nfcData;
        }
      } catch (e) {
        print('🔴 解密失败，使用原始数据: $e');
        studentId = nfcData;
      }

      _updateStatus('正在查找学生信息...', isError: false);

      // 3. 根据数据类型查找学生（容错匹配）
      RecordModel? student;
      try {
        if (isEncrypted || (!studentId.startsWith('http') && !studentId.contains('docs.google.com'))) {
          // 先按精确ID匹配
          student = await PocketBaseService.instance.getStudentByStudentId(studentId);
          // 如未命中，做一次容错查找（本地列表）
          if (student == null) {
            final provider = Provider.of<StudentProvider>(context, listen: false);
            String _normalize(String s) => s.replaceAll(RegExp(r'\s+'), '').toUpperCase();
            String _stripStu(String s) => s.replaceFirst(RegExp(r'^STU'), '');
            final target = _stripStu(_normalize(studentId));
            for (final s in provider.students) {
              final raw = (s.data['student_id'] ?? '').toString();
              final norm = _stripStu(_normalize(raw));
              if (norm == target) { student = s; break; }
            }
          }
        } else {
          student = await PocketBaseService.instance.getStudentByNfcUrl(studentId);
        }
      } catch (e) {
        print('查找学生失败: $e');
        _updateStatus('查找学生信息失败: $e', isError: true);
        _stopScanning();
        return;
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
      
      // 安全检查
      bool isLocked = false;
      try {
        isLocked = await _securityService.isUserLocked(studentIdFromRecord, 'student');
      } catch (e) {
        print('安全检查失败: $e');
        // 安全检查失败时，允许继续操作
        isLocked = false;
      }
      
      if (isLocked) {
        final lockReason = student.getStringValue('lock_reason') ?? '未知原因';
        _updateStatus('🚫 学生 $studentName 已被锁定: $lockReason', isError: true);
        _stopScanning();
        return;
      }
      
      _updateStatus('找到学生: $studentName', isError: false);

      // 4. 记录考勤
      try {
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
        print('记录考勤失败: $e');
        _updateStatus('记录考勤失败: $e', isError: true);
        _stopScanning();
      }

    } catch (e) {
      print('处理NFC标签失败: $e');
      _updateStatus('处理失败: $e', isError: true);
      _stopScanning();
    }
  }

  // 从NFC标签提取数据（支持加密和URL格式）- 与管理界面保持一致
  Future<String?> _extractDataFromNfcTag(dynamic tag) async {
    try {
      // 使用新的API读取NDEF记录
      if (tag.ndefAvailable == true) {
        final records = await FlutterNfcKit.readNDEFRecords(cached: false);
        
        print('📋 读取到 ${records.length} 条NDEF记录');
        
        for (var record in records) {
          final payload = record.payload;
          if (payload == null) continue;

          try {
            List<int> bytes;
            if (payload is Uint8List) {
              bytes = payload;
            } else if (payload is List<int>) {
              bytes = payload;
            } else if (payload is String) {
              // 十六进制字符串
              final hexString = payload as String;
              bytes = <int>[];
              for (int i = 0; i < hexString.length; i += 2) {
                bytes.add(int.parse(hexString.substring(i, i + 2), radix: 16));
              }
            } else {
              // 未知类型，跳过
              continue;
            }

            if (bytes.isEmpty) continue;

            final status = bytes[0];
            final languageCodeLength = status & 0x1F; // 低5位为语言码长度
            final textStartIndex = 1 + languageCodeLength;
            if (textStartIndex <= bytes.length) {
              final textBytes = bytes.sublist(textStartIndex);
              final content = utf8.decode(textBytes);
              if (content.isNotEmpty) {
                print('✅ 成功读取数据: $content');
                return content;
              }
            }
          } catch (e) {
            print('⚠️ NDEF Text 解析失败: $e; payload类型=${payload.runtimeType}');
            continue;
          }
        }
      }
      
      // 备用方法：尝试从标签ID获取数据
      if (tag.id != null && tag.id!.isNotEmpty) {
        return tag.id!.toUpperCase();
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