import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../../core/theme/app_theme.dart';

/// 学生概览统计组件
class StudentOverviewWidget extends StatelessWidget {
  const StudentOverviewWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.all(20),
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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
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
                Text(
                  '学生概览',
                  style: AppTextStyles.headline5,
                ),
              ],
            ),
            const SizedBox(height: 20),
            Consumer<StudentProvider>(
              builder: (context, studentProvider, child) {
                final students = studentProvider.students;
                final totalStudents = students.length;
                
                // 修复统计逻辑 - 使用正确的年级映射
                final primaryStudents = students.where((s) {
                  final standard = s.getStringValue('standard') ?? '';
                  final grade = s.getStringValue('grade') ?? '';
                  return standard.toLowerCase().contains('standard') || 
                         grade.toLowerCase().contains('standard');
                }).length;
                
                final secondaryStudents = students.where((s) {
                  final standard = s.getStringValue('standard') ?? '';
                  final grade = s.getStringValue('grade') ?? '';
                  return standard.toLowerCase().contains('form') || 
                         grade.toLowerCase().contains('form');
                }).length;
                
                return Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        '总学生数',
                        totalStudents.toString(),
                        Icons.people_rounded,
                        const Color(0xFF3B82F6),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatCard(
                        '小学部 (Standard)',
                        primaryStudents.toString(),
                        Icons.child_care_rounded,
                        const Color(0xFF10B981),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatCard(
                        '中学部 (Form)',
                        secondaryStudents.toString(),
                        Icons.school_rounded,
                        const Color(0xFFF59E0B),
                      ),
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

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              color: color,
              size: 20,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: AppTheme.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
