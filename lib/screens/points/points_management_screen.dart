import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../providers/student_provider.dart';
import '../../providers/points_provider.dart';
import '../../theme/app_theme.dart';
import '../attendance/nfc_attendance_screen.dart';

class PointsManagementScreen extends StatefulWidget {
  const PointsManagementScreen({super.key});

  @override
  State<PointsManagementScreen> createState() => _PointsManagementScreenState();
}

class _PointsManagementScreenState extends State<PointsManagementScreen> 
    with TickerProviderStateMixin {
  String _selectedTimeRange = '7d';
  String _selectedFilter = 'all';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  late TabController _tabController;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
    _loadData();
      _animationController.forward();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _tabController.dispose();
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
      backgroundColor: const Color(0xFFF8FAFC),
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: CustomScrollView(
          slivers: [
            _buildEnterpriseAppBar(),
            _buildSmartHeader(),
            _buildAnalyticsSection(),
            _buildTabSection(),
            _buildContentSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildEnterpriseAppBar() {
    return SliverAppBar(
      expandedHeight: 120,
      floating: false,
      pinned: true,
      backgroundColor: const Color(0xFF1E293B),
        foregroundColor: Colors.white,
      flexibleSpace: FlexibleSpaceBar(
        title: const Text(
          '积分智能管理中心',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        background: Container(
          decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              colors: [
                Color(0xFF1E293B),
                Color(0xFF334155),
                Color(0xFF475569),
              ],
              ),
            ),
          child: Stack(
              children: [
              Positioned(
                right: -50,
                top: -50,
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.1),
                  ),
                ),
              ),
              Positioned(
                left: -30,
                bottom: -30,
                child: Container(
                  width: 150,
                  height: 150,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.05),
              ),
            ),
          ),
        ],
      ),
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh_rounded),
          onPressed: () {
            _loadData();
          },
        ),
        IconButton(
          icon: const Icon(Icons.nfc_rounded),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const NfcAttendanceScreen(),
              ),
            );
          },
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildSmartHeader() {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
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
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.stars_rounded,
                    color: Color(0xFFF59E0B),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                const Text(
                  '积分系统概览',
            style: TextStyle(
                    fontSize: 20,
              fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    '实时更新',
            style: TextStyle(
                      color: Color(0xFF10B981),
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
            ),
          ),
        ],
            ),
            const SizedBox(height: 16),
            _buildQuickStats(),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickStats() {
    return Consumer2<StudentProvider, PointsProvider>(
      builder: (context, studentProvider, pointsProvider, child) {
        final students = studentProvider.students;
        final totalStudents = students.length;
        final totalPoints = students.fold<int>(0, (sum, student) {
          return sum + pointsProvider.getTotalPointsForStudent(student.id);
        });
        final avgPoints = totalStudents > 0 ? (totalPoints / totalStudents).round() : 0;
        final topStudent = _getTopStudent(students, pointsProvider);

        return Row(
        children: [
            Expanded(
              child: _buildStatCard(
                '总学生数',
                totalStudents.toString(),
                Icons.people_rounded,
                const Color(0xFF3B82F6),
              ),
          ),
          const SizedBox(width: 12),
          Expanded(
              child: _buildStatCard(
                '总积分',
                totalPoints.toString(),
                Icons.stars_rounded,
                const Color(0xFFF59E0B),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                '平均积分',
                avgPoints.toString(),
                Icons.trending_up_rounded,
                const Color(0xFF10B981),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                '最高分',
                topStudent['points']?.toString() ?? '0',
                Icons.emoji_events_rounded,
                const Color(0xFFEF4444),
              ),
            ),
        ],
        );
      },
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
      return Container(
      padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
        color: color.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
          Icon(icon, color: color, size: 20),
            const SizedBox(height: 8),
            Text(
            value,
              style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
            title,
            style: const TextStyle(
                fontSize: 12,
              color: Color(0xFF64748B),
              ),
            textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

  Widget _buildAnalyticsSection() {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          Row(
            children: [
                const Text(
                  '积分趋势分析',
                  style: TextStyle(
                    fontSize: 18,
                  fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const Spacer(),
                DropdownButton<String>(
                  value: _selectedTimeRange,
                  onChanged: (value) {
                    setState(() {
                      _selectedTimeRange = value!;
                    });
                  },
                  items: const [
                    DropdownMenuItem(value: '7d', child: Text('最近7天')),
                    DropdownMenuItem(value: '30d', child: Text('最近30天')),
                    DropdownMenuItem(value: '90d', child: Text('最近90天')),
                  ],
                  underline: Container(),
                  style: const TextStyle(color: Color(0xFF64748B)),
                      ),
                  ],
                ),
            const SizedBox(height: 16),
            _buildTrendChart(),
          ],
        ),
      ),
    );
  }

  Widget _buildTrendChart() {
    return Container(
      height: 200,
      padding: const EdgeInsets.all(16),
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
      child: LineChart(
        LineChartData(
          gridData: FlGridData(
            show: true,
            drawVerticalLine: true,
            horizontalInterval: 1,
            verticalInterval: 1,
            getDrawingHorizontalLine: (value) {
              return FlLine(
                color: const Color(0xFFE2E8F0),
                strokeWidth: 1,
              );
            },
            getDrawingVerticalLine: (value) {
              return FlLine(
                color: const Color(0xFFE2E8F0),
                strokeWidth: 1,
              );
            },
          ),
          titlesData: FlTitlesData(
            show: true,
            rightTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            topTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 30,
                interval: 1,
                getTitlesWidget: (double value, TitleMeta meta) {
                  const style = TextStyle(
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  );
                  Widget text;
                  switch (value.toInt()) {
                    case 0:
                      text = const Text('周一', style: style);
                      break;
                    case 1:
                      text = const Text('周二', style: style);
                      break;
                    case 2:
                      text = const Text('周三', style: style);
                      break;
                    case 3:
                      text = const Text('周四', style: style);
                      break;
                    case 4:
                      text = const Text('周五', style: style);
                      break;
                    case 5:
                      text = const Text('周六', style: style);
                      break;
                    case 6:
                      text = const Text('周日', style: style);
                      break;
                    default:
                      text = const Text('', style: style);
                      break;
                  }
                  return SideTitleWidget(
                    axisSide: meta.axisSide,
                    child: text,
                  );
                },
              ),
            ),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                interval: 1,
                getTitlesWidget: (double value, TitleMeta meta) {
                  const style = TextStyle(
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  );
                  return Text('${value.toInt()}', style: style);
                },
                reservedSize: 42,
              ),
            ),
          ),
          borderData: FlBorderData(
            show: true,
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          minX: 0,
          maxX: 6,
          minY: 0,
          maxY: 10,
          lineBarsData: [
            LineChartBarData(
              spots: const [
                FlSpot(0, 3),
                FlSpot(1, 5),
                FlSpot(2, 2),
                FlSpot(3, 7),
                FlSpot(4, 4),
                FlSpot(5, 6),
                FlSpot(6, 3),
              ],
              isCurved: true,
              gradient: const LinearGradient(
                colors: [
                  Color(0xFFF59E0B),
                  Color(0xFFEF4444),
                ],
              ),
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFFF59E0B).withOpacity(0.3),
                    const Color(0xFFEF4444).withOpacity(0.1),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabSection() {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(16),
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
        children: [
            TabBar(
              controller: _tabController,
              labelColor: const Color(0xFF3B82F6),
              unselectedLabelColor: const Color(0xFF64748B),
              indicatorColor: const Color(0xFF3B82F6),
              indicatorWeight: 3,
              tabs: const [
                Tab(
                  icon: Icon(Icons.emoji_events_rounded),
                  text: '积分排行榜',
                ),
                Tab(
                  icon: Icon(Icons.people_rounded),
                  text: '学生管理',
                ),
                Tab(
                  icon: Icon(Icons.history_rounded),
                  text: '积分记录',
                ),
                Tab(
                  icon: Icon(Icons.analytics_rounded),
                  text: '数据分析',
                ),
              ],
            ),
            _buildSearchAndFilter(),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchAndFilter() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
      children: [
          Row(
            children: [
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: TextField(
                    controller: _searchController,
                    decoration: const InputDecoration(
                      hintText: '搜索学生姓名、学号...',
                      prefixIcon: Icon(Icons.search_rounded, color: Color(0xFF64748B)),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    onChanged: (value) {
      setState(() {
                        _searchQuery = value;
                      });
                    },
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedFilter,
                    onChanged: (value) {
      setState(() {
                        _selectedFilter = value!;
                      });
                    },
                    items: const [
                      DropdownMenuItem(value: 'all', child: Text('全部')),
                      DropdownMenuItem(value: 'top10', child: Text('前10名')),
                      DropdownMenuItem(value: 'top50', child: Text('前50名')),
                      DropdownMenuItem(value: 'high', child: Text('高分学生')),
                    ],
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    style: const TextStyle(color: Color(0xFF1E293B)),
                  ),
                ),
              ),
            ],
          ),
        ],
          ),
        );
      }
      
  Widget _buildContentSection() {
    return SliverFillRemaining(
      child: TabBarView(
        controller: _tabController,
        children: [
          _buildLeaderboard(),
          _buildStudentManagement(),
          _buildPointsHistory(),
          _buildAnalyticsView(),
        ],
      ),
    );
  }

  Widget _buildLeaderboard() {
    return Consumer2<StudentProvider, PointsProvider>(
      builder: (context, studentProvider, pointsProvider, child) {
        if (studentProvider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        final students = _getFilteredStudents(studentProvider.students, pointsProvider);
        final rankedStudents = _rankStudents(students, pointsProvider);

        if (rankedStudents.isEmpty) {
          return _buildEmptyState(
            icon: Icons.emoji_events_rounded,
            title: '暂无积分数据',
            subtitle: '系统中还没有积分记录',
          );
        }

        return RefreshIndicator(
          onRefresh: _loadData,
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: rankedStudents.length,
            itemBuilder: (context, index) {
              final student = rankedStudents[index];
              final rank = index + 1;
              return _buildLeaderboardCard(student, rank, pointsProvider);
            },
          ),
        );
      },
    );
  }

  Widget _buildLeaderboardCard(dynamic student, int rank, PointsProvider pointsProvider) {
    final studentName = student.getStringValue('student_name') ?? '未知学生';
    final studentId = student.getStringValue('student_id') ?? '';
    final standard = student.getStringValue('standard') ?? '';
    final points = pointsProvider.getTotalPointsForStudent(student.id);
    final isTopThree = rank <= 3;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: isTopThree ? Border.all(color: _getRankColor(rank), width: 2) : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
                    ),
                  ],
                ),
      child: Padding(
        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
            // 排名
                      Container(
              width: 48,
              height: 48,
                        decoration: BoxDecoration(
                color: _getRankColor(rank).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _getRankColor(rank).withOpacity(0.3)),
              ),
              child: Center(
                child: rank <= 3
                    ? Icon(_getRankIcon(rank), color: _getRankColor(rank), size: 24)
                    : Text(
                        rank.toString(),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: _getRankColor(rank),
                        ),
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
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 4),
                            Text(
                    '$studentId · $standard',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
            // 积分
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                Text(
                  '$points',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: _getRankColor(rank),
                  ),
                ),
                const Text(
                  '积分',
                          style: TextStyle(
                            fontSize: 12,
                    color: Color(0xFF64748B),
                          ),
                        ),
                      ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStudentManagement() {
    return Consumer2<StudentProvider, PointsProvider>(
      builder: (context, studentProvider, pointsProvider, child) {
        final students = _getFilteredStudents(studentProvider.students, pointsProvider);

        if (students.isEmpty) {
          return _buildEmptyState(
            icon: Icons.people_rounded,
            title: '暂无学生数据',
            subtitle: '系统中还没有学生信息',
          );
        }

        return RefreshIndicator(
          onRefresh: _loadData,
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: students.length,
            itemBuilder: (context, index) {
              final student = students[index];
              return _buildStudentCard(student, pointsProvider);
            },
          ),
        );
      },
    );
  }

  Widget _buildStudentCard(dynamic student, PointsProvider pointsProvider) {
    final studentName = student.getStringValue('student_name') ?? '未知学生';
    final studentId = student.getStringValue('student_id') ?? '';
    final standard = student.getStringValue('standard') ?? '';
    final points = pointsProvider.getTotalPointsForStudent(student.id);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.person_rounded,
                color: Color(0xFF3B82F6),
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    studentName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$studentId · $standard',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
        children: [
                Text(
                  '$points',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFF59E0B),
                  ),
                ),
                const Text(
                  '积分',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPointsHistory() {
    return Consumer<PointsProvider>(
      builder: (context, pointsProvider, child) {
        final transactions = pointsProvider.pointTransactions;

        if (transactions.isEmpty) {
          return _buildEmptyState(
            icon: Icons.history_rounded,
            title: '暂无积分记录',
            subtitle: '还没有积分交易记录',
          );
        }

        return RefreshIndicator(
          onRefresh: _loadData,
          child: ListView.builder(
          padding: const EdgeInsets.all(16),
            itemCount: transactions.length,
            itemBuilder: (context, index) {
              final transaction = transactions[index];
              return _buildTransactionCard(transaction);
            },
          ),
        );
      },
    );
  }

  Widget _buildTransactionCard(dynamic transaction) {
    final type = transaction.getStringValue('type') ?? '';
    final amount = transaction.getIntValue('amount') ?? 0;
    final reason = transaction.getStringValue('reason') ?? '';
    final createdAt = DateTime.tryParse(transaction.getStringValue('created') ?? '') ?? DateTime.now();
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
      child: Padding(
        padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
              width: 48,
              height: 48,
            decoration: BoxDecoration(
                color: type == 'earn' 
                    ? const Color(0xFF10B981).withOpacity(0.1)
                    : const Color(0xFFEF4444).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
                type == 'earn' ? Icons.add_rounded : Icons.remove_rounded,
                color: type == 'earn' ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                    reason,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 4),
                Text(
                    _formatDateTime(createdAt),
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF64748B),
                    ),
                ),
              ],
            ),
          ),
              Text(
              '${type == 'earn' ? '+' : '-'}$amount',
              style: TextStyle(
                fontSize: 20,
                  fontWeight: FontWeight.bold,
                color: type == 'earn' ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                ),
              ),
            ],
          ),
      ),
    );
  }

  Widget _buildAnalyticsView() {
    return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
          _buildAnalyticsCard(),
          const SizedBox(height: 16),
          _buildPerformanceMetrics(),
          const SizedBox(height: 16),
          _buildRecentActivity(),
        ],
      ),
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
              Container(
            padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              size: 48,
              color: const Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
                          fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 8),
                  Text(
            subtitle,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF64748B),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildAnalyticsCard() {
    return Consumer2<StudentProvider, PointsProvider>(
      builder: (context, studentProvider, pointsProvider, child) {
        final students = studentProvider.students;
        final transactions = pointsProvider.pointTransactions;
        
        // 计算平均积分
        int totalPoints = 0;
        int studentCount = 0;
    for (final student in students) {
      final points = pointsProvider.getTotalPointsForStudent(student.id);
          if (points > 0) {
            totalPoints += points;
            studentCount++;
          }
        }
        final avgPoints = studentCount > 0 ? (totalPoints / studentCount).round() : 0;
        
        // 计算活跃度（有积分交易的学生比例）
        final activeStudents = students.where((s) {
          return transactions.any((t) => t.getStringValue('student_id') == s.id);
        }).length;
        final activeRate = students.length > 0 ? (activeStudents / students.length * 100).round() : 0;
        
        // 计算获得率（有获得积分记录的学生比例）
        final earnedStudents = students.where((s) {
          return transactions.any((t) => 
            t.getStringValue('student_id') == s.id && 
            t.getStringValue('type') == 'earn'
          );
        }).length;
        final earnRate = students.length > 0 ? (earnedStudents / students.length * 100).round() : 0;
        
        // 计算使用率（有消费积分记录的学生比例）
        final spentStudents = students.where((s) {
          return transactions.any((t) => 
            t.getStringValue('student_id') == s.id && 
            t.getStringValue('type') == 'spend'
          );
        }).length;
        final spendRate = students.length > 0 ? (spentStudents / students.length * 100).round() : 0;
        
        return Container(
          padding: const EdgeInsets.all(20),
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
              const Text(
                '积分系统分析',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard('平均积分', '$avgPoints', Icons.trending_up_rounded, const Color(0xFF3B82F6)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard('活跃度', '$activeRate%', Icons.trending_up_rounded, const Color(0xFF10B981)),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard('获得率', '$earnRate%', Icons.star_rounded, const Color(0xFFF59E0B)),
            ),
                  const SizedBox(width: 12),
            Expanded(
                    child: _buildMetricCard('使用率', '$spendRate%', Icons.shopping_cart_rounded, const Color(0xFF8B5CF6)),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
                      fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF64748B),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildPerformanceMetrics() {
    return Container(
      padding: const EdgeInsets.all(20),
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
          const Text(
            '关键指标',
            style: TextStyle(
              fontSize: 18,
                        fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 16),
          _buildProgressBar('积分活跃度', 0.85, const Color(0xFF3B82F6)),
          const SizedBox(height: 12),
          _buildProgressBar('学生参与度', 0.92, const Color(0xFF10B981)),
          const SizedBox(height: 12),
          _buildProgressBar('系统使用率', 0.78, const Color(0xFFF59E0B)),
        ],
      ),
    );
  }

  Widget _buildProgressBar(String label, double value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF1E293B),
                fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
              '${(value * 100).toInt()}%',
              style: TextStyle(
                fontSize: 14,
                color: color,
                fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: value,
            backgroundColor: color.withOpacity(0.1),
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 8,
          ),
        ),
      ],
    );
  }

  Widget _buildRecentActivity() {
            return Container(
      padding: const EdgeInsets.all(20),
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
          const Text(
            '最近活动',
            style: TextStyle(
              fontSize: 18,
                        fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 16),
          _buildActivityItem('积分系统已更新', '刚刚', Icons.update_rounded, const Color(0xFFF59E0B)),
          _buildActivityItem('数据同步完成', '刚刚', Icons.sync_rounded, const Color(0xFF3B82F6)),
          _buildActivityItem('排行榜已刷新', '刚刚', Icons.refresh_rounded, const Color(0xFF10B981)),
        ],
      ),
    );
  }

  Widget _buildActivityItem(String title, String time, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
      decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 16),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF1E293B),
                    fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                  time,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
          ),
        ],
      ),
    );
  }

  // Helper methods
  List<dynamic> _getFilteredStudents(List<dynamic> students, PointsProvider pointsProvider) {
    List<dynamic> filteredStudents = students;

    if (_searchQuery.isNotEmpty) {
      filteredStudents = filteredStudents.where((s) {
        final searchQuery = _searchQuery.toLowerCase();
        final studentName = s.getStringValue('student_name') ?? '';
        final studentId = s.getStringValue('student_id') ?? '';
        
        return studentName.toLowerCase().contains(searchQuery) ||
               studentId.toLowerCase().contains(searchQuery);
      }).toList();
    }

    // Apply filter
    switch (_selectedFilter) {
      case 'top10':
        filteredStudents = filteredStudents.take(10).toList();
        break;
      case 'top50':
        filteredStudents = filteredStudents.take(50).toList();
        break;
      case 'high':
        filteredStudents = filteredStudents.where((s) {
          final points = pointsProvider.getTotalPointsForStudent(s.id);
          return points >= 100; // 高分学生定义为100分以上
        }).toList();
        break;
    }

    return filteredStudents;
  }

  List<dynamic> _rankStudents(List<dynamic> students, PointsProvider pointsProvider) {
    // Sort students by points in descending order
    students.sort((a, b) {
          final pointsA = pointsProvider.getTotalPointsForStudent(a.id);
          final pointsB = pointsProvider.getTotalPointsForStudent(b.id);
      return pointsB.compareTo(pointsA);
    });
    return students;
  }

  Map<String, dynamic> _getTopStudent(List<dynamic> students, PointsProvider pointsProvider) {
    if (students.isEmpty) return {'points': 0};
    
    var topStudent = students.first;
    var maxPoints = pointsProvider.getTotalPointsForStudent(topStudent.id);
    
    for (final student in students) {
      final points = pointsProvider.getTotalPointsForStudent(student.id);
      if (points > maxPoints) {
        maxPoints = points;
        topStudent = student;
      }
    }
    
    return {'student': topStudent, 'points': maxPoints};
  }

  Color _getRankColor(int rank) {
    switch (rank) {
      case 1:
        return const Color(0xFFF59E0B); // 金色
      case 2:
        return const Color(0xFF64748B); // 银色
      case 3:
        return const Color(0xFFCD7F32); // 铜色
      default:
        return const Color(0xFF3B82F6); // 蓝色
    }
  }

  IconData _getRankIcon(int rank) {
    switch (rank) {
      case 1:
        return Icons.emoji_events_rounded;
      case 2:
        return Icons.emoji_events_rounded;
      case 3:
        return Icons.emoji_events_rounded;
      default:
        return Icons.star_rounded;
    }
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.year}-${dateTime.month.toString().padLeft(2, '0')}-${dateTime.day.toString().padLeft(2, '0')} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}
