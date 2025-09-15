import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';

class RoleSwitcherWidget extends StatelessWidget {
  const RoleSwitcherWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        // 如果用户没有多个角色，不显示切换器
        if (!authProvider.hasMultipleRoles) {
          return const SizedBox.shrink();
        }
        
        return Container(
          margin: const EdgeInsets.all(AppSpacing.md),
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: AppTheme.cardColor,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: AppTheme.dividerColor),
            boxShadow: AppTheme.cardShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.swap_horiz,
                    color: AppTheme.primaryColor,
                    size: 20,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    '身份切换',
                    style: AppTextStyles.headline6.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                '当前身份: ${authProvider.getRoleDisplayName(authProvider.activeRole)}',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.xs,
                children: authProvider.userRoles.map((role) {
                  final isActive = role == authProvider.activeRole;
                  return FilterChip(
                    label: Text(
                      authProvider.getRoleDisplayName(role),
                      style: AppTextStyles.bodySmall.copyWith(
                        color: isActive ? AppTheme.primaryColor : AppTheme.textPrimary,
                        fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    selected: isActive,
                    onSelected: isActive ? null : (selected) async {
                      try {
                        await authProvider.switchRole(role);
                        if (context.mounted) {
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
                    selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                    checkmarkColor: AppTheme.primaryColor,
                    backgroundColor: AppTheme.surfaceColor,
                    side: BorderSide(
                      color: isActive ? AppTheme.primaryColor : AppTheme.dividerColor,
                      width: isActive ? 2 : 1,
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        );
      },
    );
  }
}
