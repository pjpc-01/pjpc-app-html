import 'package:pocketbase/pocketbase.dart';
import '../../../shared/services/pocketbase_service.dart';
import '../../features/student/providers/student_provider.dart';
import '../../features/teacher/providers/teacher_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// NFC管理服务 - 处理所有NFC相关的业务逻辑
class NFCManagementService {
  static final NFCManagementService _instance = NFCManagementService._internal();
  factory NFCManagementService() => _instance;
  NFCManagementService._internal();
  
  static NFCManagementService get instance => _instance;
  
  final PocketBaseService _pocketBaseService = PocketBaseService.instance;
  
  /// 分配NFC卡
  Future<Map<String, dynamic>> assignNfcCard({
    required String nfcId,
    required String userId,
    required String userType,
    required BuildContext context,
  }) async {
    try {
      final pb = _pocketBaseService.pb;
      
      
      // 检查认证状态
      if (!pb.authStore.isValid) {
        throw Exception('用户未认证，请重新登录');
      }
      
      String userName = '';
      String collectionName = '';
      
      if (userType == 'student') {
        collectionName = 'students';
        
        // 直接查询学生记录
        final student = await pb.collection('students').getOne(userId);
        userName = student.getStringValue('student_name') ?? '未知学生';
        
        // 检查是否已有NFC卡
        final currentCardNumber = student.getStringValue('cardNumber') ?? '';
        if (currentCardNumber.isNotEmpty && currentCardNumber != nfcId) {
        }
        
      } else {
        collectionName = 'teachers';
        
        // 直接查询教师记录
        final teacher = await pb.collection('teachers').getOne(userId);
        userName = teacher.getStringValue('name') ?? '未知教师';
        
        // 检查是否已有NFC卡
        final currentCardNumber = teacher.getStringValue('cardNumber') ?? '';
        if (currentCardNumber.isNotEmpty && currentCardNumber != nfcId) {
        }
      }
      
      // 准备更新数据
      final now = DateTime.now().toIso8601String();
      final updateData = {
        'cardNumber': nfcId,
        'nfc_associated_at': now,
        'nfc_last_used': now,
        'nfc_usage_count': 0,
      };
      
      
      // 直接更新记录
      final updatedRecord = await pb.collection(collectionName).update(userId, body: updateData);
      
      
      // 验证更新结果
      final verifyRecord = await pb.collection(collectionName).getOne(userId);
      final verifyCardNumber = verifyRecord.getStringValue('cardNumber') ?? '';
      
      if (verifyCardNumber == nfcId) {
        
        // 刷新Provider数据
        if (userType == 'student') {
          final studentProvider = context.read<StudentProvider>();
          await studentProvider.loadStudents(useCache: false);
        } else {
          final teacherProvider = context.read<TeacherProvider>();
          await teacherProvider.forceRefreshTeachers();
        }
        
        return {
          'success': true,
          'userName': userName,
          'nfcId': nfcId,
          'message': 'NFC卡分配成功'
        };
      } else {
        throw Exception('验证失败：期望cardNumber为$nfcId，但实际为$verifyCardNumber');
      }
      
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
        'message': 'NFC卡分配失败'
      };
    }
  }
  
  /// 查找卡片拥有者
  Future<Map<String, dynamic>> findCardOwner(String nfcId) async {
    try {
      
      // 首先尝试查找学生
      final student = await _pocketBaseService.getStudentByNfcId(nfcId);
      if (student != null) {
        final studentName = student.getStringValue('student_name') ?? '未知学生';
        final studentId = student.getStringValue('student_id') ?? 'N/A';
        final center = student.getStringValue('center') ?? 'N/A';
        
        return {
          'success': true,
          'type': 'student',
          'name': studentName,
          'id': studentId,
          'center': center,
          'nfcId': nfcId,
        };
      }

      // 如果没找到学生，尝试查找教师
      final teacher = await _pocketBaseService.getTeacherByNfcId(nfcId);
      if (teacher != null) {
        final teacherName = teacher.getStringValue('name') ?? '未知教师';
        final teacherId = teacher.getStringValue('teacher_id') ?? 'N/A';
        
        return {
          'success': true,
          'type': 'teacher',
          'name': teacherName,
          'id': teacherId,
          'nfcId': nfcId,
        };
      }

      // 如果都没找到
      return {
        'success': false,
        'message': '未找到该NFC卡的拥有者信息',
        'nfcId': nfcId,
      };
      
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
        'message': '查找卡片拥有者失败',
        'nfcId': nfcId,
      };
    }
  }
  
  /// 获取补办申请列表
  Future<List<RecordModel>> getReplacementRequests({String filter = 'pending'}) async {
    try {
      if (filter == 'all') {
        return await _pocketBaseService.getAllNfcReplacementRequests();
      } else if (filter == 'pending') {
        return await _pocketBaseService.getPendingNfcReplacementRequests();
      } else {
        // 对于其他状态，先获取所有申请然后过滤
        final allRequests = await _pocketBaseService.getAllNfcReplacementRequests();
        return allRequests.where((request) {
          final status = request.getStringValue('status') ?? '';
          return status == filter;
        }).toList();
      }
    } catch (e) {
      return [];
    }
  }
  
  /// 批准补办申请
  Future<bool> approveReplacementRequest(String requestId) async {
    try {
      await _pocketBaseService.updateNfcReplacementStatus(
        requestId,
        'approved',
        notes: '管理员批准',
      );
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /// 拒绝补办申请
  Future<bool> rejectReplacementRequest(String requestId) async {
    try {
      await _pocketBaseService.updateNfcReplacementStatus(
        requestId,
        'rejected',
        notes: '管理员拒绝',
      );
      return true;
    } catch (e) {
      return false;
    }
  }
}
