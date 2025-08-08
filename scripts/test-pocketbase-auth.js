const fetch = require('node-fetch');

async function testPocketBaseAuth() {
  const baseUrl = 'http://192.168.0.59:8090';
  
  console.log('测试PocketBase认证功能...');
  
  try {
    // 1. 检查健康状态
    console.log('\n1. 检查服务器健康状态...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    console.log('健康状态:', healthResponse.status, healthResponse.statusText);
    
    if (!healthResponse.ok) {
      throw new Error(`服务器健康检查失败: ${healthResponse.status}`);
    }
    
    // 2. 尝试获取认证集合信息
    console.log('\n2. 检查认证集合...');
    const authCollectionsResponse = await fetch(`${baseUrl}/api/collections?type=auth`);
    
    if (authCollectionsResponse.ok) {
      const authCollections = await authCollectionsResponse.json();
      console.log('认证集合:');
      authCollections.items.forEach(collection => {
        console.log(`- ${collection.name} (${collection.type})`);
      });
    } else {
      console.log('获取认证集合失败:', authCollectionsResponse.status);
    }
    
    // 3. 尝试创建一个测试用户
    console.log('\n3. 尝试创建测试用户...');
    const testUserData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      passwordConfirm: 'TestPassword123!',
      name: 'Test User',
      role: 'admin',
      status: 'approved'
    };
    
    try {
      const createUserResponse = await fetch(`${baseUrl}/api/collections/users/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUserData)
      });
      
      if (createUserResponse.ok) {
        console.log('✅ 测试用户创建成功');
      } else {
        const errorData = await createUserResponse.json();
        console.log('❌ 创建用户失败:', createUserResponse.status);
        console.log('错误信息:', errorData);
      }
    } catch (error) {
      console.log('❌ 创建用户请求失败:', error.message);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testPocketBaseAuth();
