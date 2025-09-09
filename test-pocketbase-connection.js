const PocketBase = require('pocketbase').default;

async function testPocketBaseConnection() {
  console.log('🔍 Testing PocketBase connection...');
  
  const pb = new PocketBase('http://pjpc.tplinkdns.com:8090');
  
  try {
    // Test basic connection
    console.log('📡 Testing basic connection...');
    const healthResponse = await fetch('http://pjpc.tplinkdns.com:8090/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test admin authentication
    console.log('🔐 Testing admin authentication...');
    const authResult = await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!');
    console.log('✅ Admin auth result:', {
      hasToken: !!authResult.token,
      hasAdmin: !!authResult.admin,
      isValid: pb.authStore.isValid
    });
    
    // Test users collection authentication
    console.log('👤 Testing users collection...');
    try {
      const userAuthResult = await pb.collection('users').authWithPassword('test@example.com', 'testpassword');
      console.log('✅ User auth result:', userAuthResult);
    } catch (userError) {
      console.log('❌ User auth failed (expected):', userError.message);
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testPocketBaseConnection();
