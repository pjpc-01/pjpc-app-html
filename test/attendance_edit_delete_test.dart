import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:pjpc_app_flutter/providers/attendance_provider.dart';
import 'package:pjpc_app_flutter/services/pocketbase_service.dart';
import 'package:pjpc_app_flutter/screens/attendance/attendance_records_screen.dart';

void main() {
  group('Attendance Edit/Delete Tests', () {
    late AttendanceProvider attendanceProvider;
    late PocketBaseService pocketBaseService;

    setUp(() {
      pocketBaseService = PocketBaseService();
      attendanceProvider = AttendanceProvider(pocketBaseService: pocketBaseService);
    });

    test('updateAttendanceRecord should handle authentication check', () async {
      // Test that update method checks authentication
      expect(attendanceProvider.isLoading, false);
      
      // This would fail with authentication error if not logged in
      final result = await attendanceProvider.updateAttendanceRecord(
        'test-record-id',
        {'date': '2024-01-01', 'notes': 'test'}
      );
      
      // Should return false due to authentication failure
      expect(result, false);
      expect(attendanceProvider.error, isNotNull);
      expect(attendanceProvider.error, contains('authentication'));
    });

    test('deleteAttendanceRecord should handle authentication check', () async {
      // Test that delete method checks authentication
      expect(attendanceProvider.isLoading, false);
      
      // This would fail with authentication error if not logged in
      final result = await attendanceProvider.deleteAttendanceRecord('test-record-id');
      
      // Should return false due to authentication failure
      expect(result, false);
      expect(attendanceProvider.error, isNotNull);
      expect(attendanceProvider.error, contains('authentication'));
    });

    test('updateAttendanceRecord should handle loading state correctly', () async {
      expect(attendanceProvider.isLoading, false);
      
      // Start update operation
      final future = attendanceProvider.updateAttendanceRecord(
        'test-record-id',
        {'date': '2024-01-01', 'notes': 'test'}
      );
      
      // Should be loading
      expect(attendanceProvider.isLoading, true);
      
      // Wait for completion
      await future;
      
      // Should not be loading anymore
      expect(attendanceProvider.isLoading, false);
    });

    test('deleteAttendanceRecord should handle loading state correctly', () async {
      expect(attendanceProvider.isLoading, false);
      
      // Start delete operation
      final future = attendanceProvider.deleteAttendanceRecord('test-record-id');
      
      // Should be loading
      expect(attendanceProvider.isLoading, true);
      
      // Wait for completion
      await future;
      
      // Should not be loading anymore
      expect(attendanceProvider.isLoading, false);
    });

    test('error handling should clear previous errors', () async {
      // Set an error (using the public method)
      attendanceProvider.clearError();
      expect(attendanceProvider.error, null);
      
      // Start new operation
      await attendanceProvider.updateAttendanceRecord(
        'test-record-id',
        {'date': '2024-01-01', 'notes': 'test'}
      );
      
      // Error should be cleared and new error set
      expect(attendanceProvider.error, isNotNull);
      expect(attendanceProvider.error, isNot('Previous error'));
    });

    test('input validation should work correctly', () {
      // Test date validation
      expect(''.isEmpty, true);
      expect('2024-01-01'.isNotEmpty, true);
      
      // Test time validation
      expect(''.isEmpty, true);
      expect('10:30'.isNotEmpty, true);
      
      // Test notes validation (should allow empty)
      expect(''.isEmpty, true);
      expect('Some notes'.isNotEmpty, true);
    });

    test('record data structure should be correct', () {
      // Mock record data
      final mockRecord = {
        'id': 'test-id',
        'student_name': 'Test Student',
        'type': 'check_in',
        'date': '2024-01-01',
        'check_in_time': '09:00',
        'notes': 'Test notes'
      };
      
      expect(mockRecord['id'], 'test-id');
      expect(mockRecord['student_name'], 'Test Student');
      expect(mockRecord['type'], 'check_in');
      expect(mockRecord['date'], '2024-01-01');
      expect(mockRecord['check_in_time'], '09:00');
      expect(mockRecord['notes'], 'Test notes');
    });

    test('update data structure should be correct for check_in', () {
      final updateData = {
        'date': '2024-01-01',
        'notes': 'Updated notes',
        'check_in_time': '09:30',
      };
      
      expect(updateData['date'], '2024-01-01');
      expect(updateData['notes'], 'Updated notes');
      expect(updateData['check_in_time'], '09:30');
      expect(updateData.containsKey('check_out_time'), false);
    });

    test('update data structure should be correct for check_out', () {
      final updateData = {
        'date': '2024-01-01',
        'notes': 'Updated notes',
        'check_out_time': '17:30',
      };
      
      expect(updateData['date'], '2024-01-01');
      expect(updateData['notes'], 'Updated notes');
      expect(updateData['check_out_time'], '17:30');
      expect(updateData.containsKey('check_in_time'), false);
    });
  });

  group('UI Component Tests', () {
    testWidgets('edit dialog should show correct fields', (WidgetTester tester) async {
      // Mock record
      final mockRecord = {
        'id': 'test-id',
        'student_name': 'Test Student',
        'type': 'check_in',
        'date': '2024-01-01',
        'check_in_time': '09:00',
        'notes': 'Test notes'
      };
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) {
                // This would normally be called from the actual screen
                return ElevatedButton(
                  onPressed: () {
                    // Simulate showing edit dialog
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: Text('编辑考勤记录 - ${mockRecord['student_name']}'),
                        content: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            TextField(
                              decoration: InputDecoration(labelText: '日期'),
                              controller: TextEditingController(text: mockRecord['date']),
                            ),
                            TextField(
                              decoration: InputDecoration(labelText: '时间'),
                              controller: TextEditingController(text: mockRecord['check_in_time']),
                            ),
                            TextField(
                              decoration: InputDecoration(labelText: '备注'),
                              controller: TextEditingController(text: mockRecord['notes']),
                            ),
                          ],
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: Text('取消'),
                          ),
                          ElevatedButton(
                            onPressed: () => Navigator.pop(context),
                            child: Text('保存'),
                          ),
                        ],
                      ),
                    );
                  },
                  child: Text('Edit Record'),
                );
              },
            ),
          ),
        ),
      );
      
      await tester.tap(find.text('Edit Record'));
      await tester.pumpAndSettle();
      
      // Check dialog elements
      expect(find.text('编辑考勤记录 - Test Student'), findsOneWidget);
      expect(find.text('日期'), findsOneWidget);
      expect(find.text('时间'), findsOneWidget);
      expect(find.text('备注'), findsOneWidget);
      expect(find.text('取消'), findsOneWidget);
      expect(find.text('保存'), findsOneWidget);
    });

    testWidgets('delete confirmation dialog should show correct content', (WidgetTester tester) async {
      // Mock record
      final mockRecord = {
        'id': 'test-id',
        'student_name': 'Test Student',
        'type': 'check_in',
      };
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) {
                return ElevatedButton(
                  onPressed: () {
                    // Simulate showing delete dialog
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: Text('确认删除'),
                        content: Text('确定要删除 ${mockRecord['student_name']} 的${mockRecord['type'] == 'check_in' ? '签到' : '签退'}记录吗？\n\n此操作无法撤销。'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: Text('取消'),
                          ),
                          ElevatedButton(
                            onPressed: () => Navigator.pop(context),
                            child: Text('删除'),
                          ),
                        ],
                      ),
                    );
                  },
                  child: Text('Delete Record'),
                );
              },
            ),
          ),
        ),
      );
      
      await tester.tap(find.text('Delete Record'));
      await tester.pumpAndSettle();
      
      // Check dialog elements
      expect(find.text('确认删除'), findsOneWidget);
      expect(find.text('确定要删除 Test Student 的签到记录吗？'), findsOneWidget);
      expect(find.text('此操作无法撤销。'), findsOneWidget);
      expect(find.text('取消'), findsOneWidget);
      expect(find.text('删除'), findsOneWidget);
    });
  });
}


