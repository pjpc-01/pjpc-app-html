import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../features/attendance/providers/attendance_provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../widgets/attendance_stats_grid.dart';
import '../widgets/attendance_records_list_enhanced.dart';
import '../widgets/attendance_filters.dart';

class AttendanceManagementScreen extends StatefulWidget {
  const AttendanceManagementScreen({super.key});

  @override
  State<AttendanceManagementScreen> createState() => _AttendanceManagementScreenState();
}

class _AttendanceManagementScreenState extends State<AttendanceManagementScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  String _selectedFilter = 'today';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    // 根据用户角色设置标签页数量
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    int tabCount = 2; // 默认：学生考勤 + 个人考勤
    
    if (authProvider.isAdmin) {
      tabCount = 3; // 管理员：学生考勤 + 教师考勤 + 个人考勤
    } else if (authProvider.isTeacher) {
      tabCount = 2; // 教师：学生考勤 + 个人考勤
    }
    
    _tabController = TabController(length: tabCount, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    if (authProvider.isAdmin) {
      // 管理员：加载所有考勤数据
      await Provider.of<AttendanceProvider>(context, listen: false).loadAttendanceRecords();
      await Provider.of<AttendanceProvider>(context, listen: false).loadTeacherAttendanceRecords();
    } else if (authProvider.isTeacher) {
      // 教师：加载学生考勤和自己的考勤
      await Provider.of<AttendanceProvider>(context, listen: false).loadAttendanceRecords();
      await Provider.of<AttendanceProvider>(context, listen: false).loadTeacherAttendanceRecords();
    }
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
          children: _buildTabViews(isSmallScreen),
        ),
      ),
    );
  }

  List<Widget> _buildTabViews(bool isSmallScreen) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    List<Widget> tabs = [];
    
    if (authProvider.isAdmin) {
      // 管理员：学生考勤 + 教师考勤 + 个人考勤
      tabs = [
        _buildStudentAttendanceTab(isSmallScreen),
        _buildTeacherAttendanceTab(isSmallScreen),
        _buildPersonalAttendanceTab(isSmallScreen),
      ];
    } else if (authProvider.isTeacher) {
      // 教师：学生考勤 + 个人考勤
      tabs = [
        _buildStudentAttendanceTab(isSmallScreen),
        _buildPersonalAttendanceTab(isSmallScreen),
      ];
    } else {
      // 其他角色：只有个人考勤
      tabs = [
        _buildPersonalAttendanceTab(isSmallScreen),
      ];
    }
    
    return tabs;
  }

  Widget _buildModernHeader(bool isSmallScreen) {
    return SliverAppBar(
      expandedHeight: isSmallScreen ? 120.0 : 140.0,
      floating: false,
      pinned: true,
      backgroundColor: AppTheme.primaryColor,
      elevation: 0,
      flexibleSpace: FlexibleSpaceBar(
        title: Text(
          '考勤管理',
          style: TextStyle(
            color: Colors.white,
            fontSize: isSmallScreen ? 18 : 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppTheme.primaryColor,
                AppTheme.primaryColor.withOpacity(0.8),
              ],
            ),
          ),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 20),
                Icon(
                  Icons.access_time_filled,
                  size: isSmallScreen ? 32 : 40,
                  color: Colors.white,
                ),
                const SizedBox(height: 8),
                Text(
                  '智能考勤管理系统',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: isSmallScreen ? 14 : 16,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatsSection(bool isSmallScreen) {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(16),
        child: AttendanceStatsGrid(
          isSmallScreen: isSmallScreen,
        ),
      ),
    );
  }

  Widget _buildTabBar(bool isSmallScreen) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    List<Tab> tabs = [];
    if (authProvider.isAdmin) {
      tabs = [
        const Tab(text: '学生考勤'),
        const Tab(text: '教师考勤'),
        const Tab(text: '我的考勤'),
      ];
    } else if (authProvider.isTeacher) {
      tabs = [
        const Tab(text: '学生考勤'),
        const Tab(text: '我的考勤'),
      ];
    } else {
      tabs = [
        const Tab(text: '我的考勤'),
      ];
    }

    return SliverToBoxAdapter(
      child: Container(
        color: Colors.white,
        child: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppTheme.primaryColor,
          indicatorWeight: 3,
          tabs: tabs,
        ),
      ),
    );
  }

  Widget _buildStudentAttendanceTab(bool isSmallScreen) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          AttendanceFilters(
            selectedFilter: _selectedFilter,
            searchQuery: _searchQuery,
            onFilterChanged: (filter) {
              setState(() {
                _selectedFilter = filter;
              });
            },
            onSearchChanged: (query) {
              setState(() {
                _searchQuery = query;
              });
            },
          ),
          const SizedBox(height: 16),
          Expanded(
            child: AttendanceRecordsListEnhanced(
              isSmallScreen: isSmallScreen,
              filter: _selectedFilter,
              searchQuery: _searchQuery,
              showStudentRecords: true,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTeacherAttendanceTab(bool isSmallScreen) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          AttendanceFilters(
            selectedFilter: _selectedFilter,
            searchQuery: _searchQuery,
            onFilterChanged: (filter) {
              setState(() {
                _selectedFilter = filter;
              });
            },
            onSearchChanged: (query) {
              setState(() {
                _searchQuery = query;
              });
            },
          ),
          const SizedBox(height: 16),
          Expanded(
            child: AttendanceRecordsListEnhanced(
              isSmallScreen: isSmallScreen,
              filter: _selectedFilter,
              searchQuery: _searchQuery,
              showTeacherRecords: true,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPersonalAttendanceTab(bool isSmallScreen) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          AttendanceFilters(
            selectedFilter: _selectedFilter,
            searchQuery: _searchQuery,
            onFilterChanged: (filter) {
              setState(() {
                _selectedFilter = filter;
              });
            },
            onSearchChanged: (query) {
              setState(() {
                _searchQuery = query;
              });
            },
          ),
          const SizedBox(height: 16),
          Expanded(
            child: AttendanceRecordsListEnhanced(
              isSmallScreen: isSmallScreen,
              filter: _selectedFilter,
              searchQuery: _searchQuery,
              showPersonalRecords: true,
            ),
          ),
        ],
      ),
    );
  }
}
