import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/services/pocketbase_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../../teacher/providers/teacher_provider.dart';
import '../../attendance/providers/attendance_provider.dart';
import '../../finance/providers/teacher_salary_provider.dart';
import '../../leave/providers/teacher_leave_provider.dart';
import '../../schedule/providers/schedule_provider.dart';
import '../services/salary_calculation_service.dart';
import '../services/leave_salary_integration_service.dart';

class IntegratedReportScreen extends StatefulWidget {
  const IntegratedReportScreen({super.key});

  @override
  State<IntegratedReportScreen> createState() => _IntegratedReportScreenState();
}

class _IntegratedReportScreenState extends State<IntegratedReportScreen> {
  String? _selectedTeacherId;
  int _selectedYear = DateTime.now().year;
  int _selectedMonth = DateTime.now().month;
  bool _isLoadingReport = false;
  Map<String, dynamic>? _reportData;
  String? _reportError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = context.read<AuthProvider>();
      if (!authProvider.isAdmin && authProvider.user?.id != null) {
        setState(() {
          _selectedTeacherId = authProvider.user!.id;
        });
      }
      _loadReport();
    });
  }

  Future<void> _loadReport() async {
    setState(() {
      _isLoadingReport = true;
      _reportError = null;
      _reportData = null;
    });

    try {
      if (_selectedTeacherId == null) {
        throw Exception('请选择教师以生成报告');
      }

      final salaryCalculationService = SalaryCalculationService();
      final leaveSalaryIntegrationService = LeaveSalaryIntegrationService();

      // 1. 获取薪资计算数据
      final salaryData = await salaryCalculationService.calculateSalaryFromAttendance(
        teacherId: _selectedTeacherId!,
        startDate: DateTime(_selectedYear, _selectedMonth, 1),
        endDate: DateTime(_selectedYear, _selectedMonth + 1, 0),
      );

      // 2. 获取考勤统计数据
      final attendanceStats = await context
          .read<PocketBaseService>()
          .getTeacherAttendanceDetailedStats(
            teacherId: _selectedTeacherId!,
            startDate: DateTime(_selectedYear, _selectedMonth, 1),
            endDate: DateTime(_selectedYear, _selectedMonth + 1, 0),
          );

      // 3. 获取请假余额数据
      final leaveBalance = await leaveSalaryIntegrationService.calculateLeaveSalaryImpact(
          teacherId: _selectedTeacherId!,
          startDate: DateTime(_selectedYear, _selectedMonth, 1),
          endDate: DateTime(_selectedYear, _selectedMonth + 1, 0),
      );

      // 4. 获取排班数据
      final scheduleProvider = context.read<ScheduleProvider>();
      await scheduleProvider.loadSchedules(teacherId: _selectedTeacherId);
      final scheduleStats = {
        'total_schedules': scheduleProvider.schedules.length,
        'active_schedules': scheduleProvider.schedules.where((s) => s.status != 'cancelled').length,
        'schedules_by_date': scheduleProvider.schedulesByDate,
      };

      setState(() {
        _reportData = {
          'salary_data': salaryData,
          'attendance_stats': attendanceStats,
          'leave_balance': leaveBalance,
          'schedule_stats': scheduleStats,
        };
      });
    } catch (e) {
      String errorMessage = e.toString();
      
      // 提供更友好的错误信息
      if (errorMessage.contains('薪资结构')) {
        errorMessage = '未找到薪资结构，请先设置薪资结构';
      } else if (errorMessage.contains('网络') || errorMessage.contains('连接')) {
        errorMessage = '网络连接失败，请检查网络设置';
      } else if (errorMessage.contains('权限') || errorMessage.contains('认证')) {
        errorMessage = '权限不足，请检查登录状态';
      }
      
      setState(() {
        _reportError = errorMessage;
      });
    } finally {
      setState(() {
        _isLoadingReport = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final teacherProvider = context.watch<TeacherProvider>();

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('综合报表'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          _buildFilterSection(authProvider, teacherProvider),
          Expanded(
            child: _isLoadingReport
                ? const LoadingWidget()
                : _reportError != null
                    ? _buildErrorWidget()
                    : _reportData != null
                        ? _buildReportContent(_reportData!)
                        : _buildEmptyWidget(),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterSection(AuthProvider authProvider, TeacherProvider teacherProvider) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 3,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        children: [
          if (authProvider.isAdmin)
            DropdownButtonFormField<String>(
              value: _selectedTeacherId,
              decoration: const InputDecoration(
                labelText: '选择教师',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.person),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              items: teacherProvider.teachers.map((teacher) {
                return DropdownMenuItem<String>(
                  value: teacher.id,
                  child: Text(teacher.getStringValue('name') ?? '未知教师'),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedTeacherId = value;
                });
              },
            ),
          if (authProvider.isAdmin) const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<int>(
                  value: _selectedYear,
                  decoration: const InputDecoration(
                    labelText: '年份',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.calendar_today),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: List.generate(5, (index) => DateTime.now().year - 2 + index)
                      .map((year) => DropdownMenuItem<int>(
                            value: year,
                            child: Text(year.toString()),
                          ))
                      .toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedYear = value!;
                    });
                  },
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: DropdownButtonFormField<int>(
                  value: _selectedMonth,
                  decoration: const InputDecoration(
                    labelText: '月份',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.calendar_month),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: List.generate(12, (index) => index + 1)
                      .map((month) => DropdownMenuItem<int>(
                            value: month,
                            child: Text(month.toString()),
                          ))
                      .toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedMonth = value!;
                    });
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _loadReport,
              icon: const Icon(Icons.refresh),
              label: const Text('生成报告'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorWidget() {
    final isSalaryStructureError = _reportError?.contains('薪资结构') ?? false;
    
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isSalaryStructureError ? Icons.account_balance_wallet : Icons.error_outline,
              size: 64,
              color: isSalaryStructureError ? Colors.orange[400] : Colors.red[400],
            ),
            const SizedBox(height: 16),
            Text(
              isSalaryStructureError ? '需要设置薪资结构' : '加载失败',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey[800],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _reportError!,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            if (isSalaryStructureError) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue[600], size: 20),
                        const SizedBox(width: 8),
                        Text(
                          '解决方案',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue[800],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '要生成综合报表，需要先为教师设置薪资结构。请前往教师薪资管理页面创建薪资结构。',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.blue[700],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pushNamed(context, '/teacher_salary_management');
                      },
                      icon: const Icon(Icons.account_balance_wallet),
                      label: const Text('设置薪资结构'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue[600],
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ] else ...[
              ElevatedButton.icon(
                onPressed: _loadReport,
                icon: const Icon(Icons.refresh),
                label: const Text('重试'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.analytics_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              '请选择教师和月份生成报告',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '选择教师和月份后，点击"生成报告"按钮查看综合数据',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReportContent(Map<String, dynamic> data) {
    final salaryData = data['salary_data'] as Map<String, dynamic>;
    final attendanceStats = data['attendance_stats'] as Map<String, dynamic>;
    final leaveBalance = data['leave_balance'] as Map<String, dynamic>;
    final scheduleStats = data['schedule_stats'] as Map<String, dynamic>;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildOverviewCards(salaryData, attendanceStats, leaveBalance, scheduleStats),
          const SizedBox(height: 24),
          _buildSalarySection(salaryData),
          const SizedBox(height: 24),
          _buildAttendanceSection(attendanceStats),
          const SizedBox(height: 24),
          _buildLeaveSection(leaveBalance),
          const SizedBox(height: 24),
          _buildScheduleSection(scheduleStats),
          const SizedBox(height: 24), // 添加底部间距避免溢出
        ],
      ),
    );
  }

  Widget _buildOverviewCards(Map<String, dynamic> salaryData, Map<String, dynamic> attendanceStats, 
      Map<String, dynamic> leaveBalance, Map<String, dynamic> scheduleStats) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '概览',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppTheme.primaryColor,
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.5,
          children: [
            _buildOverviewCard(
              '净薪资',
              'RM ${salaryData['net_salary']?.toStringAsFixed(2) ?? '0.00'}',
              Icons.account_balance_wallet,
              Colors.green,
            ),
            _buildOverviewCard(
              '出勤率',
              '${attendanceStats['attendance_rate']?.toStringAsFixed(1) ?? '0.0'}%',
              Icons.access_time,
              Colors.blue,
            ),
            _buildOverviewCard(
              '剩余年假',
              '${leaveBalance['annual_leave_balance'] ?? 0} 天',
              Icons.event_available,
              Colors.orange,
            ),
            _buildOverviewCard(
              '排班数量',
              '${scheduleStats['active_schedules'] ?? 0} 个',
              Icons.schedule,
              Colors.purple,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildOverviewCard(String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 24),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                ),
              ],
            ),
            Text(
              value,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSalarySection(Map<String, dynamic> salaryData) {
    return _buildSectionCard(
      '薪资概览',
      Icons.account_balance_wallet,
      Colors.green,
      [
        _buildInfoRow('基本工资', 'RM ${salaryData['base_salary']?.toStringAsFixed(2) ?? '0.00'}'),
        _buildInfoRow('总津贴', 'RM ${salaryData['total_allowances']?.toStringAsFixed(2) ?? '0.00'}'),
        _buildInfoRow('加班费', 'RM ${salaryData['overtime_pay']?.toStringAsFixed(2) ?? '0.00'}'),
        _buildInfoRow('总薪资 (Gross)', 'RM ${salaryData['gross_salary']?.toStringAsFixed(2) ?? '0.00'}',
            isHighlight: true),
        _buildInfoRow('总扣除', 'RM ${salaryData['total_deductions']?.toStringAsFixed(2) ?? '0.00'}',
            isNegative: true),
        _buildInfoRow('净薪资 (Net)', 'RM ${salaryData['net_salary']?.toStringAsFixed(2) ?? '0.00'}',
            isHighlight: true, highlightColor: AppTheme.primaryColor),
      ],
    );
  }

  Widget _buildAttendanceSection(Map<String, dynamic> attendanceStats) {
    return _buildSectionCard(
      '考勤统计',
      Icons.access_time,
      Colors.blue,
      [
        _buildInfoRow('总工作天数', '${attendanceStats['total_days'] ?? 0} 天'),
        _buildInfoRow('完整出勤天数', '${attendanceStats['complete_days'] ?? 0} 天'),
        _buildInfoRow('迟到天数', '${attendanceStats['late_days'] ?? 0} 天', isNegative: true),
        _buildInfoRow('缺勤天数', '${attendanceStats['absent_days'] ?? 0} 天', isNegative: true),
        _buildInfoRow('总工作时长', '${attendanceStats['total_work_hours']?.toStringAsFixed(2) ?? '0.0'} 小时'),
        _buildInfoRow('总加班时长', '${attendanceStats['total_overtime_hours']?.toStringAsFixed(2) ?? '0.0'} 小时'),
        _buildInfoRow('出勤率', '${attendanceStats['attendance_rate']?.toStringAsFixed(2) ?? '0.0'} %'),
        _buildInfoRow('准时率', '${attendanceStats['punctuality_rate']?.toStringAsFixed(2) ?? '0.0'} %'),
        _buildInfoRow('效率分数', '${attendanceStats['efficiency_score']?.toStringAsFixed(2) ?? '0.0'} / 100',
            isHighlight: true),
      ],
    );
  }

  Widget _buildLeaveSection(Map<String, dynamic> leaveBalance) {
    return _buildSectionCard(
      '请假概览',
      Icons.event_available,
      Colors.orange,
      [
        _buildInfoRow('年假总额', '${leaveBalance['annual_leave_total'] ?? 0} 天'),
        _buildInfoRow('已用年假', '${leaveBalance['annual_leave_taken'] ?? 0} 天', isNegative: true),
        _buildInfoRow('剩余年假', '${leaveBalance['annual_leave_balance'] ?? 0} 天',
            isHighlight: true, highlightColor: AppTheme.primaryColor),
        _buildInfoRow('病假总额', '${leaveBalance['sick_leave_total'] ?? 0} 天'),
        _buildInfoRow('已用病假', '${leaveBalance['sick_leave_taken'] ?? 0} 天', isNegative: true),
        _buildInfoRow('剩余病假', '${leaveBalance['sick_leave_balance'] ?? 0} 天',
            isHighlight: true, highlightColor: AppTheme.primaryColor),
        _buildInfoRow('已用无薪假', '${leaveBalance['unpaid_leave_taken'] ?? 0} 天', isNegative: true),
      ],
    );
  }

  Widget _buildScheduleSection(Map<String, dynamic> scheduleStats) {
    return _buildSectionCard(
      '排班统计',
      Icons.schedule,
      Colors.purple,
      [
        _buildInfoRow('总排班数量', '${scheduleStats['total_schedules'] ?? 0} 个'),
        _buildInfoRow('活跃排班', '${scheduleStats['active_schedules'] ?? 0} 个'),
        _buildInfoRow('按日期分布', ''),
        ..._buildSchedulesByDateRows(scheduleStats['schedules_by_date']),
      ],
    );
  }

  Widget _buildSectionCard(String title, IconData icon, Color color, List<Widget> children) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 24),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value,
      {bool isHighlight = false, Color? highlightColor, bool isNegative = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 15,
              color: isHighlight ? (highlightColor ?? AppTheme.primaryColor) : AppTheme.textSecondary,
              fontWeight: isHighlight ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 15,
              color: isNegative ? AppTheme.errorColor : (isHighlight ? (highlightColor ?? AppTheme.primaryColor) : AppTheme.textPrimary),
              fontWeight: isHighlight ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildSchedulesByDateRows(Map<String, dynamic> schedulesByDate) {
    if (schedulesByDate.isEmpty) {
      return [
        _buildInfoRow('无排班数据', ''),
      ];
    }
    return schedulesByDate.entries.map((entry) {
      return _buildInfoRow(entry.key, '${entry.value} 个班次');
    }).toList();
  }
}