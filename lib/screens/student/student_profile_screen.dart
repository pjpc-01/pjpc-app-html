import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/attendance_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/statistics_card.dart';

class StudentProfileScreen extends StatefulWidget {
  final String studentId;
  
  const StudentProfileScreen({
    super.key,
    required this.studentId,
  });

  @override
  State<StudentProfileScreen> createState() => _StudentProfileScreenState();
}

class _StudentProfileScreenState extends State<StudentProfileScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadStudentData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadStudentData() async {
    setState(() {
      _isLoading = true;
    });
    
    // 加载学生考勤数据
    final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
    await attendanceProvider.loadAttendanceRecords();
    
    setState(() {
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: Consumer<StudentProvider>(
        builder: (context, studentProvider, child) {
          final student = studentProvider.getStudentById(widget.studentId);
          
          if (_isLoading) {
            return const Center(
              child: CircularProgressIndicator(
                color: AppTheme.primaryColor,
              ),
            );
          }
          
          if (student == null) {
            return _buildErrorState();
          }
          
          return NestedScrollView(
            headerSliverBuilder: (context, innerBoxIsScrolled) {
              return [
                _buildSliverAppBar(student),
                _buildTabBar(),
              ];
            },
            body: TabBarView(
              controller: _tabController,
              children: [
                _buildBasicInfoTab(student),
                _buildAcademicTab(student),
                _buildAttendanceTab(student),
                _buildParentInfoTab(student),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSliverAppBar(dynamic student) {
    final name = student.getStringValue('student_name') ?? '未知学生';
    final studentId = student.getStringValue('student_id') ?? '';
    final standard = student.getStringValue('standard') ?? '未知班级';
    final center = student.getStringValue('center') ?? '未知中心';
    
    return SliverAppBar(
      expandedHeight: 200.0,
      floating: false,
      pinned: true,
      backgroundColor: AppTheme.primaryColor,
      flexibleSpace: FlexibleSpaceBar(
        title: Text(
          name,
          style: AppTextStyles.headline6?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppTheme.primaryColor,
                AppTheme.accentColor,
              ],
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundColor: Colors.white.withOpacity(0.2),
                        child: Text(
                          name.isNotEmpty ? name[0].toUpperCase() : '?',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '学号: $studentId',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$standard · $center',
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabBar() {
    return SliverToBoxAdapter(
      child: Container(
        color: AppTheme.cardColor,
        child: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primaryColor,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: '基本信息', icon: Icon(Icons.person, size: 16)),
            Tab(text: '学业信息', icon: Icon(Icons.school, size: 16)),
            Tab(text: '考勤记录', icon: Icon(Icons.access_time, size: 16)),
            Tab(text: '家长信息', icon: Icon(Icons.family_restroom, size: 16)),
          ],
        ),
      ),
    );
  }

  Widget _buildBasicInfoTab(dynamic student) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInfoCard(
            '个人信息',
            [
              _buildInfoRow('姓名', student.getStringValue('student_name') ?? '未知'),
              _buildInfoRow('学号', student.getStringValue('student_id') ?? '未知'),
              _buildInfoRow('性别', student.getStringValue('gender') ?? '未知'),
              _buildInfoRow('出生日期', student.getStringValue('dob') ?? '未知'),
              _buildInfoRow('年龄', _calculateAge(student.getStringValue('dob'))),
              _buildInfoRow('身份证号', student.getStringValue('nric') ?? '未知'),
              _buildInfoRow('学校', student.getStringValue('school') ?? '未知'),
              _buildInfoRow('等级', student.getStringValue('level') ?? '未知'),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          _buildInfoCard(
            '健康信息',
            [
              _buildInfoRow('医疗备注', student.getStringValue('medicalNotes') ?? '无'),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          _buildInfoCard(
            '接送信息',
            [
              _buildInfoRow('接送方式', student.getStringValue('pickupMethod') ?? '未知'),
              _buildInfoRow('授权接送人1', student.getStringValue('authorizedPickup1Name') ?? '未知'),
              _buildInfoRow('授权接送人1电话', student.getStringValue('authorizedPickup1Phone') ?? '未知'),
              _buildInfoRow('授权接送人2', student.getStringValue('authorizedPickup2Name') ?? '未知'),
              _buildInfoRow('授权接送人2电话', student.getStringValue('authorizedPickup2Phone') ?? '未知'),
              _buildInfoRow('授权接送人3', student.getStringValue('authorizedPickup3Name') ?? '未知'),
              _buildInfoRow('授权接送人3电话', student.getStringValue('authorizedPickup3Phone') ?? '未知'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAcademicTab(dynamic student) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInfoCard(
            '班级信息',
            [
              _buildInfoRow('班级', student.getStringValue('standard') ?? '未知'),
              _buildInfoRow('中心', student.getStringValue('center') ?? '未知'),
              _buildInfoRow('入学日期', student.getStringValue('enrollmentDate') ?? '未知'),
              _buildInfoRow('学籍状态', student.getStringValue('status') ?? '未知'),
              _buildInfoRow('等级', student.getStringValue('level') ?? '未知'),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          _buildInfoCard(
            '学业统计',
            [
              _buildInfoRow('总出勤率', '95.5%'),
              _buildInfoRow('平均成绩', '85.2分'),
              _buildInfoRow('作业完成率', '98.3%'),
              _buildInfoRow('参与活动', '12次'),
              _buildInfoRow('获得奖项', '3个'),
              _buildInfoRow('学习积分', '1,250分'),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          _buildInfoCard(
            '科目成绩',
            [
              _buildSubjectGradeRow('数学', '92', 'A+'),
              _buildSubjectGradeRow('语文', '88', 'A'),
              _buildSubjectGradeRow('英语', '85', 'A-'),
              _buildSubjectGradeRow('物理', '90', 'A+'),
              _buildSubjectGradeRow('化学', '87', 'A'),
              _buildSubjectGradeRow('生物', '83', 'B+'),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          _buildInfoCard(
            '学习记录',
            [
              _buildInfoRow('最近考试', '2024-01-15 数学测试'),
              _buildInfoRow('最近作业', '2024-01-14 语文作文'),
              _buildInfoRow('学习计划', '已完成本周计划'),
              _buildInfoRow('学习目标', '提高英语成绩'),
              _buildInfoRow('学习习惯', '良好'),
              _buildInfoRow('学习态度', '积极'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceTab(dynamic student) {
    return Consumer<AttendanceProvider>(
      builder: (context, attendanceProvider, child) {
        // 获取当前学生的考勤记录
        final studentAttendance = attendanceProvider.attendanceRecords
            .where((record) => record.getStringValue('student_id') == widget.studentId)
            .toList();
        
        return SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildAttendanceStats(studentAttendance),
              const SizedBox(height: AppSpacing.lg),
              _buildRecentAttendance(studentAttendance),
              const SizedBox(height: AppSpacing.lg),
              _buildAttendanceDetails(studentAttendance),
            ],
          ),
        );
      },
    );
  }

  Widget _buildParentInfoTab(dynamic student) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInfoCard(
            '父母联系方式',
            [
              _buildInfoRow('家长姓名', student.getStringValue('parents_name') ?? '未知'),
              _buildInfoRow('家长手机', student.getStringValue('parents_phone') ?? '未知'),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          _buildInfoCard(
            '紧急联系人',
            [
              _buildInfoRow('姓名', student.getStringValue('emergencyContactName') ?? '未知'),
              _buildInfoRow('手机号', student.getStringValue('emergencyContactPhone') ?? '未知'),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          _buildInfoCard(
            '家庭信息',
            [
              _buildInfoRow('家庭住址', student.getStringValue('home_address') ?? '未知'),
              _buildInfoRow('备注', student.getStringValue('notes') ?? '无'),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          _buildInfoCard(
            '家长参与',
            [
              _buildInfoRow('家长会参与', '积极'),
              _buildInfoRow('志愿者活动', '3次'),
              _buildInfoRow('家校沟通', '良好'),
              _buildInfoRow('教育理念', '注重全面发展'),
              _buildInfoRow('关注重点', '学习成绩'),
              _buildInfoRow('配合度', '高'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(String title, List<Widget> children) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: AppTextStyles.headline6?.copyWith(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: AppTextStyles.bodyMedium?.copyWith(
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: AppTextStyles.bodyMedium?.copyWith(
                color: AppTheme.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceStats(List studentAttendance) {
    // 计算统计数据
    final presentCount = studentAttendance.where((record) => 
        record.getStringValue('status') == 'present').length;
    final absentCount = studentAttendance.where((record) => 
        record.getStringValue('status') == 'absent').length;
    final sickCount = studentAttendance.where((record) => 
        record.getStringValue('status') == 'sick').length;
    final leaveCount = studentAttendance.where((record) => 
        record.getStringValue('status') == 'leave').length;
    
    final totalRecords = studentAttendance.length;
    final attendanceRate = totalRecords > 0 ? (presentCount / totalRecords * 100).toStringAsFixed(1) : '0.0';
    
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '考勤统计',
              style: AppTextStyles.headline6?.copyWith(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: StatisticsCard(
                    title: '出勤',
                    value: presentCount.toString(),
                    subtitle: '次',
                    icon: Icons.check_circle,
                    color: AppTheme.successColor,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: StatisticsCard(
                    title: '缺勤',
                    value: absentCount.toString(),
                    subtitle: '次',
                    icon: Icons.cancel,
                    color: AppTheme.errorColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(
                  child: StatisticsCard(
                    title: '病假',
                    value: sickCount.toString(),
                    subtitle: '次',
                    icon: Icons.sick,
                    color: AppTheme.warningColor,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: StatisticsCard(
                    title: '出勤率',
                    value: attendanceRate,
                    subtitle: '%',
                    icon: Icons.trending_up,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentAttendance(List studentAttendance) {
    // 按日期排序，显示最近5条记录
    final recentRecords = studentAttendance.take(5).toList();
    
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '最近考勤记录',
              style: AppTextStyles.headline6?.copyWith(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            if (recentRecords.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Text(
                    '暂无考勤记录',
                    style: AppTextStyles.bodyMedium?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
              )
            else
              ...recentRecords.map((record) => _buildAttendanceItemFromRecord(record)),
          ],
        ),
      ),
    );
  }

  Widget _buildAttendanceItemFromRecord(dynamic record) {
    final date = record.getStringValue('date') ?? '未知日期';
    final checkIn = record.getStringValue('check_in') ?? '--';
    final checkOut = record.getStringValue('check_out') ?? '--';
    final status = record.getStringValue('status') ?? 'unknown';
    final notes = record.getStringValue('notes') ?? '';
    
    return _buildAttendanceItem(date, checkIn, checkOut, status, notes);
  }

  Widget _buildAttendanceItem(String date, String checkIn, String checkOut, String status, String notes) {
    Color statusColor = _getStatusColor(status);
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppTheme.cardColor,
          borderRadius: BorderRadius.circular(AppRadius.sm),
          border: Border.all(color: AppTheme.dividerColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    date,
                    style: AppTextStyles.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    _getStatusText(status),
                    style: AppTextStyles.bodySmall?.copyWith(
                      color: statusColor,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Expanded(
                  child: Text(
                    '签到: $checkIn',
                    style: AppTextStyles.bodySmall?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
                Expanded(
                  child: Text(
                    '签退: $checkOut',
                    style: AppTextStyles.bodySmall?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
            if (notes.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                '备注: $notes',
                style: AppTextStyles.bodySmall?.copyWith(
                  color: AppTheme.textSecondary,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _calculateAge(String? birthDate) {
    if (birthDate == null || birthDate.isEmpty) return '未知';
    
    try {
      final birth = DateTime.parse(birthDate);
      final now = DateTime.now();
      int age = now.year - birth.year;
      if (now.month < birth.month || (now.month == birth.month && now.day < birth.day)) {
        age--;
      }
      return '$age岁';
    } catch (e) {
      return '未知';
    }
  }

  Widget _buildSubjectGradeRow(String subject, String score, String grade) {
    Color gradeColor = _getGradeColor(grade);
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        children: [
          Expanded(
            child: Text(
              subject,
              style: AppTextStyles.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: gradeColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              score,
              style: AppTextStyles.bodyMedium?.copyWith(
                color: gradeColor,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: gradeColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              grade,
              style: AppTextStyles.bodySmall?.copyWith(
                color: gradeColor,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getGradeColor(String grade) {
    switch (grade) {
      case 'A+':
        return AppTheme.successColor;
      case 'A':
        return AppTheme.primaryColor;
      case 'A-':
        return AppTheme.accentColor;
      case 'B+':
        return AppTheme.warningColor;
      case 'B':
        return AppTheme.warningColor;
      case 'B-':
        return AppTheme.warningColor;
      case 'C+':
        return AppTheme.errorColor;
      case 'C':
        return AppTheme.errorColor;
      case 'C-':
        return AppTheme.errorColor;
      default:
        return AppTheme.textSecondary;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'present':
        return AppTheme.successColor;
      case 'absent':
        return AppTheme.errorColor;
      case 'sick':
        return AppTheme.warningColor;
      case 'leave':
        return AppTheme.accentColor;
      default:
        return AppTheme.textSecondary;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'present':
        return '出勤';
      case 'absent':
        return '缺勤';
      case 'sick':
        return '病假';
      case 'leave':
        return '请假';
      default:
        return '未知';
    }
  }

  Widget _buildAttendanceDetails(List studentAttendance) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '考勤详情',
              style: AppTextStyles.headline6?.copyWith(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            if (studentAttendance.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Text(
                    '暂无考勤详情',
                    style: AppTextStyles.bodyMedium?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
              )
            else
              ...studentAttendance.take(3).map((record) => _buildAttendanceDetailItem(record)),
          ],
        ),
      ),
    );
  }

  Widget _buildAttendanceDetailItem(dynamic record) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.sm),
        border: Border.all(color: AppTheme.dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '考勤记录',
            style: AppTextStyles.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _buildInfoRow('学生ID', record.getStringValue('student_id') ?? '未知'),
          _buildInfoRow('学生姓名', record.getStringValue('student_name') ?? '未知'),
          _buildInfoRow('中心', record.getStringValue('center') ?? '未知'),
          _buildInfoRow('分校名称', record.getStringValue('branch_name') ?? '未知'),
          _buildInfoRow('签到时间', record.getStringValue('check_in') ?? '--'),
          _buildInfoRow('签退时间', record.getStringValue('check_out') ?? '--'),
          _buildInfoRow('状态', '${record.getStringValue('status')} (${_getStatusText(record.getStringValue('status') ?? '')})'),
          _buildInfoRow('备注', record.getStringValue('notes') ?? '无'),
          _buildInfoRow('教师ID', record.getStringValue('teacher_id') ?? '未知'),
          _buildInfoRow('签到方式', record.getStringValue('method') ?? '未知'),
          _buildInfoRow('创建时间', record.getStringValue('created') ?? '未知'),
          _buildInfoRow('更新时间', record.getStringValue('updated') ?? '未知'),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: AppTheme.errorColor,
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              '学生信息不存在',
              style: AppTextStyles.headline5?.copyWith(
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              '请检查学生ID是否正确',
              style: AppTextStyles.bodyMedium?.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            ElevatedButton.icon(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back),
              label: const Text('返回'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
