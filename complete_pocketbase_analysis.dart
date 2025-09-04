import 'package:pocketbase/pocketbase.dart';

void main() async {
  final pb = PocketBase('http://pjpc.tplinkdns.com:8090');
  
  try {
    print('🔗 Connecting to PocketBase...');
    await pb.health.check();
    print('✅ Connection successful!');
    
    // Login
    print('\n🔐 Logging in...');
    final authData = await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!');
    print('✅ Login successful!');
    print('User: ${authData.record.getStringValue('name')} (${authData.record.getStringValue('email')})');
    print('Role: ${authData.record.getStringValue('role')}');
    
    // Get all collections by trying common collection names
    print('\n📋 Complete PocketBase Collections Analysis');
    print('=' * 80);
    
    final allCollections = <String, Map<String, dynamic>>{};
    
    // Test all possible collection names
    final possibleCollections = [
      'students', 'users', 'attendance', 'fees', 'payments', 'invoices', 
      'classes', 'subjects', 'grades', 'courses', 'teachers', 'parents',
      'enrollments', 'schedules', 'rooms', 'centers', 'notifications',
      'reports', 'settings', 'transactions', 'receipts', 'discounts',
      'levels', 'sections', 'terms', 'semesters', 'exams', 'assignments',
      'homework', 'announcements', 'events', 'activities', 'awards',
      'discipline', 'medical', 'emergency', 'transport', 'meals'
    ];
    
    for (final collectionName in possibleCollections) {
      try {
        print('\n🔍 Testing collection: $collectionName');
        final result = await pb.collection(collectionName).getList(perPage: 1);
        
        allCollections[collectionName] = {
          'exists': true,
          'totalItems': result.totalItems,
          'sampleFields': result.items.isNotEmpty ? result.items.first.data.keys.toList() : [],
          'sampleData': result.items.isNotEmpty ? result.items.first.data : {}
        };
        
        print('   ✅ EXISTS - ${result.totalItems} records');
        if (result.items.isNotEmpty) {
          print('   📝 Sample fields: ${result.items.first.data.keys.toList()}');
        }
        
      } catch (e) {
        if (e.toString().contains('404') || e.toString().contains('Missing collection')) {
          allCollections[collectionName] = {'exists': false};
          print('   ❌ Does not exist');
        } else {
          print('   ⚠️  Error: $e');
        }
      }
    }
    
    // Summary of existing collections
    print('\n📊 SUMMARY OF EXISTING COLLECTIONS');
    print('=' * 80);
    
    final existingCollections = allCollections.entries.where((e) => e.value['exists'] == true).toList();
    print('Total existing collections: ${existingCollections.length}');
    
    for (final entry in existingCollections) {
      final collectionName = entry.key;
      final data = entry.value;
      print('\n📁 $collectionName');
      print('   Records: ${data['totalItems']}');
      print('   Fields: ${data['sampleFields']}');
      
      // Show sample data for key collections
      if (['students', 'users', 'payments', 'invoices', 'classes'].contains(collectionName)) {
        print('   Sample data:');
        final sampleData = data['sampleData'] as Map<String, dynamic>;
        for (final key in sampleData.keys.take(5)) {
          final value = sampleData[key];
          final displayValue = value.toString().length > 30 
              ? '${value.toString().substring(0, 30)}...' 
              : value.toString();
          print('     $key: $displayValue');
        }
      }
    }
    
    // Detailed analysis of key collections
    print('\n🔬 DETAILED ANALYSIS OF KEY COLLECTIONS');
    print('=' * 80);
    
    for (final collectionName in ['students', 'users', 'payments', 'invoices', 'classes']) {
      if (allCollections[collectionName]?['exists'] == true) {
        print('\n📋 $collectionName Collection Details:');
        try {
          final result = await pb.collection(collectionName).getList(perPage: 3);
          print('   Total records: ${result.totalItems}');
          
          if (result.items.isNotEmpty) {
            print('   Field structure:');
            final sampleRecord = result.items.first;
            for (final key in sampleRecord.data.keys) {
              final value = sampleRecord.data[key];
              final valueType = value.runtimeType.toString();
              final valueStr = value.toString();
              final displayValue = valueStr.length > 50 ? '${valueStr.substring(0, 50)}...' : valueStr;
              print('     $key ($valueType): "$displayValue"');
            }
          }
        } catch (e) {
          print('   Error getting details: $e');
        }
      }
    }
    
    // Recommendations for app configuration
    print('\n💡 RECOMMENDATIONS FOR APP CONFIGURATION');
    print('=' * 80);
    
    if (allCollections['students']?['exists'] == true) {
      print('✅ Students collection exists - can implement student management');
    }
    
    if (allCollections['attendance']?['exists'] == true) {
      print('✅ Attendance collection exists - can implement attendance tracking');
    } else {
      print('❌ Attendance collection missing - need to create or use alternative');
    }
    
    if (allCollections['payments']?['exists'] == true) {
      print('✅ Payments collection exists - can implement payment tracking');
    }
    
    if (allCollections['invoices']?['exists'] == true) {
      print('✅ Invoices collection exists - can implement invoice management');
    }
    
    if (allCollections['classes']?['exists'] == true) {
      print('✅ Classes collection exists - can implement class management');
    }
    
  } catch (e) {
    print('❌ Error: $e');
  }
}
