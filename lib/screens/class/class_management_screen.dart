import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/class_provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import 'add_edit_class_screen.dart';
import 'class_student_management_screen.dart';

class ClassManagementScreen extends StatefulWidget {
  const ClassManagementScreen({super.key});

  @override
  State<ClassManagementScreen> createState() => _ClassManagementScreenState();
}

class _ClassManagementScreenState extends State<ClassManagementScreen> {
  String _selectedCenter = 'WX 01';
  String _selectedLevel = '全部';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ClassProvider>().loadClasses();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final isAdmin = authProvider.isAdmin;
        final isTeacher = authProvider.isTeacher;
        
        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: _buildAppBar(isAdmin),
          body: Column(
            children: [
              _buildFilterSection(),
              Expanded(child: _buildClassList()),
            ],
          ),
          floatingActionButton: isAdmin ? _buildFloatingActionButton() : null,
        );
      },
    );
  }

  PreferredSizeWidget _buildAppBar(bool isAdmin) {
    return AppBar(
      title: Text(
        isAdmin ? '班级管理' : '班级查看',
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
        IconButton(
          icon: const Icon(Icons.refresh_rounded),
          onPressed: () {
            context.read<ClassProvider>().loadClasses();
          },
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildFilterSection() {
    return Container(
      margin: const EdgeInsets.all(16),
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
      child: Column(
        children: [
          // 搜索框
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                hintText: '搜索班级名称、年级或教师...',
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
          const SizedBox(height: 16),
          // 筛选器
          Row(
            children: [
              Expanded(
                child: _buildCenterFilter(),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildLevelFilter(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCenterFilter() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(12),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedCenter,
          onChanged: (value) {
            setState(() {
              _selectedCenter = value!;
            });
          },
          items: const [
            DropdownMenuItem(value: 'WX 01', child: Text('WX 01')),
            DropdownMenuItem(value: 'WX 02', child: Text('WX 02')),
            DropdownMenuItem(value: 'WX 03', child: Text('WX 03')),
            DropdownMenuItem(value: '全部', child: Text('全部分行')),
          ],
          padding: const EdgeInsets.symmetric(horizontal: 16),
          style: const TextStyle(color: Color(0xFF1E293B)),
        ),
      ),
    );
  }

  Widget _buildLevelFilter() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(12),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedLevel,
          onChanged: (value) {
            setState(() {
              _selectedLevel = value!;
            });
          },
          items: const [
            DropdownMenuItem(value: '全部', child: Text('全部年级')),
            DropdownMenuItem(value: '一年级', child: Text('一年级')),
            DropdownMenuItem(value: '二年级', child: Text('二年级')),
            DropdownMenuItem(value: '三年级', child: Text('三年级')),
            DropdownMenuItem(value: '四年级', child: Text('四年级')),
            DropdownMenuItem(value: '五年级', child: Text('五年级')),
            DropdownMenuItem(value: '六年级', child: Text('六年级')),
          ],
          padding: const EdgeInsets.symmetric(horizontal: 16),
          style: const TextStyle(color: Color(0xFF1E293B)),
        ),
      ),
    );
  }

  Widget _buildClassList() {
    return Consumer<ClassProvider>(
      builder: (context, classProvider, child) {
        if (classProvider.isLoading) {
          return const Center(
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF1E3A8A)),
            ),
          );
        }

        if (classProvider.error != null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.error_outline,
                  size: 64,
                  color: Colors.red[300],
                ),
                const SizedBox(height: 16),
                Text(
                  '加载失败',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.red[700],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  classProvider.error!,
                  style: const TextStyle(color: Color(0xFF64748B)),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => classProvider.loadClasses(),
                  child: const Text('重试'),
                ),
              ],
            ),
          );
        }

        final filteredClasses = _getFilteredClasses(classProvider.classes);

        if (filteredClasses.isEmpty) {
          return _buildEmptyState();
        }

        return RefreshIndicator(
          onRefresh: () async {
            await classProvider.loadClasses();
          },
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: filteredClasses.length,
            itemBuilder: (context, index) {
              return _buildClassCard(filteredClasses[index]);
            },
          ),
        );
      },
    );
  }

  List<dynamic> _getFilteredClasses(List<dynamic> classes) {
    List<dynamic> filtered = classes;

    // 按分行筛选
    if (_selectedCenter != '全部') {
      filtered = filtered.where((c) => c.getStringValue('center') == _selectedCenter).toList();
    }

    // 按年级筛选
    if (_selectedLevel != '全部') {
      filtered = filtered.where((c) => c.getStringValue('level') == _selectedLevel).toList();
    }

    // 按搜索关键词筛选
    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      filtered = filtered.where((c) {
        final name = c.getStringValue('name')?.toLowerCase() ?? '';
        final level = c.getStringValue('level')?.toLowerCase() ?? '';
        final teacher = c.getStringValue('teacher')?.toLowerCase() ?? '';
        return name.contains(query) || level.contains(query) || teacher.contains(query);
      }).toList();
    }

    return filtered;
  }

  Widget _buildEmptyState() {
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
            child: const Icon(
              Icons.class_rounded,
              size: 48,
              color: Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            '暂无班级数据',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            '点击右下角按钮创建第一个班级',
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildClassCard(dynamic classData) {
    final name = classData.getStringValue('name') ?? '未知班级';
    final center = classData.getStringValue('center') ?? '未知分行';
    final level = classData.getStringValue('level') ?? '未知年级';
    final status = classData.getStringValue('status') ?? 'inactive';
    final currentStudents = classData.getIntValue('current_students') ?? 0;
    final maxCapacity = classData.getIntValue('max_capacity') ?? 0;
    final teacher = classData.getStringValue('teacher') ?? '未分配教师';

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
          InkWell(
            onTap: () => _navigateToClassDetail(classData),
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
                          Icons.class_rounded,
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
                              '$center · $level',
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
                      _buildInfoChip(Icons.person_rounded, '教师', teacher),
                      const SizedBox(width: 8),
                      _buildInfoChip(Icons.group_rounded, '学生', '$currentStudents/$maxCapacity'),
                    ],
                  ),
                  const SizedBox(height: 12),
                  LinearProgressIndicator(
                    value: maxCapacity > 0 ? currentStudents / maxCapacity : 0,
                    backgroundColor: const Color(0xFFE2E8F0),
                    valueColor: AlwaysStoppedAnimation<Color>(_getStatusColor(status)),
                    minHeight: 6,
                  ),
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
                        onTap: () => _navigateToStudentManagement(classData),
                        borderRadius: const BorderRadius.only(
                          bottomLeft: Radius.circular(16),
                        ),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.people_rounded,
                                size: 18,
                                color: Color(0xFF1E3A8A),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '学生管理',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFF1E3A8A),
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
                        onTap: () => _navigateToEditClass(classData),
                        borderRadius: const BorderRadius.only(
                          bottomRight: Radius.circular(16),
                        ),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.edit_rounded,
                                size: 18,
                                color: Color(0xFF64748B),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '编辑班级',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFF64748B),
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

  Widget _buildInfoChip(IconData icon, String label, String value) {
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
            '$label: $value',
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFloatingActionButton() {
    return FloatingActionButton(
      onPressed: () => _navigateToAddClass(),
      backgroundColor: const Color(0xFF1E3A8A),
      child: const Icon(
        Icons.add_rounded,
        color: Colors.white,
        size: 28,
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'active':
        return const Color(0xFF10B981);
      case 'inactive':
        return const Color(0xFFF59E0B);
      case 'archived':
        return const Color(0xFF64748B);
      default:
        return const Color(0xFF64748B);
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'active':
        return '进行中';
      case 'inactive':
        return '暂停';
      case 'archived':
        return '已归档';
      default:
        return '未知';
    }
  }

  void _navigateToAddClass() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const AddEditClassScreen(),
      ),
    );
  }

  void _navigateToClassDetail(dynamic classData) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => AddEditClassScreen(classData: classData),
      ),
    );
  }

  void _navigateToStudentManagement(dynamic classData) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ClassStudentManagementScreen(classData: classData),
      ),
    );
  }

  void _navigateToEditClass(dynamic classData) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => AddEditClassScreen(classData: classData),
      ),
    );
  }
}
