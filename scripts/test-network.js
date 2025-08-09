const PocketBase = require('pocketbase')

// 支持DDNS配置
const getPocketBaseUrl = () => {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_POCKETBASE_URL) {
    return process.env.NEXT_PUBLIC_POCKETBASE_URL
  }
  
  // 开发环境默认使用本地IP
  if (process.env.NODE_ENV === 'development') {
    return 'http://192.168.0.59:8090'
  }
  
  // 生产环境使用DDNS
  return 'http://pjpc.tplinkdns.com:8090'
}

const pb = new PocketBase(getPocketBaseUrl())

async function testConnection() {
  try {
    console.log('Testing PocketBase connection...')
    console.log('URL:', getPocketBaseUrl())
    
    const health = await fetch(`${getPocketBaseUrl()}/api/health`)
    console.log('Health check status:', health.status)
    
    if (health.ok) {
      const data = await health.json()
      console.log('Health check data:', data)
      console.log('✅ Connection successful!')
    } else {
      console.log('❌ Connection failed:', health.status, health.statusText)
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message)
  }
}

testConnection()

