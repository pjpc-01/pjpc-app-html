import 'dart:convert';
import 'dart:typed_data';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:ndef/record.dart'; 
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../theme/app_theme.dart';
import '../../services/security_service.dart';
import '../../services/alert_service.dart';
import '../../services/encryption_service.dart';
import '../../services/pocketbase_service.dart';
import '../../services/nfc_write_service.dart';
import '../../providers/student_provider.dart';
import '../../providers/teacher_provider.dart';
import 'nfc_test_tool.dart';

class NfcReadWriteScreen extends StatefulWidget {
  const NfcReadWriteScreen({super.key});

  @override
  State<NfcReadWriteScreen> createState() => _NfcReadWriteScreenState();
}

class _NfcReadWriteScreenState extends State<NfcReadWriteScreen>
    with TickerProviderStateMixin {
  String _scanStatus = '等待NFC操作...';
  String _lastReadData = '';
  bool _isScanning = false;
  
  // 安全监控服务
  final SecurityService _securityService = SecurityService();
  final AlertService _alertService = AlertService();
  final EncryptionService _encryptionService = EncryptionService();
  final PocketBaseService _pocketBaseService = PocketBaseService.instance;
  
  // 安全状态
  String _securityStatus = 'normal';
  int _riskScore = 0;
  Map<String, dynamic> _securityFlags = {};
  
  // 加密状态
  bool _isEncrypted = false;
  String _encryptionStatus = '未加密';
  
  // 学生选择相关
  String? _selectedStudentId;
  String? _selectedTeacherId;
  String _nfcOperationStatus = '准备就绪';
  bool _isNfcOperating = false;
  String _currentMode = 'student'; // 'student' 或 'teacher'
  
  // 搜索相关
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<Color?> _colorAnimation;

  @override
  void initState() {
    super.initState();
    _initAnimations();
    _checkNfcAvailability();
    // 延迟加载数据，避免在build过程中调用setState
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
      // 确保先加载服务端密钥
      _encryptionService.ensureKeysLoaded();
    });
  }

  // 智能搜索功能
  List<RecordModel> _filterStudents(List<RecordModel> students, String query) {
    if (query.isEmpty) return students;
    
    final lowerQuery = query.toLowerCase();
    print('搜索学生: "$query" (${students.length} 个学生)');
    
    final filteredStudents = students.where((student) {
      final studentName = (student.data['student_name'] ?? '').toString().toLowerCase();
      final studentId = (student.data['student_id'] ?? '').toString().toLowerCase();
      final center = (student.data['center'] ?? '').toString().toLowerCase();
      
      // 调试信息 - 显示所有字段
      if (query.length >= 1) {
        print('检查学生: 姓名="$studentName", 学号="$studentId", 中心="$center"');
        print('搜索查询: "$lowerQuery"');
      }
      
      // 多种匹配方式
      bool nameMatch = studentName.contains(lowerQuery);
      bool idMatch = studentId.contains(lowerQuery);
      bool centerMatch = center.contains(lowerQuery);
      
      // 精确匹配
      if (nameMatch || idMatch || centerMatch) {
        String matchType = '';
        if (nameMatch) matchType += '姓名';
        if (idMatch) matchType += (matchType.isNotEmpty ? '+学号' : '学号');
        if (centerMatch) matchType += (matchType.isNotEmpty ? '+中心' : '中心');
        print('精确匹配: $studentName ($studentId) - 匹配: $matchType');
        return true;
      }
      
      // 部分匹配 - 学号的部分匹配
      if (studentId.isNotEmpty && lowerQuery.length >= 2) {
        // 检查学号是否以查询开始
        if (studentId.startsWith(lowerQuery)) {
          print('学号前缀匹配: $studentName ($studentId)');
          return true;
        }
        // 检查学号是否包含查询
        if (studentId.contains(lowerQuery)) {
          print('学号包含匹配: $studentName ($studentId)');
          return true;
        }
      }
      
      // 模糊匹配 - 检查是否包含查询的每个字符
      if (_fuzzyMatch(studentName, lowerQuery) ||
          _fuzzyMatch(studentId, lowerQuery) ||
          _fuzzyMatch(center, lowerQuery)) {
        print('模糊匹配: $studentName ($studentId)');
        return true;
      }
      
      return false;
    }).toList();
    
    print('搜索结果: ${filteredStudents.length} 个匹配的学生');
    return filteredStudents;
  }
  
  List<RecordModel> _filterTeachers(List<RecordModel> teachers, String query) {
    if (query.isEmpty) return teachers;
    
    final lowerQuery = query.toLowerCase();
    return teachers.where((teacher) {
      final teacherName = (teacher.data['name'] ?? '').toString().toLowerCase();
      final teacherId = (teacher.data['teacher_id'] ?? '').toString().toLowerCase();
      final department = (teacher.data['department'] ?? '').toString().toLowerCase();
      
      // 精确匹配
      if (teacherName.contains(lowerQuery) || 
          teacherId.contains(lowerQuery) || 
          department.contains(lowerQuery)) {
        return true;
      }
      
      // 模糊匹配
      if (_fuzzyMatch(teacherName, lowerQuery) ||
          _fuzzyMatch(teacherId, lowerQuery) ||
          _fuzzyMatch(department, lowerQuery)) {
        return true;
      }
      
      return false;
    }).toList();
  }
  
  // 模糊匹配算法
  bool _fuzzyMatch(String text, String query) {
    if (query.isEmpty) return true;
    if (text.isEmpty) return false;
    
    int textIndex = 0;
    int queryIndex = 0;
    
    while (textIndex < text.length && queryIndex < query.length) {
      if (text[textIndex] == query[queryIndex]) {
        queryIndex++;
      }
      textIndex++;
    }
    
    return queryIndex == query.length;
  }
  
  // 生成随机字符串
  String _generateRandomString(int length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    final random = Random();
    return String.fromCharCodes(
      Iterable.generate(length, (_) => chars.codeUnitAt(random.nextInt(chars.length)))
    );
  }
  Future<void> _loadData() async {
    try {
      final studentProvider = Provider.of<StudentProvider>(context, listen: false);
      final teacherProvider = Provider.of<TeacherProvider>(context, listen: false);
      
      // 如果数据为空，则加载数据
      if (studentProvider.students.isEmpty) {
        await studentProvider.loadStudents();
      }
      
      if (teacherProvider.teachers.isEmpty) {
        await teacherProvider.loadTeachers();
      }
      
      // 检查加载结果
      if (teacherProvider.error != null) {
        print('老师数据加载失败: ${teacherProvider.error}');
      } else {
        print('老师数据加载成功，共 ${teacherProvider.teachers.length} 条记录');
      }
      
    } catch (e) {
      print('加载数据失败: $e');
    }
  }

  void _initAnimations() {
    _animationController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));

    _colorAnimation = ColorTween(
      begin: Colors.blue,
      end: Colors.orange,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _animationController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _checkNfcAvailability() async {
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      setState(() {
        _scanStatus =
            availability != NFCAvailability.not_supported ? 'NFC可用，准备就绪' : 'NFC不可用';
      });
    } catch (e) {
      setState(() {
        _scanStatus = 'NFC状态检查失败';
      });
    }
  }

  Widget _buildModernHeader() {
    return Container(
      margin: const EdgeInsets.all(16),
      child: Card(
        elevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: LinearGradient(
              colors: [
                const Color(0xFF1E3A8A),
                const Color(0xFF3B82F6).withOpacity(0.8),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
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
                        Icons.nfc,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'NFC读写管理',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '管理NFC卡片数据',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.8),
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: _scanStatus.contains('可用')
                            ? Colors.green
                            : Colors.orange,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _scanStatus.contains('可用') ? '就绪' : '待机',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNfcStatusCard() {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: [
              Colors.white,
              Colors.grey.shade50,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                AnimatedBuilder(
                  animation: _animationController,
                  builder: (context, child) {
                    return Transform.scale(
                      scale: _isScanning ? _scaleAnimation.value : 1.0,
                      child: Icon(
                        _isScanning ? Icons.radar : Icons.info_outline,
                        color:
                            _isScanning ? _colorAnimation.value : Colors.blue,
                        size: 28,
                      ),
                    );
                  },
                ),
                const SizedBox(width: 12),
                const Text(
                  'NFC状态',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E3A8A),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _scanStatus.contains('失败') ||
                        _scanStatus.contains('不可用')
                    ? Colors.red.withOpacity(0.1)
                    : _scanStatus.contains('成功')
                        ? Colors.green.withOpacity(0.1)
                        : Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _scanStatus.contains('失败') ||
                          _scanStatus.contains('不可用')
                      ? Colors.red.withOpacity(0.3)
                      : _scanStatus.contains('成功')
                          ? Colors.green.withOpacity(0.3)
                          : Colors.blue.withOpacity(0.3),
                ),
              ),
              child: Text(
                _scanStatus,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: _scanStatus.contains('失败') ||
                          _scanStatus.contains('不可用')
                      ? Colors.red.shade700
                      : _scanStatus.contains('成功')
                          ? Colors.green.shade700
                          : Colors.blue.shade700,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReadSection() {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.visibility, color: Color(0xFF1E3A8A), size: 24),
                SizedBox(width: 12),
                Text(
                  'NFC读取',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E3A8A),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _isScanning ? null : () => _startNfcRead(),
                icon: Icon(_isScanning ? Icons.hourglass_empty : Icons.nfc),
                label: Text(_isScanning ? '读取中...' : '开始读取'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blueAccent,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 2,
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              '读取结果',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF374151),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              constraints: const BoxConstraints(minHeight: 100),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _lastReadData.isEmpty ? '无数据' : _lastReadData,
                    style: const TextStyle(
                      fontSize: 14,
                      fontFamily: 'monospace',
                    ),
                  ),
                  // 显示安全状态
                  if (_lastReadData.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    _buildSecurityStatusWidget(),
                  ],
                  if (_lastReadData.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton.icon(
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: _lastReadData));
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('已复制到剪贴板')),
                            );
                          },
                          icon: const Icon(Icons.copy, size: 16),
                          label: const Text('复制'),
                        ),
                        const SizedBox(width: 8),
                        TextButton.icon(
                          onPressed: () {
                            setState(() {
                              _lastReadData = '';
                            });
                          },
                          icon: const Icon(Icons.clear, size: 16),
                          label: const Text('清除'),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWriteSection() {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.edit, color: Color(0xFF1E3A8A), size: 24),
                SizedBox(width: 12),
                Text(
                  'NFC写入',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E3A8A),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // 模式选择
            _buildModeSelectionSection(),
            const SizedBox(height: 16),
            
            // 用户选择部分
            _buildUserSelectionSection(),
            const SizedBox(height: 16),
            
            // 快速操作按钮
            _buildQuickOperationButtons(),
          ],
        ),
      ),
    );
  }

  Future<void> _startNfcRead() async {
    if (_isScanning) return;

    setState(() {
      _isScanning = true;
      _scanStatus = '请将NFC卡片靠近设备...';
      _lastReadData = '';
    });

    _animationController.repeat();

    try {
      // 统一走通用读取实现，避免与其它入口逻辑不一致
      final readData = await _readFromNfcCard();

      if (readData.isNotEmpty) {
        // 尝试解密数据
        String decryptedData = readData;
        bool decryptionSuccessful = false;
        
        try {
          // 检查是否是加密数据（格式: "encryptedData:salt"）
          if (readData.contains(':')) {
            final parts = readData.split(':');
            if (parts.length == 2) {
              await _encryptionService.ensureKeysLoaded();
              final encryptedPart = parts[0].trim();
              final saltPart = parts[1].trim();
              final normalizedEncrypted = encryptedPart.replaceAll('-', '+').replaceAll('_', '/');
              print('🔎 待解密数据: encrypted="'+normalizedEncrypted+'" salt="'+saltPart+'"');
              _encryptionService.logAvailableVersions();
              decryptedData = _encryptionService.decryptNFCData(normalizedEncrypted, saltPart);
              decryptionSuccessful = true;
              _isEncrypted = true;
              _encryptionStatus = '已解密';
            }
          } else if (readData.length > 20 && readData.contains('=')) {
            // 可能是base64编码的加密数据，尝试解密
            decryptedData = await _attemptDecryption(readData);
            decryptionSuccessful = true;
            _isEncrypted = true;
            _encryptionStatus = '已解密';
          } else {
            _isEncrypted = false;
            _encryptionStatus = '未加密';
          }
        } catch (e) {
          print('解密失败，使用原始数据: $e');
          decryptedData = readData;
          _isEncrypted = false;
          _encryptionStatus = '解密失败';
        }
        
        // 进行安全检测
        await _performSecurityCheck(decryptedData);
        
        setState(() {
          _lastReadData = decryptedData;
          _scanStatus = '读取成功';
        });
        
        // 根据安全状态显示不同的消息
        Color snackBarColor = Colors.green;
        String message = '成功读取: $decryptedData';
        
        if (_securityStatus == 'locked') {
          snackBarColor = Colors.red;
          message = '⚠️ 检测到高风险NFC数据: $decryptedData';
        } else if (_riskScore >= 50) {
          snackBarColor = Colors.orange;
          message = '⚠️ 检测到可疑NFC数据: $decryptedData';
        }
        
        if (_isEncrypted) {
          message += ' (已解密)';
        }
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: snackBarColor,
            duration: const Duration(seconds: 3),
          ),
        );
      } else {
        setState(() {
          _scanStatus = '未读取到有效数据';
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('NFC卡片中无有效数据'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _scanStatus = '读取失败: ${e.toString()}';
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('读取失败: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isScanning = false;
      });
      _animationController.stop();
    }
  }

  // 尝试解密NFC数据
  Future<String> _attemptDecryption(String encryptedData) async {
    try {
      // 这里需要根据实际情况获取盐值
      // 在实际应用中，盐值可能存储在数据库中或从其他来源获取
      final commonSalts = ['A7X9B8Y2', 'TCH001-X9Y2', 'NFC_SALT_2024'];
      
      for (final salt in commonSalts) {
        try {
          final decrypted = _encryptionService.decryptNFCData(encryptedData, salt);
          if (decrypted.isNotEmpty) {
            print('使用盐值 $salt 解密成功');
            return decrypted;
          }
        } catch (e) {
          // 继续尝试下一个盐值
          continue;
        }
      }
      
      throw Exception('无法解密数据');
    } catch (e) {
      throw Exception('解密失败: $e');
    }
  }

  // 执行安全检测
  Future<void> _performSecurityCheck(String nfcData) async {
    try {
      // 模拟用户ID（实际应用中应该从NFC数据中解析）
      String userId = 'unknown';
      if (nfcData.contains('student') || nfcData.contains('B') || nfcData.contains('G') || nfcData.contains('T')) {
        userId = 'student_user';
      } else if (nfcData.contains('teacher') || nfcData.contains('TCH')) {
        userId = 'teacher_user';
      }
      
      final swipeData = {
        'timestamp': DateTime.now().toIso8601String(),
        'location': 'NFC管理设备',
        'device_id': 'nfc_manager_001',
      };
      
      // 计算风险评分
      _riskScore = await _securityService.calculateRiskScore(userId, swipeData);
      
      // 检测异常
      final rapidSuccessive = await _securityService.detectRapidSuccessiveSwipes(userId);
      final unusualTime = _securityService.detectUnusualTime(DateTime.now());
      
      // 更新安全标志
      _securityFlags = {
        'rapid_successive': rapidSuccessive,
        'unusual_time': unusualTime,
        'location_mismatch': false,
        'device_mismatch': false,
      };
      
      // 确定安全状态
      if (_riskScore >= 80) {
        _securityStatus = 'locked';
        await _alertService.sendAlertToAdmin('nfc_manager', userId, "高风险NFC操作", _riskScore);
      } else if (_riskScore >= 50) {
        _securityStatus = 'suspicious';
      } else {
        _securityStatus = 'normal';
      }
      
      print('NFC安全检测完成 - 风险评分: $_riskScore, 状态: $_securityStatus');
      
    } catch (e) {
      print('安全检测失败: $e');
      _securityStatus = 'normal';
      _riskScore = 0;
    }
  }

  // 构建安全状态显示组件
  Widget _buildSecurityStatusWidget() {
    Color statusColor;
    IconData statusIcon;
    String statusText;
    
    switch (_securityStatus) {
      case 'locked':
        statusColor = Colors.red;
        statusIcon = Icons.lock;
        statusText = '高风险';
        break;
      case 'suspicious':
        statusColor = Colors.orange;
        statusIcon = Icons.warning;
        statusText = '可疑';
        break;
      default:
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        statusText = '正常';
    }
    
    return Column(
      children: [
        // 安全状态
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: statusColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: statusColor.withOpacity(0.3)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(statusIcon, size: 16, color: statusColor),
              const SizedBox(width: 4),
              Text(
                '安全状态: $statusText (风险评分: $_riskScore)',
                style: TextStyle(
                  fontSize: 12,
                  color: statusColor,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        // 加密状态
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: _isEncrypted ? Colors.blue.withOpacity(0.1) : Colors.grey.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _isEncrypted ? Colors.blue.withOpacity(0.3) : Colors.grey.withOpacity(0.3)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                _isEncrypted ? Icons.lock : Icons.lock_open,
                size: 16,
                color: _isEncrypted ? Colors.blue : Colors.grey,
              ),
              const SizedBox(width: 4),
              Text(
                '加密状态: $_encryptionStatus',
                style: TextStyle(
                  fontSize: 12,
                  color: _isEncrypted ? Colors.blue : Colors.grey,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('NFC读写管理'),
        backgroundColor: const Color(0xFF1E3A8A),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.bug_report),
            tooltip: 'NFC测试工具',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => NFCFixVerificationTool(),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          children: [
            _buildModernHeader(),
            _buildNfcStatusCard(),
            _buildReadSection(),
            _buildWriteSection(),
            _buildOperationStatusCard(),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  // 模式选择部分
  Widget _buildModeSelectionSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.category, color: Color(0xFF1E3A8A), size: 20),
              SizedBox(width: 8),
              Text(
                '选择用户类型',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E3A8A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: RadioListTile<String>(
                  title: const Text('学生'),
                  value: 'student',
                  groupValue: _currentMode,
                  onChanged: (value) {
    setState(() {
                      _currentMode = value!;
                      _selectedStudentId = null;
                      _selectedTeacherId = null;
                    });
                  },
                ),
              ),
              Expanded(
                child: RadioListTile<String>(
                  title: const Text('老师'),
                  value: 'teacher',
                  groupValue: _currentMode,
                  onChanged: (value) {
                    setState(() {
                      _currentMode = value!;
                      _selectedStudentId = null;
                      _selectedTeacherId = null;
                    });
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // 用户选择部分
  Widget _buildUserSelectionSection() {
    if (_currentMode == 'student') {
      return _buildStudentSelectionSection();
    } else {
      return _buildTeacherSelectionSection();
    }
  }

  // 学生选择部分
  Widget _buildStudentSelectionSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.person, color: Color(0xFF1E3A8A), size: 20),
              SizedBox(width: 8),
              Text(
                '学生NFC卡管理',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E3A8A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // 搜索框
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              labelText: '搜索学生',
              hintText: '输入学生姓名、学号或中心',
              helperText: '支持学号搜索，如输入"001"可找到学号为"STU001"的学生',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _searchQuery = '';
                        });
                      },
                    )
                  : null,
            ),
            onChanged: (value) {
              setState(() {
                _searchQuery = value.toLowerCase();
              });
            },
          ),
          const SizedBox(height: 12),
          
          Consumer<StudentProvider>(
            builder: (context, studentProvider, child) {
              if (studentProvider.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }
              
              final allStudents = studentProvider.students;
              final students = _filterStudents(allStudents, _searchQuery);
              
              if (allStudents.isEmpty) {
                return Column(
                  children: [
                    const Center(
                      child: Text('暂无学生数据', style: TextStyle(color: Colors.grey)),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton.icon(
                      onPressed: () async {
                        await studentProvider.loadStudents();
                      },
                      icon: const Icon(Icons.refresh, size: 16),
                      label: const Text('刷新数据'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      ),
                    ),
                  ],
                );
              }
              
              if (students.isEmpty && _searchQuery.isNotEmpty) {
                return Column(
                  children: [
                    const Center(
                      child: Text('未找到匹配的学生', style: TextStyle(color: Colors.grey)),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton.icon(
                      onPressed: () {
                        _searchController.clear();
      setState(() {
                          _searchQuery = '';
                        });
                      },
                      icon: const Icon(Icons.clear, size: 16),
                      label: const Text('清除搜索'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      ),
                    ),
                  ],
                );
              }
              
              return DropdownButtonFormField<String>(
                value: _selectedStudentId,
                decoration: InputDecoration(
                  labelText: '选择要写入NFC卡的学生',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  prefixIcon: const Icon(Icons.person),
                ),
                isExpanded: true,
                items: students.map((student) {
                  final studentName = (student.data['student_name'] ?? '').toString();
                  final studentId = (student.data['student_id'] ?? '').toString();
                  
                  return DropdownMenuItem<String>(
                    value: student.id,
                    child: Text(
                      '$studentName ($studentId)',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedStudentId = value;
                  });
                },
              );
            },
          ),
        ],
      ),
    );
  }

  // 老师选择部分
  Widget _buildTeacherSelectionSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.school, color: Color(0xFF1E3A8A), size: 20),
              SizedBox(width: 8),
              Text(
                '老师NFC卡管理',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E3A8A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // 搜索框
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              labelText: '搜索老师',
              hintText: '输入老师姓名、工号或部门',
              helperText: '支持模糊搜索，如输入"李"可找到"李老师"',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _searchQuery = '';
                        });
                      },
                    )
                  : null,
            ),
            onChanged: (value) {
              setState(() {
                _searchQuery = value.toLowerCase();
              });
            },
          ),
          const SizedBox(height: 12),
          
          Consumer<TeacherProvider>(
            builder: (context, teacherProvider, child) {
              if (teacherProvider.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }
              
              // 显示错误信息
              if (teacherProvider.error != null) {
                return Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error, color: Colors.red, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              '加载老师数据失败: ${teacherProvider.error}',
                              style: const TextStyle(color: Colors.red, fontSize: 14),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton.icon(
                      onPressed: () async {
                        await teacherProvider.loadTeachers();
                      },
                      icon: const Icon(Icons.refresh, size: 16),
                      label: const Text('重试'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      ),
                    ),
                  ],
                );
              }
              
              final allTeachers = teacherProvider.teachers;
              final teachers = _filterTeachers(allTeachers, _searchQuery);
              
              if (allTeachers.isEmpty) {
                return Column(
                  children: [
                    const Center(
                      child: Text('暂无老师数据', style: TextStyle(color: Colors.grey)),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () async {
                              await teacherProvider.loadTeachers();
                            },
                            icon: const Icon(Icons.refresh, size: 16),
                            label: const Text('刷新数据'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () async {
                              await _pocketBaseService.testTeachersCollection();
                            },
                            icon: const Icon(Icons.bug_report, size: 16),
                            label: const Text('测试集合'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.orange,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                );
              }
              
              if (teachers.isEmpty && _searchQuery.isNotEmpty) {
                return Column(
                  children: [
                    const Center(
                      child: Text('未找到匹配的老师', style: TextStyle(color: Colors.grey)),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton.icon(
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _searchQuery = '';
                        });
                      },
                      icon: const Icon(Icons.clear, size: 16),
                      label: const Text('清除搜索'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      ),
                    ),
                  ],
                );
              }
              
              return DropdownButtonFormField<String>(
                value: _selectedTeacherId,
                decoration: InputDecoration(
                  labelText: '选择要写入NFC卡的老师',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  prefixIcon: const Icon(Icons.school),
                ),
                isExpanded: true,
                items: teachers.map((teacher) {
                  final teacherName = (teacher.data['name'] ?? '').toString();
                  final teacherId = (teacher.data['teacher_id'] ?? '').toString();
                  
                  return DropdownMenuItem<String>(
                    value: teacher.id,
                    child: Text(
                      '$teacherName ($teacherId)',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedTeacherId = value;
                  });
                },
              );
            },
          ),
        ],
      ),
    );
  }

  // 快速操作按钮
  Widget _buildQuickOperationButtons() {
    final bool canWrite = _currentMode == 'student' 
        ? _selectedStudentId != null 
        : _selectedTeacherId != null;
    
    final String writeLabel = _currentMode == 'student' ? '写入学生卡' : '写入老师卡';
    final String readLabel = _currentMode == 'student' ? '读取学生卡' : '读取老师卡';
    
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: canWrite && !_isNfcOperating
                ? (_currentMode == 'student' ? _writeStudentNfcCard : _writeTeacherNfcCard)
                : null,
            icon: const Icon(Icons.nfc),
            label: Text(writeLabel),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: !_isNfcOperating 
                ? (_currentMode == 'student' ? _readStudentNfcCard : _readTeacherNfcCard)
                : null,
            icon: const Icon(Icons.search),
            label: Text(readLabel),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.successColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
      ],
    );
  }

  // 写入学生NFC卡
  Future<void> _writeStudentNfcCard() async {
    if (_selectedStudentId == null) return;

    setState(() {
      _isNfcOperating = true;
      _nfcOperationStatus = '正在准备写入数据...';
    });

    try {
      // 获取学生信息
      final studentProvider = Provider.of<StudentProvider>(context, listen: false);
      final student = studentProvider.students.firstWhere((s) => s.id == _selectedStudentId);
      
      final studentId = (student.data['student_id'] ?? '').toString();
      final studentName = (student.data['student_name'] ?? '').toString();
      
      setState(() {
        _nfcOperationStatus = '正在准备学生数据...';
      });

      // 生成学生ID+随机字符串的组合数据
      final randomString = _generateRandomString(8); // 生成8位随机字符串
      final combinedData = '${studentId}_$randomString';
      
      setState(() {
        _nfcOperationStatus = '正在准备学生数据...';
      });

      // 加密组合数据（确保密钥已加载）
      String nfcData = combinedData;
      try {
        await _encryptionService.ensureKeysLoaded();
        // 生成盐值
        final salt = _generateRandomString(8);
        final encryptedData = _encryptionService.encryptNFCData(combinedData, salt);
        nfcData = '$encryptedData:$salt';
        print('✅ 学生数据加密成功: $combinedData -> $nfcData');
      } catch (e) {
        print('⚠️ 学生数据加密失败，使用原始数据: $e');
        // 继续使用原始组合数据
      }
      
      setState(() {
        _nfcOperationStatus = '请将NFC卡靠近设备...';
      });

      // 写入数据到NFC卡
      await _writeToNfcCard(nfcData);

      if (mounted) {
        setState(() {
          _nfcOperationStatus = 'NFC卡写入成功！';
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$studentName 的NFC卡写入成功'),
            backgroundColor: AppTheme.successColor,
            duration: const Duration(seconds: 3),
          ),
        );
      }

    } catch (e) {
      if (mounted) {
        setState(() {
          _nfcOperationStatus = '写入失败: $e';
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('NFC卡写入失败: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isNfcOperating = false;
        });
      }
    }
  }

  // 写入老师NFC卡
  Future<void> _writeTeacherNfcCard() async {
    if (_selectedTeacherId == null) return;

    setState(() {
      _isNfcOperating = true;
      _nfcOperationStatus = '正在准备写入数据...';
    });

    try {
      // 获取老师信息
      final teacherProvider = Provider.of<TeacherProvider>(context, listen: false);
      final teacher = teacherProvider.teachers.firstWhere((t) => t.id == _selectedTeacherId);
      
      final rawTeacherId = (teacher.data['user_id'] ?? teacher.data['teacher_id'] ?? '').toString();
      // 仅允许字母数字，去除其他符号，保持与解密校验一致
      final teacherId = rawTeacherId.replaceAll(RegExp(r'[^A-Za-z0-9]'), '');
      if (teacherId.isEmpty) {
        setState(() { _nfcOperationStatus = '老师ID为空：请先在后台为该老师设置teacher_id（字母数字）'; });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('老师ID为空：请在PocketBase完善 teacher_id 后再写卡')),
        );
        return;
      }
      final teacherName = (teacher.data['name'] ?? '').toString();
      
      setState(() {
        _nfcOperationStatus = '正在准备老师数据...';
      });

      // 生成老师ID+随机字符串的组合数据
      final randomString = _generateRandomString(8); // 生成8位随机字符串
      final combinedData = '${teacherId}_$randomString';
      
      setState(() {
        _nfcOperationStatus = '正在准备老师数据...';
      });

      // 加密组合数据（确保密钥已加载）
      String nfcData = combinedData;
      try {
        await _encryptionService.ensureKeysLoaded();
        // 生成盐值
        final salt = _generateRandomString(8);
        final encryptedData = _encryptionService.encryptNFCData(combinedData, salt);
        nfcData = '$encryptedData:$salt';
        print('✅ 老师数据加密成功: $combinedData -> $nfcData');
      } catch (e) {
        print('⚠️ 老师数据加密失败，使用原始数据: $e');
        // 继续使用原始组合数据
      }
      
      setState(() {
        _nfcOperationStatus = '请将NFC卡靠近设备...';
      });

      // 写入数据到NFC卡
      await _writeToNfcCard(nfcData);

      if (mounted) {
        setState(() {
          _nfcOperationStatus = 'NFC卡写入成功！';
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$teacherName 的NFC卡写入成功'),
            backgroundColor: AppTheme.successColor,
            duration: const Duration(seconds: 3),
          ),
        );
      }

    } catch (e) {
      if (mounted) {
        setState(() {
          _nfcOperationStatus = '写入失败: $e';
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('NFC卡写入失败: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isNfcOperating = false;
        });
      }
    }
  }

  // 读取学生NFC卡
  Future<void> _readStudentNfcCard() async {
    setState(() {
      _isNfcOperating = true;
      _nfcOperationStatus = '请将NFC卡靠近设备...';
    });

    try {
      // 使用 flutter_nfc_kit 读取NFC
      final nfcData = await _readFromNfcCard();
      
      if (nfcData.isEmpty) {
        setState(() {
          _nfcOperationStatus = '未读取到有效数据';
        });
        return;
      }

      setState(() {
        _nfcOperationStatus = '正在解密数据...';
      });

      // 解密数据
      String combinedData = '';
      String studentId = '';
      try {
        if (nfcData.contains(':')) {
          final parts = nfcData.split(':');
          if (parts.length == 2) {
            final encryptedPart = parts[0].trim();
            final saltPart = parts[1].trim();
            print('🔎 待解密数据: encrypted="'+encryptedPart+'" salt="'+saltPart+'"');
            // 兼容可能的 url-safe base64
            final normalizedEncrypted = encryptedPart.replaceAll('-', '+').replaceAll('_', '/');
            _encryptionService.logAvailableVersions();
            final decrypted = _encryptionService.decryptNFCData(normalizedEncrypted, saltPart);
            print('🔓 解密明文: '+decrypted);
            combinedData = decrypted;
          }
        } else {
          combinedData = nfcData; // 未加密数据
        }
        
        // 从组合数据中提取学生ID（格式：学生ID_随机字符串）
        if (combinedData.contains('_')) {
          final parts = combinedData.split('_');
          if (parts.length >= 2) {
            studentId = parts[0]; // 第一部分是学生ID
            print('✅ 成功解析学生ID: $studentId (完整数据: $combinedData)');
          } else {
            studentId = combinedData; // 如果没有下划线，直接使用
          }
        } else {
          studentId = combinedData; // 如果没有下划线，直接使用
        }
      } catch (e) {
        setState(() {
          _nfcOperationStatus = '数据解密失败';
        });
        return;
      }

      setState(() {
        _nfcOperationStatus = '正在查找学生信息...';
      });

      // 查找学生（做规范化匹配，容错空格/大小写/前缀）
      String _normalizeId(String s) => s.replaceAll(RegExp(r'\s+'), '').toUpperCase();
      String _stripStu(String s) => s.replaceFirst(RegExp(r'^STU'), '');

      final normalizedTarget = _stripStu(_normalizeId(studentId));
      final studentProvider = Provider.of<StudentProvider>(context, listen: false);

      RecordModel? student;
      for (final s in studentProvider.students) {
        final raw = (s.data['student_id'] ?? '').toString();
        final normalized = _stripStu(_normalizeId(raw));
        if (normalized == normalizedTarget || raw.toUpperCase() == studentId.toUpperCase() || raw.toUpperCase().contains(studentId.toUpperCase())) {
          student = s;
          break;
        }
      }

      if (student == null) {
        print('❌ 未找到学生: target="$studentId" (normalized=$normalizedTarget)');
        throw Exception('未找到学生');
      }

      final studentName = (student.data['student_name'] ?? '').toString();
      final center = (student.data['center'] ?? '').toString();

      setState(() {
        _nfcOperationStatus = 'NFC卡主人: $studentName ($studentId) - $center';
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('NFC卡主人: $studentName ($studentId)'),
          backgroundColor: AppTheme.successColor,
        ),
      );

    } catch (e) {
      setState(() {
        _nfcOperationStatus = '读取失败: $e';
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('NFC卡读取失败: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isNfcOperating = false;
      });
    }
  }

  // 读取老师NFC卡
  Future<void> _readTeacherNfcCard() async {
    setState(() {
      _isNfcOperating = true;
      _nfcOperationStatus = '请将NFC卡靠近设备...';
    });

    try {
      // 使用 flutter_nfc_kit 读取NFC
      final nfcData = await _readFromNfcCard();
      
      if (nfcData.isEmpty) {
        setState(() {
          _nfcOperationStatus = '未读取到有效数据';
        });
        return;
      }

      setState(() {
        _nfcOperationStatus = '正在解密数据...';
      });

      // 解密数据
      String teacherId = '';
      try {
        await _encryptionService.ensureKeysLoaded();
        if (nfcData.contains(':')) {
          final parts = nfcData.split(':');
          if (parts.length == 2) {
            final encryptedPart = parts[0].trim();
            final saltPart = parts[1].trim();
            print('🔎 待解密数据: encrypted="'+encryptedPart+'" salt="'+saltPart+'"');
            final normalizedEncrypted = encryptedPart.replaceAll('-', '+').replaceAll('_', '/');
            _encryptionService.logAvailableVersions();
            final decrypted = _encryptionService.decryptNFCData(normalizedEncrypted, saltPart);
            print('🔓 解密明文: '+decrypted);
            // 明文应为 老师ID_随机串，提取老师ID部分并规范化为字母数字
            final idx = decrypted.indexOf('_');
            final idPart = idx > 0 ? decrypted.substring(0, idx) : decrypted;
            teacherId = idPart.replaceAll(RegExp(r'[^A-Za-z0-9]'), '');
            print('🔓 提取老师ID: '+teacherId);
          }
        } else {
          teacherId = nfcData; // 未加密数据
        }
      } catch (e) {
        // 解密失败时，回退使用原始数据（兼容旧老师卡或明文卡）
        print('🔴 老师卡解密失败，回退为原始数据: $e');
        teacherId = nfcData;
      }

      setState(() {
        _nfcOperationStatus = '正在查找老师信息...';
      });

      // 查找老师（容错匹配）
      final teacherProvider = Provider.of<TeacherProvider>(context, listen: false);
      RecordModel? teacher;
      
      // 先按精确ID匹配
      for (final t in teacherProvider.teachers) {
        final raw = (t.data['user_id'] ?? t.data['teacher_id'] ?? '').toString();
        final norm = raw.replaceAll(RegExp(r'[^A-Za-z0-9]'), '');
        if (norm.toUpperCase() == teacherId.toUpperCase()) {
          teacher = t;
          break;
        }
      }
      
      // 如未命中，做容错查找
      if (teacher == null) {
        String _normalize(String s) => s.replaceAll(RegExp(r'[^A-Za-z0-9]'), '').toUpperCase();
        final target = _normalize(teacherId);
        for (final t in teacherProvider.teachers) {
          final raw = (t.data['user_id'] ?? t.data['teacher_id'] ?? '').toString();
          final norm = _normalize(raw);
          if (norm == target || norm.contains(target) || target.contains(norm)) {
            teacher = t;
            break;
          }
        }
      }
      
      if (teacher == null) {
        print('❌ 未找到老师: target="$teacherId"');
        throw Exception('未找到老师');
      }

      final teacherName = (teacher.data['name'] ?? '').toString();
      final department = (teacher.data['department'] ?? '').toString();

      setState(() {
        _nfcOperationStatus = 'NFC卡主人: $teacherName ($teacherId) - $department';
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('NFC卡主人: $teacherName ($teacherId)'),
          backgroundColor: AppTheme.successColor,
        ),
      );

    } catch (e) {
      setState(() {
        _nfcOperationStatus = '读取失败: $e';
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('NFC卡读取失败: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isNfcOperating = false;
      });
    }
  }

  // NFC写入实现 - 使用NDEFRawRecord
  Future<void> _writeToNfcCard(String data) async {
    try {
      print('📝 开始写入NFC数据: $data');
      
      // 检查NFC是否可用
      final nfcAvailability = await FlutterNfcKit.nfcAvailability;
      if (nfcAvailability != NFCAvailability.available) {
        throw Exception('NFC不可用，请检查设备设置');
      }
      
      print('✅ NFC可用，开始写入...');
      
      // 使用 flutter_nfc_kit 写入NFC
      NFCTag tag = await FlutterNfcKit.poll(
        timeout: const Duration(seconds: 10),
        iosMultipleTagMessage: "发现多个标签！请移除所有标签，然后重试。",
        iosAlertMessage: "将设备靠近要写入的NFC标签",
      );

      print('📱 NFC标签检测成功: ${tag.type}');

      await FlutterNfcKit.setIosAlertMessage("正在写入...");
      
      // 检查标签是否支持NDEF
      if (tag.ndefAvailable != true) {
        await FlutterNfcKit.finish();
        throw Exception('NFC卡不支持NDEF格式');
      }
      
      print('🔐 写入数据: $data');

      // 构造 NDEF Text 规范的 payload：status(UTF-8) + 'en' + 文本
      final languageCode = 'en';
      final langBytes = utf8.encode(languageCode);
      final textBytes = utf8.encode(data);
      final status = langBytes.length & 0x1F; // UTF-8 标识，最高位为0
      final payloadBytes = <int>[status, ...langBytes, ...textBytes];

      // 转换为十六进制字符串
      final hexData = payloadBytes
          .map((byte) => byte.toRadixString(16).padLeft(2, '0'))
          .join('');
      print('🔢 十六进制数据: $hexData');

      // 使用NDEFRawRecord写入 - payload 与 type 需为十六进制字符串
      await FlutterNfcKit.writeNDEFRawRecords([
        NDEFRawRecord(
          "",                     // id字段使用空字符串
          hexData,                // payload使用十六进制字符串（NDEF Text）
          "54",                  // type: 'T' 的十六进制表示
          TypeNameFormat.nfcWellKnown,
        )
      ]);

      print('✅ NDEF记录写入成功');

      await FlutterNfcKit.finish();
      print('🔒 NFC会话已关闭');
      
      // 添加缓冲时间
      await Future.delayed(const Duration(milliseconds: 1500));
      print('✅ NFC写入完成');
      
    } catch (e) {
      print('❌ NFC写入失败: $e');
      
      // 确保NFC会话被正确关闭
      try {
        await FlutterNfcKit.finish();
        print('🔒 NFC会话已强制关闭');
      } catch (_) {
        print('⚠️ NFC会话关闭失败');
      }
      
      // 检查是否是activity相关的错误
      if (e.toString().contains('not attached to activity') || 
          e.toString().contains('Activity')) {
        throw Exception('NFC操作失败：应用状态异常，请重新打开应用后重试');
      }
      
      throw Exception('NFC写入失败: $e');
    }
  }

  // NFC读取实现 - 使用简化的方法
  Future<String> _readFromNfcCard() async {
    try {
      print('📖 开始读取NFC数据...');
      
      // 检查NFC是否可用
      final nfcAvailability = await FlutterNfcKit.nfcAvailability;
      if (nfcAvailability != NFCAvailability.available) {
        throw Exception('NFC不可用，请检查设备设置');
      }
      
      print('✅ NFC可用，开始读取...');
      
      // 使用 flutter_nfc_kit 读取NFC
      NFCTag tag = await FlutterNfcKit.poll(
        timeout: const Duration(seconds: 10),
        iosMultipleTagMessage: "发现多个标签！请移除所有标签，然后重试。",
        iosAlertMessage: "将设备靠近NFC标签"
      );

      print('📱 NFC标签检测成功: ${tag.type}');

      await FlutterNfcKit.setIosAlertMessage("正在读取...");
      
      // 检查标签是否支持NDEF
      if (tag.ndefAvailable != true) {
        await FlutterNfcKit.finish();
        throw Exception('NFC卡不支持NDEF格式');
      }
      
      // 读取NDEF记录
      String? readData;
      List<dynamic> records = await FlutterNfcKit.readNDEFRecords(cached: false);
      
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
            final hexString = payload;
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
            readData = utf8.decode(textBytes);
            print('✅ 成功读取数据: $readData');
            break;
          }
        } catch (e) {
          print('⚠️ NDEF Text 解析失败: $e; payload类型=${payload.runtimeType}');
          continue;
        }
      }

      await FlutterNfcKit.finish();
      print('🔒 NFC会话已关闭');
      
      return readData ?? '';
      
    } catch (e) {
      print('❌ NFC读取失败: $e');
      
      // 确保NFC会话被正确关闭
      try {
        await FlutterNfcKit.finish();
        print('🔒 NFC会话已强制关闭');
      } catch (_) {
        print('⚠️ NFC会话关闭失败');
      }
      
      // 检查是否是activity相关的错误
      if (e.toString().contains('not attached to activity') || 
          e.toString().contains('Activity')) {
        throw Exception('NFC操作失败：应用状态异常，请重新打开应用后重试');
      }
      
      throw Exception('NFC读取失败: $e');
    }
  }

  // 操作状态卡片
  Widget _buildOperationStatusCard() {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.info_outline, color: Color(0xFF1E3A8A), size: 24),
                SizedBox(width: 12),
                Text(
                  '操作状态',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E3A8A),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _isNfcOperating ? Colors.blue.withOpacity(0.1) : Colors.grey.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _isNfcOperating ? Colors.blue.withOpacity(0.3) : Colors.grey.withOpacity(0.3),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    _isNfcOperating ? Icons.hourglass_empty : Icons.check_circle,
                    color: _isNfcOperating ? Colors.blue : Colors.grey,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _nfcOperationStatus,
                      style: TextStyle(
                        fontSize: 14,
                        color: _isNfcOperating ? Colors.blue : Colors.grey,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}