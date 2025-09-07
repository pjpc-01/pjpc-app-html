import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class SmartFilterChips extends StatefulWidget {
  final List<FilterChipData> chips;
  final Function(List<String>) onSelectionChanged;
  final bool multiSelect;

  const SmartFilterChips({
    super.key,
    required this.chips,
    required this.onSelectionChanged,
    this.multiSelect = true,
  });

  @override
  State<SmartFilterChips> createState() => _SmartFilterChipsState();
}

class _SmartFilterChipsState extends State<SmartFilterChips> {
  final Set<String> _selectedFilters = {};

  @override
  void initState() {
    super.initState();
    // 默认选择第一个筛选器
    if (widget.chips.isNotEmpty) {
      _selectedFilters.add(widget.chips.first.id);
    }
  }

  void _onChipTap(String chipId) {
    setState(() {
      if (widget.multiSelect) {
        if (_selectedFilters.contains(chipId)) {
          _selectedFilters.remove(chipId);
        } else {
          _selectedFilters.add(chipId);
        }
      } else {
        _selectedFilters.clear();
        _selectedFilters.add(chipId);
      }
    });
    widget.onSelectionChanged(_selectedFilters.toList());
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: widget.chips.map((chip) {
          final isSelected = _selectedFilters.contains(chip.id);
          return Padding(
            padding: const EdgeInsets.only(right: AppSpacing.sm),
            child: FilterChip(
              label: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (chip.icon != null) ...[
                    Icon(
                      chip.icon,
                      size: 16,
                      color: isSelected ? Colors.white : chip.color,
                    ),
                    const SizedBox(width: 4),
                  ],
                  Text(
                    chip.label,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: isSelected ? Colors.white : chip.color,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (chip.count != null) ...[
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: isSelected 
                            ? Colors.white.withOpacity(0.2)
                            : chip.color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        chip.count.toString(),
                        style: AppTextStyles.caption.copyWith(
                          color: isSelected ? Colors.white : chip.color,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              selected: isSelected,
              onSelected: (_) => _onChipTap(chip.id),
              backgroundColor: chip.color.withOpacity(0.1),
              selectedColor: chip.color,
              checkmarkColor: Colors.white,
              side: BorderSide(
                color: isSelected ? chip.color : chip.color.withOpacity(0.3),
                width: 1,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class FilterChipData {
  final String id;
  final String label;
  final Color color;
  final IconData? icon;
  final int? count;

  const FilterChipData({
    required this.id,
    required this.label,
    required this.color,
    this.icon,
    this.count,
  });
}
