import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../finance/providers/teacher_salary_provider.dart';
import '../../teacher/providers/teacher_provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';

class AddEditSalaryRecordScreen extends StatefulWidget {
  final RecordModel? record;

  const AddEditSalaryRecordScreen({super.key, this.record});

  @override
  State<AddEditSalaryRecordScreen> createState() => _AddEditSalaryRecordScreenState();
}

class _AddEditSalaryRecordScreenState extends State<AddEditSalaryRecordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _baseSalaryController = TextEditingController();
  final _bonusController = TextEditingController();
  final _deductionController = TextEditingController();
  
  // 马来西亚津贴字段
  final _allowanceFixedController = TextEditingController();
  final _allowanceTransportController = TextEditingController();
  final _allowanceMealController = TextEditingController();
  final _allowanceHousingController = TextEditingController();
  final _allowanceMedicalController = TextEditingController();
  final _allowanceOtherController = TextEditingController();
  
  // 马来西亚法定扣除项字段
  final _epfDeductionController = TextEditingController();
  final _socsoDeductionController = TextEditingController();
  final _eisDeductionController = TextEditingController();
  final _taxDeductionController = TextEditingController();
  final _otherDeductionController = TextEditingController();
  
  // 计算结果字段
  final _grossSalaryController = TextEditingController();
  final _netSalaryController = TextEditingController();
  
  final _notesController = TextEditingController();

  String? _selectedTeacherId;
  DateTime? _salaryDate;
  String _salaryType = 'monthly';

  @override
  void initState() {
    super.initState();
    _initializeForm();
  }

  @override
  void dispose() {
    _baseSalaryController.dispose();
    _bonusController.dispose();
    _deductionController.dispose();
    _allowanceFixedController.dispose();
    _allowanceTransportController.dispose();
    _allowanceMealController.dispose();
    _allowanceHousingController.dispose();
    _allowanceMedicalController.dispose();
    _allowanceOtherController.dispose();
    _epfDeductionController.dispose();
    _socsoDeductionController.dispose();
    _eisDeductionController.dispose();
    _taxDeductionController.dispose();
    _otherDeductionController.dispose();
    _grossSalaryController.dispose();
    _netSalaryController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _initializeForm() {
    if (widget.record != null) {
      _selectedTeacherId = widget.record!.getStringValue('teacher_id');
      _baseSalaryController.text = (widget.record!.getDoubleValue('base_salary') ?? 0.0).toString();
      _bonusController.text = (widget.record!.getDoubleValue('bonus') ?? 0.0).toString();
      _deductionController.text = (widget.record!.getDoubleValue('deduction') ?? 0.0).toString();
      
      // 初始化津贴字段
      _allowanceFixedController.text = (widget.record!.getDoubleValue('allowance_fixed') ?? 0.0).toString();
      _allowanceTransportController.text = (widget.record!.getDoubleValue('allowance_transport') ?? 0.0).toString();
      _allowanceMealController.text = (widget.record!.getDoubleValue('allowance_meal') ?? 0.0).toString();
      _allowanceHousingController.text = (widget.record!.getDoubleValue('allowance_housing') ?? 0.0).toString();
      _allowanceMedicalController.text = (widget.record!.getDoubleValue('allowance_medical') ?? 0.0).toString();
      _allowanceOtherController.text = (widget.record!.getDoubleValue('allowance_other') ?? 0.0).toString();
      
      // 初始化扣除项字段
      _epfDeductionController.text = (widget.record!.getDoubleValue('epf_deduction') ?? 0.0).toString();
      _socsoDeductionController.text = (widget.record!.getDoubleValue('socso_deduction') ?? 0.0).toString();
      _eisDeductionController.text = (widget.record!.getDoubleValue('eis_deduction') ?? 0.0).toString();
      _taxDeductionController.text = (widget.record!.getDoubleValue('tax_deduction') ?? 0.0).toString();
      _otherDeductionController.text = (widget.record!.getDoubleValue('other_deductions') ?? 0.0).toString();
      
      // 初始化计算结果字段
      _grossSalaryController.text = (widget.record!.getDoubleValue('gross_salary') ?? 0.0).toString();
      _netSalaryController.text = (widget.record!.getDoubleValue('net_salary') ?? 0.0).toString();
      
      _notesController.text = widget.record!.getStringValue('notes') ?? '';
      _salaryType = widget.record!.getStringValue('salary_type') ?? 'monthly';
      
      final salaryDateStr = widget.record!.getStringValue('effective_date');
      if (salaryDateStr != null && salaryDateStr.isNotEmpty) {
        _salaryDate = DateTime.parse(salaryDateStr);
      }
    } else {
      _salaryDate = DateTime.now();
      
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
        title: Text(widget.record == null ? '添加薪资记录' : '编辑薪资记录'),
        actions: [
          TextButton(
            onPressed: _saveSalaryRecord,
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
              _buildSalaryDateSelection(),
              const SizedBox(height: 16),
              _buildSalaryTypeSelection(),
              const SizedBox(height: 16),
              _buildBasicSalaryFields(),
              const SizedBox(height: 16),
              _buildAllowanceFields(),
              const SizedBox(height: 16),
              _buildDeductionFields(),
              const SizedBox(height: 16),
              _buildCalculationFields(),
              const SizedBox(height: 16),
              _buildNotesField(),
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

  Widget _buildSalaryDateSelection() {
    return TextFormField(
      decoration: InputDecoration(
        labelText: '薪资日期 *',
        border: const OutlineInputBorder(),
        prefixIcon: const Icon(Icons.calendar_today),
        suffixIcon: const Icon(Icons.arrow_drop_down),
      ),
      readOnly: true,
      controller: TextEditingController(
        text: _salaryDate != null
            ? '${_salaryDate!.year}-${_salaryDate!.month.toString().padLeft(2, '0')}-${_salaryDate!.day.toString().padLeft(2, '0')}'
            : '',
      ),
      onTap: _selectSalaryDate,
      validator: (value) {
        if (_salaryDate == null) {
          return '请选择薪资日期';
        }
        return null;
      },
    );
  }

  Widget _buildSalaryTypeSelection() {
    return DropdownButtonFormField<String>(
      value: _salaryType,
      decoration: const InputDecoration(
        labelText: '薪资类型 *',
        border: OutlineInputBorder(),
        prefixIcon: Icon(Icons.category),
      ),
      items: const [
        DropdownMenuItem<String>(
          value: 'monthly',
          child: Text('月薪'),
        ),
        DropdownMenuItem<String>(
          value: 'hourly',
          child: Text('时薪'),
        ),
        DropdownMenuItem<String>(
          value: 'bonus',
          child: Text('奖金'),
        ),
        DropdownMenuItem<String>(
          value: 'overtime',
          child: Text('加班费'),
        ),
      ],
      onChanged: (value) {
        setState(() {
          _salaryType = value!;
        });
      },
    );
  }

  Widget _buildBasicSalaryFields() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '基本薪资',
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
                controller: _baseSalaryController,
                decoration: const InputDecoration(
                  labelText: '基本工资 (RM) *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.attach_money),
                  helperText: '月薪基本工资',
                ),
                keyboardType: TextInputType.number,
                onChanged: _calculateSalary,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return '请输入基本工资';
                  }
                  if (double.tryParse(value) == null) {
                    return '请输入有效的数字';
                  }
                  return null;
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextFormField(
                controller: _bonusController,
                decoration: const InputDecoration(
                  labelText: '奖金 (RM)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.card_giftcard),
                  helperText: '绩效奖金',
                ),
                keyboardType: TextInputType.number,
                onChanged: _calculateSalary,
                validator: (value) {
                  if (value != null && value.isNotEmpty && double.tryParse(value) == null) {
                    return '请输入有效的数字';
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

  Widget _buildAllowanceFields() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '津贴 (Allowances)',
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
                controller: _allowanceFixedController,
                decoration: const InputDecoration(
                  labelText: '固定津贴 (RM)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.account_balance_wallet),
                ),
                keyboardType: TextInputType.number,
                onChanged: _calculateSalary,
                validator: (value) {
                  if (value != null && value.isNotEmpty && double.tryParse(value) == null) {
                    return '请输入有效的数字';
                  }
                  return null;
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextFormField(
                controller: _allowanceTransportController,
                decoration: const InputDecoration(
                  labelText: '交通津贴 (RM)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.directions_car),
                ),
                keyboardType: TextInputType.number,
                onChanged: _calculateSalary,
                validator: (value) {
                  if (value != null && value.isNotEmpty && double.tryParse(value) == null) {
                    return '请输入有效的数字';
                  }
                  return null;
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _allowanceMealController,
                decoration: const InputDecoration(
                  labelText: '膳食津贴 (RM)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.restaurant),
                ),
                keyboardType: TextInputType.number,
                onChanged: _calculateSalary,
                validator: (value) {
                  if (value != null && value.isNotEmpty && double.tryParse(value) == null) {
                    return '请输入有效的数字';
                  }
                  return null;
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextFormField(
                controller: _allowanceHousingController,
                decoration: const InputDecoration(
                  labelText: '房屋津贴 (RM)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.home),
                ),
                keyboardType: TextInputType.number,
                onChanged: _calculateSalary,
                validator: (value) {
                  if (value != null && value.isNotEmpty && double.tryParse(value) == null) {
                    return '请输入有效的数字';
                  }
                  return null;
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _allowanceMedicalController,
                decoration: const InputDecoration(
                  labelText: '医疗津贴 (RM)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.medical_services),
                ),
                keyboardType: TextInputType.number,
                onChanged: _calculateSalary,
                validator: (value) {
                  if (value != null && value.isNotEmpty && double.tryParse(value) == null) {
                    return '请输入有效的数字';
                  }
                  return null;
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextFormField(
                controller: _allowanceOtherController,
                decoration: const InputDecoration(
                  labelText: '其他津贴 (RM)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.add),
                ),
                keyboardType: TextInputType.number,
                onChanged: _calculateSalary,
                validator: (value) {
                  if (value != null && value.isNotEmpty && double.tryParse(value) == null) {
                    return '请输入有效的数字';
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

  Widget _buildDeductionFields() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '扣除项 (Deductions)',
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
                controller: _epfDeductionController,
                decoration: const InputDecoration(
                  labelText: 'EPF 扣除 (RM)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.account_balance),
                  helperText: '雇员公积金',
                ),
                keyboardType: TextInputType.number,
                onChanged: _calculateSalary,
                validator: (value) {
                  if (value != null && value.isNotEmpty && double.tryParse(value) == null) {
                    return '请输入有效的数字';
                  }
                  return null;
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextFormField(
                controller: _socsoDeductionController,
                decoration: const InputDecoration(
                  labelText: 'SOCSO 扣除 (RM)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.security),
                  helperText: '社会保险',
                ),
                keyboardType: TextInputType.number,
                onChanged: _calculateSalary,
                validator: (value) {
                  if (value != null && value.isNotEmpty && double.tryParse(value) == null) {
                    return '请输入有效的数字';
                  }
                  return null;
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _eisDeductionController,
                decoration: const InputDecoration(
                  labelText: 'EIS 扣除 (RM)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.work),
                  helperText: '就业保险',
                ),
                keyboardType: TextInputType.number,
                onChanged: _calculateSalary,
                validator: (value) {
                  if (value != null && value.isNotEmpty && double.tryParse(value) == null) {
                    return '请输入有效的数字';
                  }
                  return null;
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextFormField(
                controller: _taxDeductionController,
                decoration: const InputDecoration(
                  labelText: '所得税扣除 (RM)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.calculate),
                  helperText: '个人所得税',
                ),
                keyboardType: TextInputType.number,
                onChanged: _calculateSalary,
                validator: (value) {
                  if (value != null && value.isNotEmpty && double.tryParse(value) == null) {
                    return '请输入有效的数字';
                  }
                  return null;
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _otherDeductionController,
          decoration: const InputDecoration(
            labelText: '其他扣除 (RM)',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.remove_circle),
            helperText: '其他扣除项',
          ),
          keyboardType: TextInputType.number,
          onChanged: _calculateSalary,
          validator: (value) {
            if (value != null && value.isNotEmpty && double.tryParse(value) == null) {
              return '请输入有效的数字';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildCalculationFields() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '薪资计算',
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
                controller: _grossSalaryController,
                decoration: InputDecoration(
                  labelText: '总薪资 (RM)',
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.add_circle),
                  helperText: '基本工资 + 津贴 + 奖金',
                  filled: true,
                  fillColor: Colors.green[50],
                ),
                keyboardType: TextInputType.number,
                readOnly: true,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextFormField(
                controller: _netSalaryController,
                decoration: InputDecoration(
                  labelText: '净薪资 (RM)',
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.account_balance_wallet),
                  helperText: '总薪资 - 扣除项',
                  filled: true,
                  fillColor: Colors.blue[50],
                ),
                keyboardType: TextInputType.number,
                readOnly: true,
              ),
            ),
          ],
        ),
      ],
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
      maxLines: 3,
    );
  }

  Widget _buildSaveButton() {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: _saveSalaryRecord,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primaryColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text(
          '保存薪资记录',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  Future<void> _selectSalaryDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _salaryDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );

    if (picked != null) {
      setState(() {
        _salaryDate = picked;
      });
    }
  }

  void _calculateSalary(String? value) {
    // 计算总薪资
    final baseSalary = double.tryParse(_baseSalaryController.text) ?? 0.0;
    final bonus = double.tryParse(_bonusController.text) ?? 0.0;
    final allowanceFixed = double.tryParse(_allowanceFixedController.text) ?? 0.0;
    final allowanceTransport = double.tryParse(_allowanceTransportController.text) ?? 0.0;
    final allowanceMeal = double.tryParse(_allowanceMealController.text) ?? 0.0;
    final allowanceHousing = double.tryParse(_allowanceHousingController.text) ?? 0.0;
    final allowanceMedical = double.tryParse(_allowanceMedicalController.text) ?? 0.0;
    final allowanceOther = double.tryParse(_allowanceOtherController.text) ?? 0.0;

    final grossSalary = baseSalary + bonus + allowanceFixed + allowanceTransport + 
                       allowanceMeal + allowanceHousing + allowanceMedical + allowanceOther;

    // 计算总扣除项
    final epfDeduction = double.tryParse(_epfDeductionController.text) ?? 0.0;
    final socsoDeduction = double.tryParse(_socsoDeductionController.text) ?? 0.0;
    final eisDeduction = double.tryParse(_eisDeductionController.text) ?? 0.0;
    final taxDeduction = double.tryParse(_taxDeductionController.text) ?? 0.0;
    final otherDeduction = double.tryParse(_otherDeductionController.text) ?? 0.0;

    final totalDeductions = epfDeduction + socsoDeduction + eisDeduction + taxDeduction + otherDeduction;

    // 计算净薪资
    final netSalary = grossSalary - totalDeductions;

    // 更新计算结果
    _grossSalaryController.text = grossSalary.toStringAsFixed(2);
    _netSalaryController.text = netSalary.toStringAsFixed(2);
  }

  Future<void> _saveSalaryRecord() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedTeacherId == null || _salaryDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('请填写所有必填字段'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final salaryProvider = context.read<TeacherSalaryProvider>();
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
      'effective_date': _salaryDate!.toIso8601String().split('T')[0],
      'salary_type': _salaryType,
      'base_salary': double.parse(_baseSalaryController.text),
      'bonus': double.tryParse(_bonusController.text) ?? 0.0,
      
      // 津贴字段
      'allowance_fixed': double.tryParse(_allowanceFixedController.text) ?? 0.0,
      'allowance_transport': double.tryParse(_allowanceTransportController.text) ?? 0.0,
      'allowance_meal': double.tryParse(_allowanceMealController.text) ?? 0.0,
      'allowance_housing': double.tryParse(_allowanceHousingController.text) ?? 0.0,
      'allowance_medical': double.tryParse(_allowanceMedicalController.text) ?? 0.0,
      'allowance_other': double.tryParse(_allowanceOtherController.text) ?? 0.0,
      
      // 扣除项字段
      'epf_deduction': double.tryParse(_epfDeductionController.text) ?? 0.0,
      'socso_deduction': double.tryParse(_socsoDeductionController.text) ?? 0.0,
      'eis_deduction': double.tryParse(_eisDeductionController.text) ?? 0.0,
      'tax_deduction': double.tryParse(_taxDeductionController.text) ?? 0.0,
      'other_deductions': double.tryParse(_otherDeductionController.text) ?? 0.0,
      
      // 计算结果字段
      'gross_salary': double.tryParse(_grossSalaryController.text) ?? 0.0,
      'net_salary': double.tryParse(_netSalaryController.text) ?? 0.0,
      
      'notes': _notesController.text,
    };

    bool success;
    if (widget.record == null) {
      success = await salaryProvider.createSalaryRecord(data);
    } else {
      success = await salaryProvider.updateSalaryRecord(widget.record!.id, data);
    }

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.record == null ? '薪资记录创建成功' : '薪资记录更新成功'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(salaryProvider.error ?? '操作失败'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
