import 'package:pocketbase/pocketbase.dart';

void main() async {
  final pb = PocketBase('http://pjpc.tplinkdns.com:8090');
  
  try {
    print('Connecting to PocketBase...');
    await pb.health.check();
    print('✅ Connection successful!');
    
    // Login as admin
    print('\nLogging in as admin...');
    final authData = await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!');
    print('✅ Admin login successful!');
    
    // Create attendance collection
    print('\nCreating attendance collection...');
    try {
      final collection = await pb.collections.create(body: {
        'name': 'attendance',
        'type': 'base',
        'schema': [
          {
            'name': 'student',
            'type': 'relation',
            'required': true,
            'options': {
              'collectionId': 'pbc_3827815851', // students collection ID
              'cascadeDelete': false,
              'minSelect': 1,
              'maxSelect': 1,
            }
          },
          {
            'name': 'student_name',
            'type': 'text',
            'required': true,
            'options': {
              'min': 1,
              'max': 100,
            }
          },
          {
            'name': 'type',
            'type': 'select',
            'required': true,
            'options': {
              'maxSelect': 1,
              'values': ['check_in', 'check_out'],
            }
          },
          {
            'name': 'nfc_card_id',
            'type': 'text',
            'required': false,
            'options': {
              'min': 0,
              'max': 50,
            }
          },
          {
            'name': 'date',
            'type': 'date',
            'required': true,
          },
          {
            'name': 'time',
            'type': 'text',
            'required': true,
            'options': {
              'min': 1,
              'max': 20,
            }
          },
          {
            'name': 'notes',
            'type': 'text',
            'required': false,
            'options': {
              'min': 0,
              'max': 500,
            }
          },
        ],
        'indexes': [
          'CREATE INDEX idx_attendance_student ON attendance (student)',
          'CREATE INDEX idx_attendance_date ON attendance (date)',
          'CREATE INDEX idx_attendance_type ON attendance (type)',
        ],
        'listRule': '@request.auth.id != ""',
        'viewRule': '@request.auth.id != ""',
        'createRule': '@request.auth.id != ""',
        'updateRule': '@request.auth.id != ""',
        'deleteRule': '@request.auth.id != ""',
      });
      
      print('✅ Attendance collection created successfully!');
      print('Collection ID: ${collection.id}');
      
      // Create some sample attendance records
      print('\nCreating sample attendance records...');
      final studentsResult = await pb.collection('students').getList(perPage: 5);
      
      for (final student in studentsResult.items) {
        final today = DateTime.now();
        final studentName = student.getStringValue('student_name');
        
        // Create check-in record
        try {
          await pb.collection('attendance').create(body: {
            'student': student.id,
            'student_name': studentName,
            'type': 'check_in',
            'nfc_card_id': student.getStringValue('cardNumber'),
            'date': today.toIso8601String().split('T')[0],
            'time': today.toIso8601String().split('T')[1].split('.')[0],
            'notes': 'Sample check-in record',
          });
          print('✅ Created check-in record for $studentName');
        } catch (e) {
          print('❌ Failed to create check-in record for $studentName: $e');
        }
        
        // Create check-out record
        try {
          await pb.collection('attendance').create(body: {
            'student': student.id,
            'student_name': studentName,
            'type': 'check_out',
            'nfc_card_id': student.getStringValue('cardNumber'),
            'date': today.toIso8601String().split('T')[0],
            'time': today.add(const Duration(hours: 8)).toIso8601String().split('T')[1].split('.')[0],
            'notes': 'Sample check-out record',
          });
          print('✅ Created check-out record for $studentName');
        } catch (e) {
          print('❌ Failed to create check-out record for $studentName: $e');
        }
      }
      
      print('\n✅ Sample attendance records created successfully!');
      
    } catch (e) {
      print('❌ Failed to create attendance collection: $e');
    }
    
  } catch (e) {
    print('❌ Error: $e');
  }
}
