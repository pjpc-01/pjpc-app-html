import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import '../services/pocketbase_service.dart';
import '../services/error_handler_service.dart';

class NotificationProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  List<RecordModel> _notifications = [];
  List<RecordModel> _unreadNotifications = [];
  Map<String, bool> _expandedNotifications = {};

  NotificationProvider({PocketBaseService? pocketBaseService}) 
      : _pocketBaseService = pocketBaseService ?? PocketBaseService.instance;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<RecordModel> get notifications => _notifications;
  List<RecordModel> get unreadNotifications => _unreadNotifications;
  int get unreadCount => _unreadNotifications.length;

  // 设置加载状态
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  // 设置错误信息
  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  // 清除错误信息
  void _clearError() {
    _error = null;
    notifyListeners();
  }

  // 加载所有通知
  Future<void> loadNotifications({bool useCache = true}) async {
    _setLoading(true);
    _clearError();

    try {
      if (!_pocketBaseService.isAuthenticated) {
        throw Exception('用户未认证，请先登录');
      }
      
      // 获取当前用户角色
      final currentUser = _pocketBaseService.pb.authStore.record;
      final userRole = currentUser?.getStringValue('role') ?? '';
      
      print('=== NotificationProvider 加载通知 ===');
      print('用户角色: $userRole');
      
      List<RecordModel> allNotifications = [];
      
      if (userRole == 'admin') {
        // 管理员可以看到所有通知
        print('管理员用户，获取所有通知...');
        _notifications = await _pocketBaseService.getAllNotifications(perPage: 200);
      } else if (userRole.isNotEmpty) {
        // 其他角色获取发送给当前角色的通知
        final roleNotifications = await _pocketBaseService.getNotifications(
          perPage: 100,
        );
        allNotifications.addAll(roleNotifications);
        
        // 获取发送给所有用户的通知
        final allUserNotifications = await _pocketBaseService.getNotificationsForRole('all');
        allNotifications.addAll(allUserNotifications);
        
        // 去重
        final seenIds = <String>{};
        _notifications = allNotifications.where((notification) {
          if (seenIds.contains(notification.id)) {
            return false;
          }
          seenIds.add(notification.id);
          return true;
        }).toList();
      } else {
        // 如果没有角色信息，获取所有通知
        _notifications = await _pocketBaseService.getNotifications(
          perPage: 100,
        );
      }
      
      // 过滤未读通知
      _unreadNotifications = _notifications.where((notification) {
        return !(notification.getBoolValue('is_read') ?? false);
      }).toList();
      
      print('加载到 ${_notifications.length} 个通知，其中 ${_unreadNotifications.length} 个未读');
      
      // 打印前几个通知的详细信息用于调试
      for (int i = 0; i < _notifications.length && i < 3; i++) {
        final notification = _notifications[i];
        print('通知 $i: ID=${notification.id}, 标题=${notification.getStringValue('title')}, 接收者=${notification.getStringValue('recipient_role')}');
      }
      
      notifyListeners();
    } catch (e) {
      _setError(ErrorHandlerService.getErrorMessage(e));
    } finally {
      _setLoading(false);
    }
  }

  // 标记通知为已读
  Future<void> markAsRead(String notificationId) async {
    try {
      await _pocketBaseService.updateNotificationStatus(notificationId, true);
      
      // 更新本地状态
      final index = _notifications.indexWhere((n) => n.id == notificationId);
      if (index != -1) {
        final notification = _notifications[index];
        final updatedData = Map<String, dynamic>.from(notification.data);
        updatedData['is_read'] = true;
        updatedData['read_at'] = DateTime.now().toIso8601String();
        
        // 增加已读计数
        final currentReadCount = notification.getIntValue('read_count') ?? 0;
        updatedData['read_count'] = currentReadCount + 1;
        
        _notifications[index] = RecordModel.fromJson({
          'id': notification.id,
          'created': notification.created,
          'updated': notification.updated,
          'collectionId': notification.collectionId,
          'collectionName': notification.collectionName,
          ...updatedData,
        });
      }
      
      // 更新未读列表
      _unreadNotifications.removeWhere((n) => n.id == notificationId);
      
      notifyListeners();
    } catch (e) {
      _setError(ErrorHandlerService.getErrorMessage(e));
    }
  }

  // 标记所有通知为已读
  Future<void> markAllAsRead() async {
    try {
      for (final notification in _unreadNotifications) {
        await _pocketBaseService.updateNotificationStatus(notification.id, true);
      }
      
      // 更新本地状态
      _notifications = _notifications.map((notification) {
        if (!(notification.getBoolValue('is_read') ?? false)) {
          final updatedData = Map<String, dynamic>.from(notification.data);
          updatedData['is_read'] = true;
          updatedData['read_at'] = DateTime.now().toIso8601String();
          
          return RecordModel.fromJson({
            'id': notification.id,
            'created': notification.created,
            'updated': notification.updated,
            'collectionId': notification.collectionId,
            'collectionName': notification.collectionName,
            ...updatedData,
          });
        }
        return notification;
      }).toList();
      
      _unreadNotifications.clear();
      notifyListeners();
    } catch (e) {
      _setError(ErrorHandlerService.getErrorMessage(e));
    }
  }

  // 创建新通知（管理员功能）
  Future<void> createNotification({
    required String title,
    required String message,
    required String type,
    required String recipientRole,
  }) async {
    try {
      await _pocketBaseService.createNotification({
        'title': title,
        'message': message,
        'type': type,
        'recipient_role': recipientRole,
      });
      
      // 重新加载通知列表
      await loadNotifications(useCache: false);
    } catch (e) {
      _setError(ErrorHandlerService.getErrorMessage(e));
    }
  }

  // 删除通知（管理员功能）
  Future<void> deleteNotification(String notificationId) async {
    try {
      await _pocketBaseService.deleteNotification(notificationId);
      
      // 更新本地状态
      _notifications.removeWhere((n) => n.id == notificationId);
      _unreadNotifications.removeWhere((n) => n.id == notificationId);
      
      notifyListeners();
    } catch (e) {
      _setError(ErrorHandlerService.getErrorMessage(e));
    }
  }

  // 切换通知展开状态
  void toggleExpanded(String notificationId) {
    _expandedNotifications[notificationId] = 
        !(_expandedNotifications[notificationId] ?? false);
    notifyListeners();
  }

  // 检查通知是否展开
  bool isExpanded(String notificationId) {
    return _expandedNotifications[notificationId] ?? false;
  }

  // 获取通知优先级颜色
  Color getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return const Color(0xFFEF4444);
      case 'high':
        return const Color(0xFFF59E0B);
      case 'normal':
        return const Color(0xFF3B82F6);
      case 'low':
        return const Color(0xFF6B7280);
      default:
        return const Color(0xFF3B82F6);
    }
  }

  // 获取通知类型图标
  IconData getTypeIcon(String type) {
    switch (type.toLowerCase()) {
      case 'announcement':
        return Icons.announcement;
      case 'urgent':
        return Icons.warning;
      case 'meeting':
        return Icons.meeting_room;
      case 'system':
        return Icons.settings;
      case 'event':
        return Icons.event;
      default:
        return Icons.notifications;
    }
  }

  // 格式化时间
  String formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inDays > 0) {
      return '${difference.inDays}天前';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}小时前';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}分钟前';
    } else {
      return '刚刚';
    }
  }
}
