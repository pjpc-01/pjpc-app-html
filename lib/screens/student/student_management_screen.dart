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
            _buildSmartHeader(),
          _buildStudentList(),
        ],
        ),
      floatingActionButton: _buildFloatingSearchButton(),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }


  Widget _buildSmartHeader() {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(8),
        padding: const EdgeInsets.all(12),
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
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.school,
                    color: Colors.white,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Consumer<AuthProvider>(
                        builder: (context, authProvider, child) {
                          final title = authProvider.isAdmin ? '学生管理' : 
                                       authProvider.isTeacher ? '我的学生' : '学生信息';
                          final subtitle = authProvider.isAdmin ? '管理所有学生信息' : 
                                         authProvider.isTeacher ? '查看班级学生' : '查看学生信息';
                          return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                                title,
                                style: const TextStyle(
                                  fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                                subtitle,
                                style: const TextStyle(
                                  fontSize: 10,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                          );
                        },
                      ),
                    ],
                  ),
                ),
                Consumer<StudentProvider>(
                  builder: (context, studentProvider, child) {
                    final filteredStudents = studentProvider.getFilteredStudentsByRole();
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${filteredStudents.length} 名学生',
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
            const SizedBox(height: 8),
            _buildTeacherQuickActions(),
          ],
        ),
      ),
    );
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
            Icons.person_add,
            const Color(0xFF10B981),
            () => _addNewStudent(),
          ),
        ),
              const SizedBox(width: 8),
        Expanded(
          child: _buildActionButton(
                  '分行管理',
                  Icons.business,
                  const Color(0xFF3B82F6),
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
                  const Color(0xFF10B981),
                  () => _showMyClasses(),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildActionButton(
                  '考勤管理',
                  Icons.access_time,
                  const Color(0xFF3B82F6),
                  () => _showAttendanceManagement(),
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

  Widget _buildActionButton(String title, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: Colors.white, size: 16),
            const SizedBox(height: 2),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 9,
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

  void _showAttendanceManagement() {
    // 跳转到考勤管理页面
    Navigator.pushNamed(context, '/attendance');
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
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        padding: const EdgeInsets.all(20),
        child: Consumer<StudentProvider>(
      builder: (context, studentProvider, child) {
        final students = studentProvider.students;
            final centers = students.map((s) => s.getStringValue('center')).toSet().where((c) => c.isNotEmpty).toList();
            centers.sort();
            
            return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                      '分行管理',
                  style: TextStyle(
                        fontSize: 20,
          fontWeight: FontWeight.bold,
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
                        icon: const Icon(Icons.settings, size: 16),
                        label: const Text('完整管理'),
                        style: TextButton.styleFrom(
                          foregroundColor: const Color(0xFF3B82F6),
                        ),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                ),
              ],
            ),
                const SizedBox(height: 20),
                Expanded(
                  child: ListView.builder(
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
                        margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
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
        ),
        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
                            Row(
                              children: [
                                const Icon(Icons.business, color: Color(0xFF3B82F6), size: 20),
                                const SizedBox(width: 8),
                                Text(
                                  center,
                                  style: const TextStyle(
                                    fontSize: 16,
          fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const Spacer(),
                                GestureDetector(
                                  onTap: () {
                                    setState(() => _selectedCenter = center);
                                    Navigator.pop(context);
                                  },
      child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
                                      color: const Color(0xFF3B82F6),
              borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: const Text(
                                      '查看',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                                  child: _buildCenterStatItem('总学生', centerStudents.length.toString(), Icons.people),
                ),
              Expanded(
                                  child: _buildCenterStatItem('活跃学生', activeStudents.toString(), Icons.person),
                ),
              Expanded(
                                  child: _buildCenterStatItem('本月新生', newStudentsThisMonth.toString(), Icons.person_add),
                ),
            ],
              ),
            ],
      ),
    );
                    },
                  ),
          ),
        ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildCenterStatItem(String label, String value, IconData icon) {
    return Column(
          children: [
        Icon(icon, color: const Color(0xFF64748B), size: 16),
        const SizedBox(height: 4),
                      Text(
          value,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      Text(
          label,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF64748B),
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
          backgroundColor: const Color(0xFF3B82F6),
          foregroundColor: Colors.white,
          mini: true,
          child: const Icon(Icons.business, size: 20),
        ),
        const SizedBox(height: 8),
        // 搜索按钮
        FloatingActionButton(
          heroTag: "search",
          onPressed: _showSearchDialog,
          backgroundColor: const Color(0xFF10B981),
          foregroundColor: Colors.white,
          mini: true,
          child: const Icon(Icons.search, size: 20),
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
        height: MediaQuery.of(context).size.height * 0.4,
        decoration: const BoxDecoration(
        color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: SingleChildScrollView(
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
                      '搜索学生',
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
              // 搜索框
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: '🔍 搜索学生姓名、学号...',
                    prefixIcon: const Icon(Icons.search, color: Color(0xFF3B82F6)),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {
                                _searchQuery = '';
                              });
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF3B82F6)),
                    ),
                  ),
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value;
                    });
                  },
                ),
              ),
              const SizedBox(height: 16),
              // 分行快速切换
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _buildCenterQuickSwitch(),
              ),
              const SizedBox(height: 20),
              // 操作按钮
              Padding(
                padding: const EdgeInsets.all(16),
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
                        child: const Text('清除筛选'),
                      ),
                    ),
                    const SizedBox(width: 12),
                Expanded(
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF3B82F6),
                      foregroundColor: Colors.white,
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
            padding: const EdgeInsets.all(16),
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
    final createdAt = DateTime.tryParse(student.getStringValue('created') ?? '') ?? DateTime.now();
    final parentName = student.getStringValue('parents_name') ?? '';
    final parentPhone = student.getStringValue('parents_phone') ?? '';

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
        child: InkWell(
        onTap: () => _showStudentActions(student),
        borderRadius: BorderRadius.circular(12),
          child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
              children: [
              // 学生头像
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
                  const SizedBox(width: 12),
              // 学生基本信息
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                        Text(
                                    studentName,
                          style: const TextStyle(
                        fontSize: 15,
                                      fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                                    ),
                                  ),
                    const SizedBox(height: 2),
                            Text(
                          '$studentId · $standard',
                          style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    if (center.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.location_on, size: 10, color: Color(0xFF64748B)),
                          const SizedBox(width: 3),
                          Text(
                            center,
                            style: const TextStyle(
                              fontSize: 11,
                            color: Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                    ],
                  ],
                  ),
              ),
              // 状态标签
                  Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                      color: _getStatusColor(status).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: _getStatusColor(status).withOpacity(0.3)),
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
      ),
    );
  }

  void _showStudentActions(dynamic student) {
    final studentName = student.getStringValue('student_name') ?? '未知学生';
    final studentId = student.getStringValue('student_id') ?? '';
    final standard = student.getStringValue('standard') ?? '';
    final center = student.getStringValue('center') ?? '';
    final status = student.getStringValue('status') ?? 'active';
    final createdAt = DateTime.tryParse(student.getStringValue('created') ?? '') ?? DateTime.now();
    final parentName = student.getStringValue('parents_name') ?? '';
    final parentPhone = student.getStringValue('parents_phone') ?? '';

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
            // 学生信息
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
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
                                fontSize: 18,
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
                            if (center.isNotEmpty)
                              Text(
                                center,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF64748B),
                                ),
              ),
            ],
          ),
        ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: _getStatusColor(status).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(15),
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
                  // 详细信息
                  Container(
                    padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
          children: [
              Row(
                children: [
                  Expanded(
                              child: _buildDetailItem('注册时间', _formatDateTime(createdAt)),
                            ),
                  Expanded(
                              child: _buildDetailItem('状态', _getStatusText(status)),
            ),
          ],
        ),
                        if (parentName.isNotEmpty || parentPhone.isNotEmpty) ...[
                          const SizedBox(height: 8),
              Row(
                children: [
                              const Icon(Icons.family_restroom, size: 14, color: Color(0xFF64748B)),
                              const SizedBox(width: 6),
                  Expanded(
            child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                                    if (parentName.isNotEmpty)
                Text(
                                        parentName,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500,
                                          color: Color(0xFF1E293B),
                                        ),
                                      ),
                                    if (parentPhone.isNotEmpty)
                Text(
                                        parentPhone,
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
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Spacer(),
            // 操作按钮
            Padding(
              padding: const EdgeInsets.all(16),
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
                        foregroundColor: const Color(0xFF3B82F6),
                        side: const BorderSide(color: Color(0xFF3B82F6)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
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
                          icon: const Icon(Icons.edit_rounded, size: 16),
                          label: const Text('编辑'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: canEdit ? const Color(0xFF10B981) : Colors.grey,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
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

  Widget _buildDetailItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 2),
            Text(
          value,
                  style: const TextStyle(
            fontSize: 13,
                    color: Color(0xFF1E293B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
      ],
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
        builder: (context) => AddEditStudentScreen(student: student),
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
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.location_on, color: Color(0xFF3B82F6), size: 16),
                  const SizedBox(width: 6),
                  const Text(
                    '分行管理',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  const Spacer(),
                  if (_selectedCenter != '全部中心')
                    GestureDetector(
                      onTap: () => setState(() => _selectedCenter = '全部中心'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF3B82F6).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          '查看全部',
                          style: TextStyle(
                            fontSize: 10,
                            color: Color(0xFF3B82F6),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 32,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: centers.length,
                  itemBuilder: (context, index) {
                    final center = centers[index];
                    final isSelected = _selectedCenter == center;
                    final centerStudents = students.where((s) => s.getStringValue('center') == center).length;
                    
                    return Container(
                      margin: const EdgeInsets.only(right: 6),
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedCenter = center),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
                                center,
                                style: TextStyle(
                                  color: isSelected ? Colors.white : const Color(0xFF64748B),
                                  fontSize: 12,
                                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                decoration: BoxDecoration(
                                  color: isSelected ? Colors.white.withOpacity(0.2) : const Color(0xFF64748B).withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '$centerStudents',
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : const Color(0xFF64748B),
                                    fontSize: 10,
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

