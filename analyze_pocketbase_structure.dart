import 'package:pocketbase/pocketbase.dart';

void main() async {
  final pb = PocketBase('http://pjpc.tplinkdns.com:8090');
  
  try {
    print('Connecting to PocketBase...');
    await pb.health.check();
    print('✅ Connection successful!');
    
    // Login with provided credentials
    print('\nLogging in...');
    final authData = await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!');
    print('✅ Login successful!');
    print('User: ${authData.record.getStringValue('name')} (${authData.record.getStringValue('email')})');
    print('Role: ${authData.record.getStringValue('role')}');
    
    // Get all collections
    print('\n📋 Analyzing PocketBase Collections...');
    print('=' * 60);
    
    // Test specific collections we know exist
    final knownCollections = ['students', 'users'];
    
    for (final collectionName in knownCollections) {
      try {
        print('\n📁 Collection: $collectionName');
        final sampleResult = await pb.collection(collectionName).getList(perPage: 3);
        print('   Sample records count: ${sampleResult.items.length}');
        print('   Total items: ${sampleResult.totalItems}');
        
        if (sampleResult.items.isNotEmpty) {
          print('   Sample record structure:');
          final sampleRecord = sampleResult.items.first;
          for (final key in sampleRecord.data.keys) {
            final value = sampleRecord.data[key];
            final valueType = value.runtimeType.toString();
            final valueStr = value.toString();
            final displayValue = valueStr.length > 50 ? '${valueStr.substring(0, 50)}...' : valueStr;
            print('     $key: $valueType = "$displayValue"');
          }
        }
        print('   ' + '-' * 40);
      } catch (e) {
        print('   ❌ Error accessing $collectionName: $e');
      }
    }
    
    // Test specific collections we need
    print('\n🔍 Testing specific collections...');
    print('=' * 60);
    
    // Test students collection
    try {
      print('\n👥 Students Collection:');
      final studentsResult = await pb.collection('students').getList(perPage: 5);
      print('   Total students: ${studentsResult.totalItems}');
      print('   Sample student fields:');
      if (studentsResult.items.isNotEmpty) {
        final student = studentsResult.items.first;
        for (final key in student.data.keys) {
          print('     $key: ${student.data[key]}');
        }
      }
    } catch (e) {
      print('   ❌ Error accessing students: $e');
    }
    
    // Test users collection
    try {
      print('\n👤 Users Collection:');
      final usersResult = await pb.collection('users').getList(perPage: 5);
      print('   Total users: ${usersResult.totalItems}');
      print('   Sample user fields:');
      if (usersResult.items.isNotEmpty) {
        final user = usersResult.items.first;
        for (final key in user.data.keys) {
          print('     $key: ${user.data[key]}');
        }
      }
    } catch (e) {
      print('   ❌ Error accessing users: $e');
    }
    
    // Test if attendance collection exists
    try {
      print('\n📊 Attendance Collection:');
      final attendanceResult = await pb.collection('attendance').getList(perPage: 5);
      print('   Total attendance records: ${attendanceResult.totalItems}');
      print('   Sample attendance fields:');
      if (attendanceResult.items.isNotEmpty) {
        final attendance = attendanceResult.items.first;
        for (final key in attendance.data.keys) {
          print('     $key: ${attendance.data[key]}');
        }
      }
    } catch (e) {
      print('   ❌ Attendance collection does not exist or error: $e');
    }
    
    // Test other potential collections
    final potentialCollections = ['fees', 'payments', 'invoices', 'classes', 'subjects', 'grades'];
    for (final collectionName in potentialCollections) {
      try {
        print('\n🔍 Testing $collectionName collection:');
        final result = await pb.collection(collectionName).getList(perPage: 1);
        print('   ✅ $collectionName exists with ${result.totalItems} records');
        if (result.items.isNotEmpty) {
          print('   Sample fields: ${result.items.first.data.keys.toList()}');
        }
      } catch (e) {
        print('   ❌ $collectionName does not exist or error: $e');
      }
    }
    
  } catch (e) {
    print('❌ Error: $e');
  }
}
