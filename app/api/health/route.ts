import { NextRequest, NextResponse } from 'next/server'
import { checkPocketBaseConnection } from '@/lib/pocketbase'

// 静态导出配置
export const dynamic = 'force-static'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 检查PocketBase连接状态...')
    
    const connectionStatus = await checkPocketBaseConnection()
    
    if (connectionStatus.connected) {
      console.log('✅ PocketBase连接正常:', connectionStatus.url)
      return NextResponse.json({
        status: 'healthy',
        connected: true,
        url: connectionStatus.url,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('❌ PocketBase连接失败:', connectionStatus.error)
      return NextResponse.json({
        status: 'unhealthy',
        connected: false,
        url: connectionStatus.url,
        error: connectionStatus.error,
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }
  } catch (error) {
    console.error('❌ 健康检查失败:', error)
    return NextResponse.json({
      status: 'error',
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
