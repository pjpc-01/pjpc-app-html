import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../core/theme/app_theme.dart';
import '../../../features/teacher/providers/teacher_provider.dart';
import '../providers/schedule_provider.dart';
import '../models/schedule_model.dart';

class AddEditScheduleScreen extends StatefulWidget {
  final ScheduleModel? schedule;

  const AddEditScheduleScreen({super.key, this.schedule});

  @override
  State<AddEditScheduleScreen> createState() => _AddEditScheduleScreenState();
}

class _AddEditScheduleScreenState extends State<AddEditScheduleScreen> {
  final _formKey = GlobalKey<FormState>();
  final _centerController = TextEditingController();
  final _roomController = TextEditingController();
  final _hourlyRateController = TextEditingController();
  final _totalHoursController = TextEditingController();

  String? _selectedTeacherId;
  String? _selectedClassId;
  DateTime _selectedDate = DateTime.now();
  TimeOfDay _selectedStartTime = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _selectedEndTime = const TimeOfDay(hour: 17, minute: 0);
  String _selectedStatus = 'scheduled';
  String _selectedScheduleType = 'fulltime';
  bool _isOvertime = false;

  @override
  void initState() {
    super.initState();
    _initializeForm();
  }

  void _initializeForm() {
    if (widget.schedule != null) {
      _selectedTeacherId = widget.schedule!.teacherId;
      _selectedClassId = widget.schedule!.classId;
      _selectedDate = widget.schedule!.date;
      _selectedStartTime = TimeOfDay(
        hour: int.parse(widget.schedule!.startTime.split(':')[0]),
        minute: int.parse(widget.schedule!.startTime.split(':')[1]),
      );
      _selectedEndTime = TimeOfDay(
        hour: int.parse(widget.schedule!.endTime.split(':')[0]),
        minute: int.parse(widget.schedule!.endTime.split(':')[1]),
      );
      _selectedStatus = widget.schedule!.status;
      _selectedScheduleType = widget.schedule!.scheduleType;
      _isOvertime = widget.schedule!.isOvertime;
      _centerController.text = widget.schedule!.center ?? '';
      _roomController.text = widget.schedule!.room ?? '';
      _hourlyRateController.text = widget.schedule!.hourlyRate?.toString() ?? '';
      _totalHoursController.text = widget.schedule!.totalHours?.toString() ?? '';
    }
  }

  @override
  void dispose() {
    _centerController.dispose();
    _roomController.dispose();
    _hourlyRateController.dispose();
    _totalHoursController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(widget.schedule == null ? '添加排班' : '编辑排班'),
        actions: [
          TextButton(
            onPressed: _saveSchedule,
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
              _buildTeacherSelection(),
              const SizedBox(height: 16),
              _buildClassSelection(),
              const SizedBox(height: 16),
              _buildDateSelection(),
              const SizedBox(height: 16),
              _buildTimeSelection(),
              const SizedBox(height: 16),
              _buildStatusSelection(),
              const SizedBox(height: 16),
              _buildScheduleTypeSelection(),
              const SizedBox(height: 16),
              _buildLocationFields(),
              const SizedBox(height: 16),
              _buildRateFields(),
              const SizedBox(height: 16),
              _buildOvertimeToggle(),
              const SizedBox(height: 24),
              _buildSaveButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTeacherSelection() {
    return Consumer<TeacherProvider>(
      builder: (context, teacherProvider, child) {
        return DropdownButtonFormField<String>(
          value: _selectedTeacherId,
          decoration: const InputDecoration(
            labelText: '选择教师 *',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.person),
          ),
          items: teacherProvider.teachers.map((teacher) {
            return DropdownMenuItem<String>(
              value: teacher.id,
              child: Text(teacher.getStringValue('name') ?? '未知教师'),
            );
          }).toList(),
          onChanged: (value) {
            setState(() {
              _selectedTeacherId = value;
            });
          },
          validator: (value) {
            if (value == null || value.isEmpty) {
              return '请选择教师';
            }
            return null;
          },
        );
      },
    );
  }

  Widget _buildClassSelection() {
    return DropdownButtonFormField<String>(
      value: _selectedClassId,
      decoration: const InputDecoration(
        labelText: '选择班级',
        border: OutlineInputBorder(),
        prefixIcon: Icon(Icons.class_),
      ),
      items: const [
        DropdownMenuItem(value: null, child: Text('无班级')),
        // 这里可以添加从数据库获取的班级列表
      ],
      onChanged: (value) {
        setState(() {
          _selectedClassId = value;
        });
      },
    );
  }

  Widget _buildDateSelection() {
    return InkWell(
      onTap: _selectDate,
      child: InputDecorator(
        decoration: const InputDecoration(
          labelText: '选择日期 *',
          border: OutlineInputBorder(),
          prefixIcon: Icon(Icons.calendar_today),
        ),
        child: Text(
          '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}',
        ),
      ),
    );
  }

  Widget _buildTimeSelection() {
    return Row(
      children: [
        Expanded(
          child: InkWell(
            onTap: () => _selectTime(context, _selectedStartTime, (time) {
              setState(() {
                _selectedStartTime = time;
              });
            }),
            child: InputDecorator(
              decoration: const InputDecoration(
                labelText: '开始时间 *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.access_time),
              ),
              child: Text(_selectedStartTime.format(context)),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: InkWell(
            onTap: () => _selectTime(context, _selectedEndTime, (time) {
              setState(() {
                _selectedEndTime = time;
              });
            }),
            child: InputDecorator(
              decoration: const InputDecoration(
                labelText: '结束时间 *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.access_time),
              ),
              child: Text(_selectedEndTime.format(context)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatusSelection() {
    return DropdownButtonFormField<String>(
      value: _selectedStatus,
      decoration: const InputDecoration(
        labelText: '状态 *',
        border: OutlineInputBorder(),
        prefixIcon: Icon(Icons.flag),
      ),
      items: const [
        DropdownMenuItem(value: 'scheduled', child: Text('已排班')),
        DropdownMenuItem(value: 'confirmed', child: Text('已确认')),
        DropdownMenuItem(value: 'in_progress', child: Text('进行中')),
      ],
      onChanged: (value) {
        setState(() {
          _selectedStatus = value!;
        });
      },
    );
  }

  Widget _buildScheduleTypeSelection() {
    return DropdownButtonFormField<String>(
      value: _selectedScheduleType,
      decoration: const InputDecoration(
        labelText: '排班类型 *',
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
          _selectedScheduleType = value!;
        });
      },
    );
  }

  Widget _buildLocationFields() {
    return Column(
      children: [
        TextFormField(
          controller: _centerController,
          decoration: const InputDecoration(
            labelText: '中心/地点',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.location_on),
          ),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _roomController,
          decoration: const InputDecoration(
            labelText: '房间/教室',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.room),
          ),
        ),
      ],
    );
  }

  Widget _buildRateFields() {
    return Column(
      children: [
        TextFormField(
          controller: _hourlyRateController,
          decoration: const InputDecoration(
            labelText: '时薪 (RM)',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.attach_money),
          ),
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _totalHoursController,
          decoration: const InputDecoration(
            labelText: '总工作时长 (小时)',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.timer),
          ),
          keyboardType: TextInputType.number,
        ),
      ],
    );
  }

  Widget _buildOvertimeToggle() {
    return SwitchListTile(
      title: const Text('加班'),
      value: _isOvertime,
      onChanged: (value) {
        setState(() {
          _isOvertime = value;
        });
      },
      secondary: const Icon(Icons.schedule),
    );
  }

  Widget _buildSaveButton() {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: _saveSchedule,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primaryColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text(
          '保存排班',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _selectTime(BuildContext context, TimeOfDay initialTime, Function(TimeOfDay) onTimeSelected) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: initialTime,
    );
    if (picked != null) {
      onTimeSelected(picked);
    }
  }

  Future<void> _saveSchedule() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedTeacherId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('请选择教师'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final scheduleProvider = context.read<ScheduleProvider>();
    final teacherProvider = context.read<TeacherProvider>();

    final teacher = teacherProvider.teachers.firstWhere(
      (t) => t.id == _selectedTeacherId,
      orElse: () => RecordModel(),
    );

    if (teacher.id.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('未找到选中的教师'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final data = {
      'teacher_id': _selectedTeacherId,
      'class_id': _selectedClassId,
      'date': _selectedDate.toIso8601String().split('T')[0],
      'start_time': '${_selectedStartTime.hour.toString().padLeft(2, '0')}:${_selectedStartTime.minute.toString().padLeft(2, '0')}',
      'end_time': '${_selectedEndTime.hour.toString().padLeft(2, '0')}:${_selectedEndTime.minute.toString().padLeft(2, '0')}',
      'center': _centerController.text,
      'room': _roomController.text,
      'status': _selectedStatus,
      'is_overtime': _isOvertime,
      'hourly_rate': _hourlyRateController.text.isNotEmpty ? double.tryParse(_hourlyRateController.text) : null,
      'total_hours': _totalHoursController.text.isNotEmpty ? double.tryParse(_totalHoursController.text) : null,
      'schedule_type': _selectedScheduleType,
    };

    bool success;
    if (widget.schedule == null) {
      success = await scheduleProvider.createSchedule(data);
    } else {
      success = await scheduleProvider.updateSchedule(widget.schedule!.id, data);
    }

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.schedule == null ? '排班创建成功' : '排班更新成功'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(scheduleProvider.error ?? '操作失败'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}