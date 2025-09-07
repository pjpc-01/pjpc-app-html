import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/attendance_provider.dart';
import '../../providers/student_provider.dart';
import '../../widgets/attendance/nfc_scanner_widget.dart';

class MobileCheckinScreen extends StatefulWidget {
  final String centerId;
  
  const MobileCheckinScreen({
    Key? key,
    required this.centerId,
  }) : super(key: key);

  @override
  State<MobileCheckinScreen> createState() => _MobileCheckinScreenState();
}

class _MobileCheckinScreenState extends State<MobileCheckinScreen> {
  final _searchController = TextEditingController();
  String _searchTerm = '';
  String _selectedStatus = 'present';
  bool _isLoading = false;
  bool _isNfcEnabled = false;
  bool _isOnline = true;
  
  final List<Map<String, String>> _statusOptions = [
    {'value': 'present', 'label': '出勤'},
    {'value': 'late', 'label': '迟到'},
    {'value': 'absent', 'label': '缺勤'},
  ];

  @override
  void initState() {
    super.initState();
    _loadStudents();
    _checkNfcSupport();
    _checkConnectionStatus();
  }

  Future<void> _loadStudents() async {
    setState(() => _isLoading = true);
    try {
      final studentProvider = Provider.of<StudentProvider>(context, listen: false);
      await studentProvider.loadStudents();
    } catch (e) {
      _showErrorSnackBar('加载学生数据失败: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _checkNfcSupport() async {
    // 这里应该检查NFC支持
    setState(() => _isNfcEnabled = true);
  }

  Future<void> _checkConnectionStatus() async {
    // 这里应该检查网络连接状态
    setState(() => _isOnline = true);
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
      ),
    );
  }

  Future<void> _submitAttendance(String studentId, String status) async {
    setState(() => _isLoading = true);
    try {
      final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
      // TODO: Implement submitAttendance method
      // await attendanceProvider.submitAttendance(
      //   studentId: studentId,
      //   status: status,
      //   centerId: widget.centerId,
      //   timestamp: DateTime.now(),
      // );
      _showSuccessSnackBar('考勤记录已提交');
    } catch (e) {
      _showErrorSnackBar('提交考勤失败: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.centerId} - 移动考勤'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(_isNfcEnabled ? Icons.nfc : Icons.nfc_outlined),
            onPressed: _toggleNfc,
            tooltip: _isNfcEnabled ? '关闭NFC' : '开启NFC',
          ),
          IconButton(
            icon: Icon(_isOnline ? Icons.wifi : Icons.wifi_off),
            onPressed: _checkConnectionStatus,
            tooltip: _isOnline ? '在线' : '离线',
          ),
        ],
      ),
      body: Column(
        children: [
          // Status Bar
          _buildStatusBar(),
          
          // Search Section
          _buildSearchSection(),
          
          // Status Selection
          _buildStatusSelection(),
          
          // Student List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _buildStudentList(),
          ),
        ],
      ),
      floatingActionButton: _isNfcEnabled
          ? FloatingActionButton.extended(
              onPressed: _startNfcScan,
              icon: const Icon(Icons.nfc),
              label: const Text('NFC扫描'),
              backgroundColor: Colors.blue[600],
            )
          : null,
    );
  }

  Widget _buildStatusBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: _isOnline ? Colors.green[50] : Colors.red[50],
      child: Row(
        children: [
          Icon(
            _isOnline ? Icons.wifi : Icons.wifi_off,
            color: _isOnline ? Colors.green : Colors.red,
            size: 20,
          ),
          const SizedBox(width: 8),
          Text(
            _isOnline ? '在线模式' : '离线模式',
            style: TextStyle(
              color: _isOnline ? Colors.green[700] : Colors.red[700],
              fontWeight: FontWeight.w600,
            ),
          ),
          const Spacer(),
          if (_isNfcEnabled) ...[
            Icon(
              Icons.nfc,
              color: Colors.blue[600],
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              'NFC已启用',
              style: TextStyle(
                color: Colors.blue[600],
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSearchSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: '搜索学生姓名或学号...',
          prefixIcon: const Icon(Icons.search),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _searchTerm = '');
                  },
                )
              : null,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          filled: true,
          fillColor: Colors.grey[50],
        ),
        onChanged: (value) {
          setState(() => _searchTerm = value);
        },
      ),
    );
  }

  Widget _buildStatusSelection() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          const Text(
            '考勤状态:',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF000000),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _statusOptions.map((status) {
                  final isSelected = _selectedStatus == status['value'];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(status['label']!),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() => _selectedStatus = status['value']!);
                      },
                      selectedColor: _getStatusColor(status['value']!).withOpacity(0.2),
                      checkmarkColor: _getStatusColor(status['value']!),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentList() {
    return Consumer<StudentProvider>(
      builder: (context, studentProvider, child) {
        List<dynamic> students = studentProvider.students;
        
        // Apply search filter
        if (_searchTerm.isNotEmpty) {
          students = students.where((student) {
            final name = student.getStringValue('name') ?? '';
            final studentId = student.getStringValue('student_id') ?? '';
            final searchLower = _searchTerm.toLowerCase();
            
            return name.toLowerCase().contains(searchLower) ||
                   studentId.toLowerCase().contains(searchLower);
          }).toList();
        }
        
        if (students.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.people_outline,
                  size: 64,
                  color: Colors.grey[400],
                ),
                const SizedBox(height: 16),
                Text(
                  _searchTerm.isNotEmpty 
                      ? '没有找到匹配的学生'
                      : '暂无学生数据',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          );
        }
        
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: students.length,
          itemBuilder: (context, index) {
            final student = students[index];
            return _buildStudentCard(student);
          },
        );
      },
    );
  }

  Widget _buildStudentCard(dynamic student) {
    final name = student.getStringValue('name') ?? '';
    final studentId = student.getStringValue('student_id') ?? '';
    final grade = student.getStringValue('grade') ?? '';
    final class_ = student.getStringValue('class') ?? '';
    
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 2,
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getStatusColor(_selectedStatus).withOpacity(0.1),
          child: Text(
            name.isNotEmpty ? name[0].toUpperCase() : '?',
            style: TextStyle(
              color: _getStatusColor(_selectedStatus),
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          name,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Color(0xFF000000),
          ),
        ),
        subtitle: Text(
          '$studentId - $grade$class_',
          style: const TextStyle(
            fontSize: 14,
            color: Color(0xFF6B7280),
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _getStatusColor(_selectedStatus).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _getStatusLabel(_selectedStatus),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: _getStatusColor(_selectedStatus),
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.check_circle),
              onPressed: () => _submitAttendance(student.id, _selectedStatus),
              color: _getStatusColor(_selectedStatus),
            ),
          ],
        ),
        onTap: () => _showStudentDetail(student),
      ),
    );
  }

  void _showStudentDetail(dynamic student) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(student.getStringValue('name') ?? '学生详情'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('学号: ${student.getStringValue('student_id') ?? ''}'),
            Text('年级: ${student.getStringValue('grade') ?? ''}'),
            Text('班级: ${student.getStringValue('class') ?? ''}'),
            Text('电话: ${student.getStringValue('phone') ?? ''}'),
            Text('家长: ${student.getStringValue('parent_name') ?? ''}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('关闭'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _submitAttendance(student.id, _selectedStatus);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: _getStatusColor(_selectedStatus),
            ),
            child: Text('标记为${_getStatusLabel(_selectedStatus)}'),
          ),
        ],
      ),
    );
  }

  void _toggleNfc() {
    setState(() => _isNfcEnabled = !_isNfcEnabled);
  }

  void _startNfcScan() {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.nfc,
                size: 64,
                color: Colors.blue,
              ),
              const SizedBox(height: 16),
              const Text(
                'NFC扫描中...',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              const Text('请将NFC卡片靠近设备'),
              const SizedBox(height: 24),
              const CircularProgressIndicator(),
              const SizedBox(height: 24),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('取消'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'present':
        return Colors.green;
      case 'late':
        return Colors.orange;
      case 'absent':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'present':
        return '出勤';
      case 'late':
        return '迟到';
      case 'absent':
        return '缺勤';
      default:
        return '未知';
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
