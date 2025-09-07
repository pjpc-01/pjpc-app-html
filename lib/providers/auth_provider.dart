import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/pocketbase_service.dart';
import '../services/secure_storage_service.dart';
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

  void _initializeAuth() {
    _user = _pocketBaseService.currentUser;
    _userProfile = _pocketBaseService.currentUserProfile;
    if (_user != null) {
      _connectionStatus = 'connected';
    }
    notifyListeners();
    
    // 尝试自动登录
    _attemptAutoLogin();
  }
  
  /// 尝试自动登录
  Future<void> _attemptAutoLogin() async {
    try {
      // 检查是否有保存的凭据
      if (await SecureStorageService.hasCredentials()) {
        final credentials = await SecureStorageService.getCredentials();
        if (credentials['email'] != null && credentials['password'] != null) {
          // 直接调用登录，不进行网络检查
          await _performLogin(credentials['email']!, credentials['password']!);
        }
      }
    } catch (e) {
      // 自动登录失败时清除凭据
      await SecureStorageService.clearCredentials();
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
      
      // 使用安全存储保存凭据
      await SecureStorageService.saveCredentials(email, password);
      await SecureStorageService.saveUserData(authData.record.data);
      
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
      
      // 清除安全存储
      await SecureStorageService.clearCredentials();
      
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
    return _userProfile?.getStringValue('role') == role;
  }

  // Check if user is admin
  bool get isAdmin => hasRole('admin');

  // Check if user is teacher
  bool get isTeacher => hasRole('teacher');

  // Check if user is parent
  bool get isParent => hasRole('parent');

  // Check if user is accountant
  bool get isAccountant => hasRole('accountant');

  // Get user role display name
  String get roleDisplayName {
    switch (_userProfile?.getStringValue('role')) {
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

  // Check if user account is pending approval
  bool get isPendingApproval {
    return _userProfile?.getStringValue('status') == 'pending';
  }

  // Check if user account is suspended
  bool get isSuspended {
    return _userProfile?.getStringValue('status') == 'suspended';
  }
}
