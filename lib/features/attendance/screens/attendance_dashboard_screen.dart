import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../features/attendance/providers/attendance_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../widgets/attendance_nfc_scanner_widget.dart';
import '../widgets/attendance_stats_grid.dart';
import '../widgets/attendance_records_list.dart';
import '../widgets/attendance_filters.dart';

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
    _tabController = TabController(length: 2, vsync: this);
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
      backgroundColor: const Color(0xFFF8FAFC),
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          _buildModernHeader(isSmallScreen),
          _buildStatsSection(isSmallScreen),
          _buildTabBar(isSmallScreen),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildAttendanceRecordsTab(isSmallScreen),
            _buildAnalyticsTab(isSmallScreen),
          ],
        ),
      ),
      floatingActionButton: _buildEnterpriseFloatingActionButton(isSmallScreen),
    );
  }

  Widget _buildModernHeader(bool isSmallScreen) {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF10B981),
              Color(0xFF059669),
            ],
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF10B981).withOpacity(0.3),
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
                    Icons.access_time,
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
                        '考勤管理',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        '智能考勤系统，轻松管理学生出勤',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
                Consumer<AttendanceProvider>(
                  builder: (context, attendanceProvider, child) {
                    final totalRecords = attendanceProvider.attendanceRecords.length;
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '$totalRecords 条记录',
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
            _buildAttendanceQuickActions(isSmallScreen),
          ],
        ),
      ),
    );
  }

  Widget _buildAttendanceQuickActions(bool isSmallScreen) {
    return Row(
      children: [
        Expanded(
          child: _buildNfcActionButton(isSmallScreen),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            '手动签到',
            Icons.touch_app,
            const Color(0xFFF59E0B),
            () => _showManualCheckIn(),
            isSmallScreen,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            '导出报告',
            Icons.download,
            const Color(0xFF8B5CF6),
            () => _exportAttendanceReport(),
            isSmallScreen,
          ),
        ),
      ],
    );
  }

  Widget _buildNfcActionButton(bool isSmallScreen) {
    return GestureDetector(
      onTap: () => _showNFCScanner(context),
      child: Container(
        padding: EdgeInsets.symmetric(
          vertical: isSmallScreen ? 14 : 18, 
          horizontal: 12,
        ),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF10B981),
              Color(0xFF059669),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF10B981).withOpacity(0.4),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
          border: Border.all(
            color: Colors.white.withOpacity(0.3),
            width: 1.5,
          ),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.nfc,
                color: Colors.white,
                size: 24,
              ),
            ),
            SizedBox(height: isSmallScreen ? 6 : 8),
            Text(
              'NFC打卡',
              style: TextStyle(
                color: Colors.white,
                fontSize: isSmallScreen ? 11 : 13,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: isSmallScreen ? 2 : 4),
            Text(
              '快速扫描',
              style: TextStyle(
                color: Colors.white.withOpacity(0.8),
                fontSize: isSmallScreen ? 8 : 10,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton(String title, IconData icon, Color color, VoidCallback onTap, bool isSmallScreen) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
          vertical: isSmallScreen ? 12 : 16, 
          horizontal: 8,
        ),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: Colors.white, size: isSmallScreen ? 20 : 24),
            SizedBox(height: isSmallScreen ? 4 : 6),
            Text(
              title,
              style: TextStyle(
                color: Colors.white,
                fontSize: isSmallScreen ? 10 : 12,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  void _showManualCheckIn() {
    // TODO: 实现手动签到功能
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('手动签到功能开发中...'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _exportAttendanceReport() {
    // TODO: 实现导出考勤报告功能
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('导出报告功能开发中...'),
        duration: Duration(seconds: 2),
      ),
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

  // 已精简：移除NFC扫描Tab，仅保留悬浮按钮入口

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

  Widget _buildEnterpriseFloatingActionButton(bool isSmallScreen) {
    return Container(
      width: isSmallScreen ? 64 : 72,
      height: isSmallScreen ? 64 : 72,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF10B981),
            Color(0xFF059669),
          ],
        ),
        borderRadius: BorderRadius.circular(isSmallScreen ? 32 : 36),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF10B981).withOpacity(0.4),
            blurRadius: 20,
            offset: const Offset(0, 8),
            spreadRadius: 2,
          ),
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: Colors.white.withOpacity(0.3),
          width: 2,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(isSmallScreen ? 32 : 36),
          onTap: () => _showNFCScanner(context),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(isSmallScreen ? 32 : 36),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.nfc,
                    color: Colors.white,
                    size: isSmallScreen ? 20 : 24,
                  ),
                ),
                SizedBox(height: isSmallScreen ? 2 : 4),
                Text(
                  'NFC',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: isSmallScreen ? 8 : 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showNFCScanner(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const AttendanceNFCScannerWidget(),
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

