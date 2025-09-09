import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/nfc_card_provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import 'nfc_replacement_request_dialog.dart';

class TeacherNfcManagementScreen extends StatefulWidget {
  const TeacherNfcManagementScreen({super.key});

  @override
  State<TeacherNfcManagementScreen> createState() => _TeacherNfcManagementScreenState();
}

class _TeacherNfcManagementScreenState extends State<TeacherNfcManagementScreen> {
  String _selectedFilter = 'all';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    try {
      final studentProvider = Provider.of<StudentProvider>(context, listen: false);
      final nfcProvider = Provider.of<NfcCardProvider>(context, listen: false);
      
      await Future.wait([
        studentProvider.loadStudents(),
        nfcProvider.loadReplacementRequests(),
      ]);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('加载数据失败: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Widget _buildEnterpriseAppBar() {
    return SliverAppBar(
      expandedHeight: 120,
      floating: false,
      pinned: true,
      backgroundColor: const Color(0xFF1E293B),
      foregroundColor: Colors.white,
      flexibleSpace: FlexibleSpaceBar(
        title: const Text(
          'NFC智能管理中心',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF1E293B),
                Color(0xFF334155),
                Color(0xFF475569),
              ],
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                right: -50,
                top: -50,
                child: Container(
                  width: 200,
                  height: 200,
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
                  width: 150,
                  height: 150,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.05),
                  ),
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
            _loadData();
          },
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          _buildEnterpriseAppBar(),
          SliverToBoxAdapter(
            child: _buildSearchAndFilter(),
          ),
          SliverFillRemaining(
            child: Consumer2<StudentProvider, NfcCardProvider>(
              builder: (context, studentProvider, nfcProvider, child) {
                if (studentProvider.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (studentProvider.error != null) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error, size: 64, color: AppTheme.errorColor),
                        const SizedBox(height: 16),
                        Text(
                          '加载失败: ${studentProvider.error}',
                          style: const TextStyle(fontSize: 16),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => studentProvider.loadStudents(),
                          child: const Text('重试'),
                        ),
                      ],
                    ),
                  );
                }

                final students = _getFilteredStudents(studentProvider.students, nfcProvider);
                
                if (students.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.nfc, size: 64, color: AppTheme.textSecondary),
                        const SizedBox(height: 16),
                        Text(
                          '没有找到学生',
                          style: TextStyle(
                            fontSize: 18,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: _loadData,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: students.length,
                    itemBuilder: (context, index) {
                      final student = students[index];
                      final cardStatus = nfcProvider.getCardStatus(student.id);
                      
                      return _buildStudentCard(student, cardStatus, nfcProvider);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilter() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        children: [
          // 搜索框
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: '搜索学生姓名或学号',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _searchQuery = '';
                        });
                      },
                    )
                  : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: AppTheme.textSecondary),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: AppTheme.primaryColor),
              ),
            ),
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
              });
            },
          ),
          const SizedBox(height: 12),
          // 筛选器
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('all', '全部'),
                const SizedBox(width: 8),
                _buildFilterChip('normal', '正常'),
                const SizedBox(width: 8),
                _buildFilterChip('lost', '丢失'),
                const SizedBox(width: 8),
                _buildFilterChip('damaged', '损坏'),
                const SizedBox(width: 8),
                _buildFilterChip('replacing', '补办中'),
                const SizedBox(width: 8),
                _buildFilterChip('suspended', '暂停'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSelected = _selectedFilter == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedFilter = value;
        });
      },
      selectedColor: AppTheme.primaryColor.withOpacity(0.2),
      checkmarkColor: AppTheme.primaryColor,
    );
  }

  Widget _buildStudentCard(dynamic student, NfcCardStatus cardStatus, NfcCardProvider nfcProvider) {
    final studentName = student.getStringValue('student_name') ?? '未知学生';
    final studentId = student.getStringValue('student_id') ?? '';
    final className = student.getStringValue('standard') ?? '';
    final center = student.getStringValue('center') ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                  child: Text(
                    studentName.isNotEmpty ? studentName[0].toUpperCase() : '?',
                    style: const TextStyle(
                      color: AppTheme.primaryColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        studentName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        '$studentId · $className',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      if (center.isNotEmpty)
                        Text(
                          center,
                          style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: nfcProvider.getStatusColor(cardStatus).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: nfcProvider.getStatusColor(cardStatus),
                    ),
                  ),
                  child: Text(
                    nfcProvider.getStatusDisplayText(cardStatus),
                    style: TextStyle(
                      fontSize: 12,
                      color: nfcProvider.getStatusColor(cardStatus),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      _showReplacementRequestDialog(student);
                    },
                    icon: const Icon(Icons.nfc, size: 16),
                    label: const Text('申请补办'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primaryColor,
                      side: BorderSide(color: AppTheme.primaryColor),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  List<dynamic> _getFilteredStudents(List<dynamic> students, NfcCardProvider nfcProvider) {
    List<dynamic> filteredStudents = students;

    // 应用搜索过滤
    if (_searchQuery.isNotEmpty) {
      filteredStudents = filteredStudents.where((s) {
        final name = s.getStringValue('student_name') ?? '';
        final studentId = s.getStringValue('student_id') ?? '';
        final searchQuery = _searchQuery.toLowerCase();
        
        return name.toLowerCase().contains(searchQuery) ||
               studentId.toLowerCase().contains(searchQuery);
      }).toList();
    }

    // 应用状态过滤
    if (_selectedFilter != 'all') {
      filteredStudents = filteredStudents.where((s) {
        final cardStatus = nfcProvider.getCardStatus(s.id);
        switch (_selectedFilter) {
          case 'normal':
            return cardStatus == NfcCardStatus.normal;
          case 'lost':
            return cardStatus == NfcCardStatus.lost;
          case 'damaged':
            return cardStatus == NfcCardStatus.damaged;
          case 'replacing':
            return cardStatus == NfcCardStatus.replacing;
          case 'suspended':
            return cardStatus == NfcCardStatus.suspended;
          default:
            return true;
        }
      }).toList();
    }

    return filteredStudents;
  }

  void _showReplacementRequestDialog(dynamic student) {
    showDialog(
      context: context,
      builder: (context) => NfcReplacementRequestDialog(student: student),
    );
  }

}
