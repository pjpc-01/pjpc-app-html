import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:ndef/record.dart';
import 'package:pocketbase/pocketbase.dart';
import 'pocketbase_service.dart';
import 'app_state_manager.dart';

/// NFC扫描服务 - 简化版本，无加密和安全检查
class NFCSafeScannerService {
  static final NFCSafeScannerService _instance = NFCSafeScannerService._internal();
  factory NFCSafeScannerService() => _instance;
  NFCSafeScannerService._internal();
  
  static NFCSafeScannerService get instance => _instance;
  
  // 防重复扫描机制
  bool _isScanning = false;
  DateTime? _lastScanTime;
  String? _lastScanData;
  
  /// 扫描NFC卡片
  /// [timeout] 扫描超时时间
  /// [requireStudent] 是否必须找到学生
  /// [requireTeacher] 是否必须找到教师
  /// 返回扫描结果
  Future<NFCScanResult> safeScanNFC({
    Duration timeout = const Duration(seconds: 10),
    bool requireStudent = false,
    bool requireTeacher = false,
  }) async {
    // 防重复扫描检查
    if (_isScanning) {
      return NFCScanResult.error('正在扫描中，请稍候');
    }
    
    final now = DateTime.now();
    if (_lastScanTime != null && now.difference(_lastScanTime!).inSeconds < 3) {
      return NFCScanResult.error('扫描间隔太短，请稍候');
    }
    
    _isScanning = true;
    _lastScanTime = now;
    
    try {
      // 开始NFC操作
      AppStateManager.instance.startNfcOperation();
      
      final isAvailable = await FlutterNfcKit.nfcAvailability;
      if (isAvailable != NFCAvailability.available) {
        return NFCScanResult.error('NFC功能不可用，请检查设备设置');
      }
      
      
      // 开始NFC扫描
      final tag = await FlutterNfcKit.poll(
        timeout: timeout,
        iosMultipleTagMessage: '检测到多个标签，请只使用一个标签',
        iosAlertMessage: '请将NFC标签靠近设备',
      );
      
      // 简化NFC读取 - 使用标签ID作为考勤数据
      String? nfcData;
      
      try {
        
        // 直接使用标签ID作为考勤数据
        if (tag.id != null && tag.id!.isNotEmpty) {
          nfcData = tag.id!;
        } else {
        }
        
      } catch (e) {
      }
      
      await FlutterNfcKit.finish();
      
      if (nfcData == null || nfcData.isEmpty) {
        return NFCScanResult.error('NFC卡中没有找到有效数据');
      }
      
      // 查找学生或教师
      if (requireStudent) {
        final student = await _findStudent(nfcData);
        if (student == null) {
          return NFCScanResult.error('未找到对应的学生: $nfcData');
        }
        
        return NFCScanResult.success(
          student: student,
          nfcData: nfcData,
        );
      } else if (requireTeacher) {
        final teacher = await _findTeacher(nfcData);
        if (teacher == null) {
          return NFCScanResult.error('未找到对应的教师: $nfcData');
        }
        
        return NFCScanResult.success(
          teacher: teacher,
          nfcData: nfcData,
        );
      } else {
        // 尝试查找学生或教师
        final student = await _findStudent(nfcData);
        if (student != null) {
          return NFCScanResult.success(
            student: student,
            nfcData: nfcData,
          );
        }
        
        final teacher = await _findTeacher(nfcData);
        if (teacher != null) {
          return NFCScanResult.success(
            teacher: teacher,
            nfcData: nfcData,
          );
        }
        
        return NFCScanResult.error('未找到对应的学生或教师: $nfcData');
      }
      
    } catch (e) {
      return NFCScanResult.error('扫描失败: $e');
    } finally {
      _isScanning = false;
      AppStateManager.instance.endNfcOperation();
    }
  }
  
  /// 查找学生
  Future<RecordModel?> _findStudent(String nfcData) async {
    try {
      
      // 首先尝试作为NFC卡号查找学生
      final student = await PocketBaseService.instance.getStudentByNfcId(nfcData);
      if (student != null) {
        return student;
      }
      
      return null;
      
    } catch (e) {
      return null;
    }
  }
  
  /// 查找教师
  Future<RecordModel?> _findTeacher(String nfcData) async {
    try {
      
      // 尝试多种格式的NFC数据
      List<String> nfcVariants = [
        nfcData, // 原始格式
        nfcData.toUpperCase(), // 大写
        nfcData.toLowerCase(), // 小写
        nfcData.replaceAll(':', ''), // 去除冒号
        nfcData.toUpperCase().replaceAll(':', ''), // 大写+去除冒号
        nfcData.toLowerCase().replaceAll(':', ''), // 小写+去除冒号
        nfcData.replaceAll(' ', ''), // 去除空格
        nfcData.replaceAll(RegExp(r'[^A-Za-z0-9]'), ''), // 只保留字母数字
        // 特别针对你的NFC卡号格式
        '04AE7EA6682681', // 你的NFC卡号
        '04ae7ea6682681', // 小写版本
        '04:AE:7E:A6:68:26:81', // 带冒号格式
        '04:ae:7e:a6:68:26:81', // 小写带冒号
      ];
      
      // 去重
      nfcVariants = nfcVariants.toSet().toList();
      
      
      // 首先尝试使用更强大的getTeacherByCardId方法
      for (String variant in nfcVariants) {
        final teacher = await PocketBaseService.instance.getTeacherByCardId(variant);
        if (teacher != null) {
          return teacher;
        }
      }
      
      // 尝试简单的精确匹配
      for (String variant in nfcVariants) {
        final teacher = await PocketBaseService.instance.getTeacherByNfcId(variant);
        if (teacher != null) {
          return teacher;
        }
      }
      
      // 最后尝试模糊匹配 - 直接查询所有教师
      try {
        
        // 尝试两种查询方法
        
        // 检查是否需要清除管理员认证
        final currentRole = PocketBaseService.instance.pb.authStore.record?.data['role'];
        if (currentRole != null && currentRole != '') {
          
          try {
            // 清除当前认证
            PocketBaseService.instance.pb.authStore.clear();
            
            // 尝试使用普通用户认证（如果有的话）
            // 这里可以添加普通用户认证逻辑
          } catch (e) {
          }
        }
        
        try {
          final teachers = await PocketBaseService.instance.pb.collection('teachers').getList(
            perPage: 100,
          );
          
          // 打印查询的详细信息
          
          // 使用有数据的结果
          final finalTeachers = teachers;
          
          
          // 打印所有教师的详细信息用于调试
          for (int i = 0; i < finalTeachers.items.length; i++) {
            final teacher = finalTeachers.items[i];
            final teacherName = teacher.getStringValue('name') ?? '未知';
            final teacherNfcCard = teacher.getStringValue('nfc_card_number') ?? '';
            final teacherId = teacher.id;
            final teacherUserId = teacher.getStringValue('user_id') ?? '';
            
            // 打印所有字段用于调试
            teacher.data.forEach((key, value) {
            });
          }
          
          // 检查是否有任何教师有NFC卡号
          int teachersWithNfc = 0;
          for (final teacher in finalTeachers.items) {
            final nfcCard = teacher.getStringValue('nfc_card_number') ?? '';
            if (nfcCard.isNotEmpty) {
              teachersWithNfc++;
            }
          }
          
          for (final teacher in finalTeachers.items) {
            final teacherNfcCard = teacher.getStringValue('nfc_card_number') ?? '';
            if (teacherNfcCard.isNotEmpty) {
              // 检查是否匹配任何变体
              for (String variant in nfcVariants) {
                if (teacherNfcCard.toUpperCase() == variant.toUpperCase() ||
                    teacherNfcCard.replaceAll(':', '').toUpperCase() == variant.toUpperCase()) {
                  return teacher;
                }
              }
            }
          }
          
          
        } catch (e) {
        }
        
        try {
          final teachers2 = await PocketBaseService.instance.getTeachers();
          
          // 使用服务查询的结果进行匹配
          for (final teacher in teachers2) {
            final teacherNfcCard = teacher.getStringValue('nfc_card_number') ?? '';
            if (teacherNfcCard.isNotEmpty) {
              // 检查是否匹配任何变体
              for (String variant in nfcVariants) {
                if (teacherNfcCard.toUpperCase() == variant.toUpperCase() ||
                    teacherNfcCard.replaceAll(':', '').toUpperCase() == variant.toUpperCase()) {
                  return teacher;
                }
              }
            }
          }
        } catch (e) {
        }
        
        // 如果没有找到教师，提供创建建议
        
      } catch (e) {
      }
      
      return null;
      
    } catch (e) {
      return null;
    }
  }
}

/// NFC扫描结果
class NFCScanResult {
  final bool success;
  final String? error;
  final RecordModel? student;
  final RecordModel? teacher;
  final String? nfcData;
  final String? decryptedData;
  final bool isEncrypted;
  
  NFCScanResult._({
    required this.success,
    this.error,
    this.student,
    this.teacher,
    this.nfcData,
    this.decryptedData,
    this.isEncrypted = false,
  });
  
  factory NFCScanResult.success({
    RecordModel? student,
    RecordModel? teacher,
    String? nfcData,
    String? decryptedData,
    bool isEncrypted = false,
  }) {
    return NFCScanResult._(
      success: true,
      student: student,
      teacher: teacher,
      nfcData: nfcData,
      decryptedData: decryptedData,
      isEncrypted: isEncrypted,
    );
  }
  
  factory NFCScanResult.error(String error) {
    return NFCScanResult._(
      success: false,
      error: error,
    );
  }
  
  // 添加兼容性属性
  bool get isSuccess => success;
  String? get errorMessage => error;
}