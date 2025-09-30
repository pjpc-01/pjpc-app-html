import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../shared/services/pocketbase_service.dart';
import '../../../shared/services/error_handler_service.dart';

enum NfcCardStatus {
  normal,      // 正常
  lost,        // 丢失
  damaged,     // 损坏
  replacing,   // 补办中
  suspended,   // 暂停使用
}

class NfcReplacementRequest {
  final String id;
  final String studentId;
  final String studentName;
  final String className;
  final String teacherId;
  final String reason;
  final DateTime lostDate;
  final String lostLocation;
  final String urgency;
  final String status;
  final DateTime requestDate;
  final String? notes;

  NfcReplacementRequest({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.className,
    required this.teacherId,
    required this.reason,
    required this.lostDate,
    required this.lostLocation,
    required this.urgency,
    required this.status,
    required this.requestDate,
    this.notes,
  });

  factory NfcReplacementRequest.fromJson(Map<String, dynamic> json) {
    return NfcReplacementRequest(
      id: json['id'] ?? '',
      studentId: json['student_id'] ?? '',
      studentName: json['student_name'] ?? '',
      className: json['class_name'] ?? '',
      teacherId: json['teacher_id'] ?? '',
      reason: json['reason'] ?? '',
      lostDate: DateTime.tryParse(json['lost_date'] ?? '') ?? DateTime.now(),
      lostLocation: json['lost_location'] ?? '',
      urgency: json['urgency'] ?? 'normal',
      status: json['status'] ?? 'pending',
      requestDate: DateTime.tryParse(json['request_date'] ?? '') ?? DateTime.now(),
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'student_id': studentId,
      'student_name': studentName,
      'class_name': className,
      'teacher_id': teacherId,
      'reason': reason,
      'lost_date': lostDate.toIso8601String(),
      'lost_location': lostLocation,
      'urgency': urgency,
      'status': status,
      'request_date': requestDate.toIso8601String(),
      'notes': notes,
    };
  }
}

class NfcCardProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  List<Map<String, dynamic>> _replacementRequests = [];
  Map<String, NfcCardStatus> _cardStatuses = {};
  Map<String, dynamic> _nfcCards = {};

  NfcCardProvider({PocketBaseService? pocketBaseService}) 
      : _pocketBaseService = pocketBaseService ?? PocketBaseService.instance;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<Map<String, dynamic>> get replacementRequests => _replacementRequests;
  Map<String, NfcCardStatus> get cardStatuses => _cardStatuses;
  Map<String, dynamic> get nfcCards => _nfcCards;

  // 加载NFC卡数据（包含关系数据）
  Future<void> loadReplacementRequests() async {
    _setLoading(true);
    _clearError();

    try {
      if (!_pocketBaseService.isAuthenticated) {
        throw Exception('用户未认证，请先登录');
      }
      
      // 从PocketBase获取NFC卡数据，包含学生和用户关系
      final records = await _pocketBaseService.pb
          .collection('nfc_cards')
          .getFullList(expand: 'student,updated_by');
      
      _nfcCards = {};
      _replacementRequests = [];
      
      for (final record in records) {
        final studentId = record.getStringValue('student');
        _nfcCards[studentId] = record.toJson();
        
        // 如果有补办申请，添加到申请列表
        if (record.getStringValue('replacement_request_id')?.isNotEmpty == true) {
          _replacementRequests.add(record.toJson());
        }
      }
      
      notifyListeners();
    } catch (e) {
      _setError('加载NFC卡数据失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // 提交补办申请
  Future<bool> submitReplacementRequest({
    required String studentId,
    required String studentName,
    required String className,
    required String teacherId,
    required String reason,
    required DateTime lostDate,
    required String lostLocation,
    required String urgency,
    String? notes,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final requestId = DateTime.now().millisecondsSinceEpoch.toString();
      
      // 检查是否已存在NFC卡记录
      final existingRecord = await _pocketBaseService.pb
          .collection('nfc_cards')
          .getFirstListItem('student = "$studentId"');
      
      // 更新现有记录
      await _pocketBaseService.pb
          .collection('nfc_cards')
          .update(existingRecord.id, body: {
        'card_status': 'lost',
        'replacement_request_id': requestId,
        'replacement_reason': reason,
        'replacement_lost_date': lostDate.toIso8601String(),
        'replacement_lost_location': lostLocation,
        'replacement_urgency': urgency,
        'replacement_status': 'pending',
        'replacement_request_date': DateTime.now().toIso8601String(),
        'replacement_notes': notes,
        'student_name': studentName,
        'class_name': className,
        'last_updated': DateTime.now().toIso8601String(),
        'updated_by': teacherId,
      });
      
      // 重新加载数据
      await loadReplacementRequests();
      return true;
    } catch (e) {
      // 如果没有现有记录，创建新记录
      try {
        final requestId = DateTime.now().millisecondsSinceEpoch.toString();
        
        await _pocketBaseService.pb
            .collection('nfc_cards')
            .create(body: {
          'student': studentId,
          'card_status': 'lost',
          'replacement_request_id': requestId,
          'replacement_reason': reason,
          'replacement_lost_date': lostDate.toIso8601String(),
          'replacement_lost_location': lostLocation,
          'replacement_urgency': urgency,
          'replacement_status': 'pending',
          'replacement_request_date': DateTime.now().toIso8601String(),
          'replacement_notes': notes,
          'student_name': studentName,
          'class_name': className,
          'last_updated': DateTime.now().toIso8601String(),
          'updated_by': teacherId,
        });
        
        // 重新加载数据
        await loadReplacementRequests();
        return true;
      } catch (createError) {
        _setError('提交补办申请失败: ${createError.toString()}');
        return false;
      }
    } finally {
      _setLoading(false);
    }
  }

  // 审核补办申请
  Future<bool> reviewReplacementRequest(String requestId, String action, {String? notes}) async {
    _setLoading(true);
    _clearError();

    try {
      // 根据requestId找到对应的NFC卡记录
      final record = await _pocketBaseService.pb
          .collection('nfc_cards')
          .getFirstListItem('replacement_request_id = "$requestId"');
      
      if (action == 'approve') {
        // 批准申请
        await _pocketBaseService.pb
            .collection('nfc_cards')
            .update(record.id, body: {
          'replacement_status': 'approved',
          'replacement_notes': notes,
          'card_status': 'replacing',
          'last_updated': DateTime.now().toIso8601String(),
          'updated_by': 'admin', // 或者从认证信息获取
        });
      } else if (action == 'reject') {
        // 拒绝申请
        await _pocketBaseService.pb
            .collection('nfc_cards')
            .update(record.id, body: {
          'replacement_status': 'rejected',
          'replacement_notes': notes,
          'card_status': 'normal',
          'last_updated': DateTime.now().toIso8601String(),
          'updated_by': 'admin', // 或者从认证信息获取
        });
      }

      // 重新加载数据
      await loadReplacementRequests();
      return true;
    } catch (e) {
      _setError('审核补办申请失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 完成补办
  Future<bool> completeReplacement(String requestId) async {
    _setLoading(true);
    _clearError();

    try {
      // 根据requestId找到对应的NFC卡记录
      final record = await _pocketBaseService.pb
          .collection('nfc_cards')
          .getFirstListItem('replacement_request_id = "$requestId"');
      
      // 更新记录状态为已完成
      await _pocketBaseService.pb
          .collection('nfc_cards')
          .update(record.id, body: {
        'replacement_status': 'completed',
        'card_status': 'normal',
        'replacement_request_id': '', // 清空申请ID
        'last_updated': DateTime.now().toIso8601String(),
        'updated_by': 'admin', // 或者从认证信息获取
      });
      
      // 重新加载数据
      await loadReplacementRequests();
      return true;
    } catch (e) {
      _setError('完成补办失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 标记NFC卡丢失
  Future<bool> markCardAsLost(String studentId) async {
    try {
      _cardStatuses[studentId] = NfcCardStatus.lost;
      notifyListeners();
      return true;
    } catch (e) {
      _setError('标记NFC卡丢失失败: ${e.toString()}');
      return false;
    }
  }

  // 获取NFC卡状态
  NfcCardStatus getCardStatus(String studentId) {
    final card = _nfcCards[studentId];
    if (card == null) return NfcCardStatus.normal;
    
    final status = card['card_status'] as String?;
    switch (status) {
      case 'lost':
        return NfcCardStatus.lost;
      case 'damaged':
        return NfcCardStatus.damaged;
      case 'replacing':
        return NfcCardStatus.replacing;
      case 'suspended':
        return NfcCardStatus.suspended;
      default:
        return NfcCardStatus.normal;
    }
  }

  // 获取学生信息（从关系数据中获取）
  Map<String, dynamic>? getStudentInfo(String studentId) {
    final card = _nfcCards[studentId];
    if (card == null) return null;
    
    return card['expand']?['student'] as Map<String, dynamic>?;
  }

  // 获取更新者信息（从关系数据中获取）
  Map<String, dynamic>? getUpdatedByInfo(String studentId) {
    final card = _nfcCards[studentId];
    if (card == null) return null;
    
    return card['expand']?['updated_by'] as Map<String, dynamic>?;
  }

  // 获取状态显示文本
  String getStatusDisplayText(NfcCardStatus status) {
    switch (status) {
      case NfcCardStatus.normal:
        return '正常';
      case NfcCardStatus.lost:
        return '丢失';
      case NfcCardStatus.damaged:
        return '损坏';
      case NfcCardStatus.replacing:
        return '补办中';
      case NfcCardStatus.suspended:
        return '暂停使用';
    }
  }

  // 获取状态颜色
  Color getStatusColor(NfcCardStatus status) {
    switch (status) {
      case NfcCardStatus.normal:
        return Colors.green;
      case NfcCardStatus.lost:
        return Colors.red;
      case NfcCardStatus.damaged:
        return Colors.orange;
      case NfcCardStatus.replacing:
        return Colors.blue;
      case NfcCardStatus.suspended:
        return Colors.grey;
    }
  }

  // 获取紧急程度显示文本
  String getUrgencyDisplayText(String urgency) {
    switch (urgency) {
      case 'low':
        return '低';
      case 'normal':
        return '普通';
      case 'high':
        return '高';
      case 'urgent':
        return '紧急';
      default:
        return '普通';
    }
  }

  // 获取紧急程度颜色
  Color getUrgencyColor(String urgency) {
    switch (urgency) {
      case 'low':
        return Colors.green;
      case 'normal':
        return Colors.blue;
      case 'high':
        return Colors.orange;
      case 'urgent':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  // 获取状态显示文本
  String getRequestStatusDisplayText(String status) {
    switch (status) {
      case 'pending':
        return '待审核';
      case 'approved':
        return '已批准';
      case 'rejected':
        return '已拒绝';
      case 'completed':
        return '已完成';
      default:
        return '未知';
    }
  }

  // 获取状态颜色
  Color getRequestStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'approved':
        return Colors.blue;
      case 'rejected':
        return Colors.red;
      case 'completed':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }


  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _clearError();
  }
}
