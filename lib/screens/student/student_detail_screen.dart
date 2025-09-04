import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/student_provider.dart';
import '../../widgets/common/custom_button.dart';
import '../../widgets/common/custom_text_field.dart';

class StudentDetailScreen extends StatefulWidget {
  final String studentId;
  final String studentName;

  const StudentDetailScreen({
    super.key,
    required this.studentId,
    required this.studentName,
  });

  @override
  State<StudentDetailScreen> createState() => _StudentDetailScreenState();
}

class _StudentDetailScreenState extends State<StudentDetailScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _studentIdController = TextEditingController();
  final _classController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _parentNameController = TextEditingController();
  final _parentPhoneController = TextEditingController();

  bool _isLoading = false;
  bool _isEditing = false;

  @override
  void initState() {
    super.initState();
    _loadStudentData();
  }

  void _loadStudentData() {
    // Load student data from provider
    final studentProvider = Provider.of<StudentProvider>(context, listen: false);
    final student = studentProvider.getStudentById(widget.studentId);
    
    if (student != null) {
      _nameController.text = student.getStringValue('student_name');
      _studentIdController.text = student.getStringValue('student_id');
      _classController.text = student.getStringValue('standard');
      _phoneController.text = student.getStringValue('parents_phone') ?? '';
      _emailController.text = ''; // 您的数据中没有email字段
      _parentNameController.text = student.getStringValue('parents_name') ?? '';
      _parentPhoneController.text = student.getStringValue('parents_phone') ?? '';
    }
  }

  Future<void> _saveStudent() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final studentProvider = Provider.of<StudentProvider>(context, listen: false);
      
      // Update student data
      await studentProvider.updateStudent(
        widget.studentId,
        {
          'student_name': _nameController.text,
          'student_id': _studentIdController.text,
          'standard': _classController.text,
          'parents_phone': _phoneController.text,
          'parents_name': _parentNameController.text,
        },
      );

      setState(() {
        _isEditing = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('学生信息更新成功'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('更新失败: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.studentName),
        backgroundColor: Theme.of(context).primaryColor,
        foregroundColor: Colors.white,
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () {
                setState(() {
                  _isEditing = true;
                });
              },
            ),
          if (_isEditing) ...[
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () {
                setState(() {
                  _isEditing = false;
                });
                _loadStudentData(); // Reset form
              },
            ),
            IconButton(
              icon: const Icon(Icons.save),
              onPressed: _isLoading ? null : _saveStudent,
            ),
          ],
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Student Photo
                    Center(
                      child: CircleAvatar(
                        radius: 60,
                        backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
                        child: Icon(
                          Icons.person,
                          size: 60,
                          color: Theme.of(context).primaryColor,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Student Information
                    Text(
                      '学生信息',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),

                    CustomTextField(
                      controller: _nameController,
                      label: '姓名',
                      enabled: _isEditing,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return '请输入姓名';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    CustomTextField(
                      controller: _studentIdController,
                      label: '学号',
                      enabled: _isEditing,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return '请输入学号';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    CustomTextField(
                      controller: _classController,
                      label: '班级',
                      enabled: _isEditing,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return '请输入班级';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    CustomTextField(
                      controller: _phoneController,
                      label: '电话',
                      enabled: _isEditing,
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 16),

                    CustomTextField(
                      controller: _emailController,
                      label: '邮箱',
                      enabled: _isEditing,
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 24),

                    // Parent Information
                    Text(
                      '家长信息',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),

                    CustomTextField(
                      controller: _parentNameController,
                      label: '家长姓名',
                      enabled: _isEditing,
                    ),
                    const SizedBox(height: 16),

                    CustomTextField(
                      controller: _parentPhoneController,
                      label: '家长电话',
                      enabled: _isEditing,
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 32),

                    // Action Buttons
                    if (_isEditing) ...[
                      Row(
                        children: [
                          Expanded(
                            child: CustomButton(
                              text: '取消',
                              onPressed: () {
                                setState(() {
                                  _isEditing = false;
                                });
                                _loadStudentData();
                              },
                              variant: ButtonVariant.outline,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: CustomButton(
                              text: '保存',
                              onPressed: _isLoading ? null : _saveStudent,
                              isLoading: _isLoading,
                            ),
                          ),
                        ],
                      ),
                    ] else ...[
                      CustomButton(
                        text: '编辑信息',
                        onPressed: () {
                          setState(() {
                            _isEditing = true;
                          });
                        },
                        icon: Icons.edit,
                      ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _studentIdController.dispose();
    _classController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _parentNameController.dispose();
    _parentPhoneController.dispose();
    super.dispose();
  }
}
