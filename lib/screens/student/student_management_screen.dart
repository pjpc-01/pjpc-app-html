import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import 'student_profile_screen.dart';
import 'add_edit_student_screen.dart';
import 'nfc_config_dialog.dart';
import '../../widgets/student/smart_search_bar.dart';
import '../../widgets/student/smart_filter_chips.dart';
import '../../widgets/student/smart_sort_dropdown.dart';
import '../../widgets/student/smart_analytics_card.dart';
import '../../widgets/student/bulk_operations_bar.dart';

class StudentManagementScreen extends StatefulWidget {
  const StudentManagementScreen({super.key});

  @override
  State<StudentManagementScreen> createState() => _StudentManagementScreenState();
}

class _StudentManagementScreenState extends State<StudentManagementScreen> {
  String _searchQuery = '';
  String _selectedFilter = 'all';
  String _selectedCenter = '全部中心';
  String _selectedStandard = '全部班级';
  String _sortBy = 'name';
  Set<String> _selectedStudents = {};
  List<String> _recentSearches = [];
  bool _showAnalytics = true;

  @override
  void initState() {
    super.initState();
    // 加载学生数据
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      if (authProvider.isAuthenticated) {
        Provider.of<StudentProvider>(context, listen: false).loadStudents();
      }
    });
  }

  List<dynamic> _getFilteredStudents(List<dynamic> students) {
    List<dynamic> filteredStudents = students;

    // 应用搜索过滤
    if (_searchQuery.isNotEmpty) {
      final studentProvider = Provider.of<StudentProvider>(context, listen: false);
      filteredStudents = studentProvider.searchStudents(_searchQuery);
    }

    // 应用中心过滤
    if (_selectedCenter != '全部中心') {
      filteredStudents = filteredStudents.where((s) => s.getStringValue('center') == _selectedCenter).toList();
    }

    // 应用班级过滤
    if (_selectedStandard != '全部班级') {
      filteredStudents = filteredStudents.where((s) => s.getStringValue('standard') == _selectedStandard).toList();
    }

    // 应用NFC状态过滤
    switch (_selectedFilter) {
      case 'nfc':
        filteredStudents = filteredStudents.where((s) => (s.getStringValue('nfc_url') ?? '').isNotEmpty).toList();
        break;
      case 'no_nfc':
        filteredStudents = filteredStudents.where((s) => (s.getStringValue('nfc_url') ?? '').isEmpty).toList();
        break;
    }

    return filteredStudents;
  }

  List<dynamic> _sortStudents(List<dynamic> students) {
    final sortedStudents = List<dynamic>.from(students);
    
    switch (_sortBy) {
      case 'name':
        sortedStudents.sort((a, b) => (a.getStringValue('student_name') ?? '').compareTo(b.getStringValue('student_name') ?? ''));
        break;
      case 'id':
        sortedStudents.sort((a, b) => (a.getStringValue('student_id') ?? '').compareTo(b.getStringValue('student_id') ?? ''));
        break;
      case 'class':
        sortedStudents.sort((a, b) => (a.getStringValue('standard') ?? '').compareTo(b.getStringValue('standard') ?? ''));
        break;
      case 'center':
        sortedStudents.sort((a, b) => (a.getStringValue('center') ?? '').compareTo(b.getStringValue('center') ?? ''));
        break;
      case 'status':
        sortedStudents.sort((a, b) => (a.getStringValue('status') ?? '').compareTo(b.getStringValue('status') ?? ''));
        break;
    }
    
    return sortedStudents;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(),
          _buildSearchAndFilterSection(),
          _buildAnalyticsSection(),
          _buildStudentListSection(),
        ],
      ),
      floatingActionButton: _buildFloatingActionButton(),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 140.0,
      floating: false,
      pinned: true,
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      flexibleSpace: FlexibleSpaceBar(
        title: const Text(
          '学生管理',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 22,
            shadows: [
              Shadow(
                offset: Offset(0, 1),
                blurRadius: 2,
                color: Colors.black26,
              ),
            ],
          ),
        ),
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppTheme.primaryColor,
                AppTheme.primaryColor.withOpacity(0.8),
                AppTheme.accentColor.withOpacity(0.3),
              ],
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                right: -20,
                top: -20,
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.1),
                  ),
                ),
              ),
              Positioned(
                left: -30,
                bottom: -30,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.05),
                  ),
                ),
              ),
              const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Icon(
                      Icons.school_rounded,
                      size: 48,
                      color: Colors.white70,
                    ),
                    SizedBox(height: 8),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
        actions: [
          IconButton(
          icon: const Icon(Icons.refresh_rounded),
          onPressed: () {
            Provider.of<StudentProvider>(context, listen: false).loadStudents();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('正在刷新学生数据...'),
                duration: Duration(seconds: 1),
              ),
            );
          },
          tooltip: '刷新数据',
        ),
        PopupMenuButton<String>(
          icon: const Icon(Icons.more_vert_rounded),
          onSelected: (value) {
            switch (value) {
              case 'export':
                _exportStudents();
                break;
              case 'import':
                _importStudents();
                break;
              case 'analytics':
                setState(() => _showAnalytics = !_showAnalytics);
                break;
              case 'settings':
                _showSettings();
                break;
            }
          },
          itemBuilder: (context) => [
            PopupMenuItem(
              value: 'analytics',
              child: Row(
                children: [
                  Icon(
                    _showAnalytics ? Icons.analytics : Icons.analytics_outlined,
                    color: AppTheme.primaryColor,
                  ),
                  const SizedBox(width: 12),
                  Text(_showAnalytics ? '隐藏分析' : '显示分析'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'export',
              child: Row(
                children: [
                  Icon(Icons.download_rounded, color: AppTheme.primaryColor),
                  SizedBox(width: 12),
                  Text('导出学生数据'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'import',
              child: Row(
                children: [
                  Icon(Icons.upload_rounded, color: AppTheme.primaryColor),
                  SizedBox(width: 12),
                  Text('导入学生数据'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'settings',
              child: Row(
                children: [
                  Icon(Icons.settings_rounded, color: AppTheme.primaryColor),
                  SizedBox(width: 12),
                  Text('管理设置'),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSearchAndFilterSection() {
    return SliverToBoxAdapter(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            _buildSmartSearchBar(),
            const SizedBox(height: AppSpacing.md),
            _buildSmartFilterChips(Provider.of<StudentProvider>(context, listen: false)),
            const SizedBox(height: AppSpacing.md),
            _buildSortAndActionsBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildAnalyticsSection() {
    return SliverToBoxAdapter(
      child: Consumer<StudentProvider>(
        builder: (context, studentProvider, child) {
          if (studentProvider.students.isEmpty || !_showAnalytics) {
            return const SizedBox.shrink();
          }
          return _buildSmartAnalytics(studentProvider);
        },
      ),
    );
  }

  Widget _buildStudentListSection() {
    return Consumer<StudentProvider>(
      builder: (context, studentProvider, child) {
        if (studentProvider.isLoading) {
          return const SliverToBoxAdapter(
            child: Center(
      child: Padding(
                padding: EdgeInsets.all(AppSpacing.xl),
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                ),
              ),
            ),
          );
        }

        if (studentProvider.error != null) {
          return SliverToBoxAdapter(
            child: _buildErrorState(studentProvider.error!),
          );
        }

        if (studentProvider.students.isEmpty) {
          return SliverToBoxAdapter(
            child: _buildEmptyState(),
          );
        }

        final filteredStudents = _getFilteredStudents(studentProvider.students);
        final sortedStudents = _sortStudents(filteredStudents);

        if (sortedStudents.isEmpty) {
          return SliverToBoxAdapter(
            child: _buildNoResultsState(),
          );
        }

        return SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final student = sortedStudents[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.md),
                  child: _buildEnhancedStudentCard(student),
                );
              },
              childCount: sortedStudents.length,
            ),
          ),
        );
      },
    );
  }

  Widget _buildFloatingActionButton() {
    return FloatingActionButton.extended(
      onPressed: _showAddStudentDialog,
      backgroundColor: AppTheme.primaryColor,
      foregroundColor: Colors.white,
      elevation: 8,
      icon: const Icon(Icons.person_add_rounded),
      label: const Text(
        '添加学生',
        style: TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 16,
        ),
      ),
    );
  }

  Widget _buildSmartSearchBar() {
    return SmartSearchBar(
      hintText: '搜索学生姓名、学号或班级...',
      onSearch: (query) {
        setState(() {
          _searchQuery = query;
        });
      },
      suggestions: _getSearchSuggestions(),
      onSuggestionTap: (suggestion) {
        setState(() {
          _searchQuery = suggestion;
        });
      },
    );
  }

  Widget _buildSmartFilterChips(StudentProvider studentProvider) {
    return SmartFilterChips(
      chips: [
        FilterChipData(
          id: 'all',
          label: '全部',
          icon: Icons.all_inclusive,
          color: AppTheme.primaryColor,
        ),
        FilterChipData(
          id: 'nfc',
          label: '已配置NFC',
          icon: Icons.nfc,
          color: AppTheme.successColor,
        ),
        FilterChipData(
          id: 'no_nfc',
          label: '未配置NFC',
          icon: Icons.nfc,
          color: AppTheme.warningColor,
        ),
      ],
      onSelectionChanged: (selectedFilters) {
        setState(() {
          _selectedFilter = selectedFilters.isNotEmpty ? selectedFilters.first : 'all';
        });
      },
    );
  }

  Widget _buildSortAndActionsBar() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
      child: Row(
          children: [
          Expanded(
            child: SmartSortDropdown(
              options: [
                SortOption(
                  id: 'name',
                  label: '按姓名排序',
                  icon: Icons.person,
                  sortKey: (s) => s.getStringValue('student_name') ?? '',
                ),
                SortOption(
                  id: 'id',
                  label: '按学号排序',
                  icon: Icons.badge,
                  sortKey: (s) => s.getStringValue('student_id') ?? '',
                ),
                SortOption(
                  id: 'class',
                  label: '按班级排序',
                  icon: Icons.school,
                  sortKey: (s) => s.getStringValue('standard') ?? '',
                ),
                SortOption(
                  id: 'center',
                  label: '按中心排序',
                  icon: Icons.location_on,
                  sortKey: (s) => s.getStringValue('center') ?? '',
                ),
                SortOption(
                  id: 'status',
                  label: '按状态排序',
                  icon: Icons.info,
                  sortKey: (s) => s.getStringValue('status') ?? '',
                ),
              ],
              selectedOption: _sortBy,
              onSortChanged: (sortBy) {
                setState(() {
                  _sortBy = sortBy;
                });
              },
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          IconButton(
            onPressed: _toggleSelectionMode,
            icon: Icon(_selectedStudents.isNotEmpty ? Icons.check_box : Icons.check_box_outline_blank),
            tooltip: _selectedStudents.isNotEmpty ? '退出选择模式' : '批量选择',
          ),
        ],
      ),
    );
  }

  Widget _buildSmartAnalytics(StudentProvider studentProvider) {
    final students = studentProvider.students;
    final nfcConfigured = students.where((s) => (s.getStringValue('nfc_url') ?? '').isNotEmpty).length;
    final activeStudents = students.where((s) => (s.getStringValue('status') ?? '') == 'active').length;
    final centers = students.map((s) => s.getStringValue('center')).where((center) => center != null && center.isNotEmpty).toSet().length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: SmartAnalyticsCard(
        title: '学生数据洞察',
        items: [
          AnalyticsItem(
            label: '总学生数',
            value: students.length.toString(),
            color: AppTheme.primaryColor,
            trend: 12.5,
          ),
          AnalyticsItem(
            label: 'NFC配置率',
            value: '${(nfcConfigured / students.length * 100).toStringAsFixed(1)}%',
            color: AppTheme.successColor,
            trend: 8.3,
          ),
          AnalyticsItem(
            label: '在读学生',
            value: activeStudents.toString(),
            color: AppTheme.successColor,
          ),
          AnalyticsItem(
            label: '覆盖中心',
            value: centers.toString(),
            color: AppTheme.accentColor,
          ),
        ],
        onTap: () {
          // 显示详细分析
        },
      ),
    );
  }

  Widget _buildEnhancedStudentCard(dynamic student) {
    final studentName = student.getStringValue('student_name') ?? '未知学生';
    final studentId = student.getStringValue('student_id') ?? '';
    final standard = student.getStringValue('standard') ?? '';
    final center = student.getStringValue('center') ?? '';
    final status = student.getStringValue('status') ?? 'active';
    final nfcUrl = student.getStringValue('nfc_url') ?? '';
    final phone = student.getStringValue('phone') ?? '';
    final parentName = student.getStringValue('parent_name') ?? '';
    final isNfcConfigured = nfcUrl.isNotEmpty;
    final isSelected = _selectedStudents.contains(student.id);

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Card(
        elevation: isSelected ? 8 : 2,
        shadowColor: isSelected ? AppTheme.primaryColor.withOpacity(0.3) : null,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: isSelected 
            ? BorderSide(color: AppTheme.primaryColor, width: 2)
            : BorderSide.none,
        ),
        child: InkWell(
          onTap: () {
            if (_selectedStudents.isNotEmpty) {
              _toggleStudentSelection(student.id);
            } else {
              _showStudentDetails(student);
            }
          },
          onLongPress: () => _toggleStudentSelection(student.id),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: isSelected 
                ? LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppTheme.primaryColor.withOpacity(0.05),
                      AppTheme.accentColor.withOpacity(0.05),
                    ],
                  )
                : null,
            ),
          child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                  // 顶部信息行
                  Row(
                    children: [
                      // 选择框
                      if (_selectedStudents.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(right: 12),
                          child: Checkbox(
                            value: isSelected,
                            onChanged: (value) => _toggleStudentSelection(student.id),
                            activeColor: AppTheme.primaryColor,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      
                      // 学生头像
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              AppTheme.primaryColor,
                              AppTheme.accentColor,
                            ],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primaryColor.withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Center(
                  child: Text(
                            studentName.isNotEmpty ? studentName[0] : '?',
                            style: const TextStyle(
                              color: Colors.white,
                      fontWeight: FontWeight.bold,
                              fontSize: 24,
                    ),
                  ),
                ),
                      ),
                      
                      const SizedBox(width: 16),
                      
                      // 学生基本信息
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    studentName,
                                    style: AppTextStyles.headline6.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.textPrimary,
                                    ),
                                  ),
                                ),
                                _buildStatusChip(status),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '学号: $studentId',
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: AppTheme.textSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                  ),
                      
                      // 操作菜单
                PopupMenuButton<String>(
                        icon: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceColor,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            Icons.more_vert_rounded,
                            color: AppTheme.textSecondary,
                            size: 20,
                          ),
                        ),
                        onSelected: (value) {
                          print('PopupMenu选择: $value, 学生: ${student?.getStringValue('student_name')}');
                          switch (value) {
                            case 'view':
                              _showStudentDetails(student);
                              break;
                            case 'edit':
                              if (student == null) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('学生信息不存在')),
                                );
                                return;
                              }
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => AddEditStudentScreen(
                                    student: student,
                                    isEdit: true,
                                  ),
                                ),
                              );
                              break;
                            case 'nfc':
                              _showNFCConfigDialog(student);
                              break;
                            case 'delete':
                              _showDeleteDialog(student);
                              break;
                          }
                        },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'view',
                      child: Row(
                        children: [
                                Icon(Icons.visibility_rounded, color: AppTheme.primaryColor),
                                SizedBox(width: 12),
                                Text('查看详情'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'edit',
                      child: Row(
                        children: [
                                Icon(Icons.edit_rounded, color: AppTheme.primaryColor),
                                SizedBox(width: 12),
                                Text('编辑信息'),
                        ],
                      ),
                    ),
                          PopupMenuItem(
                      value: 'nfc',
                      child: Row(
                        children: [
                                Icon(
                                  isNfcConfigured ? Icons.nfc_rounded : Icons.nfc_rounded,
                                  color: isNfcConfigured ? AppTheme.successColor : AppTheme.warningColor,
                                ),
                                const SizedBox(width: 12),
                                Text(isNfcConfigured ? '重新配置NFC' : '配置NFC'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                                Icon(Icons.delete_rounded, color: AppTheme.errorColor),
                                SizedBox(width: 12),
                                Text('删除学生'),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
                  
                  const SizedBox(height: 16),
                  
                  // 详细信息行
                  Row(
                    children: [
                      Expanded(
                        child: _buildInfoItem(
                          Icons.school_rounded,
                          standard,
                          '班级',
                          AppTheme.primaryColor,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildInfoItem(
                          Icons.location_on_rounded,
                          center,
                          '中心',
                          AppTheme.accentColor,
                        ),
                      ),
                    ],
                  ),
                  
                  if (phone.isNotEmpty || parentName.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        if (phone.isNotEmpty)
                          Expanded(
                            child: _buildInfoItem(
                              Icons.phone_rounded,
                              phone,
                              '电话',
                              AppTheme.successColor,
                            ),
                          ),
                        if (phone.isNotEmpty && parentName.isNotEmpty)
                          const SizedBox(width: 16),
                        if (parentName.isNotEmpty)
                          Expanded(
                            child: _buildInfoItem(
                              Icons.person_rounded,
                              parentName,
                              '家长',
                              AppTheme.warningColor,
                            ),
          ),
        ],
      ),
                  ],
                  
                  const SizedBox(height: 16),
                  
                  // NFC状态和快速操作
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isNfcConfigured 
                            ? AppTheme.successColor.withOpacity(0.1)
                            : AppTheme.warningColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isNfcConfigured 
                              ? AppTheme.successColor
                              : AppTheme.warningColor,
                            width: 1,
                          ),
                        ),
                        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
                            Icon(
                              Icons.nfc_rounded,
                              size: 16,
                              color: isNfcConfigured 
                                ? AppTheme.successColor
                                : AppTheme.warningColor,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              isNfcConfigured ? 'NFC已配置' : 'NFC未配置',
                              style: AppTextStyles.bodySmall.copyWith(
                                color: isNfcConfigured 
                                  ? AppTheme.successColor
                                  : AppTheme.warningColor,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      if (!isNfcConfigured)
                        TextButton.icon(
                          onPressed: () => _showNFCConfigDialog(student),
                          icon: const Icon(Icons.settings_rounded, size: 16),
                          label: const Text('配置'),
                          style: TextButton.styleFrom(
                            foregroundColor: AppTheme.primaryColor,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              ),
            ),
          ],
        ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String value, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
          children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  label,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
              ),
            ),
          ],
        ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    String label;
    
    switch (status) {
      case 'active':
        color = AppTheme.successColor;
        label = '在读';
        break;
      case 'inactive':
        color = AppTheme.warningColor;
        label = '停学';
        break;
      case 'graduated':
        color = AppTheme.accentColor;
        label = '毕业';
        break;
      default:
        color = AppTheme.textSecondary;
        label = '未知';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color, width: 1),
      ),
      child: Text(
        label,
        style: AppTextStyles.bodySmall.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: AppTheme.errorColor,
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              '加载失败',
              style: AppTextStyles.headline4,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              error,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            ElevatedButton.icon(
              onPressed: () {
                Provider.of<StudentProvider>(context, listen: false).loadStudents();
              },
              icon: const Icon(Icons.refresh),
              label: const Text('重试'),
            ),
            const SizedBox(height: AppSpacing.md),
            TextButton.icon(
              onPressed: () {
                Provider.of<AuthProvider>(context, listen: false).logout();
              },
              icon: const Icon(Icons.logout),
              label: const Text('检查登录状态'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.school_outlined,
              size: 64,
              color: AppTheme.textSecondary,
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              '暂无学生数据',
              style: AppTextStyles.headline4,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              '点击右下角按钮添加第一个学生',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppTheme.textSecondary,
              ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildNoResultsState() {
    return Center(
              child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
                child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
                  children: [
            const Icon(
              Icons.search_off,
              size: 64,
              color: AppTheme.textSecondary,
            ),
                    const SizedBox(height: AppSpacing.lg),
            Text(
              '未找到匹配的学生',
              style: AppTextStyles.headline4,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              '尝试调整搜索条件或筛选器',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<String> _getSearchSuggestions() {
    final studentProvider = Provider.of<StudentProvider>(context, listen: false);
    final suggestions = <String>{};
    
    for (final student in studentProvider.students) {
      final name = student.getStringValue('student_name') ?? '';
      final id = student.getStringValue('student_id') ?? '';
      final standard = student.getStringValue('standard') ?? '';
      
      if (name.isNotEmpty) suggestions.add(name);
      if (id.isNotEmpty) suggestions.add(id);
      if (standard.isNotEmpty) suggestions.add(standard);
    }
    
    return suggestions.take(10).toList();
  }

  List<BulkOperation> _getBulkOperations() {
    return [
      BulkOperation(
        label: '配置NFC',
        icon: Icons.nfc,
        color: AppTheme.successColor,
        onPressed: _bulkConfigureNFC,
      ),
      BulkOperation(
        label: '导出数据',
        icon: Icons.download,
        color: AppTheme.primaryColor,
        onPressed: _bulkExportStudents,
      ),
      BulkOperation(
        label: '删除学生',
        icon: Icons.delete,
        color: AppTheme.errorColor,
        onPressed: _bulkDeleteStudents,
      ),
    ];
  }

  void _toggleSelectionMode() {
    setState(() {
      if (_selectedStudents.isNotEmpty) {
        _selectedStudents.clear();
      }
    });
  }

  void _toggleStudentSelection(String? studentId) {
    if (studentId == null) return;
    
    setState(() {
      if (_selectedStudents.contains(studentId)) {
        _selectedStudents.remove(studentId);
      } else {
        _selectedStudents.add(studentId);
      }
    });
  }

  void _clearSelection() {
    setState(() {
      _selectedStudents.clear();
    });
  }

  void _bulkConfigureNFC() {
    if (_selectedStudents.isEmpty) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('批量配置NFC'),
        content: Text('将为 ${_selectedStudents.length} 个学生配置NFC'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
                            onPressed: () {
                              Navigator.pop(context);
              // 实现批量NFC配置逻辑
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('批量NFC配置功能开发中...')),
              );
            },
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  void _bulkExportStudents() {
    if (_selectedStudents.isEmpty) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('导出 ${_selectedStudents.length} 个学生的数据'),
        action: SnackBarAction(
          label: '确定',
                            onPressed: () {
            // 实现导出逻辑
          },
        ),
      ),
    );
  }

  void _bulkDeleteStudents() {
    if (_selectedStudents.isEmpty) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('批量删除学生'),
        content: Text('确定要删除 ${_selectedStudents.length} 个学生吗？此操作不可撤销。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // 实现批量删除逻辑
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('批量删除功能开发中...')),
              );
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

  void _showStudentDetails(dynamic student) {
    final studentId = student.id ?? student.getStringValue('id') ?? '';
    if (studentId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('学生ID不存在')),
      );
      return;
    }
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StudentProfileScreen(studentId: studentId),
      ),
    );
  }

  void _showNFCConfigDialog(dynamic student) {
    if (student == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('学生信息不存在')),
      );
      return;
    }
    
    showDialog(
      context: context,
      builder: (context) => NfcConfigDialog(student: student),
    );
  }

  void _showDeleteDialog(dynamic student) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('删除学生'),
        content: Text('确定要删除学生 ${student.getStringValue('student_name')} 吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _deleteStudent(student);
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

  void _deleteStudent(dynamic student) async {
    try {
      final studentProvider = Provider.of<StudentProvider>(context, listen: false);
      await studentProvider.deleteStudent(student.id);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('学生删除成功')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('删除失败: $e')),
        );
      }
    }
  }

  void _showAddStudentDialog() {
        Navigator.push(
          context,
          MaterialPageRoute(
        builder: (context) => const AddEditStudentScreen(),
      ),
    );
  }

  void _exportStudents() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('导出功能开发中...'),
        backgroundColor: AppTheme.primaryColor,
      ),
    );
  }

  void _importStudents() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('导入功能开发中...'),
        backgroundColor: AppTheme.primaryColor,
      ),
    );
  }

  void _showSettings() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('管理设置'),
        content: const Text('设置功能开发中...'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }
}
