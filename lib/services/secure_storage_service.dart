import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';

class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );
  
  // 存储键名
  static const String _emailKey = 'saved_email';
  static const String _passwordKey = 'saved_password';
  static const String _authTokenKey = 'auth_token';
  static const String _userDataKey = 'user_data';
  static const String _lastLoginKey = 'last_login';
  
  /// 保存登录凭据
  static Future<void> saveCredentials(String email, String password) async {
    try {
      await _storage.write(key: _emailKey, value: email);
      await _storage.write(key: _passwordKey, value: password);
      await _storage.write(key: _lastLoginKey, value: DateTime.now().toIso8601String());
      print('✅ 凭据已安全保存');
    } catch (e) {
      print('❌ 保存凭据失败: $e');
      throw Exception('保存凭据失败');
    }
  }
  
  /// 获取保存的凭据
  static Future<Map<String, String?>> getCredentials() async {
    try {
      final email = await _storage.read(key: _emailKey);
      final password = await _storage.read(key: _passwordKey);
      return {
        'email': email,
        'password': password,
      };
    } catch (e) {
      print('❌ 获取凭据失败: $e');
      return {'email': null, 'password': null};
    }
  }
  
  /// 清除登录凭据
  static Future<void> clearCredentials() async {
    try {
      await _storage.delete(key: _emailKey);
      await _storage.delete(key: _passwordKey);
      await _storage.delete(key: _authTokenKey);
      await _storage.delete(key: _userDataKey);
      await _storage.delete(key: _lastLoginKey);
      print('✅ 凭据已清除');
    } catch (e) {
      print('❌ 清除凭据失败: $e');
    }
  }
  
  /// 保存认证令牌
  static Future<void> saveAuthToken(String token) async {
    try {
      await _storage.write(key: _authTokenKey, value: token);
    } catch (e) {
      print('❌ 保存认证令牌失败: $e');
    }
  }
  
  /// 获取认证令牌
  static Future<String?> getAuthToken() async {
    try {
      return await _storage.read(key: _authTokenKey);
    } catch (e) {
      print('❌ 获取认证令牌失败: $e');
      return null;
    }
  }
  
  /// 保存用户数据
  static Future<void> saveUserData(Map<String, dynamic> userData) async {
    try {
      final jsonString = jsonEncode(userData);
      await _storage.write(key: _userDataKey, value: jsonString);
    } catch (e) {
      print('❌ 保存用户数据失败: $e');
    }
  }
  
  /// 获取用户数据
  static Future<Map<String, dynamic>?> getUserData() async {
    try {
      final jsonString = await _storage.read(key: _userDataKey);
      if (jsonString != null) {
        return jsonDecode(jsonString) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('❌ 获取用户数据失败: $e');
      return null;
    }
  }
  
  /// 检查是否有保存的凭据
  static Future<bool> hasCredentials() async {
    final credentials = await getCredentials();
    return credentials['email'] != null && credentials['password'] != null;
  }
  
  /// 获取最后登录时间
  static Future<DateTime?> getLastLogin() async {
    try {
      final lastLoginString = await _storage.read(key: _lastLoginKey);
      if (lastLoginString != null) {
        return DateTime.parse(lastLoginString);
      }
      return null;
    } catch (e) {
      print('❌ 获取最后登录时间失败: $e');
      return null;
    }
  }
  
  /// 生成密码哈希（用于验证）
  static String generatePasswordHash(String password) {
    final bytes = utf8.encode(password);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }
  
  /// 验证密码
  static bool verifyPassword(String password, String hash) {
    return generatePasswordHash(password) == hash;
  }
  
  /// 清除所有数据
  static Future<void> clearAll() async {
    try {
      await _storage.deleteAll();
      print('✅ 所有安全存储数据已清除');
    } catch (e) {
      print('❌ 清除所有数据失败: $e');
    }
  }
}
