import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/services/nfc_safe_scanner_service.dart';

/// NFC扫描卡片组件
class NfcScanCard extends StatefulWidget {
  final String? scannedNfcId;
  final Function(String) onNfcScanned;
  final bool isSmallScreen;
  final bool isScanning;

  const NfcScanCard({
    super.key,
    this.scannedNfcId,
    required this.onNfcScanned,
    required this.isSmallScreen,
    this.isScanning = false,
  });

  @override
  State<NfcScanCard> createState() => _NfcScanCardState();
}

class _NfcScanCardState extends State<NfcScanCard>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  bool _isNfcAvailable = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(
      begin: 0.8,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _checkNfcAvailability();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _checkNfcAvailability() async {
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      setState(() {
        _isNfcAvailable = availability == NFCAvailability.available;
      });
      
      if (_isNfcAvailable && widget.isScanning) {
        _pulseController.repeat(reverse: true);
      }
    } catch (e) {
      setState(() {
        _isNfcAvailable = false;
      });
    }
  }

  Future<void> _startNfcScan() async {
    if (!_isNfcAvailable) {
      _showNfcErrorDialog();
      return;
    }

    try {
      _pulseController.repeat(reverse: true);
      
      final tag = await FlutterNfcKit.poll(
        timeout: const Duration(seconds: 10),
        iosMultipleTagMessage: '检测到多个标签，请只保留一个标签',
        iosAlertMessage: '准备扫描NFC标签',
      );

      if (tag != null) {
        final rawId = tag.id;
        // 转换为标准格式
        final convertedId = NFCSafeScannerService.convertToStandardFormat(rawId);
        widget.onNfcScanned(convertedId);
      }
    } catch (e) {
      _showScanErrorDialog(e.toString());
    } finally {
      _pulseController.stop();
    }
  }

  void _showNfcErrorDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('NFC不可用'),
        content: const Text('请确保设备支持NFC功能并已开启'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  void _showScanErrorDialog(String error) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('扫描失败'),
        content: Text('扫描过程中出现错误：$error'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(widget.isSmallScreen ? 16 : 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'NFC扫描',
            style: TextStyle(
              fontSize: widget.isSmallScreen ? 16 : 18,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 16),
          
          // NFC状态指示器
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _isNfcAvailable 
                    ? const Color(0xFF10B981).withOpacity(0.1)
                    : const Color(0xFFEF4444).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  _isNfcAvailable ? Icons.nfc : Icons.nfc_outlined,
                  color: _isNfcAvailable 
                    ? const Color(0xFF10B981)
                    : const Color(0xFFEF4444),
                  size: widget.isSmallScreen ? 20 : 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _isNfcAvailable ? 'NFC功能正常' : 'NFC功能不可用',
                  style: TextStyle(
                    fontSize: widget.isSmallScreen ? 14 : 16,
                    color: _isNfcAvailable 
                      ? const Color(0xFF10B981)
                      : const Color(0xFFEF4444),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // 扫描区域
          Center(
            child: GestureDetector(
              onTap: _isNfcAvailable ? _startNfcScan : null,
              child: AnimatedBuilder(
                animation: _pulseAnimation,
                builder: (context, child) {
                  return Transform.scale(
                    scale: widget.isScanning ? _pulseAnimation.value : 1.0,
                    child: Container(
                      width: widget.isSmallScreen ? 120 : 150,
                      height: widget.isSmallScreen ? 120 : 150,
                      decoration: BoxDecoration(
                        color: _isNfcAvailable 
                          ? AppTheme.primaryColor.withOpacity(0.1)
                          : const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _isNfcAvailable 
                            ? AppTheme.primaryColor
                            : const Color(0xFFD1D5DB),
                          width: 2,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.nfc,
                            size: widget.isSmallScreen ? 40 : 50,
                            color: _isNfcAvailable 
                              ? AppTheme.primaryColor
                              : const Color(0xFF9CA3AF),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _isNfcAvailable ? '点击扫描' : 'NFC不可用',
                            style: TextStyle(
                              fontSize: widget.isSmallScreen ? 12 : 14,
                              fontWeight: FontWeight.w600,
                              color: _isNfcAvailable 
                                ? AppTheme.primaryColor
                                : const Color(0xFF9CA3AF),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          
          // 扫描结果显示
          if (widget.scannedNfcId != null) ...[
            const SizedBox(height: 20),
            Container(
              padding: EdgeInsets.all(widget.isSmallScreen ? 12 : 16),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFF10B981).withOpacity(0.3),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.check_circle,
                    color: const Color(0xFF10B981),
                    size: widget.isSmallScreen ? 20 : 24,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '扫描成功',
                          style: TextStyle(
                            fontSize: widget.isSmallScreen ? 14 : 16,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF10B981),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'NFC ID: ${widget.scannedNfcId}',
                          style: TextStyle(
                            fontSize: widget.isSmallScreen ? 12 : 14,
                            color: const Color(0xFF059669),
                            fontFamily: 'monospace',
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
