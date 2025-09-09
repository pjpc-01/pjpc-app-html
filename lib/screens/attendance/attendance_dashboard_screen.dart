import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/attendance_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/attendance/nfc_scanner_widget.dart';
import '../../widgets/attendance/attendance_stats_grid.dart';
import '../../widgets/attendance/attendance_records_list.dart';
import '../../widgets/attendance/attendance_filters.dart';

class AttendanceDashboardScreen extends StatefulWidget {
  const AttendanceDashboardScreen({super.key});

  @override
  State<AttendanceDashboardScreen> createState() => _AttendanceDashboardScreenState();
}

class _AttendanceDashboardScreenState extends State<AttendanceDashboardScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  String _selectedFilter = 'today';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AttendanceProvider>(context, listen: false).loadAttendanceRecords();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenHeight < 700 || screenWidth < 360;
    
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          _buildSliverAppBar(isSmallScreen),
          _buildStatsSection(isSmallScreen),
          _buildTabBar(isSmallScreen),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildAttendanceRecordsTab(isSmallScreen),
            _buildNFCScannerTab(isSmallScreen),
            _buildAnalyticsTab(isSmallScreen),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showNFCScanner(context),
        backgroundColor: AppTheme.primaryColor,
        child: Icon(
          Icons.nfc, 
          color: Colors.white,
          size: isSmallScreen ? 20 : 24,
        ),
      ),
    );
  }

  Widget _buildSliverAppBar(bool isSmallScreen) {
    return SliverAppBar(
      expandedHeight: isSmallScreen ? 120 : 140,
      floating: false,
      pinned: true,
      backgroundColor: AppTheme.primaryColor,
      flexibleSpace: FlexibleSpaceBar(
        titlePadding: EdgeInsets.only(
          left: 16,
          bottom: isSmallScreen ? 8 : 12,
        ),
        title: Text(
          '考勤管理',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: isSmallScreen ? 16 : 18,
          ),
        ),
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppTheme.primaryColor,
                AppTheme.primaryVariant,
              ],
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(height: isSmallScreen ? 20 : 30),
              Icon(
                Icons.access_time,
                color: Colors.white,
                size: isSmallScreen ? 24 : 32,
              ),
              SizedBox(height: isSmallScreen ? 4 : 8),
              Text(
                '智能考勤系统',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: isSmallScreen ? 12 : 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: isSmallScreen ? 8 : 12),
            ],
          ),
        ),
      ),
      actions: [
        IconButton(
          onPressed: () => _showSearchDialog(context),
          icon: const Icon(Icons.search, color: Colors.white),
        ),
        IconButton(
          onPressed: () => _showFilterDialog(context),
          icon: const Icon(Icons.filter_list, color: Colors.white),
        ),
      ],
    );
  }

  Widget _buildStatsSection(bool isSmallScreen) {
    return SliverToBoxAdapter(
      child: Container(
        margin: EdgeInsets.all(isSmallScreen ? 8 : AppSpacing.md),
        child: AttendanceStatsGrid(),
      ),
    );
  }

  Widget _buildTabBar(bool isSmallScreen) {
    return SliverToBoxAdapter(
      child: Container(
        color: Colors.white,
        child: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.textTertiary,
          indicatorColor: AppTheme.primaryColor,
          indicatorWeight: 3,
          labelStyle: TextStyle(
            fontSize: isSmallScreen ? 12 : 16,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: TextStyle(
            fontSize: isSmallScreen ? 11 : 16,
            fontWeight: FontWeight.normal,
          ),
          tabs: const [
            Tab(text: '考勤记录'),
            Tab(text: 'NFC扫描'),
            Tab(text: '数据分析'),
          ],
        ),
      ),
    );
  }

  Widget _buildAttendanceRecordsTab(bool isSmallScreen) {
    return Consumer<AttendanceProvider>(
      builder: (context, attendanceProvider, child) {
        if (attendanceProvider.isLoading) {
          return const Center(
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
            ),
          );
        }

        if (attendanceProvider.error != null) {
          return _buildErrorState(attendanceProvider.error!);
        }

        return AttendanceRecordsList(
          records: attendanceProvider.attendanceRecords,
          onRefresh: () => attendanceProvider.loadAttendanceRecords(),
        );
      },
    );
  }

  Widget _buildNFCScannerTab(bool isSmallScreen) {
    return const NFCScannerWidget();
  }

  Widget _buildAnalyticsTab(bool isSmallScreen) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.analytics,
            size: 64,
            color: AppTheme.textTertiary,
          ),
          SizedBox(height: 16),
          Text(
            '数据分析功能',
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

  Widget _buildErrorState(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            size: 64,
            color: AppTheme.errorColor,
          ),
          const SizedBox(height: 16),
          Text(
            '加载失败',
            style: AppTextStyles.headline4,
          ),
          const SizedBox(height: 8),
          Text(
            error,
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppTheme.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              Provider.of<AttendanceProvider>(context, listen: false)
                  .loadAttendanceRecords();
            },
            child: const Text('重试'),
          ),
        ],
      ),
    );
  }

  void _showNFCScanner(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const NFCScannerWidget(),
    );
  }


  void _showSearchDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('搜索考勤记录'),
        content: TextField(
          decoration: const InputDecoration(
            labelText: '学生姓名或学号',
            hintText: '请输入搜索关键词',
            prefixIcon: Icon(Icons.search),
          ),
          onChanged: (value) => _searchQuery = value,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // 执行搜索
            },
            child: const Text('搜索'),
          ),
        ],
      ),
    );
  }

  void _showFilterDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('筛选条件'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('今日'),
              leading: Radio<String>(
                value: 'today',
                groupValue: _selectedFilter,
                onChanged: (value) {
                  setState(() => _selectedFilter = value!);
                },
              ),
            ),
            ListTile(
              title: const Text('本周'),
              leading: Radio<String>(
                value: 'week',
                groupValue: _selectedFilter,
                onChanged: (value) {
                  setState(() => _selectedFilter = value!);
                },
              ),
            ),
            ListTile(
              title: const Text('本月'),
              leading: Radio<String>(
                value: 'month',
                groupValue: _selectedFilter,
                onChanged: (value) {
                  setState(() => _selectedFilter = value!);
                },
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
              // 应用筛选
            },
            child: const Text('应用'),
          ),
        ],
      ),
    );
  }

}

