import PocketBase from 'pocketbase'

const pb = new PocketBase('http://192.168.0.59:8090')

async function testNetwork() {
  try {
    console.log('=== 网络连接测试 ===')
    
    // 1. 测试基本连接
    console.log('1. 测试基本连接...')
    const health = await fetch('http://192.168.0.59:8090/api/health')
    console.log('健康检查状态:', health.status, health.statusText)
    
    if (health.ok) {
      const data = await health.json()
      console.log('健康检查数据:', data)
    }
    
    // 2. 测试PocketBase客户端
    console.log('2. 测试PocketBase客户端...')
    const records = await pb.collection('students').getList(1, 5)
    console.log('获取学生数据成功:', records.items.length, '个记录')
    
    // 3. 测试认证状态
    console.log('3. 测试认证状态...')
    console.log('认证有效:', pb.authStore.isValid)
    console.log('当前用户:', pb.authStore.model)
    
    console.log('=== 网络测试完成 ===')
    
  } catch (error) {
    console.error('网络测试失败:', error)
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      status: error.status,
      data: error.data
    })
  }
}

testNetwork()

