import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../teacher/providers/teacher_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../widgets/student_header_widget.dart';
import '../widgets/student_overview_widget.dart';
import '../widgets/student_search_widget.dart';
import '../widgets/student_list_widget.dart';
import '../widgets/advanced_filter_dialog.dart';
import '../../../shared/services/error_handler_service.dart';
import 'student_profile_screen.dart';
import 'add_edit_student_screen.dart';
import '../../../screens/admin/center_management_screen.dart';

class StudentManagementScreen extends StatefulWidget {
  const StudentManagementScreen({super.key});

  @override
  State<StudentManagementScreen> createState() => _StudentManagementScreenState();
}

class _StudentManagementScreenState extends State<StudentManagementScreen> {
  String _searchQuery = '';
  String _selectedCenter = '全部中心';
  String? _selectedGrade;
  String? _selectedClass;
  String? _selectedStatus;
  
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
          StudentHeaderWidget(
            onAddStudent: _addNewStudent,
            onImportStudents: _showImportDialog,
            onShowStats: _showStudentStats,
            onShowMyClasses: _showMyClasses,
            onShowAttendance: _showAttendance,
          ),
          const StudentOverviewWidget(),
          SliverToBoxAdapter(
            child: Column(
              children: [
                const SizedBox(height: 16),
                StudentSearchWidget(
                  searchQuery: _searchQuery,
                  onSearchChanged: (query) {
                    setState(() {
                      _searchQuery = query;
                    });
                  },
                  selectedCenter: _selectedCenter,
                  onCenterChanged: (center) {
                    setState(() {
                      _selectedCenter = center;
                    });
                  },
                  onFilterTap: _showFilterDialog,
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
          StudentListWidget(
            searchQuery: _searchQuery,
            selectedCenter: _selectedCenter,
            selectedGrade: _selectedGrade,
            selectedClass: _selectedClass,
            selectedStatus: _selectedStatus,
            onStudentTap: _viewStudentDetails,
            onEditStudent: _editStudent,
            onDeleteStudent: _deleteStudent,
            onViewProfile: _viewStudentProfile,
          ),
        ],
      ),
      floatingActionButton: _buildSmartFab(),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }

  // 简化的方法实现
  void _addNewStudent() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AddEditStudentScreen(),
      ),
    );
  }

  void _showImportDialog() {
    // TODO: 实现批量导入功能
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('批量导入功能开发中...')),
    );
  }

  void _showStudentStats() {
    // TODO: 实现学生统计功能
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('学生统计功能开发中...')),
    );
  }

  void _showMyClasses() {
    // TODO: 实现我的班级功能
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('我的班级功能开发中...')),
    );
  }

  void _showAttendance() {
    // TODO: 实现考勤查看功能
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('考勤查看功能开发中...')),
    );
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AdvancedFilterDialog(
        currentSearchQuery: _searchQuery,
        currentCenter: _selectedCenter,
        currentGrade: _selectedGrade,
        currentClass: _selectedClass,
        currentStatus: _selectedStatus,
        onApplyFilter: (searchQuery, center, grade, className, status) {
          setState(() {
            _searchQuery = searchQuery;
            _selectedCenter = center;
            _selectedGrade = grade;
            _selectedClass = className;
            _selectedStatus = status;
          });
        },
      ),
    );
  }

  void _viewStudentDetails(RecordModel student) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StudentProfileScreen(studentId: student.id),
      ),
    );
  }

  void _editStudent(RecordModel student) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditStudentScreen(student: student),
      ),
    );
  }

  void _deleteStudent(RecordModel student) async {
    try {
      await Provider.of<StudentProvider>(context, listen: false)
          .deleteStudent(student.id);
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('学生 "${student.getStringValue('name')}" 已删除'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ErrorHandlerService.handleError(
          context,
          e,
          '删除学生',
        );
      }
    }
  }

  void _viewStudentProfile(RecordModel student) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StudentProfileScreen(studentId: student.id),
      ),
    );
  }

  Widget _buildSmartFab() {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        if (!authProvider.isAdmin && !authProvider.isTeacher) {
          return const SizedBox.shrink();
        }

        return FloatingActionButton.extended(
          onPressed: _addNewStudent,
          backgroundColor: AppTheme.primaryColor,
          foregroundColor: Colors.white,
          icon: const Icon(Icons.person_add_rounded),
          label: Text(
            authProvider.isAdmin ? '添加学生' : '查看学生',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        );
      },
    );
  }
}
