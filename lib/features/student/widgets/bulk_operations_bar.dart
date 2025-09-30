import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class BulkOperationsBar extends StatelessWidget {
  final int selectedCount;
  final List<BulkOperation> operations;
  final VoidCallback? onClearSelection;

  const BulkOperationsBar({
    super.key,
    required this.selectedCount,
    required this.operations,
    this.onClearSelection,
  });

  @override
  Widget build(BuildContext context) {
    if (selectedCount == 0) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor,
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryColor.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(
            Icons.check_circle,
            color: Colors.white,
            size: 20,
          ),
          const SizedBox(width: AppSpacing.sm),
          Text(
            '已选择 $selectedCount 项',
            style: AppTextStyles.bodyMedium.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w600,
            ),
          ),
          const Spacer(),
          ...operations.map((operation) => Padding(
            padding: const EdgeInsets.only(left: AppSpacing.sm),
            child: _buildOperationButton(operation),
          )),
          if (onClearSelection != null) ...[
            const SizedBox(width: AppSpacing.sm),
            IconButton(
              onPressed: onClearSelection,
              icon: const Icon(Icons.close, color: Colors.white),
              tooltip: '取消选择',
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildOperationButton(BulkOperation operation) {
    return ElevatedButton.icon(
      onPressed: operation.onPressed,
      icon: Icon(operation.icon, size: 16),
      label: Text(operation.label),
      style: ElevatedButton.styleFrom(
        backgroundColor: operation.color,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
    );
  }
}

class BulkOperation {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onPressed;

  const BulkOperation({
    required this.label,
    required this.icon,
    required this.color,
    required this.onPressed,
  });
}
