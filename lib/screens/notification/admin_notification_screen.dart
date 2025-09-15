import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../providers/notification_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/teacher_provider.dart';
import '../../services/pocketbase_service.dart';
import '../../theme/app_theme.dart';

class AdminNotificationScreen extends StatefulWidget {
  const AdminNotificationScreen({super.key});

  @override
  State<AdminNotificationScreen> createState() => _AdminNotificationScreenState();
}

class _AdminNotificationScreenState extends State<AdminNotificationScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _messageController = TextEditingController();
  
  String _selectedType = 'announcement';
  String _selectedRecipientRole = '';
  List<Map<String, String>> _recipientRoles = [];
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().loadNotifications();
      context.read<TeacherProvider>().loadTeachers();
      _loadRecipientRoles();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _titleController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        children: [
          _buildAppBar(),
          _buildTabBar(),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildCreateNotificationForm(),
                _buildNotificationList(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppBar() {
    return Container(
      padding: EdgeInsets.fromLTRB(
        20,
        MediaQuery.of(context).padding.top + 20,
        20,
        20,
      ),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1E293B), Color(0xFF334155)],
        ),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back, color: Colors.white),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '通知管理',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  '发布和管理学校通知',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: const LinearGradient(
            colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
          ),
        ),
        labelColor: Colors.white,
        unselectedLabelColor: const Color(0xFF6B7280),
        labelStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
        tabs: const [
          Tab(
            icon: Icon(Icons.add_circle_outline),
            text: '发布通知',
          ),
          Tab(
            icon: Icon(Icons.list_alt),
            text: '通知列表',
          ),
        ],
      ),
    );
  }

  Widget _buildCreateNotificationForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionTitle('通知信息', '填写通知的基本信息'),
            const SizedBox(height: 20),
            _buildFormField(
              '通知标题',
              '请输入通知标题',
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  hintText: '请输入通知标题',
                  border: OutlineInputBorder(),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFF3B82F6)),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return '请输入通知标题';
                  }
                  return null;
                },
              ),
            ),
            const SizedBox(height: 20),
            _buildFormField(
              '通知内容',
              '请输入通知的详细内容',
              TextFormField(
                controller: _messageController,
                maxLines: 5,
                decoration: const InputDecoration(
                  hintText: '请输入通知内容',
                  border: OutlineInputBorder(),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFF3B82F6)),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return '请输入通知内容';
                  }
                  return null;
                },
              ),
            ),
            const SizedBox(height: 30),
            _buildSectionTitle('通知设置', '设置通知的类型和接收者'),
            const SizedBox(height: 20),
            _buildFormField(
              '通知类型',
              '选择通知类型',
              DropdownButtonFormField<String>(
                value: _selectedType,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFF3B82F6)),
                  ),
                ),
                items: [
                  DropdownMenuItem(value: 'announcement', child: Text('公告')),
                  DropdownMenuItem(value: 'urgent', child: Text('紧急通知')),
                  DropdownMenuItem(value: 'meeting', child: Text('会议通知')),
                  DropdownMenuItem(value: 'system', child: Text('系统通知')),
                  DropdownMenuItem(value: 'event', child: Text('活动通知')),
                ],
                onChanged: (value) {
                  setState(() {
                    _selectedType = value!;
                  });
                },
              ),
            ),
            const SizedBox(height: 20),
            _buildFormField(
              '接收者',
              '选择接收通知的用户角色',
              DropdownButtonFormField<String>(
                value: _selectedRecipientRole.isEmpty ? null : _selectedRecipientRole,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFF3B82F6)),
                  ),
                ),
                hint: const Text('请选择接收者角色'),
                items: _recipientRoles.map((role) {
                  return DropdownMenuItem(
                    value: role['value'],
                    child: Text(role['label'] ?? ''),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedRecipientRole = value ?? '';
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return '请选择接收者角色';
                  }
                  return null;
                },
              ),
            ),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitNotification,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3B82F6),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.send, size: 20),
                          SizedBox(width: 8),
                          Text(
                            '发布通知',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationList() {
    return Consumer<NotificationProvider>(
      builder: (context, notificationProvider, child) {
        if (notificationProvider.isLoading) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }

        if (notificationProvider.notifications.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.notifications_none,
                  size: 64,
                  color: Color(0xFF94A3B8),
                ),
                const SizedBox(height: 16),
                const Text(
                  '暂无通知',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  '发布的通知将在这里显示',
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: () {
                    _createTestNotification();
                  },
                  icon: const Icon(Icons.add),
                  label: const Text('创建测试通知'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3B82F6),
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(20),
          itemCount: notificationProvider.notifications.length,
          itemBuilder: (context, index) {
            final notification = notificationProvider.notifications[index];
            return _buildNotificationCard(notification, notificationProvider);
          },
        );
      },
    );
  }

  Widget _buildSectionTitle(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          subtitle,
          style: const TextStyle(
            fontSize: 14,
            color: Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildFormField(String title, String subtitle, Widget child) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          subtitle,
          style: const TextStyle(
            fontSize: 14,
            color: Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 12),
        child,
      ],
    );
  }


  Widget _buildNotificationCard(RecordModel notification, NotificationProvider provider) {
    final type = notification.getStringValue('type') ?? 'announcement';
    final created = DateTime.tryParse(notification.created) ?? DateTime.now();
    final isRead = notification.getBoolValue('is_read') ?? false;
    final recipientRole = notification.getStringValue('recipient_role') ?? 'all';
    final readCount = notification.getIntValue('read_count') ?? 0;
    final totalCount = notification.getIntValue('total_count') ?? 0;
    final title = notification.getStringValue('title') ?? '无标题';
    final message = notification.getStringValue('message') ?? '无内容';
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF3B82F6),
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          ListTile(
            contentPadding: const EdgeInsets.all(20),
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                provider.getTypeIcon(type),
                color: const Color(0xFF3B82F6),
                size: 20,
              ),
            ),
            title: Text(
              notification.getStringValue('title') ?? '无标题',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1E293B),
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                Text(
                  notification.getStringValue('message') ?? '',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF64748B),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        _getTypeText(type),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF3B82F6),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '发送给: ${_getRoleText(recipientRole)}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF10B981),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      provider.formatTime(created),
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                    const Spacer(),
                    _buildReadStatusBadge(recipientRole, readCount, totalCount),
                  ],
                ),
              ],
            ),
            trailing: PopupMenuButton<String>(
              onSelected: (value) {
                if (value == 'delete') {
                  _showDeleteDialog(notification.id, provider);
                }
              },
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete, color: Color(0xFFEF4444)),
                      SizedBox(width: 8),
                      Text('删除'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getTypeText(String type) {
    switch (type.toLowerCase()) {
      case 'announcement':
        return '公告';
      case 'urgent':
        return '紧急';
      case 'meeting':
        return '会议';
      case 'system':
        return '系统';
      case 'event':
        return '活动';
      default:
        return '通知';
    }
  }

  // 创建测试通知
  Future<void> _createTestNotification() async {
    try {
      final notificationProvider = context.read<NotificationProvider>();
      final pocketBaseService = PocketBaseService.instance;
      
      // 获取当前用户信息
      final currentUser = pocketBaseService.pb.authStore.record;
      final currentUserId = currentUser?.id ?? '';
      final currentUserRole = currentUser?.getStringValue('role') ?? '';
      final currentUserEmail = currentUser?.getStringValue('email') ?? '';
      
      print('=== 创建测试通知调试信息 ===');
      print('当前用户ID: $currentUserId');
      print('当前用户角色: $currentUserRole');
      print('当前用户邮箱: $currentUserEmail');
      
      // 检查sender_id字段的关联关系
      // 如果sender_id关联到teachers集合，我们需要找到对应的teacher记录
      String? senderId = currentUserId;
      
      // 尝试查找对应的teacher记录
      try {
        final teachers = await pocketBaseService.getTeachers();
        RecordModel? teacherRecord;
        
        // 查找匹配的teacher记录
        for (final teacher in teachers) {
          if (teacher.getStringValue('user_id') == currentUserId) {
            teacherRecord = teacher;
            break;
          }
        }
        
        // 如果没找到匹配的，使用第一个teacher记录
        if (teacherRecord == null && teachers.isNotEmpty) {
          teacherRecord = teachers.first;
        }
        
        if (teacherRecord != null) {
          senderId = teacherRecord.id;
          print('找到对应的teacher记录: ${teacherRecord.id}');
        }
      } catch (e) {
        print('查找teacher记录失败: $e');
        // 如果找不到teacher记录，不设置sender_id
        senderId = null;
      }
      
      // 创建发送给教师的通知
      final testData = {
        'title': '测试通知 - 发送给教师',
        'message': '这是一个发送给教师的测试通知，用于验证教师工作台是否能正确接收通知。',
        'type': 'announcement',
        'recipient_role': 'teacher',
        if (senderId != null) 'sender_id': senderId,
      };
      
      print('创建测试通知数据: $testData');
      
      await pocketBaseService.createNotification(testData);
      
      // 强制刷新通知列表
      print('通知创建成功，开始刷新列表...');
      await notificationProvider.loadNotifications(useCache: false);
      
      // 等待一下确保数据加载完成
      await Future.delayed(const Duration(milliseconds: 500));
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('测试通知创建成功！已发送给教师角色\n当前通知数量: ${notificationProvider.notifications.length}'),
            backgroundColor: const Color(0xFF10B981),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      print('创建测试通知失败: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('创建测试通知失败: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  Widget _buildReadStatusBadge(String recipientRole, int readCount, int totalCount) {
    final roleText = _getRoleText(recipientRole);
    final readPercentage = totalCount > 0 ? (readCount / totalCount * 100).round() : 0;
    final isFullyRead = readCount == totalCount && totalCount > 0;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isFullyRead 
            ? const Color(0xFF10B981).withOpacity(0.1)
            : const Color(0xFFF59E0B).withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: isFullyRead 
              ? const Color(0xFF10B981)
              : const Color(0xFFF59E0B),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isFullyRead ? Icons.check_circle : Icons.schedule,
            size: 12,
            color: isFullyRead 
                ? const Color(0xFF10B981)
                : const Color(0xFFF59E0B),
          ),
          const SizedBox(width: 4),
          Text(
            '$readCount/$totalCount',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isFullyRead 
                  ? const Color(0xFF10B981)
                  : const Color(0xFFF59E0B),
            ),
          ),
        ],
      ),
    );
  }

  String _getRoleText(String role) {
    switch (role.toLowerCase()) {
      case 'admin':
        return '管理员';
      case 'teacher':
        return '教师';
      case 'parent':
        return '家长';
      case 'student':
        return '学生';
      case 'all':
        return '所有用户';
      default:
        return '用户';
    }
  }

  Future<void> _submitNotification() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedRecipientRole.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('请选择接收者角色'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      await context.read<NotificationProvider>().createNotification(
        title: _titleController.text.trim(),
        message: _messageController.text.trim(),
        type: _selectedType,
        recipientRole: _selectedRecipientRole,
      );

      // 清空表单
      _titleController.clear();
      _messageController.clear();
      _selectedType = 'announcement';
      _selectedRecipientRole = '';

      // 切换到通知列表标签页
      _tabController.animateTo(1);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('通知发布成功！'),
          backgroundColor: Color(0xFF10B981),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('发布失败: $e'),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  void _loadRecipientRoles() {
    _recipientRoles = [
      {'value': 'admin', 'label': '管理员'},
      {'value': 'teacher', 'label': '教师'},
      {'value': 'parent', 'label': '家长'},
      {'value': 'student', 'label': '学生'},
      {'value': 'all', 'label': '所有用户'},
    ];
    setState(() {});
  }

  void _showDeleteDialog(String notificationId, NotificationProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('删除通知'),
        content: const Text('确定要删除这条通知吗？此操作无法撤销。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              provider.deleteNotification(notificationId);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
            ),
            child: const Text('删除'),
          ),
        ],
      ),
    );
  }
}

