import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/finance_provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/auth_provider.dart';
import '../common/stats_card.dart';
import '../common/feature_card.dart';

class AccountantDashboard extends StatefulWidget {
  const AccountantDashboard({super.key});

  @override
  State<AccountantDashboard> createState() => _AccountantDashboardState();
}

class _AccountantDashboardState extends State<AccountantDashboard> {
  @override
  void initState() {
    super.initState();
    // 使用 WidgetsBinding.instance.addPostFrameCallback 来避免在构建过程中调用 setState
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final financeProvider = Provider.of<FinanceProvider>(context, listen: false);
    final studentProvider = Provider.of<StudentProvider>(context, listen: false);

    await Future.wait([
      financeProvider.loadFinancialStats(),
      studentProvider.loadStudents(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('会计工作台'),
        actions: [
          Consumer<AuthProvider>(
            builder: (context, authProvider, child) {
              return PopupMenuButton<String>(
                onSelected: (value) {
                  if (value == 'logout') {
                    authProvider.logout();
                  }
                },
                itemBuilder: (context) => [
                  PopupMenuItem(
                    value: 'logout',
                    child: Row(
                      children: const [
                        Icon(Icons.logout),
                        SizedBox(width: 8),
                        Text('退出登录'),
                      ],
                    ),
                  ),
                ],
                child: CircleAvatar(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  child: Text(
                    authProvider.userProfile?.getStringValue('name')?.substring(0, 1).toUpperCase() ?? 'A',
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Section
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Theme.of(context).colorScheme.primary,
                      Theme.of(context).colorScheme.primary.withOpacity(0.8),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '会计工作台',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Consumer<AuthProvider>(
                      builder: (context, authProvider, child) {
                        return Text(
                          '欢迎，${authProvider.userProfile?.getStringValue('name') ?? '会计'}',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: Colors.white.withOpacity(0.9),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '今天是 ${_getCurrentDate()}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withOpacity(0.8),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Financial Statistics Section
              Text(
                '财务概览',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),

              Consumer<FinanceProvider>(
                builder: (context, financeProvider, child) {
                  return GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 1.5,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    children: [
                      StatsCard(
                        title: '本月收入',
                        value: 'RM ${financeProvider.financialStats['total_payments']?.toStringAsFixed(2) ?? '0.00'}',
                        icon: Icons.attach_money,
                        color: Colors.green,
                      ),
                      StatsCard(
                        title: '待收费用',
                        value: 'RM ${financeProvider.financialStats['pending_amount']?.toStringAsFixed(2) ?? '0.00'}',
                        icon: Icons.pending,
                        color: Colors.orange,
                      ),
                      StatsCard(
                        title: '已付发票',
                        value: '${financeProvider.financialStats['paid_invoice_count']?.toInt() ?? 0}',
                        icon: Icons.check_circle,
                        color: Colors.blue,
                      ),
                      StatsCard(
                        title: '未付发票',
                        value: '${financeProvider.financialStats['unpaid_invoice_count']?.toInt() ?? 0}',
                        icon: Icons.warning,
                        color: Colors.red,
                      ),
                    ],
                  );
                },
              ),

              const SizedBox(height: 32),

              // Quick Actions Section
              Text(
                '快速操作',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),

              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                childAspectRatio: 1.2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                children: [
                  FeatureCard(
                    title: '发票管理',
                    subtitle: '创建和管理发票',
                    icon: Icons.receipt,
                    color: Colors.blue,
                    onTap: () {
                      // Navigate to invoice management
                    },
                  ),
                  FeatureCard(
                    title: '支付记录',
                    subtitle: '查看和管理支付',
                    icon: Icons.payment,
                    color: Colors.green,
                    onTap: () {
                      // Navigate to payment management
                    },
                  ),
                  FeatureCard(
                    title: '费用管理',
                    subtitle: '管理学生费用',
                    icon: Icons.account_balance_wallet,
                    color: Colors.orange,
                    onTap: () {
                      // Navigate to fee management
                    },
                  ),
                  FeatureCard(
                    title: '财务报告',
                    subtitle: '生成财务报告',
                    icon: Icons.analytics,
                    color: Colors.purple,
                    onTap: () {
                      // Navigate to financial reports
                    },
                  ),
                ],
              ),

              const SizedBox(height: 32),

              // Recent Financial Activity Section
              Text(
                '最近财务活动',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),

              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildFinancialActivityItem(
                        icon: Icons.payment,
                        title: '支付记录',
                        subtitle: '张三 支付学费 RM500',
                        time: '2小时前',
                        amount: 'RM500',
                        color: Colors.green,
                      ),
                      const Divider(),
                      _buildFinancialActivityItem(
                        icon: Icons.receipt,
                        title: '发票创建',
                        subtitle: '李四 学费发票',
                        time: '4小时前',
                        amount: 'RM300',
                        color: Colors.blue,
                      ),
                      const Divider(),
                      _buildFinancialActivityItem(
                        icon: Icons.warning,
                        title: '逾期提醒',
                        subtitle: '王五 费用逾期',
                        time: '1天前',
                        amount: 'RM200',
                        color: Colors.orange,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // Financial Summary Chart Placeholder
              Text(
                '收入趋势',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),

              Card(
                child: Container(
                  height: 200,
                  padding: const EdgeInsets.all(16),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.bar_chart,
                          size: 48,
                          color: Theme.of(context).colorScheme.primary.withOpacity(0.5),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          '收入趋势图表',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '图表功能即将推出',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFinancialActivityItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required String time,
    required String amount,
    required Color color,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                amount,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(
                time,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _getCurrentDate() {
    final now = DateTime.now();
    final months = [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];
    return '${now.day} ${months[now.month - 1]} ${now.year}';
  }
}
