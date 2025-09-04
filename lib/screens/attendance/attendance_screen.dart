import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/attendance_provider.dart';
import '../../widgets/dashboard/stats_card.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  String _selectedFilter = 'today';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AttendanceProvider>(context, listen: false).loadAttendanceRecords();
    });
  }

  void _onFilterChanged(String filter) {
    setState(() {
      _selectedFilter = filter;
    });
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
                  Color(0xFF059669),
                  Color(0xFF10B981),
                  Color(0xFF34D399),
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
                              '考勤管理',
                              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '管理学生考勤记录和统计',
                              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: Colors.white.withOpacity(0.9),
                              ),
          ),
        ],
      ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Consumer<AttendanceProvider>(
      builder: (context, attendanceProvider, child) {
                            return Text(
                              '${attendanceProvider.attendanceRecords.length} 条记录',
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

          // Stats Section
          Container(
            padding: const EdgeInsets.all(20),
            child: Consumer<AttendanceProvider>(
              builder: (context, attendanceProvider, child) {
                return GridView.count(
                  crossAxisCount: 4,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  childAspectRatio: 1.2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  children: [
                    StatsCard(
                      title: '今日签到',
                      value: '${attendanceProvider.attendanceStats['today_check_in'] ?? 0}',
                      icon: Icons.check_circle,
                      color: const Color(0xFF10B981),
                      trend: '+5%',
                      trendUp: true,
                    ),
                    StatsCard(
                      title: '本周签到',
                      value: '${attendanceProvider.attendanceStats['this_week_check_in'] ?? 0}',
                      icon: Icons.calendar_today,
                      color: const Color(0xFF3B82F6),
                      trend: '+12%',
                      trendUp: true,
                    ),
                    StatsCard(
                      title: '本月签到',
                      value: '${attendanceProvider.attendanceStats['this_month_check_in'] ?? 0}',
                      icon: Icons.trending_up,
                      color: const Color(0xFFF59E0B),
                      trend: '+8%',
                      trendUp: true,
                    ),
                    StatsCard(
                      title: '出勤率',
                      value: '${attendanceProvider.attendanceStats['attendance_rate'] ?? 0}%',
                      icon: Icons.analytics,
                      color: const Color(0xFF8B5CF6),
                      trend: '+2%',
                      trendUp: true,
                    ),
                  ],
                );
              },
            ),
          ),

          // Filter Section
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                _buildFilterChip('today', '今日', Icons.today),
                const SizedBox(width: 8),
                _buildFilterChip('week', '本周', Icons.calendar_view_week),
                const SizedBox(width: 8),
                _buildFilterChip('month', '本月', Icons.calendar_month),
                const SizedBox(width: 8),
                _buildFilterChip('all', '全部', Icons.all_inclusive),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Attendance Records
          Expanded(
            child: Consumer<AttendanceProvider>(
              builder: (context, attendanceProvider, child) {
                if (attendanceProvider.isLoading) {
                  return const Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
                    ),
                  );
                }

                if (attendanceProvider.error != null) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.red[300],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          '加载失败',
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: const Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          attendanceProvider.error!,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFF64748B),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => attendanceProvider.loadAttendanceRecords(),
                          child: const Text('重试'),
                        ),
                      ],
                    ),
                  );
                }

        final records = attendanceProvider.attendanceRecords;
        
        if (records.isEmpty) {
                  return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                          Icons.schedule_outlined,
                  size: 64,
                          color: Colors.grey[400],
                ),
                        const SizedBox(height: 16),
                Text(
                  '暂无考勤记录',
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: const Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '学生签到后记录将显示在这里',
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
            itemCount: records.length,
            itemBuilder: (context, index) {
              final record = records[index];
                    return _buildAttendanceCard(context, record);
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          _showCheckInDialog(context);
        },
        backgroundColor: const Color(0xFF10B981),
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text(
          '手动签到',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        ),
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
          color: isSelected ? const Color(0xFF10B981) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF10B981) : const Color(0xFFE2E8F0),
            width: 1,
          ),
          boxShadow: isSelected ? [
            BoxShadow(
              color: const Color(0xFF10B981).withOpacity(0.3),
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

  Widget _buildAttendanceCard(BuildContext context, dynamic record) {
    final studentName = record.getStringValue('student_name') ?? '未知学生';
    final checkInTime = record.getStringValue('check_in_time') ?? '';
    final checkOutTime = record.getStringValue('check_out_time') ?? '';
    final status = record.getStringValue('status') ?? 'present';
    final date = record.getStringValue('date') ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
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
                color: status == 'present' 
                    ? const Color(0xFF10B981).withOpacity(0.1)
                    : const Color(0xFFEF4444).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                status == 'present' ? Icons.check_circle : Icons.cancel,
                color: status == 'present' ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                size: 24,
              ),
            ),

            const SizedBox(width: 16),

            // Attendance Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        studentName,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: status == 'present' 
                              ? const Color(0xFF10B981).withOpacity(0.1)
                              : const Color(0xFFEF4444).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          status == 'present' ? '已签到' : '缺勤',
                          style: TextStyle(
                            color: status == 'present' 
                                ? const Color(0xFF10B981)
                                : const Color(0xFFEF4444),
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '日期: $date',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '签到: $checkInTime',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  if (checkOutTime.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      '签退: $checkOutTime',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Action Button
            IconButton(
              onPressed: () {
                // TODO: Show attendance details
              },
              icon: const Icon(
                Icons.more_vert,
                color: Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCheckInDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('手动签到'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              decoration: InputDecoration(
                labelText: '学生姓名或学号',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16),
            TextField(
              decoration: InputDecoration(
                labelText: '备注（可选）',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('签到成功'),
                  backgroundColor: Color(0xFF10B981),
                ),
              );
            },
            child: const Text('确认签到'),
          ),
        ],
      ),
    );
  }
}