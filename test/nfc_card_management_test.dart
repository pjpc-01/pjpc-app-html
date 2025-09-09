import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:pjpc_app_flutter/providers/nfc_card_provider.dart';
import 'package:pjpc_app_flutter/providers/student_provider.dart';
import 'package:pjpc_app_flutter/screens/nfc/teacher_nfc_management_screen.dart';
import 'package:pjpc_app_flutter/services/pocketbase_service.dart';

void main() {
  group('NFC Card Management Tests', () {
    testWidgets('Teacher NFC Management Screen displays correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: MultiProvider(
            providers: [
              Provider(create: (_) => PocketBaseService.instance),
              ChangeNotifierProvider(create: (_) => NfcCardProvider()),
              ChangeNotifierProxyProvider<PocketBaseService, StudentProvider>(
                create: (context) => StudentProvider(pocketBaseService: context.read<PocketBaseService>()),
                update: (context, pocketBaseService, previous) => 
                    previous ?? StudentProvider(pocketBaseService: pocketBaseService),
              ),
            ],
            child: const TeacherNfcManagementScreen(),
          ),
        ),
      );

      // 验证界面标题
      expect(find.text('NFC卡管理'), findsOneWidget);
      
      // 验证搜索框
      expect(find.byType(TextField), findsOneWidget);
      
      // 验证筛选器
      expect(find.text('全部'), findsOneWidget);
      expect(find.text('正常'), findsOneWidget);
      expect(find.text('丢失'), findsOneWidget);
      
      // 验证手动考勤按钮
      expect(find.text('手动考勤'), findsOneWidget);
    });

    test('NFC Card Status Display Text', () {
      final provider = NfcCardProvider();
      
      expect(provider.getStatusDisplayText(NfcCardStatus.normal), equals('正常'));
      expect(provider.getStatusDisplayText(NfcCardStatus.lost), equals('丢失'));
      expect(provider.getStatusDisplayText(NfcCardStatus.damaged), equals('损坏'));
      expect(provider.getStatusDisplayText(NfcCardStatus.replacing), equals('补办中'));
      expect(provider.getStatusDisplayText(NfcCardStatus.suspended), equals('暂停使用'));
    });

    test('NFC Card Status Colors', () {
      final provider = NfcCardProvider();
      
      expect(provider.getStatusColor(NfcCardStatus.normal), equals(Colors.green));
      expect(provider.getStatusColor(NfcCardStatus.lost), equals(Colors.red));
      expect(provider.getStatusColor(NfcCardStatus.damaged), equals(Colors.orange));
      expect(provider.getStatusColor(NfcCardStatus.replacing), equals(Colors.blue));
      expect(provider.getStatusColor(NfcCardStatus.suspended), equals(Colors.grey));
    });

    test('Urgency Level Display', () {
      final provider = NfcCardProvider();
      
      expect(provider.getUrgencyDisplayText('low'), equals('低'));
      expect(provider.getUrgencyDisplayText('normal'), equals('普通'));
      expect(provider.getUrgencyDisplayText('high'), equals('高'));
      expect(provider.getUrgencyDisplayText('urgent'), equals('紧急'));
    });

    test('Request Status Display', () {
      final provider = NfcCardProvider();
      
      expect(provider.getRequestStatusDisplayText('pending'), equals('待审核'));
      expect(provider.getRequestStatusDisplayText('approved'), equals('已批准'));
      expect(provider.getRequestStatusDisplayText('rejected'), equals('已拒绝'));
      expect(provider.getRequestStatusDisplayText('completed'), equals('已完成'));
    });
  });
}
