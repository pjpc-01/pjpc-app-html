import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import '../../teacher/providers/teacher_provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/services/pocketbase_service.dart';
import '../../../shared/services/nfc_safe_scanner_service.dart';

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
  final _assignedClassesController = TextEditingController();
  List<String> _selectedClasses = [];

  String _selectedStatus = 'active';
  String _selectedMaritalStatus = 'Single';
  String _selectedPermissions = 'normal_teacher';
  String _selectedRole = 'teacher';
  String _selectedCenterAssignment = '';
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
  final List<String> _roles = ['admin', 'teacher', 'parent', 'accountant'];
  List<String> _centers = []; // 从centers集合动态获取
  final List<String> _availableClasses = [
    '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
    '中一', '中二', '中三', '中四', '中五', '中六'
  ];

  @override
  void initState() {
    super.initState();
    if (widget.teacherData != null) {
      _loadTeacherData();
    }
    
    // 加载分行数据
    _loadCenters();
    
    // 添加智能操作监听器
    _setupSmartListeners();
    
    // 确保教师数据是最新的
    _refreshTeacherData();
  }
  
  // 加载分行数据
  Future<void> _loadCenters() async {
    try {
      final pocketBaseService = Provider.of<PocketBaseService>(context, listen: false);
      final centers = await pocketBaseService.getCenters();
      
      // 调试信息：打印所有分行数据
      for (int i = 0; i < centers.length; i++) {
        final center = centers[i];
      }
      
      setState(() {
        // 优先使用代码，如果没有代码则使用名称
        _centers = centers.map((center) {
          final code = center.getStringValue('code') ?? '';
          final name = center.getStringValue('name') ?? '';
          return code.isNotEmpty ? code : name;
        }).toList();
        _centers.removeWhere((value) => value.isEmpty); // 移除空值
        
      });
    } catch (e) {
      // 如果加载失败，使用默认值
      setState(() {
        _centers = ['WX 01', 'WX 02', 'WX 03', 'WX 04']; // 默认分行代码
      });
    }
  }

  // 刷新教师数据
  Future<void> _refreshTeacherData() async {
    try {
      // 延迟执行，避免在 build 过程中调用
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        try {
          final teacherProvider = Provider.of<TeacherProvider>(context, listen: false);
          await teacherProvider.refreshTeachers();
        } catch (e) {
          // 静默处理错误，不影响界面加载
        }
      });
    } catch (e) {
      // 静默处理错误，不影响界面加载
    }
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
    _assignedClassesController.dispose();
    super.dispose();
  }

  Future<void> _loadTeacherData() async {
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
    _nfcCardNumberController.text = teacher.getStringValue('cardNumber') ?? '';
    _teacherUrlController.text = teacher.getStringValue('teacher_url') ?? '';
    _childrenCountController.text = teacher.getStringValue('childrenCount')?.toString() ?? '';
    // 处理分配的班级
    final assignedClasses = teacher.getStringValue('assigned_classes') ?? '';
    if (assignedClasses.isNotEmpty) {
      _selectedClasses = assignedClasses.split(',').map((c) => c.trim()).toList();
    } else {
      _selectedClasses = [];
    }
    _assignedClassesController.text = assignedClasses;
    
    _selectedStatus = teacher.getStringValue('status') ?? 'active';
    _selectedMaritalStatus = teacher.getStringValue('maritalStatus') ?? 'Single';
    _selectedPermissions = teacher.getStringValue('permissions') ?? 'normal_teacher';
    
    // 确保角色值在有效列表中
    final roleValue = teacher.getStringValue('role') ?? 'teacher';
    _selectedRole = _roles.contains(roleValue) ? roleValue : 'teacher';
    
    // 确保中心分配值在有效列表中
    // center_assignment 是关联字段，需要根据 ID 查找对应的名称
    final centerAssignmentId = teacher.getStringValue('center_assignment') ?? '';
    if (centerAssignmentId.isNotEmpty) {
      try {
        final pocketBaseService = Provider.of<PocketBaseService>(context, listen: false);
        final centers = await pocketBaseService.getCenters();
        final matchingCenter = centers.firstWhere(
          (center) => center.id == centerAssignmentId,
          orElse: () => throw Exception('未找到匹配的分行'),
        );
        // 优先显示代码，如果没有代码则显示名称
        _selectedCenterAssignment = matchingCenter.getStringValue('code') ?? 
                                   matchingCenter.getStringValue('name') ?? '';
      } catch (e) {
        _selectedCenterAssignment = '';
      }
    } else {
      _selectedCenterAssignment = '';
    }
    
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
    // 更宽松的邮箱验证
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (!emailRegex.hasMatch(email)) {
      _showValidationMessage('邮箱格式不正确', isError: true);
    } else {
      _showValidationMessage('邮箱格式正确', isError: false);
    }
  }

  void _validatePhone(String phone) {
    // 更宽松的电话号码验证，支持马来西亚电话号码格式
    final phoneRegex = RegExp(r'^[0-9+\-\s()]{8,15}$');
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
                  const SizedBox(height: 16),
                  _buildPermissionCard(),
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
                    isRequired: true,
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
                    isRequired: true,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return '请输入邮箱';
                      }
                      if (!RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$').hasMatch(value)) {
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
                    isRequired: true,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return '请输入电话号码';
                      }
                      if (!RegExp(r'^[0-9+\-\s()]{8,15}$').hasMatch(value)) {
                        return '请输入有效的电话号码';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildDropdownField(
                    label: '状态',
                    value: _selectedStatus,
                    items: _statuses,
                    displayItems: ['在职', '离职'],
                    isRequired: true,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return '请选择状态';
                      }
                      return null;
                    },
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
                    isRequired: true,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return '请输入员工编号';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildDropdownField(
                    label: '部门',
                    value: _selectedDepartment,
                    items: _departments,
                    displayItems: _departments,
                    isRequired: true,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return '请选择部门';
                      }
                      return null;
                    },
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
                    isRequired: true,
                    validator: (value) {
                      if (value == null || value.isEmpty || value == '请选择职位') {
                        return '请选择职位';
                      }
                      return null;
                    },
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
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    controller: _nfcCardNumberController,
                    label: 'NFC卡号',
                    icon: Icons.nfc,
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  onPressed: _scanNfcCard,
                  icon: const Icon(Icons.nfc, size: 16),
                  label: const Text('扫描'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3B82F6),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                ),
              ],
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
    bool isRequired = false,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: validator,
      decoration: InputDecoration(
        labelText: isRequired ? '$label *' : label,
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
        labelStyle: TextStyle(
          color: isRequired ? Colors.red.shade700 : null,
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
    bool isRequired = false,
    String? Function(String?)? validator,
  }) {
    // 确保value在items中，如果不在则设为null
    final validValue = (items.isNotEmpty && items.contains(value)) ? value : null;
    
    return DropdownButtonFormField<String>(
      value: validValue,
      onChanged: onChanged,
      validator: validator,
      decoration: InputDecoration(
        labelText: isRequired ? '$label *' : label,
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
        labelStyle: TextStyle(
          color: isRequired ? Colors.red.shade700 : null,
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
      
      // 准备教师数据，过滤空值
      final teacherData = <String, dynamic>{};
      
      // 基本信息
      if (_nameController.text.trim().isNotEmpty) {
        teacherData['name'] = _nameController.text.trim();
      }
      if (_emailController.text.trim().isNotEmpty) {
        teacherData['email'] = _emailController.text.trim();
      }
      if (_phoneController.text.trim().isNotEmpty) {
        teacherData['phone'] = _phoneController.text.trim();
      }
      if (_nricController.text.trim().isNotEmpty) {
        teacherData['nric'] = _nricController.text.trim();
      }
      if (_addressController.text.trim().isNotEmpty) {
        teacherData['address'] = _addressController.text.trim();
      }
      
      // 数字字段
      if (_epfNoController.text.trim().isNotEmpty) {
        teacherData['epfNo'] = int.tryParse(_epfNoController.text) ?? 0;
      }
      if (_socsoNoController.text.trim().isNotEmpty) {
        teacherData['socsoNo'] = int.tryParse(_socsoNoController.text) ?? 0;
      }
      if (_bankAccountNoController.text.trim().isNotEmpty) {
        teacherData['bankAccountNo'] = int.tryParse(_bankAccountNoController.text) ?? 0;
      }
      if (_idNumberController.text.trim().isNotEmpty) {
        teacherData['idNumber'] = int.tryParse(_idNumberController.text) ?? 0;
      }
      if (_childrenCountController.text.trim().isNotEmpty) {
        teacherData['childrenCount'] = int.tryParse(_childrenCountController.text) ?? 0;
      }
      
      // 选择字段
      if (_selectedBank.isNotEmpty) {
        teacherData['bankName'] = _selectedBank;
      }
      if (_bankAccountNameController.text.trim().isNotEmpty) {
        teacherData['bankAccountName'] = _bankAccountNameController.text.trim();
      }
      if (_selectedDepartment.isNotEmpty) {
        teacherData['department'] = _selectedDepartment;
      }
      if (_selectedPosition.isNotEmpty) {
        teacherData['position'] = _selectedPosition;
      }
      if (_nfcCardNumberController.text.trim().isNotEmpty) {
        teacherData['cardNumber'] = _nfcCardNumberController.text.trim();
      }
      if (_teacherUrlController.text.trim().isNotEmpty) {
        teacherData['teacher_url'] = _teacherUrlController.text.trim();
      }
      // 分配的班级
      if (_selectedClasses.isNotEmpty) {
        teacherData['assigned_classes'] = _selectedClasses.join(',');
      }
      
      // 状态和权限
      teacherData['status'] = _selectedStatus;
      teacherData['maritalStatus'] = _selectedMaritalStatus;
      teacherData['permissions'] = _selectedPermissions;
      teacherData['role'] = _selectedRole;
      
      // 分行分配 - 需要找到对应的 center ID
      if (_selectedCenterAssignment.isNotEmpty) {
        try {
          final pocketBaseService = Provider.of<PocketBaseService>(context, listen: false);
          final centers = await pocketBaseService.getCenters();
          final matchingCenter = centers.firstWhere(
            (center) => center.getStringValue('code') == _selectedCenterAssignment ||
                       center.getStringValue('name') == _selectedCenterAssignment,
            orElse: () => throw Exception('未找到匹配的分行'),
          );
          teacherData['center_assignment'] = matchingCenter.id;
        } catch (e) {
          // 如果找不到匹配的分行，不设置 center_assignment 字段
        }
      }
      
      // 日期字段
      if (_hireDate != null) {
        teacherData['hireDate'] = _hireDate!.toIso8601String();
      }
      if (_nfcCardIssuedDate != null) {
        teacherData['nfc_card_issued_date'] = _nfcCardIssuedDate!.toIso8601String();
      }
      if (_nfcCardExpiryDate != null) {
        teacherData['nfc_card_expiry_date'] = _nfcCardExpiryDate!.toIso8601String();
      }

      bool success;
      if (widget.teacherData != null) {
        // 添加调试信息
        
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
      } else if (!success && mounted) {
        // 如果更新失败，提供刷新选项
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('更新失败，可能是数据不同步'),
            backgroundColor: const Color(0xFFEF4444),
            action: SnackBarAction(
              label: '刷新数据',
              textColor: Colors.white,
              onPressed: () async {
                final teacherProvider = Provider.of<TeacherProvider>(context, listen: false);
                await teacherProvider.forceRefreshTeachers();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('数据已刷新，请重试'),
                    backgroundColor: Color(0xFF10B981),
                  ),
                );
              },
            ),
          ),
        );
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

  Widget _buildPermissionCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.security, color: Colors.purple[600], size: 20),
                const SizedBox(width: 8),
                Text(
                  '权限管理',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.purple[600],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // 用户角色
            DropdownButtonFormField<String>(
              value: _roles.contains(_selectedRole) ? _selectedRole : null,
              decoration: InputDecoration(
                labelText: '用户角色 *',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
              items: _roles.map((role) {
                return DropdownMenuItem(
                  value: role,
                  child: Text(role == 'admin' ? '管理员' : 
                             role == 'teacher' ? '老师' : 
                             role == 'parent' ? '家长' : '会计'),
                );
              }).toList(),
              onChanged: (value) => setState(() => _selectedRole = value!),
            ),
            const SizedBox(height: 16),
            // 分配的中心
            DropdownButtonFormField<String>(
              value: _centers.contains(_selectedCenterAssignment) ? _selectedCenterAssignment : null,
              decoration: InputDecoration(
                labelText: '分配的中心',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
              items: _centers.map((center) {
                return DropdownMenuItem(
                  value: center,
                  child: Text(center),
                );
              }).toList(),
              onChanged: (value) => setState(() => _selectedCenterAssignment = value ?? ''),
            ),
            const SizedBox(height: 16),
            // 分配的班级
            _buildClassSelectionField(),
          ],
        ),
      ),
    );
  }

  Widget _buildClassSelectionField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '分配的班级',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey[300]!),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              // 显示已选中的班级
              ..._selectedClasses.map((className) => Chip(
                label: Text(className),
                deleteIcon: const Icon(Icons.close, size: 18),
                onDeleted: () {
                  setState(() {
                    _selectedClasses.remove(className);
                    _updateAssignedClassesText();
                  });
                },
                backgroundColor: const Color(0xFF3B82F6).withOpacity(0.1),
                labelStyle: const TextStyle(color: Color(0xFF3B82F6)),
              )),
              // 添加班级按钮
              InkWell(
                onTap: _showClassSelectionDialog,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey[400]!, style: BorderStyle.solid),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.add, size: 18, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Text(
                        '添加班级',
                        style: TextStyle(color: Colors.grey[600], fontSize: 14),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        if (_selectedClasses.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              '请选择要分配的班级',
              style: TextStyle(color: Colors.grey[500], fontSize: 12),
            ),
          ),
      ],
    );
  }

  void _updateAssignedClassesText() {
    _assignedClassesController.text = _selectedClasses.join(',');
  }

  void _showClassSelectionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('选择班级'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: _availableClasses.length,
            itemBuilder: (context, index) {
              final className = _availableClasses[index];
              final isSelected = _selectedClasses.contains(className);
              
              return CheckboxListTile(
                title: Text(className),
                value: isSelected,
                onChanged: (bool? value) {
                  setState(() {
                    if (value == true) {
                      _selectedClasses.add(className);
                    } else {
                      _selectedClasses.remove(className);
                    }
                    _updateAssignedClassesText();
                  });
                },
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('完成'),
          ),
        ],
      ),
    );
  }

  /// 扫描NFC卡
  Future<void> _scanNfcCard() async {
    try {
      // 检查NFC可用性
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability != NFCAvailability.available) {
        _showMessage('NFC功能不可用，请检查设备设置', isError: true);
        return;
      }

      // 显示扫描提示
      _showMessage('请将NFC卡靠近设备...', isError: false);

      // 开始NFC扫描
      final tag = await FlutterNfcKit.poll(
        timeout: const Duration(seconds: 10),
        iosMultipleTagMessage: '检测到多个标签，请只使用一个标签',
        iosAlertMessage: '请将NFC标签靠近设备',
      );

      // 读取NFC标签ID并转换为标准格式
      String? nfcData;
      try {
        String rawId = tag.id;
        if (rawId.isNotEmpty) {
          // 转换为标准10位十进制格式
          nfcData = NFCSafeScannerService.convertToStandardFormat(rawId);
        }
      } catch (e) {
      }

      await FlutterNfcKit.finish();

      if (nfcData != null && nfcData.isNotEmpty) {
        // 将扫描到的NFC ID填入表单
        setState(() {
          _nfcCardNumberController.text = nfcData!;
        });
        _showMessage('NFC卡扫描成功: $nfcData', isError: false);
      } else {
        _showMessage('NFC卡中没有找到有效数据', isError: true);
      }
    } catch (e) {
      String errorMessage = '扫描失败';
      if (e.toString().contains('timeout')) {
        errorMessage = '扫描超时，请重新尝试';
      } else if (e.toString().contains('cancelled')) {
        errorMessage = '扫描已取消';
      } else if (e.toString().contains('not available')) {
        errorMessage = 'NFC功能不可用';
      } else {
        errorMessage = '扫描失败: ${e.toString()}';
      }
      _showMessage(errorMessage, isError: true);
    }
  }

  /// 显示消息
  void _showMessage(String message, {required bool isError}) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: isError ? const Color(0xFFEF4444) : const Color(0xFF10B981),
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }
}
