import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class SmartSortDropdown extends StatefulWidget {
  final List<SortOption> options;
  final String? selectedOption;
  final Function(String) onSortChanged;

  const SmartSortDropdown({
    super.key,
    required this.options,
    required this.onSortChanged,
    this.selectedOption,
  });

  @override
  State<SmartSortDropdown> createState() => _SmartSortDropdownState();
}

class _SmartSortDropdownState extends State<SmartSortDropdown> {
  String? _selectedOption;

  @override
  void initState() {
    super.initState();
    _selectedOption = widget.selectedOption ?? widget.options.first.id;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppTheme.dividerColor),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedOption,
          isExpanded: true,
          icon: const Icon(Icons.keyboard_arrow_down, color: AppTheme.primaryColor),
          style: AppTextStyles.bodyMedium,
          items: widget.options.map((option) {
            return DropdownMenuItem<String>(
              value: option.id,
              child: Row(
                children: [
                  Icon(
                    option.icon,
                    size: 16,
                    color: AppTheme.textSecondary,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      option.label,
                      style: AppTextStyles.bodyMedium,
                    ),
                  ),
                  if (option.isDefault) ...[
                    const SizedBox(width: AppSpacing.sm),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '推荐',
                        style: AppTextStyles.caption.copyWith(
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            );
          }).toList(),
          onChanged: (value) {
            if (value != null) {
              setState(() {
                _selectedOption = value;
              });
              widget.onSortChanged(value);
            }
          },
        ),
      ),
    );
  }
}

class SortOption {
  final String id;
  final String label;
  final IconData icon;
  final bool isDefault;
  final String Function(dynamic) sortKey;

  const SortOption({
    required this.id,
    required this.label,
    required this.icon,
    required this.sortKey,
    this.isDefault = false,
  });
}
