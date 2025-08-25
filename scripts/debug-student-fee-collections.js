const { default: PocketBase } = require('pocketbase');

async function debugStudentFeeCollections() {
  const pb = new PocketBase('http://pjpc.tplinkdns.com:8090');
  
  try {
    console.log('🔍 Debugging Student Fee Collections...\n');
    
    // List all collections
    console.log('📋 Available Collections:');
    const collections = await pb.collections.getFullList();
    collections.forEach(collection => {
      console.log(`- ${collection.name} (${collection.type})`);
    });
    
    console.log('\n🔍 Looking for student fee related collections...');
    const studentFeeCollections = collections.filter(c => 
      c.name.includes('student') || c.name.includes('fee') || c.name.includes('matrix')
    );
    
    studentFeeCollections.forEach(collection => {
      console.log(`\n📊 Collection: ${collection.name}`);
      console.log(`   Type: ${collection.type}`);
      console.log(`   Fields:`);
      collection.schema.forEach(field => {
        console.log(`     - ${field.name}: ${field.type}${field.required ? ' (required)' : ''}`);
      });
    });
    
    // Test specific collections
    const testCollections = ['student_fee_matrix', 'student_fees', 'students', 'fee_items'];
    
    for (const collectionName of testCollections) {
      try {
        console.log(`\n🧪 Testing collection: ${collectionName}`);
        const records = await pb.collection(collectionName).getFullList(5);
        console.log(`   ✅ Found ${records.length} records`);
        if (records.length > 0) {
          console.log(`   📝 Sample record fields:`, Object.keys(records[0]));
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Test filter syntax
    console.log('\n🔍 Testing filter syntax...');
    try {
      const testFilter = await pb.collection('student_fee_matrix').getFullList(1, {
        filter: 'student_id = "test" && fee_item_id = "test"'
      });
      console.log('   ✅ Filter syntax works');
    } catch (error) {
      console.log(`   ❌ Filter syntax error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugStudentFeeCollections();
