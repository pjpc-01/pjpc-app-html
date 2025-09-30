import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../features/attendance/providers/attendance_provider.dart';
import '../../../features/student/providers/student_provider.dart';

class StudentAttendanceHistoryScreen extends StatefulWidget {
  final String studentId;
  final String studentName;

  const StudentAttendanceHistoryScreen({
    super.key,
    required this.studentId,
    required this.studentName,
  });

  @override
  State<StudentAttendanceHistoryScreen> createState() => _StudentAttendanceHistoryScreenState();
}

class _StudentAttendanceHistoryScreenState extends State<StudentAttendanceHistoryScreen> {
  String _selectedFilter = 'all';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AttendanceProvider>(context, listen: false).loadAttendanceRecords();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
    });
  }

  void _onFilterChanged(String filter) {
    setState(() {
      _selectedFilter = filter;
    });
  }

  List<dynamic> _getFilteredRecords(List<dynamic> records) {
    var filteredRecords = records.where((record) {
      return record.getStringValue('student') == widget.studentId;
    }).toList();

    // 按日期筛选
    final now = DateTime.now();
    switch (_selectedFilter) {
      case 'today':
        final today = now.toIso8601String().split('T')[0];
        filteredRecords = filteredRecords.where((record) {
          return record.getStringValue('date') == today;
        }).toList();
        break;
      case 'week':
        final weekAgo = now.subtract(const Duration(days: 7));
        filteredRecords = filteredRecords.where((record) {
          final recordDate = DateTime.tryParse(record.getStringValue('date') ?? '');
          return recordDate != null && recordDate.isAfter(weekAgo);
        }).toList();
        break;
      case 'month':
        final monthAgo = now.subtract(const Duration(days: 30));
        filteredRecords = filteredRecords.where((record) {
          final recordDate = DateTime.tryParse(record.getStringValue('date') ?? '');
          return recordDate != null && recordDate.isAfter(monthAgo);
        }).toList();
        break;
    }

    // 按搜索查询筛选
    if (_searchQuery.isNotEmpty) {
      final searchLower = _searchQuery.toLowerCase();
      filteredRecords = filteredRecords.where((record) {
        final type = record.getStringValue('type') ?? '';
        final status = record.getStringValue('status') ?? '';
        final notes = record.getStringValue('notes') ?? '';
        return type.toLowerCase().contains(searchLower) ||
               status.toLowerCase().contains(searchLower) ||
               notes.toLowerCase().contains(searchLower);
      }).toList();
    }

    // 按日期排序（最新的在前）
    filteredRecords.sort((a, b) {
      final dateA = DateTime.tryParse(a.getStringValue('date') ?? '') ?? DateTime(1970);
      final dateB = DateTime.tryParse(b.getStringValue('date') ?? '') ?? DateTime(1970);
      return dateB.compareTo(dateA);
    });

    return filteredRecords;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        children: [
          // Header Section
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF3B82F6),
                  Color(0xFF1D4ED8),
                  Color(0xFF1E40AF),
                ],
              ),
            ),
            child: SafeArea(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.arrow_back, color: Colors.white),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.studentName,
                              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '考勤历史记录',
                              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: Colors.white.withValues(alpha: 0.9),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Consumer<AttendanceProvider>(
                          builder: (context, attendanceProvider, child) {
                            final records = _getFilteredRecords(attendanceProvider.attendanceRecords);
                            return Text(
                              '${records.length} 条记录',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Search Section
          Container(
            padding: const EdgeInsets.all(20),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: TextField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                decoration: InputDecoration(
                  hintText: '搜索考勤记录...',
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF64748B)),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          onPressed: () {
                            _searchController.clear();
                            _onSearchChanged('');
                          },
                          icon: const Icon(Icons.clear, color: Color(0xFF64748B)),
                        )
                      : null,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
            ),
          ),

          // Filter Section
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                _buildFilterChip('all', '全部', Icons.all_inclusive),
                const SizedBox(width: 8),
                _buildFilterChip('today', '今日', Icons.today),
                const SizedBox(width: 8),
                _buildFilterChip('week', '本周', Icons.calendar_view_week),
                const SizedBox(width: 8),
                _buildFilterChip('month', '本月', Icons.calendar_month),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Records List
          Expanded(
            child: Consumer<AttendanceProvider>(
              builder: (context, attendanceProvider, child) {
                if (attendanceProvider.isLoading) {
                  return const Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF3B82F6)),
                    ),
                  );
                }

                final filteredRecords = _getFilteredRecords(attendanceProvider.attendanceRecords);

                if (filteredRecords.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.history,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _searchQuery.isNotEmpty ? '未找到匹配的记录' : '暂无考勤记录',
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: const Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _searchQuery.isNotEmpty 
                              ? '尝试调整搜索条件'
                              : '该学生还没有考勤记录',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: filteredRecords.length,
                  itemBuilder: (context, index) {
                    final record = filteredRecords[index];
                    return _buildAttendanceRecordCard(context, record);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label, IconData icon) {
    final isSelected = _selectedFilter == value;
    return GestureDetector(
      onTap: () => _onFilterChanged(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF3B82F6) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFFE2E8F0),
            width: 1,
          ),
          boxShadow: isSelected ? [
            BoxShadow(
              color: const Color(0xFF3B82F6).withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ] : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? Colors.white : const Color(0xFF64748B),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : const Color(0xFF64748B),
                fontWeight: FontWeight.w500,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttendanceRecordCard(BuildContext context, dynamic record) {
    final type = record.getStringValue('type') ?? '';
    final status = record.getStringValue('status') ?? '';
    final date = record.getStringValue('date') ?? '';
    final checkInTime = record.getStringValue('check_in_time') ?? '';
    final checkOutTime = record.getStringValue('check_out_time') ?? '';
    final notes = record.getStringValue('notes') ?? '';

    final isCheckIn = type == 'check_in';
    final isPresent = status == 'present';
    final isLate = status == 'late';
    final isAbsent = status == 'absent';

    Color statusColor;
    IconData statusIcon;
    String statusText;

    if (isCheckIn) {
      if (isPresent) {
        statusColor = const Color(0xFF10B981);
        statusIcon = Icons.login;
        statusText = '签到';
      } else if (isLate) {
        statusColor = const Color(0xFFF59E0B);
        statusIcon = Icons.schedule;
        statusText = '迟到';
      } else {
        statusColor = const Color(0xFFEF4444);
        statusIcon = Icons.cancel;
        statusText = '缺勤';
      }
    } else {
      statusColor = const Color(0xFF3B82F6);
      statusIcon = Icons.logout;
      statusText = '签退';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: statusColor.withValues(alpha: 0.3),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            // Status Icon
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                statusIcon,
                color: statusColor,
                size: 24,
              ),
            ),

            const SizedBox(width: 16),

            // Record Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        statusText,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _formatDate(date),
                          style: TextStyle(
                            color: statusColor,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '时间: ${isCheckIn ? checkInTime : checkOutTime}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  if (notes.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      '备注: $notes',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Action Button
            IconButton(
              onPressed: () => _showRecordDetails(record),
              icon: const Icon(Icons.info_outline, color: Color(0xFF64748B)),
              tooltip: '查看详情',
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return '${date.month}/${date.day}';
    } catch (e) {
      return dateString;
    }
  }

  void _showRecordDetails(dynamic record) {
    final type = record.getStringValue('type') ?? '';
    final status = record.getStringValue('status') ?? '';
    final date = record.getStringValue('date') ?? '';
    final checkInTime = record.getStringValue('check_in_time') ?? '';
    final checkOutTime = record.getStringValue('check_out_time') ?? '';
    final notes = record.getStringValue('notes') ?? '';

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${type == 'check_in' ? '签到' : '签退'}详情'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetailRow('类型', type == 'check_in' ? '签到' : '签退'),
            _buildDetailRow('状态', status),
            _buildDetailRow('日期', date),
            _buildDetailRow('时间', type == 'check_in' ? checkInTime : checkOutTime),
            if (notes.isNotEmpty) _buildDetailRow('备注', notes),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('关闭'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 60,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                color: Color(0xFF64748B),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: Color(0xFF1E293B),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

