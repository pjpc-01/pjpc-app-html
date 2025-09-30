import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../shared/providers/class_provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';

class ClassStudentManagementScreen extends StatefulWidget {
  final dynamic classData;
  
  const ClassStudentManagementScreen({super.key, required this.classData});

  @override
  State<ClassStudentManagementScreen> createState() => _ClassStudentManagementScreenState();
}

class _ClassStudentManagementScreenState extends State<ClassStudentManagementScreen> {
  List<dynamic> _classStudents = [];
  List<dynamic> _unassignedStudents = [];
  bool _isLoading = false;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadStudents();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadStudents() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final classProvider = Provider.of<ClassProvider>(context, listen: false);
      
      final classStudents = await classProvider.getClassStudents(widget.classData.id);
      final unassignedStudents = await classProvider.getUnassignedStudents();
      
      setState(() {
        _classStudents = classStudents;
        _unassignedStudents = unassignedStudents;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('加载学生数据失败: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final isAdmin = authProvider.isAdmin;
        final className = widget.classData.getStringValue('name') ?? '未知班级';
        
        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            title: Text(
              '$className - 学生管理',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            backgroundColor: const Color(0xFF1E3A8A),
            foregroundColor: Colors.white,
            elevation: 0,
            actions: [
              if (isAdmin)
                IconButton(
                  icon: const Icon(Icons.person_add_rounded),
                  onPressed: _showAssignStudentDialog,
                ),
            ],
          ),
          body: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : Column(
                  children: [
                    _buildSearchSection(),
                    Expanded(child: _buildStudentTabs()),
                  ],
                ),
        );
      },
    );
  }

  Widget _buildSearchSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: TextField(
        controller: _searchController,
        onChanged: (value) {
          setState(() {
            _searchQuery = value.toLowerCase();
          });
        },
        decoration: InputDecoration(
          hintText: '搜索学生姓名或学号',
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
            borderSide: const BorderSide(color: Color(0xFF1E3A8A)),
          ),
        ),
      ),
    );
  }

  Widget _buildStudentTabs() {
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: TabBar(
              indicator: BoxDecoration(
                color: const Color(0xFF1E3A8A),
                borderRadius: BorderRadius.circular(12),
              ),
              labelColor: Colors.white,
              unselectedLabelColor: Colors.grey.shade600,
              tabs: [
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.people_rounded, size: 18),
                      const SizedBox(width: 8),
                      Text('班级学生 (${_getFilteredClassStudents().length})'),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.person_add_rounded, size: 18),
                      const SizedBox(width: 8),
                      Text('未分配 (${_getFilteredUnassignedStudents().length})'),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              children: [
                _buildClassStudentsList(),
                _buildUnassignedStudentsList(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildClassStudentsList() {
    final filteredStudents = _getFilteredClassStudents();
    
    if (filteredStudents.isEmpty) {
      return _buildEmptyState(
        icon: Icons.people_outline,
        title: '暂无学生',
        subtitle: '该班级还没有分配学生',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filteredStudents.length,
      itemBuilder: (context, index) {
        final student = filteredStudents[index];
        return _buildStudentCard(student, isInClass: true);
      },
    );
  }

  Widget _buildUnassignedStudentsList() {
    final filteredStudents = _getFilteredUnassignedStudents();
    
    if (filteredStudents.isEmpty) {
      return _buildEmptyState(
        icon: Icons.person_add_outlined,
        title: '暂无未分配学生',
        subtitle: '所有学生都已分配到班级',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filteredStudents.length,
      itemBuilder: (context, index) {
        final student = filteredStudents[index];
        return _buildStudentCard(student, isInClass: false);
      },
    );
  }

  Widget _buildStudentCard(dynamic student, {required bool isInClass}) {
    final name = student.getStringValue('student_name') ?? '未知学生';
    final studentId = student.getStringValue('student_id') ?? '';
    final grade = student.getStringValue('grade') ?? '';
    final center = student.getStringValue('center') ?? '';
    final avatar = student.getStringValue('avatar') ?? '';

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
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: CircleAvatar(
          radius: 24,
          backgroundColor: const Color(0xFF1E3A8A).withOpacity(0.1),
          child: avatar.isNotEmpty
              ? ClipOval(
                  child: Image.network(
                    avatar,
                    width: 48,
                    height: 48,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return const Icon(
                        Icons.person_rounded,
                        color: Color(0xFF1E3A8A),
                        size: 24,
                      );
                    },
                  ),
                )
              : const Icon(
                  Icons.person_rounded,
                  color: Color(0xFF1E3A8A),
                  size: 24,
                ),
        ),
        title: Text(
          name,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1F2937),
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              '学号: $studentId',
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 2),
            Row(
              children: [
                _buildInfoChip(Icons.school_rounded, grade),
                const SizedBox(width: 8),
                _buildInfoChip(Icons.business_rounded, center),
              ],
            ),
          ],
        ),
        trailing: Consumer<AuthProvider>(
          builder: (context, authProvider, child) {
            if (!authProvider.isAdmin) return const SizedBox.shrink();
            
            return PopupMenuButton<String>(
              onSelected: (value) => _handleStudentAction(value, student),
              itemBuilder: (context) => [
                if (isInClass)
                  const PopupMenuItem(
                    value: 'remove',
                    child: Row(
                      children: [
                        Icon(Icons.remove_circle_outline, color: Color(0xFFEF4444)),
                        SizedBox(width: 8),
                        Text('从班级移除'),
                      ],
                    ),
                  )
                else
                  const PopupMenuItem(
                    value: 'assign',
                    child: Row(
                      children: [
                        Icon(Icons.add_circle_outline, color: Color(0xFF10B981)),
                        SizedBox(width: 8),
                        Text('分配到班级'),
                      ],
                    ),
                  ),
              ],
              child: const Icon(
                Icons.more_vert_rounded,
                color: Color(0xFF64748B),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF1E3A8A).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 12,
            color: const Color(0xFF1E3A8A),
          ),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              fontSize: 10,
              color: Color(0xFF1E3A8A),
              fontWeight: FontWeight.w500,
            ),
          ),
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
          Icon(
            icon,
            size: 64,
            color: const Color(0xFF64748B),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  List<dynamic> _getFilteredClassStudents() {
    if (_searchQuery.isEmpty) return _classStudents;
    
    return _classStudents.where((student) {
      final name = student.getStringValue('student_name') ?? '';
      final studentId = student.getStringValue('student_id') ?? '';
      return name.toLowerCase().contains(_searchQuery) ||
             studentId.toLowerCase().contains(_searchQuery);
    }).toList();
  }

  List<dynamic> _getFilteredUnassignedStudents() {
    if (_searchQuery.isEmpty) return _unassignedStudents;
    
    return _unassignedStudents.where((student) {
      final name = student.getStringValue('student_name') ?? '';
      final studentId = student.getStringValue('student_id') ?? '';
      return name.toLowerCase().contains(_searchQuery) ||
             studentId.toLowerCase().contains(_searchQuery);
    }).toList();
  }

  void _handleStudentAction(String action, dynamic student) async {
    final classProvider = Provider.of<ClassProvider>(context, listen: false);
    
    switch (action) {
      case 'assign':
        await _assignStudentToClass(student);
        break;
      case 'remove':
        await _removeStudentFromClass(student);
        break;
    }
  }

  Future<void> _assignStudentToClass(dynamic student) async {
    final classProvider = Provider.of<ClassProvider>(context, listen: false);
    final studentId = student.id;
    final classId = widget.classData.id;
    
    final success = await classProvider.assignStudentToClass(studentId, classId);
    
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('已将 ${student.getStringValue('student_name')} 分配到班级'),
          backgroundColor: const Color(0xFF10B981),
        ),
      );
      _loadStudents();
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('分配失败: ${classProvider.error}'),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    }
  }

  Future<void> _removeStudentFromClass(dynamic student) async {
    final classProvider = Provider.of<ClassProvider>(context, listen: false);
    final studentId = student.id;
    
    final success = await classProvider.removeStudentFromClass(studentId);
    
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('已将 ${student.getStringValue('student_name')} 从班级移除'),
          backgroundColor: const Color(0xFF10B981),
        ),
      );
      _loadStudents();
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('移除失败: ${classProvider.error}'),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    }
  }

  void _showAssignStudentDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('批量分配学生'),
        content: const Text('选择要分配到该班级的学生'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: 实现批量分配功能
            },
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }
}
