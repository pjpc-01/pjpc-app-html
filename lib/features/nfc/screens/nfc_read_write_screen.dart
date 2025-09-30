import 'dart:convert';
import 'dart:typed_data';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:ndef/record.dart'; 
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/services/pocketbase_service.dart';
import '../../../shared/services/nfc_safe_scanner_service.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../teacher/providers/teacher_provider.dart';
import '../../../shared/services/unified_field_mapper.dart';

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
  
  final PocketBaseService _pocketBaseService = PocketBaseService.instance;
  
  // 学生选择相关
  String? _selectedStudentId;
  String? _selectedTeacherId;
  String _nfcOperationStatus = '准备就绪';
  bool _isNfcOperating = false;
  String _currentMode = 'student'; // 'student' 或 'teacher'
  
  // 搜索相关
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  
  // 批量管理相关
  bool _isBatchMode = false;
  int _batchCount = 0;
  int _processedCount = 0;
  List<String> _batchLog = [];
  
  // NFC卡关联相关
  bool _isAssociationMode = false;
  String? _scannedNfcId;
  String? _selectedUserForAssociation;
  String _associationType = 'student'; // 'student' 或 'teacher'

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
    });
  }

  // 智能搜索功能
  List<RecordModel> _filterStudents(List<RecordModel> students, String query) {
    if (query.isEmpty) return students;
    
    final lowerQuery = query.toLowerCase();
    
    final filteredStudents = students.where((student) {
      final studentName = (student.data['student_name'] ?? '').toString().toLowerCase();
      final studentId = (student.data['student_id'] ?? '').toString().toLowerCase();
      final center = (student.data['center'] ?? '').toString().toLowerCase();
      
      // 多种匹配方式
      bool nameMatch = studentName.contains(lowerQuery);
      bool idMatch = studentId.contains(lowerQuery);
      bool centerMatch = center.contains(lowerQuery);
      
      // 精确匹配
      if (nameMatch || idMatch || centerMatch) {
        return true;
      }
      
      // 模糊匹配
      final words = lowerQuery.split(' ');
      for (final word in words) {
        if (word.length >= 2) {
          if (studentName.contains(word) || studentId.contains(word) || center.contains(word)) {
          return true;
        }
        }
      }
      
      return false;
    }).toList();
    
    return filteredStudents;
  }
  
  List<RecordModel> _filterTeachers(List<RecordModel> teachers, String query) {
    if (query.isEmpty) return teachers;
    
    final lowerQuery = query.toLowerCase();
    return teachers.where((teacher) {
      final teacherName = (teacher.data['teacher_name'] ?? '').toString().toLowerCase();
      final teacherId = (teacher.data['teacher_id'] ?? '').toString().toLowerCase();
      final center = (teacher.data['center'] ?? '').toString().toLowerCase();
      
      return teacherName.contains(lowerQuery) || 
          teacherId.contains(lowerQuery) || 
             center.contains(lowerQuery);
    }).toList();
  }

  void _initAnimations() {
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));

    _colorAnimation = ColorTween(
      begin: AppTheme.primaryColor,
      end: AppTheme.successColor,
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

  // 批量操作方法
  Future<void> _startBatchRead() async {
    final TextEditingController controller = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('批量读取NFC卡'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
              children: [
            const Text('请输入要读取的NFC卡数量：'),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: '卡片数量',
                border: OutlineInputBorder(),
                            ),
                          ),
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
              final count = int.tryParse(controller.text);
              if (count != null && count > 0) {
                _performBatchRead(count);
              } else {
                _addBatchLog('❌ 请输入有效的卡片数量');
              }
            },
            child: const Text('开始读取'),
          ),
        ],
      ),
    );
  }

  Future<void> _performBatchRead(int cardCount) async {
                            setState(() {
      _batchCount = cardCount;
      _processedCount = 0;
    });

    _addBatchLog('🚀 开始批量读取NFC卡，共 $cardCount 张卡片');

    for (int i = 0; i < cardCount; i++) {
      if (!_isBatchMode) break; // 如果用户关闭了批量模式，停止操作
      
      setState(() {
        _processedCount = i;
      });
      
      _addBatchLog('📖 正在读取第 ${i + 1} 张卡片...');
      
      try {
        // 这里调用现有的读取方法
        await _readNfcCard();
        _addBatchLog('✅ 第 ${i + 1} 张卡片读取成功');
      } catch (e) {
        _addBatchLog('❌ 第 ${i + 1} 张卡片读取失败: $e');
      }
      
      // 添加延迟，避免过快操作
      await Future.delayed(const Duration(milliseconds: 1000));
    }
    
    if (_isBatchMode) {
      _addBatchLog('✅ 批量读取完成！');
    }
  }

  Future<void> _startBatchWrite() async {
    if (_associationType == 'student') {
      final studentProvider = context.read<StudentProvider>();
      final students = studentProvider.students;
      
      if (students.isEmpty) {
        _addBatchLog('❌ 没有学生数据，无法开始批量写入');
        return;
      }

    setState(() {
        _batchCount = students.length;
        _processedCount = 0;
      });

      _addBatchLog('🚀 开始批量写入NFC卡，共 ${students.length} 个学生');

      for (int i = 0; i < students.length; i++) {
        if (!_isBatchMode) break; // 如果用户关闭了批量模式，停止操作
        
        final student = students[i];
        final studentName = student.getStringValue('student_name') ?? '未知学生';
        
        setState(() {
          _processedCount = i;
          _selectedStudentId = student.id;
        });
        
        _addBatchLog('📝 正在为 $studentName 写入NFC卡...');
        
        try {
          // 这里调用现有的写入方法
          await _writeNfcCard();
          _addBatchLog('✅ $studentName 的NFC卡写入成功');
        } catch (e) {
          _addBatchLog('❌ $studentName 的NFC卡写入失败: $e');
        }
        
        // 添加延迟，避免过快操作
        await Future.delayed(const Duration(milliseconds: 1000));
      }
          } else {
      final teacherProvider = context.read<TeacherProvider>();
      final teachers = teacherProvider.teachers;
      
      if (teachers.isEmpty) {
        _addBatchLog('❌ 没有教师数据，无法开始批量写入');
        return;
      }

      setState(() {
        _batchCount = teachers.length;
        _processedCount = 0;
      });

      _addBatchLog('🚀 开始批量写入NFC卡，共 ${teachers.length} 个教师');

      for (int i = 0; i < teachers.length; i++) {
        if (!_isBatchMode) break; // 如果用户关闭了批量模式，停止操作
        
        final teacher = teachers[i];
        final teacherName = teacher.getStringValue('name') ?? '未知教师';
        
        setState(() {
          _processedCount = i;
          _selectedTeacherId = teacher.id;
        });
        
        _addBatchLog('📝 正在为 $teacherName 写入NFC卡...');
        
        try {
          // 这里调用现有的写入方法
          await _writeNfcCard();
          _addBatchLog('✅ $teacherName 的NFC卡写入成功');
        } catch (e) {
          _addBatchLog('❌ $teacherName 的NFC卡写入失败: $e');
        }
        
        // 添加延迟，避免过快操作
        await Future.delayed(const Duration(milliseconds: 1000));
      }
    }
    
    if (_isBatchMode) {
      _addBatchLog('✅ 批量写入完成！');
    }
  }

  void _addBatchLog(String message) {
        setState(() {
      _batchLog.add('${DateTime.now().toString().substring(11, 19)} $message');
      // 保持日志数量在合理范围内
      if (_batchLog.length > 50) {
        _batchLog.removeAt(0);
      }
    });
  }

  // NFC卡关联方法
  Future<void> _scanNfcForAssociation() async {
    if (_isScanning) return;

    setState(() {
      _isScanning = true;
      _scanStatus = '正在扫描NFC卡进行关联...';
    });
    
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability != NFCAvailability.available) {
        setState(() {
          _scanStatus = 'NFC功能不可用';
          _isScanning = false;
        });
        return;
      }

      final tag = await FlutterNfcKit.poll();
      
      if (tag.id != null && tag.id!.isNotEmpty) {
        // 转换为标准格式
        final convertedId = NFCSafeScannerService.convertToStandardFormat(tag.id!);
        setState(() {
          _scannedNfcId = convertedId;
          _scanStatus = 'NFC卡扫描成功，请选择要关联的学生';
        });
      } else {
        setState(() {
          _scanStatus = '未能读取到NFC卡ID';
        });
      }
      
    } catch (e) {
      setState(() {
        _scanStatus = 'NFC扫描失败: $e';
      });
    } finally {
      setState(() {
        _isScanning = false;
      });
    }
  }

  Future<void> _associateNfcWithStudent() async {
    if (_scannedNfcId == null || _selectedUserForAssociation == null) {
      return;
    }

    try {
      String userName = '';
      
      // 使用统一字段映射服务获取NFC关联数据
      final nfcData = UnifiedFieldMapper.getUnifiedNfcData(_scannedNfcId!, _associationType);
      
      if (_associationType == 'student') {
        // 获取学生信息
        final studentProvider = context.read<StudentProvider>();
        final student = studentProvider.students.firstWhere(
          (s) => s.id == _selectedUserForAssociation,
        );
        userName = UnifiedFieldMapper.getUserDisplayName(student.data, 'student');

        // 使用统一字段更新学生记录
        await _pocketBaseService.updateStudent(_selectedUserForAssociation!, nfcData);
        
        // 刷新学生数据（强制刷新缓存）
        await studentProvider.loadStudents(useCache: false);
      } else {
        // 获取教师信息
        final teacherProvider = context.read<TeacherProvider>();
        final teacher = teacherProvider.teachers.firstWhere(
          (t) => t.id == _selectedUserForAssociation,
        );
        userName = UnifiedFieldMapper.getUserDisplayName(teacher.data, 'teacher');

        // 使用统一字段更新教师记录
        await _pocketBaseService.updateTeacher(_selectedUserForAssociation!, nfcData);
        
        // 刷新教师数据（强制刷新缓存）
        await teacherProvider.forceRefreshTeachers();
      }

      // 显示成功消息
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ 成功将NFC卡关联到${_associationType == 'student' ? '学生' : '教师'}: $userName'),
            backgroundColor: AppTheme.successColor,
            duration: const Duration(seconds: 3),
          ),
        );
      }

      // 重置状态
        setState(() {
        _scannedNfcId = null;
        _selectedUserForAssociation = null;
        _scanStatus = 'NFC卡关联成功';
        });
        
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ 关联失败: $e'),
            backgroundColor: AppTheme.errorColor,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  Future<void> _checkNfcAvailability() async {
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      setState(() {
        if (availability == NFCAvailability.available) {
          _scanStatus = 'NFC功能可用，准备扫描';
          } else {
          _scanStatus = 'NFC功能不可用';
          }
      });
    } catch (e) {
      setState(() {
        _scanStatus = '检查NFC状态失败: $e';
      });
    }
  }

  Future<void> _loadData() async {
    try {
      final studentProvider = context.read<StudentProvider>();
      final teacherProvider = context.read<TeacherProvider>();
      
      await studentProvider.loadStudents();
      await teacherProvider.loadTeachers();
        
      setState(() {
        _nfcOperationStatus = '数据加载完成';
      });
    } catch (e) {
      setState(() {
        _nfcOperationStatus = '数据加载失败: $e';
      });
    }
  }

  Future<void> _readNfcCard() async {
    if (_isScanning) return;

    setState(() {
      _isScanning = true;
      _scanStatus = '正在扫描NFC卡...';
    });
    
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability != NFCAvailability.available) {
        setState(() {
          _scanStatus = 'NFC功能不可用，请检查设备设置';
          _isScanning = false;
        });
        return;
      }

      final tag = await FlutterNfcKit.poll(
        timeout: const Duration(seconds: 10),
        iosMultipleTagMessage: '检测到多个标签，请只使用一个标签',
        iosAlertMessage: '请将NFC标签靠近设备',
      );

      // 简化NFC读取 - 使用标签ID作为考勤数据
      String? readData;
      
      try {
        // 直接使用标签ID作为考勤数据，并转换为标准格式
        if (tag.id.isNotEmpty) {
          readData = NFCSafeScannerService.convertToStandardFormat(tag.id);
        } else {
          setState(() {
            _scanStatus = 'NFC卡中没有找到有效数据';
            _isScanning = false;
          });
          return;
        }
      } catch (e) {
        setState(() {
          _scanStatus = '读取NFC数据失败: $e';
          _isScanning = false;
        });
        return;
      }

      await FlutterNfcKit.finish();

      if (readData != null && readData.isNotEmpty) {
        setState(() {
          _lastReadData = readData!;
          _scanStatus = '读取成功';
        });
        
        // 查找对应的学生或教师
        await _findUserByNfcData(readData);
      } else {
        setState(() {
          _scanStatus = '未读取到有效数据';
        });
      }
    } catch (e) {
      String errorMessage = '读取失败';
      if (e.toString().contains('timeout')) {
        errorMessage = '扫描超时，请重新尝试';
      } else if (e.toString().contains('cancelled')) {
        errorMessage = '扫描已取消';
      } else if (e.toString().contains('not available')) {
        errorMessage = 'NFC功能不可用';
      } else {
        errorMessage = '读取失败: ${e.toString()}';
      }
      
      setState(() {
        _scanStatus = errorMessage;
      });
    } finally {
      setState(() {
        _isScanning = false;
      });
    }
  }

  Future<void> _findUserByNfcData(String nfcData) async {
    try {
      // 首先尝试通过NFC ID查找学生
      final student = await _pocketBaseService.getStudentByNfcId(nfcData);
      if (student != null) {
        setState(() {
          _selectedStudentId = student.id;
          _currentMode = 'student';
          _nfcOperationStatus = '✅ 找到学生: ${student.getStringValue('student_name') ?? '未知学生'}\nNFC ID: $nfcData';
        });
        return;
      }
      
      // 尝试通过NFC ID查找教师
      final teacher = await _pocketBaseService.getTeacherByNfcId(nfcData);
      if (teacher != null) {
        setState(() {
          _selectedTeacherId = teacher.id;
          _currentMode = 'teacher';
          _nfcOperationStatus = '✅ 找到教师: ${teacher.getStringValue('name') ?? '未知教师'}\nNFC ID: $nfcData';
        });
        return;
      }
      
      // 如果都没找到，显示友好的提示信息
      setState(() {
        _nfcOperationStatus = '❌ 未找到该NFC卡的拥有者信息\n\n可能的原因:\n• NFC卡未分配给任何用户\n• NFC ID格式不匹配\n• 数据库中没有相关记录\n\nNFC ID: $nfcData\n\n建议:\n• 检查NFC卡是否正确分配\n• 联系管理员进行卡片分配';
      });
    } catch (e) {
      setState(() {
        _nfcOperationStatus = '❌ 查找用户失败\n\n错误信息: $e\n\nNFC ID: $nfcData\n\n建议:\n• 检查网络连接\n• 重新尝试扫描\n• 联系技术支持';
      });
    }
  }

  Future<void> _writeNfcCard() async {
    if (_isNfcOperating) return;
    
    String? dataToWrite;
    String? userName;
    
    if (_currentMode == 'student' && _selectedStudentId != null) {
      final studentProvider = context.read<StudentProvider>();
      final student = studentProvider.students.firstWhere(
        (s) => s.id == _selectedStudentId,
        orElse: () => throw Exception('学生不存在'),
      );
      dataToWrite = student.getStringValue('student_id');
      userName = student.getStringValue('student_name');
    } else if (_currentMode == 'teacher' && _selectedTeacherId != null) {
      final teacherProvider = context.read<TeacherProvider>();
      final teacher = teacherProvider.teachers.firstWhere(
        (t) => t.id == _selectedTeacherId,
        orElse: () => throw Exception('教师不存在'),
      );
      dataToWrite = teacher.getStringValue('teacher_id');
      userName = teacher.getStringValue('teacher_name');
    }
    
    if (dataToWrite == null) {
      setState(() {
        _nfcOperationStatus = '请先选择要写入的用户';
      });
      return;
    }
    
    setState(() {
      _isNfcOperating = true;
      _nfcOperationStatus = '正在写入NFC卡...';
    });
    
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability != NFCAvailability.available) {
        setState(() {
          _nfcOperationStatus = 'NFC功能不可用';
          _isNfcOperating = false;
        });
        return;
      }

      // 创建NDEF Text记录 - 手动创建
      final languageBytes = utf8.encode('en');
      final textBytes = utf8.encode(dataToWrite);
      final payload = [
        languageBytes.length, // 语言码长度
        ...languageBytes,     // 语言码
        ...textBytes,         // 文本数据
      ];
      
      final textRecord = NDEFRecord(
        type: Uint8List.fromList([0x54]), // 'T' for Text
        payload: Uint8List.fromList(payload),
      );
      
      final tag = await FlutterNfcKit.poll(
        timeout: const Duration(seconds: 10),
        iosMultipleTagMessage: '检测到多个标签，请只使用一个标签',
        iosAlertMessage: '请将NFC标签靠近设备',
      );

      await FlutterNfcKit.writeNDEFRecords([textRecord]);
      await FlutterNfcKit.finish();

      setState(() {
        _nfcOperationStatus = '写入成功: $userName ($dataToWrite)';
      });
      
      // 显示成功消息
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('NFC卡写入成功: $userName'),
          backgroundColor: AppTheme.successColor,
        ),
      );
    } catch (e) {
      setState(() {
        _nfcOperationStatus = '写入失败: $e';
      });
    } finally {
      setState(() {
        _isNfcOperating = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('NFC读写管理'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // NFC状态卡片
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Icons.nfc,
                            color: AppTheme.primaryColor,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Text(
                          'NFC状态',
                          style: AppTheme.headingStyle.copyWith(fontSize: 20),
              ),
            ],
          ),
                    const SizedBox(height: 16),
                    Text(
                      _scanStatus,
                      style: AppTheme.bodyStyle.copyWith(fontSize: 16),
                    ),
                    const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _isScanning ? null : _readNfcCard,
                            icon: const Icon(Icons.nfc, size: 20),
                            label: const Text('读取NFC'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primaryColor,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
              Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _isNfcOperating ? null : _writeNfcCard,
                            icon: const Icon(Icons.edit, size: 20),
                            label: const Text('写入NFC'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.successColor,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                ),
          ),
        ],
      ),
        ],
      ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // NFC卡关联功能 - 简化版本
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.link,
                          color: AppTheme.accentColor,
                          size: 24,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'NFC卡关联',
                          style: AppTheme.headingStyle.copyWith(fontSize: 20),
                        ),
                        const Spacer(),
                        Switch(
                          value: _isAssociationMode,
                          onChanged: (value) {
                            setState(() {
                              _isAssociationMode = value;
                              if (!value) {
                                _scannedNfcId = null;
                                _selectedUserForAssociation = null;
                              }
                            });
                          },
                          activeColor: AppTheme.accentColor,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (_isAssociationMode) ...[
                      if (_scannedNfcId == null) ...[
                        ElevatedButton.icon(
                          onPressed: _scanNfcForAssociation,
                          icon: const Icon(Icons.nfc, size: 20),
                          label: const Text('扫描NFC卡'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.accentColor,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ] else ...[
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.successColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: AppTheme.successColor.withOpacity(0.3),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.check_circle,
                                    color: AppTheme.successColor,
                                    size: 24,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'NFC卡扫描成功',
                                          style: AppTheme.bodyStyle.copyWith(
                                            fontWeight: FontWeight.w600,
                                            color: AppTheme.successColor,
                                          ),
                                        ),
                                        Text(
                                          '标签ID: $_scannedNfcId',
                                          style: AppTheme.bodyStyle.copyWith(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                '选择用户类型：',
                                style: AppTheme.bodyStyle.copyWith(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: RadioListTile<String>(
                                      title: const Text('学生'),
                                      value: 'student',
                                      groupValue: _associationType,
                                      onChanged: (value) {
                                        setState(() {
                                          _associationType = value!;
                                          _selectedUserForAssociation = null;
                                        });
                                      },
                                      activeColor: AppTheme.accentColor,
                                    ),
                                  ),
                                  Expanded(
                                    child: RadioListTile<String>(
                                      title: const Text('教师'),
                                      value: 'teacher',
                                      groupValue: _associationType,
                                      onChanged: (value) {
                                        setState(() {
                                          _associationType = value!;
                                          _selectedUserForAssociation = null;
                                        });
                                      },
                                      activeColor: AppTheme.accentColor,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                '选择要关联的${_associationType == 'student' ? '学生' : '教师'}：',
                                style: AppTheme.bodyStyle.copyWith(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Container(
                                height: 200,
                                decoration: BoxDecoration(
                                  border: Border.all(color: Colors.grey[300]!),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: _associationType == 'student' 
                                  ? Consumer<StudentProvider>(
                                      builder: (context, studentProvider, child) {
                                        final students = _filterStudents(studentProvider.students, _searchQuery);
                                        return ListView.builder(
                                          padding: const EdgeInsets.all(8),
                                          itemCount: students.length,
                                          itemBuilder: (context, index) {
                                            final student = students[index];
                                            final studentName = student.getStringValue('student_name') ?? '未知学生';
                                            final studentId = student.getStringValue('student_id') ?? '';
                                            final isSelected = _selectedUserForAssociation == student.id;
                                            
                                            return Container(
                                              margin: const EdgeInsets.only(bottom: 4),
                                              decoration: BoxDecoration(
                                                color: isSelected ? AppTheme.accentColor.withOpacity(0.1) : null,
                                                borderRadius: BorderRadius.circular(8),
                                                border: isSelected ? Border.all(color: AppTheme.accentColor) : null,
                                              ),
                                              child: ListTile(
                                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                                leading: CircleAvatar(
                                                  backgroundColor: AppTheme.accentColor.withOpacity(0.1),
                                                  child: Icon(
                                                    Icons.person,
                                                    color: AppTheme.accentColor,
                                                    size: 20,
                                                  ),
                                                ),
                                                title: Text(
                                                  studentName,
                                                  style: AppTheme.bodyStyle.copyWith(
                                                    fontWeight: FontWeight.w600,
                                                    fontSize: 14,
                                                  ),
                                                ),
                                                subtitle: Text(
                                                  '学号: $studentId',
                                                  style: AppTheme.bodyStyle.copyWith(
                                                    color: Colors.grey[600],
                                                    fontSize: 12,
                                                  ),
                                                ),
                                                trailing: isSelected ? Icon(
                                                  Icons.check_circle,
                                                  color: AppTheme.accentColor,
                                                  size: 20,
                                                ) : null,
                                                onTap: () {
                                                  setState(() {
                                                    _selectedUserForAssociation = student.id;
                                                  });
                                                },
                                              ),
                                            );
                                          },
                                        );
                                      },
                                    )
                                  : Consumer<TeacherProvider>(
                                      builder: (context, teacherProvider, child) {
                                        final teachers = _filterTeachers(teacherProvider.teachers, _searchQuery);
                                        return ListView.builder(
                                          padding: const EdgeInsets.all(8),
                                          itemCount: teachers.length,
                                          itemBuilder: (context, index) {
                                            final teacher = teachers[index];
                                            final teacherName = teacher.getStringValue('name') ?? '未知教师';
                                            final department = teacher.getStringValue('department') ?? '';
                                            final isSelected = _selectedUserForAssociation == teacher.id;
                                            
                                            return Container(
                                              margin: const EdgeInsets.only(bottom: 4),
                                              decoration: BoxDecoration(
                                                color: isSelected ? AppTheme.accentColor.withOpacity(0.1) : null,
                                                borderRadius: BorderRadius.circular(8),
                                                border: isSelected ? Border.all(color: AppTheme.accentColor) : null,
                                              ),
                                              child: ListTile(
                                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                                leading: CircleAvatar(
                                                  backgroundColor: AppTheme.accentColor.withOpacity(0.1),
                                                  child: Icon(
                                                    Icons.school,
                                                    color: AppTheme.accentColor,
                                                    size: 20,
                                                  ),
                                                ),
                                                title: Text(
                                                  teacherName,
                                                  style: AppTheme.bodyStyle.copyWith(
                                                    fontWeight: FontWeight.w600,
                                                    fontSize: 14,
                                                  ),
                                                ),
                                                subtitle: Text(
                                                  '部门: $department',
                                                  style: AppTheme.bodyStyle.copyWith(
                                                    color: Colors.grey[600],
                                                    fontSize: 12,
                                                  ),
                                                ),
                                                trailing: isSelected ? Icon(
                                                  Icons.check_circle,
                                                  color: AppTheme.accentColor,
                                                  size: 20,
                                                ) : null,
                                                onTap: () {
                                                  setState(() {
                                                    _selectedUserForAssociation = teacher.id;
                                                  });
                                                },
                                              ),
                                            );
                                          },
                                        );
                                      },
                                    ),
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: _selectedUserForAssociation != null ? _associateNfcWithStudent : null,
                                      icon: const Icon(Icons.link, size: 20),
                                      label: const Text('确认关联'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppTheme.successColor,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(vertical: 16),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      onPressed: () {
                                        setState(() {
                                          _scannedNfcId = null;
                                          _selectedUserForAssociation = null;
                                        });
                                      },
                                      icon: const Icon(Icons.refresh, size: 20),
                                      label: const Text('重新扫描'),
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: AppTheme.accentColor,
                                        padding: const EdgeInsets.symmetric(vertical: 16),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ] else ...[
                      Text(
                        '开启关联模式以将NFC卡关联到学生或教师',
                        style: AppTheme.bodyStyle.copyWith(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // 批量管理功能
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.warningColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Icons.batch_prediction,
                            color: AppTheme.warningColor,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Text(
                          '批量管理',
                          style: AppTheme.headingStyle.copyWith(fontSize: 20),
                        ),
                        const Spacer(),
                        Switch(
                          value: _isBatchMode,
            onChanged: (value) {
              setState(() {
                              _isBatchMode = value;
                              if (!value) {
                                _batchCount = 0;
                                _processedCount = 0;
                                _batchLog.clear();
                              }
              });
            },
                          activeColor: AppTheme.primaryColor,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (_isBatchMode) ...[
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                              onPressed: _startBatchRead,
                              icon: const Icon(Icons.nfc, size: 20),
                              label: const Text('批量读取'),
                            style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryColor,
                              foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                          ),
                          const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton.icon(
                              onPressed: _startBatchWrite,
                              icon: const Icon(Icons.edit, size: 20),
                              label: const Text('批量写入'),
                            style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.successColor,
                              foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                    ),
                  ],
                      ),
                      if (_batchCount > 0) ...[
                        const SizedBox(height: 16),
                        LinearProgressIndicator(
                          value: _batchCount > 0 ? _processedCount / _batchCount : 0,
                          backgroundColor: AppTheme.primaryColor.withOpacity(0.2),
                          valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                    ),
                    const SizedBox(height: 8),
                        Text(
                          '进度: $_processedCount / $_batchCount',
                          style: AppTheme.bodyStyle.copyWith(fontSize: 14),
                        ),
                      ],
                      if (_batchLog.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Container(
                          height: 100,
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey[300]!),
                          ),
                          child: ListView.builder(
                            padding: const EdgeInsets.all(8),
                            itemCount: _batchLog.length,
                            itemBuilder: (context, index) {
                              final log = _batchLog[index];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                                  log,
                                  style: AppTheme.bodyStyle.copyWith(
                                    fontSize: 12,
                                    color: log.startsWith('❌') 
                                        ? AppTheme.errorColor 
                                        : log.startsWith('✅') 
                                            ? AppTheme.successColor 
                                            : null,
                                  ),
                                ),
              );
            },
          ),
                        ),
                      ],
                    ] else ...[
              Text(
                        '开启批量模式以进行大量NFC卡操作',
                        style: AppTheme.bodyStyle.copyWith(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // 操作状态
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
      children: [
                    Row(
                  children: [
                    Container(
                          padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                            color: AppTheme.accentColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Icons.info_outline,
                            color: AppTheme.accentColor,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Text(
                          '操作状态',
                          style: AppTheme.headingStyle.copyWith(fontSize: 20),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _nfcOperationStatus,
                      style: AppTheme.bodyStyle.copyWith(fontSize: 16),
                    ),
                    if (_lastReadData.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Text(
                        '最后读取: $_lastReadData',
                        style: AppTheme.captionStyle.copyWith(fontSize: 14),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // 模式选择
            Card(
              child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
              Text(
                      '操作模式',
                      style: AppTheme.headingStyle,
                    ),
                    const SizedBox(height: 8),
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
                            title: const Text('教师'),
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
              ),
            ),
            
            const SizedBox(height: 16),
            
            // 用户选择
            Card(
              child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
              Text(
                      _currentMode == 'student' ? '选择学生' : '选择教师',
                      style: AppTheme.headingStyle,
                    ),
                    const SizedBox(height: 8),
          
          // 搜索框
          TextField(
            controller: _searchController,
                      decoration: const InputDecoration(
                        hintText: '搜索姓名或ID',
                        prefixIcon: Icon(Icons.search),
                        border: OutlineInputBorder(),
            ),
                onChanged: (value) {
        setState(() {
                          _searchQuery = value;
              });
            },
          ),
                    
                    const SizedBox(height: 16),
                    
                    // 用户列表
                    SizedBox(
                      height: 200,
                      child: _currentMode == 'student' 
                        ? _buildStudentList()
                        : _buildTeacherList(),
                          ),
                        ],
            ),
          ),
        ),
      ],
        ),
      ),
    );
  }

  Widget _buildStudentList() {
    return Consumer<StudentProvider>(
      builder: (context, studentProvider, child) {
        final students = _filterStudents(studentProvider.students, _searchQuery);
        
        return ListView.builder(
          itemCount: students.length,
          itemBuilder: (context, index) {
            final student = students[index];
            final isSelected = student.id == _selectedStudentId;
            
            return ListTile(
              title: Text(student.getStringValue('student_name') ?? '未知'),
              subtitle: Text('ID: ${student.getStringValue('student_id') ?? '未知'}'),
              selected: isSelected,
              onTap: () {
        setState(() {
                  _selectedStudentId = student.id;
                  _selectedTeacherId = null;
                  });
                },
              );
            },
        );
      },
    );
  }

  Widget _buildTeacherList() {
    return Consumer<TeacherProvider>(
      builder: (context, teacherProvider, child) {
        final teachers = _filterTeachers(teacherProvider.teachers, _searchQuery);
        
        return ListView.builder(
          itemCount: teachers.length,
          itemBuilder: (context, index) {
            final teacher = teachers[index];
            final isSelected = teacher.id == _selectedTeacherId;
            
            return ListTile(
              title: Text(teacher.getStringValue('teacher_name') ?? '未知'),
              subtitle: Text('ID: ${teacher.getStringValue('teacher_id') ?? '未知'}'),
              selected: isSelected,
              onTap: () {
        setState(() {
                  _selectedTeacherId = teacher.id;
                  _selectedStudentId = null;
                });
              },
            );
          },
        );
      },
    );
  }
}
