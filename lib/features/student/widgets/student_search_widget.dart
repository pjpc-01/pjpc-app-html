import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../../core/theme/app_theme.dart';

/// 学生搜索栏组件
class StudentSearchWidget extends StatefulWidget {
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;
  final VoidCallback? onFilterTap;
  final String selectedCenter;
  final ValueChanged<String>? onCenterChanged;

  const StudentSearchWidget({
    super.key,
    required this.searchQuery,
    required this.onSearchChanged,
    this.onFilterTap,
    this.selectedCenter = '全部中心',
    this.onCenterChanged,
  });

  @override
  State<StudentSearchWidget> createState() => _StudentSearchWidgetState();
}

class _StudentSearchWidgetState extends State<StudentSearchWidget> {
  late TextEditingController _searchController;
  bool _isSearchFocused = false;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(text: widget.searchQuery);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          // 搜索栏
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _isSearchFocused 
                    ? AppTheme.primaryColor 
                    : const Color(0xFFE5E7EB),
                width: _isSearchFocused ? 2 : 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: TextField(
              controller: _searchController,
              onChanged: widget.onSearchChanged,
              onTap: () {
                setState(() {
                  _isSearchFocused = true;
                });
              },
              onTapOutside: (_) {
                setState(() {
                  _isSearchFocused = false;
                });
              },
              decoration: InputDecoration(
                hintText: '搜索学生姓名、学号或班级...',
                hintStyle: TextStyle(
                  color: AppTheme.textTertiary,
                  fontSize: 14,
                ),
                prefixIcon: Icon(
                  Icons.search_rounded,
                  color: _isSearchFocused 
                      ? AppTheme.primaryColor 
                      : AppTheme.textTertiary,
                  size: 20,
                ),
                suffixIcon: widget.searchQuery.isNotEmpty
                    ? IconButton(
                        icon: Icon(
                          Icons.clear_rounded,
                          color: AppTheme.textTertiary,
                          size: 20,
                        ),
                        onPressed: () {
                          _searchController.clear();
                          widget.onSearchChanged('');
                        },
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          // 过滤选项 - 动态中心列表
          Consumer<StudentProvider>(
            builder: (context, studentProvider, child) {
              final centers = ['全部中心', ...studentProvider.centers];
              
              return Row(
                children: [
                  Expanded(
                    child: _buildFilterChip(
                      '全部中心',
                      widget.selectedCenter == '全部中心',
                      () => widget.onCenterChanged?.call('全部中心'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ...centers.skip(1).map((center) => [
                    Expanded(
                      child: _buildFilterChip(
                        center,
                        widget.selectedCenter == center,
                        () => widget.onCenterChanged?.call(center),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ]).expand((x) => x).toList(),
                  GestureDetector(
                    onTap: widget.onFilterTap,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: AppTheme.primaryColor.withOpacity(0.3),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.tune_rounded,
                            color: AppTheme.primaryColor,
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '筛选',
                            style: TextStyle(
                              color: AppTheme.primaryColor,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected 
              ? AppTheme.primaryColor 
              : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected 
                ? AppTheme.primaryColor 
                : const Color(0xFFE5E7EB),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected 
                ? Colors.white 
                : AppTheme.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
