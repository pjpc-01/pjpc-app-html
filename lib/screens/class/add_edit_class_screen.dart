import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../shared/providers/class_provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/services/pocketbase_service.dart';

class AddEditClassScreen extends StatefulWidget {
  final dynamic classData;
  
  const AddEditClassScreen({super.key, this.classData});

  @override
  State<AddEditClassScreen> createState() => _AddEditClassScreenState();
}

class _AddEditClassScreenState extends State<AddEditClassScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _roomNumberController = TextEditingController();
  final _maxCapacityController = TextEditingController();
  final _feesController = TextEditingController();
  final _scheduleController = TextEditingController();
  final _notesController = TextEditingController();

  String _selectedCenter = 'WX 01';
  String _selectedLevel = '一年级';
  String _selectedStatus = 'active';
  String _selectedTeacher = '';
  DateTime? _startDate;
  DateTime? _endDate;
  bool _isLoading = false;

  final List<String> _centers = ['WX 01', 'WX 02', 'WX 03'];
  final List<String> _levels = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
  final List<String> _statuses = ['active', 'inactive', 'archived'];
  List<dynamic> _teachers = [];

  @override
  void initState() {
    super.initState();
    _loadTeachers();
    if (widget.classData != null) {
      _loadClassData();
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _roomNumberController.dispose();
    _maxCapacityController.dispose();
    _feesController.dispose();
    _scheduleController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _loadClassData() {
    final classData = widget.classData;
    _nameController.text = classData.getStringValue('name') ?? '';
    _descriptionController.text = classData.getStringValue('description') ?? '';
    _roomNumberController.text = classData.getStringValue('room_number') ?? '';
    _maxCapacityController.text = classData.getIntValue('max_capacity').toString();
    _feesController.text = classData.getDoubleValue('fees').toString();
    _scheduleController.text = classData.getStringValue('schedule') ?? '';
    _notesController.text = classData.getStringValue('notes') ?? '';
    
    _selectedCenter = classData.getStringValue('center') ?? 'WX 01';
    _selectedLevel = classData.getStringValue('level') ?? '一年级';
    _selectedStatus = classData.getStringValue('status') ?? 'active';
    _selectedTeacher = classData.getStringValue('teacher') ?? '';
    
    final startDateStr = classData.getStringValue('start_date');
    if (startDateStr != null) {
      _startDate = DateTime.tryParse(startDateStr);
    }
    
    final endDateStr = classData.getStringValue('end_date');
    if (endDateStr != null) {
      _endDate = DateTime.tryParse(endDateStr);
    }
  }

  Future<void> _loadTeachers() async {
    try {
      final pocketBaseService = PocketBaseService.instance;
      final teachers = await pocketBaseService.getTeachers();
      setState(() {
        _teachers = teachers;
      });
    } catch (e) {
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final isEdit = widget.classData != null;
        final isAdmin = authProvider.isAdmin;
        
        // 如果不是管理员，显示权限不足页面
        if (!isAdmin) {
          return Scaffold(
            backgroundColor: const Color(0xFFF8FAFC),
            appBar: AppBar(
              title: const Text(
                '权限不足',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              backgroundColor: const Color(0xFF1E3A8A),
              foregroundColor: Colors.white,
              elevation: 0,
            ),
            body: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.lock_rounded,
                    size: 64,
                    color: Color(0xFF64748B),
                  ),
                  SizedBox(height: 16),
                  Text(
                    '权限不足',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '只有管理员可以添加或编辑班级',
                    style: TextStyle(
                      fontSize: 16,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
          );
        }
        
        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            title: Text(
              isEdit ? '编辑班级' : '添加班级',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            backgroundColor: const Color(0xFF1E3A8A),
            foregroundColor: Colors.white,
            elevation: 0,
            actions: [
              if (isEdit)
                IconButton(
                  icon: const Icon(Icons.delete_rounded),
                  onPressed: _showDeleteDialog,
                ),
            ],
          ),
          body: Form(
            key: _formKey,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _buildBasicInfoCard(),
                  const SizedBox(height: 16),
                  _buildClassDetailsCard(),
                  const SizedBox(height: 16),
                  _buildScheduleCard(),
                  const SizedBox(height: 16),
                  _buildNotesCard(),
                  const SizedBox(height: 24),
                  _buildActionButtons(),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildBasicInfoCard() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
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
                color: Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: '班级名称',
                prefixIcon: Icon(Icons.class_rounded),
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '请输入班级名称';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: '班级描述',
                prefixIcon: Icon(Icons.description_rounded),
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _selectedCenter,
                    decoration: const InputDecoration(
                      labelText: '分行',
                      prefixIcon: Icon(Icons.business_rounded),
                      border: OutlineInputBorder(),
                    ),
                    items: _centers.map<DropdownMenuItem<String>>((center) {
                      return DropdownMenuItem<String>(
                        value: center,
                        child: Text(center),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedCenter = value!;
                      });
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _selectedLevel,
                    decoration: const InputDecoration(
                      labelText: '年级',
                      prefixIcon: Icon(Icons.school_rounded),
                      border: OutlineInputBorder(),
                    ),
                    items: _levels.map<DropdownMenuItem<String>>((level) {
                      return DropdownMenuItem<String>(
                        value: level,
                        child: Text(level),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedLevel = value!;
                      });
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildClassDetailsCard() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '班级详情',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _selectedStatus,
                    decoration: const InputDecoration(
                      labelText: '状态',
                      prefixIcon: Icon(Icons.flag_rounded),
                      border: OutlineInputBorder(),
                    ),
                    items: _statuses.map<DropdownMenuItem<String>>((status) {
                      return DropdownMenuItem<String>(
                        value: status,
                        child: Text(_getStatusText(status)),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedStatus = value!;
                      });
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _roomNumberController,
                    decoration: const InputDecoration(
                      labelText: '教室号',
                      prefixIcon: Icon(Icons.room_rounded),
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _maxCapacityController,
                    decoration: const InputDecoration(
                      labelText: '最大容量',
                      prefixIcon: Icon(Icons.people_rounded),
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return '请输入最大容量';
                      }
                      if (int.tryParse(value) == null) {
                        return '请输入有效数字';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _feesController,
                    decoration: const InputDecoration(
                      labelText: '学费',
                      prefixIcon: Icon(Icons.attach_money_rounded),
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedTeacher.isNotEmpty ? _selectedTeacher : null,
              decoration: const InputDecoration(
                labelText: '负责教师',
                prefixIcon: Icon(Icons.person_rounded),
                border: OutlineInputBorder(),
              ),
              items: _teachers.map<DropdownMenuItem<String>>((teacher) {
                return DropdownMenuItem<String>(
                  value: teacher.id,
                  child: Text(teacher.getStringValue('name') ?? '未知教师'),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedTeacher = value ?? '';
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleCard() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '时间安排',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _scheduleController,
              decoration: const InputDecoration(
                labelText: '课程安排',
                prefixIcon: Icon(Icons.schedule_rounded),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: _selectStartDate,
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '开始日期',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _startDate != null
                                ? '${_startDate!.year}-${_startDate!.month.toString().padLeft(2, '0')}-${_startDate!.day.toString().padLeft(2, '0')}'
                                : '选择开始日期',
                            style: const TextStyle(
                              fontSize: 16,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: InkWell(
                    onTap: _selectEndDate,
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '结束日期',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _endDate != null
                                ? '${_endDate!.year}-${_endDate!.month.toString().padLeft(2, '0')}-${_endDate!.day.toString().padLeft(2, '0')}'
                                : '选择结束日期',
                            style: const TextStyle(
                              fontSize: 16,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotesCard() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '备注',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _notesController,
              decoration: const InputDecoration(
                labelText: '备注信息',
                prefixIcon: Icon(Icons.note_rounded),
                border: OutlineInputBorder(),
              ),
              maxLines: 4,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () => Navigator.pop(context),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              side: const BorderSide(color: Color(0xFF1E3A8A)),
            ),
            child: const Text(
              '取消',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1E3A8A),
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: ElevatedButton(
            onPressed: _isLoading ? null : _saveClass,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1E3A8A),
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: _isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Text(
                    widget.classData != null ? '更新班级' : '创建班级',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  Future<void> _selectStartDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _startDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (date != null) {
      setState(() {
        _startDate = date;
      });
    }
  }

  Future<void> _selectEndDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _endDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (date != null) {
      setState(() {
        _endDate = date;
      });
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'active':
        return '进行中';
      case 'inactive':
        return '暂停';
      case 'archived':
        return '已归档';
      default:
        return '未知';
    }
  }

  Future<void> _saveClass() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final classProvider = Provider.of<ClassProvider>(context, listen: false);
      
      final classData = {
        'name': _nameController.text.trim(),
        'description': _descriptionController.text.trim(),
        'center': _selectedCenter,
        'level': _selectedLevel,
        'status': _selectedStatus,
        'room_number': _roomNumberController.text.trim(),
        'max_capacity': int.tryParse(_maxCapacityController.text) ?? 0,
        'teacher': _selectedTeacher,
        'fees': double.tryParse(_feesController.text) ?? 0.0,
        'schedule': _scheduleController.text.trim(),
        'start_date': _startDate?.toIso8601String(),
        'end_date': _endDate?.toIso8601String(),
        'notes': _notesController.text.trim(),
      };

      bool success;
      if (widget.classData != null) {
        success = await classProvider.updateClass(widget.classData.id, classData);
      } else {
        success = await classProvider.createClass(classData);
      }

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.classData != null ? '班级更新成功' : '班级创建成功'),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('保存失败: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _showDeleteDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('删除班级'),
        content: const Text('确定要删除这个班级吗？此操作不可撤销。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await _deleteClass();
            },
            child: const Text(
              '删除',
              style: TextStyle(color: Color(0xFFEF4444)),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteClass() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final classProvider = Provider.of<ClassProvider>(context, listen: false);
      final success = await classProvider.deleteClass(widget.classData.id);

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('班级删除成功'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('删除失败: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
}
