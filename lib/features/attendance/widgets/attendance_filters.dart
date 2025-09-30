import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class AttendanceFilters extends StatelessWidget {
  final String selectedFilter;
  final String searchQuery;
  final ValueChanged<String> onFilterChanged;
  final ValueChanged<String> onSearchChanged;
  final bool isSmallScreen;

  const AttendanceFilters({
    super.key,
    required this.selectedFilter,
    required this.searchQuery,
    required this.onFilterChanged,
    required this.onSearchChanged,
    this.isSmallScreen = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        children: [
          // 搜索栏
          TextField(
            onChanged: onSearchChanged,
            decoration: InputDecoration(
              hintText: '搜索姓名或工号',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              filled: true,
              fillColor: Colors.grey[100],
            ),
          ),
          const SizedBox(height: 12),
          // 筛选器
          Row(
            children: [
              _buildFilterChip('today', '今日'),
              const SizedBox(width: AppSpacing.sm),
              _buildFilterChip('week', '本周'),
              const SizedBox(width: AppSpacing.sm),
              _buildFilterChip('month', '本月'),
              const SizedBox(width: AppSpacing.sm),
              _buildFilterChip('all', '全部'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSelected = selectedFilter == value;
    
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          onFilterChanged(value);
        }
      },
      selectedColor: AppTheme.primaryColor.withOpacity(0.2),
      checkmarkColor: AppTheme.primaryColor,
      labelStyle: TextStyle(
        color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
      ),
    );
  }
}

