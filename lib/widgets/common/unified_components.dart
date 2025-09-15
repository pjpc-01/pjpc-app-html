import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// 统一的AppBar组件
class UnifiedAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;
  final bool centerTitle;
  final Color? backgroundColor;
  final Color? foregroundColor;

  const UnifiedAppBar({
    super.key,
    required this.title,
    this.actions,
    this.leading,
    this.centerTitle = true,
    this.backgroundColor,
    this.foregroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(
        title,
        style: AppTextStyles.headline6.copyWith(
          color: foregroundColor ?? Colors.white,
          fontWeight: FontWeight.w600,
        ),
      ),
      backgroundColor: backgroundColor ?? AppTheme.primaryColor,
      foregroundColor: foregroundColor ?? Colors.white,
      elevation: 0,
      centerTitle: centerTitle,
      actions: actions,
      leading: leading,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

/// 统一的卡片组件
class UnifiedCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? backgroundColor;
  final double? elevation;
  final BorderRadius? borderRadius;
  final Border? border;
  final List<BoxShadow>? boxShadow;

  const UnifiedCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.backgroundColor,
    this.elevation,
    this.borderRadius,
    this.border,
    this.boxShadow,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      child: Card(
        elevation: elevation ?? 0,
        color: backgroundColor ?? AppTheme.cardColor,
        shape: RoundedRectangleBorder(
          borderRadius: borderRadius ?? BorderRadius.circular(AppRadius.lg),
          side: border ?? const BorderSide(color: AppTheme.dividerColor),
        ),
        shadowColor: Colors.transparent,
        child: Container(
          padding: padding ?? EdgeInsets.all(AppSpacing.lg),
          child: child,
        ),
      ),
    );
  }
}

/// 统一的渐变卡片组件
class UnifiedGradientCard extends StatelessWidget {
  final Widget child;
  final List<Color>? colors;
  final AlignmentGeometry? begin;
  final AlignmentGeometry? end;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final BorderRadius? borderRadius;
  final List<BoxShadow>? boxShadow;

  const UnifiedGradientCard({
    super.key,
    required this.child,
    this.colors,
    this.begin,
    this.end,
    this.padding,
    this.margin,
    this.borderRadius,
    this.boxShadow,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin ?? EdgeInsets.all(AppSpacing.md),
      child: Container(
        padding: padding ?? EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: begin ?? Alignment.topLeft,
            end: end ?? Alignment.bottomRight,
            colors: colors ?? [
              AppTheme.primaryColor,
              AppTheme.primaryVariant,
            ],
          ),
          borderRadius: borderRadius ?? BorderRadius.circular(AppRadius.lg),
          boxShadow: boxShadow ?? AppTheme.cardShadow,
        ),
        child: child,
      ),
    );
  }
}

/// 统一的功能卡片组件
class UnifiedActionCard extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData icon;
  final Color? iconColor;
  final Color? backgroundColor;
  final VoidCallback? onTap;
  final Widget? trailing;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;

  const UnifiedActionCard({
    super.key,
    required this.title,
    this.subtitle,
    required this.icon,
    this.iconColor,
    this.backgroundColor,
    this.onTap,
    this.trailing,
    this.padding,
    this.margin,
  });

  @override
  Widget build(BuildContext context) {
    return UnifiedCard(
      margin: margin,
      padding: padding ?? EdgeInsets.all(AppSpacing.lg),
      backgroundColor: backgroundColor,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: (iconColor ?? AppTheme.primaryColor).withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Icon(
                icon,
                color: iconColor ?? AppTheme.primaryColor,
                size: 24,
              ),
            ),
            SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.headline6,
                  ),
                  if (subtitle != null) ...[
                    SizedBox(height: AppSpacing.xs),
                    Text(
                      subtitle!,
                      style: AppTextStyles.bodySmall,
                    ),
                  ],
                ],
              ),
            ),
            if (trailing != null) ...[
              SizedBox(width: AppSpacing.md),
              trailing!,
            ],
          ],
        ),
      ),
    );
  }
}

/// 统一的页面容器组件
class UnifiedPageContainer extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Color? backgroundColor;
  final bool scrollable;

  const UnifiedPageContainer({
    super.key,
    required this.child,
    this.padding,
    this.backgroundColor,
    this.scrollable = true,
  });

  @override
  Widget build(BuildContext context) {
    final content = Container(
      padding: padding ?? EdgeInsets.all(AppSpacing.lg),
      child: child,
    );

    if (scrollable) {
      return SingleChildScrollView(
        child: content,
      );
    }

    return content;
  }
}
