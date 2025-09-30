import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../teacher/providers/teacher_provider.dart';
import '../../../core/theme/app_theme.dart';

/// 用户搜索和选择组件
class UserSearchSelector extends StatefulWidget {
  final String userType;
  final String? selectedUserId;
  final Function(RecordModel?) onUserSelected;
  final bool isSmallScreen;

  const UserSearchSelector({
    super.key,
    required this.userType,
    this.selectedUserId,
    required this.onUserSelected,
    required this.isSmallScreen,
  });

  @override
  State<UserSearchSelector> createState() => _UserSearchSelectorState();
}

class _UserSearchSelectorState extends State<UserSearchSelector> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  bool _isSearching = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<RecordModel> _getFilteredUsers() {
    if (widget.userType == 'student') {
      final students = context.read<StudentProvider>().students;
      if (_searchQuery.isEmpty) {
        return students.take(20).toList(); // 限制显示数量
      }
      return students.where((student) {
        final name = student.getStringValue('student_name') ?? 
                     student.getStringValue('name') ?? '';
        final studentId = student.getStringValue('student_id') ?? '';
        final query = _searchQuery.toLowerCase();
        return name.toLowerCase().contains(query) ||
               studentId.toLowerCase().contains(query);
      }).take(20).toList();
    } else {
      final teachers = context.read<TeacherProvider>().teachers;
      if (_searchQuery.isEmpty) {
        return teachers.take(20).toList();
      }
      return teachers.where((teacher) {
        final name = teacher.getStringValue('name') ?? '';
        final email = teacher.getStringValue('email') ?? '';
        final query = _searchQuery.toLowerCase();
        return name.toLowerCase().contains(query) ||
               email.toLowerCase().contains(query);
      }).take(20).toList();
    }
  }

  RecordModel? _getSelectedUser() {
    if (widget.selectedUserId == null) return null;
    
    if (widget.userType == 'student') {
      final students = context.read<StudentProvider>().students;
      return students.firstWhere(
        (student) => student.id == widget.selectedUserId,
        orElse: () => throw StateError('Student not found'),
      );
    } else {
      final teachers = context.read<TeacherProvider>().teachers;
      return teachers.firstWhere(
        (teacher) => teacher.id == widget.selectedUserId,
        orElse: () => throw StateError('Teacher not found'),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(widget.isSmallScreen ? 12 : 16),
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
          Text(
            '选择${widget.userType == 'student' ? '学生' : '教师'}',
            style: TextStyle(
              fontSize: widget.isSmallScreen ? 16 : 18,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 16),
          
          // 搜索框
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: '搜索${widget.userType == 'student' ? '学生' : '教师'}姓名或ID',
              hintStyle: TextStyle(
                color: AppTheme.textTertiary,
                fontSize: widget.isSmallScreen ? 14 : 16,
              ),
              prefixIcon: Icon(
                Icons.search,
                color: AppTheme.textSecondary,
                size: widget.isSmallScreen ? 20 : 24,
              ),
              suffixIcon: _searchQuery.isNotEmpty
                ? IconButton(
                    icon: Icon(
                      Icons.clear,
                      color: AppTheme.textSecondary,
                      size: widget.isSmallScreen ? 20 : 24,
                    ),
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
                borderSide: BorderSide(color: AppTheme.dividerColor),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: AppTheme.dividerColor),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: AppTheme.primaryColor),
              ),
              contentPadding: EdgeInsets.symmetric(
                horizontal: widget.isSmallScreen ? 12 : 16,
                vertical: widget.isSmallScreen ? 12 : 16,
              ),
            ),
            style: TextStyle(
              fontSize: widget.isSmallScreen ? 14 : 16,
              color: AppTheme.textPrimary,
            ),
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
              });
            },
          ),
          
          const SizedBox(height: 16),
          
          // 用户列表
          Consumer<StudentProvider>(
            builder: (context, studentProvider, child) {
              return Consumer<TeacherProvider>(
                builder: (context, teacherProvider, child) {
                  final users = _getFilteredUsers();
                  final selectedUser = widget.selectedUserId != null 
                    ? _getSelectedUser() 
                    : null;
                  
                  if (users.isEmpty) {
                    return Container(
                      padding: EdgeInsets.all(widget.isSmallScreen ? 20 : 40),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(
                              Icons.search_off,
                              size: widget.isSmallScreen ? 32 : 48,
                              color: AppTheme.textTertiary,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              _searchQuery.isEmpty 
                                ? '暂无${widget.userType == 'student' ? '学生' : '教师'}数据'
                                : '未找到匹配的${widget.userType == 'student' ? '学生' : '教师'}',
                              style: TextStyle(
                                fontSize: widget.isSmallScreen ? 14 : 16,
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }
                  
                  return SizedBox(
                    height: widget.isSmallScreen ? 200 : 250,
                    child: ListView.builder(
                      itemCount: users.length,
                      itemBuilder: (context, index) {
                        final user = users[index];
                        final isSelected = user.id == widget.selectedUserId;
                        
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: () {
                                widget.onUserSelected(isSelected ? null : user);
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: EdgeInsets.all(widget.isSmallScreen ? 12 : 16),
                                decoration: BoxDecoration(
                                  color: isSelected 
                                    ? AppTheme.primaryColor.withOpacity(0.1)
                                    : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isSelected 
                                      ? AppTheme.primaryColor
                                      : Colors.transparent,
                                    width: 1,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      radius: widget.isSmallScreen ? 16 : 20,
                                      backgroundColor: isSelected 
                                        ? AppTheme.primaryColor
                                        : AppTheme.primaryColor.withOpacity(0.1),
                                      child: Icon(
                                        widget.userType == 'student' 
                                          ? Icons.school_rounded
                                          : Icons.person_rounded,
                                        color: isSelected 
                                          ? Colors.white
                                          : AppTheme.primaryColor,
                                        size: widget.isSmallScreen ? 16 : 20,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            widget.userType == 'student'
                                              ? (user.getStringValue('student_name') ?? 
                                                 user.getStringValue('name') ?? '未知学生')
                                              : (user.getStringValue('name') ?? '未知教师'),
                                            style: TextStyle(
                                              fontSize: widget.isSmallScreen ? 14 : 16,
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF1E293B),
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            widget.userType == 'student'
                                              ? (user.getStringValue('student_id') ?? '')
                                              : (user.getStringValue('email') ?? ''),
                                            style: TextStyle(
                                              fontSize: widget.isSmallScreen ? 12 : 14,
                                              color: AppTheme.textSecondary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (isSelected)
                                      Icon(
                                        Icons.check_circle,
                                        color: AppTheme.primaryColor,
                                        size: widget.isSmallScreen ? 20 : 24,
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }
}
