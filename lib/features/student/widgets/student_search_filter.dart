import 'package:flutter/material.dart';

class StudentSearchFilter extends StatefulWidget {
  final Function(String searchTerm, Map<String, dynamic> filters) onFilterChanged;
  final Map<String, dynamic> initialFilters;

  const StudentSearchFilter({
    Key? key,
    required this.onFilterChanged,
    this.initialFilters = const {},
  }) : super(key: key);

  @override
  State<StudentSearchFilter> createState() => _StudentSearchFilterState();
}

class _StudentSearchFilterState extends State<StudentSearchFilter> {
  final _searchController = TextEditingController();
  final _gradeController = TextEditingController();
  final _classController = TextEditingController();
  
  String _selectedGrade = '';
  String _selectedClass = '';
  String _selectedStatus = '';
  String _sortBy = 'name';
  String _sortOrder = 'asc';
  
  final List<String> _grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级'];
  final List<String> _statuses = ['全部', '在校', '毕业', '转学', '休学'];
  final List<Map<String, String>> _sortOptions = [
    {'value': 'name', 'label': '姓名'},
    {'value': 'student_id', 'label': '学号'},
    {'value': 'grade', 'label': '年级'},
    {'value': 'points', 'label': '积分'},
    {'value': 'created', 'label': '创建时间'},
  ];

  @override
  void initState() {
    super.initState();
    _initializeFilters();
  }

  void _initializeFilters() {
    _searchController.text = widget.initialFilters['searchTerm'] ?? '';
    _gradeController.text = widget.initialFilters['grade'] ?? '';
    _classController.text = widget.initialFilters['class'] ?? '';
    _selectedGrade = widget.initialFilters['grade'] ?? '';
    _selectedClass = widget.initialFilters['class'] ?? '';
    _selectedStatus = widget.initialFilters['status'] ?? '';
    _sortBy = widget.initialFilters['sortBy'] ?? 'name';
    _sortOrder = widget.initialFilters['sortOrder'] ?? 'asc';
  }

  void _applyFilters() {
    final filters = {
      'searchTerm': _searchController.text.trim(),
      'grade': _selectedGrade,
      'class': _selectedClass,
      'status': _selectedStatus,
      'sortBy': _sortBy,
      'sortOrder': _sortOrder,
    };
    widget.onFilterChanged(_searchController.text.trim(), filters);
  }

  void _clearFilters() {
    setState(() {
      _searchController.clear();
      _gradeController.clear();
      _selectedGrade = '';
      _selectedClass = '';
      _selectedStatus = '';
      _sortBy = 'name';
      _sortOrder = 'asc';
    });
    _applyFilters();
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      margin: const EdgeInsets.all(16.0),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.search, color: Color(0xFF000000)),
                const SizedBox(width: 8),
                const Text(
                  '搜索和筛选',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF000000),
                  ),
                ),
                const Spacer(),
                TextButton.icon(
                  onPressed: _clearFilters,
                  icon: const Icon(Icons.clear, size: 16),
                  label: const Text('清除'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // 搜索框
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: '搜索学生姓名、学号或家长姓名...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _applyFilters();
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                filled: true,
                fillColor: Colors.grey[50],
              ),
              onChanged: (value) => _applyFilters(),
            ),
            
            const SizedBox(height: 16),
            
            // 筛选选项
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _buildDropdownFilter(
                  '年级',
                  _selectedGrade,
                  _grades,
                  (value) {
                    setState(() {
                      _selectedGrade = value ?? '';
                      _gradeController.text = value ?? '';
                    });
                    _applyFilters();
                  },
                ),
                _buildDropdownFilter(
                  '班级',
                  _selectedClass,
                  _generateClassOptions(),
                  (value) {
                    setState(() {
                      _selectedClass = value ?? '';
                      _classController.text = value ?? '';
                    });
                    _applyFilters();
                  },
                ),
                _buildDropdownFilter(
                  '状态',
                  _selectedStatus,
                  _statuses,
                  (value) {
                    setState(() => _selectedStatus = value ?? '');
                    _applyFilters();
                  },
                ),
                _buildDropdownFilter(
                  '排序',
                  _sortBy,
                  _sortOptions.map((e) => e['value']!).toList(),
                  (value) {
                    setState(() => _sortBy = value ?? 'name');
                    _applyFilters();
                  },
                ),
                _buildSortOrderButton(),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // 快速筛选标签
            _buildQuickFilters(),
          ],
        ),
      ),
    );
  }

  Widget _buildDropdownFilter(
    String label,
    String value,
    List<String> options,
    Function(String?) onChanged,
  ) {
    return SizedBox(
      width: 120,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 4),
          DropdownButtonFormField<String>(
            value: value.isEmpty ? null : value,
            decoration: InputDecoration(
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
              ),
              filled: true,
              fillColor: Colors.grey[50],
            ),
            hint: Text('选择$label'),
            items: options.map((option) {
              return DropdownMenuItem<String>(
                value: option,
                child: Text(
                  option,
                  style: const TextStyle(fontSize: 14),
                  overflow: TextOverflow.ellipsis,
                ),
              );
            }).toList(),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildSortOrderButton() {
    return SizedBox(
      width: 80,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '顺序',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 4),
          IconButton(
            onPressed: () {
              setState(() {
                _sortOrder = _sortOrder == 'asc' ? 'desc' : 'asc';
              });
              _applyFilters();
            },
            icon: Icon(
              _sortOrder == 'asc' ? Icons.arrow_upward : Icons.arrow_downward,
              size: 20,
            ),
            style: IconButton.styleFrom(
              backgroundColor: Colors.grey[100],
              padding: const EdgeInsets.all(8),
            ),
            tooltip: _sortOrder == 'asc' ? '升序' : '降序',
          ),
        ],
      ),
    );
  }

  Widget _buildQuickFilters() {
    final quickFilters = [
      {'label': '高积分', 'value': 'high_points'},
      {'label': '新生', 'value': 'new_students'},
      {'label': '有NFC卡', 'value': 'has_nfc'},
      {'label': '无联系方式', 'value': 'no_contact'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '快速筛选',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF000000),
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: quickFilters.map((filter) {
            return FilterChip(
              label: Text(filter['label']!),
              selected: false,
              onSelected: (selected) {
                // 这里可以添加快速筛选逻辑
                _applyFilters();
              },
              backgroundColor: Colors.grey[100],
              selectedColor: Colors.blue[100],
              checkmarkColor: Colors.blue[700],
            );
          }).toList(),
        ),
      ],
    );
  }

  List<String> _generateClassOptions() {
    if (_selectedGrade.isEmpty) return [];
    
    // 根据年级生成班级选项
    final gradeNumber = _grades.indexOf(_selectedGrade) + 1;
    return List.generate(10, (index) => '${gradeNumber}年级${index + 1}班');
  }

  @override
  void dispose() {
    _searchController.dispose();
    _gradeController.dispose();
    _classController.dispose();
    super.dispose();
  }
}
