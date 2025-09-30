import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_theme.dart';

class SmartHomeworkForm extends StatefulWidget {
  final Function(Map<String, dynamic>) onSubmit;
  final VoidCallback onCancel;
  final bool isSubmitting;

  const SmartHomeworkForm({
    super.key,
    required this.onSubmit,
    required this.onCancel,
    this.isSubmitting = false,
  });

  @override
  State<SmartHomeworkForm> createState() => _SmartHomeworkFormState();
}

class _SmartHomeworkFormState extends State<SmartHomeworkForm>
    with TickerProviderStateMixin {
  late TabController _tabController;
  final PageController _pageController = PageController();
  int _currentStep = 0;
  final int _totalSteps = 4;

  // 表单控制器
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _instructionsController = TextEditingController();
  final _dueDateController = TextEditingController();

  // 表单状态
  String _selectedSubject = '';
  String _selectedGrade = '';
  String _selectedDifficulty = 'medium';
  String _selectedEducationLevel = '';
  List<String> _attachedFiles = [];
  List<String> _selectedTags = [];

  // 智能建议相关
  List<Map<String, dynamic>> _smartSuggestions = [];
  bool _showSuggestions = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _totalSteps, vsync: this);
    _loadSmartSuggestions();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _pageController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    _instructionsController.dispose();
    _dueDateController.dispose();
    super.dispose();
  }

  void _loadSmartSuggestions() {
    // 根据年级和科目生成智能建议
    _smartSuggestions = [
      {
        'title': '数学基础练习',
        'description': '加减乘除运算练习，适合低年级学生',
        'subject': 'math',
        'grade': 'std1',
        'difficulty': 'easy',
        'tags': ['基础', '运算'],
      },
      {
        'title': '马来文阅读理解',
        'description': '阅读理解与语法练习，提升语言能力',
        'subject': 'malay',
        'grade': 'std3',
        'difficulty': 'medium',
        'tags': ['阅读', '语法'],
      },
      {
        'title': '英文词汇记忆',
        'description': '英语单词记忆与运用，扩展词汇量',
        'subject': 'english',
        'grade': 'std2',
        'difficulty': 'easy',
        'tags': ['词汇', '记忆'],
      },
      {
        'title': '科学实验报告',
        'description': '动手实践与观察记录，培养科学思维',
        'subject': 'science',
        'grade': 'std4',
        'difficulty': 'medium',
        'tags': ['实验', '观察'],
      },
    ];
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final isSmallScreen = screenHeight < 700;

    return Container(
      height: screenHeight * 0.85,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildHeader(isSmallScreen),
          _buildProgressIndicator(),
          Expanded(
            child: PageView(
              controller: _pageController,
              onPageChanged: (index) {
                setState(() {
                  _currentStep = index;
                });
                _tabController.animateTo(index);
              },
              children: [
                _buildBasicInfoStep(),
                _buildSubjectGradeStep(),
                _buildContentStep(),
                _buildAdvancedStep(),
              ],
            ),
          ),
          _buildNavigationButtons(),
        ],
      ),
    );
  }

  Widget _buildHeader(bool isSmallScreen) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
        ),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.auto_awesome,
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
                  '智能布置作业',
                  style: TextStyle(
                    fontSize: isSmallScreen ? 20 : 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '马来西亚教育体系智能作业系统',
                  style: TextStyle(
                    fontSize: isSmallScreen ? 12 : 14,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: widget.onCancel,
            icon: const Icon(Icons.close, color: Colors.white),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        children: [
          Row(
            children: List.generate(_totalSteps, (index) {
              final isActive = index <= _currentStep;
              final isCompleted = index < _currentStep;
              
              return Expanded(
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: isCompleted
                            ? const Color(0xFF10B981)
                            : isActive
                                ? const Color(0xFF3B82F6)
                                : const Color(0xFFE2E8F0),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: isCompleted
                            ? const Icon(Icons.check, color: Colors.white, size: 16)
                            : Text(
                                '${index + 1}',
                                style: TextStyle(
                                  color: isActive ? Colors.white : const Color(0xFF6B7280),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                      ),
                    ),
                    if (index < _totalSteps - 1)
                      Expanded(
                        child: Container(
                          height: 2,
                          color: isCompleted
                              ? const Color(0xFF10B981)
                              : const Color(0xFFE2E8F0),
                        ),
                      ),
                  ],
                ),
              );
            }),
          ),
          const SizedBox(height: 8),
          Text(
            _getStepTitle(_currentStep),
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF374151),
            ),
          ),
        ],
      ),
    );
  }

  String _getStepTitle(int step) {
    switch (step) {
      case 0:
        return '基本信息';
      case 1:
        return '科目与年级';
      case 2:
        return '作业内容';
      case 3:
        return '高级设置';
      default:
        return '';
    }
  }

  Widget _buildBasicInfoStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_showSuggestions) _buildSmartSuggestions(),
          const SizedBox(height: 24),
          _buildFormCard(
            '作业标题',
            '为您的作业起一个清晰的标题',
            Icons.title,
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                hintText: '例如：数学练习第3章',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.edit, color: Color(0xFF3B82F6)),
              ),
              onChanged: (value) => setState(() {}),
            ),
          ),
          const SizedBox(height: 20),
          _buildFormCard(
            '作业描述',
            '详细描述作业内容和要求',
            Icons.description,
            TextFormField(
              controller: _descriptionController,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: '请详细描述作业要求和内容...',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.article, color: Color(0xFF3B82F6)),
              ),
              onChanged: (value) => setState(() {}),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectGradeStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          _buildFormCard(
            '教育级别',
            '选择小学或中学',
            Icons.school,
            _buildEducationLevelSelector(),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _buildFormCard(
                  '年级',
                  '选择年级',
                  Icons.grade,
                  _buildGradeSelector(),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildFormCard(
                  '科目',
                  '选择科目',
                  Icons.subject,
                  _buildSubjectSelector(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _buildFormCard(
            '难度等级',
            '选择作业难度',
            Icons.speed,
            _buildDifficultySelector(),
          ),
        ],
      ),
    );
  }

  Widget _buildContentStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          _buildFormCard(
            '特殊说明',
            '添加特殊要求或说明',
            Icons.info_outline,
            TextFormField(
              controller: _instructionsController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: '例如：需要家长签名、使用特定格式等...',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.notes, color: Color(0xFF3B82F6)),
              ),
            ),
          ),
          const SizedBox(height: 20),
          _buildFormCard(
            '截止日期',
            '设置作业截止日期',
            Icons.calendar_today,
            TextFormField(
              controller: _dueDateController,
              readOnly: true,
              decoration: const InputDecoration(
                hintText: '选择截止日期',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.event, color: Color(0xFF3B82F6)),
                suffixIcon: Icon(Icons.arrow_drop_down, color: Color(0xFF3B82F6)),
              ),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now().add(const Duration(days: 1)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (date != null) {
                  _dueDateController.text = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
                }
              },
            ),
          ),
          const SizedBox(height: 20),
          _buildFileUploadCard(),
        ],
      ),
    );
  }

  Widget _buildAdvancedStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          _buildFormCard(
            '作业标签',
            '添加标签便于分类管理',
            Icons.label,
            _buildTagsSelector(),
          ),
          const SizedBox(height: 20),
          _buildFormCard(
            '预计完成时间',
            '预估学生完成作业的时间',
            Icons.timer,
            _buildEstimatedTimeSelector(),
          ),
          const SizedBox(height: 20),
          _buildFormCard(
            '作业分值',
            '设置作业的分值',
            Icons.star,
            _buildPointsSelector(),
          ),
        ],
      ),
    );
  }

  Widget _buildSmartSuggestions() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF0F9FF),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.lightbulb, color: Color(0xFF3B82F6), size: 20),
              const SizedBox(width: 8),
              const Text(
                '智能建议',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF3B82F6),
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: () => setState(() => _showSuggestions = false),
                icon: const Icon(Icons.close, size: 16),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._smartSuggestions.take(3).map((suggestion) => _buildSuggestionChip(suggestion)),
        ],
      ),
    );
  }

  Widget _buildSuggestionChip(Map<String, dynamic> suggestion) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () {
          _titleController.text = suggestion['title'];
          _descriptionController.text = suggestion['description'];
          _selectedSubject = suggestion['subject'];
          _selectedGrade = suggestion['grade'];
          _selectedDifficulty = suggestion['difficulty'];
          setState(() {});
        },
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      suggestion['title'],
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    Text(
                      suggestion['description'],
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.add_circle_outline, color: Color(0xFF3B82F6), size: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFormCard(String title, String subtitle, IconData icon, Widget child) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
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
                child: Icon(icon, color: const Color(0xFF3B82F6), size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF374151),
                      ),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildEducationLevelSelector() {
    return Row(
      children: [
        _buildLevelOption('primary', '小学', Icons.child_care, const Color(0xFF10B981)),
        const SizedBox(width: 12),
        _buildLevelOption('secondary', '中学', Icons.school, const Color(0xFF3B82F6)),
      ],
    );
  }

  Widget _buildLevelOption(String value, String label, IconData icon, Color color) {
    final isSelected = _selectedEducationLevel == value;
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedEducationLevel = value;
            _selectedGrade = ''; // 清空年级选择
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
          decoration: BoxDecoration(
            color: isSelected ? color.withOpacity(0.1) : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? color : const Color(0xFFE2E8F0),
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? color : const Color(0xFF6B7280), size: 24),
              const SizedBox(height: 8),
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  color: isSelected ? color : const Color(0xFF6B7280),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGradeSelector() {
    final grades = _selectedEducationLevel == 'primary'
        ? [
            {'value': 'std1', 'label': '一年级'},
            {'value': 'std2', 'label': '二年级'},
            {'value': 'std3', 'label': '三年级'},
            {'value': 'std4', 'label': '四年级'},
            {'value': 'std5', 'label': '五年级'},
            {'value': 'std6', 'label': '六年级'},
          ]
        : [
            {'value': 'frm1', 'label': '中一'},
            {'value': 'frm2', 'label': '中二'},
            {'value': 'frm3', 'label': '中三'},
            {'value': 'frm4', 'label': '中四'},
            {'value': 'frm5', 'label': '中五'},
          ];

    return DropdownButtonFormField<String>(
      value: _selectedGrade.isEmpty ? null : _selectedGrade,
      decoration: const InputDecoration(
        border: OutlineInputBorder(),
        hintText: '选择年级',
      ),
      items: grades.map((grade) {
        return DropdownMenuItem(
          value: grade['value'],
          child: Text(grade['label']!),
        );
      }).toList(),
      onChanged: (value) {
        setState(() {
          _selectedGrade = value ?? '';
        });
      },
    );
  }

  Widget _buildSubjectSelector() {
    const subjects = [
      {'value': 'math', 'label': '数学'},
      {'value': 'malay', 'label': '马来文'},
      {'value': 'english', 'label': '英文'},
      {'value': 'chinese', 'label': '华文'},
      {'value': 'science', 'label': '科学'},
      {'value': 'moral', 'label': '道德教育'},
      {'value': 'history', 'label': '历史'},
      {'value': 'geography', 'label': '地理'},
      {'value': 'art', 'label': '美术'},
      {'value': 'pe', 'label': '体育'},
      {'value': 'music', 'label': '音乐'},
      {'value': 'ict', 'label': '资讯科技'},
    ];

    return DropdownButtonFormField<String>(
      value: _selectedSubject.isEmpty ? null : _selectedSubject,
      decoration: const InputDecoration(
        border: OutlineInputBorder(),
        hintText: '选择科目',
      ),
      items: subjects.map((subject) {
        return DropdownMenuItem(
          value: subject['value'],
          child: Text(subject['label']!),
        );
      }).toList(),
      onChanged: (value) {
        setState(() {
          _selectedSubject = value ?? '';
        });
      },
    );
  }

  Widget _buildDifficultySelector() {
    return Row(
      children: [
        _buildDifficultyOption('easy', '简单', Icons.sentiment_very_satisfied, const Color(0xFF10B981)),
        const SizedBox(width: 12),
        _buildDifficultyOption('medium', '中等', Icons.sentiment_neutral, const Color(0xFFF59E0B)),
        const SizedBox(width: 12),
        _buildDifficultyOption('hard', '困难', Icons.sentiment_very_dissatisfied, const Color(0xFFEF4444)),
      ],
    );
  }

  Widget _buildDifficultyOption(String value, String label, IconData icon, Color color) {
    final isSelected = _selectedDifficulty == value;
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedDifficulty = value;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          decoration: BoxDecoration(
            color: isSelected ? color.withOpacity(0.1) : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected ? color : const Color(0xFFE2E8F0),
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? color : const Color(0xFF6B7280), size: 24),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  color: isSelected ? color : const Color(0xFF6B7280),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFileUploadCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
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
                child: const Icon(Icons.attach_file, color: Color(0xFF3B82F6), size: 20),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '文件附件',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF374151),
                      ),
                    ),
                    Text(
                      '上传作业相关文件',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFFE2E8F0), style: BorderStyle.solid),
              borderRadius: BorderRadius.circular(12),
              color: const Color(0xFFF9FAFB),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.cloud_upload_outlined,
                  size: 48,
                  color: const Color(0xFF3B82F6).withOpacity(0.6),
                ),
                const SizedBox(height: 12),
                const Text(
                  '拖拽文件到此处或点击上传',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF374151),
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  '支持 PDF, DOC, DOCX, JPG, PNG 格式',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildUploadButton('照片', Icons.photo_camera, () => _uploadFile('image')),
                    _buildUploadButton('文件', Icons.attach_file, () => _uploadFile('document')),
                  ],
                ),
              ],
            ),
          ),
          if (_attachedFiles.isNotEmpty) ...[
            const SizedBox(height: 16),
            _buildAttachedFilesList(),
          ],
        ],
      ),
    );
  }

  Widget _buildUploadButton(String label, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF3B82F6),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttachedFilesList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '已上传文件',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF374151),
          ),
        ),
        const SizedBox(height: 8),
        ..._attachedFiles.map((file) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Icon(
                file.contains('.pdf') ? Icons.picture_as_pdf : Icons.image,
                size: 20,
                color: const Color(0xFF3B82F6),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  file,
                  style: const TextStyle(fontSize: 14),
                ),
              ),
              InkWell(
                onTap: () => _removeFile(file),
                child: const Icon(
                  Icons.close,
                  size: 20,
                  color: Color(0xFFEF4444),
                ),
              ),
            ],
          ),
        )),
      ],
    );
  }

  Widget _buildTagsSelector() {
    const availableTags = ['基础', '进阶', '复习', '预习', '实验', '阅读', '写作', '计算', '记忆', '理解'];
    
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: availableTags.map((tag) {
        final isSelected = _selectedTags.contains(tag);
        return InkWell(
          onTap: () {
            setState(() {
              if (isSelected) {
                _selectedTags.remove(tag);
              } else {
                _selectedTags.add(tag);
              }
            });
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFF3B82F6) : Colors.transparent,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFFE2E8F0),
              ),
            ),
            child: Text(
              tag,
              style: TextStyle(
                fontSize: 12,
                color: isSelected ? Colors.white : const Color(0xFF6B7280),
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildEstimatedTimeSelector() {
    return DropdownButtonFormField<String>(
      decoration: const InputDecoration(
        border: OutlineInputBorder(),
        hintText: '选择预计时间',
      ),
      items: const [
        DropdownMenuItem(value: '15', child: Text('15分钟')),
        DropdownMenuItem(value: '30', child: Text('30分钟')),
        DropdownMenuItem(value: '45', child: Text('45分钟')),
        DropdownMenuItem(value: '60', child: Text('1小时')),
        DropdownMenuItem(value: '90', child: Text('1.5小时')),
        DropdownMenuItem(value: '120', child: Text('2小时')),
      ],
      onChanged: (value) {
        // 处理预计时间选择
      },
    );
  }

  Widget _buildPointsSelector() {
    return TextFormField(
      keyboardType: TextInputType.number,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      decoration: const InputDecoration(
        border: OutlineInputBorder(),
        hintText: '输入分值',
        suffixText: '分',
      ),
      onChanged: (value) {
        // 处理分值输入
      },
    );
  }

  Widget _buildNavigationButtons() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: const Color(0xFFE2E8F0))),
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: ElevatedButton(
                onPressed: () {
                  _pageController.previousPage(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6B7280),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  '上一步',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          if (_currentStep > 0) const SizedBox(width: 16),
          Expanded(
            child: ElevatedButton(
              onPressed: _currentStep < _totalSteps - 1
                  ? () {
                      _pageController.nextPage(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                      );
                    }
                  : _canSubmit() ? _submitForm : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3B82F6),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: widget.isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text(
                      _currentStep < _totalSteps - 1 ? '下一步' : '布置作业',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  bool _canSubmit() {
    return _titleController.text.isNotEmpty &&
        _descriptionController.text.isNotEmpty &&
        _selectedSubject.isNotEmpty &&
        _selectedGrade.isNotEmpty &&
        _dueDateController.text.isNotEmpty;
  }

  void _uploadFile(String type) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    String fileName;
    
    if (type == 'image') {
      fileName = 'homework_image_$timestamp.jpg';
    } else {
      fileName = 'homework_document_$timestamp.pdf';
    }
    
    setState(() {
      _attachedFiles.add(fileName);
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('已上传$fileName'),
        backgroundColor: const Color(0xFF10B981),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _removeFile(String fileName) {
    setState(() {
      _attachedFiles.remove(fileName);
    });
  }

  void _submitForm() {
    final formData = {
      'title': _titleController.text,
      'description': _descriptionController.text,
      'instructions': _instructionsController.text,
      'subject': _selectedSubject,
      'grade': _selectedGrade,
      'education_level': _selectedEducationLevel,
      'difficulty_level': _selectedDifficulty,
      'due_date': _dueDateController.text,
      'attached_files': _attachedFiles,
      'tags': _selectedTags,
    };
    
    widget.onSubmit(formData);
  }
}
