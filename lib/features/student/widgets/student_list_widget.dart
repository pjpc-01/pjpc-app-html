import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/services/error_handler_service.dart';

/// 学生列表组件
class StudentListWidget extends StatelessWidget {
  final String searchQuery;
  final String selectedCenter;
  final String? selectedGrade;
  final String? selectedClass;
  final String? selectedStatus;
  final Function(RecordModel) onStudentTap;
  final Function(RecordModel) onEditStudent;
  final Function(RecordModel) onDeleteStudent;
  final Function(RecordModel) onViewProfile;

  const StudentListWidget({
    super.key,
    required this.searchQuery,
    required this.selectedCenter,
    this.selectedGrade,
    this.selectedClass,
    this.selectedStatus,
    required this.onStudentTap,
    required this.onEditStudent,
    required this.onDeleteStudent,
    required this.onViewProfile,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer2<StudentProvider, AuthProvider>(
      builder: (context, studentProvider, authProvider, child) {
        if (studentProvider.isLoading) {
          return const SliverFillRemaining(
            child: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        if (studentProvider.error != null) {
          return SliverFillRemaining(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 64,
                    color: AppTheme.errorColor,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '加载学生数据失败',
                    style: AppTextStyles.headline6,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    studentProvider.error!,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => studentProvider.loadStudents(),
                    child: const Text('重试'),
                  ),
                ],
              ),
            ),
          );
        }

        final filteredStudents = _filterStudents(
          studentProvider.students,
          searchQuery,
          selectedCenter,
          selectedGrade,
          selectedClass,
          selectedStatus,
        );

        if (filteredStudents.isEmpty) {
          return SliverFillRemaining(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.people_outline,
                    size: 64,
                    color: AppTheme.textTertiary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    searchQuery.isNotEmpty 
                        ? '没有找到匹配的学生'
                        : '暂无学生数据',
                    style: AppTextStyles.headline6,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    searchQuery.isNotEmpty
                        ? '请尝试其他搜索关键词'
                        : '请联系管理员添加学生信息',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        }

        return SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              final student = filteredStudents[index];
              return _buildStudentCard(context, student, authProvider);
            },
            childCount: filteredStudents.length,
          ),
        );
      },
    );
  }

  List<RecordModel> _filterStudents(
    List<RecordModel> students,
    String searchQuery,
    String selectedCenter,
    String? selectedGrade,
    String? selectedClass,
    String? selectedStatus,
  ) {
    var filtered = students;

    // 按中心过滤
    if (selectedCenter != '全部中心') {
      filtered = filtered.where((student) {
        final center = student.getStringValue('center') ?? '';
        return center.contains(selectedCenter);
      }).toList();
    }

    // 按年级过滤 - 使用正确的年级映射
    if (selectedGrade != null && selectedGrade.isNotEmpty) {
      filtered = filtered.where((student) {
        final standard = student.getStringValue('standard') ?? '';
        final grade = student.getStringValue('grade') ?? '';
        return standard.toLowerCase().contains(selectedGrade.toLowerCase()) ||
               grade.toLowerCase().contains(selectedGrade.toLowerCase());
      }).toList();
    }

    // 按班级过滤 - 使用实际字段名
    if (selectedClass != null && selectedClass.isNotEmpty) {
      filtered = filtered.where((student) {
        final className = student.getStringValue('class_name') ?? '';
        final classId = student.getStringValue('class_id') ?? '';
        return className.toLowerCase().contains(selectedClass.toLowerCase()) ||
               classId.toLowerCase().contains(selectedClass.toLowerCase());
      }).toList();
    }

    // 按状态过滤 - 使用实际字段名
    if (selectedStatus != null && selectedStatus.isNotEmpty) {
      filtered = filtered.where((student) {
        final status = student.getStringValue('status') ?? '';
        return status.toLowerCase().contains(selectedStatus.toLowerCase());
      }).toList();
    }

    // 按搜索关键词过滤 - 使用实际字段名
    if (searchQuery.isNotEmpty) {
      filtered = filtered.where((student) {
        final name = student.getStringValue('student_name') ?? 
                     student.getStringValue('name') ?? 
                     student.getStringValue('full_name') ?? '';
        final studentId = student.getStringValue('student_id') ?? '';
        final standard = student.getStringValue('standard') ?? '';
        final className = student.getStringValue('class_name') ?? '';
        
        final query = searchQuery.toLowerCase();
        return name.toLowerCase().contains(query) ||
               studentId.toLowerCase().contains(query) ||
               standard.toLowerCase().contains(query) ||
               className.toLowerCase().contains(query);
      }).toList();
    }

    return filtered;
  }

  Widget _buildStudentCard(
    BuildContext context,
    RecordModel student,
    AuthProvider authProvider,
  ) {
    // 根据实际数据库字段获取学生姓名
    final name = student.getStringValue('student_name') ?? 
                 student.getStringValue('name') ?? 
                 student.getStringValue('full_name') ?? 
                 '未知学生';
    final studentId = student.getStringValue('student_id') ?? '';
    final grade = student.getStringValue('grade') ?? '';
    final className = student.getStringValue('class_name') ?? '';
    final center = student.getStringValue('center') ?? '';
    final avatar = student.getStringValue('avatar');

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => onStudentTap(student),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // 头像
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(25),
                  ),
                  child: avatar != null && avatar.isNotEmpty
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(25),
                          child: Image.network(
                            avatar,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Icon(
                                Icons.person_rounded,
                                color: AppTheme.primaryColor,
                                size: 24,
                              );
                            },
                          ),
                        )
                      : Icon(
                          Icons.person_rounded,
                          color: AppTheme.primaryColor,
                          size: 24,
                        ),
                ),
                const SizedBox(width: 16),
                // 学生信息
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: AppTextStyles.bodyLarge.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      if (studentId.isNotEmpty)
                        Text(
                          '学号: $studentId',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      const SizedBox(height: 2),
                      Text(
                        '$grade${className.isNotEmpty ? ' · $className' : ''}',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      if (center.isNotEmpty)
                        Text(
                          center,
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppTheme.textTertiary,
                          ),
                        ),
                    ],
                  ),
                ),
                // 操作按钮
                if (authProvider.isAdmin || authProvider.isTeacher)
                  PopupMenuButton<String>(
                    onSelected: (value) {
                      switch (value) {
                        case 'view':
                          onViewProfile(student);
                          break;
                        case 'edit':
                          onEditStudent(student);
                          break;
                        case 'delete':
                          _showDeleteConfirmation(context, student);
                          break;
                      }
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'view',
                        child: Row(
                          children: [
                            Icon(Icons.visibility_rounded, size: 18),
                            SizedBox(width: 8),
                            Text('查看详情'),
                          ],
                        ),
                      ),
                      if (authProvider.isAdmin)
                        const PopupMenuItem(
                          value: 'edit',
                          child: Row(
                            children: [
                              Icon(Icons.edit_rounded, size: 18),
                              SizedBox(width: 8),
                              Text('编辑'),
                            ],
                          ),
                        ),
                      if (authProvider.isAdmin)
                        const PopupMenuItem(
                          value: 'delete',
                          child: Row(
                            children: [
                              Icon(Icons.delete_rounded, size: 18, color: Colors.red),
                              SizedBox(width: 8),
                              Text('删除', style: TextStyle(color: Colors.red)),
                            ],
                          ),
                        ),
                    ],
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.more_vert_rounded,
                        color: AppTheme.textSecondary,
                        size: 20,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context, RecordModel student) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认删除'),
        content: Text('确定要删除学生 "${student.getStringValue('name')}" 吗？此操作不可撤销。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              onDeleteStudent(student);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
            ),
            child: const Text('删除'),
          ),
        ],
      ),
    );
  }
}
