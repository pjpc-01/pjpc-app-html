import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/pocketbase_service.dart';
import '../services/error_handler_service.dart';
import '../services/network_service.dart';

class AuthProvider with ChangeNotifier {
  final SharedPreferences _prefs;
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  RecordModel? _user;
  RecordModel? _userProfile;
  String _connectionStatus = 'disconnected';
  
  // 多角色支持
  List<String> _userRoles = [];
  String _activeRole = '';
  bool _roleSwitchingEnabled = false;

  AuthProvider(this._prefs) : _pocketBaseService = PocketBaseService.instance {
    _initializeAuth();
  }

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  RecordModel? get user => _user;
  RecordModel? get userProfile => _userProfile;
  String get connectionStatus => _connectionStatus;
  bool get isAuthenticated => _pocketBaseService.isAuthenticated;
  
  // 多角色相关getters
  List<String> get userRoles => _userRoles;
  String get activeRole => _activeRole;
  bool get roleSwitchingEnabled => _roleSwitchingEnabled;
  bool get hasMultipleRoles => _userRoles.length > 1;

  void _initializeAuth() {
    _user = _pocketBaseService.currentUser;
    _userProfile = _pocketBaseService.currentUserProfile;
    if (_user != null) {
      _connectionStatus = 'connected';
      _initializeUserRoles();
    }
    notifyListeners();
    
    // 尝试自动登录
    _attemptAutoLogin();
  }
  
  /// 初始化用户角色
  void _initializeUserRoles() {
    if (_userProfile == null) return;
    
    final userEmail = _userProfile!.getStringValue('email') ?? '';
    
    // 通过邮箱识别多角色用户
    _userRoles = _getRolesByEmail(userEmail);
    
    // 设置当前激活角色
    _activeRole = _userProfile!.getStringValue('active_role') ?? 
                  (_userRoles.isNotEmpty ? _userRoles.first : '');
    
    // 检查是否允许多角色切换
    _roleSwitchingEnabled = _userRoles.length > 1;
  }
  
  /// 根据邮箱获取用户角色
  List<String> _getRolesByEmail(String email) {
    // 多角色用户邮箱映射
    final multiRoleUsers = {
      'munpoo5566@gmail.com': ['admin', 'teacher', 'parent'],
      'admin_teacher@example.com': ['admin', 'teacher'],
      'teacher_parent@example.com': ['teacher', 'parent'],
      'triple_role@example.com': ['admin', 'teacher', 'parent'],
      // 可以继续添加更多多角色用户
    };
    
    // 检查是否为多角色用户
    if (multiRoleUsers.containsKey(email)) {
      return multiRoleUsers[email]!;
    }
    
    // 单一角色用户，从role字段获取
    final singleRole = _userProfile?.getStringValue('role') ?? '';
    return singleRole.isNotEmpty ? [singleRole] : [];
  }
  
  /// 添加多角色用户（用于动态管理）
  static void addMultiRoleUser(String email, List<String> roles) {
    // 这个方法可以在运行时添加多角色用户
    // 实际实现中可能需要从服务器获取配置
  }
  
  /// 获取多角色用户列表（用于管理）
  static Map<String, List<String>> getMultiRoleUsers() {
    return {
      'munpoo5566@gmail.com': ['admin', 'teacher', 'parent'],
      'admin_teacher@example.com': ['admin', 'teacher'],
      'teacher_parent@example.com': ['teacher', 'parent'],
      'triple_role@example.com': ['admin', 'teacher', 'parent'],
    };
  }
