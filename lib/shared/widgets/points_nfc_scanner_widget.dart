import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../../../shared/providers/points_provider.dart';
import '../../../shared/services/pocketbase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/services/nfc_safe_scanner_service.dart';

class PointsNFCScannerWidget extends StatefulWidget {
  const PointsNFCScannerWidget({super.key});

  @override
  State<PointsNFCScannerWidget> createState() => _PointsNFCScannerWidgetState();
}

class _PointsNFCScannerWidgetState extends State<PointsNFCScannerWidget>
    with TickerProviderStateMixin {
  bool _isScanning = false;
  String _statusMessage = '正在启动扫描...';
  int _timeoutCountdown = 10;
  Timer? _countdownTimer;
  late AnimationController _pulseController;
  late AnimationController _scanController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _scanAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _scanController = AnimationController(
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
    
    _scanAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _scanController,
      curve: Curves.easeInOut,
    ));

    // 自动开始扫描
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startScanning();
    });
    
    // 立即设置扫描状态，避免显示"开始扫描"按钮
    _isScanning = true;
    _statusMessage = '正在启动扫描...';
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _pulseController.dispose();
    _scanController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenHeight < 700 || screenWidth < 360;
    
    return Container(
      height: isSmallScreen ? screenHeight * 0.7 : screenHeight * 0.85,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFF8FAFC),
            Color(0xFFF1F5F9),
          ],
        ),
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(28),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildEnterpriseHeader(isSmallScreen),
          Expanded(
            child: _buildEnterpriseScannerContent(isSmallScreen),
          ),
          _buildEnterpriseActionButtons(isSmallScreen),
        ],
      ),
    );
  }

  Widget _buildEnterpriseHeader(bool isSmallScreen) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        isSmallScreen ? 20 : 24,
        isSmallScreen ? 16 : 20,
        isSmallScreen ? 20 : 24,
        isSmallScreen ? 12 : 16,
      ),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFF59E0B),
            Color(0xFFD97706),
          ],
        ),
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(28),
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFF59E0B).withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.stars,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '积分 NFC 扫描',
                  style: TextStyle(
                    fontSize: isSmallScreen ? 18 : 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
                Text(
                  '扫描学生卡进行积分操作',
                  style: TextStyle(
                    fontSize: isSmallScreen ? 12 : 14,
                    color: Colors.white.withOpacity(0.8),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(
                Icons.close,
                color: Colors.white,
                size: 24,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnterpriseScannerContent(bool isSmallScreen) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isSmallScreen ? 20 : 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildEnterpriseScannerCircle(),
          SizedBox(height: isSmallScreen ? 24 : 32),
          _buildEnterpriseStatusCard(),
          SizedBox(height: isSmallScreen ? 20 : 24),
          _buildEnterpriseInstructions(),
        ],
      ),
    );
  }

  Widget _buildEnterpriseScannerCircle() {
    return AnimatedBuilder(
      animation: Listenable.merge([_pulseAnimation, _scanAnimation]),
      builder: (context, child) {
        return Container(
          width: 240,
          height: 240,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                const Color(0xFFF59E0B).withOpacity(0.05),
                const Color(0xFFF59E0B).withOpacity(0.15),
                const Color(0xFFF59E0B).withOpacity(0.25),
                const Color(0xFFF59E0B).withOpacity(0.4),
              ],
              stops: const [0.0, 0.3, 0.6, 1.0],
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFF59E0B).withOpacity(0.2),
                blurRadius: 30,
                spreadRadius: 8,
              ),
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 15,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Transform.scale(
            scale: _isScanning ? _pulseAnimation.value : 1.0,
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: _isScanning 
                    ? [
                        const Color(0xFFF59E0B),
                        const Color(0xFFD97706),
                      ]
                    : [
                        const Color(0xFF6B7280),
                        const Color(0xFF4B5563),
                      ],
                ),
                boxShadow: [
                  BoxShadow(
                    color: (_isScanning ? const Color(0xFFF59E0B) : const Color(0xFF6B7280))
                        .withOpacity(0.4),
                    blurRadius: 20,
                    spreadRadius: 3,
                  ),
                ],
                border: Border.all(
                  color: Colors.white.withOpacity(0.3),
                  width: 3,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Icon(
                      _isScanning ? Icons.stars : Icons.stars_outlined,
                      size: 60,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _isScanning ? '扫描中...' : '准备扫描',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildEnterpriseStatusCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white,
            const Color(0xFFF8FAFC),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
          BoxShadow(
            color: _getStatusColor().withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
        border: Border.all(
          color: _getStatusColor().withOpacity(0.2),
          width: 1.5,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _getStatusColor().withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              _getStatusIcon(),
              color: _getStatusColor(),
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '系统状态',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF6B7280),
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _statusMessage,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: _getStatusColor(),
                    letterSpacing: 0.3,
                  ),
                ),
                if (_isScanning && _timeoutCountdown > 0) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.accentColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: AppTheme.accentColor.withOpacity(0.3),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.timer,
                          size: 16,
                          color: AppTheme.accentColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${_timeoutCountdown}秒后超时',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.accentColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnterpriseInstructions() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFF8FAFC),
            Color(0xFFF1F5F9),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
        border: Border.all(
          color: const Color(0xFFE2E8F0),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [
                  Color(0xFFF59E0B),
                  Color(0xFFD97706),
                ],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.info_outline,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            '积分操作指南',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                _buildInstructionStep('1', '确保NFC功能已开启'),
                const SizedBox(height: 12),
                _buildInstructionStep('2', '将学生NFC卡片靠近设备背面'),
                const SizedBox(height: 12),
                _buildInstructionStep('3', '保持卡片稳定直到扫描完成'),
                const SizedBox(height: 12),
                _buildInstructionStep('4', '扫描成功后可直接进行积分操作'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInstructionStep(String number, String text) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [
                Color(0xFFF59E0B),
                Color(0xFFD97706),
              ],
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              number,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF374151),
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEnterpriseActionButtons(bool isSmallScreen) {
    return Container(
      padding: EdgeInsets.all(isSmallScreen ? 20 : 24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFF8FAFC),
            Color(0xFFF1F5F9),
          ],
        ),
        borderRadius: const BorderRadius.vertical(
          bottom: Radius.circular(28),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildEnterpriseActionButton(
              _isScanning ? '停止扫描' : '开始扫描',
              _isScanning ? Icons.stop_circle : Icons.play_circle,
              _isScanning ? const Color(0xFFEF4444) : const Color(0xFFF59E0B),
              _isScanning ? _stopScanning : _startScanning,
              isSmallScreen,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnterpriseActionButton(
    String text,
    IconData icon,
    Color color,
    VoidCallback onPressed,
    bool isSmallScreen,
  ) {
    return Container(
      height: isSmallScreen ? 56 : 64,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            color,
            color.withOpacity(0.8),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onPressed,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  icon,
                  color: Colors.white,
                  size: isSmallScreen ? 20 : 24,
                ),
                const SizedBox(width: 12),
                Text(
                  text,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: isSmallScreen ? 16 : 18,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _getStatusColor() {
    if (_statusMessage.contains('成功')) return AppTheme.successColor;
    if (_statusMessage.contains('失败') || _statusMessage.contains('错误')) return AppTheme.errorColor;
    if (_statusMessage.contains('扫描中')) return const Color(0xFFF59E0B);
    return AppTheme.textSecondary;
  }

  IconData _getStatusIcon() {
    if (_statusMessage.contains('成功')) return Icons.check_circle;
    if (_statusMessage.contains('失败') || _statusMessage.contains('错误')) return Icons.error;
    if (_statusMessage.contains('扫描中')) return Icons.stars;
    return Icons.info;
  }

  void _startScanning() async {
    final isAvailable = await FlutterNfcKit.nfcAvailability;
    if (isAvailable != NFCAvailability.available) {
      _updateStatus('NFC功能不可用', isError: true);
      return;
    }

    setState(() {
      _isScanning = true;
      _statusMessage = '正在扫描...';
      _timeoutCountdown = 10;
    });

    _pulseController.repeat(reverse: true);
    _scanController.forward();
    
    // 启动倒计时
    _startCountdown();

    try {
      final result = await NFCSafeScannerService.instance.safeScanNFC(
        timeout: const Duration(seconds: 10),
        requireStudent: true,
      );

      if (!mounted) return;

      if (result.isSuccess && result.student != null) {
        final student = result.student!;
        final studentName = student.getStringValue('student_name');
        
        _updateStatus('找到学生: $studentName', isError: false);

        // 显示成功消息并关闭扫描器
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('扫描成功: $studentName'),
            backgroundColor: AppTheme.successColor,
          ),
        );

        // 关闭扫描器并打开积分面板
        Navigator.pop(context);
        
        // 显示积分操作面板
        _showPointsPanel(context, student);
      } else {
        // 检查是否是超时错误
        String errorMessage = result.errorMessage ?? '扫描失败';
        if (errorMessage.contains('timeout') || errorMessage.contains('超时')) {
          errorMessage = '扫描超时（10秒），请重新扫描';
        }
        _updateStatus(errorMessage, isError: true);
        _stopScanning();
      }
    } catch (e) {
      String errorMessage = '扫描失败: $e';
      if (e.toString().contains('timeout') || e.toString().contains('超时')) {
        errorMessage = '扫描超时（10秒），请重新扫描';
      }
      _updateStatus(errorMessage, isError: true);
      _stopScanning();
    }
  }

  void _startCountdown() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      
      setState(() {
        _timeoutCountdown--;
      });
      
      if (_timeoutCountdown <= 0) {
        timer.cancel();
        if (_isScanning) {
          _updateStatus('扫描超时（10秒），请重新扫描', isError: true);
          _stopScanning();
        }
      }
    });
  }

  void _stopScanning() {
    _countdownTimer?.cancel();
    FlutterNfcKit.finish();
    setState(() {
      _isScanning = false;
      _statusMessage = '扫描已停止';
      _timeoutCountdown = 10;
    });
    _pulseController.stop();
    _scanController.reset();
  }

  void _updateStatus(String message, {bool isError = false}) {
    setState(() {
      _statusMessage = message;
    });
  }

  void _showPointsPanel(BuildContext context, RecordModel student) {
    final pointsProvider = context.read<PointsProvider>();
    final history = pointsProvider.getPointsHistoryForStudent(student.id);
    final totalPoints = pointsProvider.getTotalPointsForStudent(student.id);

    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) {
        return SizedBox(
          height: MediaQuery.of(ctx).size.height * 0.7,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('积分操作 - ${student.getStringValue('student_name')}',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.stars, size: 16, color: AppTheme.primaryColor),
                          const SizedBox(width: 4),
                          Text(
                            '当前积分: $totalPoints',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.primaryColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: history.isEmpty
                    ? const Center(child: Text('暂无积分记录'))
                    : ListView.separated(
                        itemCount: history.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final r = history[index];
                          final points = r.getIntValue('points_change') ?? 0;
                          final reason = r.getStringValue('reason');
                          final date = r.getStringValue('created');
                          final type = r.getStringValue('transaction_type');
                          final color = points >= 0 ? AppTheme.successColor : AppTheme.errorColor;
                          return ListTile(
                            leading: Icon(
                              type == 'add_points'
                                  ? Icons.trending_up
                                  : type == 'redeem'
                                      ? Icons.card_giftcard
                                      : Icons.trending_down,
                              color: color,
                            ),
                            title: Text('${points >= 0 ? '+' : ''}$points 分'),
                            subtitle: Text(reason.isEmpty ? type : '$type · $reason'),
                            trailing: Text(date),
                          );
                        },
                      ),
              ),
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 积分操作按钮
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () {
                              Navigator.pop(ctx); // 关闭积分面板
                              // 延迟显示对话框，确保面板完全关闭
                              Future.delayed(const Duration(milliseconds: 200), () {
                                _showSimplePointsDialog(ctx, 'add_points', student);
                              });
                            },
                            icon: const Icon(Icons.add),
                            label: const Text('增加积分'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.successColor,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () {
                              Navigator.pop(ctx); // 关闭积分面板
                              // 延迟显示对话框，确保面板完全关闭
                              Future.delayed(const Duration(milliseconds: 200), () {
                                _showSimplePointsDialog(ctx, 'deduct_points', student);
                              });
                            },
                            icon: const Icon(Icons.remove),
                            label: const Text('扣除积分'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.errorColor,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pop(ctx); // 关闭积分面板
                          // 延迟显示对话框，确保面板完全关闭
                          Future.delayed(const Duration(milliseconds: 200), () {
                            _showSimplePointsDialog(ctx, 'redeem', student);
                          });
                        },
                        icon: const Icon(Icons.card_giftcard),
                        label: const Text('兑换礼物'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.accentColor,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showSimplePointsDialog(BuildContext context, String actionType, RecordModel student) {
    final pointsProvider = context.read<PointsProvider>();
    final totalPoints = pointsProvider.getTotalPointsForStudent(student.id);
    
    String title;
    Color primaryColor;
    
    switch (actionType) {
      case 'add_points':
        title = '增加积分';
        primaryColor = AppTheme.successColor;
        break;
      case 'deduct_points':
        title = '扣除积分';
        primaryColor = AppTheme.errorColor;
        break;
      case 'redeem':
        title = '兑换礼物';
        primaryColor = AppTheme.accentColor;
        break;
      default:
        return;
    }

    final amountController = TextEditingController();
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text(title),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // 学生信息
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Icon(Icons.person, color: AppTheme.primaryColor),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                student.getStringValue('student_name'),
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                              Text(
                                '学号: ${student.getStringValue('student_id')}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.stars, size: 16, color: AppTheme.primaryColor),
                          const SizedBox(width: 4),
                          Text(
                            '当前积分: $totalPoints',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.primaryColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              
              // 积分数量输入
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: '积分数量',
                  prefixIcon: const Icon(Icons.stars),
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              
              // 原因输入
              TextField(
                controller: reasonController,
                maxLines: 2,
                decoration: InputDecoration(
                  labelText: actionType == 'redeem' ? '兑换说明' : '原因（可选）',
                  prefixIcon: const Icon(Icons.note),
                  border: const OutlineInputBorder(),
                ),
              ),
              
              // 兑换礼物需要拍照凭证
              if (actionType == 'redeem') ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.accentColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.accentColor.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.camera_alt, color: AppTheme.accentColor),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              '拍照凭证',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            Text(
                              '兑换礼物需要拍照作为凭证',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton.icon(
                        onPressed: () async {
                          // TODO: 实现拍照功能
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            const SnackBar(content: Text('拍照功能待实现')),
                          );
                        },
                        icon: const Icon(Icons.camera_alt, size: 16),
                        label: const Text('拍照'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.accentColor,
                          foregroundColor: Colors.white,
                          minimumSize: const Size(80, 32),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('取消'),
            ),
            ElevatedButton(
              onPressed: () async {
                final amount = int.tryParse(amountController.text);
                if (amount == null || amount <= 0) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    const SnackBar(content: Text('请输入有效的积分数量')),
                  );
                  return;
                }
                
                // 兑换礼物需要特殊处理
                if (actionType == 'redeem') {
                  final reason = reasonController.text.trim();
                  if (reason.isEmpty) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      const SnackBar(content: Text('请填写兑换说明')),
                    );
                    return;
                  }
                  
                  await _processPointsTransaction(
                    ctx: ctx,
                    context: context,
                    student: student,
                    actionType: actionType,
                    amount: amount,
                    reason: reason,
                    title: title,
                  );
                } else {
                  await _processPointsTransaction(
                    ctx: ctx,
                    context: context,
                    student: student,
                    actionType: actionType,
                    amount: amount,
                    reason: reasonController.text.trim(),
                    title: title,
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                foregroundColor: Colors.white,
              ),
              child: const Text('确认'),
            ),
          ],
        );
      },
    );
  }

  /// 处理积分交易
  Future<void> _processPointsTransaction({
    required BuildContext ctx,
    required BuildContext context,
    required RecordModel student,
    required String actionType,
    required int amount,
    required String reason,
    required String title,
  }) async {
    // 在异步操作开始前保存必要的引用
    final navigator = Navigator.of(ctx);
    final scaffoldMessenger = ScaffoldMessenger.of(ctx);
    
    try {
      // 显示加载状态
      showDialog(
        context: ctx,
        barrierDismissible: false,
        builder: (dialogContext) => const Center(
          child: CircularProgressIndicator(),
        ),
      );

      // 直接从PocketBaseService获取当前用户，避免使用可能失效的context
      final currentUser = PocketBaseService.instance.currentUser;
      if (currentUser == null) {
        navigator.pop(); // 关闭加载对话框
        scaffoldMessenger.showSnackBar(
          const SnackBar(content: Text('用户未登录')),
        );
        return;
      }

      // 获取老师信息
      RecordModel? teacher;
      String teacherId = currentUser.id;
      String teacherName = currentUser.getStringValue('name') ?? 
                          currentUser.getStringValue('username') ?? 
                          currentUser.getStringValue('email') ?? 
                          '未知老师';
      
      try {
        teacher = await PocketBaseService.instance.getTeacherByUserId(currentUser.id);
        if (teacher != null) {
          teacherId = teacher.id; // 使用教师记录的真实ID
          teacherName = teacher.getStringValue('name') ?? teacherName;
        } else {
          // 如果找不到教师记录，使用用户ID作为备用
        }
      } catch (e) {
      }

      // 计算积分变化
      int pointsChange = amount;
      if (actionType == 'deduct_points' || actionType == 'redeem') {
        pointsChange = -amount; // 扣除积分为负数
      }

      // 创建积分记录 - 使用正确的createPointTransaction方法
      await PocketBaseService.instance.createPointTransaction(
        studentId: student.id,
        teacherId: teacherId, // 使用正确的教师ID
        pointsChange: pointsChange,
        transactionType: actionType,
        reason: reason.isEmpty ? '无' : reason,
        proofImage: actionType == 'redeem' ? null : null, // 如果需要图片凭证
      );

      // 积分汇总更新暂时跳过，避免字段验证问题
      // 可以通过积分记录计算当前积分

      // 刷新积分交易记录
      try {
        final pointsProvider = Provider.of<PointsProvider>(context, listen: false);
        await pointsProvider.loadPointTransactions();
      } catch (e) {
      }

      // 关闭加载对话框
      navigator.pop();
      
      // 关闭积分对话框
      navigator.pop();

      // 显示成功消息
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text('$title 成功: $amount 分'),
          backgroundColor: AppTheme.successColor,
        ),
      );


    } catch (e) {
      // 关闭加载对话框
      try {
        navigator.pop();
      } catch (_) {
        // 忽略关闭对话框时的错误
      }
      
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text('操作失败: ${e.toString()}'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  Future<void> _showPointsDialog(BuildContext context, String actionType, RecordModel student) async {
    final pointsProvider = context.read<PointsProvider>();
    final totalPoints = pointsProvider.getTotalPointsForStudent(student.id);
    
    final amountController = TextEditingController();
    final reasonController = TextEditingController();
    File? proof;

    String title;
    String amountLabel;
    String reasonLabel;
    Color primaryColor;

    switch (actionType) {
      case 'add_points':
        title = '增加积分';
        amountLabel = '增加积分数量';
        reasonLabel = '增加原因（可选）';
        primaryColor = AppTheme.successColor;
        break;
      case 'deduct_points':
        title = '扣除积分';
        amountLabel = '扣除积分数量';
        reasonLabel = '扣除原因（可选）';
        primaryColor = AppTheme.errorColor;
        break;
      case 'redeem':
        title = '兑换礼物';
        amountLabel = '兑换所需积分';
        reasonLabel = '兑换说明';
        primaryColor = AppTheme.accentColor;
        break;
      default:
        return;
    }


    await showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text(title),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // 学生信息显示
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Icon(Icons.person, color: AppTheme.primaryColor),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  student.getStringValue('student_name'),
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                                Text(
                                  '学号: ${student.getStringValue('student_id')}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.stars, size: 16, color: AppTheme.primaryColor),
                            const SizedBox(width: 4),
                            Text(
                              '当前积分: $totalPoints',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                
                // 积分数量输入
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: amountLabel,
                    prefixIcon: const Icon(Icons.stars),
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                
                // 原因输入
                TextField(
                  controller: reasonController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    labelText: reasonLabel,
                    prefixIcon: const Icon(Icons.note),
                    border: const OutlineInputBorder(),
                  ),
                ),
                
                // 兑换礼物需要拍照凭证
                if (actionType == 'redeem') ...[
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () async {
                      // TODO: 实现拍照功能
                    },
                    icon: const Icon(Icons.camera_alt),
                    label: const Text('拍照凭证'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accentColor,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('取消'),
            ),
            ElevatedButton(
              onPressed: () async {
                final amount = int.tryParse(amountController.text);
                if (amount == null || amount <= 0) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    const SnackBar(content: Text('请输入有效的积分数量')),
                  );
                  return;
                }
                
                Navigator.pop(ctx);
                
                // TODO: 实现积分操作逻辑
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('$title 成功: $amount 分')),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                foregroundColor: Colors.white,
              ),
              child: const Text('确认'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _showCustomPointsDialog(String actionType, RecordModel student, {BuildContext? bottomSheetContext}) async {
    final pointsProvider = context.read<PointsProvider>();
    final totalPoints = pointsProvider.getTotalPointsForStudent(student.id);
    
    if (!mounted) {
      return; // 检查widget是否仍然挂载
    }
    
    // 先准备对话框数据，再关闭积分面板
    final amountController = TextEditingController();
    final reasonController = TextEditingController();
    File? proof;

    String title;
    String amountLabel;
    String reasonLabel;
    Color primaryColor;

    switch (actionType) {
      case 'add_points':
        title = '增加积分';
        amountLabel = '增加积分数量';
        reasonLabel = '增加原因（可选）';
        primaryColor = AppTheme.successColor;
        break;
      case 'deduct_points':
        title = '扣除积分';
        amountLabel = '扣除积分数量';
        reasonLabel = '扣除原因（可选）';
        primaryColor = AppTheme.errorColor;
        break;
      case 'redeem':
        title = '兑换礼物';
        amountLabel = '兑换所需积分';
        reasonLabel = '兑换说明';
        primaryColor = AppTheme.accentColor;
        break;
      default:
        return;
    }

    
    // 关闭积分面板
    if (bottomSheetContext != null) {
      Navigator.pop(bottomSheetContext);
    }
    
    // 等待一小段时间让面板完全关闭
    await Future.delayed(const Duration(milliseconds: 100));
    
    if (!mounted) return; // 再次检查，因为Navigator.pop可能触发dispose
    await showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text(title),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // 学生信息显示
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: AppTheme.primaryColor.withOpacity(0.2),
                            child: Text(
                              student.getStringValue('student_name').isNotEmpty 
                                  ? student.getStringValue('student_name')[0].toUpperCase() 
                                  : '?',
                              style: const TextStyle(color: AppTheme.primaryColor),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  student.getStringValue('student_name'),
                                  style: const TextStyle(fontWeight: FontWeight.w600),
                                ),
                                Text(
                                  '${student.getStringValue('student_id')} · ${student.getStringValue('standard')}',
                                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.stars, size: 16, color: AppTheme.primaryColor),
                            const SizedBox(width: 4),
                            Text(
                              '当前积分: $totalPoints',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: amountLabel,
                    hintText: '请输入积分数量',
                    prefixIcon: Icon(
                      actionType == 'add_points' ? Icons.add : 
                      actionType == 'deduct_points' ? Icons.remove : Icons.card_giftcard,
                      color: primaryColor,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: reasonController,
                  decoration: InputDecoration(
                    labelText: reasonLabel,
                    hintText: '请输入${reasonLabel.replaceAll('（可选）', '').replaceAll('（', '').replaceAll('）', '')}',
                    prefixIcon: const Icon(Icons.description, color: AppTheme.textSecondary),
                  ),
                  maxLines: 2,
                ),
                // 兑换时需要拍照凭证
                if (actionType == 'redeem') ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () async {
                            final picker = ImagePicker();
                            final picked = await picker.pickImage(source: ImageSource.camera, imageQuality: 80);
                            if (picked != null) {
                              setState(() => proof = File(picked.path));
                            }
                          },
                          icon: const Icon(Icons.camera_alt),
                          label: const Text('拍照凭证'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryColor,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () async {
                            final picker = ImagePicker();
                            final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
                            if (picked != null) {
                              setState(() => proof = File(picked.path));
                            }
                          },
                          icon: const Icon(Icons.photo_library),
                          label: const Text('相册选择'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.secondaryColor,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: proof == null ? AppTheme.warningColor.withOpacity(0.1) : AppTheme.successColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: proof == null ? AppTheme.warningColor.withOpacity(0.3) : AppTheme.successColor.withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          proof == null ? Icons.warning_outlined : Icons.check_circle,
                          color: proof == null ? AppTheme.warningColor : AppTheme.successColor,
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          proof == null ? '未选择凭证' : '已选择凭证',
                          style: TextStyle(
                            color: proof == null ? AppTheme.warningColor : AppTheme.successColor,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('取消'),
            ),
            FilledButton(
              onPressed: () async {
                final amount = int.tryParse(amountController.text.trim()) ?? 0;
                final reason = reasonController.text.trim();
                
                if (amount <= 0) {
                  if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Text('请输入有效的积分数量'),
                      backgroundColor: AppTheme.errorColor,
                    ),
                  );
                  }
                  return;
                }

                if (actionType == 'redeem' && proof == null) {
                  if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Text('兑换礼物需要拍照凭证'),
                      backgroundColor: AppTheme.warningColor,
                    ),
                  );
                  }
                  return;
                }

                // 显示加载状态
                if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Row(
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 12),
                        Text('正在处理...'),
                      ],
                    ),
                    duration: const Duration(seconds: 2),
                  ),
                );
                }

                // 教师验证步骤已移除，直接进行积分操作

                final provider = context.read<PointsProvider>();
                final teacherId = PocketBaseService.instance.currentUser?.id ?? '';
                
                if (teacherId.isEmpty) {
                  if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Text('无法获取老师ID，请重新登录'),
                      backgroundColor: AppTheme.errorColor,
                    ),
                  );
                  }
                  return;
                }

                bool success = false;
                String? errorMessage;

                try {
                  if (actionType == 'add_points') {
                    success = await provider.addPointsToStudent(student.id, amount, reason, teacherId: teacherId);
                  } else if (actionType == 'deduct_points') {
                    success = await provider.deductPointsFromStudent(student.id, amount, reason, teacherId: teacherId);
                  } else if (actionType == 'redeem') {
                    success = await provider.redeemWithProof(student.id, amount, reason, teacherId: teacherId, proofImage: proof);
                  }
                  
                  errorMessage = provider.error;
                } catch (e) {
                  success = false;
                  errorMessage = '操作异常: $e';
                }

                if (mounted) {
                  Navigator.of(ctx).pop();
                  if (success) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('$title成功'),
                        backgroundColor: AppTheme.successColor,
                      ),
                    );
                  } else {
                    // 显示错误信息
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(errorMessage ?? '操作失败，请重试'),
                        backgroundColor: AppTheme.errorColor,
                        duration: const Duration(seconds: 5),
                        action: SnackBarAction(
                          label: '重试',
                          textColor: Colors.white,
                          onPressed: () {
                            // 重新打开对话框
                            _showPointsDialog(context, actionType, student);
                          },
                        ),
                      ),
                    );
                  }
                }
              },
              style: FilledButton.styleFrom(backgroundColor: primaryColor),
              child: const Text('确定'),
            ),
          ],
        );
      },
    );
  }

  // 教师验证方法已移除，简化积分操作流程
}
