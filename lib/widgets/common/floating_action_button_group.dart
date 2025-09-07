import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class FloatingActionButtonGroup extends StatefulWidget {
  final VoidCallback onNFCTap;
  final VoidCallback onManualTap;

  const FloatingActionButtonGroup({
    super.key,
    required this.onNFCTap,
    required this.onManualTap,
  });

  @override
  State<FloatingActionButtonGroup> createState() => _FloatingActionButtonGroupState();
}

class _FloatingActionButtonGroupState extends State<FloatingActionButtonGroup>
    with TickerProviderStateMixin {
  bool _isExpanded = false;
  late AnimationController _animationController;
  late Animation<double> _expandAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _expandAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: 16,
      right: 16,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_isExpanded) ...[
            _buildActionButton(
              icon: Icons.edit,
              label: '手动签到',
              onTap: widget.onManualTap,
              color: AppTheme.accentColor,
            ),
            const SizedBox(height: 12),
          ],
          _buildMainButton(),
        ],
      ),
    );
  }

  Widget _buildMainButton() {
    return FloatingActionButton(
      onPressed: _toggleExpansion,
      backgroundColor: AppTheme.primaryColor,
      child: AnimatedRotation(
        turns: _isExpanded ? 0.125 : 0,
        duration: const Duration(milliseconds: 300),
        child: Icon(
          _isExpanded ? Icons.close : Icons.add,
          color: Colors.white,
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required Color color,
  }) {
    return AnimatedBuilder(
      animation: _expandAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _expandAnimation.value,
          child: Opacity(
            opacity: _expandAnimation.value,
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: AppSpacing.sm,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.cardColor,
                      borderRadius: BorderRadius.circular(AppRadius.lg),
                      border: Border.all(color: AppTheme.dividerColor),
                      boxShadow: AppTheme.elevatedShadow,
                    ),
                    child: Text(
                      label,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppTheme.textPrimary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FloatingActionButton(
                    onPressed: onTap,
                    backgroundColor: color,
                    mini: true,
                    child: Icon(
                      icon,
                      color: Colors.white,
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

  void _toggleExpansion() {
    setState(() {
      _isExpanded = !_isExpanded;
    });
    
    if (_isExpanded) {
      _animationController.forward();
    } else {
      _animationController.reverse();
    }
  }
}

