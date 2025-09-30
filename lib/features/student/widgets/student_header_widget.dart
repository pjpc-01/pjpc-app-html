import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';

/// 学生管理页面头部组件
class StudentHeaderWidget extends StatelessWidget {
  final VoidCallback? onAddStudent;
  final VoidCallback? onImportStudents;
  final VoidCallback? onShowStats;
  final VoidCallback? onShowMyClasses;
  final VoidCallback? onShowAttendance;

  const StudentHeaderWidget({
    super.key,
    this.onAddStudent,
    this.onImportStudents,
    this.onShowStats,
    this.onShowMyClasses,
    this.onShowAttendance,
  });

  @override
  Widget build(BuildContext context) {
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
                  onAddStudent ?? () {},
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSimpleActionButton(
                  '批量导入',
                  Icons.upload_file_rounded,
                  onImportStudents ?? () {},
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSimpleActionButton(
                  '数据统计',
                  Icons.analytics_rounded,
                  onShowStats ?? () {},
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
                  onShowMyClasses ?? () {},
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSimpleActionButton(
                  '学生统计',
                  Icons.analytics_rounded,
                  onShowStats ?? () {},
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSimpleActionButton(
                  '考勤查看',
                  Icons.access_time_rounded,
                  onShowAttendance ?? () {},
                ),
              ),
            ],
          );
        } else {
          return Row(
            children: [
              Expanded(
                child: _buildSimpleActionButton(
                  '学生信息',
                  Icons.info_rounded,
                  onShowStats ?? () {},
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
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
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
            Flexible(
              child: Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

