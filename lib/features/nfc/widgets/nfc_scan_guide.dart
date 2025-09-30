import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

/// NFC扫描引导组件 - 帮助用户正确使用NFC扫描功能
class NFCScanGuide extends StatefulWidget {
  final bool isSmallScreen;
  final VoidCallback? onDismiss;
  final bool showSkipButton;
  
  const NFCScanGuide({
    super.key,
    required this.isSmallScreen,
    this.onDismiss,
    this.showSkipButton = true,
  });

  @override
  State<NFCScanGuide> createState() => _NFCScanGuideState();
}

class _NFCScanGuideState extends State<NFCScanGuide>
    with SingleTickerProviderStateMixin {
  late PageController _pageController;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  
  int _currentPage = 0;
  final int _totalPages = 4;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    _animationController.forward();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_currentPage < _totalPages - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _dismissGuide();
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _dismissGuide() {
    _animationController.reverse().then((_) {
      if (widget.onDismiss != null) {
        widget.onDismiss!();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: Container(
        color: Colors.black.withOpacity(0.5),
        child: Center(
          child: Container(
            margin: EdgeInsets.all(widget.isSmallScreen ? 16 : 24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // 标题栏
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    border: Border(
                      bottom: BorderSide(
                        color: Color(0xFFE2E8F0),
                        width: 1,
                      ),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.help_outline,
                          color: AppTheme.primaryColor,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'NFC扫描使用指南',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                      ),
                      if (widget.showSkipButton)
                        TextButton(
                          onPressed: _dismissGuide,
                          child: const Text('跳过'),
                        ),
                    ],
                  ),
                ),
                
                // 内容区域
                SizedBox(
                  height: widget.isSmallScreen ? 300 : 400,
                  child: PageView(
                    controller: _pageController,
                    onPageChanged: (page) {
                      setState(() {
                        _currentPage = page;
                      });
                    },
                    children: [
                      _buildGuidePage(
                        icon: Icons.nfc,
                        title: '开启NFC功能',
                        description: '确保设备NFC功能已开启\n在设置中找到NFC选项并启用',
                        color: const Color(0xFF3B82F6),
                      ),
                      _buildGuidePage(
                        icon: Icons.phone_android,
                        title: '正确放置卡片',
                        description: '将NFC卡片贴近设备背面\n保持卡片稳定，不要移动',
                        color: const Color(0xFF10B981),
                      ),
                      _buildGuidePage(
                        icon: Icons.timer,
                        title: '等待扫描完成',
                        description: '扫描过程需要几秒钟\n请耐心等待，不要移开卡片',
                        color: const Color(0xFFF59E0B),
                      ),
                      _buildGuidePage(
                        icon: Icons.check_circle,
                        title: '扫描成功',
                        description: '听到提示音或震动表示成功\n如果失败，请重试',
                        color: const Color(0xFF10B981),
                      ),
                    ],
                  ),
                ),
                
                // 底部控制栏
                Container(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      // 页面指示器
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          _totalPages,
                          (index) => Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: index == _currentPage
                                  ? AppTheme.primaryColor
                                  : const Color(0xFFE2E8F0),
                            ),
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 20),
                      
                      // 控制按钮
                      Row(
                        children: [
                          if (_currentPage > 0)
                            Expanded(
                              child: OutlinedButton(
                                onPressed: _previousPage,
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: const Text('上一步'),
                              ),
                            ),
                          
                          if (_currentPage > 0) const SizedBox(width: 12),
                          
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _nextPage,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryColor,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: Text(
                                _currentPage == _totalPages - 1 ? '开始使用' : '下一步',
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGuidePage({
    required IconData icon,
    required String title,
    required String description,
    required Color color,
  }) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              size: 60,
              color: color,
            ),
          ),
          
          const SizedBox(height: 32),
          
          Text(
            title,
            style: TextStyle(
              fontSize: widget.isSmallScreen ? 20 : 24,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1E293B),
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 16),
          
          Text(
            description,
            style: TextStyle(
              fontSize: widget.isSmallScreen ? 14 : 16,
              color: const Color(0xFF64748B),
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

/// NFC扫描提示组件 - 显示简短的提示信息
class NFCScanTip extends StatelessWidget {
  final String message;
  final IconData icon;
  final Color color;
  final VoidCallback? onDismiss;
  
  const NFCScanTip({
    super.key,
    required this.message,
    this.icon = Icons.info_outline,
    this.color = const Color(0xFF3B82F6),
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: color,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: color,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          if (onDismiss != null)
            GestureDetector(
              onTap: onDismiss,
              child: Icon(
                Icons.close,
                color: color,
                size: 18,
              ),
            ),
        ],
      ),
    );
  }
}
