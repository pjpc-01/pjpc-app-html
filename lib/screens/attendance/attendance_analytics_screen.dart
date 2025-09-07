import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/attendance_provider.dart';
import '../../widgets/common/statistics_card.dart';

class AttendanceAnalyticsScreen extends StatefulWidget {
  const AttendanceAnalyticsScreen({Key? key}) : super(key: key);

  @override
  State<AttendanceAnalyticsScreen> createState() => _AttendanceAnalyticsScreenState();
}

class _AttendanceAnalyticsScreenState extends State<AttendanceAnalyticsScreen> {
  String _selectedPeriod = 'today';
  String _selectedGrade = 'all';
  bool _isLoading = false;

  final List<Map<String, String>> _periods = [
    {'value': 'today', 'label': '今天'},
    {'value': 'week', 'label': '本周'},
    {'value': 'month', 'label': '本月'},
    {'value': 'year', 'label': '本年'},
  ];

  final List<Map<String, String>> _grades = [
    {'value': 'all', 'label': '全部年级'},
    {'value': 'primary', 'label': '小学'},
    {'value': 'secondary', 'label': '中学'},
  ];

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    setState(() => _isLoading = true);
    try {
      final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
      // TODO: Implement loadAttendanceAnalytics method
      // await attendanceProvider.loadAttendanceAnalytics(_selectedPeriod, _selectedGrade);
    } catch (e) {
      _showErrorSnackBar('加载考勤数据失败: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('考勤分析'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadAnalytics,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Section
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Period Filter
                Row(
                  children: [
                    const Text(
                      '时间范围:',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF000000),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: _periods.map((period) {
                            final isSelected = _selectedPeriod == period['value'];
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: FilterChip(
                                label: Text(period['label']!),
                                selected: isSelected,
                                onSelected: (selected) {
                                  setState(() {
                                    _selectedPeriod = period['value']!;
                                  });
                                  _loadAnalytics();
                                },
                                selectedColor: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                                checkmarkColor: Theme.of(context).colorScheme.primary,
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Grade Filter
                Row(
                  children: [
                    const Text(
                      '年级范围:',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF000000),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: _grades.map((grade) {
                            final isSelected = _selectedGrade == grade['value'];
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: FilterChip(
                                label: Text(grade['label']!),
                                selected: isSelected,
                                onSelected: (selected) {
                                  setState(() {
                                    _selectedGrade = grade['value']!;
                                  });
                                  _loadAnalytics();
                                },
                                selectedColor: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                                checkmarkColor: Theme.of(context).colorScheme.primary,
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Analytics Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : Consumer<AttendanceProvider>(
                    builder: (context, attendanceProvider, child) {
                      final analytics = <String, dynamic>{}; // TODO: Implement attendanceAnalytics getter
                      
                      return SingleChildScrollView(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Overview Stats
                            _buildOverviewSection(analytics),
                            const SizedBox(height: 24),
                            
                            // Attendance Rate Chart
                            _buildAttendanceRateSection(analytics),
                            const SizedBox(height: 24),
                            
                            // Grade-wise Analysis
                            _buildGradeAnalysisSection(analytics),
                            const SizedBox(height: 24),
                            
                            // Recent Attendance
                            _buildRecentAttendanceSection(analytics),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewSection(Map<String, dynamic> analytics) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '考勤概览',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF000000),
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.3,
          children: [
            StatisticsCard(
              title: '总出勤',
              value: '${analytics['totalPresent'] ?? 0}',
              icon: Icons.check_circle,
              color: Colors.green,
            ),
            StatisticsCard(
              title: '迟到',
              value: '${analytics['totalLate'] ?? 0}',
              icon: Icons.schedule,
              color: Colors.orange,
            ),
            StatisticsCard(
              title: '缺勤',
              value: '${analytics['totalAbsent'] ?? 0}',
              icon: Icons.cancel,
              color: Colors.red,
            ),
            StatisticsCard(
              title: '出勤率',
              value: '${analytics['attendanceRate']?.toStringAsFixed(1) ?? '0.0'}%',
              icon: Icons.trending_up,
              color: Colors.blue,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAttendanceRateSection(Map<String, dynamic> analytics) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '出勤率趋势',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF000000),
              ),
            ),
            const SizedBox(height: 16),
            Container(
              height: 200,
              child: _buildSimpleChart(analytics['attendanceTrend'] ?? []),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGradeAnalysisSection(Map<String, dynamic> analytics) {
    final gradeData = analytics['gradeAnalysis'] as List<dynamic>? ?? [];
    
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '年级分析',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF000000),
              ),
            ),
            const SizedBox(height: 16),
            if (gradeData.isEmpty)
              const Center(
                child: Text(
                  '暂无年级数据',
                  style: TextStyle(color: Colors.grey),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: gradeData.length,
                itemBuilder: (context, index) {
                  final grade = gradeData[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: Text(
                            grade['grade'] ?? '未知年级',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF000000),
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 3,
                          child: LinearProgressIndicator(
                            value: (grade['attendanceRate'] ?? 0) / 100,
                            backgroundColor: Colors.grey[300],
                            valueColor: AlwaysStoppedAnimation<Color>(
                              _getAttendanceRateColor(grade['attendanceRate'] ?? 0),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          '${grade['attendanceRate']?.toStringAsFixed(1) ?? '0.0'}%',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF374151),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentAttendanceSection(Map<String, dynamic> analytics) {
    final recentAttendance = analytics['recentAttendance'] as List<dynamic>? ?? [];
    
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '最近考勤',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF000000),
              ),
            ),
            const SizedBox(height: 16),
            if (recentAttendance.isEmpty)
              const Center(
                child: Text(
                  '暂无最近考勤记录',
                  style: TextStyle(color: Colors.grey),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: recentAttendance.length,
                itemBuilder: (context, index) {
                  final record = recentAttendance[index];
                  
                  // 处理RecordModel和Map两种类型
                  String getValue(String key) {
                    if (record is Map<String, dynamic>) {
                      return record[key]?.toString() ?? '';
                    } else {
                      return record.getStringValue(key) ?? '';
                    }
                  }
                  
                  final status = getValue('status');
                  final studentName = getValue('studentName');
                  final grade = getValue('grade');
                  final time = getValue('time');
                  
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor: _getStatusColor(status).withOpacity(0.1),
                      child: Icon(
                        _getStatusIcon(status),
                        color: _getStatusColor(status),
                      ),
                    ),
                    title: Text(
                      studentName.isEmpty ? '未知学生' : studentName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF000000),
                      ),
                    ),
                    subtitle: Text(
                      '${grade.isEmpty ? '' : grade} - ${time.isEmpty ? '' : time}',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getStatusColor(status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        status.isEmpty ? '未知' : status,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: _getStatusColor(status),
                        ),
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSimpleChart(List<dynamic> data) {
    if (data.isEmpty) {
      return const Center(
        child: Text(
          '暂无数据',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return CustomPaint(
      painter: SimpleLineChartPainter(data),
      size: const Size(double.infinity, 200),
    );
  }

  Color _getAttendanceRateColor(double rate) {
    if (rate >= 90) return Colors.green;
    if (rate >= 80) return Colors.orange;
    return Colors.red;
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'present':
        return Colors.green;
      case 'late':
        return Colors.orange;
      case 'absent':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'present':
        return Icons.check_circle;
      case 'late':
        return Icons.schedule;
      case 'absent':
        return Icons.cancel;
      default:
        return Icons.help;
    }
  }
}

class SimpleLineChartPainter extends CustomPainter {
  final List<dynamic> data;

  SimpleLineChartPainter(this.data);

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;

    final paint = Paint()
      ..color = Colors.blue
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final path = Path();
    final maxValue = data.map((e) => e['value'] as double).reduce((a, b) => a > b ? a : b);
    final minValue = data.map((e) => e['value'] as double).reduce((a, b) => a < b ? a : b);
    final range = maxValue - minValue;

    for (int i = 0; i < data.length; i++) {
      final x = (i / (data.length - 1)) * size.width;
      final y = size.height - ((data[i]['value'] - minValue) / range) * size.height;
      
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    canvas.drawPath(path, paint);

    // Draw points
    final pointPaint = Paint()
      ..color = Colors.blue
      ..style = PaintingStyle.fill;

    for (int i = 0; i < data.length; i++) {
      final x = (i / (data.length - 1)) * size.width;
      final y = size.height - ((data[i]['value'] - minValue) / range) * size.height;
      canvas.drawCircle(Offset(x, y), 4, pointPaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
