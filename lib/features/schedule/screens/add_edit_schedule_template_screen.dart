import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/schedule_template_provider.dart';
import '../models/schedule_template_model.dart';

class AddEditScheduleTemplateScreen extends StatefulWidget {
  final ScheduleTemplateModel? template;

  const AddEditScheduleTemplateScreen({super.key, this.template});

  @override
  State<AddEditScheduleTemplateScreen> createState() => _AddEditScheduleTemplateScreenState();
}

class _AddEditScheduleTemplateScreenState extends State<AddEditScheduleTemplateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _startTimeController = TextEditingController();
  final _endTimeController = TextEditingController();
  final _maxHoursController = TextEditingController();
  final _colorController = TextEditingController();

  String _selectedType = 'fulltime';
  bool _isActive = true;
  Map<String, bool> _workDays = {
    'Monday': false,
    'Tuesday': false,
    'Wednesday': false,
    'Thursday': false,
    'Friday': false,
    'Saturday': false,
    'Sunday': false,
  };

  final List<String> _weekDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
    'Friday', 'Saturday', 'Sunday'
  ];

  final List<String> _weekDaysChinese = [
    '星期一', '星期二', '星期三', '星期四', 
    '星期五', '星期六', '星期日'
  ];

  @override
  void initState() {
    super.initState();
    _initializeForm();
  }

  void _initializeForm() {
    if (widget.template != null) {
      _nameController.text = widget.template!.name;
      _selectedType = widget.template!.type;
      _startTimeController.text = widget.template!.startTime;
      _endTimeController.text = widget.template!.endTime;
      _maxHoursController.text = widget.template!.maxHoursPerWeek.toString();
      _colorController.text = widget.template!.color;
      _isActive = widget.template!.isActive;
      _workDays = Map.from(widget.template!.workDays);
    } else {
      _colorController.text = '#2196F3';
      _maxHoursController.text = '40.0';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _startTimeController.dispose();
    _endTimeController.dispose();
    _maxHoursController.dispose();
    _colorController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(widget.template == null ? '添加排班模板' : '编辑排班模板'),
        actions: [
          TextButton(
            onPressed: _saveTemplate,
            child: const Text(
              '保存',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildBasicInfoSection(),
              const SizedBox(height: 24),
              _buildWorkDaysSection(),
              const SizedBox(height: 24),
              _buildTimeSection(),
              const SizedBox(height: 24),
              _buildSettingsSection(),
              const SizedBox(height: 24),
              _buildSaveButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBasicInfoSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '基本信息',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: '模板名称 *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.label),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '请输入模板名称';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedType,
              decoration: const InputDecoration(
                labelText: '模板类型 *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.work),
              ),
              items: const [
                DropdownMenuItem(value: 'fulltime', child: Text('全职')),
                DropdownMenuItem(value: 'parttime', child: Text('兼职')),
                DropdownMenuItem(value: 'teaching_only', child: Text('仅教学')),
              ],
              onChanged: (value) {
                setState(() {
                  _selectedType = value!;
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWorkDaysSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '工作天数',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: List.generate(_weekDays.length, (index) {
                final day = _weekDays[index];
                final dayChinese = _weekDaysChinese[index];
                final isSelected = _workDays[day] ?? false;
                
                return FilterChip(
                  label: Text(dayChinese),
                  selected: isSelected,
                  onSelected: (selected) {
                    setState(() {
                      _workDays[day] = selected;
                    });
                  },
                  selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                  checkmarkColor: AppTheme.primaryColor,
                );
              }),
            ),
            const SizedBox(height: 8),
            Text(
              '已选择 ${_workDays.values.where((v) => v).length} 天',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '时间设置',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => _selectTime(context, _startTimeController),
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: '开始时间 *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.access_time),
                      ),
                      child: Text(_startTimeController.text.isEmpty ? '选择时间' : _startTimeController.text),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: InkWell(
                    onTap: () => _selectTime(context, _endTimeController),
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: '结束时间 *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.access_time),
                      ),
                      child: Text(_endTimeController.text.isEmpty ? '选择时间' : _endTimeController.text),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _maxHoursController,
              decoration: const InputDecoration(
                labelText: '每周最大工作时长 (小时) *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.timer),
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '请输入每周最大工作时长';
                }
                if (double.tryParse(value) == null) {
                  return '请输入有效的数字';
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '其他设置',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _colorController,
              decoration: const InputDecoration(
                labelText: '模板颜色',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.palette),
                hintText: '#2196F3',
              ),
            ),
            const SizedBox(height: 16),
            SwitchListTile(
              title: const Text('启用模板'),
              value: _isActive,
              onChanged: (value) {
                setState(() {
                  _isActive = value;
                });
              },
              secondary: const Icon(Icons.toggle_on),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSaveButton() {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: _saveTemplate,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primaryColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text(
          '保存模板',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  Future<void> _selectTime(BuildContext context, TextEditingController controller) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (picked != null) {
      setState(() {
        controller.text = picked.format(context);
      });
    }
  }

  Future<void> _saveTemplate() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_workDays.values.every((v) => !v)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('请至少选择一天作为工作日'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final templateProvider = context.read<ScheduleTemplateProvider>();

    final data = {
      'name': _nameController.text,
      'type': _selectedType,
      'work_days': _workDays,
      'start_time': _startTimeController.text,
      'end_time': _endTimeController.text,
      'max_hours_per_week': double.parse(_maxHoursController.text),
      'color': _colorController.text,
      'is_active': _isActive,
    };

    bool success;
    if (widget.template == null) {
      success = await templateProvider.createTemplate(data);
    } else {
      success = await templateProvider.updateTemplate(widget.template!.id, data);
    }

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.template == null ? '排班模板创建成功' : '排班模板更新成功'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(templateProvider.error ?? '操作失败'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
