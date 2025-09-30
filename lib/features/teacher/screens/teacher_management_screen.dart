import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../teacher/providers/teacher_provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import 'add_edit_teacher_screen.dart';

class TeacherManagementScreen extends StatefulWidget {
  const TeacherManagementScreen({super.key});

  @override
  State<TeacherManagementScreen> createState() => _TeacherManagementScreenState();
}

class _TeacherManagementScreenState extends State<TeacherManagementScreen> 
    with TickerProviderStateMixin {
  String _searchQuery = '';
  String _selectedFilter = 'all';
  String _selectedDepartment = 'all';
  final TextEditingController _searchController = TextEditingController();
  late TabController _tabController;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late ScrollController _scrollController;
  bool _showScrollToTop = false;

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
    _scrollController = ScrollController();
    _scrollController.addListener(_onScroll);
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TeacherProvider>().loadTeachers();
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

  // 强制刷新数据
  Future<void> _forceRefreshData() async {
    try {
      final teacherProvider = context.read<TeacherProvider>();
      
      // 显示加载提示
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('正在强制刷新数据...'),
          backgroundColor: Color(0xFF3B82F6),
          duration: Duration(seconds: 2),
        ),
      );
      
      // 强制刷新
      await teacherProvider.forceRefreshTeachers();
      
      // 显示结果
      if (teacherProvider.teachers.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('⚠️ 服务器端没有教师记录！请检查数据或添加新教师'),
            backgroundColor: Color(0xFFEF4444),
            duration: Duration(seconds: 5),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ 刷新成功！找到 ${teacherProvider.teachers.length} 个教师记录'),
            backgroundColor: const Color(0xFF10B981),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('刷新失败: $e'),
          backgroundColor: const Color(0xFFEF4444),
          duration: const Duration(seconds: 5),
        ),
      );
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
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF3B82F6),
              Color(0xFF1D4ED8),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF3B82F6).withOpacity(0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
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
                    Icons.school_rounded,
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
                        '教师管理',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        '管理教师信息和权限',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
                Consumer<TeacherProvider>(
                  builder: (context, teacherProvider, child) {
                    final stats = teacherProvider.statistics;
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${stats['total']} 名教师',
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
            _buildAdminQuickActions(),
          ],
        ),
      ),
    );
  }

  Widget _buildAdminQuickActions() {
    return Row(
      children: [
        Expanded(
          child: _buildActionButton(
            '添加教师',
            Icons.person_add,
            const Color(0xFF10B981),
            () => _navigateToAddTeacher(),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            '数据统计',
            Icons.analytics,
            const Color(0xFF8B5CF6),
            () => _showStatistics(),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            '强制刷新',
            Icons.refresh,
            const Color(0xFFEF4444),
            () => _forceRefreshData(),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton(String title, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Colors.white.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: Colors.white,
              size: 18,
            ),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
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
        margin: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: TabBar(
          controller: _tabController,
          indicator: BoxDecoration(
            color: const Color(0xFF3B82F6),
            borderRadius: BorderRadius.circular(12),
          ),
          labelColor: Colors.white,
          unselectedLabelColor: const Color(0xFF64748B),
          tabs: const [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.list_rounded, size: 18),
                  SizedBox(width: 8),
                  Text('教师列表'),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.analytics_rounded, size: 18),
                  SizedBox(width: 8),
                  Text('数据统计'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContentSection() {
    return SliverFillRemaining(
      child: TabBarView(
        controller: _tabController,
        children: [
          _buildTeacherListTab(),
          _buildStatisticsTab(),
        ],
      ),
    );
  }

  Widget _buildTeacherListTab() {
    return Column(
      children: [
        _buildSearchAndFilterSection(),
        Expanded(child: _buildTeacherList()),
      ],
    );
  }

  Widget _buildSearchAndFilterSection() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          TextField(
            controller: _searchController,
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
              });
            },
            decoration: InputDecoration(
              hintText: '搜索教师姓名、邮箱、电话...',
              prefixIcon: const Icon(Icons.search_rounded),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFF3B82F6)),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                  child: _buildFilterDropdown(
                    '状态',
                    _selectedFilter,
                    ['all', 'active', 'inactive'],
                    ['全部', '在职', '离职'],
                    (value) => setState(() => _selectedFilter = value ?? 'all'),
                  ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Consumer<TeacherProvider>(
                  builder: (context, teacherProvider, child) {
                    final departments = ['all', ...teacherProvider.departments];
                    return _buildFilterDropdown(
                      '部门',
                      _selectedDepartment,
                      departments,
                      ['全部', ...teacherProvider.departments],
                      (value) => setState(() => _selectedDepartment = value ?? 'all'),
                    );
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilterDropdown(
    String label,
    String value,
    List<String> options,
    List<String> displayOptions,
    ValueChanged<String?> onChanged,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 4),
        DropdownButtonFormField<String>(
          value: value,
          onChanged: onChanged,
          decoration: InputDecoration(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFF3B82F6)),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          ),
          items: options.asMap().entries.map((entry) {
            return DropdownMenuItem<String>(
              value: entry.value,
              child: Text(
                displayOptions[entry.key],
                style: const TextStyle(fontSize: 14),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildTeacherList() {
    return Consumer<TeacherProvider>(
      builder: (context, teacherProvider, child) {
        if (teacherProvider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (teacherProvider.error != null) {
          return Center(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 48,
                      color: Color(0xFFEF4444),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '加载失败',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      teacherProvider.error!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => teacherProvider.loadTeachers(),
                      child: const Text('重试'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        var teachers = teacherProvider.teachers;
        
        // Apply search filter
        if (_searchQuery.isNotEmpty) {
          teachers = teacherProvider.searchTeachers(_searchQuery);
        }
        
        // Apply status filter
        teachers = teacherProvider.filterTeachersByStatus(_selectedFilter);
        
        // Apply department filter
        teachers = teacherProvider.filterTeachersByDepartment(_selectedDepartment);

        if (teachers.isEmpty) {
          return _buildEmptyState();
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: teachers.length,
          itemBuilder: (context, index) {
            final teacher = teachers[index];
            return _buildTeacherCard(teacher);
          },
        );
      },
    );
  }

  Widget _buildTeacherCard(dynamic teacher) {
    final name = teacher.getStringValue('name') ?? '未知教师';
    final email = teacher.getStringValue('email') ?? '';
    final phone = teacher.getStringValue('phone') ?? '';
    final department = teacher.getStringValue('department') ?? '未分配';
    final position = teacher.getStringValue('position') ?? '未分配';
    final status = teacher.getStringValue('status') ?? 'inactive';
    final permissions = teacher.getStringValue('permissions') ?? 'normal_teacher';
    final hireDate = teacher.getStringValue('hireDate') ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => _navigateToEditTeacher(teacher),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(16),
              topRight: Radius.circular(16),
            ),
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
                              name,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1E293B),
                              ),
                            ),
                            Text(
                              '$department · $position',
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
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _buildInfoChip(Icons.email_rounded, email),
                      const SizedBox(width: 8),
                      _buildInfoChip(Icons.phone_rounded, phone),
                    ],
                  ),
                  if (hireDate.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildInfoChip(Icons.calendar_today_rounded, '入职: $hireDate'),
                        const SizedBox(width: 8),
                        _buildInfoChip(Icons.security_rounded, _getPermissionText(permissions)),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
          Consumer<AuthProvider>(
            builder: (context, authProvider, child) {
              if (!authProvider.isAdmin) return const SizedBox.shrink();
              
              return Container(
                decoration: const BoxDecoration(
                  color: Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(16),
                    bottomRight: Radius.circular(16),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () => _navigateToEditTeacher(teacher),
                        borderRadius: const BorderRadius.only(
                          bottomLeft: Radius.circular(16),
                        ),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.edit_rounded,
                                size: 18,
                                color: Color(0xFF3B82F6),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '编辑',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFF3B82F6),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    Container(
                      width: 1,
                      height: 40,
                      color: const Color(0xFFE2E8F0),
                    ),
                    Expanded(
                      child: InkWell(
                        onTap: () => _showDeleteDialog(teacher),
                        borderRadius: const BorderRadius.only(
                          bottomRight: Radius.circular(16),
                        ),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.delete_rounded,
                                size: 18,
                                color: Color(0xFFEF4444),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '删除',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFFEF4444),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: const Color(0xFF64748B)),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF64748B),
            ),
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
          const Icon(
            Icons.school_outlined,
            size: 64,
            color: Color(0xFF64748B),
          ),
          const SizedBox(height: 16),
          const Text(
            '暂无教师',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            '点击右上角添加教师',
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatisticsTab() {
    return Consumer<TeacherProvider>(
      builder: (context, teacherProvider, child) {
        final stats = teacherProvider.statistics;
        final departments = teacherProvider.departments;
        
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              _buildStatsCard(stats),
              const SizedBox(height: 16),
              _buildDepartmentStatsCard(departments, teacherProvider),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatsCard(Map<String, int> stats) {
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
            '教师统计',
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
                child: _buildStatItem('总数', stats['total'] ?? 0, const Color(0xFF3B82F6)),
              ),
              Expanded(
                child: _buildStatItem('在职', stats['active'] ?? 0, const Color(0xFF10B981)),
              ),
              Expanded(
                child: _buildStatItem('离职', stats['inactive'] ?? 0, const Color(0xFFEF4444)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildStatItem('普通教师', stats['normal_teacher'] ?? 0, const Color(0xFF8B5CF6)),
              ),
              Expanded(
                child: _buildStatItem('高级教师', stats['senior_teacher'] ?? 0, const Color(0xFFF59E0B)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, int value, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Text(
            value.toString(),
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDepartmentStatsCard(List<String> departments, TeacherProvider teacherProvider) {
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
            '部门分布',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 16),
          if (departments.isEmpty)
            const Text(
              '暂无部门数据',
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
              ),
            )
          else
            ...departments.map((dept) {
              final count = teacherProvider.filterTeachersByDepartment(dept).length;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      dept,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    Text(
                      '$count 人',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'active':
        return const Color(0xFF10B981);
      case 'inactive':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF64748B);
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'active':
        return '在职';
      case 'inactive':
        return '离职';
      default:
        return '未知';
    }
  }

  String _getPermissionText(String permission) {
    switch (permission) {
      case 'normal_teacher':
        return '普通教师';
      case 'senior_teacher':
        return '高级教师';
      default:
        return '未知';
    }
  }

  void _navigateToAddTeacher() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AddEditTeacherScreen(),
      ),
    );
  }

  void _navigateToEditTeacher(dynamic teacher) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditTeacherScreen(teacherData: teacher),
      ),
    );
  }

  void _showDeleteDialog(dynamic teacher) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('删除教师'),
        content: Text('确定要删除教师 "${teacher.getStringValue('name')}" 吗？此操作不可撤销。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await context.read<TeacherProvider>().deleteTeacher(teacher.id);
              if (success && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('已删除教师 "${teacher.getStringValue('name')}"'),
                    backgroundColor: const Color(0xFF10B981),
                  ),
                );
              } else if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('删除失败: ${context.read<TeacherProvider>().error}'),
                    backgroundColor: const Color(0xFFEF4444),
                  ),
                );
              }
            },
            child: const Text('删除'),
          ),
        ],
      ),
    );
  }

  void _showStatistics() {
    _tabController.animateTo(1);
  }
}
