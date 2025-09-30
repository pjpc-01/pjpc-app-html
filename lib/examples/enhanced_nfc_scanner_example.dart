import 'package:flutter/material.dart';
import '../../../shared/widgets/nfc/enhanced_nfc_scanner.dart';

/// 增强NFC扫描器使用示例
class EnhancedNFCScannerExample extends StatefulWidget {
  const EnhancedNFCScannerExample({super.key});

  @override
  State<EnhancedNFCScannerExample> createState() => _EnhancedNFCScannerExampleState();
}

class _EnhancedNFCScannerExampleState extends State<EnhancedNFCScannerExample> {
  String? _scannedNfcId;
  String _statusMessage = '等待扫描';

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenHeight < 700 || screenWidth < 360;

    return Scaffold(
      appBar: AppBar(
        title: const Text('增强NFC扫描器示例'),
        backgroundColor: const Color(0xFF3B82F6),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 状态显示
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _scannedNfcId != null 
                    ? const Color(0xFF10B981).withOpacity(0.1)
                    : const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _scannedNfcId != null 
                      ? const Color(0xFF10B981)
                      : const Color(0xFFE5E7EB),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '扫描状态',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: _scannedNfcId != null 
                          ? const Color(0xFF10B981)
                          : const Color(0xFF6B7280),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _statusMessage,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                  if (_scannedNfcId != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      'NFC ID: $_scannedNfcId',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF10B981),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // 增强NFC扫描器
            EnhancedNFCScanner(
              isSmallScreen: isSmallScreen,
              onNfcScanned: _handleNfcScanned,
              currentNfcId: _scannedNfcId,
              title: '学生考勤扫描',
              subtitle: '请扫描学生NFC卡片',
              autoStart: false,
              showProgress: true,
              showHelpButton: true,
            ),
            
            const SizedBox(height: 24),
            
            // 功能说明
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFFE2E8F0),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '功能特点',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildFeatureItem('⚡', '智能重试机制', '自动重试失败的扫描，提高成功率'),
                  _buildFeatureItem('🎯', '精确超时控制', '8秒超时，1秒冷却，响应更快'),
                  _buildFeatureItem('📊', '实时进度显示', '可视化扫描进度和状态'),
                  _buildFeatureItem('🔊', '音效触觉反馈', '扫描成功/失败时的声音和震动'),
                  _buildFeatureItem('❌', '友好错误提示', '详细的错误信息和解决建议'),
                  _buildFeatureItem('❓', '使用引导', '帮助用户正确使用NFC扫描'),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // 操作按钮
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _clearResult,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6B7280),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('清除结果'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _showInfo,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3B82F6),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('查看信息'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureItem(String icon, String title, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Text(
            icon,
            style: const TextStyle(fontSize: 16),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1E293B),
                  ),
                ),
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _handleNfcScanned(String nfcId) {
    setState(() {
      _scannedNfcId = nfcId;
      _statusMessage = '扫描成功！';
    });
    
    // 显示成功提示
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('成功扫描NFC卡片: $nfcId'),
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }

  void _clearResult() {
    setState(() {
      _scannedNfcId = null;
      _statusMessage = '等待扫描';
    });
  }

  void _showInfo() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('NFC扫描器信息'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('这是一个增强版的NFC扫描器，具有以下特点：'),
            SizedBox(height: 12),
            Text('• 智能重试机制'),
            Text('• 实时进度显示'),
            Text('• 音效触觉反馈'),
            Text('• 友好错误提示'),
            Text('• 使用引导'),
            SizedBox(height: 12),
            Text('扫描超时时间：8秒'),
            Text('重试次数：最多3次'),
            Text('冷却时间：1秒'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }
}
