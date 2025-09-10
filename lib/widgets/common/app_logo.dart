import 'package:flutter/material.dart';

class AppLogo extends StatelessWidget {
  final double size;
  final bool showText;
  final Color? textColor;
  final double textSize;

  const AppLogo({
    super.key,
    this.size = 80.0,
    this.showText = true,
    this.textColor,
    this.textSize = 16.0,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Logo Image
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(size * 0.1),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(size * 0.1),
            child: Image.asset(
              'assets/images/logo.png',
              width: size,
              height: size,
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) {
                // 如果图片加载失败，显示备用图标
                return Container(
                  width: size,
                  height: size,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFFFFE082), // 浅黄色
                        Color(0xFFFFB74D), // 橙色
                      ],
                    ),
                    borderRadius: BorderRadius.circular(size * 0.1),
                  ),
                  child: const Icon(
                    Icons.school,
                    color: Colors.white,
                    size: 40,
                  ),
                );
              },
            ),
          ),
        ),
        
        if (showText) ...[
          const SizedBox(height: 12),
          // 中文标题
          Text(
            '安亲 补习中心',
            style: TextStyle(
              fontSize: textSize,
              fontWeight: FontWeight.bold,
              color: textColor ?? const Color(0xFF1E3A8A),
            ),
          ),
          const SizedBox(height: 4),
          // 马来文标题
          Text(
            'Pusat Jagaan Prospek Cemerlang',
            style: TextStyle(
              fontSize: textSize * 0.8,
              color: textColor?.withOpacity(0.8) ?? const Color(0xFF1E3A8A).withOpacity(0.8),
            ),
          ),
        ],
      ],
    );
  }
}
