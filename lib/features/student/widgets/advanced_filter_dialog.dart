import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../../core/theme/app_theme.dart';

/// 高级筛选对话框
class AdvancedFilterDialog extends StatefulWidget {
  final String currentSearchQuery;
  final String currentCenter;
  final String? currentGrade;
  final String? currentClass;
  final String? currentStatus;
  final Function(String, String, String?, String?, String?) onApplyFilter;

  const AdvancedFilterDialog({
    super.key,
    required this.currentSearchQuery,
    required this.currentCenter,
    this.currentGrade,
    this.currentClass,
    this.currentStatus,
    required this.onApplyFilter,
  });

  @override
  State<AdvancedFilterDialog> createState() => _AdvancedFilterDialogState();
}

class _AdvancedFilterDialogState extends State<AdvancedFilterDialog> {
  late TextEditingController _searchController;
  String _selectedCenter = '全部中心';
  String? _selectedGrade;
  String? _selectedClass;
  String? _selectedStatus;
  
  List<String> _centers = ['全部中心']; // 动态获取中心列表
  final List<String> _grades = ['全部年级', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5'];
  final List<String> _statuses = ['全部状态', 'active', 'inactive', 'graduated', 'transferred', 'suspended'];

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(text: widget.currentSearchQuery);
    _selectedCenter = widget.currentCenter;
    _selectedGrade = widget.currentGrade;
    _selectedClass = widget.currentClass;
    _selectedStatus = widget.currentStatus;
    
    // 动态加载中心列表
    _loadCenters();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  /// 动态加载中心列表
  void _loadCenters() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final studentProvider = Provider.of<StudentProvider>(context, listen: false);
      final centers = studentProvider.centers;
      
      setState(() {
        _centers = ['全部中心', ...centers];
        
        // 如果当前选择的中心不在列表中，重置为"全部中心"
        if (!_centers.contains(_selectedCenter)) {
          _selectedCenter = '全部中心';
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.tune_rounded,
              color: AppTheme.primaryColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          const Text(
            '高级筛选',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 搜索关键词
            const Text(
              '搜索关键词',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF374151),
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: '输入学生姓名、学号或班级...',
                hintStyle: TextStyle(
                  color: AppTheme.textTertiary,
                  fontSize: 14,
                ),
                prefixIcon: Icon(
                  Icons.search_rounded,
                  color: AppTheme.textTertiary,
                  size: 20,
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
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
              ),
            ),
            
            const SizedBox(height: 20),
            
            // 中心筛选
            const Text(
              '中心',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF374151),
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: _centers.map((center) {
                final isSelected = _selectedCenter == center;
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedCenter = center;
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isSelected 
                          ? AppTheme.primaryColor 
                          : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected 
                            ? AppTheme.primaryColor 
                            : AppTheme.dividerColor,
                      ),
                    ),
                    child: Text(
                      center,
                      style: TextStyle(
                        color: isSelected 
                            ? Colors.white 
                            : AppTheme.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            
            const SizedBox(height: 20),
            
            // 年级筛选
            const Text(
              '年级',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF374151),
              ),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _selectedGrade,
              decoration: InputDecoration(
                hintText: '选择年级',
                hintStyle: TextStyle(
                  color: AppTheme.textTertiary,
                  fontSize: 14,
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
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
              ),
              items: _grades.map((grade) {
                return DropdownMenuItem<String>(
                  value: grade == '全部年级' ? null : grade,
                  child: Text(
                    grade,
                    style: const TextStyle(fontSize: 14),
                  ),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedGrade = value;
                });
              },
            ),
            
            const SizedBox(height: 20),
            
            // 状态筛选
            const Text(
              '状态',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF374151),
              ),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _selectedStatus,
              decoration: InputDecoration(
                hintText: '选择状态',
                hintStyle: TextStyle(
                  color: AppTheme.textTertiary,
                  fontSize: 14,
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
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
              ),
              items: _statuses.map((status) {
                String displayText = status;
                if (status == 'active') displayText = '在校';
                else if (status == 'inactive') displayText = '停学';
                else if (status == 'graduated') displayText = '毕业';
                else if (status == 'transferred') displayText = '转学';
                else if (status == 'suspended') displayText = '休学';
                
                return DropdownMenuItem<String>(
                  value: status == '全部状态' ? null : status,
                  child: Text(
                    displayText,
                    style: const TextStyle(fontSize: 14),
                  ),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedStatus = value;
                });
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
          },
          child: const Text('取消'),
        ),
        TextButton(
          onPressed: () {
            // 重置筛选条件
            setState(() {
              _searchController.clear();
              _selectedCenter = '全部中心';
              _selectedGrade = null;
              _selectedClass = null;
              _selectedStatus = null;
            });
          },
          child: const Text('重置'),
        ),
        ElevatedButton(
          onPressed: () {
            widget.onApplyFilter(
              _searchController.text,
              _selectedCenter,
              _selectedGrade,
              _selectedClass,
              _selectedStatus,
            );
            Navigator.of(context).pop();
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryColor,
            foregroundColor: Colors.white,
          ),
          child: const Text('应用筛选'),
        ),
      ],
    );
  }
}
