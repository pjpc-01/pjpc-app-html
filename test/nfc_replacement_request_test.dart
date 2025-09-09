import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:pjpc_app_flutter/providers/nfc_card_provider.dart';
import 'package:pjpc_app_flutter/providers/student_provider.dart';
import 'package:pjpc_app_flutter/screens/nfc/nfc_replacement_request_dialog.dart';
import 'package:pjpc_app_flutter/services/pocketbase_service.dart';

void main() {
  group('NFC Replacement Request Tests', () {
    testWidgets('NFC Replacement Request Dialog displays correctly', (WidgetTester tester) async {
      // 创建模拟学生数据
      final mockStudent = {
        'id': 'STU001',
        'student_name': '张三',
        'student_id': 'STU001',
        'standard': '一年级A班',
      };

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
            child: Scaffold(
              body: NfcReplacementRequestDialog(student: mockStudent),
            ),
          ),
        ),
      );

      // 验证对话框标题
      expect(find.text('NFC卡补办申请'), findsOneWidget);
      
      // 验证学生信息显示
      expect(find.text('张三'), findsOneWidget);
      expect(find.text('STU001'), findsOneWidget);
      expect(find.text('一年级A班'), findsOneWidget);
      
      // 验证表单字段
      expect(find.text('丢失原因 *'), findsOneWidget);
      expect(find.text('丢失时间 *'), findsOneWidget);
      expect(find.text('丢失地点 *'), findsOneWidget);
      expect(find.text('紧急程度 *'), findsOneWidget);
      expect(find.text('备注'), findsOneWidget);
      
      // 验证按钮
      expect(find.text('取消'), findsOneWidget);
      expect(find.text('提交申请'), findsOneWidget);
    });

    test('NFC Card Status Management', () {
      final provider = NfcCardProvider();
      
      // 测试默认状态
      expect(provider.getCardStatus('STU001'), equals(NfcCardStatus.normal));
      
      // 测试标记丢失
      provider.markCardAsLost('STU001');
      expect(provider.getCardStatus('STU001'), equals(NfcCardStatus.lost));
    });

    test('Submit Replacement Request', () async {
      final provider = NfcCardProvider();
      
      final success = await provider.submitReplacementRequest(
        studentId: 'STU001',
        studentName: '张三',
        className: '一年级A班',
        teacherId: 'TCH001',
        reason: '丢失',
        lostDate: DateTime.now(),
        lostLocation: '学校操场',
        urgency: 'normal',
        notes: '测试申请',
      );
      
      expect(success, isTrue);
      expect(provider.replacementRequests.length, equals(1));
      expect(provider.getCardStatus('STU001'), equals(NfcCardStatus.lost));
    });
  });
}
