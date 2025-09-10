import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/security_service.dart';
import '../../services/encryption_service.dart';
import '../../theme/app_theme.dart';

class SecurityDashboardScreen extends StatefulWidget {
  const SecurityDashboardScreen({super.key});

  @override
  State<SecurityDashboardScreen> createState() => _SecurityDashboardScreenState();
}

class _SecurityDashboardScreenState extends State<SecurityDashboardScreen> {
  late SecurityService _securityService;
  late EncryptionService _encryptionService;
  
  bool _isLoading = false;
  Map<String, dynamic> _securityStats = {};
  List<Map<String, dynamic>> _recentAlerts = [];
  List<Map<String, dynamic>> _lockedUsers = [];

  @override
  void initState() {
    super.initState();
    _securityService = SecurityService();
    _encryptionService = EncryptionService();
    _loadSecurityData();
  }

  Future<void> _loadSecurityData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // 加载安全统计数据
      await _loadSecurityStats();
      
      // 加载最近警报
      await _loadRecentAlerts();
      
      // 加载锁定用户
      await _loadLockedUsers();
      
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('加载安全数据失败: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _loadSecurityStats() async {
    // 模拟安全统计数据
    _securityStats = {
      'total_users': 150,
      'locked_users': 3,
      'high_risk_users': 5,
      'today_swipes': 89,
      'suspicious_activities': 2,
      'encryption_coverage': 95,
    };
  }

  Future<void> _loadRecentAlerts() async {
    // 模拟最近警报数据
    _recentAlerts = [
      {
        'id': '1',
        'user_type': 'student',
        'user_id': 'B001',
        'user_name': '张三',
        'message': '快速连续刷卡检测',
        'risk_score': 85,
        'timestamp': DateTime.now().subtract(const Duration(minutes: 30)),
        'status': 'pending',
      },
      {
        'id': '2',
        'user_type': 'teacher',
        'user_id': 'TCH001',
        'user_name': '李老师',
        'message': '异常时间刷卡',
        'risk_score': 45,
        'timestamp': DateTime.now().subtract(const Duration(hours: 2)),
        'status': 'resolved',
      },
    ];
  }

  Future<void> _loadLockedUsers() async {
    // 模拟锁定用户数据
    _lockedUsers = [
      {
        'id': 'B001',
        'name': '张三',
        'type': 'student',
        'lock_reason': '快速连续刷卡检测',
        'locked_at': DateTime.now().subtract(const Duration(minutes: 15)),
        'auto_unlock_at': DateTime.now().add(const Duration(minutes: 15)),
      },
      {
        'id': 'TCH002',
        'name': '王老师',
        'type': 'teacher',
        'lock_reason': '高风险行为检测',
        'locked_at': DateTime.now().subtract(const Duration(hours: 1)),
        'auto_unlock_at': DateTime.now().add(const Duration(minutes: 30)),
      },
    ];
  }

  Future<void> _unlockUser(String userId, String userType) async {
    try {
      await _securityService.manualUnlockUser(userId, userType, 'admin', '手动解锁');
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('用户 $userId 已解锁'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
      
      _loadSecurityData(); // 重新加载数据
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('解锁失败: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('安全监控中心'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: _loadSecurityData,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadSecurityData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildSecurityOverviewCard(),
                  const SizedBox(height: 16),
                  _buildRecentAlertsCard(),
                  const SizedBox(height: 16),
                  _buildLockedUsersCard(),
                  const SizedBox(height: 16),
                  _buildEncryptionStatusCard(),
                ],
              ),
            ),
    );
  }

  Widget _buildSecurityOverviewCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '安全概览',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    Icons.people,
                    '总用户数',
                    _securityStats['total_users']?.toString() ?? '0',
                    AppTheme.primaryColor,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    Icons.lock,
                    '锁定用户',
                    _securityStats['locked_users']?.toString() ?? '0',
                    Colors.red,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    Icons.warning,
                    '高风险用户',
                    _securityStats['high_risk_users']?.toString() ?? '0',
                    Colors.orange,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    Icons.touch_app,
                    '今日刷卡',
                    _securityStats['today_swipes']?.toString() ?? '0',
                    AppTheme.successColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String title, String value, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          title,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  Widget _buildRecentAlertsCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '最近警报',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 12),
            if (_recentAlerts.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: Text(
                    '暂无警报',
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              )
            else
              ..._recentAlerts.map((alert) => _buildAlertItem(alert)),
          ],
        ),
      ),
    );
  }

  Widget _buildAlertItem(Map<String, dynamic> alert) {
    final status = alert['status'] as String;
    final statusColor = status == 'pending' ? Colors.red : AppTheme.successColor;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: statusColor.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(
            status == 'pending' ? Icons.warning : Icons.check_circle,
            color: statusColor,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${alert['user_name']} (${alert['user_id']})',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                Text(
                  alert['message'],
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          ),
          Text(
            '风险: ${alert['risk_score']}',
            style: TextStyle(
              fontSize: 12,
              color: statusColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLockedUsersCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '锁定用户管理',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 12),
            if (_lockedUsers.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: Text(
                    '暂无锁定用户',
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              )
            else
              ..._lockedUsers.map((user) => _buildLockedUserItem(user)),
          ],
        ),
      ),
    );
  }

  Widget _buildLockedUserItem(Map<String, dynamic> user) {
    final lockedAt = user['locked_at'] as DateTime;
    final autoUnlockAt = user['auto_unlock_at'] as DateTime;
    final remainingTime = autoUnlockAt.difference(DateTime.now());
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(
            user['type'] == 'student' ? Icons.person : Icons.school,
            color: Colors.red,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${user['name']} (${user['id']})',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                Text(
                  user['lock_reason'],
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
                Text(
                  '锁定时间: ${lockedAt.hour}:${lockedAt.minute.toString().padLeft(2, '0')}',
                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                ),
              ],
            ),
          ),
          Column(
            children: [
              Text(
                '${remainingTime.inMinutes}分钟',
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                ),
              ),
              ElevatedButton(
                onPressed: () => _unlockUser(user['id'], user['type']),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.successColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                ),
                child: const Text('解锁', style: TextStyle(fontSize: 10)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEncryptionStatusCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '加密状态',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    Icons.security,
                    '加密覆盖率',
                    '${_securityStats['encryption_coverage']}%',
                    AppTheme.successColor,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    Icons.key,
                    '当前密钥版本',
                    'V2',
                    AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      // 执行智能密钥轮换
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('智能密钥轮换已启动'),
                          backgroundColor: AppTheme.successColor,
                        ),
                      );
                    },
                    icon: const Icon(Icons.refresh),
                    label: const Text('智能轮换'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      // 执行紧急轮换
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('紧急密钥轮换已启动'),
                          backgroundColor: Colors.orange,
                        ),
                      );
                    },
                    icon: const Icon(Icons.warning),
                    label: const Text('紧急轮换'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
