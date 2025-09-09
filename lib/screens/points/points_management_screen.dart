import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../../providers/student_provider.dart';
import '../../providers/points_provider.dart';
import '../../theme/app_theme.dart';
import '../../services/pocketbase_service.dart';

class PointsManagementScreen extends StatefulWidget {
  const PointsManagementScreen({super.key});

  @override
  State<PointsManagementScreen> createState() => _PointsManagementScreenState();
}

class _PointsManagementScreenState extends State<PointsManagementScreen> with TickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  RecordModel? _selectedStudent;
  bool _selectedViaNfc = false;
  bool _isScanning = false;
  String _scanStatus = '准备扫描学生卡';
  String _lastScannedStudent = '';
  DateTime? _lastScanTime;
  late AnimationController _animationController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.2).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final studentProvider = context.read<StudentProvider>();
      final pointsProvider = context.read<PointsProvider>();
      await Future.wait([
        studentProvider.loadStudents(),
        pointsProvider.loadStudentPoints(),
        pointsProvider.loadPointTransactions(),
      ]);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('加载数据失败: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: CustomScrollView(
        slivers: [
          _buildModernAppBar(),
          SliverToBoxAdapter(
            child: Column(
              children: [
                _buildWelcomeSection(),
                _buildQuickStats(),
                const SizedBox(height: 16),
                _buildScanStatusCard(),
                const SizedBox(height: 16),
                _buildLastScanCard(),
                const SizedBox(height: 16),
                _buildInstructionsCard(),
                const SizedBox(height: 16),
                _buildLeaderboardCard(),
                const SizedBox(height: 16),
                _buildSearchBar(),
                const SizedBox(height: 16),
                _buildStudentList(),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: _buildSmartFab(),
    );
  }

  Widget _buildModernAppBar() {
    return SliverAppBar(
      expandedHeight: 120,
      floating: false,
      pinned: true,
      elevation: 0,
      backgroundColor: AppTheme.primaryColor,
      foregroundColor: Colors.white,
      flexibleSpace: FlexibleSpaceBar(
        title: const Text(
          '积分管理',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [AppTheme.primaryColor, AppTheme.primaryColor.withOpacity(0.8)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                SizedBox(height: 40),
                Icon(
                  Icons.stars,
                  color: Colors.white,
                  size: 32,
                ),
                SizedBox(height: 8),
                Text(
                  '学生积分管理系统',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
      actions: [
        // 调试按钮 - 临时添加
        IconButton(
          tooltip: '测试积分操作',
          icon: const Icon(Icons.bug_report),
          onPressed: _testPointsOperation,
        ),
        IconButton(
          tooltip: '扫描学生NFC卡',
          icon: AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _isScanning ? _pulseAnimation.value : 1.0,
                child: Icon(
                  _isScanning ? Icons.nfc : Icons.nfc_outlined,
                  color: _isScanning ? AppTheme.successColor : Colors.white,
                ),
              );
            },
          ),
          onPressed: _isScanning ? null : _startStudentScan,
        ),
      ],
    );
  }

  Widget _buildWelcomeSection() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primaryColor.withOpacity(0.1), AppTheme.accentColor.withOpacity(0.1)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.primaryColor.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.emoji_events,
              color: AppTheme.primaryColor,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '欢迎使用积分管理系统',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '管理学生积分，激励学习进步',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickStats() {
    return Consumer2<StudentProvider, PointsProvider>(
      builder: (context, studentProvider, pointsProvider, child) {
        final totalStudents = studentProvider.students.length;
        // 计算所有学生的总积分
        int totalPoints = 0;
        for (final student in studentProvider.students) {
          totalPoints += pointsProvider.getTotalPointsForStudent(student.id);
        }
        
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  '学生总数',
                  totalStudents.toString(),
                  Icons.people,
                  AppTheme.primaryColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  '总积分',
                  totalPoints.toString(),
                  Icons.stars,
                  AppTheme.accentColor,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.dividerColor),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanStatusCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _isScanning ? _pulseAnimation.value : 1.0,
                child: Icon(
                  _isScanning ? Icons.nfc : Icons.nfc_outlined,
                  color: Colors.white,
                  size: 28,
                ),
              );
            },
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '扫描状态',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  _scanStatus,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          if (_isScanning)
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLastScanCard() {
    if (_lastScannedStudent.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.dividerColor),
        ),
        child: Column(
          children: [
            Icon(
              Icons.nfc_outlined,
              color: AppTheme.textSecondary,
              size: 32,
            ),
            const SizedBox(height: 8),
            Text(
              '还没有扫描记录',
              style: TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '点击NFC按钮开始扫描学生卡',
              style: TextStyle(
                color: AppTheme.textTertiary,
                fontSize: 12,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dividerColor),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.check_circle,
                color: AppTheme.successColor,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                '最近扫描',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              CircleAvatar(
                backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                child: Text(
                  _lastScannedStudent.isNotEmpty ? _lastScannedStudent[0].toUpperCase() : '?',
                  style: const TextStyle(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _lastScannedStudent,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (_lastScanTime != null)
                      Text(
                        '扫描时间: ${_lastScanTime!.toString().split('.')[0]}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () {
                  if (_selectedStudent != null) {
                    _showPointsPanel(context, _selectedStudent!, allowActions: true);
                  }
                },
                icon: const Icon(Icons.arrow_forward),
                color: AppTheme.primaryColor,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLeaderboardCard() {
    return Consumer2<StudentProvider, PointsProvider>(
      builder: (context, studentProvider, pointsProvider, child) {
        // 获取积分排行榜数据
        final leaderboard = _getLeaderboardData(studentProvider, pointsProvider);
        
        return Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: AppTheme.cardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.dividerColor),
            boxShadow: AppTheme.cardShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 标题栏
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppTheme.primaryColor, AppTheme.primaryColor.withOpacity(0.8)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(16),
                    topRight: Radius.circular(16),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.emoji_events,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '积分排行榜',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Top 10 学生积分排名',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.9),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${leaderboard.length} 名学生',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              // 排行榜内容
              if (leaderboard.isEmpty)
                Container(
                  padding: const EdgeInsets.all(40),
                  child: Column(
                    children: [
                      Icon(
                        Icons.emoji_events_outlined,
                        color: AppTheme.textSecondary,
                        size: 48,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        '暂无积分数据',
                        style: TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '开始为学生添加积分以查看排行榜',
                        style: TextStyle(
                          color: AppTheme.textTertiary,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: leaderboard.length > 10 ? 10 : leaderboard.length,
                  separatorBuilder: (_, __) => Divider(
                    height: 1,
                    color: AppTheme.dividerColor.withOpacity(0.5),
                  ),
                  itemBuilder: (context, index) {
                    final item = leaderboard[index];
                    return _buildLeaderboardItem(item, index + 1);
                  },
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLeaderboardItem(Map<String, dynamic> item, int rank) {
    final student = item['student'] as RecordModel;
    final points = item['points'] as int;
    final studentName = student.getStringValue('student_name');
    final studentId = student.getStringValue('student_id');
    final standard = student.getStringValue('standard');

    // 根据排名选择颜色和图标
    Color rankColor;
    IconData rankIcon;
    
    if (rank == 1) {
      rankColor = const Color(0xFFFFD700); // 金色
      rankIcon = Icons.emoji_events;
    } else if (rank == 2) {
      rankColor = const Color(0xFFC0C0C0); // 银色
      rankIcon = Icons.emoji_events;
    } else if (rank == 3) {
      rankColor = const Color(0xFFCD7F32); // 铜色
      rankIcon = Icons.emoji_events;
    } else {
      rankColor = AppTheme.textSecondary;
      rankIcon = Icons.person;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        children: [
          // 排名
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: rankColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: rankColor.withOpacity(0.3)),
            ),
            child: Center(
              child: Text(
                '$rank',
                style: TextStyle(
                  color: rankColor,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          
          // 学生头像
          CircleAvatar(
            radius: 20,
            backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
            child: Text(
              studentName.isNotEmpty ? studentName[0].toUpperCase() : '?',
              style: const TextStyle(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
          const SizedBox(width: 16),
          
          // 学生信息
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  studentName,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$studentId · $standard',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          
          // 积分显示
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: _getPointsColor(points).withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: _getPointsColor(points).withOpacity(0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.stars,
                  color: _getPointsColor(points),
                  size: 16,
                ),
                const SizedBox(width: 4),
                Text(
                  '$points',
                  style: TextStyle(
                    color: _getPointsColor(points),
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Map<String, dynamic>> _getLeaderboardData(StudentProvider studentProvider, PointsProvider pointsProvider) {
    final students = studentProvider.students;
    final leaderboard = <Map<String, dynamic>>[];
    
    for (final student in students) {
      final points = pointsProvider.getTotalPointsForStudent(student.id);
      leaderboard.add({
        'student': student,
        'points': points,
      });
    }
    
    // 按积分降序排序
    leaderboard.sort((a, b) => (b['points'] as int).compareTo(a['points'] as int));
    
    return leaderboard;
  }

  Color _getPointsColor(int points) {
    if (points >= 100) {
      return AppTheme.successColor;
    } else if (points >= 50) {
      return AppTheme.accentColor;
    } else if (points >= 0) {
      return AppTheme.primaryColor;
    } else {
      return AppTheme.errorColor;
    }
  }

  Widget _buildInstructionsCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dividerColor),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.help_outline,
                color: AppTheme.primaryColor,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                '操作指南',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildInstructionItem('1', '点击右上角NFC图标扫描学生卡'),
          _buildInstructionItem('2', '扫描成功后可直接进行积分操作'),
          _buildInstructionItem('3', '也可以从下方列表选择学生'),
          _buildInstructionItem('4', '所有操作都需要老师卡验证'),
          _buildInstructionItem('5', '兑换礼物需要拍照凭证'),
        ],
      ),
    );
  }

  Widget _buildInstructionItem(String number, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 20,
            height: 20,
            decoration: const BoxDecoration(
              color: AppTheme.primaryColor,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                number,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dividerColor),
        boxShadow: AppTheme.cardShadow,
      ),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: '搜索学生姓名/学号/班级',
          prefixIcon: const Icon(Icons.search, color: AppTheme.textSecondary),
          filled: true,
          fillColor: Colors.transparent,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
        ),
        onChanged: (v) => setState(() => _searchQuery = v.trim()),
      ),
    );
  }

  Widget _buildStudentList() {
    return Consumer2<StudentProvider, PointsProvider>(
      builder: (context, studentProvider, pointsProvider, child) {
        final isLoading = studentProvider.isLoading || pointsProvider.isLoading;
        final error = studentProvider.error ?? pointsProvider.error;

        if (isLoading) {
          return Container(
            height: 200,
            decoration: BoxDecoration(
              color: AppTheme.cardColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.dividerColor),
            ),
            child: const Center(
              child: CircularProgressIndicator(color: AppTheme.primaryColor),
            ),
          );
        }

        if (error != null) {
          return _buildError(error);
        }

        List<RecordModel> students = studentProvider.students;
        if (_searchQuery.isNotEmpty) {
          students = studentProvider.searchStudents(_searchQuery);
        }

        if (students.isEmpty) {
          return _buildEmpty();
        }

        return Container(
          decoration: BoxDecoration(
            color: AppTheme.cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.dividerColor),
            boxShadow: AppTheme.cardShadow,
          ),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(
                      Icons.people,
                      color: AppTheme.primaryColor,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '学生列表 (${students.length})',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: students.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final student = students[index];
                  final name = student.getStringValue('student_name');
                  final studentId = student.getStringValue('student_id');
                  final standard = student.getStringValue('standard');
                  final totalPoints = pointsProvider.getTotalPointsForStudent(student.id);

                  return ListTile(
                    title: Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text('$studentId · $standard'),
                    trailing: _buildPointsBadge(totalPoints),
                    onTap: () {
                      _selectedViaNfc = false;
                      _showPointsPanel(context, student, allowActions: false);
                    },
                    leading: CircleAvatar(
                      backgroundColor: AppTheme.primaryColor.withOpacity(0.12),
                      child: Text(
                        name.isNotEmpty ? name[0].toUpperCase() : '?',
                        style: const TextStyle(color: AppTheme.primaryColor),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPointsBadge(int points) {
    Color color;
    if (points >= 100) {
      color = AppTheme.successColor;
    } else if (points >= 50) {
      color = AppTheme.accentColor;
    } else if (points >= 0) {
      color = AppTheme.primaryColor;
    } else {
      color = AppTheme.errorColor;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(points >= 0 ? Icons.add_task : Icons.remove_circle, color: color, size: 16),
          const SizedBox(width: 6),
          Text('$points 分', style: TextStyle(color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildError(String error) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dividerColor),
      ),
      child: Column(
        children: [
          const Icon(Icons.error_outline, color: AppTheme.errorColor, size: 40),
          const SizedBox(height: 12),
          Text(error, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _loadData,
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor, foregroundColor: Colors.white),
            child: const Text('重试'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dividerColor),
      ),
      child: Column(
        children: [
          Icon(
            Icons.search_off,
            color: AppTheme.textSecondary,
            size: 40,
          ),
          const SizedBox(height: 12),
          Text(
            _searchQuery.isNotEmpty ? '没有找到匹配的学生' : '暂无学生数据',
            style: const TextStyle(fontSize: 16),
          ),
          if (_searchQuery.isNotEmpty) ...[
            const SizedBox(height: 8),
            TextButton(
              onPressed: () {
                _searchController.clear();
                setState(() => _searchQuery = '');
              },
              child: const Text('清除搜索'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSmartFab() {
    return ExpandableFab(
      distance: 60,
      children: [
        ActionButton(
          onPressed: _isScanning ? null : () => _showCustomPointsDialog('add_points'),
          icon: const Icon(Icons.add, color: Colors.white),
          backgroundColor: AppTheme.successColor,
          tooltip: '增加积分',
        ),
        ActionButton(
          onPressed: _isScanning ? null : () => _showCustomPointsDialog('deduct_points'),
          icon: const Icon(Icons.remove, color: Colors.white),
          backgroundColor: AppTheme.errorColor,
          tooltip: '扣除积分',
        ),
        ActionButton(
          onPressed: _isScanning ? null : () => _showCustomPointsDialog('redeem'),
          icon: const Icon(Icons.card_giftcard, color: Colors.white),
          backgroundColor: AppTheme.accentColor,
          tooltip: '兑换礼物',
        ),
        ActionButton(
          onPressed: _isScanning ? _stopScan : _startStudentScan,
          icon: Icon(_isScanning ? Icons.stop : Icons.nfc, color: Colors.white),
          backgroundColor: _isScanning ? AppTheme.errorColor : AppTheme.primaryColor,
          tooltip: _isScanning ? '停止扫描' : '扫描学生卡',
        ),
      ],
    );
  }

  Future<void> _stopScan() async {
    try {
      await FlutterNfcKit.finish();
      setState(() {
        _isScanning = false;
        _scanStatus = '扫描已停止';
      });
      _animationController.stop();
    } catch (e) {
      // 忽略错误
    }
  }

  Future<void> _startStudentScan() async {
    if (_isScanning) return;
    
    setState(() {
      _isScanning = true;
      _scanStatus = '请将学生NFC卡片靠近设备...';
    });
    _animationController.repeat(reverse: true);

    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability != NFCAvailability.available) {
        setState(() {
          _scanStatus = 'NFC不可用，请检查设备设置';
          _isScanning = false;
        });
        _animationController.stop();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('NFC不可用，请检查设备设置'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
        return;
      }

      final tag = await FlutterNfcKit.poll(timeout: const Duration(seconds: 30));
      final records = await FlutterNfcKit.readNDEFRecords();
      String? url;
      for (final rec in records) {
        final payload = rec.payload;
        if (payload == null || payload.isEmpty) continue;
        final content = String.fromCharCodes(payload);
        if (content.contains('docs.google.com/forms') || content.startsWith('http')) {
          url = content;
          break;
        }
      }
      await FlutterNfcKit.finish();

      if (url == null) {
        setState(() {
          _scanStatus = '未在卡内发现URL';
          _isScanning = false;
        });
        _animationController.stop();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('未在卡内发现URL'),
              backgroundColor: AppTheme.warningColor,
            ),
          );
        }
        return;
      }

      setState(() {
        _scanStatus = '正在查找学生信息...';
      });

      final student = await PocketBaseService.instance.getStudentByNfcUrl(url);
      if (student == null) {
        setState(() {
          _scanStatus = '未找到学生信息';
          _isScanning = false;
        });
        _animationController.stop();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('未找到学生: $url'),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
        return;
      }

      final studentName = student.getStringValue('student_name');
      setState(() {
        _selectedStudent = student;
        _selectedViaNfc = true;
        _isScanning = false;
        _scanStatus = '扫描成功';
        _lastScannedStudent = studentName;
        _lastScanTime = DateTime.now();
      });
      _animationController.stop();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('扫描成功: $studentName'),
            backgroundColor: AppTheme.successColor,
          ),
        );
        _showPointsPanel(context, student, allowActions: true);
      }
    } catch (e) {
      setState(() {
        _scanStatus = '扫描失败: $e';
        _isScanning = false;
      });
      _animationController.stop();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('扫描失败: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
      try { await FlutterNfcKit.finish(); } catch (_) {}
    }
  }

  Future<bool> _showTeacherVerificationDialog() async {
    return await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('老师卡验证'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.nfc,
                size: 48,
                color: AppTheme.primaryColor,
              ),
              const SizedBox(height: 16),
              const Text('请将老师NFC卡靠近设备进行验证'),
              const SizedBox(height: 16),
              FutureBuilder<bool>(
                future: _performTeacherScan(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Column(
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 8),
                        Text('正在扫描...'),
                      ],
                    );
                  } else if (snapshot.hasError) {
                    return Column(
                      children: [
                        const Icon(Icons.error, color: AppTheme.errorColor, size: 32),
                        const SizedBox(height: 8),
                        Text('扫描失败: ${snapshot.error}'),
                      ],
                    );
                  } else if (snapshot.data == true) {
                    return const Column(
                      children: [
                        Icon(Icons.check_circle, color: AppTheme.successColor, size: 32),
                        SizedBox(height: 8),
                        Text('验证成功！'),
                      ],
                    );
                  } else {
                    return const Column(
                      children: [
                        Icon(Icons.cancel, color: AppTheme.errorColor, size: 32),
                        SizedBox(height: 8),
                        Text('验证失败'),
                      ],
                    );
                  }
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('取消'),
            ),
            FilledButton(
              onPressed: () async {
                final result = await _performTeacherScan();
                if (result) {
                  Navigator.of(ctx).pop(true);
                }
              },
              child: const Text('重试'),
            ),
          ],
        );
      },
    ) ?? false;
  }

  Future<bool> _performTeacherScan() async {
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability != NFCAvailability.available) {
        throw Exception('NFC不可用，请检查设备设置');
      }
      
      final tag = await FlutterNfcKit.poll(timeout: const Duration(seconds: 30));
      final cardHex = (tag.id ?? '').toUpperCase();
      await FlutterNfcKit.finish();
      
      if (cardHex.isEmpty) {
        throw Exception('未检测到NFC卡');
      }
      
      final teacher = await PocketBaseService.instance.getTeacherByCardId(cardHex);
      if (teacher == null) {
        throw Exception('未找到对应的老师记录: $cardHex');
      }
      
      return true;
    } catch (e) {
      try { await FlutterNfcKit.finish(); } catch (_) {}
      rethrow;
    }
  }

  Future<bool> _startTeacherScan() async {
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability != NFCAvailability.available) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('NFC不可用，请检查设备设置'),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
        return false;
      }
      
      // 显示扫描提示
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('请将老师NFC卡靠近设备...'),
            duration: Duration(seconds: 3),
          ),
        );
      }
      
      final tag = await FlutterNfcKit.poll(timeout: const Duration(seconds: 30));
      final cardHex = (tag.id ?? '').toUpperCase();
      await FlutterNfcKit.finish();
      
      if (cardHex.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('未检测到NFC卡，请重试'),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
        return false;
      }
      
      // 查找老师
      final teacher = await PocketBaseService.instance.getTeacherByCardId(cardHex);
      if (teacher == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('未找到对应的老师记录: $cardHex'),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
        return false;
      }
      
      // 验证成功
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('老师卡验证成功: ${teacher.getStringValue('teacher_name')}'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
      
      return true;
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('老师卡扫描失败: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
      try { await FlutterNfcKit.finish(); } catch (_) {}
      return false;
    }
  }

  Future<void> _openPointsDialog(BuildContext context, {required bool isAdd}) async {
    final studentProvider = context.read<StudentProvider>();
    final pointsProvider = context.read<PointsProvider>();
    RecordModel? selectedStudent = _selectedStudent;
    final amountController = TextEditingController();
    final reasonController = TextEditingController();

    await showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text(isAdd ? '增加积分' : '扣除积分'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<RecordModel>(
                  decoration: const InputDecoration(labelText: '选择学生'),
                  items: studentProvider.students.map((s) {
                    return DropdownMenuItem(
                      value: s,
                      child: Text(s.getStringValue('student_name')),
                    );
                  }).toList(),
                  value: selectedStudent,
                  onChanged: (v) => selectedStudent = v,
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: '积分数量'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: reasonController,
                  decoration: const InputDecoration(labelText: '原因（可选）'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('取消'),
            ),
            FilledButton(
              onPressed: () async {
                if (selectedStudent == null) return;
                final amount = int.tryParse(amountController.text.trim()) ?? 0;
                final reason = reasonController.text.trim();
                if (amount <= 0) return;
                // 二次验证：请老师扫描卡片
                final teacherConfirmed = await _startTeacherScan();
                if (!teacherConfirmed) return;
                final teacherId = PocketBaseService.instance.currentUser?.id ?? '';
                bool ok;
                if (isAdd) {
                  ok = await pointsProvider.addPointsToStudent(selectedStudent!.id, amount, reason, teacherId: teacherId);
                } else {
                  ok = await pointsProvider.deductPointsFromStudent(selectedStudent!.id, amount, reason, teacherId: teacherId);
                }
                if (ok && mounted) {
                  Navigator.of(ctx).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(isAdd ? '已增加积分' : '已扣除积分')),
                  );
                }
              },
              child: const Text('确定'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _openRedeemDialog(BuildContext context) async {
    final studentProvider = context.read<StudentProvider>();
    final pointsProvider = context.read<PointsProvider>();
    RecordModel? selectedStudent = _selectedStudent;
    final amountController = TextEditingController();
    final reasonController = TextEditingController();
    File? proof;

    await showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('兑换礼物'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<RecordModel>(
                  decoration: const InputDecoration(labelText: '选择学生'),
                  items: studentProvider.students.map((s) {
                    return DropdownMenuItem(value: s, child: Text(s.getStringValue('student_name')));
                  }).toList(),
                  value: selectedStudent,
                  onChanged: (v) => selectedStudent = v,
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: '兑换所需积分'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: reasonController,
                  decoration: const InputDecoration(labelText: '兑换说明'),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    ElevatedButton.icon(
                      onPressed: () async {
                        final picker = ImagePicker();
                        final picked = await picker.pickImage(source: ImageSource.camera, imageQuality: 80);
                        if (picked != null) {
                          setState(() => proof = File(picked.path));
                        }
                      },
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('拍照凭证'),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton.icon(
                      onPressed: () async {
                        final picker = ImagePicker();
                        final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
                        if (picked != null) {
                          setState(() => proof = File(picked.path));
                        }
                      },
                      icon: const Icon(Icons.photo_library),
                      label: const Text('相册选择'),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(proof == null ? '未选择凭证' : '已选择凭证'),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('取消')),
            FilledButton(
              onPressed: () async {
                if (selectedStudent == null) return;
                final amount = int.tryParse(amountController.text.trim()) ?? 0;
                final reason = reasonController.text.trim();
                if (amount <= 0) return;
                final teacherConfirmed = await _startTeacherScan();
                if (!teacherConfirmed) return;
                final teacherId = PocketBaseService.instance.currentUser?.id ?? '';
                final ok = await pointsProvider.redeemWithProof(
                  selectedStudent!.id,
                  amount,
                  reason,
                  teacherId: teacherId,
                  proofImage: proof,
                );
                if (ok && mounted) {
                  Navigator.of(ctx).pop();
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已完成兑换')));
                }
              },
              child: const Text('确定'),
            ),
          ],
        );
      },
    );
  }

  void _showPointsPanel(BuildContext context, RecordModel student, {required bool allowActions}) {
    final pointsProvider = context.read<PointsProvider>();
    final history = pointsProvider.getPointsHistoryForStudent(student.id);
    _selectedStudent = student;

    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) {
        return SizedBox(
          height: MediaQuery.of(ctx).size.height * 0.7,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: Text('积分历史 - ${student.getStringValue('student_name')}',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
              const Divider(height: 1),
              Expanded(
                child: history.isEmpty
                    ? const Center(child: Text('暂无积分记录'))
                    : ListView.separated(
                        itemCount: history.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final r = history[index];
                          final points = r.getIntValue('points_change');
                          final reason = r.getStringValue('reason');
                          final date = r.getStringValue('created');
                          final type = r.getStringValue('transaction_type');
                          final color = points >= 0 ? AppTheme.successColor : AppTheme.errorColor;
                          return ListTile(
                            leading: Icon(
                              type == 'add_points'
                                  ? Icons.trending_up
                                  : type == 'redeem'
                                      ? Icons.card_giftcard
                                      : Icons.trending_down,
                              color: color,
                            ),
                            title: Text('${points >= 0 ? '+' : ''}$points 分'),
                            subtitle: Text(reason.isEmpty ? type : '$type · $reason'),
                            trailing: Text(date),
                          );
                        },
                      ),
              ),
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!allowActions) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.warningColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.warningColor.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.info_outline, color: AppTheme.warningColor, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                '请先通过NFC扫描学生卡以启用操作',
                                style: TextStyle(color: AppTheme.warningColor, fontSize: 14),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    // 自定义积分操作
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: allowActions ? () => _showCustomPointsDialog('add_points') : null,
                            icon: const Icon(Icons.add),
                            label: const Text('增加积分'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: allowActions ? AppTheme.successColor : AppTheme.textSecondary,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: allowActions ? () => _showCustomPointsDialog('deduct_points') : null,
                            icon: const Icon(Icons.remove),
                            label: const Text('扣除积分'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: allowActions ? AppTheme.errorColor : AppTheme.textSecondary,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: allowActions ? () => _showCustomPointsDialog('redeem') : null,
                        icon: const Icon(Icons.card_giftcard),
                        label: const Text('兑换礼物'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: allowActions ? AppTheme.accentColor : AppTheme.textSecondary,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                    // 快速操作提示
                    if (allowActions) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.lightbulb_outline, color: AppTheme.primaryColor, size: 16),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                '点击上方按钮可自定义积分数量',
                                style: TextStyle(color: AppTheme.primaryColor, fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _showCustomPointsDialog(String actionType) async {
    if (_selectedStudent == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('请先扫描学生卡'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    final amountController = TextEditingController();
    final reasonController = TextEditingController();
    File? proof;

    String title;
    String amountLabel;
    String reasonLabel;
    Color primaryColor;

    switch (actionType) {
      case 'add_points':
        title = '增加积分';
        amountLabel = '增加积分数量';
        reasonLabel = '增加原因（可选）';
        primaryColor = AppTheme.successColor;
        break;
      case 'deduct_points':
        title = '扣除积分';
        amountLabel = '扣除积分数量';
        reasonLabel = '扣除原因（可选）';
        primaryColor = AppTheme.errorColor;
        break;
      case 'redeem':
        title = '兑换礼物';
        amountLabel = '兑换所需积分';
        reasonLabel = '兑换说明';
        primaryColor = AppTheme.accentColor;
        break;
      default:
        return;
    }

    await showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text(title),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // 学生信息显示
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: AppTheme.primaryColor.withOpacity(0.2),
                        child: Text(
                          _selectedStudent!.getStringValue('student_name').isNotEmpty 
                              ? _selectedStudent!.getStringValue('student_name')[0].toUpperCase() 
                              : '?',
                          style: const TextStyle(color: AppTheme.primaryColor),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _selectedStudent!.getStringValue('student_name'),
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            Text(
                              '${_selectedStudent!.getStringValue('student_id')} · ${_selectedStudent!.getStringValue('standard')}',
                              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: amountLabel,
                    hintText: '请输入积分数量',
                    prefixIcon: Icon(
                      actionType == 'add_points' ? Icons.add : 
                      actionType == 'deduct_points' ? Icons.remove : Icons.card_giftcard,
                      color: primaryColor,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: reasonController,
                  decoration: InputDecoration(
                    labelText: reasonLabel,
                    hintText: '请输入${reasonLabel.replaceAll('（可选）', '').replaceAll('（', '').replaceAll('）', '')}',
                    prefixIcon: const Icon(Icons.description, color: AppTheme.textSecondary),
                  ),
                  maxLines: 2,
                ),
                // 兑换时需要拍照凭证
                if (actionType == 'redeem') ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () async {
                            final picker = ImagePicker();
                            final picked = await picker.pickImage(source: ImageSource.camera, imageQuality: 80);
                            if (picked != null) {
                              setState(() => proof = File(picked.path));
                            }
                          },
                          icon: const Icon(Icons.camera_alt),
                          label: const Text('拍照凭证'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryColor,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () async {
                            final picker = ImagePicker();
                            final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
                            if (picked != null) {
                              setState(() => proof = File(picked.path));
                            }
                          },
                          icon: const Icon(Icons.photo_library),
                          label: const Text('相册选择'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.secondaryColor,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: proof == null ? AppTheme.warningColor.withOpacity(0.1) : AppTheme.successColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: proof == null ? AppTheme.warningColor.withOpacity(0.3) : AppTheme.successColor.withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          proof == null ? Icons.warning_outlined : Icons.check_circle,
                          color: proof == null ? AppTheme.warningColor : AppTheme.successColor,
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          proof == null ? '未选择凭证' : '已选择凭证',
                          style: TextStyle(
                            color: proof == null ? AppTheme.warningColor : AppTheme.successColor,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('取消'),
            ),
            FilledButton(
              onPressed: () async {
                final amount = int.tryParse(amountController.text.trim()) ?? 0;
                final reason = reasonController.text.trim();
                
                if (amount <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Text('请输入有效的积分数量'),
                      backgroundColor: AppTheme.errorColor,
                    ),
                  );
                  return;
                }

                if (actionType == 'redeem' && proof == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Text('兑换礼物需要拍照凭证'),
                      backgroundColor: AppTheme.warningColor,
                    ),
                  );
                  return;
                }

                // 显示加载状态
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Row(
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 12),
                        Text('正在处理...'),
                      ],
                    ),
                    duration: const Duration(seconds: 2),
                  ),
                );

                // 二次验证老师卡
                final teacherConfirmed = await _showTeacherVerificationDialog();
                if (!teacherConfirmed) {
                  return;
                }

                final provider = context.read<PointsProvider>();
                final teacherId = PocketBaseService.instance.currentUser?.id ?? '';
                
                if (teacherId.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Text('无法获取老师ID，请重新登录'),
                      backgroundColor: AppTheme.errorColor,
                    ),
                  );
                  return;
                }

                bool success = false;
                String? errorMessage;

                try {
                  if (actionType == 'add_points') {
                    success = await provider.addPointsToStudent(_selectedStudent!.id, amount, reason, teacherId: teacherId);
                  } else if (actionType == 'deduct_points') {
                    success = await provider.deductPointsFromStudent(_selectedStudent!.id, amount, reason, teacherId: teacherId);
                  } else if (actionType == 'redeem') {
                    success = await provider.redeemWithProof(_selectedStudent!.id, amount, reason, teacherId: teacherId, proofImage: proof);
                  }
                  
                  errorMessage = provider.error;
                } catch (e) {
                  success = false;
                  errorMessage = '操作异常: $e';
                }

                if (mounted) {
                  Navigator.of(ctx).pop();
                  if (success) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('$title成功'),
                        backgroundColor: AppTheme.successColor,
                      ),
                    );
                  } else {
                    // 显示错误信息
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(errorMessage ?? '操作失败，请重试'),
                        backgroundColor: AppTheme.errorColor,
                        duration: const Duration(seconds: 5),
                        action: SnackBarAction(
                          label: '重试',
                          textColor: Colors.white,
                          onPressed: () {
                            // 重新打开对话框
                            _showCustomPointsDialog(actionType);
                          },
                        ),
                      ),
                    );
                  }
                }
              },
              style: FilledButton.styleFrom(backgroundColor: primaryColor),
              child: const Text('确定'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _triggerPresetAction(String action, int amount, {bool needProof = false}) async {
    if (_selectedStudent == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请先扫描学生卡')));
      return;
    }
    // 二次验证老师卡
    final ok = await _startTeacherScan();
    if (!ok) return;

    File? proof;
    if (needProof) {
      final picker = ImagePicker();
      final picked = await picker.pickImage(source: ImageSource.camera, imageQuality: 85);
      if (picked != null) proof = File(picked.path);
    }

    final provider = context.read<PointsProvider>();
    final teacherId = PocketBaseService.instance.currentUser?.id ?? '';
    bool success = false;
    if (action == 'add_points') {
      success = await provider.addPointsToStudent(_selectedStudent!.id, amount, 'preset', teacherId: teacherId);
    } else if (action == 'deduct_points') {
      success = await provider.deductPointsFromStudent(_selectedStudent!.id, amount, 'preset', teacherId: teacherId);
    } else {
      success = await provider.redeemWithProof(_selectedStudent!.id, amount, 'redeem', teacherId: teacherId, proofImage: proof);
    }

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('操作成功')));
    }
  }

  Future<void> _testPointsOperation() async {
    // 详细的测试方法
    final studentProvider = context.read<StudentProvider>();
    if (studentProvider.students.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('没有学生数据，无法测试'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    final testStudent = studentProvider.students.first;
    final provider = context.read<PointsProvider>();
    final teacherId = PocketBaseService.instance.currentUser?.id ?? '';

    // 显示测试信息
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('积分操作测试'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('学生: ${testStudent.getStringValue('student_name')}'),
            Text('学生ID: ${testStudent.id}'),
            Text('老师ID: ${teacherId.isEmpty ? '未登录' : teacherId}'),
            const SizedBox(height: 16),
            const Text('将测试以下操作:'),
            const Text('1. 创建积分交易记录'),
            const Text('2. 更新学生积分汇总'),
            const Text('3. 刷新界面数据'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              await _performDetailedTest(testStudent, teacherId);
            },
            child: const Text('开始测试'),
          ),
        ],
      ),
    );
  }

  Future<void> _performDetailedTest(RecordModel testStudent, String teacherId) async {
    final provider = context.read<PointsProvider>();
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('开始详细测试...'),
        duration: const Duration(seconds: 2),
      ),
    );

    try {
      // 步骤1: 测试创建积分交易
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('步骤1: 创建积分交易记录...')),
      );
      
      final success = await provider.addPointsToStudent(
        testStudent.id, 
        10, 
        '详细测试 - 增加积分', 
        teacherId: teacherId
      );
      
      if (!success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('创建积分交易失败: ${provider.error ?? '未知错误'}'),
            backgroundColor: AppTheme.errorColor,
            duration: const Duration(seconds: 5),
          ),
        );
        return;
      }

      // 步骤2: 等待一下让数据同步
      await Future.delayed(const Duration(seconds: 1));

      // 步骤3: 测试扣除积分
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('步骤2: 测试扣除积分...')),
      );
      
      final deductSuccess = await provider.deductPointsFromStudent(
        testStudent.id, 
        5, 
        '详细测试 - 扣除积分', 
        teacherId: teacherId
      );

      if (!deductSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('扣除积分失败: ${provider.error ?? '未知错误'}'),
            backgroundColor: AppTheme.errorColor,
            duration: const Duration(seconds: 5),
          ),
        );
        return;
      }

      // 步骤4: 刷新数据
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('步骤3: 刷新数据...')),
      );
      
      await provider.loadStudentPoints();
      await provider.loadPointTransactions();

      // 显示最终结果
      final currentPoints = provider.getTotalPointsForStudent(testStudent.id);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('测试完成！当前积分: $currentPoints'),
          backgroundColor: AppTheme.successColor,
          duration: const Duration(seconds: 3),
        ),
      );

    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('测试异常: $e'),
          backgroundColor: AppTheme.errorColor,
          duration: const Duration(seconds: 5),
        ),
      );
    }
  }
}

// Simple expandable FAB implementation
class ExpandableFab extends StatefulWidget {
  final double distance;
  final List<Widget> children;

  const ExpandableFab({super.key, required this.distance, required this.children});

  @override
  State<ExpandableFab> createState() => _ExpandableFabState();
}

class _ExpandableFabState extends State<ExpandableFab> with SingleTickerProviderStateMixin {
  late final AnimationController _controller =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 200));
  late final Animation<double> _expandAnimation = CurvedAnimation(
    curve: Curves.fastOutSlowIn,
    reverseCurve: Curves.easeOutQuad,
    parent: _controller,
  );
  bool _open = false;

  @override
  Widget build(BuildContext context) {
    return SizedBox.expand(
      child: Stack(
        alignment: Alignment.bottomRight,
        clipBehavior: Clip.none,
        children: [
          _buildTapToCloseFab(),
          ..._buildExpandingActionButtons(),
          _buildTapToOpenFab(),
        ],
      ),
    );
  }

  Widget _buildTapToCloseFab() {
    return SizedBox(
      width: 56,
      height: 56,
      child: Center(
        child: Material(
          shape: const CircleBorder(),
          clipBehavior: Clip.antiAlias,
          color: AppTheme.primaryColor,
          elevation: 6,
          child: InkWell(
            onTap: () {
              setState(() {
                _open = !_open;
                if (_open) {
                  _controller.forward();
                } else {
                  _controller.reverse();
                }
              });
            },
            child: SizedBox(
              width: 56,
              height: 56,
              child: Icon(_open ? Icons.close : Icons.stars, color: Colors.white),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _buildExpandingActionButtons() {
    final children = <Widget>[];
    final count = widget.children.length;
    for (var i = 0; i < count; i++) {
      children.add(_ExpandingActionButton(
        maxDistance: widget.distance * (i + 1),
        progress: _expandAnimation,
        child: widget.children[i],
      ));
    }
    return children;
  }

  Widget _buildTapToOpenFab() {
    return const SizedBox.shrink();
  }
}

class _ExpandingActionButton extends StatelessWidget {
  final double maxDistance;
  final Animation<double> progress;
  final Widget child;

  const _ExpandingActionButton({required this.maxDistance, required this.progress, required this.child});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: progress,
      builder: (context, child) {
        final offset = Offset(0, -maxDistance * progress.value);
        return Positioned(
          right: 4,
          bottom: 4,
          child: Transform.translate(
            offset: offset,
            child: Opacity(opacity: progress.value, child: child),
          ),
        );
      },
      child: child,
    );
  }
}

class ActionButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget icon;
  final Color backgroundColor;
  final String? tooltip;

  const ActionButton({super.key, this.onPressed, required this.icon, required this.backgroundColor, this.tooltip});

  @override
  Widget build(BuildContext context) {
    return Material(
      shape: const CircleBorder(),
      clipBehavior: Clip.antiAlias,
      color: onPressed == null ? backgroundColor.withOpacity(0.5) : backgroundColor,
      elevation: 4,
      child: IconButton(
        onPressed: onPressed,
        icon: icon,
        tooltip: tooltip,
        color: Colors.white,
      ),
    );
  }
}