import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../theme/app_theme.dart';
import '../../services/pocketbase_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/teacher_provider.dart';
import '../../services/unified_field_mapper.dart';

class NfcManagementScreen extends StatefulWidget {
  final int? initialTab;
  
  const NfcManagementScreen({super.key, this.initialTab});

  @override
  State<NfcManagementScreen> createState() => _NfcManagementScreenState();
}

class _NfcManagementScreenState extends State<NfcManagementScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  bool _isNfcAvailable = false;
  String _nfcStatus = '检查NFC状态...';
  
  // 统一的NFC扫描相关
  String? _scannedNfcId;
  String? _selectedUser;
  String _userType = 'student'; // 'student' 或 'teacher'
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  
  // 检查遗漏卡相关
  String? _scannedCardId;
  String _cardOwnerInfo = '';
  bool _isCheckingCard = false;
  
  // 补办申请管理相关
  List<RecordModel> _replacementRequests = [];
  bool _isLoadingRequests = false;
  String _selectedRequestFilter = 'pending'; // 'pending', 'approved', 'rejected', 'all'
  
  // 当前操作模式
  String _currentMode = 'replacement'; // 'replacement', 'assignment', 'check', 'management'
  
  // 补办申请表单相关
  String? _selectedCenter;
  String? _selectedStudentId;
  String? _selectedReason;
  String? _selectedUrgency;
  String? _lostLocation;
  String? _notes;
  DateTime? _lostDate;
  
  // 动画控制器
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  
  final PocketBaseService _pocketBaseService = PocketBaseService.instance;

  @override
  void initState() {
    super.initState();
    // 根据用户角色决定标签页数量
    final isAdmin = context.read<AuthProvider>().isAdmin;
    _tabController = TabController(length: isAdmin ? 3 : 1, vsync: this);
    
    // 如果有指定的初始标签页，设置到该标签页
    if (widget.initialTab != null && widget.initialTab! < _tabController.length) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _tabController.animateTo(widget.initialTab!);
      });
    }
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(
      begin: 0.8,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    _pulseController.repeat(reverse: true);
    
    _checkNfcStatus();
    _checkAuthStatus();
    _loadReplacementRequests();
    // 加载学生和教师数据
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<StudentProvider>(context, listen: false).loadStudents();
      Provider.of<TeacherProvider>(context, listen: false).loadTeachers();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _pulseController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _checkNfcStatus() async {
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      setState(() {
        _isNfcAvailable = availability == NFCAvailability.available;
        _nfcStatus = _isNfcAvailable ? 'NFC功能正常' : 'NFC功能不可用';
      });
    } catch (e) {
      setState(() {
        _isNfcAvailable = false;
        _nfcStatus = 'NFC检查失败: $e';
      });
    }
  }
  
  // 检查认证状态
  Future<void> _checkAuthStatus() async {
    try {
      final authProvider = context.read<AuthProvider>();
      final isAuthenticated = await authProvider.checkAuthStatusWithReauth();
      
      if (!isAuthenticated) {
        // 可以在这里显示一个提示或自动跳转到登录页面
      } else {
      }
    } catch (e) {
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenHeight < 700 || screenWidth < 360;
    
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        children: [
          _buildEnterpriseHeader(isSmallScreen),
          _buildNfcStatusCard(isSmallScreen),
          _buildTabBar(isSmallScreen),
          Expanded(
            child: Consumer<AuthProvider>(
              builder: (context, authProvider, child) {
                if (authProvider.isAdmin) {
                  // 管理员可以看到所有功能
                  return TabBarView(
              controller: _tabController,
              children: [
                      _buildNfcOperationsTab(isSmallScreen),
                      _buildCardCheckTab(isSmallScreen),
                      _buildReplacementManagementTab(isSmallScreen),
                    ],
                  );
                } else {
                  // 教师只能看到补办申请管理
                  return _buildTeacherReplacementForm(isSmallScreen);
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnterpriseHeader(bool isSmallScreen) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        isSmallScreen ? 16 : 20,
        MediaQuery.of(context).padding.top + (isSmallScreen ? 16 : 20),
        isSmallScreen ? 16 : 20,
        isSmallScreen ? 16 : 20,
      ),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1E293B), Color(0xFF334155)],
        ),
      ),
      child: Row(
          children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.nfc,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                  'NFC管理系统',
                        style: TextStyle(
                          fontSize: isSmallScreen ? 20 : 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                  '智能NFC卡管理平台',
                        style: TextStyle(
                          fontSize: isSmallScreen ? 12 : 14,
                    color: Colors.white.withOpacity(0.8),
                        ),
                      ),
                    ],
                  ),
                ),
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.close, color: Colors.white),
          ),
        ],
      ),
    );
  }

  Widget _buildNfcStatusCard(bool isSmallScreen) {
    return Container(
      margin: EdgeInsets.all(isSmallScreen ? 16 : 20),
      padding: EdgeInsets.all(isSmallScreen ? 16 : 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _pulseAnimation.value,
                child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
                    color: _isNfcAvailable 
                        ? const Color(0xFF10B981).withOpacity(0.1)
                        : const Color(0xFFEF4444).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
                    _isNfcAvailable ? Icons.nfc : Icons.nfc_outlined,
                    color: _isNfcAvailable 
                        ? const Color(0xFF10B981)
                        : const Color(0xFFEF4444),
              size: isSmallScreen ? 20 : 24,
            ),
                ),
              );
            },
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'NFC状态',
                  style: TextStyle(
                    fontSize: isSmallScreen ? 14 : 16,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _nfcStatus,
                  style: TextStyle(
                    fontSize: isSmallScreen ? 12 : 14,
                    color: _isNfcAvailable 
                        ? const Color(0xFF10B981)
                        : const Color(0xFFEF4444),
                  ),
                ),
              ],
            ),
            ),
        ],
      ),
    );
  }

  Widget _buildTabBar(bool isSmallScreen) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: isSmallScreen ? 16 : 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
          child: authProvider.isAdmin ? TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: const LinearGradient(
            colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
          ),
        ),
        labelColor: Colors.white,
        unselectedLabelColor: const Color(0xFF6B7280),
        labelStyle: TextStyle(
          fontSize: isSmallScreen ? 14 : 16,
          fontWeight: FontWeight.w600,
        ),
        tabs: const [
          Tab(
                icon: Icon(Icons.nfc),
                text: 'NFC操作',
          ),
          Tab(
                icon: Icon(Icons.search),
                text: '检查遗漏卡',
          ),
              Tab(
                icon: Icon(Icons.assignment),
                text: '补办申请管理',
      ),
            ],
          ) : const SizedBox.shrink(), // 教师不显示标签栏
        );
      },
    );
  }

  Widget _buildNfcOperationsTab(bool isSmallScreen) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isSmallScreen ? 16 : 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('NFC操作中心', '补办和分配NFC卡', isSmallScreen),
          const SizedBox(height: 20),
          _buildOperationModeSelector(isSmallScreen),
            const SizedBox(height: 20),
          _buildUserSelectionCard(isSmallScreen),
            const SizedBox(height: 20),
          if (_selectedUser != null) ...[
            _buildNfcScanCard(isSmallScreen),
            const SizedBox(height: 20),
            _buildActionButton(isSmallScreen),
          ] else ...[
            Container(
              padding: EdgeInsets.all(isSmallScreen ? 16 : 20),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.info_outline,
                    color: Color(0xFFF59E0B),
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '请先选择要分配NFC卡的用户',
                      style: TextStyle(
                        color: const Color(0xFF92400E),
                        fontSize: isSmallScreen ? 14 : 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCardCheckTab(bool isSmallScreen) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isSmallScreen ? 16 : 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('检查遗漏卡', '扫描NFC卡查看归属信息', isSmallScreen),
          const SizedBox(height: 20),
          _buildNfcScanCard(isSmallScreen),
          const SizedBox(height: 20),
          if (_cardOwnerInfo.isNotEmpty) _buildCardOwnerInfo(isSmallScreen),
        ],
      ),
    );
  }

  Widget _buildReplacementManagementTab(bool isSmallScreen) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isSmallScreen ? 16 : 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('补办申请管理', '查看和处理教师提交的NFC卡补办申请', isSmallScreen),
          const SizedBox(height: 20),
          _buildRequestFilterTabs(isSmallScreen),
          const SizedBox(height: 20),
          _buildRequestList(isSmallScreen),
        ],
      ),
    );
  }

  Widget _buildTeacherReplacementForm(bool isSmallScreen) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isSmallScreen ? 16 : 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('NFC卡补办申请', '为学生申请补办丢失的NFC卡', isSmallScreen),
          const SizedBox(height: 20),
          Container(
      padding: EdgeInsets.all(isSmallScreen ? 16 : 20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '补办申请表单',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  '请填写以下信息为学生申请补办NFC卡：',
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF64748B),
                  ),
                ),
          const SizedBox(height: 20),
                _buildFormField(
                  '选择分行',
                  '请选择学生所在的分行',
                  DropdownButtonFormField<String>(
                    value: _selectedCenter,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFF3B82F6)),
                      ),
                    ),
                    items: ['WX 01', 'WX 02', 'WX 03', 'WX 04'].map((center) {
                      return DropdownMenuItem<String>(
                        value: center,
                        child: Text(center),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedCenter = value;
                        _selectedStudentId = null; // 重置学生选择
                      });
                    },
                  ),
            isSmallScreen,
          ),
          const SizedBox(height: 20),
                _buildFormField(
                  '选择学生',
                  '请选择需要补办NFC卡的学生',
                  Consumer<StudentProvider>(
                    builder: (context, studentProvider, child) {
                      // 根据选择的分行过滤学生
                      final filteredStudents = _selectedCenter != null
                          ? studentProvider.students.where((student) {
                              return student.getStringValue('center') == _selectedCenter;
                            }).toList()
                          : <RecordModel>[];
                      
                      return DropdownButtonFormField<String>(
                        value: _selectedStudentId,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          enabledBorder: OutlineInputBorder(
                            borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderSide: BorderSide(color: Color(0xFF3B82F6)),
                          ),
                        ),
                        items: filteredStudents.map((student) {
                          return DropdownMenuItem<String>(
                            value: student.id,
                            child: Text(student.getStringValue('student_name') ?? '未知学生'),
                          );
                        }).toList(),
                        onChanged: _selectedCenter != null ? (value) {
                          setState(() {
                            _selectedStudentId = value;
                          });
                        } : null,
                      );
                    },
                  ),
            isSmallScreen,
          ),
                const SizedBox(height: 20),
                _buildFormField(
                  '丢失原因',
                  '请说明NFC卡丢失的原因',
                  DropdownButtonFormField<String>(
                    value: _selectedReason,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFF3B82F6)),
                      ),
                    ),
                    items: ['丢失', '损坏', '被盗', '其他'].map((reason) {
                      return DropdownMenuItem<String>(
                        value: reason,
                        child: Text(reason),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedReason = value;
                      });
                    },
                  ),
                  isSmallScreen,
                ),
                const SizedBox(height: 20),
                _buildFormField(
                  '丢失日期',
                  '请选择NFC卡丢失的日期',
                  InkWell(
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now(),
                      );
                      if (date != null) {
                        setState(() {
                          _lostDate = date;
                        });
                      }
                    },
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today, size: 20, color: Color(0xFF64748B)),
                          const SizedBox(width: 8),
                          Text(
                            _lostDate != null 
                                ? '${_lostDate!.year}-${_lostDate!.month.toString().padLeft(2, '0')}-${_lostDate!.day.toString().padLeft(2, '0')}'
                                : '选择丢失日期',
                            style: TextStyle(
                              color: _lostDate != null ? const Color(0xFF1E293B) : const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  isSmallScreen,
                ),
                const SizedBox(height: 20),
                _buildFormField(
                  '丢失地点',
                  '请说明NFC卡丢失的地点',
                  TextField(
                    onChanged: (value) {
                      setState(() {
                        _lostLocation = value;
                      });
                    },
                    decoration: const InputDecoration(
                      hintText: '请输入丢失地点',
                      border: OutlineInputBorder(),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFF3B82F6)),
                      ),
                    ),
                  ),
                  isSmallScreen,
                ),
                const SizedBox(height: 20),
                _buildFormField(
                  '紧急程度',
                  '请选择补办的紧急程度',
                  DropdownButtonFormField<String>(
                    value: _selectedUrgency,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFF3B82F6)),
                      ),
                    ),
                    items: [
                      {'value': 'low', 'label': '低'},
                      {'value': 'normal', 'label': '普通'},
                      {'value': 'high', 'label': '高'},
                      {'value': 'urgent', 'label': '紧急'},
                    ].map((option) {
                      return DropdownMenuItem<String>(
                        value: option['value'],
                        child: Text(option['label']!),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedUrgency = value;
                      });
                    },
                  ),
                  isSmallScreen,
                ),
                const SizedBox(height: 20),
                _buildFormField(
                  '备注信息',
                  '可选的额外说明信息',
                  TextField(
                    maxLines: 3,
                    onChanged: (value) {
                      setState(() {
                        _notes = value;
                      });
                    },
                    decoration: const InputDecoration(
                      hintText: '请输入备注信息（可选）',
                      border: OutlineInputBorder(),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFF3B82F6)),
                      ),
                    ),
                  ),
                  isSmallScreen,
                ),
                const SizedBox(height: 30),
                Container(
                  width: double.infinity,
                  height: isSmallScreen ? 48 : 56,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
                      colors: [Color(0xFF10B981), Color(0xFF059669)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF10B981).withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: ElevatedButton(
                    onPressed: _canSubmitForm() ? _submitReplacementRequest : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _canSubmitForm() ? Colors.transparent : Colors.grey.withOpacity(0.3),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shadowColor: Colors.transparent,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.send_rounded, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          '提交补办申请',
                          style: TextStyle(
                            fontSize: isSmallScreen ? 14 : 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormField(String title, String subtitle, Widget child, bool isSmallScreen) {
    return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
            fontSize: isSmallScreen ? 14 : 16,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: TextStyle(
            fontSize: isSmallScreen ? 12 : 14,
            color: const Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }

  Widget _buildSectionTitle(String title, String subtitle, bool isSmallScreen) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: isSmallScreen ? 20 : 24,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: isSmallScreen ? 14 : 16,
              color: const Color(0xFF64748B),
            ),
          ),
        ],
    );
  }

  Widget _buildOperationModeSelector(bool isSmallScreen) {
    return Container(
      padding: EdgeInsets.all(isSmallScreen ? 16 : 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '选择操作类型',
            style: TextStyle(
              fontSize: isSmallScreen ? 16 : 18,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildModeSelector(
                  'replacement',
                  '补办NFC卡',
                  Icons.refresh,
                  const Color(0xFFEF4444),
                  isSmallScreen,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildModeSelector(
                  'assignment',
                  '分配新卡',
                  Icons.add_card,
                  const Color(0xFF10B981),
                  isSmallScreen,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildModeSelector(
    String mode,
    String label,
    IconData icon,
    Color color,
    bool isSmallScreen,
  ) {
    final isSelected = _currentMode == mode;
    return GestureDetector(
      onTap: () {
        setState(() {
          _currentMode = mode;
          _scannedNfcId = null;
          _selectedUser = null;
          _searchQuery = '';
          _searchController.clear();
        });
      },
      child: Container(
        padding: EdgeInsets.all(isSmallScreen ? 16 : 20),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.1) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? color : const Color(0xFFE2E8F0),
            width: 2,
          ),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSelected ? color : const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: isSelected ? Colors.white : const Color(0xFF64748B),
                size: isSmallScreen ? 24 : 28,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: TextStyle(
                fontSize: isSmallScreen ? 14 : 16,
                fontWeight: FontWeight.w600,
                color: isSelected ? color : const Color(0xFF64748B),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNfcScanCard(bool isSmallScreen) {
    return Container(
      padding: EdgeInsets.all(isSmallScreen ? 16 : 20),
      decoration: BoxDecoration(
        color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
                  ),
                ],
              ),
                  child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.nfc,
                  color: Color(0xFF3B82F6),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _getScanTitle(),
                        style: TextStyle(
                    fontSize: isSmallScreen ? 16 : 18,
                          fontWeight: FontWeight.w600,
                    color: const Color(0xFF1E293B),
                  ),
                        ),
                      ),
                    ],
                  ),
          const SizedBox(height: 16),
          if (_scannedNfcId != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: const Color(0xFF10B981).withOpacity(0.3),
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.check_circle,
                    color: Color(0xFF10B981),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '已扫描NFC卡: $_scannedNfcId',
                      style: const TextStyle(
                            color: Color(0xFF10B981),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _scannedNfcId = null;
                      });
                    },
                    child: const Icon(
                      Icons.close,
                      color: Color(0xFF10B981),
                      size: 16,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
          SizedBox(
            width: double.infinity,
            height: isSmallScreen ? 48 : 56,
            child: ElevatedButton.icon(
              onPressed: _isNfcAvailable ? _scanNfcCard : null,
              icon: const Icon(Icons.nfc),
              label: Text(_scannedNfcId != null ? '重新扫描' : '扫描NFC卡'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3B82F6),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserSelectionCard(bool isSmallScreen) {
    return Container(
      padding: EdgeInsets.all(isSmallScreen ? 16 : 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.person_search,
                  color: Color(0xFF10B981),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '选择用户',
            style: TextStyle(
              fontSize: isSmallScreen ? 16 : 18,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E293B),
            ),
          ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildUserTypeSelector('student', '学生', isSmallScreen),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildUserTypeSelector('teacher', '教师', isSmallScreen),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _searchController,
            onChanged: _onSearchChanged,
            decoration: InputDecoration(
              hintText: '搜索用户...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFF3B82F6)),
              ),
            ),
          ),
          const SizedBox(height: 16),
          _buildUserList(isSmallScreen),
        ],
      ),
    );
  }

  Widget _buildUserTypeSelector(String type, String label, bool isSmallScreen) {
    final isSelected = _userType == type;
    return GestureDetector(
      onTap: () => _onUserTypeChanged(type),
      child: Container(
        padding: EdgeInsets.symmetric(
          vertical: isSmallScreen ? 12 : 16,
          horizontal: isSmallScreen ? 16 : 20,
        ),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF3B82F6) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFFE2E8F0),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: isSmallScreen ? 14 : 16,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }

  Widget _buildUserList(bool isSmallScreen) {
    if (_userType == 'student') {
      return Consumer<StudentProvider>(
        builder: (context, studentProvider, child) {
          if (studentProvider.isLoading) {
            return Container(
              height: 200,
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            );
          }

          // 根据搜索条件过滤学生
          List<RecordModel> filteredStudents = studentProvider.students;
          if (_searchQuery.isNotEmpty) {
            filteredStudents = studentProvider.students.where((student) {
            final name = student.getStringValue('student_name') ?? '';
              final id = student.getStringValue('student_id') ?? '';
              return name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                     id.toLowerCase().contains(_searchQuery.toLowerCase());
          }).toList();
          }
          
          if (filteredStudents.isEmpty) {
          return Container(
              height: 200,
            decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
              child: Center(
                    child: Text(
                  _searchQuery.isEmpty ? '暂无学生数据' : '未找到匹配的学生',
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 14,
                  ),
                ),
              ),
            );
          }

          return Container(
            height: 200,
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: ListView.builder(
              padding: const EdgeInsets.all(8),
              itemCount: filteredStudents.length,
              itemBuilder: (context, index) {
                final student = filteredStudents[index];
                final isSelected = _selectedUser == student.id;
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedUser = student.id;
                    });
                  },
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF3B82F6).withOpacity(0.1) : Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: const Color(0xFF3B82F6).withOpacity(0.1),
                          child: Text(
                            (student.getStringValue('student_name') ?? 'S')[0].toUpperCase(),
                            style: const TextStyle(
                              color: Color(0xFF3B82F6),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                student.getStringValue('student_name') ?? '未知学生',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              Text(
                                'ID: ${student.getStringValue('student_id') ?? 'N/A'}',
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (isSelected)
                          const Icon(
                            Icons.check_circle,
                            color: Color(0xFF3B82F6),
                            size: 20,
                          ),
                      ],
                    ),
                  ),
                      );
                    },
                  ),
          );
        },
      );
    } else {
      return Consumer<TeacherProvider>(
        builder: (context, teacherProvider, child) {
          if (teacherProvider.isLoading) {
            return Container(
              height: 200,
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            );
          }

          // 根据搜索条件过滤教师
          List<RecordModel> filteredTeachers = teacherProvider.teachers;
          if (_searchQuery.isNotEmpty) {
            filteredTeachers = teacherProvider.teachers.where((teacher) {
            final name = teacher.getStringValue('name') ?? '';
              final id = teacher.getStringValue('teacher_id') ?? '';
              return name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                     id.toLowerCase().contains(_searchQuery.toLowerCase());
          }).toList();
          }
          
          if (filteredTeachers.isEmpty) {
          return Container(
              height: 200,
            decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
              child: Center(
                    child: Text(
                  _searchQuery.isEmpty ? '暂无教师数据' : '未找到匹配的教师',
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 14,
                  ),
                ),
              ),
            );
          }

          return Container(
            height: 200,
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: ListView.builder(
              padding: const EdgeInsets.all(8),
              itemCount: filteredTeachers.length,
              itemBuilder: (context, index) {
                final teacher = filteredTeachers[index];
                final isSelected = _selectedUser == teacher.id;
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedUser = teacher.id;
                    });
                  },
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF8B5CF6).withOpacity(0.1) : Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelected ? const Color(0xFF8B5CF6) : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: const Color(0xFF8B5CF6).withOpacity(0.1),
                          child: Text(
                            (teacher.getStringValue('name') ?? 'T')[0].toUpperCase(),
                            style: const TextStyle(
                              color: Color(0xFF8B5CF6),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                teacher.getStringValue('name') ?? '未知教师',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              Text(
                                'ID: ${teacher.getStringValue('teacher_id') ?? 'N/A'}',
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (isSelected)
                          const Icon(
                            Icons.check_circle,
                            color: Color(0xFF8B5CF6),
                            size: 20,
                          ),
                      ],
                    ),
                  ),
                      );
                    },
                  ),
          );
        },
      );
    }
  }

  Widget _buildActionButton(bool isSmallScreen) {
    return Container(
      width: double.infinity,
      height: isSmallScreen ? 48 : 56,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: _currentMode == 'replacement'
              ? [const Color(0xFFEF4444), const Color(0xFFDC2626)]
              : [const Color(0xFF10B981), const Color(0xFF059669)],
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
                BoxShadow(
            color: (_currentMode == 'replacement'
                    ? const Color(0xFFEF4444)
                    : const Color(0xFF10B981))
                .withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
        ],
      ),
      child: ElevatedButton(
        onPressed: _performOperation,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.white,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(_currentMode == 'replacement' ? Icons.refresh : Icons.add_card),
            const SizedBox(width: 8),
            Text(
              _currentMode == 'replacement' ? '执行补办' : '执行分配',
                          style: TextStyle(
                fontSize: isSmallScreen ? 14 : 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCardOwnerInfo(bool isSmallScreen) {
    return Container(
      padding: EdgeInsets.all(isSmallScreen ? 16 : 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.info,
                  color: Color(0xFF10B981),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '卡片归属信息',
          style: TextStyle(
            fontSize: isSmallScreen ? 16 : 18,
            fontWeight: FontWeight.w600,
                    color: const Color(0xFF1E293B),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_isCheckingCard) ...[
            const Center(
              child: CircularProgressIndicator(),
            ),
            const SizedBox(height: 16),
            const Center(
              child: Text(
                '正在查找卡片拥有者...',
                style: TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 14,
                ),
              ),
            ),
          ] else if (_cardOwnerInfo.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Text(
                _cardOwnerInfo,
                style: TextStyle(
                  fontSize: isSmallScreen ? 14 : 16,
                  color: const Color(0xFF64748B),
                  height: 1.5,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      setState(() {
                        _scannedNfcId = null;
                        _cardOwnerInfo = '';
                        _scannedCardId = null;
                      });
                    },
                    icon: const Icon(Icons.refresh, size: 16),
                    label: const Text('重新扫描'),
        style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3B82F6),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRequestFilterTabs(bool isSmallScreen) {
    return Container(
      padding: EdgeInsets.all(isSmallScreen ? 12 : 16),
      decoration: BoxDecoration(
        color: Colors.white,
            borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildFilterTab('待处理', 'pending', isSmallScreen),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildFilterTab('已批准', 'approved', isSmallScreen),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildFilterTab('已拒绝', 'rejected', isSmallScreen),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildFilterTab('全部', 'all', isSmallScreen),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTab(String label, String value, bool isSmallScreen) {
    final isSelected = _selectedRequestFilter == value;
    return GestureDetector(
                        onTap: () {
    setState(() {
          _selectedRequestFilter = value;
        });
        _loadReplacementRequests();
      },
      child: Container(
        padding: EdgeInsets.symmetric(
          vertical: isSmallScreen ? 8 : 12,
          horizontal: isSmallScreen ? 8 : 12,
        ),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF3B82F6) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: isSmallScreen ? 12 : 14,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }

  Widget _buildRequestList(bool isSmallScreen) {
    if (_isLoadingRequests) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_replacementRequests.isEmpty) {
    return Container(
        padding: EdgeInsets.all(isSmallScreen ? 20 : 40),
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Center(
          child: Column(
            children: [
              Icon(
                Icons.inbox,
                size: 48,
                color: Color(0xFF94A3B8),
              ),
              SizedBox(height: 16),
              Text(
                '暂无补办申请',
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

    return Column(
      children: _replacementRequests.map((request) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: EdgeInsets.all(isSmallScreen ? 16 : 20),
          decoration: BoxDecoration(
            color: Colors.white,
        borderRadius: BorderRadius.circular(16),
            boxShadow: [
                BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      request.getStringValue('student_name') ?? '未知学生',
          style: TextStyle(
            fontSize: isSmallScreen ? 16 : 18,
            fontWeight: FontWeight.w600,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                  ),
                  _buildStatusChip(request.getStringValue('status') ?? 'pending'),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '申请时间: ${request.created}',
                style: TextStyle(
                  fontSize: isSmallScreen ? 12 : 14,
                  color: const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '丢失原因: ${request.getStringValue('reason') ?? '未知'}',
                style: TextStyle(
                  fontSize: isSmallScreen ? 12 : 14,
                  color: const Color(0xFF64748B),
                ),
              ),
              if (request.getStringValue('status') == 'pending') ...[
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _approveRequest(request.id),
        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text('批准'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _rejectRequest(request.id),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFEF4444),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text('拒绝'),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    String label;
    
    switch (status) {
      case 'pending':
        color = const Color(0xFFF59E0B);
        label = '待处理';
        break;
      case 'approved':
        color = const Color(0xFF10B981);
        label = '已批准';
        break;
      case 'rejected':
        color = const Color(0xFFEF4444);
        label = '已拒绝';
        break;
      default:
        color = const Color(0xFF6B7280);
        label = '未知';
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  String _getScanTitle() {
    // 检查当前是否在检查遗漏卡标签页
    if (_tabController.index == 1) {
      return '扫描NFC卡检查归属';
    }
    
    switch (_currentMode) {
      case 'replacement':
        return '扫描旧NFC卡';
      case 'assignment':
        return '扫描新NFC卡';
      default:
        return '扫描NFC卡';
    }
  }

  void _onUserTypeChanged(String type) {
    setState(() {
      _userType = type;
      _selectedUser = null;
      _searchQuery = '';
      _searchController.clear();
    });
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
    });
  }

  Future<void> _scanNfcCard() async {
    try {
      // 检查NFC可用性
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability != NFCAvailability.available) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('NFC功能不可用，请检查设备设置'),
            backgroundColor: Color(0xFFEF4444),
          ),
        );
        return;
      }

      final tag = await FlutterNfcKit.poll(
        timeout: const Duration(seconds: 10),
        iosMultipleTagMessage: '检测到多个标签，请只使用一个标签',
        iosAlertMessage: '请将NFC标签靠近设备',
      );
      
      final scannedId = tag.id;
      
      if (scannedId.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('NFC卡中没有找到有效数据'),
            backgroundColor: Color(0xFFEF4444),
          ),
        );
        return;
      }
      
      setState(() {
        _scannedNfcId = scannedId;
      });
      
      // 根据当前标签页判断操作模式
      if (_tabController.index == 1) {
        // 检查遗漏卡标签页
        await _findCardOwner(scannedId);
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
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    }
  }

  Future<void> _findCardOwner(String nfcId) async {
    if (nfcId.isEmpty) return;
    
    setState(() {
      _isCheckingCard = true;
      _cardOwnerInfo = '';
    });

    try {
      // 首先尝试查找学生
      final student = await _pocketBaseService.getStudentByNfcId(nfcId);
      if (student != null) {
        final studentName = student.getStringValue('student_name') ?? '未知学生';
        final studentId = student.getStringValue('student_id') ?? 'N/A';
        final center = student.getStringValue('center') ?? 'N/A';
        
        setState(() {
          _cardOwnerInfo = '✅ 找到学生信息\n\n学生姓名: $studentName\n学号: $studentId\n分行: $center\n\nNFC ID: $nfcId';
          _scannedCardId = nfcId;
        });
        return;
      }

      // 如果没找到学生，尝试查找教师
      final teacher = await _pocketBaseService.getTeacherByNfcId(nfcId);
      if (teacher != null) {
        final teacherName = teacher.getStringValue('name') ?? '未知教师';
        final teacherId = teacher.getStringValue('teacher_id') ?? 'N/A';
        
        setState(() {
          _cardOwnerInfo = '✅ 找到教师信息\n\n教师姓名: $teacherName\n工号: $teacherId\n\nNFC ID: $nfcId';
          _scannedCardId = nfcId;
        });
        return;
      }

      // 如果都没找到，显示友好的提示信息
      setState(() {
        _cardOwnerInfo = '❌ 未找到该NFC卡的拥有者信息\n\n可能的原因:\n• NFC卡未分配给任何用户\n• NFC ID格式不匹配\n• 数据库中没有相关记录\n\nNFC ID: $nfcId\n\n建议:\n• 检查NFC卡是否正确分配\n• 联系管理员进行卡片分配';
        _scannedCardId = nfcId;
      });

    } catch (e) {
      setState(() {
        _cardOwnerInfo = '❌ 查找卡片拥有者失败\n\n错误信息: $e\n\nNFC ID: $nfcId\n\n建议:\n• 检查网络连接\n• 重新尝试扫描\n• 联系技术支持';
        _scannedCardId = nfcId;
      });
    } finally {
      setState(() {
        _isCheckingCard = false;
      });
    }
  }

  Future<void> _performOperation() async {
    if (_scannedNfcId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('请先扫描NFC卡'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    if (_selectedUser == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('请先选择用户'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    try {
      // 实现具体的补办或分配逻辑
      String userName = '';
      
      if (_userType == 'student') {
        // 获取学生信息
        final studentProvider = context.read<StudentProvider>();
        final student = studentProvider.students.firstWhere(
          (s) => s.id == _selectedUser,
        );
        userName = student.getStringValue('student_name') ?? '未知学生';
        
        // 使用统一字段映射服务获取NFC关联数据
        final nfcData = UnifiedFieldMapper.getUnifiedNfcData(_scannedNfcId!, 'student');
        
        // 更新学生记录
        await _pocketBaseService.updateStudent(_selectedUser!, nfcData);
        
        // 刷新学生数据
        await studentProvider.loadStudents();
        
      } else {
        // 获取教师信息
        final teacherProvider = context.read<TeacherProvider>();
        final teacher = teacherProvider.teachers.firstWhere(
          (t) => t.id == _selectedUser,
        );
        userName = teacher.getStringValue('name') ?? '未知教师';
        
        // 使用统一字段映射服务获取NFC关联数据
        final nfcData = UnifiedFieldMapper.getUnifiedNfcData(_scannedNfcId!, 'teacher');
        
        // 更新教师记录
        await _pocketBaseService.updateTeacher(_selectedUser!, nfcData);
        
        // 刷新教师数据
        await teacherProvider.loadTeachers();
      }
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✅ ${_currentMode == 'replacement' ? '补办' : '分配'}成功: $userName'),
          backgroundColor: const Color(0xFF10B981),
        ),
      );
      
      // 操作成功后重置状态
      setState(() {
        _scannedNfcId = null;
        _selectedUser = null;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('操作失败: $e'),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    }
  }

  Future<void> _loadReplacementRequests() async {
    setState(() {
      _isLoadingRequests = true;
    });

    try {
      List<RecordModel> requests;
      if (_selectedRequestFilter == 'all') {
        requests = await _pocketBaseService.getAllNfcReplacementRequests();
      } else {
        requests = await _pocketBaseService.getPendingNfcReplacementRequests();
      }

      setState(() {
        _replacementRequests = requests;
        _isLoadingRequests = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingRequests = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('加载申请失败: $e'),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    }
  }

  Future<void> _approveRequest(String requestId) async {
    try {
      await _pocketBaseService.updateNfcReplacementStatus(
        requestId,
        'approved',
        notes: '管理员批准',
      );
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('申请已批准'),
          backgroundColor: Color(0xFF10B981),
        ),
      );
      
      _loadReplacementRequests();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('批准失败: $e'),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    }
  }

  Future<void> _rejectRequest(String requestId) async {
    try {
      await _pocketBaseService.updateNfcReplacementStatus(
        requestId,
        'rejected',
        notes: '管理员拒绝',
      );
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('申请已拒绝'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      
      _loadReplacementRequests();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('拒绝失败: $e'),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    }
  }

  // 检查表单是否可以提交
  bool _canSubmitForm() {
    // 检查所有必填字段
    final hasCenter = _selectedCenter != null;
    final hasStudent = _selectedStudentId != null;
    final hasReason = _selectedReason != null && _selectedReason!.isNotEmpty;
    final hasUrgency = _selectedUrgency != null && _selectedUrgency!.isNotEmpty;
    final hasLocation = _lostLocation != null && _lostLocation!.trim().isNotEmpty;
    
    // 打印调试信息
    
    return hasCenter && hasStudent && hasReason && hasUrgency && hasLocation;
  }

  // 提交补办申请
  Future<void> _submitReplacementRequest() async {
    if (!_canSubmitForm()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('请填写所有必填字段'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    try {
      // 检查PocketBase服务是否已初始化
      if (!_pocketBaseService.isInitialized) {
        throw Exception('服务未初始化，请重启应用');
      }

      // 检查用户认证状态（带自动重新认证）
      final isAuthenticated = await _pocketBaseService.isAuthenticatedWithReauth();
      if (!isAuthenticated) {
        throw Exception('用户未认证，请重新登录');
      }

      // 获取当前登录的教师信息
      final authProvider = context.read<AuthProvider>();
      final currentUser = authProvider.user;
      
      if (currentUser == null) {
        throw Exception('用户信息获取失败，请重新登录');
      }

      // 验证用户角色权限
      if (!authProvider.isTeacher && !authProvider.isAdmin) {
        throw Exception('权限不足，只有教师和管理员可以提交补办申请');
      }


      // 创建补办申请
      final result = await _pocketBaseService.createNfcReplacementRequest(
        studentId: _selectedStudentId!,
        reason: _selectedReason!,
        urgency: _selectedUrgency!,
        lostDate: (_lostDate ?? DateTime.now()).toIso8601String(),
        lostLocation: _lostLocation!,
        notes: _notes,
      );


      // 重置表单
      setState(() {
        _selectedCenter = null;
        _selectedStudentId = null;
        _selectedReason = null;
        _selectedUrgency = null;
        _lostLocation = null;
        _notes = null;
        _lostDate = null;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('补办申请提交成功！'),
          backgroundColor: Color(0xFF10B981),
        ),
      );
    } catch (e) {
      
      // 如果是认证相关错误，提供更友好的提示
      String errorMessage = e.toString();
      if (errorMessage.contains('用户未认证') || errorMessage.contains('认证')) {
        errorMessage = '登录状态已过期，请重新登录';
      }
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('提交失败: $errorMessage'),
          backgroundColor: const Color(0xFFEF4444),
          action: SnackBarAction(
            label: '重新登录',
            textColor: Colors.white,
            onPressed: () {
              // 导航到登录页面
              Navigator.pushNamedAndRemoveUntil(
                context, 
                '/login', 
                (route) => false
              );
            },
          ),
        ),
      );
    }
  }
}
