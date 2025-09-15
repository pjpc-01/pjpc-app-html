import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/attendance_provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/reports/attendance_summary_card.dart';
import '../../widgets/reports/attendance_chart_widget.dart';
import '../../widgets/reports/attendance_exception_item.dart';
import '../../widgets/common/app_logo.dart';
import '../../services/attendance_export_service.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  String _selectedPeriod = 'week';
  bool _isLoading = false;

  final List<Map<String, String>> _periods = [
    {'value': 'today', 'label': '今天'},
    {'value': 'week', 'label': '本周'},
    {'value': 'month', 'label': '本月'},
    {'value': 'quarter', 'label': '本季度'},
    {'value': 'year', 'label': '本年'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    // 延迟加载数据以避免在构建过程中调用setState
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadReports();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadReports() async {
    setState(() => _isLoading = true);
    try {
      final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
      await attendanceProvider.loadAttendanceReports(period: _selectedPeriod);
    } catch (e) {
      _showErrorSnackBar('加载考勤报告失败: $e');
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
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('考勤报告'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              setState(() => _selectedPeriod = value);
              _loadReports();
            },
            itemBuilder: (context) => _periods.map((period) {
              return PopupMenuItem(
                value: period['value'],
                child: Text(period['label']!),
              );
            }).toList(),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(_getPeriodText(_selectedPeriod)),
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_drop_down),
                ],
              ),
            ),
          ),
          IconButton(
            onPressed: _exportReport,
            icon: const Icon(Icons.download),
            tooltip: '导出报告',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: '概览'),
            Tab(text: '异常'),
            Tab(text: '趋势'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(),
                _buildExceptionsTab(),
                _buildTrendsTab(),
              ],
            ),
    );
  }

  Widget _buildOverviewTab() {
    return Consumer<AttendanceProvider>(
      builder: (context, attendanceProvider, child) {
        final reports = attendanceProvider.attendanceReports;
        if (reports.isEmpty) {
          return _buildEmptyState();
        }

        // Calculate summary statistics from the reports
        final studentStats = _calculateStudentStats(reports);
        final teacherStats = _calculateTeacherStats(reports);
        final summary = _calculateSummaryStats(reports);

        return SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSummaryCards(studentStats, teacherStats, summary),
              const SizedBox(height: AppSpacing.xl),
              _buildAttendanceChart(studentStats, teacherStats),
              const SizedBox(height: AppSpacing.xl),
              _buildTopPerformers(),
            ],
          ),
        );
      },
    );
  }

  Map<String, dynamic> _calculateStudentStats(List<Map<String, dynamic>> reports) {
    int totalCheckIns = 0;
    int totalCheckOuts = 0;
    int totalLate = 0;
    int totalAbsent = 0;

    for (final report in reports) {
      totalCheckIns += (report['student_check_ins'] as num?)?.toInt() ?? 0;
      totalCheckOuts += (report['student_check_outs'] as num?)?.toInt() ?? 0;
      totalLate += (report['late_count'] as num?)?.toInt() ?? 0;
      totalAbsent += (report['absent_count'] as num?)?.toInt() ?? 0;
    }

    final attendanceRate = totalCheckIns > 0 ? (totalCheckIns / (totalCheckIns + totalAbsent)) * 100 : 0.0;

    return {
      'total_check_ins': totalCheckIns,
      'total_check_outs': totalCheckOuts,
      'late_count': totalLate,
      'absent_count': totalAbsent,
      'attendance_rate': attendanceRate,
    };
  }

  Map<String, dynamic> _calculateTeacherStats(List<Map<String, dynamic>> reports) {
    int totalCheckIns = 0;
    int totalCheckOuts = 0;

    for (final report in reports) {
      totalCheckIns += (report['teacher_check_ins'] as num?)?.toInt() ?? 0;
      totalCheckOuts += (report['teacher_check_outs'] as num?)?.toInt() ?? 0;
    }

    return {
      'total_check_ins': totalCheckIns,
      'total_check_outs': totalCheckOuts,
      'attendance_rate': totalCheckIns > 0 ? 100.0 : 0.0,
    };
  }

  Map<String, dynamic> _calculateSummaryStats(List<Map<String, dynamic>> reports) {
    int totalDays = reports.length;
    int totalStudentCheckIns = 0;
    int totalTeacherCheckIns = 0;
    int totalLate = 0;
    int totalAbsent = 0;

    for (final report in reports) {
      totalStudentCheckIns += (report['student_check_ins'] as num?)?.toInt() ?? 0;
      totalTeacherCheckIns += (report['teacher_check_ins'] as num?)?.toInt() ?? 0;
      totalLate += (report['late_count'] as num?)?.toInt() ?? 0;
      totalAbsent += (report['absent_count'] as num?)?.toInt() ?? 0;
    }

    return {
      'total_days': totalDays,
      'total_student_check_ins': totalStudentCheckIns,
      'total_teacher_check_ins': totalTeacherCheckIns,
      'total_late': totalLate,
      'total_absent': totalAbsent,
      'average_daily_attendance': totalDays > 0 ? totalStudentCheckIns / totalDays : 0.0,
    };
  }

  Widget _buildSummaryCards(Map<String, dynamic> studentStats, Map<String, dynamic> teacherStats, Map<String, dynamic> summary) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '数据概览',
          style: AppTextStyles.headline4,
        ),
        const SizedBox(height: AppSpacing.md),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 1.2,
          crossAxisSpacing: AppSpacing.md,
          mainAxisSpacing: AppSpacing.md,
          children: [
            AttendanceSummaryCard(
              title: '学生出勤率',
              value: '${studentStats['attendance_rate']?.toStringAsFixed(1) ?? '0.0'}%',
              icon: Icons.school,
              color: AppTheme.primaryColor,
              change: '+2.1%',
              isPositiveChange: true,
            ),
            AttendanceSummaryCard(
              title: '教师出勤率',
              value: '${teacherStats['attendance_rate']?.toStringAsFixed(1) ?? '0.0'}%',
              icon: Icons.person,
              color: AppTheme.successColor,
              change: '+1.5%',
              isPositiveChange: true,
            ),
            AttendanceSummaryCard(
              title: '迟到人数',
              value: '${(studentStats['late_count'] ?? 0) + (teacherStats['late_count'] ?? 0)}人',
              icon: Icons.schedule,
              color: AppTheme.warningColor,
              change: '-2人',
              isPositiveChange: true,
            ),
            AttendanceSummaryCard(
              title: '缺勤人数',
              value: '${(studentStats['absent_count'] ?? 0) + (teacherStats['absent_count'] ?? 0)}人',
              icon: Icons.person_off,
              color: AppTheme.errorColor,
              change: '-1人',
              isPositiveChange: true,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAttendanceChart(Map<String, dynamic> studentStats, Map<String, dynamic> teacherStats) {
    final chartData = [
      {'label': '签到', 'value': (studentStats['total_check_ins'] ?? 0) + (teacherStats['total_check_ins'] ?? 0)},
      {'label': '签退', 'value': (studentStats['total_check_outs'] ?? 0) + (teacherStats['total_check_outs'] ?? 0)},
      {'label': '迟到', 'value': (studentStats['late_count'] ?? 0) + (teacherStats['late_count'] ?? 0)},
      {'label': '缺勤', 'value': (studentStats['absent_count'] ?? 0) + (teacherStats['absent_count'] ?? 0)},
    ];

    return AttendanceChartWidget(
      title: '考勤统计',
      subtitle: _getPeriodText(_selectedPeriod),
      data: chartData,
    );
  }

  Widget _buildTopPerformers() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppTheme.dividerColor),
        boxShadow: AppTheme.cardShadow,
      ),
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
          children: [
          Text(
            '考勤概况',
            style: AppTextStyles.headline5,
          ),
          const SizedBox(height: AppSpacing.lg),
          Consumer<AttendanceProvider>(
            builder: (context, attendanceProvider, child) {
              final reports = attendanceProvider.attendanceReports;
              if (reports.isEmpty) {
                return const Center(
                  child: Text('暂无数据'),
                );
              }

              // Calculate statistics from reports
              final summary = _calculateSummaryStats(reports);
              final studentStats = _calculateStudentStats(reports);
              final teacherStats = _calculateTeacherStats(reports);

              final overallAttendanceRate = summary['total_student_check_ins'] > 0 
                  ? (summary['total_student_check_ins'] / (summary['total_student_check_ins'] + summary['total_absent'])) * 100 
                  : 0.0;

              return Column(
                children: [
                  _buildPerformerItem('整体出勤率', '${overallAttendanceRate.toStringAsFixed(1)}%', 1),
                  _buildPerformerItem('学生出勤率', '${studentStats['attendance_rate']?.toStringAsFixed(1) ?? '0.0'}%', 2),
                  _buildPerformerItem('教师出勤率', '${teacherStats['attendance_rate']?.toStringAsFixed(1) ?? '0.0'}%', 3),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildPerformerItem(String name, String rate, int rank) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        children: [
            Container(
            width: 32,
            height: 32,
              decoration: BoxDecoration(
              color: rank == 1 
                  ? AppTheme.warningColor.withOpacity(0.1)
                  : AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Center(
              child: Text(
                rank.toString(),
                style: AppTextStyles.bodyMedium.copyWith(
                  color: rank == 1 ? AppTheme.warningColor : AppTheme.primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              name,
              style: AppTextStyles.bodyLarge.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
            Text(
            rate,
            style: AppTextStyles.bodyLarge.copyWith(
              color: AppTheme.successColor,
                fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExceptionsTab() {
    return Consumer<AttendanceProvider>(
      builder: (context, attendanceProvider, child) {
        final reports = attendanceProvider.attendanceReports;
        if (reports.isEmpty) {
          return _buildEmptyState();
        }

        // Calculate period from reports
        final startDate = DateTime.now().subtract(const Duration(days: 7));
        final endDate = DateTime.now();
        
        final exceptions = attendanceProvider.getAttendanceExceptions(startDate, endDate);

        return SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '考勤异常',
                style: AppTextStyles.headline4,
              ),
              const SizedBox(height: AppSpacing.md),
              if (exceptions.isEmpty)
                Container(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  decoration: BoxDecoration(
                    color: AppTheme.cardColor,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    border: Border.all(color: AppTheme.dividerColor),
                  ),
                  child: const Center(
                    child: Column(
                      children: [
                        Icon(
                          Icons.check_circle,
                          size: 64,
                          color: AppTheme.successColor,
                        ),
                        SizedBox(height: 16),
                        Text(
                          '无异常记录',
                          style: AppTextStyles.headline5,
                        ),
                        SizedBox(height: 8),
            Text(
                          '考勤情况良好',
                          style: AppTextStyles.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                )
              else
                ...exceptions.map((exception) {
                  final isTeacher = exception.getStringValue('teacher_id') != null;
                  final name = isTeacher 
                      ? exception.getStringValue('teacher_name') ?? '未知教师'
                      : exception.getStringValue('student_name') ?? '未知学生';
                  final type = isTeacher ? '教师' : '学生';
                  
                  return AttendanceExceptionItem(
                    name: name,
                    type: type,
                    date: exception.getStringValue('date') ?? '',
                    time: exception.getStringValue('check_in_time') ?? exception.getStringValue('check_out_time') ?? '',
                    status: exception.getStringValue('status') ?? '',
                    reason: exception.getStringValue('notes'),
                    onTap: () {
                      // TODO: 实现异常详情页面
                    },
                  );
                }).toList(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTrendsTab() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.trending_up,
            size: 64,
            color: AppTheme.textTertiary,
          ),
          SizedBox(height: 16),
          Text(
            '趋势分析',
            style: AppTextStyles.headline4,
          ),
          SizedBox(height: 8),
          Text(
            '即将推出',
            style: AppTextStyles.bodyMedium,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
              child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
                children: [
          const AppLogo(
            size: 120,
            showText: true,
            textColor: AppTheme.primaryColor,
            textSize: 18,
          ),
          const SizedBox(height: 30),
                  Text(
            '暂无考勤数据',
            style: AppTextStyles.headline4.copyWith(
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
            '请先添加考勤记录',
            style: AppTextStyles.bodyLarge?.copyWith(
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: _loadReports,
            icon: const Icon(Icons.refresh),
            label: const Text('刷新数据'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
              ),
            ),
          ],
      ),
    );
  }

  String _getPeriodText(String period) {
    switch (period) {
      case 'today':
        return '今天';
      case 'week':
        return '本周';
      case 'month':
        return '本月';
      case 'quarter':
        return '本季度';
      case 'year':
        return '本年';
      default:
        return '本周';
    }
  }

  void _exportReport() {
    final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
    final exportService = AttendanceExportService();
    exportService.showExportDialog(context, attendanceProvider);
  }
}
