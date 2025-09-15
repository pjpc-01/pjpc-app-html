import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/teacher_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/pocketbase_service.dart';

class AddEditTeacherScreen extends StatefulWidget {
  final dynamic teacherData;
  
  const AddEditTeacherScreen({super.key, this.teacherData});

  @override
  State<AddEditTeacherScreen> createState() => _AddEditTeacherScreenState();
}

class _AddEditTeacherScreenState extends State<AddEditTeacherScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _nricController = TextEditingController();
  final _addressController = TextEditingController();
  final _epfNoController = TextEditingController();
  final _socsoNoController = TextEditingController();
  final _bankNameController = TextEditingController();
  final _bankAccountNoController = TextEditingController();
  final _bankAccountNameController = TextEditingController();
  final _idNumberController = TextEditingController();
  final _departmentController = TextEditingController();
  final _positionController = TextEditingController();
  
  // 部门和职位选项
  String _selectedDepartment = '';
  String _selectedPosition = '';
  
  final List<String> _departments = [
    '管理层',
    '学术部门', 
    '学生事务与活动部门',
    '行政与家长沟通部门',
    '财务与后勤部门'
  ];
  
  // 添加默认选项
  final List<String> _defaultPositions = ['请选择职位'];
  
  // 马来西亚银行列表
  final List<String> _malaysianBanks = [
    '马来亚银行 (Maybank)',
    '联昌国际银行 (CIMB Bank)',
    '大众银行 (Public Bank)',
    '兴业银行 (RHB Bank)',
    '丰隆银行 (Hong Leong Bank)',
    '大马银行 (AmBank)',
    '联盟银行 (Alliance Bank)',
    '艾芬银行 (Affin Bank)',
    '伊斯兰银行 (Bank Islam)',
    '国民储蓄银行 (BSN)',
    '农业银行 (AgroBank)',
    '人民银行 (Bank Rakyat)',
    '穆阿马莱银行 (Bank Muamalat)',
    '华侨银行 (OCBC Bank)',
    '大华银行 (UOB Bank)',
    '汇丰银行 (HSBC Bank)',
    '渣打银行 (Standard Chartered)',
    '花旗银行 (Citibank)',
    '德意志银行 (Deutsche Bank)',
    '摩根大通银行 (JP Morgan)',
    '其他银行 (Other Bank)'
  ];
  
  String _selectedBank = '';
  final _nfcCardNumberController = TextEditingController();
  final _teacherUrlController = TextEditingController();
  final _childrenCountController = TextEditingController();

  String _selectedStatus = 'active';
  String _selectedMaritalStatus = 'Single';
  String _selectedPermissions = 'normal_teacher';
  DateTime? _hireDate;
  DateTime? _nfcCardIssuedDate;
  DateTime? _nfcCardExpiryDate;
  bool _isLoading = false;
  
  // 智能操作相关
  bool _isAutoFilling = false;
  String? _lastValidatedEmail;
  String? _lastValidatedPhone;
  Map<String, dynamic> _autoFillData = {};

  final List<String> _statuses = ['active', 'inactive'];
  final List<String> _maritalStatuses = ['Single', 'Married', 'Divorced', 'Separated'];
  final List<String> _permissions = ['normal_teacher', 'senior_teacher'];

  @override
  void initState() {
    super.initState();
    if (widget.teacherData != null) {
      _loadTeacherData();
    }
    
    // 添加智能操作监听器
    _setupSmartListeners();
  }
  
  void _setupSmartListeners() {
    // 监听邮箱输入变化
    _emailController.addListener(_onEmailChanged);
    // 监听电话输入变化
    _phoneController.addListener(_onPhoneChanged);
    // 监听姓名输入变化
    _nameController.addListener(_onNameChanged);
    // 部门变化通过下拉选择处理，不需要监听器
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _nricController.dispose();
    _addressController.dispose();
    _epfNoController.dispose();
    _socsoNoController.dispose();
    _bankNameController.dispose();
    _bankAccountNoController.dispose();
    _bankAccountNameController.dispose();
    _idNumberController.dispose();
    _departmentController.dispose();
    _positionController.dispose();
    _nfcCardNumberController.dispose();
    _teacherUrlController.dispose();
    _childrenCountController.dispose();
    super.dispose();
  }

  void _loadTeacherData() {
    final teacher = widget.teacherData;
    _nameController.text = teacher.getStringValue('name') ?? '';
    _emailController.text = teacher.getStringValue('email') ?? '';
    _phoneController.text = teacher.getStringValue('phone') ?? '';
    _nricController.text = teacher.getStringValue('nric') ?? '';
    _addressController.text = teacher.getStringValue('address') ?? '';
    _epfNoController.text = teacher.getStringValue('epfNo')?.toString() ?? '';
    _socsoNoController.text = teacher.getStringValue('socsoNo')?.toString() ?? '';
    _selectedBank = teacher.getStringValue('bankName') ?? '';
    _bankAccountNoController.text = teacher.getStringValue('bankAccountNo')?.toString() ?? '';
    _bankAccountNameController.text = teacher.getStringValue('bankAccountName') ?? '';
    _idNumberController.text = teacher.getStringValue('idNumber')?.toString() ?? '';
    _selectedDepartment = teacher.getStringValue('department') ?? '';
    _selectedPosition = teacher.getStringValue('position') ?? '';
    _nfcCardNumberController.text = teacher.getStringValue('nfc_card_number') ?? '';
    _teacherUrlController.text = teacher.getStringValue('teacher_url') ?? '';
    _childrenCountController.text = teacher.getStringValue('childrenCount')?.toString() ?? '';
    
    _selectedStatus = teacher.getStringValue('status') ?? 'active';
    _selectedMaritalStatus = teacher.getStringValue('maritalStatus') ?? 'Single';
    _selectedPermissions = teacher.getStringValue('permissions') ?? 'normal_teacher';
    
    final hireDateStr = teacher.getStringValue('hireDate');
    if (hireDateStr != null) {
      _hireDate = DateTime.tryParse(hireDateStr);
    }
    
    final nfcIssuedStr = teacher.getStringValue('nfc_card_issued_date');
    if (nfcIssuedStr != null) {
      _nfcCardIssuedDate = DateTime.tryParse(nfcIssuedStr);
    }
    
    final nfcExpiryStr = teacher.getStringValue('nfc_card_expiry_date');
    if (nfcExpiryStr != null) {
      _nfcCardExpiryDate = DateTime.tryParse(nfcExpiryStr);
    }
  }

  // 智能操作方法
  void _onEmailChanged() {
    final email = _emailController.text.trim();
    if (email.isNotEmpty && email != _lastValidatedEmail) {
      _lastValidatedEmail = email;
      _validateEmail(email);
    }
  }

  void _onPhoneChanged() {
    final phone = _phoneController.text.trim();
    if (phone.isNotEmpty && phone != _lastValidatedPhone) {
      _lastValidatedPhone = phone;
      _validatePhone(phone);
    }
  }

  void _onNameChanged() {
    final name = _nameController.text.trim();
    if (name.isNotEmpty) {
      _autoGenerateTeacherUrl(name);
    }
  }

  void _onDepartmentChanged() {
    if (_selectedDepartment.isNotEmpty) {
      _autoSuggestPosition(_selectedDepartment);
    }
  }

  void _validateEmail(String email) {
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(email)) {
      _showValidationMessage('邮箱格式不正确', isError: true);
    } else {
      _showValidationMessage('邮箱格式正确', isError: false);
    }
  }

  void _validatePhone(String phone) {
    final phoneRegex = RegExp(r'^[0-9+\-\s()]{10,15}$');
    if (!phoneRegex.hasMatch(phone)) {
      _showValidationMessage('电话号码格式不正确', isError: true);
    } else {
      _showValidationMessage('电话号码格式正确', isError: false);
    }
  }

  void _autoGenerateTeacherUrl(String name) {
    if (_teacherUrlController.text.isEmpty) {
      final url = name.toLowerCase().replaceAll(' ', '-');
      _teacherUrlController.text = '/teacher/$url';
    }
  }

  void _autoSuggestPosition(String department) {
    if (_selectedPosition.isEmpty) {
      final suggestions = _getPositionSuggestions(department);
      if (suggestions.isNotEmpty) {
        _showPositionSuggestion(suggestions);
      }
    }
  }

  List<String> _getPositionSuggestions(String department) {
    final suggestions = <String>[];
    switch (department) {
      case '管理层':
        suggestions.addAll([
          '中心负责人/校长',
          '副主任/协调员'
        ]);
        break;
      case '学术部门':
        suggestions.addAll([
          '科任老师/辅导老师',
          '班主任',
          '学务主任'
        ]);
        break;
      case '学生事务与活动部门':
        suggestions.addAll([
          '学生事务老师',
          '活动与兴趣班老师',
          '健康与安全监督'
        ]);
        break;
      case '行政与家长沟通部门':
        suggestions.addAll([
          '行政人员',
          '家长沟通专员'
        ]);
        break;
      case '财务与后勤部门':
        suggestions.addAll([
          '财务/会计助理',
          '后勤人员'
        ]);
        break;
      default:
        suggestions.addAll(['请选择职位']);
    }
    return suggestions;
  }

  void _showPositionSuggestion(List<String> suggestions) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('职位建议'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: suggestions.map((suggestion) => ListTile(
            title: Text(suggestion),
            onTap: () {
              setState(() {
                _selectedPosition = suggestion;
              });
              Navigator.pop(context);
            },
          )).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
        ],
      ),
    );
  }

  void _showValidationMessage(String message, {required bool isError}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  // 自动填充功能
  Future<void> _autoFillFromExistingData() async {
    if (_isAutoFilling) return;
    
    _isAutoFilling = true;
    
    try {
      final teacherProvider = Provider.of<TeacherProvider>(context, listen: false);
      final teachers = teacherProvider.teachers;
      
      // 根据邮箱查找相似教师
      final email = _emailController.text.trim();
      if (email.isNotEmpty) {
        final similarTeacher = teachers.firstWhere(
          (t) => t.getStringValue('email') == email,
          orElse: () => teachers.first,
        );
        
        if (similarTeacher != teachers.first) {
          _autoFillData = similarTeacher.data;
          _showAutoFillDialog();
        }
      }
    } catch (e) {
    } finally {
      _isAutoFilling = false;
    }
  }

  void _showAutoFillDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('发现相似教师信息'),
        content: const Text('是否要使用现有教师的信息来填充表单？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () {
              _applyAutoFill();
              Navigator.pop(context);
            },
            child: const Text('应用'),
          ),
        ],
      ),
    );
  }

  void _applyAutoFill() {
    if (_autoFillData.isNotEmpty) {
      setState(() {
        _selectedDepartment = _autoFillData['department'] ?? '';
        _selectedPosition = _autoFillData['position'] ?? '';
        _selectedBank = _autoFillData['bankName'] ?? '';
        _selectedPermissions = _autoFillData['permissions'] ?? 'normal_teacher';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final isEdit = widget.teacherData != null;
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
                    '只有管理员可以添加或编辑教师',
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
              isEdit ? '编辑教师' : '添加教师',
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
                  _buildPersonalInfoCard(),
                  const SizedBox(height: 16),
                  _buildBankInfoCard(),
                  const SizedBox(height: 16),
                  _buildWorkInfoCard(),
                  const SizedBox(height: 16),
                  _buildNfcInfoCard(),
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
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    controller: _nameController,
                    label: '姓名',
                    icon: Icons.person,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return '请输入姓名';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildTextField(
                    controller: _emailController,
                    label: '邮箱',
                    icon: Icons.email,
                    keyboardType: TextInputType.emailAddress,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return '请输入邮箱';
                      }
                      if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                        return '请输入有效的邮箱地址';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    controller: _phoneController,
                    label: '电话',
                    icon: Icons.phone,
                    keyboardType: TextInputType.phone,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildDropdownField(
                    label: '状态',
                    value: _selectedStatus,
                    items: _statuses,
                    displayItems: ['在职', '离职'],
                    onChanged: (value) => setState(() => _selectedStatus = value!),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPersonalInfoCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '个人信息',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _nricController,
              label: '身份证号',
              icon: Icons.badge,
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _addressController,
              label: '地址',
              icon: Icons.location_on,
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildDropdownField(
                    label: '婚姻状况',
                    value: _selectedMaritalStatus,
                    items: _maritalStatuses,
                    displayItems: ['单身', '已婚', '离婚', '分居'],
                    onChanged: (value) => setState(() => _selectedMaritalStatus = value!),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildTextField(
                    controller: _childrenCountController,
                    label: '子女数量',
                    icon: Icons.child_care,
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBankInfoCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '银行信息',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    controller: _epfNoController,
                    label: 'EPF号码',
                    icon: Icons.account_balance,
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildTextField(
                    controller: _socsoNoController,
                    label: 'SOCSO号码',
                    icon: Icons.security,
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildDropdownField(
              label: '银行名称',
              value: _selectedBank,
              items: _malaysianBanks,
              displayItems: _malaysianBanks,
              onChanged: (value) => setState(() => _selectedBank = value ?? ''),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    controller: _bankAccountNoController,
                    label: '银行账号',
                    icon: Icons.credit_card,
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildTextField(
                    controller: _bankAccountNameController,
                    label: '账户持有人',
                    icon: Icons.person,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWorkInfoCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '工作信息',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    controller: _idNumberController,
                    label: '员工编号',
                    icon: Icons.badge,
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildDropdownField(
                    label: '部门',
                    value: _selectedDepartment,
                    items: _departments,
                    displayItems: _departments,
                    onChanged: (value) {
                      setState(() {
                        _selectedDepartment = value ?? '';
                        _selectedPosition = ''; // 清空职位选择
                      });
                      _onDepartmentChanged();
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildDropdownField(
                    label: '职位',
                    value: _selectedPosition,
                    items: _selectedDepartment.isNotEmpty ? _getPositionSuggestions(_selectedDepartment) : _defaultPositions,
                    displayItems: _selectedDepartment.isNotEmpty ? _getPositionSuggestions(_selectedDepartment) : _defaultPositions,
                    onChanged: (value) {
                      if (_selectedDepartment.isNotEmpty && value != '请选择职位') {
                        setState(() => _selectedPosition = value ?? '');
                      }
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildDropdownField(
                    label: '权限级别',
                    value: _selectedPermissions,
                    items: _permissions,
                    displayItems: ['普通教师', '高级教师'],
                    onChanged: (value) => setState(() => _selectedPermissions = value!),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildDateField(
              label: '入职日期',
              value: _hireDate,
              onTap: _selectHireDate,
              icon: Icons.calendar_today,
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _teacherUrlController,
              label: '教师链接',
              icon: Icons.link,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNfcInfoCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'NFC卡信息',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _nfcCardNumberController,
              label: 'NFC卡号',
              icon: Icons.nfc,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildDateField(
                    label: '发卡日期',
                    value: _nfcCardIssuedDate,
                    onTap: _selectNfcIssuedDate,
                    icon: Icons.calendar_today,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildDateField(
                    label: '到期日期',
                    value: _nfcCardExpiryDate,
                    onTap: _selectNfcExpiryDate,
                    icon: Icons.calendar_today,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF3B82F6)),
        ),
      ),
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String value,
    required List<String> items,
    required List<String> displayItems,
    required ValueChanged<String?> onChanged,
  }) {
    // 确保value在items中，如果不在则设为null
    final validValue = (items.isNotEmpty && items.contains(value)) ? value : null;
    
    return DropdownButtonFormField<String>(
      value: validValue,
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF3B82F6)),
        ),
      ),
      items: (items ?? []).asMap().entries.map((entry) {
        return DropdownMenuItem<String>(
          value: entry.value,
          child: Text(displayItems[entry.key] ?? entry.value),
        );
      }).toList(),
    );
  }

  Widget _buildDateField({
    required String label,
    required DateTime? value,
    required VoidCallback onTap,
    required IconData icon,
  }) {
    return InkWell(
      onTap: onTap,
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFF3B82F6)),
          ),
        ),
        child: Text(
          value != null ? '${value.year}-${value.month.toString().padLeft(2, '0')}-${value.day.toString().padLeft(2, '0')}' : '选择日期',
          style: TextStyle(
            color: value != null ? Colors.black : Colors.grey.shade600,
          ),
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
              side: const BorderSide(color: Color(0xFF64748B)),
            ),
            child: const Text(
              '取消',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF64748B),
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: ElevatedButton(
            onPressed: _isLoading ? null : _saveTeacher,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3B82F6),
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Text(
                    widget.teacherData != null ? '更新' : '保存',
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

  Future<void> _selectHireDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _hireDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (date != null) {
      setState(() {
        _hireDate = date;
      });
    }
  }

  Future<void> _selectNfcIssuedDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _nfcCardIssuedDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (date != null) {
      setState(() {
        _nfcCardIssuedDate = date;
      });
    }
  }

  Future<void> _selectNfcExpiryDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _nfcCardExpiryDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime(2030),
    );
    if (date != null) {
      setState(() {
        _nfcCardExpiryDate = date;
      });
    }
  }

  Future<void> _saveTeacher() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final teacherProvider = Provider.of<TeacherProvider>(context, listen: false);
      
      final teacherData = {
        'name': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'nric': _nricController.text.trim(),
        'address': _addressController.text.trim(),
        'epfNo': int.tryParse(_epfNoController.text) ?? 0,
        'socsoNo': int.tryParse(_socsoNoController.text) ?? 0,
        'bankName': _selectedBank,
        'bankAccountNo': int.tryParse(_bankAccountNoController.text) ?? 0,
        'bankAccountName': _bankAccountNameController.text.trim(),
        'idNumber': int.tryParse(_idNumberController.text) ?? 0,
        'department': _selectedDepartment,
        'position': _selectedPosition,
        'nfc_card_number': _nfcCardNumberController.text.trim(),
        'teacher_url': _teacherUrlController.text.trim(),
        'childrenCount': int.tryParse(_childrenCountController.text) ?? 0,
        'status': _selectedStatus,
        'maritalStatus': _selectedMaritalStatus,
        'permissions': _selectedPermissions,
        'hireDate': _hireDate?.toIso8601String(),
        'nfc_card_issued_date': _nfcCardIssuedDate?.toIso8601String(),
        'nfc_card_expiry_date': _nfcCardExpiryDate?.toIso8601String(),
      };

      bool success;
      if (widget.teacherData != null) {
        success = await teacherProvider.updateTeacher(widget.teacherData.id, teacherData);
      } else {
        success = await teacherProvider.createTeacher(teacherData);
      }

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.teacherData != null ? '教师信息已更新' : '教师已添加',
            ),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
        Navigator.pop(context);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('保存失败: ${teacherProvider.error}'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
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
        title: const Text('删除教师'),
        content: Text('确定要删除教师 "${widget.teacherData.getStringValue('name')}" 吗？此操作不可撤销。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await context.read<TeacherProvider>().deleteTeacher(widget.teacherData.id);
              if (success && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('已删除教师 "${widget.teacherData.getStringValue('name')}"'),
                    backgroundColor: const Color(0xFF10B981),
                  ),
                );
                Navigator.pop(context);
              } else if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('删除失败: ${context.read<TeacherProvider>().error}'),
                    backgroundColor: const Color(0xFFEF4444),
                  ),
                );
              }
            },
            child: const Text('删除'),
          ),
        ],
      ),
    );
  }
}
