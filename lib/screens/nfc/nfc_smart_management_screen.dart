import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../providers/student_provider.dart';
import '../../services/nfc_safe_scanner_service.dart';
import '../../services/nfc_error_recovery_service.dart';
import '../../services/encryption_service.dart';
import '../../services/app_state_manager.dart';
import '../../services/nfc_write_service.dart';
import '../../theme/app_theme.dart';
import 'nfc_diagnostic_tool.dart';
import 'nfc_debug_tool.dart';
import 'simple_nfc_test_screen.dart';

/// NFC智能管理界面 - 全新设计
class NFCSmartManagementScreen extends StatefulWidget {
  const NFCSmartManagementScreen({super.key});

  @override
  State<NFCSmartManagementScreen> createState() => _NFCSmartManagementScreenState();
}

class _NFCSmartManagementScreenState extends State<NFCSmartManagementScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  bool _isNfcAvailable = false;
  String _nfcStatus = '检查中...';
  List<String> _recentOperations = [];
  
  // 服务
  final EncryptionService _encryptionService = EncryptionService();
  final NFCErrorRecoveryService _errorRecoveryService = NFCErrorRecoveryService.instance;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _checkNfcStatus();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  /// 检查NFC状态
  Future<void> _checkNfcStatus() async {
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      setState(() {
        _isNfcAvailable = availability == NFCAvailability.available;
        _nfcStatus = _isNfcAvailable ? 'NFC已就绪' : 'NFC不可用';
      });
    } catch (e) {
      setState(() {
        _nfcStatus = 'NFC检查失败';
      });
    }
  }

  /// 添加操作记录
  void _addOperation(String operation) {
    setState(() {
      _recentOperations.insert(0, '${DateTime.now().toString().substring(11, 19)} - $operation');
      if (_recentOperations.length > 10) {
        _recentOperations.removeLast();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildTabBar(),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildScanTab(),
                  _buildWriteTab(),
                  _buildMonitorTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 构建头部
  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.nfc_rounded,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'NFC智能管理',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      '智能NFC卡片管理平台',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
              _buildStatusIndicator(),
            ],
          ),
          const SizedBox(height: 20),
          _buildMonitorQuickActions(),
          const SizedBox(height: 16),
          _buildDiagnosticButton(),
        ],
      ),
    );
  }

  /// 构建状态指示器
  Widget _buildStatusIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: _isNfcAvailable 
            ? Colors.green.withOpacity(0.2)
            : Colors.red.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: _isNfcAvailable ? Colors.green : Colors.red,
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _isNfcAvailable ? Icons.check_circle : Icons.error,
            color: _isNfcAvailable ? Colors.green : Colors.red,
            size: 16,
          ),
          const SizedBox(width: 4),
          Text(
            _nfcStatus,
            style: TextStyle(
              color: _isNfcAvailable ? Colors.green : Colors.red,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  /// 构建诊断按钮
  Widget _buildDiagnosticButton() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _openStandaloneTest,
                  icon: const Icon(Icons.science),
                  label: const Text('独立测试'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _openDiagnosticTool,
                  icon: const Icon(Icons.bug_report),
                  label: const Text('诊断工具'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _openDebugTool,
              icon: const Icon(Icons.search),
              label: const Text('NFC调试工具 - 查找学生问题'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// 构建快速操作
  Widget _buildQuickActions() {
    return Row(
      children: [
        Expanded(
          child: _buildActionButton(
            '扫描NFC',
            Icons.nfc,
            Colors.green,
            () => _tabController.animateTo(0),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            '写入NFC',
            Icons.edit,
            Colors.blue,
            () => _tabController.animateTo(1),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            '状态监控',
            Icons.monitor,
            Colors.purple,
            () => _tabController.animateTo(2),
          ),
        ),
      ],
    );
  }

  /// 构建操作按钮
  Widget _buildActionButton(String title, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Colors.white.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(height: 4),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 构建标签栏
  Widget _buildTabBar() {
    return Container(
      color: Colors.white,
      child: TabBar(
        controller: _tabController,
        labelColor: AppTheme.primaryColor,
        unselectedLabelColor: AppTheme.textSecondary,
        indicatorColor: AppTheme.primaryColor,
        tabs: const [
          Tab(icon: Icon(Icons.nfc), text: '扫描'),
          Tab(icon: Icon(Icons.edit), text: '写入'),
          Tab(icon: Icon(Icons.monitor), text: '监控'),
        ],
      ),
    );
  }

  /// 构建扫描标签页
  Widget _buildScanTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          _buildScanCard(),
          const SizedBox(height: 20),
          _buildRecentOperations(),
        ],
      ),
    );
  }

  /// 构建扫描卡片
  Widget _buildScanCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppTheme.primaryColor.withOpacity(0.1),
                    AppTheme.primaryColor.withOpacity(0.3),
                  ],
                ),
              ),
              child: Icon(
                Icons.nfc,
                size: 60,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'NFC卡片扫描',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '将NFC卡片靠近设备背面进行扫描',
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isNfcAvailable ? _startScan : null,
                icon: const Icon(Icons.nfc),
                label: const Text('开始扫描'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 构建写入标签页
  Widget _buildWriteTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          _buildWriteCard(),
          const SizedBox(height: 20),
          _buildWriteOptions(),
        ],
      ),
    );
  }

  /// 构建写入卡片
  Widget _buildWriteCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Colors.blue.withOpacity(0.1),
                    Colors.blue.withOpacity(0.3),
                  ],
                ),
              ),
              child: const Icon(
                Icons.edit,
                size: 60,
                color: Colors.blue,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'NFC卡片写入',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '将数据写入到NFC卡片中',
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isNfcAvailable ? _startWrite : null,
                icon: const Icon(Icons.edit),
                label: const Text('开始写入'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 构建监控标签页
  Widget _buildMonitorTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          _buildStatusCard(),
          const SizedBox(height: 20),
          _buildNfcStatsCard(),
          const SizedBox(height: 20),
          _buildRecentOperations(),
          const SizedBox(height: 20),
          _buildMonitorQuickActions(),
        ],
      ),
    );
  }

  /// 构建状态卡片
  Widget _buildStatusCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'NFC状态监控',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 20),
            _buildStatusItem('NFC可用性', _nfcStatus, _isNfcAvailable),
            const SizedBox(height: 12),
            _buildStatusItem('设备支持', 'ASUS I004D', true),
            const SizedBox(height: 12),
            _buildStatusItem('Android版本', 'Android 13', true),
            const SizedBox(height: 12),
            _buildStatusItem('最后检查', DateTime.now().toString().substring(11, 19), true),
          ],
        ),
      ),
    );
  }

  /// 构建NFC统计卡片
  Widget _buildNfcStatsCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'NFC操作统计',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem('扫描次数', '${_recentOperations.where((op) => op.contains('扫描')).length}', Icons.nfc),
                ),
                Expanded(
                  child: _buildStatItem('写入次数', '${_recentOperations.where((op) => op.contains('写入')).length}', Icons.edit),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem('成功次数', '${_recentOperations.where((op) => op.contains('成功')).length}', Icons.check_circle),
                ),
                Expanded(
                  child: _buildStatItem('失败次数', '${_recentOperations.where((op) => op.contains('失败')).length}', Icons.error),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  /// 构建统计项
  Widget _buildStatItem(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, size: 32, color: AppTheme.primaryColor),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
  
  /// 构建监控快速操作
  Widget _buildMonitorQuickActions() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '快速操作',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _checkNfcStatus,
                    icon: const Icon(Icons.refresh),
                    label: const Text('刷新状态'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _clearOperations,
                    icon: const Icon(Icons.clear_all),
                    label: const Text('清空记录'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
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
  
  /// 清空操作记录
  void _clearOperations() {
    setState(() {
      _recentOperations.clear();
    });
    _showSuccess('操作记录已清空');
  }
  Widget _buildStatusItem(String label, String value, bool isGood) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 16,
            color: AppTheme.textPrimary,
          ),
        ),
        Row(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 16,
                color: isGood ? Colors.green : Colors.red,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              isGood ? Icons.check_circle : Icons.error,
              color: isGood ? Colors.green : Colors.red,
              size: 20,
            ),
          ],
        ),
      ],
    );
  }

  /// 构建写入选项
  Widget _buildWriteOptions() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '写入选项',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            _buildWriteOption(
              '学生ID',
              '写入学生ID到NFC卡片',
              Icons.person,
              () => _showStudentIdWriteDialog(),
            ),
            const SizedBox(height: 12),
            _buildWriteOption(
              'URL链接',
              '写入Google Forms链接',
              Icons.link,
              () => _showUrlWriteDialog(),
            ),
          ],
        ),
      ),
    );
  }

  /// 构建写入选项
  Widget _buildWriteOption(String title, String subtitle, IconData icon, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primaryColor),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      onTap: onTap,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    );
  }

  /// 构建最近操作
  Widget _buildRecentOperations() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '最近操作',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            if (_recentOperations.isEmpty)
              const Text(
                '暂无操作记录',
                style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 14,
                ),
              )
            else
              ..._recentOperations.map((operation) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Icon(
                      Icons.history,
                      size: 16,
                      color: AppTheme.textSecondary,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        operation,
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
              )),
          ],
        ),
      ),
    );
  }

  /// 开始扫描
  Future<void> _startScan() async {
    try {
      _addOperation('开始NFC扫描');
      print('🎯 NFC智能管理开始扫描...');
      
      // 使用修复后的NFC扫描服务（已包含1.5秒缓冲时间）
      final result = await NFCSafeScannerService.instance.safeScanNFC(
        timeout: const Duration(seconds: 10),
        requireStudent: false, // 不强制要求找到学生
      );
      
      if (result.isSuccess) {
        print('✅ NFC扫描成功: ${result.nfcData}');
        _addOperation('扫描成功: ${result.nfcData}');
        _showScanResult(result);
      } else {
        print('❌ NFC扫描失败: ${result.errorMessage}');
        _addOperation('扫描失败: ${result.errorMessage}');
        _showError(result.errorMessage ?? '扫描失败');
      }
    } catch (e) {
      print('❌ NFC扫描异常: $e');
      _addOperation('扫描异常: $e');
      _showError('扫描异常: $e');
    }
  }

  /// 开始写入
  Future<void> _startWrite() async {
    try {
      _addOperation('开始NFC写入');
      print('📝 NFC智能管理开始写入...');
      
      // 显示写入选项对话框
      _showWriteOptionsDialog();
    } catch (e) {
      print('❌ NFC写入异常: $e');
      _addOperation('写入异常: $e');
      _showError('写入异常: $e');
    }
  }
  
  /// 显示写入选项对话框
  void _showWriteOptionsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('选择写入类型'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.text_fields),
              title: const Text('写入文本'),
              subtitle: const Text('写入普通文本数据'),
              onTap: () {
                Navigator.pop(context);
                _showTextWriteDialog();
              },
            ),
            ListTile(
              leading: const Icon(Icons.person),
              title: const Text('写入学生ID'),
              subtitle: const Text('写入学生标识符'),
              onTap: () {
                Navigator.pop(context);
                _showStudentIdWriteDialog();
              },
            ),
            ListTile(
              leading: const Icon(Icons.link),
              title: const Text('写入URL'),
              subtitle: const Text('写入网页链接'),
              onTap: () {
                Navigator.pop(context);
                _showUrlWriteDialog();
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
        ],
      ),
    );
  }
  
  /// 显示文本写入对话框
  void _showTextWriteDialog() {
    final textController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('写入文本'),
        content: TextField(
          controller: textController,
          decoration: const InputDecoration(
            labelText: '请输入要写入的文本',
            hintText: '例如：Hello NFC',
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              if (textController.text.isNotEmpty) {
                await _writeText(textController.text);
              }
            },
            child: const Text('写入'),
          ),
        ],
      ),
    );
  }
  
  /// 显示学生ID写入对话框
  void _showStudentIdWriteDialog() {
    final studentIdController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('写入学生ID'),
        content: TextField(
          controller: studentIdController,
          decoration: const InputDecoration(
            labelText: '请输入学生ID',
            hintText: '例如：STU001',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              if (studentIdController.text.isNotEmpty) {
                await _writeStudentId(studentIdController.text);
              }
            },
            child: const Text('写入'),
          ),
        ],
      ),
    );
  }
  
  /// 显示URL写入对话框
  void _showUrlWriteDialog() {
    final urlController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('写入URL'),
        content: TextField(
          controller: urlController,
          decoration: const InputDecoration(
            labelText: '请输入URL',
            hintText: '例如：https://www.example.com',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              if (urlController.text.isNotEmpty) {
                await _writeUrl(urlController.text);
              }
            },
            child: const Text('写入'),
          ),
        ],
      ),
    );
  }
  
  /// 写入文本
  Future<void> _writeText(String text) async {
    try {
      _addOperation('写入文本: $text');
      print('📝 开始写入文本: $text');
      
      final result = await NFCWriteService.instance.writeText(text: text);
      
      if (result.isSuccess) {
        print('✅ 文本写入成功');
        _addOperation('文本写入成功');
        _showSuccess(result.successMessage!);
      } else {
        print('❌ 文本写入失败: ${result.errorMessage}');
        _addOperation('文本写入失败: ${result.errorMessage}');
        _showError(result.errorMessage!);
      }
    } catch (e) {
      print('❌ 文本写入异常: $e');
      _addOperation('文本写入异常: $e');
      _showError('文本写入异常: $e');
    }
  }
  
  /// 写入学生ID
  Future<void> _writeStudentId(String studentId) async {
    try {
      _addOperation('写入学生ID: $studentId');
      print('👨‍🎓 开始写入学生ID: $studentId');
      
      final result = await NFCWriteService.instance.writeStudentId(studentId: studentId);
      
      if (result.isSuccess) {
        print('✅ 学生ID写入成功');
        _addOperation('学生ID写入成功');
        _showSuccess(result.successMessage!);
      } else {
        print('❌ 学生ID写入失败: ${result.errorMessage}');
        _addOperation('学生ID写入失败: ${result.errorMessage}');
        _showError(result.errorMessage!);
      }
    } catch (e) {
      print('❌ 学生ID写入异常: $e');
      _addOperation('学生ID写入异常: $e');
      _showError('学生ID写入异常: $e');
    }
  }
  
  /// 写入URL
  Future<void> _writeUrl(String url) async {
    try {
      _addOperation('写入URL: $url');
      print('🌐 开始写入URL: $url');
      
      final result = await NFCWriteService.instance.writeText(text: url);
      
      if (result.isSuccess) {
        print('✅ URL写入成功');
        _addOperation('URL写入成功');
        _showSuccess(result.successMessage!);
      } else {
        print('❌ URL写入失败: ${result.errorMessage}');
        _addOperation('URL写入失败: ${result.errorMessage}');
        _showError(result.errorMessage!);
      }
    } catch (e) {
      print('❌ URL写入异常: $e');
      _addOperation('URL写入异常: $e');
      _showError('URL写入异常: $e');
    }
  }

  /// 显示扫描结果
  void _showScanResult(NFCScanResult result) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('NFC扫描结果'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('NFC数据: ${result.nfcData}'),
            if (result.decryptedData != null && result.decryptedData != result.nfcData)
              Text('解密数据: ${result.decryptedData}'),
            if (result.student != null)
              Text('学生: ${result.student!.getStringValue('student_name')}'),
            Text('是否加密: ${result.isEncrypted ? '是' : '否'}'),
            const SizedBox(height: 16),
            if (result.student == null)
              ElevatedButton(
                onPressed: () async {
                  Navigator.pop(context);
                  await _findStudentByNfcData(result.nfcData!);
                },
                child: const Text('查找学生'),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }
  
  /// 根据NFC数据查找学生
  Future<void> _findStudentByNfcData(String nfcData) async {
    try {
      _addOperation('查找学生: $nfcData');
      
      final student = await NFCSafeScannerService.instance.findStudentByNfcData(nfcData);
      
      if (student != null) {
        _addOperation('找到学生: ${student.getStringValue('student_name')}');
        _showStudentInfo(student);
      } else {
        _addOperation('未找到学生');
        _showError('未找到对应的学生');
      }
    } catch (e) {
      _addOperation('查找学生失败: $e');
      _showError('查找学生失败: $e');
    }
  }
  
  /// 显示学生信息
  void _showStudentInfo(RecordModel student) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('学生信息'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('姓名: ${student.getStringValue('student_name')}'),
            Text('学号: ${student.getStringValue('student_id')}'),
            Text('班级: ${student.getStringValue('standard')}'),
            Text('中心: ${student.getStringValue('center')}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  /// 显示成功信息
  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
      ),
    );
  }

  /// 显示错误信息
  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  /// 显示信息
  void _showInfo(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.blue,
      ),
    );
  }
  
  /// 打开调试工具
  void _openDebugTool() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const NFCDebugTool(),
      ),
    );
  }
  
  /// 打开独立测试
  void _openStandaloneTest() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SimpleNFCTestScreen(),
      ),
    );
  }
  
  /// 打开诊断工具
  void _openDiagnosticTool() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const NFCDiagnosticTool(),
      ),
    );
  }
}
