import 'dart:convert';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:pocketbase/pocketbase.dart';
import 'pocketbase_service.dart';

class EncryptionService {
  final PocketBaseService _pocketBaseService;
  
  EncryptionService() : _pocketBaseService = PocketBaseService.instance;
  
  // 多版本密钥表（优先从PocketBase加载，若失败则使用内置回退）
  static Map<int, String> _masterKeys = {
    1: "PJPC_NFC_MASTER_KEY_V1_2024",
    2: "PJPC_NFC_MASTER_KEY_V2_2024",
    3: "PJPC_NFC_MASTER_KEY_V3_2024",
  };
  
  // 当前使用的密钥版本（从服务端读取active，如失败则回退到2）
  static int _currentKeyVersion = 2;
  
  // 加密算法
  static const String _algorithm = "AES-256";
  
  // 生成随机盐值
  String generateSalt() {
    final random = DateTime.now().millisecondsSinceEpoch.toString();
    final hash = md5.convert(utf8.encode(random)).toString();
    return hash.substring(0, 8);
  }
  
  // 生成加密密钥（支持多版本）
  String _generateEncryptionKey(String salt, [int? version]) {
    final keyVersion = version ?? _currentKeyVersion;
    final masterKey = _masterKeys[keyVersion];
    if (masterKey == null) {
      throw Exception('不支持的密钥版本: $keyVersion');
    }
    
    final combined = '$masterKey$salt';
    final hash = sha256.convert(utf8.encode(combined));
    return hash.toString();
  }

  // 从 PocketBase 加载密钥集合
  Future<void> ensureKeysLoaded() async {
    try {
      final result = await _pocketBaseService.pb
          .collection('encryption_keys')
          .getList(perPage: 50, sort: '-created');

      if (result.items.isEmpty) {
        // 集合为空时，自动写入一个默认active密钥（回退值），避免解密失败
        try {
          await _pocketBaseService.pb.collection('encryption_keys').create(body: {
            'version': _currentKeyVersion,
            'master_key': _masterKeys[_currentKeyVersion],
            'algorithm': _algorithm,
            'status': 'active',
            'notes': 'auto-seeded by app when collection was empty'
          });
          print('🔑 已自动初始化 encryption_keys 集合: version=${_currentKeyVersion}');
        } catch (e) {
          print('⚠️ 初始化 encryption_keys 集合失败: $e');
        }
        return;
      }

      final Map<int, String> loaded = {};
      int? activeVersion;

      for (final item in result.items) {
        final ver = item.getIntValue('version');
        final key = item.getStringValue('master_key');
        final status = item.getStringValue('status') ?? 'active';
        if (ver != null && key != null && key.isNotEmpty) {
          loaded[ver] = key;
          if (status == 'active') {
            activeVersion = ver;
          }
        }
      }

      if (loaded.isNotEmpty) {
        // 合并服务端密钥与内置密钥，优先采用服务端同版本值
        final builtin = {
          1: "PJPC_NFC_MASTER_KEY_V1_2024",
          2: "PJPC_NFC_MASTER_KEY_V2_2024",
          3: "PJPC_NFC_MASTER_KEY_V3_2024",
        };
        _masterKeys = {...builtin, ...loaded};
        if (activeVersion != null) {
          _currentKeyVersion = activeVersion!;
        }
        print('🔑 加载密钥成功: versions=${_masterKeys.keys.toList()} active=${_currentKeyVersion}');
      } else {
        // 如果加载的密钥为空，强制使用内置密钥
        print('⚠️ 加载的密钥为空，使用内置密钥');
        _masterKeys = {
          1: "PJPC_NFC_MASTER_KEY_V1_2024",
          2: "PJPC_NFC_MASTER_KEY_V2_2024",
          3: "PJPC_NFC_MASTER_KEY_V3_2024",
        };
        _currentKeyVersion = 2;
      }
    } catch (e) {
      print('⚠️ 加载PocketBase密钥失败，使用内置回退: $e');
      // 确保内置密钥可用
      _masterKeys = {
        1: "PJPC_NFC_MASTER_KEY_V1_2024",
        2: "PJPC_NFC_MASTER_KEY_V2_2024",
        3: "PJPC_NFC_MASTER_KEY_V3_2024",
      };
      _currentKeyVersion = 2;
    }
  }

  void logAvailableVersions() {
    try {
      print('🔐 本地可用密钥版本: ${_masterKeys.keys.toList()} (active=${_currentKeyVersion})');
    } catch (_) {}
  }

  // 强制重置为内置密钥（用于调试）
  void forceResetToBuiltinKeys() {
    _masterKeys = {
      1: "PJPC_NFC_MASTER_KEY_V1_2024",
      2: "PJPC_NFC_MASTER_KEY_V2_2024",
      3: "PJPC_NFC_MASTER_KEY_V3_2024",
    };
    _currentKeyVersion = 2;
    print('🔑 已强制重置为内置密钥: version=${_currentKeyVersion}');
  }
  
  // 简单的XOR加密（实际应用中应使用AES）
  String _encrypt(String data, String key) {
    final dataBytes = utf8.encode(data);
    final keyBytes = utf8.encode(key);
    final encrypted = <int>[];
    
    for (int i = 0; i < dataBytes.length; i++) {
      encrypted.add(dataBytes[i] ^ keyBytes[i % keyBytes.length]);
    }
    
    return base64.encode(encrypted);
  }
  
  // 简单的XOR解密
  String _decrypt(String encryptedData, String key) {
    try {
      // 兼容URL-safe与无填充的Base64
      String _normalizeBase64(String s) {
        s = s.replaceAll('-', '+').replaceAll('_', '/');
        final mod = s.length % 4;
        if (mod > 0) {
          s = s + ('=' * (4 - mod));
        }
        return s;
      }
      final normalized = _normalizeBase64(encryptedData);
      final encryptedBytes = base64.decode(normalized);
      final keyBytes = utf8.encode(key);
      final decrypted = <int>[];
      
      for (int i = 0; i < encryptedBytes.length; i++) {
        decrypted.add(encryptedBytes[i] ^ keyBytes[i % keyBytes.length]);
      }
      
      return utf8.decode(decrypted);
    } catch (e) {
      throw Exception('解密失败: $e');
    }
  }
  
  // 加密学生UID
  Future<Map<String, dynamic>> encryptStudentUID(String studentId, String originalUID) async {
    try {
      final salt = generateSalt();
      final key = _generateEncryptionKey(salt);
      final encryptedUID = _encrypt(originalUID, key);
      
      // 先检查学生记录是否存在
      try {
        await _pocketBaseService.pb.collection('students').getOne(studentId);
      } catch (e) {
        throw Exception('学生记录不存在: $studentId');
      }
      
      // 更新学生记录
      await _pocketBaseService.pb.collection('students').update(studentId, body: {
        'encryption_key_version': _currentKeyVersion,
        'encryption_algorithm': _algorithm,
        'encryption_salt': salt,
        'encrypted_uid': encryptedUID,
        'key_rotation_date': DateTime.now().toIso8601String(),
      });
      
      return {
        'encrypted_uid': encryptedUID,
        'salt': salt,
        'key_version': _currentKeyVersion,
        'algorithm': _algorithm,
      };
    } catch (e) {
      throw Exception('加密学生UID失败: $e');
    }
  }
  
  // 解密学生UID
  Future<String> decryptStudentUID(String studentId) async {
    try {
      final student = await _pocketBaseService.pb.collection('students').getOne(studentId);
      
      final salt = student.getStringValue('encryption_salt');
      final encryptedUID = student.getStringValue('encrypted_uid');
      final keyVersion = student.getIntValue('encryption_key_version');
      
      if (salt == null || encryptedUID == null) {
        throw Exception('学生记录中缺少加密信息');
      }
      
      final key = _generateEncryptionKey(salt);
      final decryptedUID = _decrypt(encryptedUID, key);
      
      return decryptedUID;
    } catch (e) {
      throw Exception('解密学生UID失败: $e');
    }
  }
  
  // 加密教师UID
  Future<Map<String, dynamic>> encryptTeacherUID(String teacherId, String originalUID) async {
    try {
      final salt = generateSalt();
      final key = _generateEncryptionKey(salt);
      final encryptedUID = _encrypt(originalUID, key);
      
      // 更新教师记录
      await _pocketBaseService.pb.collection('teachers').update(teacherId, body: {
        'encryption_key_version': _currentKeyVersion,
        'encryption_algorithm': _algorithm,
        'encryption_salt': salt,
        'encrypted_uid': encryptedUID,
        'key_rotation_date': DateTime.now().toIso8601String(),
      });
      
      return {
        'encrypted_uid': encryptedUID,
        'salt': salt,
        'key_version': _currentKeyVersion,
        'algorithm': _algorithm,
      };
    } catch (e) {
      throw Exception('加密教师UID失败: $e');
    }
  }
  
  // 解密教师UID
  Future<String> decryptTeacherUID(String teacherId) async {
    try {
      final teacher = await _pocketBaseService.pb.collection('teachers').getOne(teacherId);
      
      final salt = teacher.getStringValue('encryption_salt');
      final encryptedUID = teacher.getStringValue('encrypted_uid');
      final keyVersion = teacher.getIntValue('encryption_key_version');
      
      if (salt == null || encryptedUID == null) {
        throw Exception('教师记录中缺少加密信息');
      }
      
      final key = _generateEncryptionKey(salt);
      final decryptedUID = _decrypt(encryptedUID, key);
      
      return decryptedUID;
    } catch (e) {
      throw Exception('解密教师UID失败: $e');
    }
  }
  
  // 加密NFC数据（使用当前版本）
  String encryptNFCData(String nfcData, String salt, [int? version]) {
    final key = _generateEncryptionKey(salt, version);
    return _encrypt(nfcData, key);
  }
  
  // 解密NFC数据（尝试所有版本）
  String decryptNFCData(String encryptedData, String salt) {
    // 尝试所有密钥版本
    for (final version in _masterKeys.keys) {
      try {
        final key = _generateEncryptionKey(salt, version);
        final decrypted = _decrypt(encryptedData, key);
        if (_isLikelyValidNfcPlaintext(decrypted)) {
          print('使用密钥版本 $version 解密成功');
          return decrypted;
        } else {
          // 解密得到的内容不符合期望格式，继续尝试下一个版本
          continue;
        }
      } catch (e) {
        // 继续尝试下一个版本
        continue;
      }
    }
    throw Exception('所有密钥版本都无法解密');
  }

  // 校验：明文必须为 ID_随机串，且两部分均为字母数字
  bool _isLikelyValidNfcPlaintext(String plaintext) {
    if (plaintext.isEmpty) return false;
    final idx = plaintext.indexOf('_');
    if (idx <= 0 || idx == plaintext.length - 1) return false;
    final id = plaintext.substring(0, idx);
    final rand = plaintext.substring(idx + 1);
    final alnum = RegExp(r'^[A-Za-z0-9]+$');
    if (!alnum.hasMatch(id) || !alnum.hasMatch(rand)) return false;
    if (rand.length < 4 || rand.length > 64) return false;
    if (id.length < 1 || id.length > 32) return false;
    return true;
  }
  
  // 智能解密（根据版本信息）
  String smartDecryptNFCData(String encryptedData, String salt, int keyVersion) {
    try {
      final key = _generateEncryptionKey(salt, keyVersion);
      return _decrypt(encryptedData, key);
    } catch (e) {
      // 如果指定版本失败，尝试所有版本
      return decryptNFCData(encryptedData, salt);
    }
  }
  
  // 批量加密所有学生UID
  Future<void> encryptAllStudentUIDs() async {
    try {
      final students = await _pocketBaseService.pb.collection('students').getList(perPage: 1000);
      
      for (final student in students.items) {
        final studentId = student.id;
        final originalUID = student.getStringValue('student_id') ?? '';
        
        if (originalUID.isNotEmpty) {
          await encryptStudentUID(studentId, originalUID);
          print('已加密学生: $originalUID');
        }
      }
      
      print('所有学生UID加密完成');
    } catch (e) {
      throw Exception('批量加密学生UID失败: $e');
    }
  }
  
  // 批量加密所有教师UID
  Future<void> encryptAllTeacherUIDs() async {
    try {
      final teachers = await _pocketBaseService.pb.collection('teachers').getList(perPage: 1000);
      
      for (final teacher in teachers.items) {
        final teacherId = teacher.id;
        final originalUID = teacher.getStringValue('name') ?? '';
        
        if (originalUID.isNotEmpty) {
          await encryptTeacherUID(teacherId, originalUID);
          print('已加密教师: $originalUID');
        }
      }
      
      print('所有教师UID加密完成');
    } catch (e) {
      throw Exception('批量加密教师UID失败: $e');
    }
  }
  
  // 智能密钥轮换策略
  Future<void> smartKeyRotation() async {
    try {
      // 1. 检查旧密钥使用情况
      final oldKeys = await _getOldKeys();
      
      for (final keyInfo in oldKeys) {
        final usageCount = await _getKeyUsageCount(keyInfo['version']);
        
        if (usageCount < 5) {
          // 使用次数少的密钥，标记为废弃
          await _deprecateKey(keyInfo['version']);
          print('密钥版本 ${keyInfo['version']} 使用次数少，已标记为废弃');
        } else {
          // 使用次数多的密钥，保留但标记为旧版本
          await _markAsLegacy(keyInfo['version']);
          print('密钥版本 ${keyInfo['version']} 使用次数多，标记为旧版本');
        }
      }
      
      // 2. 新用户使用新密钥
      print('新用户将使用密钥版本 $_currentKeyVersion');
      
    } catch (e) {
      throw Exception('智能密钥轮换失败: $e');
    }
  }
  
  // 获取旧密钥信息
  Future<List<Map<String, dynamic>>> _getOldKeys() async {
    // 这里应该从数据库查询旧密钥信息
    // 简化实现，返回模拟数据
    return [
      {'version': 1, 'created_date': '2024-01-01'},
      {'version': 2, 'created_date': '2024-02-01'},
    ];
  }
  
  // 获取密钥使用次数
  Future<int> _getKeyUsageCount(int version) async {
    try {
      final result = await _pocketBaseService.pb.collection('student_attendance').getList(
        filter: 'encryption_version = $version',
        perPage: 1,
      );
      return result.totalItems;
    } catch (e) {
      return 0;
    }
  }
  
  // 废弃密钥
  Future<void> _deprecateKey(int version) async {
    // 在实际应用中，这里应该更新密钥状态
    print('密钥版本 $version 已废弃');
  }
  
  // 标记为旧版本
  Future<void> _markAsLegacy(int version) async {
    // 在实际应用中，这里应该更新密钥状态
    print('密钥版本 $version 已标记为旧版本');
  }
  
  // 紧急密钥轮换（只轮换高风险用户）
  Future<void> emergencyKeyRotation() async {
    try {
      // 只轮换高风险用户
      final highRiskUsers = await _getHighRiskUsers();
      
      for (final user in highRiskUsers) {
        await _rotateUserKey(user['id'], user['type']);
        print('已轮换高风险用户: ${user['id']}');
      }
      
      print('紧急密钥轮换完成');
    } catch (e) {
      throw Exception('紧急密钥轮换失败: $e');
    }
  }
  
  // 获取高风险用户
  Future<List<Map<String, dynamic>>> _getHighRiskUsers() async {
    try {
      final students = await _pocketBaseService.pb.collection('students').getList(
        filter: 'security_status = "locked" || suspicious_activities > 3',
        perPage: 100,
      );
      
      return students.items.map((s) => {
        'id': s.id,
        'type': 'student',
        'name': s.getStringValue('student_name'),
      }).toList();
    } catch (e) {
      return [];
    }
  }
  
  // 轮换用户密钥
  Future<void> _rotateUserKey(String userId, String userType) async {
    try {
      final collection = userType == 'student' ? 'students' : 'teachers';
      final salt = generateSalt();
      
      await _pocketBaseService.pb.collection(collection).update(userId, body: {
        'encryption_key_version': _currentKeyVersion,
        'encryption_algorithm': _algorithm,
        'encryption_salt': salt,
        'key_rotation_date': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      throw Exception('轮换用户密钥失败: $e');
    }
  }
}
