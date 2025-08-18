import PocketBase from 'pocketbase'

async function testPocketBasePermissions() {
  console.log('=== PocketBase 权限测试 ===')
  
  const pb = new PocketBase('http://pjpc.tplinkdns.com:8090')
  
  try {
    // 1. 检查连接
    console.log('1. 检查PocketBase连接...')
    const healthResponse = await fetch('http://pjpc.tplinkdns.com:8090/api/health')
    console.log('健康检查状态:', healthResponse.status)
    
    // 2. 检查未认证状态下的访问
    console.log('\n2. 测试未认证状态下的访问...')
    try {
      const records = await pb.collection('users').getList(1, 10)
      console.log('未认证访问成功，用户数量:', records.items.length)
    } catch (error) {
      console.log('未认证访问失败:', error.message)
    }
    
    // 3. 尝试登录管理员账户
    console.log('\n3. 尝试登录管理员账户...')
    try {
      const authData = await pb.collection('users').authWithPassword(
        'admin@example.com',
        'AdminPassword123!'
      )
      console.log('登录成功:', authData.record.email)
      console.log('用户角色:', authData.record.role)
      console.log('用户状态:', authData.record.status)
    } catch (error) {
      console.log('登录失败:', error.message)
      
      // 尝试其他可能的账户
      console.log('\n尝试其他账户...')
      const testAccounts = [
        { email: 'pjpcemerlang@gmail.com', password: '0122270775Sw!' },
        { email: 'admin@pjpc.com', password: 'admin123' },
        { email: 'test@example.com', password: 'test123' }
      ]
      
      for (const account of testAccounts) {
        try {
          const authData = await pb.collection('users').authWithPassword(
            account.email,
            account.password
          )
          console.log(`登录成功: ${account.email}`)
          console.log('用户角色:', authData.record.role)
          console.log('用户状态:', authData.record.status)
          break
        } catch (error) {
          console.log(`登录失败 ${account.email}:`, error.message)
        }
      }
    }
    
    // 4. 检查认证后的访问
    console.log('\n4. 测试认证状态下的访问...')
    if (pb.authStore.isValid) {
      try {
        const records = await pb.collection('users').getList(1, 10)
        console.log('认证访问成功，用户数量:', records.items.length)
        console.log('用户列表:')
        records.items.forEach(user => {
          console.log(`- ${user.name} (${user.email}) - ${user.role} - ${user.status}`)
        })
      } catch (error) {
        console.log('认证访问失败:', error.message)
      }
    } else {
      console.log('未登录，跳过认证访问测试')
    }
    
    // 5. 检查集合信息
    console.log('\n5. 检查集合信息...')
    try {
      const collections = await pb.collections.getList()
      const usersCollection = collections.items.find(col => col.name === 'users')
      if (usersCollection) {
        console.log('users集合信息:')
        console.log('- 名称:', usersCollection.name)
        console.log('- 类型:', usersCollection.type)
        console.log('- List权限:', usersCollection.listRule)
        console.log('- View权限:', usersCollection.viewRule)
        console.log('- Create权限:', usersCollection.createRule)
        console.log('- Update权限:', usersCollection.updateRule)
        console.log('- Delete权限:', usersCollection.deleteRule)
      } else {
        console.log('未找到users集合')
      }
    } catch (error) {
      console.log('获取集合信息失败:', error.message)
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error)
  }
}

// 运行测试
testPocketBasePermissions().catch(console.error)
