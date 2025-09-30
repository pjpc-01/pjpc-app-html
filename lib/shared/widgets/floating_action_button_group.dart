import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class FloatingActionButtonGroup extends StatelessWidget {
  final VoidCallback onNFCTap;

  const FloatingActionButtonGroup({
    super.key,
    required this.onNFCTap,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: 16,
      right: 16,
      child: FloatingActionButton(
        onPressed: onNFCTap,
        backgroundColor: AppTheme.primaryColor,
        child: const Icon(
          Icons.nfc,
          color: Colors.white,
        ),
      ),
    );
  }
}

