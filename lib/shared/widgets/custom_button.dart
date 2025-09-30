import 'package:flutter/material.dart';

enum ButtonVariant {
  primary,
  secondary,
  outline,
  text,
}

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final bool isLoading;
  final IconData? icon;
  final Color? color;
  final Color? textColor;
  final double? width;
  final double? height;

  const CustomButton({
    Key? key,
    required this.text,
    this.onPressed,
    this.variant = ButtonVariant.primary,
    this.isLoading = false,
    this.icon,
    this.color,
    this.textColor,
    this.width,
    this.height,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isEnabled = onPressed != null && !isLoading;

    Color backgroundColor;
    Color foregroundColor;
    Color borderColor = Colors.transparent;

    switch (variant) {
      case ButtonVariant.primary:
        backgroundColor = color ?? theme.colorScheme.primary;
        foregroundColor = textColor ?? Colors.white;
        break;
      case ButtonVariant.secondary:
        backgroundColor = color ?? theme.colorScheme.secondary;
        foregroundColor = textColor ?? Colors.white;
        break;
      case ButtonVariant.outline:
        backgroundColor = Colors.transparent;
        foregroundColor = color ?? theme.colorScheme.primary;
        borderColor = color ?? theme.colorScheme.primary;
        break;
      case ButtonVariant.text:
        backgroundColor = Colors.transparent;
        foregroundColor = color ?? theme.colorScheme.primary;
        break;
    }

    if (!isEnabled) {
      backgroundColor = backgroundColor.withValues(alpha: 0.3);
      foregroundColor = foregroundColor.withValues(alpha: 0.5);
    }

    return SizedBox(
      width: width,
      height: height ?? 48,
      child: ElevatedButton(
        onPressed: isEnabled ? onPressed : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: foregroundColor,
          elevation: variant == ButtonVariant.outline || variant == ButtonVariant.text ? 0 : 2,
          shadowColor: theme.shadowColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: BorderSide(
              color: borderColor,
              width: variant == ButtonVariant.outline ? 1 : 0,
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
        child: isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(foregroundColor),
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 18),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    text,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: foregroundColor,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

