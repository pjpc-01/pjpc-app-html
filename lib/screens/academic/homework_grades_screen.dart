import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/student_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/statistics_card.dart';

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

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            _buildSliverAppBar(),
            _buildTabBar(),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildHomeworkTab(),
            _buildGradesTab(),
            _buildStatisticsTab(),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddHomeworkDialog(),
        icon: const Icon(Icons.add),
        label: const Text('布置作业'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 120.0,
      floating: false,
      pinned: true,
      backgroundColor: AppTheme.primaryColor,
      flexibleSpace: FlexibleSpaceBar(
        title: const Text(
          '作业与成绩',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppTheme.primaryColor,
                AppTheme.accentColor,
              ],
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  _buildSearchBar(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: '搜索学生、作业或成绩...',
          hintStyle: TextStyle(color: AppTheme.textSecondary),
          prefixIcon: const Icon(Icons.search, color: AppTheme.primaryColor),
          suffixIcon: IconButton(
            icon: const Icon(Icons.filter_list, color: AppTheme.primaryColor),
            onPressed: _showFilterDialog,
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm,
          ),
        ),
        onChanged: (value) {
          setState(() {});
        },
      ),
    );
  }

  Widget _buildTabBar() {
    return SliverToBoxAdapter(
      child: Container(
        color: AppTheme.cardColor,
        child: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primaryColor,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: '作业管理', icon: Icon(Icons.assignment, size: 16)),
            Tab(text: '成绩录入', icon: Icon(Icons.grade, size: 16)),
            Tab(text: '统计分析', icon: Icon(Icons.analytics, size: 16)),
          ],
        ),
      ),
    );
  }

  Widget _buildHomeworkTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildQuickStats(),
          const SizedBox(height: AppSpacing.lg),
          _buildHomeworkList(),
        ],
      ),
    );
  }

  Widget _buildGradesTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildGradeStats(),
          const SizedBox(height: AppSpacing.lg),
          _buildGradeList(),
        ],
      ),
    );
  }

  Widget _buildStatisticsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildOverallStats(),
          const SizedBox(height: AppSpacing.lg),
          _buildSubjectStats(),
          const SizedBox(height: AppSpacing.lg),
          _buildClassStats(),
        ],
      ),
    );
  }

  Widget _buildQuickStats() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '作业统计',
              style: AppTextStyles.headline6?.copyWith(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: StatisticsCard(
                    title: '待批改',
                    value: '12',
                    subtitle: '份',
                    icon: Icons.pending_actions,
                    color: AppTheme.warningColor,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: StatisticsCard(
                    title: '已批改',
                    value: '45',
                    subtitle: '份',
                    icon: Icons.check_circle,
                    color: AppTheme.successColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(
                  child: StatisticsCard(
                    title: '未提交',
                    value: '8',
                    subtitle: '份',
                    icon: Icons.cancel,
                    color: AppTheme.errorColor,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: StatisticsCard(
                    title: '完成率',
                    value: '85.2',
                    subtitle: '%',
                    icon: Icons.trending_up,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGradeStats() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '成绩统计',
              style: AppTextStyles.headline6?.copyWith(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: StatisticsCard(
                    title: '平均分',
                    value: '85.2',
                    subtitle: '分',
                    icon: Icons.analytics,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: StatisticsCard(
                    title: '最高分',
                    value: '98',
                    subtitle: '分',
                    icon: Icons.trending_up,
                    color: AppTheme.successColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(
                  child: StatisticsCard(
                    title: '及格率',
                    value: '92.5',
                    subtitle: '%',
                    icon: Icons.check_circle,
                    color: AppTheme.successColor,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: StatisticsCard(
                    title: '优秀率',
                    value: '68.3',
                    subtitle: '%',
                    icon: Icons.star,
                    color: AppTheme.accentColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOverallStats() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '总体统计',
              style: AppTextStyles.headline6?.copyWith(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: StatisticsCard(
                    title: '总作业数',
                    value: '156',
                    subtitle: '份',
                    icon: Icons.assignment,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: StatisticsCard(
                    title: '总成绩数',
                    value: '1,234',
                    subtitle: '条',
                    icon: Icons.grade,
                    color: AppTheme.accentColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubjectStats() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '科目统计',
              style: AppTextStyles.headline6?.copyWith(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            _buildSubjectItem('数学', 88.5, 45),
            _buildSubjectItem('语文', 85.2, 42),
            _buildSubjectItem('英语', 82.8, 38),
            _buildSubjectItem('物理', 90.1, 31),
          ],
        ),
      ),
    );
  }

  Widget _buildClassStats() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '班级统计',
              style: AppTextStyles.headline6?.copyWith(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            _buildClassItem('高三(1)班', 87.3, 28),
            _buildClassItem('高三(2)班', 85.8, 32),
            _buildClassItem('高三(3)班', 89.1, 25),
          ],
        ),
      ),
    );
  }

  Widget _buildSubjectItem(String subject, double average, int count) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        children: [
          Expanded(
            child: Text(
              subject,
              style: AppTextStyles.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Text(
            '平均: ${average.toStringAsFixed(1)}分',
            style: AppTextStyles.bodyMedium?.copyWith(
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Text(
            '($count人)',
            style: AppTextStyles.bodySmall?.copyWith(
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildClassItem(String className, double average, int count) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        children: [
          Expanded(
            child: Text(
              className,
              style: AppTextStyles.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Text(
            '平均: ${average.toStringAsFixed(1)}分',
            style: AppTextStyles.bodyMedium?.copyWith(
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Text(
            '($count人)',
            style: AppTextStyles.bodySmall?.copyWith(
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHomeworkList() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '最近作业',
                  style: AppTextStyles.headline6?.copyWith(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.refresh, size: 16),
                  label: const Text('刷新'),
                ),
              ],
            ),
          ),
          _buildHomeworkItem('数学作业 #001', '高三(1)班', '2024-01-15', '待批改', AppTheme.warningColor),
          _buildHomeworkItem('语文作文', '高三(2)班', '2024-01-14', '已批改', AppTheme.successColor),
          _buildHomeworkItem('英语听力', '高三(1)班', '2024-01-13', '未提交', AppTheme.errorColor),
          _buildHomeworkItem('物理实验报告', '高三(3)班', '2024-01-12', '已批改', AppTheme.successColor),
        ],
      ),
    );
  }

  Widget _buildGradeList() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '最近成绩',
                  style: AppTextStyles.headline6?.copyWith(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('录入成绩'),
                ),
              ],
            ),
          ),
          _buildGradeItem('张三', '数学', 95, 'A+', AppTheme.successColor),
          _buildGradeItem('李四', '语文', 88, 'A', AppTheme.successColor),
          _buildGradeItem('王五', '英语', 76, 'B', AppTheme.warningColor),
          _buildGradeItem('赵六', '物理', 92, 'A', AppTheme.successColor),
        ],
      ),
    );
  }

  Widget _buildHomeworkItem(String title, String class_, String date, String status, Color statusColor) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
        child: const Icon(Icons.assignment, color: AppTheme.primaryColor),
      ),
      title: Text(
        title,
        style: AppTextStyles.bodyMedium?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text('$class_ · $date'),
      trailing: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: statusColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(
          status,
          style: AppTextStyles.bodySmall?.copyWith(
            color: statusColor,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      onTap: () => _showHomeworkDetails(title),
    );
  }

  Widget _buildGradeItem(String student, String subject, int score, String grade, Color gradeColor) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: AppTheme.accentColor.withOpacity(0.1),
        child: const Icon(Icons.grade, color: AppTheme.accentColor),
      ),
      title: Text(
        student,
        style: AppTextStyles.bodyMedium?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(subject),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$score分',
            style: AppTextStyles.bodyMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: gradeColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              grade,
              style: AppTextStyles.bodySmall?.copyWith(
                color: gradeColor,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
      onTap: () => _showGradeDetails(student, subject, score),
    );
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('筛选条件'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: _selectedClass,
              decoration: const InputDecoration(labelText: '班级'),
              items: ['全部班级', '高三(1)班', '高三(2)班', '高三(3)班']
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: (value) => setState(() => _selectedClass = value!),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedSubject,
              decoration: const InputDecoration(labelText: '科目'),
              items: ['全部科目', '数学', '语文', '英语', '物理']
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: (value) => setState(() => _selectedSubject = value!),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {});
            },
            child: const Text('应用'),
          ),
        ],
      ),
    );
  }

  void _showAddHomeworkDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('布置作业'),
        content: const Text('作业布置功能开发中...'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  void _showHomeworkDetails(String title) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: const Text('作业详情功能开发中...'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('关闭'),
          ),
        ],
      ),
    );
  }

  void _showGradeDetails(String student, String subject, int score) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('$student - $subject'),
        content: Text('成绩: $score分'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('关闭'),
          ),
        ],
      ),
    );
  }
}
