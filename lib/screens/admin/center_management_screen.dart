import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../services/pocketbase_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import 'add_edit_center_screen.dart';

class CenterManagementScreen extends StatefulWidget {
  const CenterManagementScreen({super.key});

  @override
  State<CenterManagementScreen> createState() => _CenterManagementScreenState();
}

class _CenterManagementScreenState extends State<CenterManagementScreen> {
  final PocketBaseService _pocketBaseService = PocketBaseService.instance;
  List<RecordModel> _centers = [];
  List<RecordModel> _students = [];
  bool _isLoading = false;
  String? _error;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // 并行加载分行和学生数据
      final futures = await Future.wait([
        _pocketBaseService.getCenters(),
        _pocketBaseService.getStudents(),
      ]);
      
      setState(() {
        _centers = futures[0] as List<RecordModel>;
        _students = futures[1] as List<RecordModel>;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = '加载数据失败: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  List<RecordModel> get _filteredCenters {
    if (_searchQuery.isEmpty) return _centers;
    
    return _centers.where((center) {
      final name = center.getStringValue('name') ?? '';
      final code = center.getStringValue('code') ?? '';
      final address = center.getStringValue('address') ?? '';
      final query = _searchQuery.toLowerCase();
      
      return name.toLowerCase().contains(query) ||
             code.toLowerCase().contains(query) ||
             address.toLowerCase().contains(query);
    }).toList();
  }

  // 获取指定分行的学生
  List<RecordModel> _getStudentsForCenter(String centerCode) {
    return _students.where((student) {
      final studentCenter = student.getStringValue('center') ?? '';
      return studentCenter == centerCode;
    }).toList();
  }

  // 获取指定分行的活跃学生
  List<RecordModel> _getActiveStudentsForCenter(String centerCode) {
    return _getStudentsForCenter(centerCode).where((student) {
      return student.getStringValue('status') == 'active';
    }).toList();
  }

  // 获取指定分行本月新增学生
  List<RecordModel> _getNewStudentsThisMonthForCenter(String centerCode) {
    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    
    return _getStudentsForCenter(centerCode).where((student) {
      final createdStr = student.getStringValue('created') ?? '';
      if (createdStr.isEmpty) return false;
      
      try {
        final created = DateTime.parse(createdStr);
        return created.isAfter(startOfMonth);
      } catch (e) {
        return false;
      }
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        if (!authProvider.isAdmin) {
          return Scaffold(
            backgroundColor: const Color(0xFFF8FAFC),
            appBar: AppBar(
              title: const Text('权限不足'),
              backgroundColor: const Color(0xFF1E3A8A),
              foregroundColor: Colors.white,
            ),
            body: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock_rounded, size: 64, color: Color(0xFF64748B)),
                  SizedBox(height: 16),
                  Text(
                    '权限不足',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text('只有管理员可以查看分行管理'),
                ],
              ),
            ),
          );
        }

        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            title: const Text(
              '分行管理',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            backgroundColor: const Color(0xFF1E3A8A),
            foregroundColor: Colors.white,
            elevation: 0,
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: _loadData,
              ),
            ],
          ),
          body: Column(
            children: [
              _buildSearchBar(),
              _buildStatsCard(),
              Expanded(child: _buildCentersList()),
            ],
          ),
          floatingActionButton: FloatingActionButton(
            onPressed: _showAddCenterDialog,
            backgroundColor: const Color(0xFF10B981),
            child: const Icon(Icons.add, color: Colors.white),
          ),
        );
      },
    );
  }

  Widget _buildSearchBar() {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (value) => setState(() => _searchQuery = value),
        decoration: InputDecoration(
          hintText: '搜索分行名称、代码或地址...',
          prefixIcon: const Icon(Icons.search, color: Color(0xFF64748B)),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
    );
  }

  Widget _buildStatsCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildStatItem(
              '总分行数',
              '${_centers.length}',
              Icons.business,
              const Color(0xFF3B82F6),
            ),
          ),
          Container(width: 1, height: 40, color: Colors.grey.shade200),
          Expanded(
            child: _buildStatItem(
              '总学生数',
              '${_students.length}',
              Icons.people,
              const Color(0xFF10B981),
            ),
          ),
          Container(width: 1, height: 40, color: Colors.grey.shade200),
          Expanded(
            child: _buildStatItem(
              '活跃学生',
              '${_students.where((s) => s.getStringValue('status') == 'active').length}',
              Icons.check_circle,
              const Color(0xFFF59E0B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildCentersList() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF3B82F6)),
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red.shade300),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: const TextStyle(fontSize: 16, color: Color(0xFF64748B)),
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

    if (_filteredCenters.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.business_outlined, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              _searchQuery.isEmpty ? '暂无分行信息' : '未找到匹配的分行',
              style: const TextStyle(fontSize: 16, color: Color(0xFF64748B)),
            ),
            if (_searchQuery.isEmpty) ...[
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _showAddCenterDialog,
                icon: const Icon(Icons.add),
                label: const Text('添加分行'),
              ),
            ],
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _filteredCenters.length,
      itemBuilder: (context, index) {
        final center = _filteredCenters[index];
        return _buildCenterCard(center);
      },
    );
  }

  Widget _buildCenterCard(RecordModel center) {
    final name = center.getStringValue('name') ?? '未命名分行';
    final code = center.getStringValue('code') ?? '';
    final address = center.getStringValue('address') ?? '';
    final status = center.getStringValue('status') ?? 'active';
    final phone = center.getStringValue('phone') ?? '';
    final manager = center.getStringValue('manager') ?? '';
    final createdAt = DateTime.tryParse(center.getStringValue('created') ?? '');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: () => _showCenterDetails(center),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: status == 'active' 
                          ? const Color(0xFF10B981).withOpacity(0.1)
                          : const Color(0xFFEF4444).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      status == 'active' ? '活跃' : '停用',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: status == 'active' 
                            ? const Color(0xFF10B981)
                            : const Color(0xFFEF4444),
                      ),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    code,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                name,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
              if (address.isNotEmpty) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 14, color: Color(0xFF64748B)),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        address,
                        style: const TextStyle(
                          fontSize: 14,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
              if (phone.isNotEmpty) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.phone, size: 14, color: Color(0xFF64748B)),
                    const SizedBox(width: 4),
                    Text(
                      phone,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ],
              if (manager.isNotEmpty) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.person, size: 14, color: Color(0xFF64748B)),
                    const SizedBox(width: 4),
                    Text(
                      '负责人: $manager',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 12),
              // 学生统计信息
              _buildStudentStats(center),
              if (createdAt != null) ...[
                const SizedBox(height: 8),
                Text(
                  '创建时间: ${createdAt.year}-${createdAt.month.toString().padLeft(2, '0')}-${createdAt.day.toString().padLeft(2, '0')}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStudentStats(RecordModel center) {
    final centerCode = center.getStringValue('code') ?? '';
    final totalStudents = _getStudentsForCenter(centerCode).length;
    final activeStudents = _getActiveStudentsForCenter(centerCode).length;
    final newStudents = _getNewStudentsThisMonthForCenter(centerCode).length;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildStudentStatItem(
              '总学生',
              totalStudents.toString(),
              Icons.people,
              const Color(0xFF3B82F6),
            ),
          ),
          Container(width: 1, height: 30, color: const Color(0xFFE2E8F0)),
          Expanded(
            child: _buildStudentStatItem(
              '活跃学生',
              activeStudents.toString(),
              Icons.check_circle,
              const Color(0xFF10B981),
            ),
          ),
          Container(width: 1, height: 30, color: const Color(0xFFE2E8F0)),
          Expanded(
            child: _buildStudentStatItem(
              '本月新生',
              newStudents.toString(),
              Icons.person_add,
              const Color(0xFFF59E0B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentStatItem(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            color: Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  void _showCenterDetails(RecordModel center) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    center.getStringValue('name') ?? '分行详情',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildDetailRow('分行代码', center.getStringValue('code') ?? ''),
                  _buildDetailRow('地址', center.getStringValue('address') ?? ''),
                  _buildDetailRow('电话', center.getStringValue('phone') ?? ''),
                  _buildDetailRow('负责人', center.getStringValue('manager') ?? ''),
                  _buildDetailRow('状态', center.getStringValue('status') == 'active' ? '活跃' : '停用'),
                  const SizedBox(height: 16),
                  // 学生统计
                  _buildStudentStatsInDetails(center),
                  const SizedBox(height: 16),
                  _buildDetailRow('创建时间', _formatDate(center.getStringValue('created'))),
                  _buildDetailRow('更新时间', _formatDate(center.getStringValue('updated'))),
                ],
              ),
            ),
            const Spacer(),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('关闭'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _showEditCenterDialog(center);
                      },
                      child: const Text('编辑'),
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

  Widget _buildStudentStatsInDetails(RecordModel center) {
    final centerCode = center.getStringValue('code') ?? '';
    final totalStudents = _getStudentsForCenter(centerCode).length;
    final activeStudents = _getActiveStudentsForCenter(centerCode).length;
    final newStudents = _getNewStudentsThisMonthForCenter(centerCode).length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '学生统计',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildDetailStatCard(
                '总学生',
                totalStudents.toString(),
                Icons.people,
                const Color(0xFF3B82F6),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildDetailStatCard(
                '活跃学生',
                activeStudents.toString(),
                Icons.check_circle,
                const Color(0xFF10B981),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildDetailStatCard(
                '本月新生',
                newStudents.toString(),
                Icons.person_add,
                const Color(0xFFF59E0B),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDetailStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color.withOpacity(0.8),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF64748B),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value.isEmpty ? '未设置' : value,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF1E293B),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return '未设置';
    final date = DateTime.tryParse(dateString);
    if (date == null) return '未设置';
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  void _showAddCenterDialog() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AddEditCenterScreen(),
      ),
    ).then((_) => _loadData()); // 返回后刷新列表
  }

  void _showEditCenterDialog(RecordModel center) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditCenterScreen(centerData: center),
      ),
    ).then((_) => _loadData()); // 返回后刷新列表
  }
}
