const fetch = require('node-fetch');

async function testPocketBasePermissions() {
  const baseUrl = 'http://192.168.0.59:8090';
  
  console.log('测试PocketBase权限配置...');
  
  try {
    // 1. 检查健康状态
    console.log('\n1. 检查服务器健康状态...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    console.log('健康状态:', healthResponse.status, healthResponse.statusText);
    
    if (!healthResponse.ok) {
      throw new Error(`服务器健康检查失败: ${healthResponse.status}`);
    }
    
    // 2. 尝试获取认证集合信息（不需要认证）
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
    
    // 3. 尝试获取users集合详情（不需要认证）
    console.log('\n3. 检查users集合详情...');
    const usersResponse = await fetch(`${baseUrl}/api/collections/users`);
    
    if (usersResponse.ok) {
      const usersCollection = await usersResponse.json();
      console.log('✅ users集合详情:');
      console.log('- 类型:', usersCollection.type);
      console.log('- 字段:', usersCollection.schema.map(f => f.name).join(', '));
      
      // 检查权限规则
      console.log('\n4. 检查权限规则...');
      console.log('- List rule:', usersCollection.listRule || '无');
      console.log('- View rule:', usersCollection.viewRule || '无');
      console.log('- Create rule:', usersCollection.createRule || '无');
      console.log('- Update rule:', usersCollection.updateRule || '无');
      console.log('- Delete rule:', usersCollection.deleteRule || '无');
      
    } else {
      console.log('❌ 无法获取users集合详情:', usersResponse.status);
    }
    
    // 4. 尝试创建一个测试用户（不需要认证）
    console.log('\n5. 尝试创建测试用户...');
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
        const userData = await createUserResponse.json();
        console.log('用户ID:', userData.id);
        
        // 尝试获取刚创建的用户
        console.log('\n6. 尝试获取刚创建的用户...');
        const getUserResponse = await fetch(`${baseUrl}/api/collections/users/records/${userData.id}`);
        
        if (getUserResponse.ok) {
          console.log('✅ 成功获取用户信息');
        } else {
          console.log('❌ 获取用户信息失败:', getUserResponse.status);
        }
        
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

testPocketBasePermissions();
