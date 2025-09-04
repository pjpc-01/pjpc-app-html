import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/finance_provider.dart';
import '../../providers/attendance_provider.dart';
import '../../widgets/dashboard/admin_dashboard.dart';
import '../../widgets/dashboard/teacher_dashboard.dart';
import '../../widgets/dashboard/parent_dashboard.dart';
import '../../widgets/dashboard/accountant_dashboard.dart';
import '../auth/login_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  // int _selectedIndex = 0; // Removed unused field

  @override
  void initState() {
    super.initState();
    // 使用 WidgetsBinding.instance.addPostFrameCallback 来避免在构建过程中调用 setState
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadInitialData();
    });
  }

  Future<void> _loadInitialData() async {
    final studentProvider = Provider.of<StudentProvider>(context, listen: false);
    final financeProvider = Provider.of<FinanceProvider>(context, listen: false);
    final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);

    // Load data in parallel
    await Future.wait([
      studentProvider.loadStudents(),
      studentProvider.loadFeeItems(),
      studentProvider.loadStudentFees(),
      financeProvider.loadInvoices(),
      financeProvider.loadPayments(),
      attendanceProvider.loadAttendanceRecords(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        // Check authentication status
        if (!authProvider.isAuthenticated) {
          return const LoginScreen();
        }

        // Check if user account is pending approval
        if (authProvider.isPendingApproval) {
          return _buildPendingApprovalScreen(authProvider);
        }

        // Check if user account is suspended
        if (authProvider.isSuspended) {
          return _buildSuspendedScreen(authProvider);
        }

        // Show appropriate dashboard based on user role
        return _buildDashboard(authProvider);
      },
    );
  }

  Widget _buildDashboard(AuthProvider authProvider) {
    final role = authProvider.userProfile?.getStringValue('role') ?? 'admin';
    
    switch (role) {
      case 'admin':
        return const AdminDashboard();
      case 'teacher':
        return const TeacherDashboard();
      case 'parent':
        return const ParentDashboard();
      case 'accountant':
        return const AccountantDashboard();
      default:
        return const AdminDashboard();
    }
  }

  Widget _buildPendingApprovalScreen(AuthProvider authProvider) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.hourglass_empty,
                    size: 64,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '账户审核中',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '您的账户正在等待管理员审核',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    '审核通过后您将收到邮件通知',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () async {
                      await authProvider.logout();
                    },
                    child: const Text('退出登录'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSuspendedScreen(AuthProvider authProvider) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.block,
                    size: 64,
                    color: Theme.of(context).colorScheme.error,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '账户已暂停',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '您的账户已被管理员暂停使用',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    '如有疑问请联系管理员',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () async {
                      await authProvider.logout();
                    },
                    child: const Text('退出登录'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
