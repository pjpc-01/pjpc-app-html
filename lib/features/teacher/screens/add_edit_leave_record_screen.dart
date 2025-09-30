import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../leave/providers/teacher_leave_provider.dart';
import '../../teacher/providers/teacher_provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';

class AddEditLeaveRecordScreen extends StatefulWidget {
  final RecordModel? record;

  const AddEditLeaveRecordScreen({super.key, this.record});

  @override
  State<AddEditLeaveRecordScreen> createState() => _AddEditLeaveRecordScreenState();
}

class _AddEditLeaveRecordScreenState extends State<AddEditLeaveRecordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reasonController = TextEditingController();
  final _notesController = TextEditingController();

  String? _selectedTeacherId;
  String _leaveType = 'sick';
  DateTime? _startDate;
  DateTime? _endDate;
  String _status = 'pending';
  String _urgency = 'normal';

  @override
  void initState() {
    super.initState();
    _initializeForm();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _initializeForm() {
    if (widget.record != null) {
      _selectedTeacherId = widget.record!.getStringValue('teacher_id');
      _leaveType = widget.record!.getStringValue('leave_type') ?? 'sick';
      _reasonController.text = widget.record!.getStringValue('reason') ?? '';
      _notesController.text = widget.record!.getStringValue('notes') ?? '';
      _status = widget.record!.getStringValue('status') ?? 'pending';
      _urgency = widget.record!.getStringValue('urgency') ?? 'normal';
      
      final startDateStr = widget.record!.getStringValue('leave_start_date');
      final endDateStr = widget.record!.getStringValue('leave_end_date');
      if (startDateStr != null && startDateStr.isNotEmpty) {
        _startDate = DateTime.parse(startDateStr);
      }
      if (endDateStr != null && endDateStr.isNotEmpty) {
        _endDate = DateTime.parse(endDateStr);
      }
    } else {
      _startDate = DateTime.now();
      _endDate = DateTime.now().add(const Duration(days: 1));
      
      // 新建记录时，如果是教师，自动选择自己
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final authProvider = context.read<AuthProvider>();
        if (!authProvider.isAdmin && authProvider.user?.id != null) {
          setState(() {
            _selectedTeacherId = authProvider.user!.id;
          });
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(widget.record == null ? '添加请假记录' : '编辑请假记录'),
        actions: [
          TextButton(
            onPressed: _saveLeaveRecord,
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
              _buildLeaveTypeSelection(),
              const SizedBox(height: 16),
              _buildDateRangeSelection(),
              const SizedBox(height: 16),
              _buildUrgencySelection(),
              const SizedBox(height: 16),
              _buildStatusSelection(),
              const SizedBox(height: 16),
              _buildReasonField(),
              const SizedBox(height: 16),
              _buildNotesField(),
              const SizedBox(height: 16),
              _buildLeaveDaysInfo(),
              const SizedBox(height: 24),
              _buildSaveButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTeacherSelection() {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        if (authProvider.isAdmin) {
          // 管理员：可以选择任何教师
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
        } else {
          // 教师：只能选择自己，显示为只读
          return TextFormField(
            initialValue: authProvider.user?.getStringValue('name') ?? '当前用户',
            decoration: const InputDecoration(
              labelText: '教师',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.person),
              filled: true,
              fillColor: Colors.grey,
            ),
            readOnly: true,
            enabled: false,
          );
        }
      },
    );
  }

  Widget _buildLeaveTypeSelection() {
    return DropdownButtonFormField<String>(
      value: _leaveType,
      decoration: const InputDecoration(
        labelText: '请假类型 *',
        border: OutlineInputBorder(),
        prefixIcon: Icon(Icons.category),
      ),
      items: const [
        DropdownMenuItem<String>(
          value: 'sick',
          child: Text('病假'),
        ),
        DropdownMenuItem<String>(
          value: 'personal',
          child: Text('事假'),
        ),
        DropdownMenuItem<String>(
          value: 'annual',
          child: Text('年假'),
        ),
        DropdownMenuItem<String>(
          value: 'maternity',
          child: Text('产假'),
        ),
        DropdownMenuItem<String>(
          value: 'paternity',
          child: Text('陪产假'),
        ),
        DropdownMenuItem<String>(
          value: 'bereavement',
          child: Text('丧假'),
        ),
        DropdownMenuItem<String>(
          value: 'other',
          child: Text('其他'),
        ),
      ],
      onChanged: (value) {
        setState(() {
          _leaveType = value!;
        });
      },
    );
  }

  Widget _buildDateRangeSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '请假时间',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                decoration: InputDecoration(
                  labelText: '开始日期 *',
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.calendar_today),
                  suffixIcon: const Icon(Icons.arrow_drop_down),
                ),
                readOnly: true,
                controller: TextEditingController(
                  text: _startDate != null
                      ? '${_startDate!.year}-${_startDate!.month.toString().padLeft(2, '0')}-${_startDate!.day.toString().padLeft(2, '0')}'
                      : '',
                ),
                onTap: _selectStartDate,
                validator: (value) {
                  if (_startDate == null) {
                    return '请选择开始日期';
                  }
                  return null;
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextFormField(
                decoration: InputDecoration(
                  labelText: '结束日期 *',
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.calendar_today),
                  suffixIcon: const Icon(Icons.arrow_drop_down),
                ),
                readOnly: true,
                controller: TextEditingController(
                  text: _endDate != null
                      ? '${_endDate!.year}-${_endDate!.month.toString().padLeft(2, '0')}-${_endDate!.day.toString().padLeft(2, '0')}'
                      : '',
                ),
                onTap: _selectEndDate,
                validator: (value) {
                  if (_endDate == null) {
                    return '请选择结束日期';
                  }
                  return null;
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildUrgencySelection() {
    return DropdownButtonFormField<String>(
      value: _urgency,
      decoration: const InputDecoration(
        labelText: '紧急程度 *',
        border: OutlineInputBorder(),
        prefixIcon: Icon(Icons.priority_high),
      ),
      items: const [
        DropdownMenuItem<String>(
          value: 'low',
          child: Text('低'),
        ),
        DropdownMenuItem<String>(
          value: 'normal',
          child: Text('普通'),
        ),
        DropdownMenuItem<String>(
          value: 'high',
          child: Text('高'),
        ),
        DropdownMenuItem<String>(
          value: 'urgent',
          child: Text('紧急'),
        ),
      ],
      onChanged: (value) {
        setState(() {
          _urgency = value!;
        });
      },
    );
  }

  Widget _buildStatusSelection() {
    return DropdownButtonFormField<String>(
      value: _status,
      decoration: const InputDecoration(
        labelText: '审批状态 *',
        border: OutlineInputBorder(),
        prefixIcon: Icon(Icons.check_circle),
      ),
      items: const [
        DropdownMenuItem<String>(
          value: 'pending',
          child: Text('待审批'),
        ),
        DropdownMenuItem<String>(
          value: 'approved',
          child: Text('已批准'),
        ),
        DropdownMenuItem<String>(
          value: 'rejected',
          child: Text('已拒绝'),
        ),
      ],
      onChanged: (value) {
        setState(() {
          _status = value!;
        });
      },
    );
  }

  Widget _buildReasonField() {
    return TextFormField(
      controller: _reasonController,
      decoration: const InputDecoration(
        labelText: '请假原因 *',
        border: OutlineInputBorder(),
        prefixIcon: Icon(Icons.description),
      ),
      maxLines: 3,
      validator: (value) {
        if (value == null || value.isEmpty) {
          return '请输入请假原因';
        }
        return null;
      },
    );
  }

  Widget _buildNotesField() {
    return TextFormField(
      controller: _notesController,
      decoration: const InputDecoration(
        labelText: '备注',
        border: OutlineInputBorder(),
        prefixIcon: Icon(Icons.note),
      ),
      maxLines: 2,
    );
  }

  Widget _buildLeaveDaysInfo() {
    final days = _calculateLeaveDays();
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: AppTheme.primaryColor.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.info,
            color: AppTheme.primaryColor,
            size: 20,
          ),
          const SizedBox(width: 8),
          Text(
            '请假天数: $days 天',
            style: TextStyle(
              color: AppTheme.primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSaveButton() {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: _saveLeaveRecord,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primaryColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text(
          '保存请假记录',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  Future<void> _selectStartDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _startDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null) {
      setState(() {
        _startDate = picked;
        // 如果结束日期早于开始日期，自动调整结束日期
        if (_endDate != null && _endDate!.isBefore(picked)) {
          _endDate = picked.add(const Duration(days: 1));
        }
      });
    }
  }

  Future<void> _selectEndDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _endDate ?? (_startDate ?? DateTime.now()).add(const Duration(days: 1)),
      firstDate: _startDate ?? DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null) {
      setState(() {
        _endDate = picked;
      });
    }
  }

  int _calculateLeaveDays() {
    if (_startDate == null || _endDate == null) {
      return 0;
    }
    return _endDate!.difference(_startDate!).inDays + 1;
  }

  Future<void> _saveLeaveRecord() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedTeacherId == null || _startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('请填写所有必填字段'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_endDate!.isBefore(_startDate!)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('结束日期不能早于开始日期'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final leaveProvider = context.read<TeacherLeaveProvider>();
    final teacherProvider = context.read<TeacherProvider>();

    // 获取教师信息
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
      'teacher_name': teacher.getStringValue('name'),
      'leave_type': _leaveType,
      'leave_start_date': _startDate!.toIso8601String().split('T')[0],
      'leave_end_date': _endDate!.toIso8601String().split('T')[0],
      'leave_days': _calculateLeaveDays(),
      'reason': _reasonController.text,
      'status': _status,
      'urgency': _urgency,
      'notes': _notesController.text,
    };

    bool success;
    if (widget.record == null) {
      success = await leaveProvider.createLeaveRecord(data);
    } else {
      success = await leaveProvider.updateLeaveRecord(widget.record!.id, data);
    }

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.record == null ? '请假记录创建成功' : '请假记录更新成功'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(leaveProvider.error ?? '操作失败'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
