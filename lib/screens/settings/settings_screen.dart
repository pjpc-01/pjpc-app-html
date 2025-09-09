import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _darkModeEnabled = false;
  String _selectedLanguage = 'zh';

  Widget _buildEnterpriseAppBar(bool isSmallScreen) {
    return SliverAppBar(
      expandedHeight: 120,
      floating: false,
      pinned: true,
      backgroundColor: const Color(0xFF1E293B),
      foregroundColor: Colors.white,
      flexibleSpace: FlexibleSpaceBar(
        title: Text(
          '系统设置中心',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: isSmallScreen ? 16 : 18,
          ),
        ),
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF1E293B),
                Color(0xFF334155),
                Color(0xFF475569),
              ],
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                right: -50,
                top: -50,
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.1),
                  ),
                ),
              ),
              Positioned(
                left: -30,
                bottom: -30,
                child: Container(
                  width: 150,
                  height: 150,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.05),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenHeight < 700 || screenWidth < 360;
    
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          _buildEnterpriseAppBar(isSmallScreen),
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(isSmallScreen ? 12 : AppSpacing.lg),
              child: Column(
                children: [
          _buildProfileSection(isSmallScreen),
          SizedBox(height: isSmallScreen ? 16 : AppSpacing.xl),
          _buildGeneralSection(),
          SizedBox(height: isSmallScreen ? 16 : AppSpacing.xl),
          _buildNotificationSection(),
          SizedBox(height: isSmallScreen ? 16 : AppSpacing.xl),
          _buildAppearanceSection(),
          SizedBox(height: isSmallScreen ? 16 : AppSpacing.xl),
          _buildAboutSection(),
          SizedBox(height: isSmallScreen ? 16 : AppSpacing.xl),
          _buildLogoutSection(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileSection(bool isSmallScreen) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final user = authProvider.user;
        final userName = user?.getStringValue('name') ?? '用户';
        final userEmail = user?.getStringValue('email') ?? 'user@example.com';

        return Container(
          padding: EdgeInsets.all(isSmallScreen ? 12 : AppSpacing.lg),
          decoration: BoxDecoration(
            color: AppTheme.cardColor,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppTheme.dividerColor),
            boxShadow: AppTheme.cardShadow,
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: isSmallScreen ? 24 : 32,
                backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                child: Text(
                  userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                  style: AppTextStyles.headline4.copyWith(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                    fontSize: isSmallScreen ? 16 : 20,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      userName,
                      style: AppTextStyles.bodyLarge.copyWith(
                        fontWeight: FontWeight.w600,
                        fontSize: isSmallScreen ? 14 : 16,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      userEmail,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppTheme.textSecondary,
                        fontSize: isSmallScreen ? 12 : 14,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: _editProfile,
                icon: Icon(
                  Icons.edit,
                  size: isSmallScreen ? 20 : 24,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildGeneralSection() {
    return _buildSection(
      title: '通用设置',
      children: [
        _buildSettingItem(
          icon: Icons.language,
          title: '语言',
          subtitle: _getLanguageName(_selectedLanguage),
          onTap: _showLanguageDialog,
        ),
        _buildSettingItem(
          icon: Icons.storage,
          title: '存储管理',
          subtitle: '清理缓存和数据',
          onTap: _showStorageDialog,
        ),
        _buildSettingItem(
          icon: Icons.backup,
          title: '数据备份',
          subtitle: '备份和恢复数据',
          onTap: _showBackupDialog,
        ),
      ],
    );
  }

  Widget _buildNotificationSection() {
    return _buildSection(
      title: '通知设置',
      children: [
        _buildSwitchItem(
          icon: Icons.notifications,
          title: '推送通知',
          subtitle: '接收考勤提醒和更新',
          value: _notificationsEnabled,
          onChanged: (value) => setState(() => _notificationsEnabled = value),
        ),
        _buildSettingItem(
          icon: Icons.schedule,
          title: '提醒时间',
          subtitle: '设置考勤提醒时间',
          onTap: _showReminderDialog,
        ),
      ],
    );
  }

  Widget _buildAppearanceSection() {
    return _buildSection(
      title: '外观设置',
      children: [
        _buildSwitchItem(
          icon: Icons.dark_mode,
          title: '深色模式',
          subtitle: '使用深色主题',
          value: _darkModeEnabled,
          onChanged: (value) => setState(() => _darkModeEnabled = value),
        ),
        _buildSettingItem(
          icon: Icons.palette,
          title: '主题颜色',
          subtitle: '自定义应用主题',
          onTap: _showThemeDialog,
        ),
      ],
    );
  }

  Widget _buildAboutSection() {
    return _buildSection(
      title: '关于应用',
      children: [
        _buildSettingItem(
          icon: Icons.info,
          title: '应用信息',
          subtitle: '版本 1.0.0',
          onTap: _showAppInfo,
        ),
        _buildSettingItem(
          icon: Icons.help,
          title: '帮助中心',
          subtitle: '使用指南和常见问题',
          onTap: _showHelp,
        ),
        _buildSettingItem(
          icon: Icons.feedback,
          title: '意见反馈',
          subtitle: '提交建议和问题',
          onTap: _showFeedback,
        ),
      ],
    );
  }

  Widget _buildLogoutSection() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppTheme.errorColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppTheme.errorColor.withOpacity(0.3)),
      ),
      child: ListTile(
        leading: Icon(
          Icons.logout,
          color: AppTheme.errorColor,
        ),
        title: Text(
          '退出登录',
          style: AppTextStyles.bodyLarge.copyWith(
            color: AppTheme.errorColor,
            fontWeight: FontWeight.w600,
          ),
        ),
        onTap: _showLogoutDialog,
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppTextStyles.headline6.copyWith(
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Container(
          decoration: BoxDecoration(
            color: AppTheme.cardColor,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppTheme.dividerColor),
            boxShadow: AppTheme.cardShadow,
          ),
          child: Column(
            children: children,
          ),
        ),
      ],
    );
  }

  Widget _buildSettingItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primaryColor),
      title: Text(
        title,
        style: AppTextStyles.bodyLarge.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: AppTextStyles.bodySmall.copyWith(
          color: AppTheme.textSecondary,
        ),
      ),
      trailing: const Icon(
        Icons.arrow_forward_ios,
        size: 16,
        color: AppTheme.textTertiary,
      ),
      onTap: onTap,
    );
  }

  Widget _buildSwitchItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primaryColor),
      title: Text(
        title,
        style: AppTextStyles.bodyLarge.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: AppTextStyles.bodySmall.copyWith(
          color: AppTheme.textSecondary,
        ),
      ),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeColor: AppTheme.primaryColor,
      ),
    );
  }

  String _getLanguageName(String code) {
    switch (code) {
      case 'zh':
        return '简体中文';
      case 'en':
        return 'English';
      default:
        return '简体中文';
    }
  }

  void _editProfile() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('编辑资料'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              decoration: InputDecoration(
                labelText: '姓名',
                prefixIcon: Icon(Icons.person),
              ),
            ),
            SizedBox(height: 16),
            TextField(
              decoration: InputDecoration(
                labelText: '邮箱',
                prefixIcon: Icon(Icons.email),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('资料更新成功'),
                  backgroundColor: AppTheme.successColor,
                ),
              );
            },
            child: const Text('保存'),
          ),
        ],
      ),
    );
  }

  void _showLanguageDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('选择语言'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('简体中文'),
              leading: Radio<String>(
                value: 'zh',
                groupValue: _selectedLanguage,
                onChanged: (value) {
                  setState(() => _selectedLanguage = value!);
                },
              ),
            ),
            ListTile(
              title: const Text('English'),
              leading: Radio<String>(
                value: 'en',
                groupValue: _selectedLanguage,
                onChanged: (value) {
                  setState(() => _selectedLanguage = value!);
                },
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('语言设置已更新'),
                  backgroundColor: AppTheme.successColor,
                ),
              );
            },
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  void _showStorageDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('存储管理'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.cached),
              title: Text('缓存数据'),
              subtitle: Text('12.5 MB'),
              trailing: TextButton(
                onPressed: null,
                child: Text('清理'),
              ),
            ),
            ListTile(
              leading: Icon(Icons.storage),
              title: Text('离线数据'),
              subtitle: Text('8.2 MB'),
              trailing: TextButton(
                onPressed: null,
                child: Text('清理'),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('关闭'),
          ),
        ],
      ),
    );
  }

  void _showBackupDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('数据备份'),
        content: const Text('是否要备份当前数据到云端？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('备份成功'),
                  backgroundColor: AppTheme.successColor,
                ),
              );
            },
            child: const Text('备份'),
          ),
        ],
      ),
    );
  }

  void _showReminderDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('提醒时间'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: Text('考勤提醒'),
              subtitle: Text('每天 08:00'),
            ),
            ListTile(
              title: Text('数据同步'),
              subtitle: Text('每天 18:00'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('关闭'),
          ),
        ],
      ),
    );
  }

  void _showThemeDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('主题颜色'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('主题颜色自定义功能即将推出'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  void _showAppInfo() {
    showAboutDialog(
      context: context,
      applicationName: 'PJPC考勤管理系统',
      applicationVersion: '1.0.0',
      applicationIcon: const Icon(
        Icons.access_time,
        size: 48,
        color: AppTheme.primaryColor,
      ),
    );
  }

  void _showHelp() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) =>         Scaffold(
          appBar: AppBar(
            title: const Text('帮助中心'),
            backgroundColor: AppTheme.primaryColor,
            foregroundColor: Colors.white,
          ),
          body: const Center(
            child: Text('帮助内容即将推出'),
          ),
        ),
      ),
    );
  }

  void _showFeedback() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('意见反馈'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              decoration: InputDecoration(
                labelText: '反馈内容',
                hintText: '请输入您的建议或问题',
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('反馈提交成功'),
                  backgroundColor: AppTheme.successColor,
                ),
              );
            },
            child: const Text('提交'),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('退出登录'),
        content: const Text('确定要退出登录吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Provider.of<AuthProvider>(context, listen: false).logout();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
              foregroundColor: Colors.white,
            ),
            child: const Text('退出'),
          ),
        ],
      ),
    );
  }
}