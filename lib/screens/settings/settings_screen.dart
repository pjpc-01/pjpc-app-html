import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_logo.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _darkModeEnabled = false;
  String _selectedLanguage = 'zh';
  late ScrollController _scrollController;
  bool _showScrollToTop = false;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.offset > 200) {
      if (!_showScrollToTop) {
        setState(() {
          _showScrollToTop = true;
        });
      }
    } else {
      if (_showScrollToTop) {
        setState(() {
          _showScrollToTop = false;
        });
      }
    }
  }

  void _scrollToTop() {
    _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeInOut,
    );
  }

  Widget _buildModernHeader(bool isSmallScreen) {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF6366F1),
              Color(0xFF4F46E5),
            ],
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF6366F1).withOpacity(0.3),
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
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const AppLogo(
                    size: 40,
                    showText: false,
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '系统设置',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        '个性化您的应用体验',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
                Consumer<AuthProvider>(
                  builder: (context, authProvider, child) {
                    final user = authProvider.user;
                    final userName = user?.getStringValue('name') ?? '用户';
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        userName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 20),
            _buildSettingsQuickActions(isSmallScreen),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsQuickActions(bool isSmallScreen) {
    return Row(
      children: [
        Expanded(
          child: _buildActionButton(
            '个人资料',
            Icons.person,
            const Color(0xFF3B82F6),
            () => _editProfile(),
            isSmallScreen,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            '通知设置',
            Icons.notifications,
            const Color(0xFF10B981),
            () => _showReminderDialog(),
            isSmallScreen,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            '主题设置',
            Icons.palette,
            const Color(0xFF8B5CF6),
            () => _showThemeDialog(),
            isSmallScreen,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton(String title, IconData icon, Color color, VoidCallback onTap, bool isSmallScreen) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
          vertical: isSmallScreen ? 12 : 16, 
          horizontal: 8,
        ),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: Colors.white, size: isSmallScreen ? 20 : 24),
            SizedBox(height: isSmallScreen ? 4 : 6),
            Text(
              title,
              style: TextStyle(
                color: Colors.white,
                fontSize: isSmallScreen ? 10 : 12,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
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
      appBar: AppBar(
        title: const Text(
          '系统设置',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF6366F1),
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          _buildModernHeader(isSmallScreen),
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
      floatingActionButton: _showScrollToTop ? _buildScrollToTopButton() : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }

  Widget _buildScrollToTopButton() {
    return FloatingActionButton(
      onPressed: _scrollToTop,
      backgroundColor: const Color(0xFF6366F1),
      child: const Icon(
        Icons.keyboard_arrow_up,
        color: Colors.white,
        size: 28,
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
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Logo
              const AppLogo(
                size: 100,
                showText: true,
                textColor: Color(0xFF1E3A8A),
                textSize: 16,
              ),
              
              const SizedBox(height: 20),
              
              // 应用信息
              Text(
                'PJPC 学校管理系统',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1E3A8A),
                ),
              ),
              
              const SizedBox(height: 8),
              
              Text(
                '版本 1.0.0',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
              
              const SizedBox(height: 16),
              
              // 功能描述
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[200]!),
                ),
                child: Column(
                  children: [
                    Text(
                      '智能教育管理平台',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF1E3A8A),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '• 学生信息管理\n• NFC智能考勤\n• 积分奖励系统\n• 成绩管理\n• 家长沟通平台',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[700],
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 16),
              
              // 联系信息
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E3A8A).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.location_on,
                      color: const Color(0xFF1E3A8A),
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '温馨小屋安亲补习中心\nPusat Jagaan Prospek Cemerlang',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: const Color(0xFF1E3A8A),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text(
                '确定',
                style: TextStyle(
                  color: Color(0xFF1E3A8A),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        );
      },
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
            onPressed: () async {
              Navigator.pop(context);
              final authProvider = Provider.of<AuthProvider>(context, listen: false);
              await authProvider.logout();
              // AuthWrapper会自动处理导航，不需要手动导航
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
