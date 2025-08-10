const PocketBase = require('pocketbase').default

// DDNS配置测试
const ddnsUrl = 'http://pjpc.tplinkdns.com:8090'
const localUrl = 'http://192.168.0.59:8090'

async function testDDNSConnection() {
  console.log('=== DDNS 连接测试 ===')
  
  // 测试DDNS连接
  console.log('\n1. 测试DDNS连接...')
  console.log('DDNS地址:', ddnsUrl)
  
  try {
    const ddnsHealth = await fetch(`${ddnsUrl}/api/health`)
    console.log('DDNS健康检查状态:', ddnsHealth.status, ddnsHealth.statusText)
    
    if (ddnsHealth.ok) {
      const data = await ddnsHealth.json()
      console.log('✅ DDNS连接成功!')
      console.log('服务器信息:', data)
    } else {
      console.log('❌ DDNS连接失败:', ddnsHealth.status, ddnsHealth.statusText)
    }
  } catch (error) {
    console.error('❌ DDNS连接错误:', error.message)
  }
  
  // 测试本地连接
  console.log('\n2. 测试本地连接...')
  console.log('本地地址:', localUrl)
  
  try {
    const localHealth = await fetch(`${localUrl}/api/health`)
    console.log('本地健康检查状态:', localHealth.status, localHealth.statusText)
    
    if (localHealth.ok) {
      const data = await localHealth.json()
      console.log('✅ 本地连接成功!')
      console.log('服务器信息:', data)
    } else {
      console.log('❌ 本地连接失败:', localHealth.status, localHealth.statusText)
    }
  } catch (error) {
    console.error('❌ 本地连接错误:', error.message)
  }
  
  // 测试PocketBase客户端
  console.log('\n3. 测试PocketBase客户端...')
  
  try {
    const pb = new PocketBase(ddnsUrl)
    const records = await pb.collection('students').getList(1, 5)
    console.log('✅ PocketBase客户端连接成功!')
    console.log('获取到', records.items.length, '条学生记录')
  } catch (error) {
    console.error('❌ PocketBase客户端连接失败:', error.message)
  }
  
  console.log('\n=== 测试完成 ===')
}

testDDNSConnection()
