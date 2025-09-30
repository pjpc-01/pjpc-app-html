import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

/// 通用加载组件
class UnifiedLoadingWidget extends StatelessWidget {
  final String? message;
  final double? size;
  final Color? color;
  final bool showMessage;
  
  const UnifiedLoadingWidget({
    super.key,
    this.message,
    this.size,
    this.color,
    this.showMessage = true,
  });
  
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: size ?? 40,
            height: size ?? 40,
            child: CircularProgressIndicator(
              color: color ?? AppTheme.primaryColor,
              strokeWidth: 3,
            ),
          ),
          if (showMessage && message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}

/// 通用空状态组件
class UnifiedEmptyStateWidget extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData icon;
  final Color? iconColor;
  final Widget? action;
  final VoidCallback? onAction;
  
  const UnifiedEmptyStateWidget({
    super.key,
    required this.title,
    this.subtitle,
    required this.icon,
    this.iconColor,
    this.action,
    this.onAction,
  });
  
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: (iconColor ?? AppTheme.textTertiary).withOpacity(0.1),
                borderRadius: BorderRadius.circular(50),
              ),
              child: Icon(
                icon,
                size: 48,
                color: iconColor ?? AppTheme.textTertiary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: AppTextStyles.headline6.copyWith(
                color: AppTheme.textPrimary,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppTheme.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null || onAction != null) ...[
              const SizedBox(height: 24),
              action ?? ElevatedButton(
                onPressed: onAction,
                child: const Text('重试'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// 通用错误状态组件
class UnifiedErrorStateWidget extends StatelessWidget {
  final String title;
  final String? subtitle;
  final VoidCallback? onRetry;
  final String? retryText;
  
  const UnifiedErrorStateWidget({
    super.key,
    required this.title,
    this.subtitle,
    this.onRetry,
    this.retryText,
  });
  
  @override
  Widget build(BuildContext context) {
    return UnifiedEmptyStateWidget(
      title: title,
      subtitle: subtitle,
      icon: Icons.error_outline_rounded,
      iconColor: AppTheme.errorColor,
      action: onRetry != null ? ElevatedButton(
        onPressed: onRetry,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.errorColor,
          foregroundColor: Colors.white,
        ),
        child: Text(retryText ?? '重试'),
      ) : null,
    );
  }
}

/// 通用成功状态组件
class UnifiedSuccessStateWidget extends StatelessWidget {
  final String title;
  final String? subtitle;
  final VoidCallback? onAction;
  final String? actionText;
  
  const UnifiedSuccessStateWidget({
    super.key,
    required this.title,
    this.subtitle,
    this.onAction,
    this.actionText,
  });
  
  @override
  Widget build(BuildContext context) {
    return UnifiedEmptyStateWidget(
      title: title,
      subtitle: subtitle,
      icon: Icons.check_circle_outline_rounded,
      iconColor: AppTheme.successColor,
      action: onAction != null ? ElevatedButton(
        onPressed: onAction,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.successColor,
          foregroundColor: Colors.white,
        ),
        child: Text(actionText ?? '继续'),
      ) : null,
    );
  }
}

/// 通用列表项组件
class UnifiedListItemWidget extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? trailing;
  final IconData? leadingIcon;
  final Widget? leading;
  final Widget? trailingWidget;
  final VoidCallback? onTap;
  final Color? backgroundColor;
  final EdgeInsetsGeometry? padding;
  final bool showDivider;
  
  const UnifiedListItemWidget({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
    this.leadingIcon,
    this.leading,
    this.trailingWidget,
    this.onTap,
    this.backgroundColor,
    this.padding,
    this.showDivider = true,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      color: backgroundColor ?? Colors.transparent,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Container(
            padding: padding ?? const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
            child: Row(
              children: [
                if (leading != null) ...[
                  leading!,
                  const SizedBox(width: 16),
                ] else if (leadingIcon != null) ...[
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      leadingIcon!,
                      color: AppTheme.primaryColor,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 16),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppTextStyles.bodyLarge.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          subtitle!,
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (trailingWidget != null) ...[
                  trailingWidget!,
                ] else if (trailing != null) ...[
                  Text(
                    trailing!,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    Icons.chevron_right_rounded,
                    color: AppTheme.textTertiary,
                    size: 20,
                  ),
                ] else if (onTap != null) ...[
                  Icon(
                    Icons.chevron_right_rounded,
                    color: AppTheme.textTertiary,
                    size: 20,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// 通用统计卡片组件
class UnifiedStatCardWidget extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final String? subtitle;
  final VoidCallback? onTap;
  
  const UnifiedStatCardWidget({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.subtitle,
    this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.dividerColor),
          boxShadow: AppTheme.cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    icon,
                    color: color,
                    size: 20,
                  ),
                ),
                const Spacer(),
                if (onTap != null)
                  Icon(
                    Icons.chevron_right_rounded,
                    color: AppTheme.textTertiary,
                    size: 16,
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 2),
              Text(
                subtitle!,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppTheme.textTertiary,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// 通用搜索栏组件
class UnifiedSearchBarWidget extends StatefulWidget {
  final String hintText;
  final ValueChanged<String> onChanged;
  final VoidCallback? onClear;
  final bool enabled;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  
  const UnifiedSearchBarWidget({
    super.key,
    required this.hintText,
    required this.onChanged,
    this.onClear,
    this.enabled = true,
    this.prefixIcon,
    this.suffixIcon,
  });
  
  @override
  State<UnifiedSearchBarWidget> createState() => _UnifiedSearchBarWidgetState();
}

class _UnifiedSearchBarWidgetState extends State<UnifiedSearchBarWidget> {
  late TextEditingController _controller;
  bool _isFocused = false;
  
  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _isFocused 
              ? AppTheme.primaryColor 
              : AppTheme.dividerColor,
          width: _isFocused ? 2 : 1,
        ),
        boxShadow: AppTheme.cardShadow,
      ),
      child: TextField(
        controller: _controller,
        onChanged: widget.onChanged,
        enabled: widget.enabled,
        onTap: () {
          setState(() {
            _isFocused = true;
          });
        },
        onTapOutside: (_) {
          setState(() {
            _isFocused = false;
          });
        },
        decoration: InputDecoration(
          hintText: widget.hintText,
          hintStyle: AppTextStyles.bodyMedium.copyWith(
            color: AppTheme.textTertiary,
          ),
          prefixIcon: widget.prefixIcon ?? Icon(
            Icons.search_rounded,
            color: _isFocused 
                ? AppTheme.primaryColor 
                : AppTheme.textTertiary,
            size: 20,
          ),
          suffixIcon: widget.suffixIcon ?? (_controller.text.isNotEmpty
              ? IconButton(
                  icon: Icon(
                    Icons.clear_rounded,
                    color: AppTheme.textTertiary,
                    size: 20,
                  ),
                  onPressed: () {
                    _controller.clear();
                    widget.onChanged('');
                    widget.onClear?.call();
                  },
                )
              : null),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
        ),
      ),
    );
  }
}
