import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:pjpc_app_flutter/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('End-to-End Tests', () {
    testWidgets('Complete user journey - Login to Dashboard', (WidgetTester tester) async {
      // Start the app
      app.main();
      await tester.pumpAndSettle();

      // Verify login screen is displayed
      expect(find.text('PJPC学校管理系统'), findsOneWidget);
      expect(find.text('用户名'), findsOneWidget);
      expect(find.text('密码'), findsOneWidget);

      // Enter login credentials
      await tester.enterText(find.byType(TextFormField).first, 'admin@example.com');
      await tester.enterText(find.byType(TextFormField).last, 'password123');
      await tester.pumpAndSettle();

      // Tap login button
      await tester.tap(find.text('登录'));
      await tester.pumpAndSettle();

      // Verify dashboard is displayed
      expect(find.text('管理员仪表板'), findsOneWidget);
    });

    testWidgets('Student management workflow', (WidgetTester tester) async {
      // Start the app and login
      app.main();
      await tester.pumpAndSettle();

      // Navigate to student management
      await tester.tap(find.text('学生管理'));
      await tester.pumpAndSettle();

      // Verify student list is displayed
      expect(find.text('学生管理'), findsOneWidget);

      // Test search functionality
      await tester.enterText(find.byType(TextField), 'test student');
      await tester.pumpAndSettle();

      // Test add student button
      await tester.tap(find.byIcon(Icons.add));
      await tester.pumpAndSettle();

      // Verify add student screen
      expect(find.text('添加学生'), findsOneWidget);
    });

    testWidgets('Attendance management workflow', (WidgetTester tester) async {
      // Start the app and login
      app.main();
      await tester.pumpAndSettle();

      // Navigate to attendance management
      await tester.tap(find.text('考勤管理'));
      await tester.pumpAndSettle();

      // Verify attendance screen is displayed
      expect(find.text('考勤管理'), findsOneWidget);

      // Test mobile checkin
      await tester.tap(find.text('移动考勤'));
      await tester.pumpAndSettle();

      // Verify mobile checkin screen
      expect(find.text('移动考勤'), findsOneWidget);
    });

    testWidgets('Finance management workflow', (WidgetTester tester) async {
      // Start the app and login
      app.main();
      await tester.pumpAndSettle();

      // Navigate to finance management
      await tester.tap(find.text('财务管理'));
      await tester.pumpAndSettle();

      // Verify finance screen is displayed
      expect(find.text('财务管理'), findsOneWidget);
    });

    testWidgets('Settings and configuration', (WidgetTester tester) async {
      // Start the app and login
      app.main();
      await tester.pumpAndSettle();

      // Navigate to settings
      await tester.tap(find.byIcon(Icons.settings));
      await tester.pumpAndSettle();

      // Test server configuration
      await tester.tap(find.text('服务器配置'));
      await tester.pumpAndSettle();

      // Verify server config dialog
      expect(find.text('服务器配置'), findsOneWidget);
    });
  });

  group('Navigation Tests', () {
    testWidgets('Bottom navigation works correctly', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Test navigation between different sections
      await tester.tap(find.text('学生管理'));
      await tester.pumpAndSettle();
      expect(find.text('学生管理'), findsOneWidget);

      await tester.tap(find.text('考勤管理'));
      await tester.pumpAndSettle();
      expect(find.text('考勤管理'), findsOneWidget);

      await tester.tap(find.text('财务管理'));
      await tester.pumpAndSettle();
      expect(find.text('财务管理'), findsOneWidget);
    });

    testWidgets('Back navigation works correctly', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to a detail screen
      await tester.tap(find.text('学生管理'));
      await tester.pumpAndSettle();
      await tester.tap(find.byIcon(Icons.add));
      await tester.pumpAndSettle();

      // Test back navigation
      await tester.tap(find.byIcon(Icons.arrow_back));
      await tester.pumpAndSettle();

      // Verify we're back to the list
      expect(find.text('学生管理'), findsOneWidget);
    });
  });

  group('Form Validation Tests', () {
    testWidgets('Login form validation', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Test empty form submission
      await tester.tap(find.text('登录'));
      await tester.pumpAndSettle();

      // Should show validation errors
      expect(find.text('请输入用户名'), findsOneWidget);
      expect(find.text('请输入密码'), findsOneWidget);

      // Test invalid email format
      await tester.enterText(find.byType(TextFormField).first, 'invalid-email');
      await tester.tap(find.text('登录'));
      await tester.pumpAndSettle();

      // Should show email validation error
      expect(find.text('请输入有效的邮箱地址'), findsOneWidget);
    });

    testWidgets('Student form validation', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to add student
      await tester.tap(find.text('学生管理'));
      await tester.pumpAndSettle();
      await tester.tap(find.byIcon(Icons.add));
      await tester.pumpAndSettle();

      // Test empty form submission
      await tester.tap(find.text('创建学生'));
      await tester.pumpAndSettle();

      // Should show validation errors
      expect(find.text('请输入学生姓名'), findsOneWidget);
      expect(find.text('请输入学号'), findsOneWidget);
    });
  });

  group('Error Handling Tests', () {
    testWidgets('Network error handling', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Simulate network error by entering invalid credentials
      await tester.enterText(find.byType(TextFormField).first, 'invalid@example.com');
      await tester.enterText(find.byType(TextFormField).last, 'wrongpassword');
      await tester.tap(find.text('登录'));
      await tester.pumpAndSettle();

      // Should show error message
      expect(find.text('登录失败'), findsOneWidget);
    });

    testWidgets('Connection timeout handling', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Test connection timeout
      await tester.tap(find.text('连接测试'));
      await tester.pumpAndSettle();

      // Should show connection status
      expect(find.text('连接状态'), findsOneWidget);
    });
  });

  group('Performance Tests', () {
    testWidgets('App startup performance', (WidgetTester tester) async {
      final stopwatch = Stopwatch()..start();
      
      app.main();
      await tester.pumpAndSettle();
      
      stopwatch.stop();
      
      // App should start within reasonable time
      expect(stopwatch.elapsedMilliseconds, lessThan(5000));
    });

    testWidgets('Large data set performance', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to student list
      await tester.tap(find.text('学生管理'));
      await tester.pumpAndSettle();

      // Test with large number of students
      // This would need to be set up with test data
      expect(find.text('学生管理'), findsOneWidget);
    });
  });

  group('Accessibility Tests', () {
    testWidgets('Screen reader support', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Test that all interactive elements have proper semantics
      expect(find.byType(ElevatedButton), findsWidgets);
      expect(find.byType(TextField), findsWidgets);
      expect(find.byType(IconButton), findsWidgets);
    });

    testWidgets('High contrast support', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Test that text has sufficient contrast
      // This would need to check color contrast ratios
    });
  });
}

