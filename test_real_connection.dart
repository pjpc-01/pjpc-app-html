import 'package:pocketbase/pocketbase.dart';

void main() async {
  final pb = PocketBase('http://pjpc.tplinkdns.com:8090');
  
  try {
    print('Testing connection to PocketBase...');
    await pb.health.check();
    print('✅ Connection successful!');
    
    // Test login with provided credentials
    print('\nTesting login with provided credentials...');
    try {
      final authData = await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!');
      print('✅ Login successful!');
      print('User: ${authData.record.getStringValue('name')} (${authData.record.getStringValue('email')})');
      print('Role: ${authData.record.getStringValue('role')}');
      
      // Check students collection
      print('\nChecking students collection...');
      final studentsResult = await pb.collection('students').getList();
      print('Students count: ${studentsResult.items.length}');
      if (studentsResult.items.isNotEmpty) {
        print('First student: ${studentsResult.items.first.data}');
      } else {
        print('❌ No students found in database');
      }
      
      // Check attendance collection
      print('\nChecking attendance collection...');
      try {
        final attendanceResult = await pb.collection('attendance').getList();
        print('Attendance records count: ${attendanceResult.items.length}');
        if (attendanceResult.items.isNotEmpty) {
          print('First attendance record: ${attendanceResult.items.first.data}');
        } else {
          print('❌ No attendance records found in database');
        }
      } catch (e) {
        print('❌ Error accessing attendance collection: $e');
      }
      
      // Check users collection
      print('\nChecking users collection...');
      final usersResult = await pb.collection('users').getList();
      print('Users count: ${usersResult.items.length}');
      if (usersResult.items.isNotEmpty) {
        print('First user: ${usersResult.items.first.data}');
      } else {
        print('❌ No users found in database');
      }
      
    } catch (e) {
      print('❌ Login failed: $e');
    }
    
  } catch (e) {
    print('❌ Connection error: $e');
  }
}
