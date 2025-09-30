import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/nfc_constants.dart';
import '../../../shared/services/nfc_management_service.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../teacher/providers/teacher_provider.dart';
import '../../nfc/widgets/nfc_status_optimized.dart';
import '../../nfc/widgets/nfc_scan_optimized.dart';
import '../../nfc/widgets/user_selection_optimized.dart';

/// 优化版本的NFC管理屏幕 - 使用模块化组件
class NFCManagementOptimizedV2 extends StatefulWidget {
  final int? initialTab;
  
  const NFCManagementOptimizedV2({
    super.key,
    this.initialTab,
  });

  @override
  State<NFCManagementOptimizedV2> createState() => _NFCManagementOptimizedV2State();
}

class _NFCManagementOptimizedV2State extends State<NFCManagementOptimizedV2>
    with TickerProviderStateMixin, AutomaticKeepAliveClientMixin {
  late TabController _tabController;
  
  // NFC操作相关
  String _currentMode = NFCConstants.modeReplacement;
  String _userType = NFCConstants.userTypeStudent;
  String? _selectedUserId;
  String? _scannedNfcId;
  bool _isProcessing = false;

  // 卡片检查相关
  String _cardOwnerInfo = '';
  bool _isCheckingCard = false;

  final NFCManagementService _nfcService = NFCManagementService.instance;

  @override
  bool get wantKeepAlive => true;

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
    
    // 延迟加载数据，确保Provider已准备好
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadInitialData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  /// 加载初始数据
  Future<void> _loadInitialData() async {
    try {
      
      // 加载学生数据
      final studentProvider = context.read<StudentProvider>();
      if (studentProvider.students.isEmpty) {
        await studentProvider.loadStudents();
      }
      
      // 加载教师数据
      final teacherProvider = context.read<TeacherProvider>();
      if (teacherProvider.teachers.isEmpty) {
        await teacherProvider.loadTeachers();
      }
      
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('数据加载失败: $e'),
            backgroundColor: Color(NFCConstants.errorColor),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // 必须调用以支持AutomaticKeepAliveClientMixin
    
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenHeight < NFCConstants.smallScreenHeight || 
                         screenWidth < NFCConstants.smallScreenWidth;
    
    return Scaffold(
      backgroundColor: Color(NFCConstants.backgroundColor),
      body: Column(
        children: [
          _buildHeader(isSmallScreen),
          NFCOptimizedStatus(isSmallScreen: isSmallScreen),
          _buildTabBar(isSmallScreen),
          Expanded(
            child: Consumer<AuthProvider>(
              builder: (context, authProvider, child) {
                if (authProvider.isAdmin) {
                  return TabBarView(
                    controller: _tabController,
                    children: [
                      _buildNFCOperationsTab(isSmallScreen),
                      _buildCardCheckTab(isSmallScreen),
                      _buildReplacementManagementTab(isSmallScreen),
                    ],
                  );
                } else {
                  return _buildTeacherReplacementForm(isSmallScreen);
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(bool isSmallScreen) {
    return Container(
      padding: EdgeInsets.all(isSmallScreen ? 16 : 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF3B82F6),
            Color(0xFF1D4ED8),
          ],
        ),
      ),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.nfc,
                  color: Colors.white,
                  size: isSmallScreen ? 28 : 32,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'NFC管理中心',
                        style: TextStyle(
                          fontSize: isSmallScreen ? 24 : 28,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        '智能NFC卡管理系统',
                        style: TextStyle(
                          fontSize: isSmallScreen ? 14 : 16,
                          color: Colors.white.withOpacity(0.9),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabBar(bool isSmallScreen) {
    return Container(
      color: Colors.white,
      child: TabBar(
        controller: _tabController,
        labelColor: Color(NFCConstants.primaryColor),
        unselectedLabelColor: const Color(0xFF64748B),
        indicatorColor: Color(NFCConstants.primaryColor),
        indicatorWeight: 3,
        tabs: const [
          Tab(
            icon: Icon(Icons.add_card),
            text: 'NFC操作',
          ),
          Tab(
            icon: Icon(Icons.search),
            text: '卡片检查',
          ),
          Tab(
            icon: Icon(Icons.manage_accounts),
            text: '申请管理',
          ),
        ],
      ),
    );
  }

  Widget _buildNFCOperationsTab(bool isSmallScreen) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isSmallScreen ? 12 : 16),
      child: Column(
        children: [
          _buildOperationModeSelector(isSmallScreen),
          const SizedBox(height: 16),
          NFCOptimizedScan(
            isSmallScreen: isSmallScreen,
            currentNfcId: _scannedNfcId,
            onNfcScanned: (nfcId) {
              setState(() {
                _scannedNfcId = nfcId;
              });
            },
          ),
          const SizedBox(height: 16),
          _buildUserTypeSelector(isSmallScreen),
          const SizedBox(height: 16),
          UserSelectionOptimized(
            isSmallScreen: isSmallScreen,
            userType: _userType,
            selectedUserId: _selectedUserId,
            onUserSelected: (userId) {
              setState(() {
                _selectedUserId = userId;
              });
            },
          ),
          const SizedBox(height: 24),
          _buildActionButton(isSmallScreen),
        ],
      ),
    );
  }

  Widget _buildCardCheckTab(bool isSmallScreen) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isSmallScreen ? 12 : 16),
      child: Column(
        children: [
          NFCOptimizedScan(
            isSmallScreen: isSmallScreen,
            currentNfcId: _scannedNfcId,
            onNfcScanned: (nfcId) {
              _checkCardOwner(nfcId);
            },
          ),
          const SizedBox(height: 16),
          _buildCardOwnerInfo(isSmallScreen),
        ],
      ),
    );
  }

  Widget _buildReplacementManagementTab(bool isSmallScreen) {
    return const Center(
      child: Text('申请管理功能开发中...'),
    );
  }

  Widget _buildTeacherReplacementForm(bool isSmallScreen) {
    return const Center(
      child: Text('教师补办申请功能开发中...'),
    );
  }

  Widget _buildOperationModeSelector(bool isSmallScreen) {
    return Container(
      padding: EdgeInsets.all(isSmallScreen ? 12 : 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(NFCConstants.cardBorderRadius),
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
            '操作模式',
            style: TextStyle(
              fontSize: isSmallScreen ? 16 : 18,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildModeButton(
                  NFCConstants.modeReplacement,
                  '补办NFC卡',
                  Icons.refresh,
                  isSmallScreen,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildModeButton(
                  NFCConstants.modeAssignment,
                  '分配NFC卡',
                  Icons.add_card,
                  isSmallScreen,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildModeButton(String mode, String label, IconData icon, bool isSmallScreen) {
    final isSelected = _currentMode == mode;
    return GestureDetector(
      onTap: () {
        setState(() {
          _currentMode = mode;
        });
      },
      child: Container(
        padding: EdgeInsets.all(isSmallScreen ? 12 : 16),
        decoration: BoxDecoration(
          color: isSelected 
              ? Color(NFCConstants.primaryColor).withOpacity(0.1)
              : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected 
                ? Color(NFCConstants.primaryColor)
                : Colors.grey.shade200,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected 
                  ? Color(NFCConstants.primaryColor)
                  : Colors.grey.shade600,
              size: isSmallScreen ? 24 : 28,
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: isSmallScreen ? 12 : 14,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected 
                    ? Color(NFCConstants.primaryColor)
                    : Colors.grey.shade700,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUserTypeSelector(bool isSmallScreen) {
    return Container(
      padding: EdgeInsets.all(isSmallScreen ? 12 : 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(NFCConstants.cardBorderRadius),
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
            '用户类型',
            style: TextStyle(
              fontSize: isSmallScreen ? 16 : 18,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildUserTypeButton(
                  NFCConstants.userTypeStudent,
                  '学生',
                  Icons.school,
                  isSmallScreen,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildUserTypeButton(
                  NFCConstants.userTypeTeacher,
                  '教师',
                  Icons.person,
                  isSmallScreen,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildUserTypeButton(String type, String label, IconData icon, bool isSmallScreen) {
    final isSelected = _userType == type;
    return GestureDetector(
      onTap: () {
        setState(() {
          _userType = type;
          _selectedUserId = null; // 重置选择
        });
      },
      child: Container(
        padding: EdgeInsets.all(isSmallScreen ? 12 : 16),
        decoration: BoxDecoration(
          color: isSelected 
              ? Color(NFCConstants.primaryColor).withOpacity(0.1)
              : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected 
                ? Color(NFCConstants.primaryColor)
                : Colors.grey.shade200,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected 
                  ? Color(NFCConstants.primaryColor)
                  : Colors.grey.shade600,
              size: isSmallScreen ? 24 : 28,
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: isSmallScreen ? 12 : 14,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected 
                    ? Color(NFCConstants.primaryColor)
                    : Colors.grey.shade700,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton(bool isSmallScreen) {
    final canProceed = _scannedNfcId != null && _selectedUserId != null;
    
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: canProceed && !_isProcessing ? _performOperation : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: canProceed 
              ? Color(NFCConstants.primaryColor)
              : Colors.grey.shade300,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(NFCConstants.buttonBorderRadius),
          ),
          padding: EdgeInsets.symmetric(
            vertical: isSmallScreen ? 16 : 20,
          ),
        ),
        child: _isProcessing
            ? Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    '处理中...',
                    style: TextStyle(
                      fontSize: isSmallScreen ? 16 : 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    _currentMode == NFCConstants.modeReplacement 
                        ? Icons.refresh 
                        : Icons.add_card,
                    size: isSmallScreen ? 20 : 24,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _currentMode == NFCConstants.modeReplacement 
                        ? '补办NFC卡' 
                        : '分配NFC卡',
                    style: TextStyle(
                      fontSize: isSmallScreen ? 16 : 18,
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
        borderRadius: BorderRadius.circular(NFCConstants.cardBorderRadius),
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
              Icon(
                Icons.info_outline,
                color: Color(NFCConstants.primaryColor),
                size: isSmallScreen ? 24 : 28,
              ),
              const SizedBox(width: 12),
              Text(
                '卡片信息',
                style: TextStyle(
                  fontSize: isSmallScreen ? 16 : 18,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF1E293B),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_isCheckingCard)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: CircularProgressIndicator(),
              ),
            )
          else if (_cardOwnerInfo.isNotEmpty)
            Text(
              _cardOwnerInfo,
              style: TextStyle(
                fontSize: isSmallScreen ? 14 : 16,
                color: const Color(0xFF64748B),
                height: 1.5,
              ),
            )
          else
            Text(
              '请扫描NFC卡查看卡片信息',
              style: TextStyle(
                fontSize: isSmallScreen ? 14 : 16,
                color: const Color(0xFF64748B),
                fontStyle: FontStyle.italic,
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _performOperation() async {
    if (_scannedNfcId == null || _selectedUserId == null) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      final result = await _nfcService.assignNfcCard(
        nfcId: _scannedNfcId!,
        userId: _selectedUserId!,
        userType: _userType,
        context: context,
      );

      if (result['success']) {
        _showSuccessMessage(
          '${_currentMode == NFCConstants.modeReplacement ? '补办' : '分配'}成功: ${result['userName']}'
        );
        
        // 重置状态
        setState(() {
          _scannedNfcId = null;
          _selectedUserId = null;
        });
      } else {
        throw Exception(result['error']);
      }
    } catch (e) {
      _showErrorMessage('操作失败: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  Future<void> _checkCardOwner(String nfcId) async {
    setState(() {
      _isCheckingCard = true;
      _cardOwnerInfo = '';
    });

    try {
      final result = await _nfcService.findCardOwner(nfcId);
      
      if (result['success']) {
        final type = result['type'] == 'student' ? '学生' : '教师';
        final name = result['name'];
        final id = result['id'];
        
        setState(() {
          _cardOwnerInfo = '✅ 找到$type信息\n\n'
              '${type == '学生' ? '学生' : '教师'}姓名: $name\n'
              '${type == '学生' ? '学号' : '工号'}: $id\n\n'
              'NFC ID: $nfcId';
        });
      } else {
        setState(() {
          _cardOwnerInfo = '❌ ${result['message']}\n\n'
              '可能的原因:\n• NFC卡未分配给任何用户\n• NFC ID格式不匹配\n• 数据库中没有相关记录\n\n'
              'NFC ID: $nfcId\n\n'
              '建议:\n• 检查NFC卡是否正确分配\n• 联系管理员进行卡片分配';
        });
      }
    } catch (e) {
      setState(() {
        _cardOwnerInfo = '❌ 查找卡片拥有者失败\n\n'
            '错误信息: $e\n\n'
            'NFC ID: $nfcId\n\n'
            '建议:\n• 检查网络连接\n• 重新尝试扫描\n• 联系技术支持';
      });
    } finally {
      setState(() {
        _isCheckingCard = false;
      });
    }
  }

  void _showSuccessMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Color(NFCConstants.successColor),
      ),
    );
  }

  void _showErrorMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Color(NFCConstants.errorColor),
        duration: const Duration(seconds: 5),
      ),
    );
  }
}

