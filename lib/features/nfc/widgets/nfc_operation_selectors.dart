import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../teacher/providers/teacher_provider.dart';
import '../../../core/theme/app_theme.dart';

/// NFC操作模式选择器
class NfcOperationModeSelector extends StatelessWidget {
  final String currentMode;
  final Function(String) onModeChanged;
  final bool isSmallScreen;

  const NfcOperationModeSelector({
    super.key,
    required this.currentMode,
    required this.onModeChanged,
    required this.isSmallScreen,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(isSmallScreen ? 12 : 16),
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
            '操作模式',
            style: TextStyle(
              fontSize: isSmallScreen ? 16 : 18,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildModeButton(
                  'replacement',
                  '补办NFC卡',
                  Icons.add_card_rounded,
                  isSmallScreen,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildModeButton(
                  'assignment',
                  '分配NFC卡',
                  Icons.assignment_rounded,
                  isSmallScreen,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildModeButton(
    String mode,
    String label,
    IconData icon,
    bool isSmallScreen,
  ) {
    final isSelected = currentMode == mode;
    
    return GestureDetector(
      onTap: () => onModeChanged(mode),
      child: Container(
        padding: EdgeInsets.all(isSmallScreen ? 12 : 16),
        decoration: BoxDecoration(
          color: isSelected 
            ? AppTheme.primaryColor.withOpacity(0.1)
            : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected 
              ? AppTheme.primaryColor
              : const Color(0xFFE2E8F0),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected 
                ? AppTheme.primaryColor
                : const Color(0xFF64748B),
              size: isSmallScreen ? 24 : 28,
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: isSmallScreen ? 12 : 14,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected 
                  ? AppTheme.primaryColor
                  : const Color(0xFF64748B),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

/// 用户类型选择器
class UserTypeSelector extends StatelessWidget {
  final String userType;
  final Function(String) onUserTypeChanged;
  final bool isSmallScreen;

  const UserTypeSelector({
    super.key,
    required this.userType,
    required this.onUserTypeChanged,
    required this.isSmallScreen,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(isSmallScreen ? 12 : 16),
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
            '用户类型',
            style: TextStyle(
              fontSize: isSmallScreen ? 16 : 18,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildUserTypeButton(
                  'student',
                  '学生',
                  Icons.school_rounded,
                  isSmallScreen,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildUserTypeButton(
                  'teacher',
                  '教师',
                  Icons.person_rounded,
                  isSmallScreen,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildUserTypeButton(
    String type,
    String label,
    IconData icon,
    bool isSmallScreen,
  ) {
    final isSelected = userType == type;
    
    return GestureDetector(
      onTap: () => onUserTypeChanged(type),
      child: Container(
        padding: EdgeInsets.all(isSmallScreen ? 12 : 16),
        decoration: BoxDecoration(
          color: isSelected 
            ? AppTheme.primaryColor.withOpacity(0.1)
            : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected 
              ? AppTheme.primaryColor
              : const Color(0xFFE2E8F0),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected 
                ? AppTheme.primaryColor
                : const Color(0xFF64748B),
              size: isSmallScreen ? 24 : 28,
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: isSmallScreen ? 12 : 14,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected 
                  ? AppTheme.primaryColor
                  : const Color(0xFF64748B),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
