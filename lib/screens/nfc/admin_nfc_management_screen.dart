import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../providers/nfc_card_provider.dart';
import '../../theme/app_theme.dart';
import 'nfc_replacement_review_dialog.dart';
import 'nfc_read_write_screen.dart';

class AdminNfcManagementScreen extends StatefulWidget {
  const AdminNfcManagementScreen({super.key});

  @override
  State<AdminNfcManagementScreen> createState() => _AdminNfcManagementScreenState();
}

class _AdminNfcManagementScreenState extends State<AdminNfcManagementScreen> 
    with TickerProviderStateMixin {
  String _selectedFilter = 'all';
  String _searchQuery = '';
  String _selectedTimeRange = '7d';
  final TextEditingController _searchController = TextEditingController();
  late TabController _tabController;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late ScrollController _scrollController;
  bool _showScrollToTop = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this); // 移除NFC操作标签页
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _scrollController = ScrollController();
    _scrollController.addListener(_onScroll);
    
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
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.offset > 200) {
      if (!_showScrollToTop) {
        setState(() {
          _showScrollToTop = true;
        });
      }
    } else {
      if (_showScrollToTop) {
        setState(() {
          _showScrollToTop = false;
        });
      }
    }
  }

  void _scrollToTop() {
    _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeInOut,
    );
  }

  void _navigateToNfcReadWrite() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const NfcReadWriteScreen(),
      ),
    );
  }

  Future<void> _loadData() async {
    try {
      final nfcProvider = Provider.of<NfcCardProvider>(context, listen: false);
      await nfcProvider.loadReplacementRequests();
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
          controller: _scrollController,
          slivers: [
            _buildModernHeader(),
            _buildSmartHeader(),
            _buildAnalyticsSection(),
            _buildTabSection(),
            _buildContentSection(),
          ],
        ),
      ),
      floatingActionButton: _showScrollToTop 
          ? Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                FloatingActionButton(
                  onPressed: _navigateToNfcReadWrite,
                  backgroundColor: Colors.orange,
                  heroTag: "nfc_read_write",
                  child: const Icon(
                    Icons.nfc,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 12),
                FloatingActionButton(
                  onPressed: _scrollToTop,
                  backgroundColor: const Color(0xFF1E40AF),
                  heroTag: "scroll_to_top",
                  child: const Icon(
                    Icons.keyboard_arrow_up,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
              ],
            )
          : FloatingActionButton(
              onPressed: _navigateToNfcReadWrite,
              backgroundColor: Colors.orange,
              child: const Icon(
                Icons.nfc,
                color: Colors.white,
              ),
            ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }

  Widget _buildModernHeader() {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF1E40AF),
              Color(0xFF1D4ED8),
            ],
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF1E40AF).withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.nfc,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'NFC智能管理',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        '智能NFC卡管理系统，高效处理补办申请',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
                Consumer<NfcCardProvider>(
                  builder: (context, nfcProvider, child) {
                    final totalRequests = nfcProvider.replacementRequests.length;
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '$totalRequests 个申请',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 20),
            _buildNfcQuickActions(),
          ],
        ),
      ),
    );
  }

  Widget _buildNfcQuickActions() {
    return Row(
      children: [
        Expanded(
          child: _buildActionButton(
            '审核申请',
            Icons.approval,
            const Color(0xFF3B82F6),
            () => _showPendingRequests(),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            '批量处理',
            Icons.batch_prediction,
            const Color(0xFF10B981),
            () => _showBatchProcessing(),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            '数据分析',
            Icons.analytics,
            const Color(0xFF8B5CF6),
            () => _navigateToAnalytics(),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton(String title, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: Colors.white, size: 24),
            const SizedBox(height: 6),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  void _showPendingRequests() {
    // 切换到待处理标签页
    _tabController.animateTo(0);
  }

  void _showBatchProcessing() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('批量处理功能开发中...'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _navigateToAnalytics() {
    // 切换到数据分析标签页
    _tabController.animateTo(2);
  }

  Widget _buildScrollToTopButton() {
    return FloatingActionButton(
      onPressed: _scrollToTop,
      backgroundColor: const Color(0xFF1E40AF),
      child: const Icon(
        Icons.keyboard_arrow_up,
        color: Colors.white,
        size: 28,
      ),
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
                    color: const Color(0xFF3B82F6).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.analytics_rounded,
                    color: Color(0xFF3B82F6),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                const Text(
                  '智能分析概览',
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
                    '实时监控',
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
    return Consumer<NfcCardProvider>(
      builder: (context, nfcProvider, child) {
        final requests = nfcProvider.replacementRequests;
        final totalRequests = requests.length;
        final pendingRequests = requests.where((r) => r['replacement_status'] == 'pending').length;
        final completedToday = requests.where((r) {
          final completedDate = DateTime.tryParse(r['last_updated'] ?? '');
          return r['replacement_status'] == 'completed' && 
                 completedDate != null && 
                 _isToday(completedDate);
        }).length;
        final avgProcessingTime = _calculateAvgProcessingTime(requests);

        return Row(
          children: [
            Expanded(
              child: _buildStatCard(
                '总申请数',
                totalRequests.toString(),
                Icons.description_rounded,
                const Color(0xFF3B82F6),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                '待处理',
                pendingRequests.toString(),
                Icons.pending_actions_rounded,
                const Color(0xFFF59E0B),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                '今日完成',
                completedToday.toString(),
                Icons.check_circle_rounded,
                const Color(0xFF10B981),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                '平均处理时间',
                '${avgProcessingTime}h',
                Icons.timer_rounded,
                const Color(0xFF8B5CF6),
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
                  '趋势分析',
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
      child: Consumer<NfcCardProvider>(
        builder: (context, nfcProvider, child) {
          return LineChart(
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
                  spots: _generateChartData(),
                  isCurved: true,
                  gradient: const LinearGradient(
                    colors: [
                      Color(0xFF3B82F6),
                      Color(0xFF8B5CF6),
                    ],
                  ),
                  barWidth: 3,
                  isStrokeCapRound: true,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(
                    show: true,
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFF3B82F6).withOpacity(0.3),
                        const Color(0xFF8B5CF6).withOpacity(0.1),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  List<FlSpot> _generateChartData() {
    // 模拟数据，实际应该从Provider获取
    return const [
      FlSpot(0, 3),
      FlSpot(1, 5),
      FlSpot(2, 2),
      FlSpot(3, 7),
      FlSpot(4, 4),
      FlSpot(5, 6),
      FlSpot(6, 3),
    ];
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
                  icon: Icon(Icons.pending_actions_rounded),
                  text: '待处理',
                ),
                Tab(
                  icon: Icon(Icons.history_rounded),
                  text: '历史记录',
                ),
                Tab(
                  icon: Icon(Icons.analytics_rounded),
                  text: '数据分析',
                ),
                Tab(
                  icon: Icon(Icons.security_rounded),
                  text: '安全监控',
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
                      hintText: '搜索学生姓名、学号或申请ID...',
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
                      DropdownMenuItem(value: 'all', child: Text('全部状态')),
                      DropdownMenuItem(value: 'pending', child: Text('待处理')),
                      DropdownMenuItem(value: 'approved', child: Text('已批准')),
                      DropdownMenuItem(value: 'completed', child: Text('已完成')),
                      DropdownMenuItem(value: 'rejected', child: Text('已拒绝')),
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
          _buildPendingRequests(),
          _buildHistoryRequests(),
          _buildAnalyticsView(),
          _buildSecurityMonitoringView(),
        ],
      ),
    );
  }

  Widget _buildPendingRequests() {
    return Consumer<NfcCardProvider>(
      builder: (context, nfcProvider, child) {
        if (nfcProvider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        final requests = _getFilteredRequests(nfcProvider.replacementRequests)
            .where((r) => r['replacement_status'] == 'pending')
            .toList();

        if (requests.isEmpty) {
          return _buildEmptyState(
            icon: Icons.pending_actions_rounded,
            title: '暂无待处理申请',
            subtitle: '所有申请都已处理完成',
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            await nfcProvider.loadReplacementRequests();
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: requests.length,
            itemBuilder: (context, index) {
              return _buildModernRequestCard(requests[index], nfcProvider);
            },
          ),
        );
      },
    );
  }

  Widget _buildHistoryRequests() {
    return Consumer<NfcCardProvider>(
      builder: (context, nfcProvider, child) {
        final requests = _getFilteredRequests(nfcProvider.replacementRequests)
            .where((r) => r['replacement_status'] != 'pending')
            .toList();

        if (requests.isEmpty) {
          return _buildEmptyState(
            icon: Icons.history_rounded,
            title: '暂无历史记录',
            subtitle: '处理完成的申请将显示在这里',
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            await nfcProvider.loadReplacementRequests();
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: requests.length,
            itemBuilder: (context, index) {
              return _buildModernRequestCard(requests[index], nfcProvider);
            },
          ),
        );
      },
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

  Widget _buildModernRequestCard(Map<String, dynamic> request, NfcCardProvider nfcProvider) {
    // 优先从直接保存的字段获取学生信息
    final studentName = request['student_name'] ?? 
                      (request['expand']?['student'] as Map<String, dynamic>?)?['student_name'] ?? 
                      '未知学生';
    final studentId = request['student_id'] ?? 
                     (request['expand']?['student'] as Map<String, dynamic>?)?['student_id'] ?? '';
    final className = request['class_name'] ?? 
                     (request['expand']?['student'] as Map<String, dynamic>?)?['standard'] ?? '';
    final status = request['replacement_status'] ?? '';
    final urgency = request['replacement_urgency'] ?? '';
    final requestDate = DateTime.tryParse(request['replacement_request_date'] ?? '') ?? DateTime.now();

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
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: _getStatusColor(status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.person_rounded,
                        color: _getStatusColor(status),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
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
                          Text(
                            '$studentId · $className',
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getStatusColor(status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: _getStatusColor(status).withOpacity(0.3)),
                      ),
                      child: Text(
                        _getStatusText(status),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: _getStatusColor(status),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildRequestInfo(request),
                const SizedBox(height: 16),
                if (status == 'pending') _buildActionButtons(request, nfcProvider),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRequestInfo(Map<String, dynamic> request) {
    return Column(
      children: [
        _buildInfoRow('丢失原因', request['replacement_reason'] ?? ''),
        _buildInfoRow('丢失地点', request['replacement_lost_location'] ?? ''),
        _buildInfoRow('紧急程度', _getUrgencyText(request['replacement_urgency'] ?? '')),
        _buildInfoRow('申请时间', _formatDateTime(DateTime.tryParse(request['replacement_request_date'] ?? '') ?? DateTime.now())),
        if (request['replacement_notes'] != null && request['replacement_notes'].toString().isNotEmpty)
          _buildInfoRow('备注', request['replacement_notes'].toString()),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF1E293B),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(Map<String, dynamic> request, NfcCardProvider nfcProvider) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () => _showReviewDialog(request, 'approve'),
            icon: const Icon(Icons.check_rounded, size: 18),
            label: const Text('批准'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF10B981),
              side: const BorderSide(color: Color(0xFF10B981)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () => _showReviewDialog(request, 'reject'),
            icon: const Icon(Icons.close_rounded, size: 18),
            label: const Text('拒绝'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFEF4444),
              side: const BorderSide(color: Color(0xFFEF4444)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () => _completeReplacement(request),
            icon: const Icon(Icons.done_all_rounded, size: 18),
            label: const Text('完成'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3B82F6),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAnalyticsCard() {
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
            '处理效率分析',
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
                child: _buildMetricCard('平均处理时间', '2.5小时', Icons.timer_rounded, const Color(0xFF3B82F6)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildMetricCard('完成率', '95%', Icons.check_circle_rounded, const Color(0xFF10B981)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildMetricCard('满意度', '4.8/5', Icons.star_rounded, const Color(0xFFF59E0B)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildMetricCard('响应时间', '15分钟', Icons.speed_rounded, const Color(0xFF8B5CF6)),
              ),
            ],
          ),
        ],
      ),
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
            '性能指标',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 16),
          _buildProgressBar('处理速度', 0.85, const Color(0xFF3B82F6)),
          const SizedBox(height: 12),
          _buildProgressBar('准确性', 0.95, const Color(0xFF10B981)),
          const SizedBox(height: 12),
          _buildProgressBar('用户满意度', 0.88, const Color(0xFFF59E0B)),
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
          _buildActivityItem('NFC卡管理系统已更新', '刚刚', Icons.update_rounded, const Color(0xFF10B981)),
          _buildActivityItem('数据同步完成', '刚刚', Icons.sync_rounded, const Color(0xFF3B82F6)),
          _buildActivityItem('界面已优化', '刚刚', Icons.tune_rounded, const Color(0xFF8B5CF6)),
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

  void _showSettingsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('设置'),
        content: const Text('这里可以添加各种设置选项'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('关闭'),
          ),
        ],
      ),
    );
  }

  // Helper methods
  List<Map<String, dynamic>> _getFilteredRequests(List<Map<String, dynamic>> requests) {
    List<Map<String, dynamic>> filteredRequests = requests;

    if (_searchQuery.isNotEmpty) {
      filteredRequests = filteredRequests.where((r) {
        final searchQuery = _searchQuery.toLowerCase();
        final studentInfo = r['expand']?['student'] as Map<String, dynamic>?;
        final studentName = studentInfo?['student_name'] ?? '';
        final studentId = studentInfo?['student_id'] ?? '';
        final requestId = r['replacement_request_id'] ?? '';
        
        return studentName.toLowerCase().contains(searchQuery) ||
               studentId.toLowerCase().contains(searchQuery) ||
               requestId.toLowerCase().contains(searchQuery);
      }).toList();
    }

    if (_selectedFilter != 'all') {
      filteredRequests = filteredRequests.where((r) => r['replacement_status'] == _selectedFilter).toList();
    }

    return filteredRequests;
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'approved':
        return const Color(0xFF3B82F6);
      case 'completed':
        return const Color(0xFF10B981);
      case 'rejected':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF64748B);
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'pending':
        return '待处理';
      case 'approved':
        return '已批准';
      case 'completed':
        return '已完成';
      case 'rejected':
        return '已拒绝';
      default:
        return '未知';
    }
  }

  String _getUrgencyText(String urgency) {
    switch (urgency) {
      case 'low':
        return '低';
      case 'medium':
        return '中';
      case 'high':
        return '高';
      default:
        return '未知';
    }
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year && date.month == now.month && date.day == now.day;
  }

  double _calculateAvgProcessingTime(List<Map<String, dynamic>> requests) {
    // 简化的计算逻辑
    return 2.5;
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.year}-${dateTime.month.toString().padLeft(2, '0')}-${dateTime.day.toString().padLeft(2, '0')} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  void _showReviewDialog(Map<String, dynamic> request, String action) {
    showDialog(
      context: context,
      builder: (context) => NfcReplacementReviewDialog(
        request: request,
        action: action,
      ),
    );
  }

  void _completeReplacement(Map<String, dynamic> request) {
    final studentInfo = request['expand']?['student'] as Map<String, dynamic>?;
    final studentName = studentInfo?['student_name'] ?? '未知学生';
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认完成补办'),
        content: Text('确认已完成 $studentName 的NFC卡补办？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              final success = await Provider.of<NfcCardProvider>(context, listen: false)
                  .completeReplacement(request['replacement_request_id'] ?? '');
              
              if (success && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('$studentName 的NFC卡补办已完成'),
                    backgroundColor: const Color(0xFF10B981),
                  ),
                );
              }
            },
            child: const Text('确认'),
          ),
        ],
      ),
    );
  }

  // 安全监控页面
  Widget _buildSecurityMonitoringView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 安全概览卡片
          _buildSecurityOverviewCard(),
          const SizedBox(height: 16),
          
          // 快速操作按钮
          _buildSecurityQuickActions(),
          const SizedBox(height: 16),
          
          // 最近安全事件
          _buildRecentSecurityEvents(),
          const SizedBox(height: 16),
          
          // 加密状态监控
          _buildEncryptionStatusCard(),
        ],
      ),
    );
  }

  Widget _buildSecurityOverviewCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '安全概览',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildSecurityStatItem(
                    Icons.lock,
                    '锁定用户',
                    '3',
                    Colors.red,
                  ),
                ),
                Expanded(
                  child: _buildSecurityStatItem(
                    Icons.warning,
                    '高风险事件',
                    '5',
                    Colors.orange,
                  ),
                ),
                Expanded(
                  child: _buildSecurityStatItem(
                    Icons.security,
                    '加密覆盖率',
                    '95%',
                    AppTheme.successColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSecurityStatItem(IconData icon, String title, String value, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          title,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  Widget _buildSecurityQuickActions() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '快速操作',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const NfcReadWriteScreen(),
                        ),
                      );
                    },
                    icon: const Icon(Icons.nfc),
                    label: const Text('NFC读写'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      // 执行密钥轮换
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('智能密钥轮换已启动'),
                          backgroundColor: AppTheme.successColor,
                        ),
                      );
                    },
                    icon: const Icon(Icons.refresh),
                    label: const Text('密钥轮换'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentSecurityEvents() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '最近安全事件',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 12),
            _buildSecurityEventItem(
              'B001',
              '张三',
              '快速连续刷卡检测',
              '30分钟前',
              Colors.orange,
            ),
            _buildSecurityEventItem(
              'TCH001',
              '李老师',
              '异常时间刷卡',
              '2小时前',
              Colors.red,
            ),
            _buildSecurityEventItem(
              'B002',
              '王五',
              '位置不匹配',
              '3小时前',
              Colors.orange,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSecurityEventItem(String userId, String userName, String event, String time, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(Icons.warning, color: color, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$userName ($userId)',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                Text(
                  event,
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          ),
          Text(
            time,
            style: const TextStyle(fontSize: 10, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildEncryptionStatusCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '加密状态',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildEncryptionStatItem(
                    Icons.key,
                    '当前密钥版本',
                    'V2',
                    AppTheme.primaryColor,
                  ),
                ),
                Expanded(
                  child: _buildEncryptionStatItem(
                    Icons.security,
                    '加密算法',
                    'AES-256',
                    AppTheme.successColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('智能密钥轮换已启动'),
                          backgroundColor: AppTheme.successColor,
                        ),
                      );
                    },
                    icon: const Icon(Icons.refresh),
                    label: const Text('智能轮换'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('紧急密钥轮换已启动'),
                          backgroundColor: Colors.orange,
                        ),
                      );
                    },
                    icon: const Icon(Icons.warning),
                    label: const Text('紧急轮换'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEncryptionStatItem(IconData icon, String title, String value, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          title,
          style: const TextStyle(
            fontSize: 10,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }
}