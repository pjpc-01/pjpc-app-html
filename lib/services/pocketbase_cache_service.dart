import 'dart:convert';
import 'package:pocketbase/pocketbase.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PocketBaseCacheService {
  static final Map<String, List<RecordModel>> _memoryCache = {};
  static final Map<String, DateTime> _lastUpdate = {};
  static final Map<String, Map<String, dynamic>> _queryCache = {};
  
  static const Duration _defaultCacheTimeout = Duration(minutes: 5);
  static const Duration _shortCacheTimeout = Duration(minutes: 2);
  static const Duration _longCacheTimeout = Duration(minutes: 15);
  
  // 缓存键前缀
  static const String _studentsKey = 'students';
  static const String _attendanceKey = 'attendance';
  static const String _invoicesKey = 'invoices';
  static const String _paymentsKey = 'payments';
  static const String _feeItemsKey = 'fee_items';
  static const String _studentFeesKey = 'student_fees';
  
  /// 检查是否需要刷新缓存
  static bool shouldRefresh(String collection, {Duration? customTimeout}) {
    if (_lastUpdate[collection] == null) return true;
    
    final timeout = customTimeout ?? _getDefaultTimeout(collection);
    return DateTime.now().difference(_lastUpdate[collection]!).compareTo(timeout) > 0;
  }
  
  /// 获取默认缓存超时时间
  static Duration _getDefaultTimeout(String collection) {
    switch (collection) {
      case _studentsKey:
      case _attendanceKey:
        return _defaultCacheTimeout;
      case _invoicesKey:
      case _paymentsKey:
        return _shortCacheTimeout;
      case _feeItemsKey:
      case _studentFeesKey:
        return _longCacheTimeout;
      default:
        return _defaultCacheTimeout;
    }
  }
  
  /// 缓存数据
  static void cacheData(String collection, List<RecordModel> data, {Map<String, dynamic>? queryParams}) {
    _memoryCache[collection] = data;
    _lastUpdate[collection] = DateTime.now();
    
    if (queryParams != null) {
      _queryCache[collection] = queryParams;
    }
    
    print('✅ 已缓存 $collection 数据: ${data.length} 条记录');
  }
  
  /// 获取缓存数据
  static List<RecordModel>? getCachedData(String collection) {
    return _memoryCache[collection];
  }
  
  /// 获取查询参数
  static Map<String, dynamic>? getCachedQuery(String collection) {
    return _queryCache[collection];
  }
  
  /// 清除特定集合的缓存
  static void clearCache(String collection) {
    _memoryCache.remove(collection);
    _lastUpdate.remove(collection);
    _queryCache.remove(collection);
    print('✅ 已清除 $collection 缓存');
  }
  
  /// 清除所有缓存
  static void clearAllCache() {
    _memoryCache.clear();
    _lastUpdate.clear();
    _queryCache.clear();
    print('✅ 已清除所有缓存');
  }
  
  /// 获取缓存统计信息
  static Map<String, dynamic> getCacheStats() {
    return {
      'cached_collections': _memoryCache.keys.toList(),
      'total_cached_records': _memoryCache.values.fold(0, (sum, list) => sum + list.length),
      'oldest_cache': _lastUpdate.values.isNotEmpty 
          ? _lastUpdate.values.reduce((a, b) => a.isBefore(b) ? a : b)
          : null,
      'newest_cache': _lastUpdate.values.isNotEmpty 
          ? _lastUpdate.values.reduce((a, b) => a.isAfter(b) ? a : b)
          : null,
    };
  }
  
  /// 持久化缓存到本地存储
  static Future<void> persistCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      // 将缓存数据转换为JSON并保存
      for (final entry in _memoryCache.entries) {
        final key = 'cache_${entry.key}';
        final data = entry.value.map((record) => record.data).toList();
        await prefs.setString(key, jsonEncode(data));
      }
      
      // 保存时间戳
      for (final entry in _lastUpdate.entries) {
        final key = 'timestamp_${entry.key}';
        await prefs.setString(key, entry.value.toIso8601String());
      }
      
      print('✅ 缓存已持久化到本地存储');
    } catch (e) {
      print('❌ 持久化缓存失败: $e');
    }
  }
  
  /// 从本地存储恢复缓存
  static Future<void> restoreCache() async {
    try {
      // 暂时禁用持久化缓存恢复，避免 RecordModel 创建问题
      // 只使用内存缓存
      print('⚠️ 持久化缓存恢复已禁用，仅使用内存缓存');
      
      // 清理过期的本地存储缓存
      final prefs = await SharedPreferences.getInstance();
      for (final collection in [_studentsKey, _attendanceKey, _invoicesKey, _paymentsKey, _feeItemsKey, _studentFeesKey]) {
        final dataKey = 'cache_$collection';
        final timestampKey = 'timestamp_$collection';
        await prefs.remove(dataKey);
        await prefs.remove(timestampKey);
      }
      
      print('✅ 已清理本地存储缓存');
    } catch (e) {
      print('❌ 清理本地存储缓存失败: $e');
    }
  }
  
  /// 清理过期缓存
  static void cleanExpiredCache() {
    final now = DateTime.now();
    final expiredCollections = <String>[];
    
    for (final entry in _lastUpdate.entries) {
      final timeout = _getDefaultTimeout(entry.key);
      if (now.difference(entry.value).compareTo(timeout) > 0) {
        expiredCollections.add(entry.key);
      }
    }
    
    for (final collection in expiredCollections) {
      clearCache(collection);
    }
    
    if (expiredCollections.isNotEmpty) {
      print('✅ 已清理过期缓存: ${expiredCollections.join(', ')}');
    }
  }
  
  /// 预加载常用数据
  static Future<void> preloadCommonData() async {
    print('🔄 开始预加载常用数据...');
    
    // 这里可以添加预加载逻辑
    // 例如：预加载学生列表、费用项目等
    
    print('✅ 常用数据预加载完成');
  }
  
  /// 检查缓存健康状态
  static Map<String, dynamic> getCacheHealth() {
    final now = DateTime.now();
    final health = <String, dynamic>{};
    
    for (final entry in _lastUpdate.entries) {
      final age = now.difference(entry.value);
      final timeout = _getDefaultTimeout(entry.key);
      final isHealthy = age.compareTo(timeout) <= 0;
      
      health[entry.key] = {
        'age_minutes': age.inMinutes,
        'timeout_minutes': timeout.inMinutes,
        'is_healthy': isHealthy,
        'record_count': _memoryCache[entry.key]?.length ?? 0,
      };
    }
    
    return health;
  }
}
