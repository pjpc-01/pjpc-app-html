import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../finance/providers/teacher_salary_provider.dart';
import '../../teacher/providers/teacher_provider.dart';
import '../../../core/theme/app_theme.dart';

class AddEditSalaryStructureScreen extends StatefulWidget {
  final RecordModel? structure;

  const AddEditSalaryStructureScreen({super.key, this.structure});

  @override
  State<AddEditSalaryStructureScreen> createState() => _AddEditSalaryStructureScreenState();
}

class _AddEditSalaryStructureScreenState extends State<AddEditSalaryStructureScreen> {
  final _formKey = GlobalKey<FormState>();
  final _baseSalaryController = TextEditingController();
  final _hourlyRateController = TextEditingController();
  final _overtimeRateController = TextEditingController();
  final _bonusRateController = TextEditingController();
  
  // 马来西亚津贴字段
  final _allowanceFixedController = TextEditingController();
  final _allowanceTransportController = TextEditingController();
  final _allowanceMealController = TextEditingController();
  final _allowanceHousingController = TextEditingController();
  final _allowanceMedicalController = TextEditingController();
  final _allowanceOtherController = TextEditingController();
  
  // 马来西亚法定扣除项字段
  final _epfRateController = TextEditingController();
  final _socsoRateController = TextEditingController();
  final _eisRateController = TextEditingController();
  final _taxRateController = TextEditingController();
  
  final _notesController = TextEditingController();

  String? _selectedTeacherId;
  String _position = '';
  String _department = '';
  String _employmentType = 'full_time';
  DateTime? _effectiveDate;

  @override
  void initState() {
    super.initState();
    _initializeForm();
  }

  @override
  void dispose() {
    _baseSalaryController.dispose();
    _hourlyRateController.dispose();
    _overtimeRateController.dispose();
    _bonusRateController.dispose();
    _allowanceFixedController.dispose();
    _allowanceTransportController.dispose();
    _allowanceMealController.dispose();
    _allowanceHousingController.dispose();
    _allowanceMedicalController.dispose();
    _allowanceOtherController.dispose();
    _epfRateController.dispose();
    _socsoRateController.dispose();
    _eisRateController.dispose();
    _taxRateController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _initializeForm() {
    if (widget.structure != null) {
      _selectedTeacherId = widget.structure!.getStringValue('teacher_id');
      _position = widget.structure!.getStringValue('position') ?? '';
      _department = widget.structure!.getStringValue('department') ?? '';
      _employmentType = widget.structure!.getStringValue('employment_type') ?? 'full_time';
      _baseSalaryController.text = (widget.structure!.getDoubleValue('base_salary') ?? 0.0).toString();
      _hourlyRateController.text = (widget.structure!.getDoubleValue('hourly_rate') ?? 0.0).toString();
      _overtimeRateController.text = (widget.structure!.getDoubleValue('overtime_rate') ?? 0.0).toString();
      _bonusRateController.text = (widget.structure!.getDoubleValue('bonus_rate') ?? 0.0).toString();
      
      // 初始化津贴字段
      _allowanceFixedController.text = (widget.structure!.getDoubleValue('allowance_fixed') ?? 0.0).toString();
      _allowanceTransportController.text = (widget.structure!.getDoubleValue('allowance_transport') ?? 0.0).toString();
      _allowanceMealController.text = (widget.structure!.getDoubleValue('allowance_meal') ?? 0.0).toString();
      _allowanceHousingController.text = (widget.structure!.getDoubleValue('allowance_housing') ?? 0.0).toString();
      _allowanceMedicalController.text = (widget.structure!.getDoubleValue('allowance_medical') ?? 0.0).toString();
      _allowanceOtherController.text = (widget.structure!.getDoubleValue('allowance_other') ?? 0.0).toString();
      
      // 初始化扣除项字段
      _epfRateController.text = (widget.structure!.getDoubleValue('epf_rate') ?? 11.0).toString();
      _socsoRateController.text = (widget.structure!.getDoubleValue('socso_rate') ?? 0.0).toString();
      _eisRateController.text = (widget.structure!.getDoubleValue('eis_rate') ?? 0.2).toString();
      _taxRateController.text = (widget.structure!.getDoubleValue('tax_rate') ?? 0.0).toString();
      
      _notesController.text = widget.structure!.getStringValue('notes') ?? '';
      
      final effectiveDateStr = widget.structure!.getStringValue('effective_date');
      if (effectiveDateStr != null && effectiveDateStr.isNotEmpty) {
        _effectiveDate = DateTime.parse(effectiveDateStr);
      }
    } else {
      _effectiveDate = DateTime.now();
      // 设置默认扣除率
      _epfRateController.text = '11.0'; // 默认EPF 11%
      _eisRateController.text = '0.2';  // 默认EIS 0.2%
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(widget.structure == null ? '添加薪资结构' : '编辑薪资结构'),
        actions: [
          TextButton(
            onPressed: _saveSalaryStructure,
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
              _buildPositionField(),
              const SizedBox(height: 16),
              _buildDepartmentField(),
              const SizedBox(height: 16),
              _buildEmploymentTypeSelection(),
              const SizedBox(height: 16),
              _buildEffectiveDateSelection(),
              const SizedBox(height: 16),
              _buildSalaryFields(),
              const SizedBox(height: 16),
              _buildAllowanceFields(),
              const SizedBox(height: 16),
              _buildDeductionFields(),
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

  Widget _buildPositionField() {
    return TextFormField(
      initialValue: _position,
      decoration: const InputDecoration(
        labelText: '职位 *',
        border: OutlineInputBorder(),
        prefixIcon: Icon(Icons.work),
      ),
      onChanged: (value) {
        _position = value;
      },
      validator: (value) {
        if (value == null || value.isEmpty) {
          return '请输入职位';
        }
        return null;
      },
    );
  }

  Widget _buildDepartmentField() {
    return TextFormField(
      initialValue: _department,
      decoration: const InputDecoration(
        labelText: '部门 *',
        border: OutlineInputBorder(),
        prefixIcon: Icon(Icons.business),
      ),
      onChanged: (value) {
        _department = value;
      },
      validator: (value) {
        if (value == null || value.isEmpty) {
          return '请输入部门';
        }
        return null;
      },
    );
  }

  Widget _buildEmploymentTypeSelection() {
    return DropdownButtonFormField<String>(
      value: _employmentType,
      decoration: const InputDecoration(
        labelText: '雇佣类型 *',
        border: OutlineInputBorder(),
        prefixIcon: Icon(Icons.category),
      ),
      items: const [
        DropdownMenuItem<String>(
          value: 'full_time',
          child: Text('全职'),
        ),
        DropdownMenuItem<String>(
          value: 'part_time',
          child: Text('兼职'),
        ),
        DropdownMenuItem<String>(
          value: 'contract',
          child: Text('合同工'),
        ),
        DropdownMenuItem<String>(
          value: 'intern',
          child: Text('实习生'),
        ),
      ],
      onChanged: (value) {
        setState(() {
          _employmentType = value!;
        });
      },
    );
  }

  Widget _buildEffectiveDateSelection() {
    return TextFormField(
      decoration: InputDecoration(
        labelText: '生效日期 *',
        border: const OutlineInputBorder(),
        prefixIcon: const Icon(Icons.calendar_today),
        suffixIcon: const Icon(Icons.arrow_drop_down),
      ),
      readOnly: true,
      controller: TextEditingController(
        text: _effectiveDate != null
            ? '${_effectiveDate!.year}-${_effectiveDate!.month.toString().padLeft(2, '0')}-${_effectiveDate!.day.toString().padLeft(2, '0')}'
            : '',
      ),
      onTap: _selectEffectiveDate,
      validator: (value) {
        if (_effectiveDate == null) {
          return '请选择生效日期';
        }
        return null;
      },
    );
  }

  Widget _buildSalaryFields() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '基本薪资结构',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _baseSalaryController,
          decoration: const InputDecoration(
            labelText: '基本工资 (RM) *',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.attach_money),
            helperText: '月薪基本工资',
          ),
          keyboardType: TextInputType.number,
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
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _hourlyRateController,
                decoration: const InputDecoration(
                  labelText: '时薪 (RM)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.schedule),
                  helperText: '兼职时薪',
                ),
                keyboardType: TextInputType.number,
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
                controller: _overtimeRateController,
                decoration: const InputDecoration(
                  labelText: '加班费率 (倍)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.access_time),
                  helperText: '如1.5倍',
                ),
                keyboardType: TextInputType.number,
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
          controller: _bonusRateController,
          decoration: const InputDecoration(
            labelText: '奖金比例 (%)',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.percent),
            helperText: '年度奖金比例',
          ),
          keyboardType: TextInputType.number,
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
          '法定扣除项 (Statutory Deductions)',
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
                controller: _epfRateController,
                decoration: const InputDecoration(
                  labelText: 'EPF 率 (%)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.account_balance),
                  helperText: '雇员公积金',
                ),
                keyboardType: TextInputType.number,
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
                controller: _socsoRateController,
                decoration: const InputDecoration(
                  labelText: 'SOCSO 率 (%)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.security),
                  helperText: '社会保险',
                ),
                keyboardType: TextInputType.number,
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
                controller: _eisRateController,
                decoration: const InputDecoration(
                  labelText: 'EIS 率 (%)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.work),
                  helperText: '就业保险',
                ),
                keyboardType: TextInputType.number,
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
                controller: _taxRateController,
                decoration: const InputDecoration(
                  labelText: '所得税率 (%)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.calculate),
                  helperText: '个人所得税',
                ),
                keyboardType: TextInputType.number,
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
        onPressed: _saveSalaryStructure,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primaryColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text(
          '保存薪资结构',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  Future<void> _selectEffectiveDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _effectiveDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null) {
      setState(() {
        _effectiveDate = picked;
      });
    }
  }

  Future<void> _saveSalaryStructure() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedTeacherId == null || _effectiveDate == null) {
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
      'position': _position,
      'department': _department,
      'employment_type': _employmentType,
      'effective_date': _effectiveDate!.toIso8601String().split('T')[0],
      'base_salary': double.parse(_baseSalaryController.text),
      'hourly_rate': double.tryParse(_hourlyRateController.text) ?? 0.0,
      'overtime_rate': double.tryParse(_overtimeRateController.text) ?? 0.0,
      'bonus_rate': double.tryParse(_bonusRateController.text) ?? 0.0,
      
      // 津贴字段
      'allowance_fixed': double.tryParse(_allowanceFixedController.text) ?? 0.0,
      'allowance_transport': double.tryParse(_allowanceTransportController.text) ?? 0.0,
      'allowance_meal': double.tryParse(_allowanceMealController.text) ?? 0.0,
      'allowance_housing': double.tryParse(_allowanceHousingController.text) ?? 0.0,
      'allowance_medical': double.tryParse(_allowanceMedicalController.text) ?? 0.0,
      'allowance_other': double.tryParse(_allowanceOtherController.text) ?? 0.0,
      
      // 扣除项字段
      'epf_rate': double.tryParse(_epfRateController.text) ?? 11.0,
      'socso_rate': double.tryParse(_socsoRateController.text) ?? 0.0,
      'eis_rate': double.tryParse(_eisRateController.text) ?? 0.2,
      'tax_rate': double.tryParse(_taxRateController.text) ?? 0.0,
      
      'notes': _notesController.text,
    };

    bool success;
    if (widget.structure == null) {
      success = await salaryProvider.createSalaryStructure(data);
    } else {
      success = await salaryProvider.updateSalaryStructure(widget.structure!.id, data);
    }

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.structure == null ? '薪资结构创建成功' : '薪资结构更新成功'),
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
