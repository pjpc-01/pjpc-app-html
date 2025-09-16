import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';

class RoleSwitchButton extends StatelessWidget {
  const RoleSwitchButton({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        // 添加空值检查
        if (authProvider.userProfile == null) {
          return const SizedBox.shrink();
        }
        
        // 如果用户没有多个角色，不显示按钮
        if (!authProvider.hasMultipleRoles) {
          return const SizedBox.shrink();
        }
        
        return Container(
          margin: const EdgeInsets.only(top: 12),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.swap_horiz_rounded,
                        color: Colors.white.withOpacity(0.9),
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '当前身份: ${authProvider.getRoleDisplayName(authProvider.activeRole)}',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.9),
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () => _showRoleSelectionDialog(context, authProvider),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Icon(
                    Icons.swap_horiz_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showRoleSelectionDialog(BuildContext context, AuthProvider authProvider) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Row(
            children: [
              Icon(
                Icons.swap_horiz_rounded,
                color: AppTheme.primaryColor,
                size: 24,
              ),
              const SizedBox(width: 8),
              const Text('切换身份'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '选择您要切换的身份：',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              ...authProvider.userRoles.map((role) {
                final isActive = role == authProvider.activeRole;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isActive 
                            ? AppTheme.primaryColor.withOpacity(0.1)
                            : AppTheme.surfaceColor,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isActive 
                              ? AppTheme.primaryColor
                              : AppTheme.dividerColor,
                          width: isActive ? 2 : 1,
                        ),
                      ),
                      child: Icon(
                        _getRoleIcon(role),
                        color: isActive 
                            ? AppTheme.primaryColor
                            : AppTheme.textSecondary,
                        size: 20,
                      ),
                    ),
                    title: Text(
                      authProvider.getRoleDisplayName(role),
                      style: AppTextStyles.bodyLarge.copyWith(
                        fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                        color: isActive ? AppTheme.primaryColor : AppTheme.textPrimary,
                      ),
                    ),
                    subtitle: Text(
                      _getRoleDescription(role),
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    trailing: isActive
                        ? Icon(
                            Icons.check_circle,
                            color: AppTheme.primaryColor,
                            size: 24,
                          )
                        : null,
                    onTap: isActive ? null : () async {
                      try {
                        await authProvider.switchRole(role);
                        if (context.mounted) {
                          Navigator.of(context).pop();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('已切换到${authProvider.getRoleDisplayName(role)}身份'),
                              backgroundColor: AppTheme.successColor,
                              duration: const Duration(seconds: 2),
                            ),
                          );
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('切换身份失败: $e'),
                              backgroundColor: AppTheme.errorColor,
                            ),
                          );
                        }
                      }
                    },
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    tileColor: isActive 
                        ? AppTheme.primaryColor.withOpacity(0.05)
                        : null,
                  ),
                );
              }).toList(),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('取消'),
            ),
          ],
        );
      },
    );
  }

  IconData _getRoleIcon(String role) {
    switch (role) {
      case 'admin':
        return Icons.admin_panel_settings_rounded;
      case 'teacher':
        return Icons.school_rounded;
      case 'parent':
        return Icons.family_restroom_rounded;
      case 'accountant':
        return Icons.account_balance_rounded;
      default:
        return Icons.person_rounded;
    }
  }

  String _getRoleDescription(String role) {
    switch (role) {
      case 'admin':
        return '系统管理员，拥有所有权限';
      case 'teacher':
        return '教师身份，管理班级和学生';
      case 'parent':
        return '家长身份，查看孩子信息';
      case 'accountant':
        return '会计身份，管理财务数据';
      default:
        return '用户身份';
    }
  }
}