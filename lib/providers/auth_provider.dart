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
    final userRole = _userProfile!.getStringValue('role') ?? '';
    
    // 通过邮箱识别多角色用户
    _userRoles = _getRolesByEmail(userEmail);
    
    // 设置当前激活角色
    _activeRole = _userProfile!.getStringValue('active_role') ?? 
                  (_userRoles.isNotEmpty ? _userRoles.first : userRole);
    
    // 检查是否允许多角色切换
    _roleSwitchingEnabled = _userRoles.length > 1;
    
    // 异步检查teachers集合
    _checkTeacherRolesAsync(userEmail);
  }
  
  /// 异步检查teachers集合中的角色
  Future<void> _checkTeacherRolesAsync(String email) async {
    try {
      // 检查teachers集合中是否有对应邮箱的记录
      final teachers = await _pocketBaseService.getTeachers();
      
      final teacherRecord = teachers.firstWhere(
        (teacher) => teacher.getStringValue('email') == email,
        orElse: () => throw Exception('No teacher found'),
      );
      
      // 如果找到teacher记录，添加teacher角色
      if (teacherRecord != null) {
        final currentRoles = List<String>.from(_userRoles);
        if (!currentRoles.contains('teacher')) {
          currentRoles.add('teacher');
          _userRoles = currentRoles;
          _roleSwitchingEnabled = _userRoles.length > 1;
          notifyListeners();
        }
      }
    } catch (e) {
      // 没有找到teacher记录，保持原有角色
    }
  }
  
  /// 根据邮箱获取用户角色
  List<String> _getRolesByEmail(String email) {
    // 从配置文件获取多角色用户映射
    final multiRoleUsers = _getMultiRoleUsersConfig();
    
    // 检查是否为多角色用户
    if (multiRoleUsers.containsKey(email)) {
      return multiRoleUsers[email]!;
    }
    
    // 单一角色用户，从role字段获取
    final singleRole = _userProfile?.getStringValue('role') ?? '';
    return singleRole.isNotEmpty ? [singleRole] : [];
  }
  
  /// 通过邮箱检查teachers集合中的角色
  List<String> _getTeacherRolesByEmail(String email) {
    // 这里需要检查teachers集合中是否有对应邮箱的记录
    // 如果有，说明用户既是users中的用户，也是teachers中的教师
    // 可以根据需要返回多个角色
    
    // 注意：这里需要异步获取teachers数据，但当前方法是同步的
    // 可以考虑在初始化时预先加载teachers数据
    return [];
  }
  
  /// 获取多角色用户配置
  Map<String, List<String>> _getMultiRoleUsersConfig() {
    // 返回空配置，让系统完全基于数据库智能识别
    return {};
  }
  
  /// 尝试自动登录
  Future<void> _attemptAutoLogin() async {
    try {
      // 检查是否有保存的凭据
      final email = _prefs.getString('saved_email');
      final password = _prefs.getString('saved_password');
      if (email != null && password != null) {
        // 直接调用登录，不进行网络检查
        await _performLogin(email, password);
      }
    } catch (e) {
      // 自动登录失败时清除凭据
      await _prefs.remove('saved_email');
      await _prefs.remove('saved_password');
    }
  }
  
  /// 执行登录操作（不进行网络检查）
  Future<void> _performLogin(String email, String password) async {
    _setLoading(true);
    _clearError();

    try {
      final authData = await _pocketBaseService.login(email, password);
      _user = authData.record;
      _userProfile = authData.record;
      _connectionStatus = 'connected';
      
      // 保存凭据到SharedPreferences
      await _prefs.setString('saved_email', email);
      await _prefs.setString('saved_password', password);
      
      // 保存登录状态到SharedPreferences
      await _prefs.setBool('is_logged_in', true);
      await _prefs.setString('user_email', email);
      
      notifyListeners();
    } catch (e) {
      _setError(ErrorHandlerService.getErrorMessage(e));
    } finally {
      _setLoading(false);
    }
  }

  Future<void> login(String email, String password) async {
    // 检查网络连接（如果网络服务可用）
    try {
      if (!NetworkService.instance.isConnected) {
        throw Exception('网络连接不可用，请检查网络设置');
      }
    } catch (e) {
      // 如果网络服务不可用，继续尝试登录
    }

    // 执行登录操作
    await _performLogin(email, password);
  }

  Future<void> register({
    required String email,
    required String password,
    required String passwordConfirm,
    required String name,
    required String role,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      await _pocketBaseService.register(
        email: email,
        password: password,
        passwordConfirm: passwordConfirm,
        name: name,
        role: role,
      );
      
      // Registration successful, user needs to wait for approval
      notifyListeners();
    } catch (e) {
      _setError('注册失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    _setLoading(true);
    
    try {
      await _pocketBaseService.logout();
      _user = null;
      _userProfile = null;
      _connectionStatus = 'disconnected';
      
      // 清除保存的凭据
      await _prefs.remove('saved_email');
      await _prefs.remove('saved_password');
      
      // Clear saved login state
      await _prefs.remove('is_logged_in');
      await _prefs.remove('user_email');
      
      notifyListeners();
    } catch (e) {
      _setError('登出失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> resendVerification() async {
    // Implementation for resending verification email
    // This would depend on PocketBase configuration
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

  // Check if user has specific role
  bool hasRole(String role) {
    return _userRoles.contains(role);
  }
  
  // 切换角色
  Future<void> switchRole(String newRole) async {
    if (!_userRoles.contains(newRole)) {
      throw Exception('用户没有 $newRole 角色权限');
    }
    
    _activeRole = newRole;
    await _saveActiveRole(newRole);
    notifyListeners();
  }
  
  // 保存当前激活角色
  Future<void> _saveActiveRole(String role) async {
    try {
      await _prefs.setString('active_role', role);
    } catch (e) {
      print('保存激活角色失败: $e');
    }
  }

  // Check if user is admin (基于当前激活角色)
  bool get isAdmin {
    return _activeRole == 'admin' || (_activeRole.isEmpty && (_userProfile?.getStringValue('role') ?? '') == 'admin');
  }

  // Check if user is teacher (基于当前激活角色)
  bool get isTeacher {
    return _activeRole == 'teacher' || (_activeRole.isEmpty && (_userProfile?.getStringValue('role') ?? '') == 'teacher');
  }

  // Check if user is parent (基于当前激活角色)
  bool get isParent {
    return _activeRole == 'parent' || (_activeRole.isEmpty && (_userProfile?.getStringValue('role') ?? '') == 'parent');
  }

  // Check if user is accountant (基于当前激活角色)
  bool get isAccountant {
    return _activeRole == 'accountant' || (_activeRole.isEmpty && (_userProfile?.getStringValue('role') ?? '') == 'accountant');
  }

  // Get user role display name (基于当前激活角色)
  String get roleDisplayName {
    // 如果_activeRole为空，尝试从role字段获取
    if (_activeRole.isEmpty) {
      final fallbackRole = _userProfile?.getStringValue('role') ?? '';
      return getRoleDisplayName(fallbackRole);
    }
    return getRoleDisplayName(_activeRole);
  }
  
  // 获取角色显示名称
  String getRoleDisplayName(String role) {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'teacher':
        return '老师';
      case 'parent':
        return '家长';
      case 'accountant':
        return '会计';
      default:
        return '用户';
    }
  }
  
  // 获取所有角色的显示名称
  List<String> get roleDisplayNames {
    return _userRoles.map((role) => getRoleDisplayName(role)).toList();
  }

  // Check if user account is pending approval
  bool get isPendingApproval {
    return _userProfile?.getStringValue('status') == 'pending';
  }

  // Check if user account is suspended
  bool get isSuspended {
    return _userProfile?.getStringValue('status') == 'suspended';
  }
  
  // 检查认证状态并尝试自动重新认证
  Future<bool> checkAuthStatusWithReauth() async {
    // 如果当前认证有效，直接返回true
    if (_pocketBaseService.isAuthenticated && _user != null) {
      return true;
    }
    
    // 尝试自动重新认证
    try {
      await _attemptAutoLogin();
      return _pocketBaseService.isAuthenticated && _user != null;
    } catch (e) {
      return false;
    }
  }
  
  // 刷新用户信息
  Future<void> refreshUserInfo() async {
    try {
      if (_pocketBaseService.isAuthenticated) {
        _user = _pocketBaseService.currentUser;
        _userProfile = _pocketBaseService.currentUserProfile;
        notifyListeners();
      }
    } catch (e) {
    }
  }
}
