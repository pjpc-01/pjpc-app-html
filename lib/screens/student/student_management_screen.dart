import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/teacher_provider.dart';
import '../../theme/app_theme.dart';
import 'student_profile_screen.dart';
import 'add_edit_student_screen.dart';
import '../admin/center_management_screen.dart';

class StudentManagementScreen extends StatefulWidget {
  const StudentManagementScreen({super.key});

  @override
  State<StudentManagementScreen> createState() => _StudentManagementScreenState();
}

class _StudentManagementScreenState extends State<StudentManagementScreen> {
  String _searchQuery = '';
  String _selectedCenter = '全部中心';
  
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
        Provider.of<StudentProvider>(context, listen: false).loadStudents();
      Provider.of<TeacherProvider>(context, listen: false).loadTeachers();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          _buildModernHeader(),
          _buildOverviewSection(),
          SliverToBoxAdapter(
            child: Column(
              children: [
                const SizedBox(height: 16),
                _buildSearchBar(),
                const SizedBox(height: 16),
              ],
            ),
          ),
          _buildStudentList(),
        ],
      ),
      floatingActionButton: _buildSmartFab(),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }

  Widget _buildModernHeader() {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(24),
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
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.3),
                      width: 1.5,
                    ),
                  ),
                  child: const Icon(
                    Icons.school_rounded,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Consumer<AuthProvider>(
                        builder: (context, authProvider, child) {
                          final title = authProvider.isAdmin ? '学生管理' : '学生信息';
                          return Text(
                            title,
                            style: const TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          );
                        },
                      ),
                      const Text(
                        '智能学生管理系统，高效管理学生信息',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.white70,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            _buildStudentQuickActions(),
          ],
        ),
      ),
    );
  }

  Widget _buildStudentQuickActions() {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        if (authProvider.isAdmin) {
          return Row(
            children: [
              Expanded(
                child: _buildSimpleActionButton(
                  '添加学生',
                  Icons.person_add_rounded,
                  () => _addNewStudent(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSimpleActionButton(
                  '批量导入',
                  Icons.upload_file_rounded,
                  () => _showImportDialog(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSimpleActionButton(
                  '数据统计',
                  Icons.analytics_rounded,
                  () => _showStudentStats(),
                ),
              ),
            ],
          );
        } else if (authProvider.isTeacher) {
          return Row(
            children: [
              Expanded(
                child: _buildSimpleActionButton(
                  '我的班级',
                  Icons.class_rounded,
                  () => _showMyClasses(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSimpleActionButton(
                  '学生统计',
                  Icons.analytics_rounded,
                  () => _showStudentStats(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSimpleActionButton(
                  '考勤查看',
                  Icons.access_time_rounded,
                  () => _navigateToAttendance(),
                ),
              ),
            ],
          );
        } else {
          return Row(
            children: [
              Expanded(
                child: _buildSimpleActionButton(
                  '我的孩子',
                  Icons.family_restroom_rounded,
                  () => _showMyChildren(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSimpleActionButton(
                  '积分查看',
                  Icons.stars_rounded,
                  () => _navigateToPoints(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSimpleActionButton(
                  '考勤记录',
                  Icons.access_time_rounded,
                  () => _navigateToAttendance(),
                ),
              ),
            ],
          );
        }
      },
    );
  }

  Widget _buildSimpleActionButton(String title, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.3), width: 1),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(height: 4),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: '搜索学生姓名、学号、班级...',
          prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF3B82F6), size: 20),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded, size: 18),
                  onPressed: () {
                    _searchController.clear();
                    setState(() {
                      _searchQuery = '';
                    });
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 16),
        ),
        onChanged: (value) {
          setState(() {
            _searchQuery = value;
          });
        },
      ),
    );
  }

  Widget _buildSmartFab() {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        if (authProvider.isAdmin) {
          return FloatingActionButton.extended(
            onPressed: () => _addNewStudent(),
            backgroundColor: const Color(0xFF3B82F6),
            foregroundColor: Colors.white,
            icon: const Icon(Icons.person_add_rounded),
            label: const Text('添加学生'),
          );
        } else if (authProvider.isTeacher) {
          return FloatingActionButton(
            onPressed: () => _showMyClasses(),
            backgroundColor: const Color(0xFF3B82F6),
            foregroundColor: Colors.white,
            child: const Icon(Icons.class_rounded),
            tooltip: '我的班级',
          );
        } else {
          return FloatingActionButton(
            onPressed: () => _showMyChildren(),
            backgroundColor: const Color(0xFF3B82F6),
            foregroundColor: Colors.white,
            child: const Icon(Icons.family_restroom_rounded),
            tooltip: '我的孩子',
          );
        }
      },
    );
  }

  void _showImportDialog() {
    if (!mounted) return;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.upload_file_rounded, color: Color(0xFF3B82F6)),
            SizedBox(width: 8),
            Text('批量导入学生'),
          ],
        ),
        content: const Text('批量导入功能开发中，敬请期待...'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  void _showMyChildren() {
    if (!mounted) return;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.family_restroom_rounded, color: Color(0xFF3B82F6)),
            SizedBox(width: 8),
            Text('我的孩子'),
          ],
        ),
        content: const Text('家长功能开发中，敬请期待...'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  void _navigateToAttendance() {
    if (!mounted) return;
    Navigator.pushNamed(context, '/attendance');
  }

  void _navigateToPoints() {
    if (!mounted) return;
    Navigator.pushNamed(context, '/points');
  }

  Widget _buildTeacherQuickActions() {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        // 根据用户角色显示不同的操作按钮
        if (authProvider.isAdmin) {
          return Row(
            children: [
              Expanded(
                child: _buildActionButton(
                  '添加学生',
                  Icons.person_add_rounded,
                  () => _addNewStudent(),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: _buildActionButton(
                  '分行管理',
                  Icons.business_rounded,
                  () => _showCenterManagement(),
                ),
              ),
            ],
          );
        } else if (authProvider.isTeacher) {
          return Row(
            children: [
              Expanded(
                child: _buildActionButton(
                  '我的班级',
                  Icons.class_rounded,
                  () => _showMyClasses(),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: _buildActionButton(
                  '学生统计',
                  Icons.analytics_rounded,
                  () => _showStudentStats(),
                ),
              ),
            ],
          );
        } else {
          return const SizedBox.shrink();
        }
      },
    );
  }

  Widget _buildActionButton(String title, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.white.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: Colors.white, size: 14),
            const SizedBox(height: 2),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 8,
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
    if (!mounted) return;
    // 检查权限
    final studentProvider = Provider.of<StudentProvider>(context, listen: false);
    if (!studentProvider.canAddStudent()) {
      _showPermissionDeniedDialog('您没有权限添加学生');
      return;
    }
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AddEditStudentScreen(),
      ),
    );
  }

  void _showMyClasses() {
    if (!mounted) return;
    // 显示老师负责的班级信息
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.6,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Column(
          children: [
            // 拖拽指示器
            Container(
              margin: const EdgeInsets.only(top: 8),
              width: 40,
              height: 4,
      decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
      ),
            ),
            // 标题
            Padding(
              padding: const EdgeInsets.all(16),
      child: Row(
        children: [
                  const Text(
                    '我的班级',
                style: TextStyle(
                      fontSize: 18,
                  fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
              ),
            ],
          ),
            ),
            // 班级列表
            Expanded(
              child: Consumer<AuthProvider>(
                builder: (context, authProvider, child) {
                  final teacherClasses = authProvider.userProfile?.getStringValue('assigned_classes') ?? '';
                  if (teacherClasses.isEmpty) {
                    return const Center(
                      child: Text('您还没有分配班级'),
                    );
                  }
                  
                  final classList = teacherClasses.split(',').map((c) => c.trim()).toList();
                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: classList.length,
                    itemBuilder: (context, index) {
                      final className = classList[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: const Icon(Icons.class_rounded, color: Color(0xFF3B82F6)),
                          title: Text(className),
                          subtitle: Text('班级学生数量: ${_getClassStudentCount(className)}'),
                          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                          onTap: () {
                            Navigator.pop(context);
                            _filterByClass(className);
                          },
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showStudentStats() {
    if (!mounted) return;
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.analytics_rounded, color: Color(0xFF3B82F6)),
              SizedBox(width: 8),
              Text('学生统计'),
            ],
          ),
          content: SizedBox(
            width: double.maxFinite,
            height: 300,
            child: Consumer<StudentProvider>(
              builder: (context, studentProvider, child) {
                final students = studentProvider.getFilteredStudentsByRole();
                final totalStudents = students.length;
                final activeStudents = students.where((s) => s.getStringValue('status') == 'active').length;
                final inactiveStudents = totalStudents - activeStudents;
                
                return Column(
                  children: [
                    _buildStatCard('总学生数', totalStudents.toString(), Icons.people, const Color(0xFF3B82F6)),
                    const SizedBox(height: 12),
                    _buildStatCard('活跃学生', activeStudents.toString(), Icons.person, const Color(0xFF10B981)),
                    const SizedBox(height: 12),
                    _buildStatCard('非活跃学生', inactiveStudents.toString(), Icons.person_off, const Color(0xFFEF4444)),
                    const SizedBox(height: 12),
                    _buildStatCard('班级数量', _getClassCount(students).toString(), Icons.class_rounded, const Color(0xFFF59E0B)),
                  ],
                );
              },
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('关闭'),
            ),
          ],
        );
      },
    );
  }
  
  int _getClassCount(List<dynamic> students) {
    final classes = students.map((s) => s.getStringValue('standard')).toSet();
    return classes.length;
  }

  void _filterByClass(String className) {
    setState(() {
      _selectedCenter = className;
    });
  }

  int _getClassStudentCount(String className) {
    final studentProvider = Provider.of<StudentProvider>(context, listen: false);
    final filteredStudents = studentProvider.getFilteredStudentsByRole();
    return filteredStudents.where((s) => s.getStringValue('standard') == className).length;
  }

  void _showPermissionDeniedDialog(String message) {
    if (!mounted) return;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('权限不足'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }


  void _showCenterManagement() {
    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(16),
            topRight: Radius.circular(16),
          ),
        ),
        child: Column(
          children: [
            // 拖拽指示器
            Container(
              margin: const EdgeInsets.only(top: 6),
              width: 32,
              height: 3,
              decoration: BoxDecoration(
                color: const Color(0xFFD1D5DB),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // 标题栏
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Row(
                children: [
                  const Text(
                    '分行管理',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const Spacer(),
                  Consumer<AuthProvider>(
                    builder: (context, authProvider, child) {
                      if (authProvider.isAdmin) {
                        return TextButton.icon(
                          onPressed: () {
                            Navigator.pop(context);
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const CenterManagementScreen(),
                              ),
                            );
                          },
                          icon: const Icon(Icons.settings_rounded, size: 16),
                          label: const Text('完整管理'),
                          style: TextButton.styleFrom(
                            foregroundColor: const Color(0xFF1E40AF),
                            backgroundColor: const Color(0xFF1E40AF).withOpacity(0.1),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(6),
                            ),
                          ),
                        );
                      }
                      return const SizedBox.shrink();
                    },
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded, size: 20),
                    style: IconButton.styleFrom(
                      backgroundColor: const Color(0xFFF3F4F6),
                      foregroundColor: const Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            // 分行列表
            Expanded(
              child: Consumer<StudentProvider>(
                builder: (context, studentProvider, child) {
                  final students = studentProvider.students;
                  final centers = students.map((s) => s.getStringValue('center')).toSet().where((c) => c.isNotEmpty).toList();
                  centers.sort();
                  
                  if (centers.isEmpty) {
                    return const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.business_rounded, size: 48, color: Color(0xFF9CA3AF)),
                          SizedBox(height: 12),
                          Text(
                            '暂无分行数据',
                            style: TextStyle(
                              fontSize: 14,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                        ],
                      ),
                    );
                  }
                  
                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: centers.length,
                    itemBuilder: (context, index) {
                      final center = centers[index];
                      final centerStudents = students.where((s) => s.getStringValue('center') == center).toList();
                      final activeStudents = centerStudents.where((s) => s.getStringValue('status') == 'active').length;
                      final newStudentsThisMonth = centerStudents.where((s) {
                        final createdAt = DateTime.tryParse(s.getStringValue('created') ?? '');
                        return createdAt != null && _isThisMonth(createdAt);
                      }).length;
                      
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFE5E7EB)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.02),
                              blurRadius: 2,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.business_rounded, color: Color(0xFF1E40AF), size: 18),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    center,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF111827),
                                    ),
                                  ),
                                ),
                                GestureDetector(
                                  onTap: () {
                                    setState(() => _selectedCenter = center);
                                    Navigator.pop(context);
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF1E40AF),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Text(
                                      '查看',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildCenterStatItem('总学生', centerStudents.length.toString(), Icons.people_rounded),
                                ),
                                Expanded(
                                  child: _buildCenterStatItem('活跃学生', activeStudents.toString(), Icons.person_rounded),
                                ),
                                Expanded(
                                  child: _buildCenterStatItem('本月新生', newStudentsThisMonth.toString(), Icons.person_add_rounded),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCenterStatItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: const Color(0xFF6B7280), size: 14),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Color(0xFF111827),
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 9,
            color: Color(0xFF6B7280),
          ),
        ),
      ],
    );
  }


  Widget _buildFloatingSearchButton() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // 分行切换按钮
        FloatingActionButton(
          heroTag: "center_switch",
          onPressed: _showCenterManagement,
          backgroundColor: const Color(0xFF1E40AF),
          foregroundColor: Colors.white,
          mini: true,
          child: const Icon(Icons.business_rounded, size: 18),
        ),
        const SizedBox(height: 6),
        // 搜索按钮
        FloatingActionButton(
          heroTag: "search",
          onPressed: _showSearchDialog,
          backgroundColor: const Color(0xFF059669),
          foregroundColor: Colors.white,
          mini: true,
          child: const Icon(Icons.search_rounded, size: 18),
        ),
      ],
    );
  }

  void _showSearchDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.5,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(16),
            topRight: Radius.circular(16),
          ),
        ),
        child: Column(
          children: [
            // 拖拽指示器
            Container(
              margin: const EdgeInsets.only(top: 6),
              width: 32,
              height: 3,
              decoration: BoxDecoration(
                color: const Color(0xFFD1D5DB),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // 标题
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Row(
                children: [
                  const Text(
                    '搜索学生',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close, size: 20),
                    style: IconButton.styleFrom(
                      backgroundColor: const Color(0xFFF3F4F6),
                      foregroundColor: const Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
            // 搜索框
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: '搜索学生姓名、学号...',
                  prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF1E40AF), size: 18),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            setState(() {
                              _searchQuery = '';
                            });
                          },
                        )
                      : null,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Color(0xFF1E40AF), width: 2),
                  ),
                  filled: true,
                  fillColor: const Color(0xFFF9FAFB),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
              ),
            ),
            const SizedBox(height: 12),
            // 分行快速切换
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _buildCenterQuickSwitch(),
            ),
            const Spacer(),
            // 操作按钮
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setState(() {
                          _searchQuery = '';
                          _selectedCenter = '全部中心';
                        });
                        _searchController.clear();
                        Navigator.pop(context);
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF6B7280),
                        side: const BorderSide(color: Color(0xFFE5E7EB)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                      child: const Text('清除筛选'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1E40AF),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                      child: const Text('确定'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOverviewSection() {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 4,
                      height: 28,
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 16),
                    const Text(
                      '学生概览',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                  ],
                ),
                Consumer<StudentProvider>(
                  builder: (context, studentProvider, child) {
                    final totalStudents = studentProvider.getFilteredStudentsByRole().length;
                    return Text(
                      '共 $totalStudents 名学生',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF6B7280),
                      ),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 24),
            Consumer<StudentProvider>(
              builder: (context, studentProvider, child) {
                final students = studentProvider.getFilteredStudentsByRole();
                final stats = _calculateStudentStats(students);
                
                return Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            '总学生数',
                            stats['total'].toString(),
                            Icons.people_rounded,
                            const Color(0xFF3B82F6),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            '活跃学生',
                            stats['active'].toString(),
                            Icons.person_rounded,
                            const Color(0xFF10B981),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            '班级数量',
                            stats['classes'].toString(),
                            Icons.class_rounded,
                            const Color(0xFFF59E0B),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            '中心数量',
                            stats['centers'].toString(),
                            Icons.business_rounded,
                            const Color(0xFF8B5CF6),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            '本月新增',
                            stats['newThisMonth'].toString(),
                            Icons.person_add_rounded,
                            const Color(0xFFEF4444),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            'NFC已分配',
                            stats['nfcAssigned'].toString(),
                            Icons.nfc_rounded,
                            const Color(0xFF06B6D4),
                          ),
                        ),
                      ],
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Map<String, int> _calculateStudentStats(List<dynamic> students) {
    final now = DateTime.now();
    final thisMonth = DateTime(now.year, now.month);
    
    final total = students.length;
    final active = students.where((s) => s.getStringValue('status') == 'active').length;
    
    final classes = students.map((s) => s.getStringValue('standard')).toSet().length;
    final centers = students.map((s) => s.getStringValue('center')).toSet().length;
    
    final newThisMonth = students.where((s) {
      final created = s.getStringValue('created');
      if (created == null || created.isEmpty) return false;
      try {
        final createdDate = DateTime.parse(created);
        return createdDate.isAfter(thisMonth);
      } catch (e) {
        return false;
      }
    }).length;
    
    final nfcAssigned = students.where((s) {
      final cardNumber = s.getStringValue('cardNumber');
      return cardNumber != null && cardNumber.isNotEmpty;
    }).length;
    
    return {
      'total': total,
      'active': active,
      'classes': classes,
      'centers': centers,
      'newThisMonth': newThisMonth,
      'nfcAssigned': nfcAssigned,
    };
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(12),
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

  Widget _buildStudentList() {
    return SliverFillRemaining(
      child: Consumer<StudentProvider>(
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
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
            itemCount: students.length,
            itemBuilder: (context, index) {
              return _buildModernStudentCard(students[index], studentProvider);
            },
          ),
        );
        },
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
    final center = student.getStringValue('center') ?? '';
    final status = student.getStringValue('status') ?? 'active';
    final parentPhone = student.getStringValue('parent_phone') ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE5E7EB), width: 0.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 2,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: InkWell(
        onTap: () => _showStudentBasicInfo(student),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // 学生头像
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: _getStatusColor(status).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(
                  Icons.person_rounded,
                  color: _getStatusColor(status),
                  size: 16,
                ),
              ),
              const SizedBox(width: 8),
              // 学生基本信息
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      studentName,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$studentId · $standard',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                    if (center.isNotEmpty) ...[
                      const SizedBox(height: 1),
                      Row(
                        children: [
                          const Icon(Icons.location_on, size: 8, color: Color(0xFF9CA3AF)),
                          const SizedBox(width: 2),
                          Expanded(
                            child: Text(
                              center,
                              style: const TextStyle(
                                fontSize: 10,
                                color: Color(0xFF9CA3AF),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              // 状态标签和操作按钮
              Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: _getStatusColor(status).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: _getStatusColor(status).withOpacity(0.2)),
                    ),
                    child: Text(
                      _getStatusText(status),
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w600,
                        color: _getStatusColor(status),
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Icon(
                    Icons.chevron_right,
                    color: const Color(0xFF9CA3AF),
                    size: 14,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showStudentBasicInfo(dynamic student) {
    if (!mounted) return;
    final studentName = student.getStringValue('student_name') ?? '未知学生';
    final studentId = student.getStringValue('student_id') ?? '';
    final standard = student.getStringValue('standard') ?? '';
    final center = student.getStringValue('center') ?? '';
    final status = student.getStringValue('status') ?? 'active';
    final parentsName = student.getStringValue('parents_name') ?? '';
    final parentsPhone = student.getStringValue('parents_phone') ?? '';
    final homeAddress = student.getStringValue('home_address') ?? '';
    final dob = student.getStringValue('dob') ?? '';
    final gender = student.getStringValue('gender') ?? '';
    final school = student.getStringValue('school') ?? '';
    final cardNumber = student.getStringValue('cardNumber') ?? '';
    final cardStatus = student.getStringValue('cardStatus') ?? '';
    final emergencyContactName = student.getStringValue('emergencyContactName') ?? '';
    final emergencyContactPhone = student.getStringValue('emergencyContactPhone') ?? '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Column(
          children: [
            // 拖拽指示器
            Container(
              margin: const EdgeInsets.only(top: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFD1D5DB),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // 标题栏
            Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
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
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF111827),
                          ),
                        ),
                        Text(
                          '$studentId · $standard',
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _getStatusColor(status).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
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
            ),
            // 基本信息内容
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 基本信息卡片
                    _buildBasicInfoCard(student, studentName, studentId, standard, center, status, school, cardNumber, cardStatus),
                    const SizedBox(height: 16),
                    // 联系信息卡片
                    _buildContactInfoCard(parentsName, parentsPhone, emergencyContactName, emergencyContactPhone),
                    const SizedBox(height: 16),
                    // 其他信息卡片
                    _buildOtherInfoCard(dob, gender, homeAddress),
                    const SizedBox(height: 20),
                    // 操作按钮
                    _buildBasicInfoActions(student),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBasicInfoCard(dynamic student, String name, String id, String standard, String center, String status, String school, String cardNumber, String cardStatus) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline_rounded, color: const Color(0xFF3B82F6), size: 20),
              const SizedBox(width: 8),
              const Text(
                '基本信息',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF111827),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildInfoRow('姓名', name),
          _buildInfoRow('学号', id),
          _buildInfoRow('班级', standard),
          if (center.isNotEmpty) _buildInfoRow('中心', center),
          if (school.isNotEmpty) _buildInfoRow('学校', school),
          _buildInfoRow('状态', _getStatusText(status)),
          if (cardNumber.isNotEmpty) _buildInfoRow('NFC卡号', cardNumber),
          if (cardStatus.isNotEmpty) _buildInfoRow('卡状态', _getCardStatusText(cardStatus)),
        ],
      ),
    );
  }

  Widget _buildContactInfoCard(String parentsName, String parentsPhone, String emergencyContactName, String emergencyContactPhone) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.contact_phone_rounded, color: const Color(0xFF10B981), size: 20),
              const SizedBox(width: 8),
              const Text(
                '联系信息',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF111827),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (parentsName.isNotEmpty) _buildInfoRow('家长姓名', parentsName),
          if (parentsPhone.isNotEmpty) _buildInfoRow('家长电话', parentsPhone),
          if (emergencyContactName.isNotEmpty) _buildInfoRow('紧急联系人', emergencyContactName),
          if (emergencyContactPhone.isNotEmpty) _buildInfoRow('紧急联系电话', emergencyContactPhone),
        ],
      ),
    );
  }

  Widget _buildOtherInfoCard(String dob, String gender, String homeAddress) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.person_outline_rounded, color: const Color(0xFF8B5CF6), size: 20),
              const SizedBox(width: 8),
              const Text(
                '其他信息',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF111827),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (dob.isNotEmpty) _buildInfoRow('出生日期', dob),
          if (gender.isNotEmpty) _buildInfoRow('性别', gender),
          if (homeAddress.isNotEmpty) _buildInfoRow('家庭地址', homeAddress),
        ],
      ),
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
                color: Color(0xFF6B7280),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value.isEmpty ? '未填写' : value,
              style: TextStyle(
                fontSize: 14,
                color: value.isEmpty ? const Color(0xFF9CA3AF) : const Color(0xFF111827),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBasicInfoActions(dynamic student) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              _viewStudentProfile(student);
            },
            icon: const Icon(Icons.visibility_rounded, size: 18),
            label: const Text('查看详情'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF3B82F6),
              side: const BorderSide(color: Color(0xFF3B82F6)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Consumer<StudentProvider>(
            builder: (context, studentProvider, child) {
              final canEdit = studentProvider.canEditStudent(student.id);
              return ElevatedButton.icon(
                onPressed: canEdit ? () {
                  Navigator.pop(context);
                  _editStudent(student);
                } : () {
                  Navigator.pop(context);
                  _showPermissionDeniedDialog('您没有权限编辑此学生信息');
                },
                icon: const Icon(Icons.edit_rounded, size: 18),
                label: const Text('编辑'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: canEdit ? const Color(0xFF10B981) : const Color(0xFF9CA3AF),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showStudentActions(dynamic student) {
    final studentName = student.getStringValue('student_name') ?? '未知学生';
    final studentId = student.getStringValue('student_id') ?? '';
    final standard = student.getStringValue('standard') ?? '';
    final center = student.getStringValue('center') ?? '';
    final status = student.getStringValue('status') ?? 'active';
    final createdAt = DateTime.tryParse(student.getStringValue('created') ?? '') ?? DateTime.now();
    final parentName = student.getStringValue('parent_name') ?? '';
    final parentPhone = student.getStringValue('parent_phone') ?? '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.65,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(16),
            topRight: Radius.circular(16),
          ),
        ),
        child: Column(
          children: [
            // 拖拽指示器
            Container(
              margin: const EdgeInsets.only(top: 6),
              width: 32,
              height: 3,
              decoration: BoxDecoration(
                color: const Color(0xFFD1D5DB),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // 学生信息
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: _getStatusColor(status).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.person_rounded,
                      color: _getStatusColor(status),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          studentName,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF111827),
                          ),
                        ),
                        Text(
                          '$studentId · $standard',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                        if (center.isNotEmpty)
                          Text(
                            center,
                            style: const TextStyle(
                              fontSize: 11,
                              color: Color(0xFF9CA3AF),
                            ),
                          ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getStatusColor(status).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: _getStatusColor(status).withOpacity(0.2)),
                    ),
                    child: Text(
                      _getStatusText(status),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: _getStatusColor(status),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            // 详细信息
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    // 基本信息
                    _buildInfoSection('基本信息', [
                      _buildInfoRow('注册时间', _formatDateTime(createdAt)),
                      _buildInfoRow('状态', _getStatusText(status)),
                    ]),
                    const SizedBox(height: 16),
                    // 家长信息
                    if (parentName.isNotEmpty || parentPhone.isNotEmpty)
                      _buildInfoSection('家长信息', [
                        if (parentName.isNotEmpty) _buildInfoRow('家长姓名', parentName),
                        if (parentPhone.isNotEmpty) _buildInfoRow('联系电话', parentPhone),
                      ]),
                  ],
                ),
              ),
            ),
            // 操作按钮
            Container(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              decoration: const BoxDecoration(
                color: Color(0xFFF9FAFB),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        _viewStudentProfile(student);
                      },
                      icon: const Icon(Icons.visibility_rounded, size: 16),
                      label: const Text('查看详情'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF1E40AF),
                        side: const BorderSide(color: Color(0xFF1E40AF)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Consumer<StudentProvider>(
                      builder: (context, studentProvider, child) {
                        final canEdit = studentProvider.canEditStudent(student.id);
                        return ElevatedButton.icon(
                          onPressed: canEdit ? () {
                            Navigator.pop(context);
                            _editStudent(student);
                          } : () {
                            Navigator.pop(context);
                            _showPermissionDeniedDialog('您没有权限编辑此学生信息');
                          },
                          icon: const Icon(Icons.edit_rounded, size: 16),
                          label: const Text('编辑'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: canEdit ? const Color(0xFF059669) : const Color(0xFF9CA3AF),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoSection(String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E40AF),
            ),
          ),
          const SizedBox(height: 8),
          ...children,
        ],
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



  // Helper methods
  List<dynamic> _getFilteredStudents(List<dynamic> students) {
    final studentProvider = Provider.of<StudentProvider>(context, listen: false);

    // 首先根据用户角色过滤学生
    List<dynamic> filteredStudents = studentProvider.getFilteredStudentsByRole();

    // 搜索筛选
    if (_searchQuery.isNotEmpty) {
      filteredStudents = filteredStudents.where((s) {
        final searchQuery = _searchQuery.toLowerCase();
        final studentName = s.getStringValue('student_name') ?? '';
        final studentId = s.getStringValue('student_id') ?? '';
        final standard = s.getStringValue('standard') ?? '';
        
        return studentName.toLowerCase().contains(searchQuery) ||
               studentId.toLowerCase().contains(searchQuery) ||
               standard.toLowerCase().contains(searchQuery);
      }).toList();
    }

    // 分行筛选
    if (_selectedCenter != '全部中心') {
      filteredStudents = filteredStudents.where((s) => s.getStringValue('center') == _selectedCenter).toList();
    }

    // 按姓名排序
    filteredStudents.sort((a, b) {
          return (a.getStringValue('student_name') ?? '').compareTo(b.getStringValue('student_name') ?? '');
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

  String _getCardStatusText(String cardStatus) {
    switch (cardStatus.toLowerCase()) {
      case 'active':
        return '正常';
      case 'inactive':
        return '停用';
      case 'lost':
        return '丢失';
      case 'graduate':
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
        builder: (context) => AddEditStudentScreen(
          isEdit: true,
          student: student,
        ),
      ),
    );
  }

  // 新增分行快速切换组件
  Widget _buildCenterQuickSwitch() {
    return Consumer<StudentProvider>(
      builder: (context, studentProvider, child) {
        final students = studentProvider.students;
        final centers = students.map((s) => s.getStringValue('center')).toSet().where((c) => c.isNotEmpty).toList();
        centers.sort();
        
        return Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFFF9FAFB),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.location_on_rounded, color: Color(0xFF1E40AF), size: 14),
                  const SizedBox(width: 4),
                  const Text(
                    '分行筛选',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const Spacer(),
                  if (_selectedCenter != '全部中心')
                    GestureDetector(
                      onTap: () => setState(() => _selectedCenter = '全部中心'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E40AF).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          '全部',
                          style: TextStyle(
                            fontSize: 9,
                            color: Color(0xFF1E40AF),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              SizedBox(
                height: 28,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: centers.length,
                  itemBuilder: (context, index) {
                    final center = centers[index];
                    final isSelected = _selectedCenter == center;
                    final centerStudents = students.where((s) => s.getStringValue('center') == center).length;
                    
                    return Container(
                      margin: const EdgeInsets.only(right: 4),
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedCenter = center),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFF1E40AF) : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected ? const Color(0xFF1E40AF) : const Color(0xFFE5E7EB),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                center,
                                style: TextStyle(
                                  color: isSelected ? Colors.white : const Color(0xFF6B7280),
                                  fontSize: 10,
                                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                ),
                              ),
                              const SizedBox(width: 3),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 1),
                                decoration: BoxDecoration(
                                  color: isSelected ? Colors.white.withOpacity(0.2) : const Color(0xFF6B7280).withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  '$centerStudents',
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : const Color(0xFF6B7280),
                                    fontSize: 8,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // 新增分行统计信息组件

  // 新增分行概览组件
  Widget _buildCenterOverview() {
    return Consumer<StudentProvider>(
      builder: (context, studentProvider, child) {
        final students = studentProvider.students;
        final centers = students.map((s) => s.getStringValue('center')).toSet().where((c) => c.isNotEmpty).toList();
        centers.sort();
        
        if (centers.isEmpty) {
          return const SizedBox.shrink();
        }
        
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.2),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
            Row(
              children: [
                  const Icon(Icons.business, color: Colors.white, size: 16),
                  const SizedBox(width: 6),
                  const Text(
                    '分行概览',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${centers.length}个分行',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.white70,
            ),
          ),
        ],
            ),
              const SizedBox(height: 8),
              SizedBox(
                height: 40,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: centers.length,
                  itemBuilder: (context, index) {
                    final center = centers[index];
                    final centerStudents = students.where((s) => s.getStringValue('center') == center).toList();
                    final activeStudents = centerStudents.where((s) => s.getStringValue('status') == 'active').length;
                    
                    return Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.white.withOpacity(0.2)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            center,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${centerStudents.length}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

