import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../providers/schedule_template_provider.dart';
import '../models/schedule_template_model.dart';
import 'add_edit_schedule_template_screen.dart';

class ScheduleTemplateManagementScreen extends StatefulWidget {
  const ScheduleTemplateManagementScreen({super.key});

  @override
  State<ScheduleTemplateManagementScreen> createState() => _ScheduleTemplateManagementScreenState();
}

class _ScheduleTemplateManagementScreenState extends State<ScheduleTemplateManagementScreen> {
  String? _selectedType;
  bool? _selectedActive;

  @override
  void initState() {
    super.initState();
    _loadTemplates();
  }

  Future<void> _loadTemplates() async {
    await Provider.of<ScheduleTemplateProvider>(context, listen: false).loadTemplates();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('排班模板管理'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _navigateToAddEditTemplate(context),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadTemplates,
          ),
        ],
      ),
      body: Column(
        children: [
          _buildFilterSection(),
          Expanded(
            child: Consumer<ScheduleTemplateProvider>(
              builder: (context, templateProvider, child) {
                if (templateProvider.isLoading) {
                  return const LoadingWidget();
                }

                if (templateProvider.error != null) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.red[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          '加载失败',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey[800],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          templateProvider.error!,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadTemplates,
                          child: const Text('重试'),
                        ),
                      ],
                    ),
                  );
                }

                final templates = templateProvider.templates;

                if (templates.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.schedule,
                          size: 64,
                          color: Colors.grey,
                        ),
                        SizedBox(height: 16),
                        Text(
                          '暂无排班模板',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          '点击右上角的 + 按钮添加模板',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: templates.length,
                  itemBuilder: (context, index) {
                    final template = templates[index];
                    return _buildTemplateCard(template, templateProvider);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 3,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: DropdownButtonFormField<String>(
              value: _selectedType,
              decoration: const InputDecoration(
                labelText: '类型',
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              items: const [
                DropdownMenuItem(value: null, child: Text('全部类型')),
                DropdownMenuItem(value: 'fulltime', child: Text('全职')),
                DropdownMenuItem(value: 'parttime', child: Text('兼职')),
                DropdownMenuItem(value: 'teaching_only', child: Text('仅教学')),
              ],
              onChanged: (value) {
                setState(() {
                  _selectedType = value;
                });
                _loadTemplates();
              },
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: DropdownButtonFormField<bool>(
              value: _selectedActive,
              decoration: const InputDecoration(
                labelText: '状态',
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              items: const [
                DropdownMenuItem(value: null, child: Text('全部状态')),
                DropdownMenuItem(value: true, child: Text('启用')),
                DropdownMenuItem(value: false, child: Text('禁用')),
              ],
              onChanged: (value) {
                setState(() {
                  _selectedActive = value;
                });
                _loadTemplates();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTemplateCard(ScheduleTemplateModel template, ScheduleTemplateProvider templateProvider) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: Color(int.parse(template.color.replaceFirst('#', '0xFF'))),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    template.name,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
                _buildTypeChip(template.type),
                const SizedBox(width: 8),
                _buildStatusChip(template.isActive),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.access_time, size: 18, color: AppTheme.textSecondary),
                const SizedBox(width: 8),
                Text(
                  '${template.startTime} - ${template.endTime}',
                  style: TextStyle(fontSize: 15, color: AppTheme.textSecondary),
                ),
                const Spacer(),
                const Icon(Icons.timer, size: 18, color: AppTheme.textSecondary),
                const SizedBox(width: 8),
                Text(
                  '${template.maxHoursPerWeek.toStringAsFixed(1)} 小时/周',
                  style: TextStyle(fontSize: 15, color: AppTheme.textSecondary),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 18, color: AppTheme.textSecondary),
                const SizedBox(width: 8),
                Text(
                  '工作天数: ${template.workDaysCount} 天',
                  style: TextStyle(fontSize: 15, color: AppTheme.textSecondary),
                ),
                const Spacer(),
                Text(
                  template.workDaysList.join(', '),
                  style: TextStyle(fontSize: 14, color: AppTheme.textSecondary),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  icon: const Icon(Icons.edit, color: AppTheme.accentColor),
                  onPressed: () => _navigateToAddEditTemplate(context, template: template),
                ),
                IconButton(
                  icon: const Icon(Icons.delete, color: AppTheme.errorColor),
                  onPressed: () => _confirmDeleteTemplate(context, template, templateProvider),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeChip(String type) {
    Color color;
    String text;
    
    switch (type) {
      case 'fulltime':
        color = Colors.blue;
        text = '全职';
        break;
      case 'parttime':
        color = Colors.green;
        text = '兼职';
        break;
      case 'teaching_only':
        color = Colors.purple;
        text = '仅教学';
        break;
      default:
        color = Colors.grey;
        text = type;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }

  Widget _buildStatusChip(bool isActive) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isActive ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isActive ? Colors.green.withOpacity(0.3) : Colors.red.withOpacity(0.3)),
      ),
      child: Text(
        isActive ? '启用' : '禁用',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: isActive ? Colors.green : Colors.red,
        ),
      ),
    );
  }

  void _navigateToAddEditTemplate(BuildContext context, {ScheduleTemplateModel? template}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditScheduleTemplateScreen(template: template),
      ),
    ).then((_) => _loadTemplates());
  }

  Future<void> _confirmDeleteTemplate(
      BuildContext context, ScheduleTemplateModel template, ScheduleTemplateProvider templateProvider) async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('删除排班模板'),
        content: Text('确定要删除模板 "${template.name}" 吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.errorColor),
            child: const Text('删除'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final success = await templateProvider.deleteTemplate(template.id);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('排班模板删除成功'), backgroundColor: Colors.green),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(templateProvider.error ?? '删除失败'), backgroundColor: Colors.red),
        );
      }
    }
  }
}
