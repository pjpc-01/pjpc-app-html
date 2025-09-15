import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/class_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/custom_text_field.dart';
import '../../widgets/common/custom_button.dart';

class AddEditStudentScreen extends StatefulWidget {
  final dynamic student; // null for add, RecordModel for edit
  final bool isEdit;

  const AddEditStudentScreen({
    super.key,
    this.student,
    this.isEdit = false,
  });

  @override
  State<AddEditStudentScreen> createState() => _AddEditStudentScreenState();
}

class _AddEditStudentScreenState extends State<AddEditStudentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _studentIdController = TextEditingController();
  final _standardController = TextEditingController();
  final _centerController = TextEditingController();
  final _branchController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _parentNameController = TextEditingController();
  final _parentPhoneController = TextEditingController();
  final _parentEmailController = TextEditingController();
  final _addressController = TextEditingController();
  final _nfcUrlController = TextEditingController();
  final _notesController = TextEditingController();
  // 根据education分支添加的字段
  final _nricPassportController = TextEditingController();
  final _schoolNameController = TextEditingController();
  final _emergencyContactNameController = TextEditingController();
  final _emergencyContactPhoneController = TextEditingController();
  final _healthInfoController = TextEditingController();
  final _pickupMethodController = TextEditingController();
  final _authorizedPerson1NameController = TextEditingController();
  final _authorizedPerson1PhoneController = TextEditingController();
  final _authorizedPerson1RelationController = TextEditingController();
  final _authorizedPerson2NameController = TextEditingController();
  final _authorizedPerson2PhoneController = TextEditingController();
  final _authorizedPerson2RelationController = TextEditingController();
  final _authorizedPerson3NameController = TextEditingController();
  final _authorizedPerson3PhoneController = TextEditingController();
  final _authorizedPerson3RelationController = TextEditingController();

  String _selectedStatus = 'active';
  String _selectedGender = 'male';
  String _selectedBGT = 'B'; // B: Boy, G: Girl, T: Tuition only (仅补习)
  String _selectedCenter = '';
  String _selectedServiceType = '安亲'; // 服务类型
  String _selectedPickupMethod = '父母接送'; // 接送方式
  String _selectedTuitionStatus = '待付款'; // 学费状态
  DateTime? _selectedBirthDate;
  DateTime? _selectedRegistrationDate;
  bool _isLoading = false;
  List<String> _availableCenters = [];
  List<String> _availableStandards = [];
  List<String> _serviceTypes = ['安亲', '补习', '托管', '其他'];
  List<String> _pickupMethods = ['父母接送', '校车接送', '自行回家', '其他'];
  List<String> _tuitionStatuses = ['待付款', '已付款', '部分付款', '免费'];

  @override
  void initState() {
    super.initState();
    if (widget.isEdit && widget.student != null) {
      _populateForm();
    }
    // 延迟加载可用选项，避免在构建过程中调用setState
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadClassData();
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _studentIdController.dispose();
    _standardController.dispose();
    _centerController.dispose();
    _branchController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _parentNameController.dispose();
    _parentPhoneController.dispose();
    _parentEmailController.dispose();
    _addressController.dispose();
    _nfcUrlController.dispose();
    _notesController.dispose();
    _nricPassportController.dispose();
    _schoolNameController.dispose();
    _emergencyContactNameController.dispose();
    _emergencyContactPhoneController.dispose();
    _healthInfoController.dispose();
    _pickupMethodController.dispose();
    _authorizedPerson1NameController.dispose();
    _authorizedPerson1PhoneController.dispose();
    _authorizedPerson1RelationController.dispose();
    _authorizedPerson2NameController.dispose();
    _authorizedPerson2PhoneController.dispose();
    _authorizedPerson2RelationController.dispose();
    _authorizedPerson3NameController.dispose();
    _authorizedPerson3PhoneController.dispose();
    _authorizedPerson3RelationController.dispose();
    super.dispose();
  }

  void _populateForm() {
    final student = widget.student;
    _nameController.text = student.getStringValue('student_name') ?? '';
    _studentIdController.text = student.getStringValue('student_id') ?? '';
    _standardController.text = student.getStringValue('standard') ?? '';
    _centerController.text = student.getStringValue('center') ?? '';
    _selectedCenter = student.getStringValue('center') ?? '';
    _branchController.text = student.getStringValue('branch_name') ?? '';
    _phoneController.text = student.getStringValue('phone') ?? '';
    _emailController.text = student.getStringValue('email') ?? '';
    _parentNameController.text = student.getStringValue('parent_name') ?? '';
    _parentPhoneController.text = student.getStringValue('parent_phone') ?? '';
    _parentEmailController.text = student.getStringValue('parent_email') ?? '';
    _addressController.text = student.getStringValue('address') ?? '';
    _nfcUrlController.text = student.getStringValue('nfc_url') ?? '';
    _notesController.text = student.getStringValue('notes') ?? '';
    _nricPassportController.text = student.getStringValue('nric_passport') ?? '';
    _schoolNameController.text = student.getStringValue('school_name') ?? '';
    _emergencyContactNameController.text = student.getStringValue('emergency_contact_name') ?? '';
    _emergencyContactPhoneController.text = student.getStringValue('emergency_contact_phone') ?? '';
    _healthInfoController.text = student.getStringValue('health_info') ?? '';
    _pickupMethodController.text = student.getStringValue('pickup_method') ?? '';
    _authorizedPerson1NameController.text = student.getStringValue('authorized_person1_name') ?? '';
    _authorizedPerson1PhoneController.text = student.getStringValue('authorized_person1_phone') ?? '';
    _authorizedPerson1RelationController.text = student.getStringValue('authorized_person1_relation') ?? '';
    _authorizedPerson2NameController.text = student.getStringValue('authorized_person2_name') ?? '';
    _authorizedPerson2PhoneController.text = student.getStringValue('authorized_person2_phone') ?? '';
    _authorizedPerson2RelationController.text = student.getStringValue('authorized_person2_relation') ?? '';
    _authorizedPerson3NameController.text = student.getStringValue('authorized_person3_name') ?? '';
    _authorizedPerson3PhoneController.text = student.getStringValue('authorized_person3_phone') ?? '';
    _authorizedPerson3RelationController.text = student.getStringValue('authorized_person3_relation') ?? '';
    _selectedServiceType = student.getStringValue('service_type') ?? '安亲';
    _selectedPickupMethod = student.getStringValue('pickup_method') ?? '父母接送';
    _selectedTuitionStatus = student.getStringValue('tuition_status') ?? '待付款';
    _selectedStatus = student.getStringValue('status') ?? 'active';
    final genderValue = student.getStringValue('gender') ?? 'male';
    _selectedGender = genderValue.toLowerCase() == 'female' ? 'female' : 'male';
    
    
    // 从学号中提取BGT类型
    final studentId = student.getStringValue('student_id') ?? '';
    if (studentId.isNotEmpty) {
      _selectedBGT = studentId[0];
    }
    
    final birthDateStr = student.getStringValue('birth_date');
    if (birthDateStr != null && birthDateStr.isNotEmpty) {
      try {
        _selectedBirthDate = DateTime.parse(birthDateStr);
      } catch (e) {
        _selectedBirthDate = null;
      }
    }
    
    final registrationDateStr = student.getStringValue('registration_date');
    if (registrationDateStr != null && registrationDateStr.isNotEmpty) {
      try {
        _selectedRegistrationDate = DateTime.parse(registrationDateStr);
      } catch (e) {
        _selectedRegistrationDate = null;
      }
    }
  }

  Future<void> _loadClassData() async {
    final classProvider = Provider.of<ClassProvider>(context, listen: false);
    await classProvider.loadClasses();
    
    // 加载可用的中心和班级
    _loadAvailableOptions();
  }

  void _loadAvailableOptions() {
    final studentProvider = Provider.of<StudentProvider>(context, listen: false);
    
    // 获取所有中心
    _availableCenters = studentProvider.centers;
    
    // 获取所有班级
    _availableStandards = studentProvider.standards;
    
    // 如果还没有选择中心，选择第一个
    if (_selectedCenter.isEmpty && _availableCenters.isNotEmpty) {
      _selectedCenter = _availableCenters.first;
    }
    
    // 通知UI更新
    if (mounted) {
      setState(() {});
    }
    
    // 如果不是编辑模式，生成智能学号
    if (!widget.isEdit) {
      _generateSmartStudentId();
    }
  }

  Future<void> _generateSmartStudentId() async {
    if (_selectedBGT.isEmpty || _selectedCenter.isEmpty) return;
    
    final studentProvider = Provider.of<StudentProvider>(context, listen: false);
    final students = studentProvider.students;
    
    // 生成学号前缀：B、G、T
    // B=男生, G=女生, T=仅补习
    final prefix = _selectedBGT;
    
    // 查找该分行和前缀下已使用的学号
    final existingIds = students
        .where((s) {
          final studentId = s.getStringValue('student_id') ?? '';
          final studentCenter = s.getStringValue('center') ?? '';
          return studentId.startsWith(prefix) && studentCenter == _selectedCenter;
        })
        .map((s) => s.getStringValue('student_id') ?? '')
        .toList();
    
    // 生成下一个可用的学号（每个分行内独立编号）
    int nextNumber = 1;
    String newStudentId;
    
    do {
      newStudentId = '$prefix$nextNumber';
      nextNumber++;
    } while (existingIds.contains(newStudentId));
    
    // 更新学号输入框
    if (mounted) {
      setState(() {
        _studentIdController.text = newStudentId;
      });
    }
  }

  String _getCenterCode(String center) {
    // 根据中心名称生成代码
    final centerCodes = {
      'WX 01': '01',
      'WX 02': '02', 
      'WX 03': '03',
      'WX 04': '04',
      'WX 05': '05',
      'WX 06': '06',
      'WX 07': '07',
      'WX 08': '08',
      'WX 09': '09',
      'WX 10': '10',
      '中心1': '01',
      '中心2': '02', 
      '中心3': '03',
      'Center 1': '01',
      'Center 2': '02',
      'Center 3': '03',
      'Main Center': '01',
      'Branch Center': '02',
    };
    
    // 如果直接匹配到，返回对应代码
    if (centerCodes.containsKey(center)) {
      return centerCodes[center]!;
    }
    
    // 如果是WX格式，提取数字部分
    final wxMatch = RegExp(r'WX\s*(\d+)').firstMatch(center);
    if (wxMatch != null) {
      final number = wxMatch.group(1)!;
      return number.padLeft(2, '0');
    }
    
    // 如果是其他格式，尝试提取数字
    final numberMatch = RegExp(r'(\d+)').firstMatch(center);
    if (numberMatch != null) {
      final number = numberMatch.group(1)!;
      return number.padLeft(2, '0');
    }
    
    // 默认返回前两个字符
    return center.length >= 2 ? center.substring(0, 2).toUpperCase() : center.toUpperCase();
  }

  Widget _buildStudentIdHint() {
    final prefix = _selectedBGT;
    final exampleId = '${prefix}1';
    
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(
          color: AppTheme.primaryColor.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.info_outline,
            color: AppTheme.primaryColor,
            size: 20,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '智能学号生成',
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '格式: ${prefix}X (如: $exampleId)',
                  style: AppTextStyles.caption.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                ),
                Text(
                  'B=男生, G=女生, T=仅补习 | 每个分行独立编号',
                  style: AppTextStyles.caption.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                ),
                Text(
                  '当前分行: ${_selectedCenter}',
                  style: AppTextStyles.caption.copyWith(
                    color: AppTheme.accentColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (_selectedBGT == 'T')
                  Text(
                    '仅补习类型可自由选择性别',
                    style: AppTextStyles.caption.copyWith(
                      color: AppTheme.accentColor,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(widget.isEdit ? '编辑学生' : '添加学生'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          if (widget.isEdit)
            IconButton(
              onPressed: _showDeleteDialog,
              icon: const Icon(Icons.delete),
              tooltip: '删除学生',
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSectionTitle('基本信息'),
              _buildBasicInfoSection(),
              const SizedBox(height: AppSpacing.xl),
              
              _buildSectionTitle('学校信息'),
              _buildSchoolInfoSection(),
              const SizedBox(height: AppSpacing.xl),
              
              _buildSectionTitle('家长信息'),
              _buildParentInfoSection(),
              const SizedBox(height: AppSpacing.xl),
              
              _buildSectionTitle('其他信息'),
              _buildOtherInfoSection(),
              const SizedBox(height: AppSpacing.xl),
              
              _buildSectionTitle('接送信息'),
              _buildPickupInfoSection(),
              const SizedBox(height: AppSpacing.xl),
              
              _buildSectionTitle('注册和学费信息'),
              _buildRegistrationInfoSection(),
              const SizedBox(height: AppSpacing.xl),
              
              _buildActionButtons(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Text(
        title,
        style: AppTextStyles.headline6.copyWith(
          color: AppTheme.primaryColor,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildBasicInfoSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: CustomTextField(
                    controller: _nameController,
                    label: '学生姓名',
                    hintText: '请输入学生姓名',
                    prefixIcon: const Icon(Icons.person),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return '请输入学生姓名';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: CustomTextField(
                    controller: _studentIdController,
                    label: '学号',
                    hintText: '自动生成',
                    prefixIcon: const Icon(Icons.badge),
                    enabled: widget.isEdit, // 编辑模式可以修改学号
                    suffixIcon: !widget.isEdit ? IconButton(
                      icon: const Icon(Icons.refresh),
                      onPressed: _generateSmartStudentId,
                      tooltip: '重新生成学号',
                    ) : null,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return '请输入学号';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            // 学号生成提示
            if (!widget.isEdit) _buildStudentIdHint(),
            const SizedBox(height: AppSpacing.md),
            // BGT选择
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _getSafeDropdownValue(_selectedBGT, ['B', 'G', 'T']),
                    decoration: const InputDecoration(
                      labelText: '性别/类型',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'B', child: Text('B - 男生')),
                      DropdownMenuItem(value: 'G', child: Text('G - 女生')),
                      DropdownMenuItem(value: 'T', child: Text('T - 仅补习')),
                    ],
                    onChanged: (value) {
                      setState(() {
                        _selectedBGT = value!;
                        if (value == 'B') {
                          _selectedGender = 'male';
                        } else if (value == 'G') {
                          _selectedGender = 'female';
                        }
                      });
                      _generateSmartStudentId();
                    },
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: _availableCenters.isEmpty 
                    ? const TextField(
                        decoration: InputDecoration(
                          labelText: '中心',
                          prefixIcon: Icon(Icons.location_on),
                          hintText: '正在加载...',
                        ),
                        enabled: false,
                      )
                    : DropdownButtonFormField<String>(
                        value: _getSafeDropdownValue(_selectedCenter, _availableCenters),
                        decoration: const InputDecoration(
                          labelText: '中心',
                          prefixIcon: Icon(Icons.location_on),
                        ),
                        items: _availableCenters.map((center) {
                          return DropdownMenuItem(
                            value: center,
                            child: Text(center),
                          );
                        }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedCenter = value!;
                        _centerController.text = value;
                      });
                      _generateSmartStudentId();
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _getSafeDropdownValue(_selectedGender, ['male', 'female']),
                    decoration: const InputDecoration(
                      labelText: '性别',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'male', child: Text('男')),
                      DropdownMenuItem(value: 'female', child: Text('女')),
                    ],
                    onChanged: _selectedBGT == 'T' ? (value) => setState(() => _selectedGender = value!) : null,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _getSafeDropdownValue(_selectedStatus, ['active', 'inactive', 'graduated']),
                    decoration: const InputDecoration(
                      labelText: '状态',
                      prefixIcon: Icon(Icons.info_outline),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'active', child: Text('在读')),
                      DropdownMenuItem(value: 'inactive', child: Text('休学')),
                      DropdownMenuItem(value: 'graduated', child: Text('毕业')),
                    ],
                    onChanged: (value) => setState(() => _selectedStatus = value!),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            CustomTextField(
              controller: _nricPassportController,
              label: 'NRIC/护照号码',
              hintText: '请输入NRIC号码或护照号码',
              prefixIcon: const Icon(Icons.credit_card),
              keyboardType: TextInputType.text,
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: _selectBirthDate,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.md,
                        vertical: AppSpacing.sm,
                      ),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.dividerColor),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today, color: AppTheme.textSecondary),
                          const SizedBox(width: AppSpacing.sm),
                          Text(
                            _selectedBirthDate != null
                                ? '出生日期: ${_formatDate(_selectedBirthDate!)}'
                                : '选择出生日期',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: _selectedBirthDate != null
                                  ? AppTheme.textPrimary
                                  : AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                // 注意：入学日期字段需要先在PocketBase中创建
                // const SizedBox(width: AppSpacing.md),
                // Expanded(
                //   child: InkWell(
                //     onTap: _selectEnrollmentDate,
                //     child: Container(
                //       padding: const EdgeInsets.symmetric(
                //         horizontal: AppSpacing.md,
                //         vertical: AppSpacing.sm,
                //       ),
                //       decoration: BoxDecoration(
                //         border: Border.all(color: AppTheme.dividerColor),
                //         borderRadius: BorderRadius.circular(AppRadius.md),
                //       ),
                //       child: Row(
                //         children: [
                //           const Icon(Icons.school, color: AppTheme.textSecondary),
                //           const SizedBox(width: AppSpacing.sm),
                //           Text(
                //             _selectedEnrollmentDate != null
                //                 ? '入学日期: ${_formatDate(_selectedEnrollmentDate!)}'
                //                 : '选择入学日期',
                //             style: AppTextStyles.bodyMedium.copyWith(
                //               color: _selectedEnrollmentDate != null
                //                   ? AppTheme.textPrimary
                //                   : AppTheme.textSecondary,
                //             ),
                //           ),
                //         ],
                //       ),
                //     ),
                //   ),
                // ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSchoolInfoSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            _buildSchoolSelector(),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: _availableStandards.isEmpty 
                    ? const TextField(
                        decoration: InputDecoration(
                          labelText: '班级',
                          prefixIcon: Icon(Icons.class_),
                          hintText: '正在加载...',
                        ),
                        enabled: false,
                      )
                    : DropdownButtonFormField<String>(
                        value: _getSafeDropdownValue(_standardController.text, _availableStandards),
                        decoration: const InputDecoration(
                          labelText: '班级',
                          prefixIcon: Icon(Icons.class_),
                        ),
                        items: _availableStandards.map((standard) {
                          return DropdownMenuItem(
                            value: standard,
                            child: Text(standard),
                          );
                        }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _standardController.text = value ?? '';
                      });
                    },
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return '请选择班级';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _getSafeDropdownValue(_selectedServiceType, _serviceTypes),
                    decoration: const InputDecoration(
                      labelText: '服务类型',
                      prefixIcon: Icon(Icons.work),
                    ),
                    items: _serviceTypes.map((type) {
                      return DropdownMenuItem(
                        value: type,
                        child: Text(type),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedServiceType = value!;
                      });
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            CustomTextField(
              controller: _branchController,
              label: '分校',
              hintText: '请输入分校（可选）',
              prefixIcon: const Icon(Icons.business),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildParentInfoSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            CustomTextField(
              controller: _parentNameController,
              label: '家长姓名',
              hintText: '请输入家长姓名',
              prefixIcon: const Icon(Icons.person_outline),
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: CustomTextField(
                    controller: _parentPhoneController,
                    label: '家长电话',
                    hintText: '请输入家长电话',
                    prefixIcon: const Icon(Icons.phone),
                    keyboardType: TextInputType.phone,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: CustomTextField(
                    controller: _parentEmailController,
                    label: '家长邮箱',
                    hintText: '请输入家长邮箱',
                    prefixIcon: const Icon(Icons.email),
                    keyboardType: TextInputType.emailAddress,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            const Divider(),
            const SizedBox(height: AppSpacing.md),
            Text(
              '紧急联络人',
              style: AppTextStyles.bodyLarge.copyWith(
                fontWeight: FontWeight.w600,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            CustomTextField(
              controller: _emergencyContactNameController,
              label: '紧急联络人姓名',
              hintText: '请输入紧急联络人姓名',
              prefixIcon: const Icon(Icons.emergency),
            ),
            const SizedBox(height: AppSpacing.md),
            CustomTextField(
              controller: _emergencyContactPhoneController,
              label: '紧急联络电话',
              hintText: '请输入紧急联络电话',
              prefixIcon: const Icon(Icons.phone),
              keyboardType: TextInputType.phone,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOtherInfoSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: CustomTextField(
                    controller: _phoneController,
                    label: '学生电话',
                    hintText: '请输入学生电话',
                    prefixIcon: const Icon(Icons.phone),
                    keyboardType: TextInputType.phone,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: CustomTextField(
                    controller: _emailController,
                    label: '学生邮箱',
                    hintText: '请输入学生邮箱',
                    prefixIcon: const Icon(Icons.email),
                    keyboardType: TextInputType.emailAddress,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            CustomTextField(
              controller: _addressController,
              label: '家庭地址',
              hintText: '请输入家庭地址',
              prefixIcon: const Icon(Icons.home),
              maxLines: 2,
            ),
            const SizedBox(height: AppSpacing.md),
            CustomTextField(
              controller: _nfcUrlController,
              label: 'NFC URL',
              hintText: '请输入NFC URL（可选）',
              prefixIcon: const Icon(Icons.nfc),
            ),
            const SizedBox(height: AppSpacing.md),
            const Divider(),
            const SizedBox(height: AppSpacing.md),
            Text(
              '健康信息',
              style: AppTextStyles.bodyLarge.copyWith(
                fontWeight: FontWeight.w600,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            CustomTextField(
              controller: _healthInfoController,
              label: '健康/过敏记录',
              hintText: '请详细描述学生的健康状况、过敏史、特殊需求等',
              prefixIcon: const Icon(Icons.medical_services),
              maxLines: 3,
            ),
            const SizedBox(height: AppSpacing.md),
            const Divider(),
            const SizedBox(height: AppSpacing.md),
            CustomTextField(
              controller: _notesController,
              label: '备注',
              hintText: '请输入其他备注信息（可选）',
              prefixIcon: const Icon(Icons.note),
              maxLines: 3,
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
            onPressed: _isLoading ? null : () => Navigator.pop(context),
            child: const Text('取消'),
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: CustomButton(
            onPressed: _isLoading ? null : _saveStudent,
            text: widget.isEdit ? '更新' : '添加',
            isLoading: _isLoading,
          ),
        ),
      ],
    );
  }

  Future<void> _selectBirthDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedBirthDate ?? DateTime.now().subtract(const Duration(days: 365 * 18)),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (date != null) {
      setState(() => _selectedBirthDate = date);
    }
  }

  // 注意：入学日期字段需要先在PocketBase中创建
  // Future<void> _selectEnrollmentDate() async {
  //   final date = await showDatePicker(
  //     context: context,
  //     initialDate: _selectedEnrollmentDate ?? DateTime.now(),
  //     firstDate: DateTime(2020),
  //     lastDate: DateTime.now().add(const Duration(days: 365)),
  //   );
  //   if (date != null) {
  //     setState(() => _selectedEnrollmentDate = date);
  //   }
  // }

  String _formatDate(DateTime date) {
    return '${date.year}年${date.month}月${date.day}日';
  }

  Widget _buildSchoolSelector() {
    final commonSchools = [
      'SJKC Pu Chong Utama',
      'SJKC Bandar Puteri',
      'SJKC Bandar Kinrara',
      'SJKC Taman Putra',
      'SJKC Bandar Puchong Jaya',
      'SK Bandar Puteri',
      'SK Bandar Kinrara',
      'SK Taman Putra',
      '其他学校'
    ];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '学校名称',
          style: AppTextStyles.bodyMedium.copyWith(
            fontWeight: FontWeight.w500,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        
        // 常用学校按钮
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: commonSchools.map((school) {
            final isSelected = _schoolNameController.text == school;
            return GestureDetector(
              onTap: () {
                setState(() {
                  _schoolNameController.text = school;
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.primaryColor : Colors.grey[100],
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected ? AppTheme.primaryColor : Colors.grey[300]!,
                  ),
                ),
                child: Text(
                  school,
                  style: TextStyle(
                    color: isSelected ? Colors.white : AppTheme.textPrimary,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        
        const SizedBox(height: 12),
        
        // 自定义输入
        CustomTextField(
          controller: _schoolNameController,
          label: '自定义学校',
          hintText: '输入其他学校名称',
          prefixIcon: const Icon(Icons.edit),
        ),
      ],
    );
  }

  Widget _buildRelationSelector(TextEditingController controller) {
    final commonRelations = [
      '父亲', '母亲', '爷爷', '奶奶', '外公', '外婆', 
      '叔叔', '阿姨', '哥哥', '姐姐', '保姆', '其他'
    ];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '关系',
          style: AppTextStyles.bodyMedium.copyWith(
            fontWeight: FontWeight.w500,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        
        // 常用关系按钮
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: commonRelations.map((relation) {
            final isSelected = controller.text == relation;
            return GestureDetector(
              onTap: () {
                setState(() {
                  controller.text = relation;
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.primaryColor : Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? AppTheme.primaryColor : Colors.grey[300]!,
                  ),
                ),
                child: Text(
                  relation,
                  style: TextStyle(
                    color: isSelected ? Colors.white : AppTheme.textPrimary,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        
        const SizedBox(height: 8),
        
        // 自定义输入
        TextField(
          controller: controller,
          decoration: InputDecoration(
            labelText: '自定义关系',
            hintText: '输入其他关系',
            prefixIcon: const Icon(Icons.edit, size: 18),
            border: const OutlineInputBorder(),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
        ),
      ],
    );
  }

  Future<void> _saveStudent() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final studentData = {
        'student_name': _nameController.text.trim(),
        'student_id': _studentIdController.text.trim(),
        'standard': _standardController.text.trim(),
        'center': _centerController.text.trim(),
        'branch_name': _branchController.text.trim(),
        'phone': _phoneController.text.trim(),
        'email': _emailController.text.trim(),
        'parent_name': _parentNameController.text.trim(),
        'parent_phone': _parentPhoneController.text.trim(),
        'parent_email': _parentEmailController.text.trim(),
        'address': _addressController.text.trim(),
        'nfc_url': _nfcUrlController.text.trim(),
        'notes': _notesController.text.trim(),
        // 根据education分支添加的字段
        'nric_passport': _nricPassportController.text.trim(),
        'school_name': _schoolNameController.text.trim(),
        'service_type': _selectedServiceType,
        'emergency_contact_name': _emergencyContactNameController.text.trim(),
        'emergency_contact_phone': _emergencyContactPhoneController.text.trim(),
        'health_info': _healthInfoController.text.trim(),
        'pickup_method': _selectedPickupMethod,
        'authorized_person1_name': _authorizedPerson1NameController.text.trim(),
        'authorized_person1_phone': _authorizedPerson1PhoneController.text.trim(),
        'authorized_person1_relation': _authorizedPerson1RelationController.text.trim(),
        'authorized_person2_name': _authorizedPerson2NameController.text.trim(),
        'authorized_person2_phone': _authorizedPerson2PhoneController.text.trim(),
        'authorized_person2_relation': _authorizedPerson2RelationController.text.trim(),
        'authorized_person3_name': _authorizedPerson3NameController.text.trim(),
        'authorized_person3_phone': _authorizedPerson3PhoneController.text.trim(),
        'authorized_person3_relation': _authorizedPerson3RelationController.text.trim(),
        'tuition_status': _selectedTuitionStatus,
        'registration_date': _selectedRegistrationDate?.toIso8601String(),
        'status': _selectedStatus,
        'gender': _selectedGender,
        'birth_date': _selectedBirthDate?.toIso8601String(),
        // 'enrollment_date': _selectedEnrollmentDate?.toIso8601String(),
      };

      final studentProvider = Provider.of<StudentProvider>(context, listen: false);
      bool success;

      if (widget.isEdit) {
        success = await studentProvider.updateStudent(widget.student.id, studentData);
      } else {
        success = await studentProvider.createStudent(studentData);
      }

      if (success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(widget.isEdit ? '学生信息更新成功' : '学生添加成功'),
              backgroundColor: AppTheme.successColor,
            ),
          );
          Navigator.pop(context);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(studentProvider.error ?? '操作失败'),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('操作失败: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showDeleteDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('删除学生'),
        content: Text('确定要删除学生 "${_nameController.text}" 吗？此操作不可撤销。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _deleteStudent();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
            ),
            child: const Text('删除'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteStudent() async {
    setState(() => _isLoading = true);

    try {
      final studentProvider = Provider.of<StudentProvider>(context, listen: false);
      final success = await studentProvider.deleteStudent(widget.student.id);

      if (success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('学生删除成功'),
              backgroundColor: AppTheme.successColor,
            ),
          );
          Navigator.pop(context);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(studentProvider.error ?? '删除失败'),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('删除失败: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Widget _buildPickupInfoSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            Text(
              '接送方式',
              style: AppTextStyles.bodyLarge.copyWith(
                fontWeight: FontWeight.w600,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            DropdownButtonFormField<String>(
              value: _getSafeDropdownValue(_selectedPickupMethod, _pickupMethods),
              decoration: const InputDecoration(
                labelText: '接送方式',
                prefixIcon: Icon(Icons.directions_car),
              ),
              items: _pickupMethods.map((method) {
                return DropdownMenuItem(
                  value: method,
                  child: Text(method),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedPickupMethod = value!;
                });
              },
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              '授权接送人信息',
              style: AppTextStyles.bodyLarge.copyWith(
                fontWeight: FontWeight.w600,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              '最多可添加3个授权接送人',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            _buildAuthorizedPersonCard('授权接送人1', _authorizedPerson1NameController, _authorizedPerson1PhoneController, _authorizedPerson1RelationController),
            const SizedBox(height: AppSpacing.md),
            _buildAuthorizedPersonCard('授权接送人2', _authorizedPerson2NameController, _authorizedPerson2PhoneController, _authorizedPerson2RelationController),
            const SizedBox(height: AppSpacing.md),
            _buildAuthorizedPersonCard('授权接送人3', _authorizedPerson3NameController, _authorizedPerson3PhoneController, _authorizedPerson3RelationController),
          ],
        ),
      ),
    );
  }

  Widget _buildAuthorizedPersonCard(String title, TextEditingController nameController, TextEditingController phoneController, TextEditingController relationController) {
    return Card(
      color: AppTheme.surfaceColor,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: AppTextStyles.bodyMedium.copyWith(
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            CustomTextField(
              controller: nameController,
              label: '姓名',
              hintText: '接送人姓名',
              prefixIcon: const Icon(Icons.person),
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: CustomTextField(
                    controller: phoneController,
                    label: '电话',
                    hintText: '联系电话',
                    prefixIcon: const Icon(Icons.phone),
                    keyboardType: TextInputType.phone,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: _buildRelationSelector(relationController),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRegistrationInfoSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: _selectRegistrationDate,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.md,
                        vertical: AppSpacing.sm,
                      ),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.dividerColor),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today, color: AppTheme.textSecondary),
                          const SizedBox(width: AppSpacing.sm),
                          Text(
                            _selectedRegistrationDate != null
                                ? '注册日期: ${_formatDate(_selectedRegistrationDate!)}'
                                : '选择注册日期',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: _selectedRegistrationDate != null
                                  ? AppTheme.textPrimary
                                  : AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _getSafeDropdownValue(_selectedTuitionStatus, _tuitionStatuses),
                    decoration: const InputDecoration(
                      labelText: '学费状态',
                      prefixIcon: Icon(Icons.payment),
                    ),
                    items: _tuitionStatuses.map((status) {
                      return DropdownMenuItem(
                        value: status,
                        child: Text(status),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedTuitionStatus = value!;
                      });
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              '报生纸副本',
              style: AppTextStyles.bodyLarge.copyWith(
                fontWeight: FontWeight.w600,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                border: Border.all(color: AppTheme.dividerColor),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Column(
                children: [
                  const Icon(Icons.upload_file, size: 48, color: AppTheme.textSecondary),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    '上传报生纸副本',
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  ElevatedButton.icon(
                    onPressed: () {
                      // TODO: 实现文件上传功能
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('文件上传功能开发中...')),
                      );
                    },
                    icon: const Icon(Icons.attach_file),
                    label: const Text('选择文件'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    '支持PDF、JPG、JPEG、PNG格式,最大5MB',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _selectRegistrationDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedRegistrationDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) {
      setState(() => _selectedRegistrationDate = date);
    }
  }

  String? _getSafeDropdownValue(String? currentValue, List<String> availableOptions) {
    // 如果选项列表为空，返回null（不显示下拉菜单）
    if (availableOptions.isEmpty) {
      return null;
    }
    
    // 如果当前值为空，返回第一个选项
    if (currentValue == null || currentValue.isEmpty) {
      return availableOptions.first;
    }
    
    // 如果当前值在选项中，返回当前值
    if (availableOptions.contains(currentValue)) {
      return currentValue;
    }
    
    // 否则返回第一个选项
    return availableOptions.first;
  }
}
