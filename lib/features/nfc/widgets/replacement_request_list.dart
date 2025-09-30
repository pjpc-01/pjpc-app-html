import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../../core/theme/app_theme.dart';
import 'replacement_request_detail_dialog.dart';

/// 补办申请列表组件
class ReplacementRequestList extends StatefulWidget {
  final List<RecordModel> requests;
  final bool isLoading;
  final String selectedFilter;
  final Function(String) onFilterChanged;
  final Function(String) onApprove;
  final Function(String) onReject;
  final bool isSmallScreen;

  const ReplacementRequestList({
    super.key,
    required this.requests,
    required this.isLoading,
    required this.selectedFilter,
    required this.onFilterChanged,
    required this.onApprove,
    required this.onReject,
    required this.isSmallScreen,
  });

  @override
  State<ReplacementRequestList> createState() => _ReplacementRequestListState();
}

class _ReplacementRequestListState extends State<ReplacementRequestList> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<RecordModel> _getFilteredRequests() {
    var filtered = widget.requests;

    // 按状态过滤
    if (widget.selectedFilter != 'all') {
      filtered = filtered.where((request) {
        return request.getStringValue('replacement_status') == widget.selectedFilter;
      }).toList();
    }

    // 按搜索关键词过滤
    if (_searchQuery.isNotEmpty) {
      final studentProvider = context.read<StudentProvider>();
      final students = studentProvider.students;
      
      filtered = filtered.where((request) {
        try {
          final student = students.firstWhere(
            (s) => s.id == request.getStringValue('student'),
          );
          final studentName = student.getStringValue('student_name') ?? 
                             student.getStringValue('name') ?? '';
          final studentId = student.getStringValue('student_id') ?? '';
          final reason = request.getStringValue('replacement_reason') ?? '';
          final location = request.getStringValue('replacement_lost_location') ?? '';
          
          final query = _searchQuery.toLowerCase();
          return studentName.toLowerCase().contains(query) ||
                 studentId.toLowerCase().contains(query) ||
                 reason.toLowerCase().contains(query) ||
                 location.toLowerCase().contains(query);
        } catch (e) {
          return false;
        }
      }).toList();
    }

    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // 筛选标签
        _buildFilterTabs(),
        const SizedBox(height: 16),
        
        // 搜索框
        _buildSearchBar(),
        const SizedBox(height: 16),
        
        // 申请列表 - 使用固定高度而不是Expanded
        SizedBox(
          height: 400, // 固定高度，避免无限约束
          child: _buildRequestList(),
        ),
      ],
    );
  }

  Widget _buildFilterTabs() {
    final filters = [
      {'key': 'pending', 'label': '待处理', 'color': const Color(0xFFF59E0B)},
      {'key': 'approved', 'label': '已批准', 'color': const Color(0xFF10B981)},
      {'key': 'rejected', 'label': '已拒绝', 'color': const Color(0xFFEF4444)},
      {'key': 'all', 'label': '全部', 'color': const Color(0xFF6B7280)},
    ];

    return Container(
      padding: EdgeInsets.all(widget.isSmallScreen ? 8 : 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: filters.map((filter) {
          final isSelected = widget.selectedFilter == filter['key'];
          return Expanded(
            child: GestureDetector(
              onTap: () => widget.onFilterChanged(filter['key'] as String),
              child: Container(
                padding: EdgeInsets.symmetric(
                  vertical: widget.isSmallScreen ? 8 : 12,
                ),
                decoration: BoxDecoration(
                  color: isSelected 
                    ? (filter['color'] as Color).withOpacity(0.1)
                    : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  filter['label'] as String,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: widget.isSmallScreen ? 12 : 14,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                    color: isSelected 
                      ? filter['color'] as Color
                      : AppTheme.textSecondary,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: widget.isSmallScreen ? 12 : 16,
        vertical: widget.isSmallScreen ? 8 : 12,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
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
        decoration: InputDecoration(
          hintText: '搜索学生姓名、学号、原因或地点',
          hintStyle: TextStyle(
            color: AppTheme.textTertiary,
            fontSize: widget.isSmallScreen ? 14 : 16,
          ),
          prefixIcon: Icon(
            Icons.search,
            color: AppTheme.textSecondary,
            size: widget.isSmallScreen ? 20 : 24,
          ),
          suffixIcon: _searchQuery.isNotEmpty
            ? IconButton(
                icon: Icon(
                  Icons.clear,
                  color: AppTheme.textSecondary,
                  size: widget.isSmallScreen ? 20 : 24,
                ),
                onPressed: () {
                  _searchController.clear();
                  setState(() {
                    _searchQuery = '';
                  });
                },
              )
            : null,
          border: InputBorder.none,
        ),
        style: TextStyle(
          fontSize: widget.isSmallScreen ? 14 : 16,
          color: AppTheme.textPrimary,
        ),
        onChanged: (value) {
          setState(() {
            _searchQuery = value;
          });
        },
      ),
    );
  }

  Widget _buildRequestList() {
    if (widget.isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    final filteredRequests = _getFilteredRequests();

    if (filteredRequests.isEmpty) {
      return Container(
        padding: EdgeInsets.all(widget.isSmallScreen ? 20 : 40),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.inbox,
                size: widget.isSmallScreen ? 48 : 64,
                color: AppTheme.textTertiary,
              ),
              const SizedBox(height: 16),
              Text(
                _searchQuery.isNotEmpty 
                  ? '未找到匹配的申请'
                  : '暂无补办申请',
                style: TextStyle(
                  fontSize: widget.isSmallScreen ? 16 : 18,
                  color: AppTheme.textSecondary,
                ),
              ),
              if (_searchQuery.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  '尝试使用其他关键词搜索',
                  style: TextStyle(
                    fontSize: widget.isSmallScreen ? 14 : 16,
                    color: AppTheme.textTertiary,
                  ),
                ),
              ],
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      itemCount: filteredRequests.length,
      itemBuilder: (context, index) {
        final request = filteredRequests[index];
        return _buildRequestCard(request);
      },
    );
  }

  Widget _buildRequestCard(RecordModel request) {
    final studentProvider = context.read<StudentProvider>();
    final students = studentProvider.students;
    
    RecordModel? student;
    try {
      student = students.firstWhere(
        (s) => s.id == request.getStringValue('student'),
      );
    } catch (e) {
      // 学生不存在
    }

    final studentName = student?.getStringValue('student_name') ?? 
                       student?.getStringValue('name') ?? '未知学生';
    final studentId = student?.getStringValue('student_id') ?? '';
    final status = request.getStringValue('replacement_status') ?? 'pending';
    final reason = request.getStringValue('replacement_reason') ?? '未知';
    final urgency = request.getStringValue('replacement_urgency') ?? 'medium';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            showDialog(
              context: context,
              builder: (context) => ReplacementRequestDetailDialog(
                request: request,
                onApprove: widget.onApprove,
                onReject: widget.onReject,
                isSmallScreen: widget.isSmallScreen,
              ),
            );
          },
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: EdgeInsets.all(widget.isSmallScreen ? 16 : 20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 标题行
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            studentName,
                            style: TextStyle(
                              fontSize: widget.isSmallScreen ? 16 : 18,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF1E293B),
                            ),
                          ),
                          if (studentId.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              '学号: $studentId',
                              style: TextStyle(
                                fontSize: widget.isSmallScreen ? 12 : 14,
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    _buildStatusChip(status),
                  ],
                ),
                
                const SizedBox(height: 12),
                
                // 申请信息
                Row(
                  children: [
                    Icon(
                      Icons.info_outline,
                      size: widget.isSmallScreen ? 16 : 18,
                      color: AppTheme.textSecondary,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        reason,
                        style: TextStyle(
                          fontSize: widget.isSmallScreen ? 12 : 14,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 8),
                
                // 紧急程度和申请时间
                Row(
                  children: [
                    _buildUrgencyChip(urgency),
                    const Spacer(),
                    Text(
                      _formatDateTime(request.created),
                      style: TextStyle(
                        fontSize: widget.isSmallScreen ? 11 : 12,
                        color: AppTheme.textTertiary,
                      ),
                    ),
                  ],
                ),
                
                // 操作按钮（仅待处理状态显示）
                if (status == 'pending') ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => widget.onApprove(request.id),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            padding: EdgeInsets.symmetric(
                              vertical: widget.isSmallScreen ? 8 : 12,
                            ),
                          ),
                          child: Text(
                            '批准',
                            style: TextStyle(
                              fontSize: widget.isSmallScreen ? 12 : 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => widget.onReject(request.id),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFEF4444),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            padding: EdgeInsets.symmetric(
                              vertical: widget.isSmallScreen ? 8 : 12,
                            ),
                          ),
                          child: Text(
                            '拒绝',
                            style: TextStyle(
                              fontSize: widget.isSmallScreen ? 12 : 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    String label;
    
    switch (status) {
      case 'pending':
        color = const Color(0xFFF59E0B);
        label = '待处理';
        break;
      case 'approved':
        color = const Color(0xFF10B981);
        label = '已批准';
        break;
      case 'rejected':
        color = const Color(0xFFEF4444);
        label = '已拒绝';
        break;
      default:
        color = const Color(0xFF6B7280);
        label = '未知';
    }
    
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: widget.isSmallScreen ? 8 : 12,
        vertical: widget.isSmallScreen ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: widget.isSmallScreen ? 10 : 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _buildUrgencyChip(String urgency) {
    Color color;
    String label;
    
    switch (urgency) {
      case 'low':
        color = const Color(0xFF10B981);
        label = '低';
        break;
      case 'medium':
        color = const Color(0xFFF59E0B);
        label = '中';
        break;
      case 'high':
        color = const Color(0xFFEF4444);
        label = '高';
        break;
      default:
        color = const Color(0xFF6B7280);
        label = '未知';
    }
    
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: widget.isSmallScreen ? 6 : 8,
        vertical: widget.isSmallScreen ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '紧急: $label',
        style: TextStyle(
          fontSize: widget.isSmallScreen ? 10 : 11,
          fontWeight: FontWeight.w500,
          color: color,
        ),
      ),
    );
  }

  String _formatDateTime(String? dateTime) {
    if (dateTime == null || dateTime.isEmpty) return '未知';
    try {
      final date = DateTime.parse(dateTime);
      return '${date.month}/${date.day} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateTime;
    }
  }
}
