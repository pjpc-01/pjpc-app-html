import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import '../../../core/constants/nfc_constants.dart';
import '../../../shared/services/nfc_safe_scanner_service.dart';
import '../../../shared/services/nfc_error_handler.dart';
import '../../../core/theme/app_theme.dart';
import 'nfc_scan_guide.dart';

/// 增强的NFC扫描Widget - 提供更好的用户反馈和体验
class EnhancedNFCScanner extends StatefulWidget {
  final bool isSmallScreen;
  final Function(String) onNfcScanned;
  final String? currentNfcId;
  final String? title;
  final String? subtitle;
  final bool autoStart;
  final bool showProgress;
  final bool showHelpButton;
  
  const EnhancedNFCScanner({
    super.key,
    required this.isSmallScreen,
    required this.onNfcScanned,
    this.currentNfcId,
    this.title,
    this.subtitle,
    this.autoStart = false,
    this.showProgress = true,
    this.showHelpButton = true,
  });

  @override
  State<EnhancedNFCScanner> createState() => _EnhancedNFCScannerState();
}

class _EnhancedNFCScannerState extends State<EnhancedNFCScanner>
    with TickerProviderStateMixin {
  bool _isScanning = false;
  bool _isNfcAvailable = false;
  String _statusMessage = '准备扫描';
  int _progressValue = 0;
  int _retryCount = 0;
  
  late AnimationController _pulseController;
  late AnimationController _progressController;
  late AnimationController _successController;
  late AnimationController _errorController;
  
  late Animation<double> _pulseAnimation;
  late Animation<double> _progressAnimation;
  late Animation<double> _successAnimation;
  late Animation<double> _errorAnimation;
  
  Timer? _progressTimer;
  Timer? _statusTimer;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _checkNfcAvailability();
    
    if (widget.autoStart) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _startScanning();
      });
    }
  }

  void _initializeAnimations() {
    // 脉冲动画
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(
      begin: 0.8,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));

    // 进度动画
    _progressController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    );
    _progressAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _progressController,
      curve: Curves.linear,
    ));

    // 成功动画
    _successController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _successAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _successController,
      curve: Curves.elasticOut,
    ));

    // 错误动画
    _errorController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _errorAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _errorController,
      curve: Curves.bounceOut,
    ));
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _progressController.dispose();
    _successController.dispose();
    _errorController.dispose();
    _progressTimer?.cancel();
    _statusTimer?.cancel();
    super.dispose();
  }

  Future<void> _checkNfcAvailability() async {
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      if (mounted) {
        setState(() {
          _isNfcAvailable = availability == NFCAvailability.available;
          _statusMessage = _isNfcAvailable ? '准备扫描' : 'NFC功能不可用';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isNfcAvailable = false;
          _statusMessage = 'NFC功能不可用';
        });
      }
    }
  }

  Future<void> _startScanning() async {
    if (_isScanning || !_isNfcAvailable) return;

    setState(() {
      _isScanning = true;
      _statusMessage = '正在扫描...';
      _progressValue = 0;
      _retryCount = 0;
    });

    // 开始动画
    _pulseController.repeat(reverse: true);
    _progressController.forward();
    _startProgressTimer();

    try {
      final result = await NFCSafeScannerService.instance.safeScanNFC(
        timeout: NFCConstants.nfcScanTimeout,
        enableRetry: true,
      );

      if (!mounted) return;

      if (result.isSuccess && result.nfcData != null) {
        await _handleScanSuccess(result.nfcData!);
      } else {
        await _handleScanError(result.errorMessage ?? '扫描失败');
      }
    } catch (e) {
      await _handleScanError('扫描失败: $e');
    } finally {
      if (mounted) {
        _stopScanning();
      }
    }
  }

  void _startProgressTimer() {
    _progressTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (mounted && _isScanning) {
        setState(() {
          _progressValue = (_progressController.value * 100).round();
        });
      } else {
        timer.cancel();
      }
    });
  }

  Future<void> _handleScanSuccess(String nfcData) async {
    // 触觉反馈
    HapticFeedback.lightImpact();
    
    // 停止扫描动画
    _pulseController.stop();
    _progressController.stop();
    
    // 开始成功动画
    _successController.forward();
    
    setState(() {
      _statusMessage = '扫描成功！';
    });

    // 延迟后调用回调
    await Future.delayed(const Duration(milliseconds: 500));
    widget.onNfcScanned(nfcData);
  }

  Future<void> _handleScanError(String error) async {
    // 触觉反馈
    HapticFeedback.heavyImpact();
    
    // 停止扫描动画
    _pulseController.stop();
    _progressController.stop();
    
    // 开始错误动画
    _errorController.forward();
    
    // 使用错误处理服务获取友好错误信息
    final errorInfo = NFCErrorHandler.instance.handleError(error);
    
    setState(() {
      _statusMessage = errorInfo.message;
      _retryCount++;
    });

    // 显示错误提示
    _showErrorDialog(errorInfo);
    
    // 根据错误类型决定重置时间
    final resetDelay = errorInfo.retryDelay ?? 3000;
    _statusTimer = Timer(Duration(milliseconds: resetDelay), () {
      if (mounted) {
        _resetToIdle();
      }
    });
  }

  void _stopScanning() {
    _pulseController.stop();
    _progressController.reset();
    _progressTimer?.cancel();
    
    setState(() {
      _isScanning = false;
    });
  }

  void _resetToIdle() {
    _successController.reset();
    _errorController.reset();
    
    setState(() {
      _statusMessage = '准备扫描';
      _progressValue = 0;
    });
  }

  void _showErrorDialog(NFCErrorInfo errorInfo) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Row(
          children: [
            Text(
              NFCErrorHandler.instance.getErrorIcon(errorInfo.errorType),
              style: const TextStyle(fontSize: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                errorInfo.title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              errorInfo.message,
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Color(NFCErrorHandler.instance.getErrorColor(errorInfo.errorType))
                    .withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: Color(NFCErrorHandler.instance.getErrorColor(errorInfo.errorType))
                      .withOpacity(0.3),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.lightbulb_outline,
                    color: Color(NFCErrorHandler.instance.getErrorColor(errorInfo.errorType)),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      errorInfo.suggestion,
                      style: TextStyle(
                        color: Color(NFCErrorHandler.instance.getErrorColor(errorInfo.errorType)),
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          if (errorInfo.actionText != null)
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _handleActionButton(errorInfo);
              },
              child: Text(errorInfo.actionText!),
            ),
          if (errorInfo.canRetry)
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _startScanning();
              },
              child: const Text('重试'),
            ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }
  
  void _handleActionButton(NFCErrorInfo errorInfo) {
    switch (errorInfo.errorType) {
      case NFCErrorType.nfcUnavailable:
        // 可以添加打开NFC设置的逻辑
        break;
      case NFCErrorType.userNotFound:
        // 可以添加联系管理员的逻辑
        break;
      case NFCErrorType.permissionError:
        // 可以添加联系管理员的逻辑
        break;
      default:
        break;
    }
  }
  
  void _showScanGuide() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => NFCScanGuide(
        isSmallScreen: widget.isSmallScreen,
        onDismiss: () {
          Navigator.of(context).pop();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.all(widget.isSmallScreen ? 12 : 16),
      padding: EdgeInsets.all(widget.isSmallScreen ? 16 : 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 标题区域
          Row(
            children: [
              AnimatedBuilder(
                animation: _pulseAnimation,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _isScanning ? _pulseAnimation.value : 1.0,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _getStatusColor().withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        _getStatusIcon(),
                        color: _getStatusColor(),
                        size: widget.isSmallScreen ? 24 : 28,
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            widget.title ?? 'NFC扫描',
                            style: TextStyle(
                              fontSize: widget.isSmallScreen ? 18 : 20,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF1E293B),
                            ),
                          ),
                        ),
                        if (widget.showHelpButton)
                          GestureDetector(
                            onTap: _showScanGuide,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: const Color(0xFF3B82F6).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Icon(
                                Icons.help_outline,
                                color: Color(0xFF3B82F6),
                                size: 18,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.subtitle ?? _statusMessage,
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
          
          const SizedBox(height: 20),
          
          // 进度条
          if (widget.showProgress && _isScanning) ...[
            Container(
              height: 6,
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(3),
              ),
              child: AnimatedBuilder(
                animation: _progressAnimation,
                builder: (context, child) {
                  return FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: _progressAnimation.value,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
                        ),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '$_progressValue%',
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 16),
          ],
          
          // 扫描按钮
          SizedBox(
            width: double.infinity,
            child: AnimatedBuilder(
              animation: _successAnimation,
              builder: (context, child) {
                return Transform.scale(
                  scale: _isScanning ? 1.0 : (1.0 + _successAnimation.value * 0.1),
                  child: ElevatedButton(
                    onPressed: _isScanning || !_isNfcAvailable ? null : _startScanning,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _getButtonColor(),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      padding: EdgeInsets.symmetric(
                        vertical: widget.isSmallScreen ? 16 : 20,
                      ),
                      elevation: _isScanning ? 0 : 4,
                    ),
                    child: _buildButtonContent(),
                  ),
                );
              },
            ),
          ),
          
          // NFC状态指示
          if (!_isNfcAvailable) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.errorColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppTheme.errorColor.withOpacity(0.3),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.warning_amber_rounded,
                    color: AppTheme.errorColor,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'NFC功能不可用，请检查设备设置',
                      style: TextStyle(
                        color: AppTheme.errorColor,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
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

  Widget _buildButtonContent() {
    if (_isScanning) {
      return Row(
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
      );
    } else {
      return Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.nfc,
            size: widget.isSmallScreen ? 20 : 24,
          ),
          const SizedBox(width: 8),
          Text(
            '开始扫描',
            style: TextStyle(
              fontSize: widget.isSmallScreen ? 16 : 18,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      );
    }
  }

  Color _getStatusColor() {
    if (_isScanning) return const Color(0xFF3B82F6);
    if (_statusMessage.contains('成功')) return const Color(0xFF10B981);
    if (_statusMessage.contains('失败') || _statusMessage.contains('错误')) {
      return AppTheme.errorColor;
    }
    return const Color(0xFF64748B);
  }

  IconData _getStatusIcon() {
    if (_isScanning) return Icons.nfc;
    if (_statusMessage.contains('成功')) return Icons.check_circle;
    if (_statusMessage.contains('失败') || _statusMessage.contains('错误')) {
      return Icons.error_outline;
    }
    return Icons.nfc;
  }

  Color _getButtonColor() {
    if (_isScanning) return const Color(0xFF3B82F6).withOpacity(0.7);
    if (_statusMessage.contains('成功')) return const Color(0xFF10B981);
    return const Color(0xFF3B82F6);
  }
}
