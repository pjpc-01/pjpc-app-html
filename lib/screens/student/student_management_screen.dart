import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../providers/student_provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import 'student_profile_screen.dart';
import 'add_edit_student_screen.dart';

class StudentManagementScreen extends StatefulWidget {
  const StudentManagementScreen({super.key});

  @override
  State<StudentManagementScreen> createState() => _StudentManagementScreenState();
}

class _StudentManagementScreenState extends State<StudentManagementScreen> 
    with TickerProviderStateMixin {
  String _searchQuery = '';
  String _selectedFilter = 'all';
  String _selectedCenter = '全部中心';
  String _selectedStandard = '全部班级';
  String _sortBy = 'name';
  String _selectedTimeRange = '7d';
  Set<String> _selectedStudents = {};
  List<String> _recentSearches = [];
  bool _showAnalytics = true;
  bool _showAdvancedFilters = false;
  bool _showScrollToTop = false;
  
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  late TabController _tabController;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    
    // 设置滚动监听器
    _scrollController.addListener(_onScroll);
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
        Provider.of<StudentProvider>(context, listen: false).loadStudents();
      _animationController.forward();
    });
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

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    _tabController.dispose();
    _animationController.dispose();
    super.dispose();
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
            _buildSmartHeader(),
            _buildTabSection(),
            _buildContentSection(),
        ],
        ),
      ),
      floatingActionButton: _showScrollToTop ? _buildScrollToTopButton() : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }

  Widget _buildScrollToTopButton() {
    return FloatingActionButton(
      onPressed: _scrollToTop,
      backgroundColor: const Color(0xFF3B82F6),
      foregroundColor: Colors.white,
      elevation: 4,
      mini: true,
      child: const Icon(Icons.keyboard_arrow_up, size: 24),
    );
  }

  Widget _buildSmartHeader() {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF3B82F6),
              Color(0xFF1D4ED8),
            ],
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF3B82F6).withOpacity(0.3),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(
                    Icons.school,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
                const SizedBox(width: 20),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '我的学生',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        '快速管理您的学生信息',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
                Consumer<StudentProvider>(
                  builder: (context, studentProvider, child) {
                    final totalStudents = studentProvider.students.length;
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '$totalStudents 名学生',
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
            _buildTeacherQuickActions(),
          ],
        ),
      ),
    );
  }

  Widget _buildTeacherQuickActions() {
    return Row(
      children: [
        Expanded(
          child: _buildActionButton(
            '添加学生',
            Icons.person_add,
            const Color(0xFF10B981),
            () => _addNewStudent(),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            '批量操作',
            Icons.checklist,
            const Color(0xFFF59E0B),
            () => _showBulkOperations(),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            '导出名单',
            Icons.download,
            const Color(0xFF8B5CF6),
            () => _exportStudentList(),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton(String title, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
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

  void _addNewStudent() {
    // TODO: 实现添加学生功能
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AddEditStudentScreen(),
      ),
    );
  }

  void _exportStudentList() {
    // TODO: 实现导出学生名单功能
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('导出功能开发中...'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  Widget _buildQuickStats() {
    return Consumer<StudentProvider>(
      builder: (context, studentProvider, child) {
        final students = studentProvider.students;
        final totalStudents = students.length;
        final activeStudents = students.where((s) => s.getStringValue('status') == 'active').length;
        final newStudentsThisMonth = students.where((s) {
          final createdAt = DateTime.tryParse(s.getStringValue('created') ?? '');
          return createdAt != null && _isThisMonth(createdAt);
        }).length;
        final avgAge = _calculateAverageAge(students);

        return Row(
          children: [
            Expanded(
              child: _buildStatCard(
                '总学生',
                totalStudents.toString(),
                Icons.people_outline,
                const Color(0xFF3B82F6),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                '活跃学生',
                activeStudents.toString(),
                Icons.person_outline,
                const Color(0xFF10B981),
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
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
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
                  fontSize: 12,
                  color: Color(0xFF64748B),
                ),
              ),
            ],
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
                  '学生分布分析',
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
            _buildDistributionChart(),
          ],
        ),
      ),
    );
  }

  Widget _buildDistributionChart() {
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
      child: Consumer<StudentProvider>(
        builder: (context, studentProvider, child) {
          return PieChart(
            PieChartData(
              sectionsSpace: 2,
              centerSpaceRadius: 40,
              sections: _generatePieChartData(studentProvider.students),
            ),
          );
        },
      ),
    );
  }

  List<PieChartSectionData> _generatePieChartData(List<dynamic> students) {
    final Map<String, int> classDistribution = {};
    
    for (final student in students) {
      final standard = student.getStringValue('standard') ?? '未知班级';
      classDistribution[standard] = (classDistribution[standard] ?? 0) + 1;
    }

    final colors = [
      const Color(0xFF3B82F6),
      const Color(0xFF10B981),
      const Color(0xFFF59E0B),
      const Color(0xFFEF4444),
      const Color(0xFF8B5CF6),
    ];

    return classDistribution.entries.map((entry) {
      final index = classDistribution.keys.toList().indexOf(entry.key);
      return PieChartSectionData(
        color: colors[index % colors.length],
        value: entry.value.toDouble(),
        title: entry.key,
        radius: 50,
        titleStyle: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      );
    }).toList();
  }

  Widget _buildTabSection() {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
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
                  icon: Icon(Icons.people, size: 20),
                  text: '学生列表',
                ),
                Tab(
                  icon: Icon(Icons.favorite, size: 20),
                  text: '重点关注',
                ),
              ],
            ),
            _buildSmartSearchAndFilter(),
          ],
        ),
      ),
    );
  }

  Widget _buildSmartSearchAndFilter() {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // 智能搜索框
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: '🔍 搜索学生姓名、学号或班级...',
                prefixIcon: const Icon(Icons.search, color: Color(0xFF3B82F6), size: 24),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Color(0xFF64748B), size: 24),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                            _searchQuery = '';
                          });
                        },
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              ),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
            ),
          ),
          const SizedBox(height: 12),
          // 快速筛选按钮
          Row(
            children: [
              Expanded(
                child: _buildFilterChip(
                  '全部学生',
                  _selectedFilter == 'all',
                  () => setState(() => _selectedFilter = 'all'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildFilterChip(
                  '活跃学生',
                  _selectedFilter == 'active',
                  () => setState(() => _selectedFilter = 'active'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildFilterChip(
                  '我的班级',
                  _selectedFilter == 'my_class',
                  () => setState(() => _selectedFilter = 'my_class'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFFE2E8F0),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : const Color(0xFF64748B),
            fontSize: 14,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }

  String _getFilterDescription() {
    List<String> filters = [];
    
    if (_searchQuery.isNotEmpty) {
      filters.add('搜索"$_searchQuery"');
    }
    if (_selectedFilter != 'all') {
      String statusText = '';
      switch (_selectedFilter) {
        case 'active': statusText = '活跃'; break;
        case 'inactive': statusText = '非活跃'; break;
        case 'graduated': statusText = '已毕业'; break;
      }
      filters.add('状态：$statusText');
    }
    if (_selectedCenter != '全部中心') {
      filters.add('中心：$_selectedCenter');
    }
    if (_selectedStandard != '全部班级') {
      filters.add('班级：$_selectedStandard');
    }
    
    return filters.isEmpty ? '无筛选条件' : filters.join('，');
  }

  void _clearAllFilters() {
    setState(() {
      _searchQuery = '';
      _selectedFilter = 'all';
      _selectedCenter = '全部中心';
      _selectedStandard = '全部班级';
      _sortBy = 'name';
    });
    _searchController.clear();
  }

  Widget _buildContentSection() {
    return SliverFillRemaining(
      child: TabBarView(
        controller: _tabController,
        children: [
          _buildAllStudents(),
          _buildFocusStudents(),
        ],
      ),
    );
  }

  Widget _buildFocusStudents() {
    return Consumer<StudentProvider>(
      builder: (context, studentProvider, child) {
        if (studentProvider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        final students = _getFilteredStudents(studentProvider.students);
        // 重点关注的学生（可以根据需要调整筛选条件）
        final focusStudents = students.where((s) {
          final status = s.getStringValue('status');
          final createdAt = DateTime.tryParse(s.getStringValue('created') ?? '');
          final isNewStudent = createdAt != null && 
              DateTime.now().difference(createdAt).inDays < 30;
          return status == 'active' && isNewStudent;
        }).toList();

        if (focusStudents.isEmpty) {
          return _buildEmptyState(
            icon: Icons.favorite_border,
            title: '暂无重点关注学生',
            subtitle: '新注册或需要特别关注的学生会显示在这里',
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            await studentProvider.loadStudents();
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: focusStudents.length,
            itemBuilder: (context, index) {
              return _buildFocusStudentCard(focusStudents[index], studentProvider);
            },
          ),
        );
      },
    );
  }

  Widget _buildFocusStudentCard(dynamic student, StudentProvider studentProvider) {
    final studentName = student.getStringValue('student_name') ?? '未知学生';
    final studentId = student.getStringValue('student_id') ?? '';
    final standard = student.getStringValue('standard') ?? '未知班级';
    final status = student.getStringValue('status') ?? 'active';
    final createdAt = DateTime.tryParse(student.getStringValue('created') ?? '');
    final isNewStudent = createdAt != null && 
        DateTime.now().difference(createdAt).inDays < 30;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
        border: Border.all(
          color: isNewStudent ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
          width: 2,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: isNewStudent ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                  child: Text(
                    studentName.isNotEmpty ? studentName[0] : '?',
                    style: const TextStyle(
                      color: Colors.white,
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
                        studentName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      Text(
                        '学号：$studentId | $standard',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isNewStudent ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    isNewStudent ? '新生' : '需关注',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _viewStudentProfile(student),
                    icon: const Icon(Icons.visibility, size: 16),
                    label: const Text('查看详情'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF3B82F6),
                      side: const BorderSide(color: Color(0xFF3B82F6)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _editStudent(student),
                    icon: const Icon(Icons.edit, size: 16),
                    label: const Text('编辑'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
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

  Widget _buildAllStudents() {
    return Consumer<StudentProvider>(
      builder: (context, studentProvider, child) {
        if (studentProvider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        final students = _getFilteredStudents(studentProvider.students);

        if (students.isEmpty) {
          return _buildEmptyState(
            icon: Icons.people_rounded,
            title: '暂无学生数据',
            subtitle: '系统中还没有学生信息',
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            await studentProvider.loadStudents();
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: students.length,
            itemBuilder: (context, index) {
              return _buildModernStudentCard(students[index], studentProvider);
            },
          ),
        );
      },
    );
  }

  Widget _buildActiveStudents() {
    return Consumer<StudentProvider>(
      builder: (context, studentProvider, child) {
        final students = _getFilteredStudents(studentProvider.students)
            .where((s) => s.getStringValue('status') == 'active')
            .toList();

        if (students.isEmpty) {
          return _buildEmptyState(
            icon: Icons.person_rounded,
            title: '暂无活跃学生',
            subtitle: '当前没有活跃状态的学生',
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            await studentProvider.loadStudents();
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: students.length,
            itemBuilder: (context, index) {
              return _buildModernStudentCard(students[index], studentProvider);
            },
          ),
        );
      },
    );
  }

  Widget _buildNewStudents() {
    return Consumer<StudentProvider>(
      builder: (context, studentProvider, child) {
        final students = _getFilteredStudents(studentProvider.students)
            .where((s) {
              final createdAt = DateTime.tryParse(s.getStringValue('created') ?? '');
              return createdAt != null && _isThisMonth(createdAt);
            })
            .toList();

        if (students.isEmpty) {
          return _buildEmptyState(
            icon: Icons.person_add_rounded,
            title: '本月暂无新生',
            subtitle: '本月还没有新注册的学生',
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            await studentProvider.loadStudents();
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: students.length,
            itemBuilder: (context, index) {
              return _buildModernStudentCard(students[index], studentProvider);
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

  Widget _buildModernStudentCard(dynamic student, StudentProvider studentProvider) {
    final studentName = student.getStringValue('student_name') ?? '未知学生';
    final studentId = student.getStringValue('student_id') ?? '';
    final standard = student.getStringValue('standard') ?? '';
    final status = student.getStringValue('status') ?? 'active';
    final createdAt = DateTime.tryParse(student.getStringValue('created') ?? '') ?? DateTime.now();
    final isSelected = _selectedStudents.contains(student.id);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        border: isSelected ? Border.all(color: const Color(0xFF3B82F6), width: 2) : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        ),
        child: InkWell(
          onTap: () {
          setState(() {
            if (isSelected) {
              _selectedStudents.remove(student.id);
            } else {
              _selectedStudents.add(student.id);
            }
          });
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
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
                          '$studentId · $standard',
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
              Row(
                        children: [
                  Expanded(
                    child: _buildInfoItem('注册时间', _formatDateTime(createdAt)),
                  ),
                  Expanded(
                    child: _buildInfoItem('状态', _getStatusText(status)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _viewStudentProfile(student),
                      icon: const Icon(Icons.visibility_rounded, size: 14),
                      label: const Text(
                        '查看详情',
                        style: TextStyle(fontSize: 12),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF3B82F6),
                        side: const BorderSide(color: Color(0xFF3B82F6)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 6),
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _editStudent(student),
                      icon: const Icon(Icons.edit_rounded, size: 14),
                      label: const Text(
                        '编辑',
                        style: TextStyle(fontSize: 12),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 6),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            color: Color(0xFF1E293B),
            fontWeight: FontWeight.w500,
                            ),
          ),
        ],
    );
  }

  Widget _buildAnalyticsCard() {
    return Consumer<StudentProvider>(
      builder: (context, studentProvider, child) {
        final students = studentProvider.students;
        final totalStudents = students.length;
        final activeStudents = students.where((s) => s.getStringValue('status') == 'active').length;
        final uniqueStandards = students.map((s) => s.getStringValue('standard')).toSet().length;
        final uniqueCenters = students.map((s) => s.getStringValue('center')).toSet().length;
        
        // 计算平均年龄（如果有生日数据）
        double avgAge = 0.0;
        int validAges = 0;
        for (final student in students) {
          final dob = student.getStringValue('date_of_birth');
          if (dob.isNotEmpty) {
            try {
              final birthDate = DateTime.parse(dob);
              final age = DateTime.now().year - birthDate.year;
              if (age > 0 && age < 100) {
                avgAge += age;
                validAges++;
              }
            } catch (e) {
              // 忽略无效日期
            }
          }
        }
        avgAge = validAges > 0 ? avgAge / validAges : 0.0;
        
        // 计算活跃率
        final activeRate = totalStudents > 0 ? (activeStudents / totalStudents * 100).round() : 0;
        
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
                '学生数据分析',
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
                    child: _buildMetricCard(
                      '平均年龄', 
                      avgAge > 0 ? '${avgAge.toStringAsFixed(1)}岁' : '暂无数据', 
                      Icons.cake_rounded, 
                      const Color(0xFF3B82F6)
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard(
                      '班级分布', 
                      '$uniqueStandards个班级', 
                      Icons.class_rounded, 
                      const Color(0xFF10B981)
              ),
            ),
          ],
        ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard(
                      '活跃率', 
                      '$activeRate%', 
                      Icons.trending_up_rounded, 
                      const Color(0xFFF59E0B)
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard(
                      '中心分布', 
                      '$uniqueCenters个中心', 
                      Icons.location_on_rounded, 
                      const Color(0xFF8B5CF6)
                    ),
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
          _buildProgressBar('学生满意度', 0.92, const Color(0xFF3B82F6)),
          const SizedBox(height: 12),
          _buildProgressBar('出勤率', 0.88, const Color(0xFF10B981)),
          const SizedBox(height: 12),
          _buildProgressBar('家长参与度', 0.85, const Color(0xFFF59E0B)),
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
          _buildActivityItem('系统数据已更新', '刚刚', Icons.update_rounded, const Color(0xFF3B82F6)),
          _buildActivityItem('数据同步完成', '刚刚', Icons.sync_rounded, const Color(0xFF10B981)),
          _buildActivityItem('界面已优化', '刚刚', Icons.tune_rounded, const Color(0xFFF59E0B)),
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
  List<dynamic> _getFilteredStudents(List<dynamic> students) {
    List<dynamic> filteredStudents = students;

    if (_searchQuery.isNotEmpty) {
      filteredStudents = filteredStudents.where((s) {
        final searchQuery = _searchQuery.toLowerCase();
        final studentName = s.getStringValue('student_name') ?? '';
        final studentId = s.getStringValue('student_id') ?? '';
        final standard = s.getStringValue('standard') ?? '';
        final parentName = s.getStringValue('parent_name') ?? '';
        
        return studentName.toLowerCase().contains(searchQuery) ||
               studentId.toLowerCase().contains(searchQuery) ||
               standard.toLowerCase().contains(searchQuery) ||
               parentName.toLowerCase().contains(searchQuery);
      }).toList();
    }

    if (_selectedFilter != 'all') {
      filteredStudents = filteredStudents.where((s) => s.getStringValue('status') == _selectedFilter).toList();
    }

    if (_selectedCenter != '全部中心') {
      filteredStudents = filteredStudents.where((s) => s.getStringValue('center') == _selectedCenter).toList();
    }

    if (_selectedStandard != '全部班级') {
      filteredStudents = filteredStudents.where((s) => s.getStringValue('standard') == _selectedStandard).toList();
    }

    // Sort students
    filteredStudents.sort((a, b) {
      switch (_sortBy) {
        case 'name':
          return (a.getStringValue('student_name') ?? '').compareTo(b.getStringValue('student_name') ?? '');
        case 'age':
          return (int.tryParse(a.getStringValue('age') ?? '0') ?? 0).compareTo(int.tryParse(b.getStringValue('age') ?? '0') ?? 0);
        case 'created':
          final dateA = DateTime.tryParse(a.getStringValue('created') ?? '') ?? DateTime(1970);
          final dateB = DateTime.tryParse(b.getStringValue('created') ?? '') ?? DateTime(1970);
          return dateB.compareTo(dateA);
        case 'standard':
          return (a.getStringValue('standard') ?? '').compareTo(b.getStringValue('standard') ?? '');
        default:
          return 0;
      }
    });

    return filteredStudents;
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'active':
        return const Color(0xFF10B981);
      case 'inactive':
        return const Color(0xFFF59E0B);
      case 'graduated':
        return const Color(0xFF64748B);
      default:
        return const Color(0xFF3B82F6);
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'active':
        return '活跃';
      case 'inactive':
        return '非活跃';
      case 'graduated':
        return '已毕业';
      default:
        return '未知';
    }
  }

  bool _isThisMonth(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year && date.month == now.month;
  }

  double _calculateAverageAge(List<dynamic> students) {
    if (students.isEmpty) return 0.0;
    
    double totalAge = 0;
    int validAges = 0;
    
    for (final student in students) {
      final age = int.tryParse(student.getStringValue('age') ?? '');
      if (age != null && age > 0) {
        totalAge += age;
        validAges++;
      }
    }
    
    return validAges > 0 ? totalAge / validAges : 0.0;
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.year}-${dateTime.month.toString().padLeft(2, '0')}-${dateTime.day.toString().padLeft(2, '0')}';
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

  void _showBulkOperations() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '批量操作 (${_selectedStudents.length}个学生)',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                            onPressed: () {
                      Navigator.pop(context);
                      // 批量导出
                    },
                    icon: const Icon(Icons.download_rounded),
                    label: const Text('导出'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
                      // 批量发送通知
            },
                    icon: const Icon(Icons.notifications_rounded),
                    label: const Text('通知'),
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
                      Navigator.pop(context);
                      // 批量更新状态
                    },
                    icon: const Icon(Icons.update_rounded),
                    label: const Text('更新状态'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
                      setState(() {
                        _selectedStudents.clear();
                      });
            },
                    icon: const Icon(Icons.clear_all_rounded),
                    label: const Text('清除选择'),
            ),
          ),
        ],
            ),
          ],
        ),
      ),
    );
  }

  void _viewStudentProfile(dynamic student) {
        Navigator.push(
          context,
          MaterialPageRoute(
        builder: (context) => StudentProfileScreen(studentId: student.id),
      ),
    );
  }

  void _editStudent(dynamic student) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditStudentScreen(student: student),
      ),
    );
  }
}

