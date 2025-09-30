import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../core/constants/nfc_constants.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../teacher/providers/teacher_provider.dart';

/// 优化的用户选择Widget - 支持搜索和分页
class UserSelectionOptimized extends StatefulWidget {
  final bool isSmallScreen;
  final String userType;
  final String? selectedUserId;
  final Function(String userId) onUserSelected;
  
  const UserSelectionOptimized({
    super.key,
    required this.isSmallScreen,
    required this.userType,
    this.selectedUserId,
    required this.onUserSelected,
  });

  @override
  State<UserSelectionOptimized> createState() => _UserSelectionOptimizedState();
}

class _UserSelectionOptimizedState extends State<UserSelectionOptimized> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  List<RecordModel> _filteredUsers = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
    _loadUsers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(UserSelectionOptimized oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.userType != widget.userType) {
      _loadUsers();
    }
  }

  void _onSearchChanged() {
    setState(() {
      _searchQuery = _searchController.text.toLowerCase();
      _filterUsers();
    });
  }

  Future<void> _loadUsers() async {
    setState(() {
      _isLoading = true;
    });

    try {
      List<RecordModel> users;
      if (widget.userType == NFCConstants.userTypeStudent) {
        final studentProvider = context.read<StudentProvider>();
        // 确保学生数据已加载
        if (studentProvider.students.isEmpty) {
          await studentProvider.loadStudents();
        }
        users = studentProvider.students;
      } else {
        final teacherProvider = context.read<TeacherProvider>();
        // 确保教师数据已加载
        if (teacherProvider.teachers.isEmpty) {
          await teacherProvider.loadTeachers();
        }
        users = teacherProvider.teachers;
      }
      
      setState(() {
        _filteredUsers = users;
        _isLoading = false;
      });
      
      _filterUsers();
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      _showError('加载用户失败: $e');
    }
  }

  void _filterUsers() {
    if (_searchQuery.isEmpty) {
      setState(() {
        _filteredUsers = widget.userType == NFCConstants.userTypeStudent
            ? context.read<StudentProvider>().students
            : context.read<TeacherProvider>().teachers;
      });
    } else {
      final allUsers = widget.userType == NFCConstants.userTypeStudent
          ? context.read<StudentProvider>().students
          : context.read<TeacherProvider>().teachers;
      
      setState(() {
        _filteredUsers = allUsers.where((user) {
          final name = widget.userType == NFCConstants.userTypeStudent
              ? user.getStringValue('student_name') ?? ''
              : user.getStringValue('name') ?? '';
          final id = widget.userType == NFCConstants.userTypeStudent
              ? user.getStringValue('student_id') ?? ''
              : user.getStringValue('teacher_id') ?? '';
          
          return name.toLowerCase().contains(_searchQuery) ||
                 id.toLowerCase().contains(_searchQuery);
        }).toList();
      });
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Color(NFCConstants.errorColor),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.all(widget.isSmallScreen ? 12 : 16),
      padding: EdgeInsets.all(widget.isSmallScreen ? 16 : 20),
      decoration: BoxDecoration(
        color: Color(NFCConstants.cardColor),
        borderRadius: BorderRadius.circular(NFCConstants.cardBorderRadius),
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
          Row(
            children: [
              Icon(
                widget.userType == NFCConstants.userTypeStudent 
                    ? Icons.school 
                    : Icons.person,
                color: Color(NFCConstants.primaryColor),
                size: widget.isSmallScreen ? 24 : 28,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '选择${widget.userType == NFCConstants.userTypeStudent ? "学生" : "教师"}',
                      style: TextStyle(
                        fontSize: widget.isSmallScreen ? 16 : 18,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.selectedUserId != null 
                          ? '已选择用户'
                          : '请选择要分配NFC卡的用户',
                      style: TextStyle(
                        fontSize: widget.isSmallScreen ? 14 : 16,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: _loadUsers,
                icon: const Icon(Icons.refresh),
                tooltip: '刷新用户列表',
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // 搜索框
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: '搜索${widget.userType == NFCConstants.userTypeStudent ? "学生" : "教师"}姓名或ID',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      onPressed: () {
                        _searchController.clear();
                      },
                      icon: const Icon(Icons.clear),
                    )
                  : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Color(NFCConstants.primaryColor)),
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          // 用户列表
          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: CircularProgressIndicator(),
              ),
            )
          else if (_filteredUsers.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Text(
                  _searchQuery.isNotEmpty 
                      ? '未找到匹配的${widget.userType == NFCConstants.userTypeStudent ? "学生" : "教师"}'
                      : '暂无${widget.userType == NFCConstants.userTypeStudent ? "学生" : "教师"}数据',
                  style: TextStyle(
                    color: const Color(0xFF64748B),
                    fontSize: 16,
                  ),
                ),
              ),
            )
          else
            Container(
              height: 300,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade200),
                borderRadius: BorderRadius.circular(8),
              ),
              child: ListView.builder(
                itemCount: _filteredUsers.length,
                itemBuilder: (context, index) {
                  final user = _filteredUsers[index];
                  final isSelected = user.id == widget.selectedUserId;
                  final name = widget.userType == NFCConstants.userTypeStudent
                      ? user.getStringValue('student_name') ?? '未知学生'
                      : user.getStringValue('name') ?? '未知教师';
                  final id = widget.userType == NFCConstants.userTypeStudent
                      ? user.getStringValue('student_id') ?? 'N/A'
                      : user.getStringValue('teacher_id') ?? 'N/A';
                  final cardNumber = user.getStringValue('cardNumber') ?? '';
                  
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor: isSelected 
                          ? Color(NFCConstants.primaryColor)
                          : Colors.grey.shade300,
                      child: Icon(
                        widget.userType == NFCConstants.userTypeStudent 
                            ? Icons.school 
                            : Icons.person,
                        color: isSelected ? Colors.white : Colors.grey.shade600,
                      ),
                    ),
                    title: Text(
                      name,
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                        color: isSelected 
                            ? Color(NFCConstants.primaryColor)
                            : const Color(0xFF1E293B),
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('ID: $id'),
                        if (cardNumber.isNotEmpty)
                          Text(
                            'NFC卡: $cardNumber',
                            style: TextStyle(
                              color: Color(NFCConstants.warningColor),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                      ],
                    ),
                    trailing: isSelected 
                        ? Icon(
                            Icons.check_circle,
                            color: Color(NFCConstants.successColor),
                          )
                        : null,
                    onTap: () {
                      widget.onUserSelected(user.id);
                    },
                    tileColor: isSelected 
                        ? Color(NFCConstants.primaryColor).withOpacity(0.1)
                        : null,
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}

