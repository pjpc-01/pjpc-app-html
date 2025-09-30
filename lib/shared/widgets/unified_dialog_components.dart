import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

/// 通用确认对话框组件
class UnifiedConfirmDialog extends StatelessWidget {
  final String title;
  final String content;
  final String confirmText;
  final String cancelText;
  final VoidCallback? onConfirm;
  final VoidCallback? onCancel;
  final Color? confirmColor;
  final IconData? icon;
  
  const UnifiedConfirmDialog({
    super.key,
    required this.title,
    required this.content,
    this.confirmText = '确认',
    this.cancelText = '取消',
    this.onConfirm,
    this.onCancel,
    this.confirmColor,
    this.icon,
  });
  
  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      title: Row(
        children: [
          if (icon != null) ...[
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: (confirmColor ?? AppTheme.primaryColor).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon!,
                color: confirmColor ?? AppTheme.primaryColor,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Text(
              title,
              style: AppTextStyles.headline6.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      content: Text(
        content,
        style: AppTextStyles.bodyMedium.copyWith(
          color: AppTheme.textSecondary,
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
            onCancel?.call();
          },
          child: Text(cancelText),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.of(context).pop();
            onConfirm?.call();
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: confirmColor ?? AppTheme.primaryColor,
            foregroundColor: Colors.white,
          ),
          child: Text(confirmText),
        ),
      ],
    );
  }
  
  /// 显示确认对话框
  static Future<bool?> show(
    BuildContext context, {
    required String title,
    required String content,
    String confirmText = '确认',
    String cancelText = '取消',
    VoidCallback? onConfirm,
    VoidCallback? onCancel,
    Color? confirmColor,
    IconData? icon,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (context) => UnifiedConfirmDialog(
        title: title,
        content: content,
        confirmText: confirmText,
        cancelText: cancelText,
        onConfirm: onConfirm,
        onCancel: onCancel,
        confirmColor: confirmColor,
        icon: icon,
      ),
    );
  }
}

/// 通用输入对话框组件
class UnifiedInputDialog extends StatefulWidget {
  final String title;
  final String hintText;
  final String? initialValue;
  final String confirmText;
  final String cancelText;
  final ValueChanged<String>? onConfirm;
  final VoidCallback? onCancel;
  final TextInputType? keyboardType;
  final int? maxLines;
  final int? maxLength;
  
  const UnifiedInputDialog({
    super.key,
    required this.title,
    required this.hintText,
    this.initialValue,
    this.confirmText = '确认',
    this.cancelText = '取消',
    this.onConfirm,
    this.onCancel,
    this.keyboardType,
    this.maxLines = 1,
    this.maxLength,
  });
  
  @override
  State<UnifiedInputDialog> createState() => _UnifiedInputDialogState();
}

class _UnifiedInputDialogState extends State<UnifiedInputDialog> {
  late TextEditingController _controller;
  
  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialValue);
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      title: Text(
        widget.title,
        style: AppTextStyles.headline6.copyWith(
          fontWeight: FontWeight.w600,
        ),
      ),
      content: TextField(
        controller: _controller,
        decoration: InputDecoration(
          hintText: widget.hintText,
          hintStyle: AppTextStyles.bodyMedium.copyWith(
            color: AppTheme.textTertiary,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: AppTheme.dividerColor),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: AppTheme.dividerColor),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: AppTheme.primaryColor),
          ),
        ),
        keyboardType: widget.keyboardType,
        maxLines: widget.maxLines,
        maxLength: widget.maxLength,
        autofocus: true,
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
            widget.onCancel?.call();
          },
          child: Text(widget.cancelText),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.of(context).pop();
            widget.onConfirm?.call(_controller.text);
          },
          child: Text(widget.confirmText),
        ),
      ],
    );
  }
  
  /// 显示输入对话框
  static Future<String?> show(
    BuildContext context, {
    required String title,
    required String hintText,
    String? initialValue,
    String confirmText = '确认',
    String cancelText = '取消',
    ValueChanged<String>? onConfirm,
    VoidCallback? onCancel,
    TextInputType? keyboardType,
    int? maxLines,
    int? maxLength,
  }) {
    return showDialog<String>(
      context: context,
      builder: (context) => UnifiedInputDialog(
        title: title,
        hintText: hintText,
        initialValue: initialValue,
        confirmText: confirmText,
        cancelText: cancelText,
        onConfirm: onConfirm,
        onCancel: onCancel,
        keyboardType: keyboardType,
        maxLines: maxLines,
        maxLength: maxLength,
      ),
    );
  }
}

/// 通用底部操作栏组件
class UnifiedBottomActionBar extends StatelessWidget {
  final List<Widget> actions;
  final Color? backgroundColor;
  final EdgeInsetsGeometry? padding;
  
  const UnifiedBottomActionBar({
    super.key,
    required this.actions,
    this.backgroundColor,
    this.padding,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundColor ?? Colors.white,
        border: Border(
          top: BorderSide(
            color: AppTheme.dividerColor,
            width: 1,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: actions,
        ),
      ),
    );
  }
}

/// 通用标签组件
class UnifiedTagWidget extends StatelessWidget {
  final String text;
  final Color? backgroundColor;
  final Color? textColor;
  final EdgeInsetsGeometry? padding;
  final BorderRadius? borderRadius;
  final VoidCallback? onTap;
  
  const UnifiedTagWidget({
    super.key,
    required this.text,
    this.backgroundColor,
    this.textColor,
    this.padding,
    this.borderRadius,
    this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: padding ?? const EdgeInsets.symmetric(
          horizontal: 8,
          vertical: 4,
        ),
        decoration: BoxDecoration(
          color: backgroundColor ?? AppTheme.primaryColor.withOpacity(0.1),
          borderRadius: borderRadius ?? BorderRadius.circular(4),
        ),
        child: Text(
          text,
          style: AppTextStyles.bodySmall.copyWith(
            color: textColor ?? AppTheme.primaryColor,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

/// 通用头像组件
class UnifiedAvatarWidget extends StatelessWidget {
  final String? imageUrl;
  final String? name;
  final double size;
  final Color? backgroundColor;
  final Color? textColor;
  final IconData? fallbackIcon;
  
  const UnifiedAvatarWidget({
    super.key,
    this.imageUrl,
    this.name,
    this.size = 40,
    this.backgroundColor,
    this.textColor,
    this.fallbackIcon,
  });
  
  @override
  Widget build(BuildContext context) {
    final bgColor = backgroundColor ?? AppTheme.primaryColor.withOpacity(0.1);
    final txtColor = textColor ?? AppTheme.primaryColor;
    
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(size / 2),
      ),
      child: imageUrl != null && imageUrl!.isNotEmpty
          ? ClipRRect(
              borderRadius: BorderRadius.circular(size / 2),
              child: Image.network(
                imageUrl!,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return _buildFallback(txtColor);
                },
              ),
            )
          : _buildFallback(txtColor),
    );
  }
  
  Widget _buildFallback(Color textColor) {
    if (name != null && name!.isNotEmpty) {
      return Center(
        child: Text(
          name!.substring(0, 1).toUpperCase(),
          style: TextStyle(
            color: textColor,
            fontSize: size * 0.4,
            fontWeight: FontWeight.bold,
          ),
        ),
      );
    }
    
    return Center(
      child: Icon(
        fallbackIcon ?? Icons.person_rounded,
        color: textColor,
        size: size * 0.5,
      ),
    );
  }
}

/// 通用分割线组件
class UnifiedDividerWidget extends StatelessWidget {
  final double? height;
  final Color? color;
  final EdgeInsetsGeometry? margin;
  
  const UnifiedDividerWidget({
    super.key,
    this.height,
    this.color,
    this.margin,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      height: height ?? 1,
      color: color ?? AppTheme.dividerColor,
    );
  }
}

/// 通用间距组件
class UnifiedSpacingWidget extends StatelessWidget {
  final double height;
  final double? width;
  final Color? color;
  
  const UnifiedSpacingWidget({
    super.key,
    this.height = 16,
    this.width,
    this.color,
  });
  
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: width,
      child: color != null
          ? Container(color: color)
          : null,
    );
  }
}
