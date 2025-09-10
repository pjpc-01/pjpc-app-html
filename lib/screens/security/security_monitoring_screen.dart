import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/pocketbase_service.dart';
import '../../services/alert_service.dart';

class SecurityMonitoringScreen extends StatefulWidget {
  const SecurityMonitoringScreen({Key? key}) : super(key: key);

  @override
  State<SecurityMonitoringScreen> createState() => _SecurityMonitoringScreenState();
}

class _SecurityMonitoringScreenState extends State<SecurityMonitoringScreen> {
  final AlertService _alertService = AlertService();
  Map<String, dynamic> _securityStats = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSecurityStats();
  }

  Future<void> _loadSecurityStats() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final stats = await _alertService.getSecurityStats();
      setState(() {
        _securityStats = stats;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('加载安全统计失败: $e')),
      );
    }
  }

  Future<void> _checkAndUnlockExpired() async {
    try {
      await _alertService.checkAndUnlockExpired();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('已检查并解除过期的锁定')),
      );
      _loadSecurityStats();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('检查过期锁定失败: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('安全监控'),
        backgroundColor: Colors.red[700],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadSecurityStats,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 安全状态概览
                  _buildSecurityOverview(),
                  const SizedBox(height: 20),
                  
                  // 锁定用户列表
                  _buildLockedUsers(),
                  const SizedBox(height: 20),
                  
                  // 操作按钮
                  _buildActionButtons(),
                  const SizedBox(height: 20),
                  
                  // 安全统计
                  _buildSecurityStats(),
                ],
              ),
            ),
    );
  }

  Widget _buildSecurityOverview() {
    final lockedStudents = _securityStats['locked_students'] ?? 0;
    final lockedTeachers = _securityStats['locked_teachers'] ?? 0;
    final suspiciousActivities = _securityStats['suspicious_activities_today'] ?? 0;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.security, color: Colors.red[700]),
                const SizedBox(width: 8),
                const Text(
                  '安全状态概览',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    '锁定学生',
                    lockedStudents.toString(),
                    Colors.red,
                    Icons.person_off,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatCard(
                    '锁定教师',
                    lockedTeachers.toString(),
                    Colors.orange,
                    Icons.person_off,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildStatCard(
              '今日可疑活动',
              suspiciousActivities.toString(),
              Colors.amber,
              Icons.warning,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLockedUsers() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.lock, color: Colors.red[700]),
                const SizedBox(width: 8),
                const Text(
                  '锁定用户',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              '当前被锁定的用户列表',
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 8),
            // TODO: 实现获取锁定用户列表的功能
            const Text('暂无锁定用户'),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.settings, color: Colors.blue[700]),
                const SizedBox(width: 8),
                const Text(
                  '安全操作',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _checkAndUnlockExpired,
                    icon: const Icon(Icons.lock_open),
                    label: const Text('检查过期锁定'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      // TODO: 实现紧急锁定所有用户功能
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('功能开发中')),
                      );
                    },
                    icon: const Icon(Icons.emergency),
                    label: const Text('紧急锁定'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
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

  Widget _buildSecurityStats() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.analytics, color: Colors.purple[700]),
                const SizedBox(width: 8),
                const Text(
                  '安全统计',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildStatRow('最后检查时间', _securityStats['last_check'] ?? '未知'),
            _buildStatRow('锁定学生数量', '${_securityStats['locked_students'] ?? 0}'),
            _buildStatRow('锁定教师数量', '${_securityStats['locked_teachers'] ?? 0}'),
            _buildStatRow('今日可疑活动', '${_securityStats['suspicious_activities_today'] ?? 0}'),
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
