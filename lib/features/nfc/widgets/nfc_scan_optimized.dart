import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import '../../../core/constants/nfc_constants.dart';
import '../../../shared/services/nfc_safe_scanner_service.dart';

/// 优化的NFC扫描Widget - 防抖和状态管理
class NFCOptimizedScan extends StatefulWidget {
  final bool isSmallScreen;
  final Function(String) onNfcScanned;
  final String? currentNfcId;
  
  const NFCOptimizedScan({
    super.key,
    required this.isSmallScreen,
    required this.onNfcScanned,
    this.currentNfcId,
  });

  @override
  State<NFCOptimizedScan> createState() => _NFCOptimizedScanState();
}

class _NFCOptimizedScanState extends State<NFCOptimizedScan> 
    with SingleTickerProviderStateMixin {
  bool _isScanning = false;
  bool _isNfcAvailable = false;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  DateTime? _lastScanTime;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: NFCConstants.pulseAnimationDuration,
      vsync: this,
    );
    _pulseAnimation = Tween<double>(
      begin: NFCConstants.pulseAnimationBegin,
      end: NFCConstants.pulseAnimationEnd,
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
      if (mounted) {
        setState(() {
          _isNfcAvailable = availability == NFCAvailability.available;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isNfcAvailable = false;
        });
      }
    }
  }

  Future<void> _scanNfc() async {
    if (_isScanning || !_isNfcAvailable) return;

    // 防抖检查
    final now = DateTime.now();
    if (_lastScanTime != null && 
        now.difference(_lastScanTime!).inSeconds < NFCConstants.scanCooldown.inSeconds) {
      return;
    }

    setState(() {
      _isScanning = true;
    });

    try {
      // 开始脉冲动画
      _pulseController.repeat(reverse: true);

      final tag = await FlutterNfcKit.poll(
        timeout: NFCConstants.nfcScanTimeout,
        iosMultipleTagMessage: '检测到多个标签，请只使用一个标签',
        iosAlertMessage: '请将NFC标签靠近设备',
      );
      
      final rawId = tag.id;
      
      if (rawId.isEmpty) {
        _showError('NFC卡中没有找到有效数据');
        return;
      }
      
      // 转换为标准格式
      final convertedId = NFCSafeScannerService.convertToStandardFormat(rawId);
      
      _lastScanTime = now;
      widget.onNfcScanned(convertedId);
      
    } catch (e) {
      String errorMessage = '扫描失败';
      if (e.toString().contains('timeout')) {
        errorMessage = '扫描超时，请重试';
      } else if (e.toString().contains('cancelled')) {
        errorMessage = '扫描已取消';
      } else {
        errorMessage = '扫描失败: ${e.toString()}';
      }
      _showError(errorMessage);
    } finally {
      if (mounted) {
        setState(() {
          _isScanning = false;
        });
        _pulseController.stop();
      }
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Color(NFCConstants.errorColor),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.all(widget.isSmallScreen ? 12 : 16),
      padding: EdgeInsets.all(widget.isSmallScreen ? 16 : 20),
      decoration: BoxDecoration(
        color: Color(NFCConstants.cardColor),
        borderRadius: BorderRadius.circular(NFCConstants.cardBorderRadius),
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
          Row(
            children: [
              Icon(
                Icons.nfc,
                color: widget.currentNfcId != null 
                    ? Color(NFCConstants.successColor)
                    : Color(NFCConstants.primaryColor),
                size: widget.isSmallScreen ? 24 : 28,
              ),
              const SizedBox(width: 12),
              Expanded(
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
                    const SizedBox(height: 4),
                    Text(
                      widget.currentNfcId != null 
                          ? '已扫描: ${widget.currentNfcId}'
                          : '点击扫描NFC卡',
                      style: TextStyle(
                        fontSize: widget.isSmallScreen ? 14 : 16,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: AnimatedBuilder(
              animation: _pulseAnimation,
              builder: (context, child) {
                return Transform.scale(
                  scale: _isScanning ? _pulseAnimation.value : 1.0,
                  child: ElevatedButton(
                    onPressed: _isScanning || !_isNfcAvailable ? null : _scanNfc,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _isScanning 
                          ? Color(NFCConstants.primaryColor).withOpacity(0.7)
                          : Color(NFCConstants.primaryColor),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(NFCConstants.buttonBorderRadius),
                      ),
                      padding: EdgeInsets.symmetric(
                        vertical: widget.isSmallScreen ? 16 : 20,
                      ),
                    ),
                    child: _isScanning
                        ? Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                '扫描中...',
                                style: TextStyle(
                                  fontSize: widget.isSmallScreen ? 16 : 18,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.nfc,
                                size: widget.isSmallScreen ? 20 : 24,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '扫描NFC卡',
                                style: TextStyle(
                                  fontSize: widget.isSmallScreen ? 16 : 18,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                  ),
                );
              },
            ),
          ),
          if (!_isNfcAvailable) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Color(NFCConstants.errorColor).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.warning,
                    color: Color(NFCConstants.errorColor),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      NFCConstants.errorNfcUnavailable,
                      style: TextStyle(
                        color: Color(NFCConstants.errorColor),
                        fontSize: 14,
                      ),
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

