import { NextRequest } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
import { authenticateAdmin } from '@/lib/auth-utils'

// 全局连接管理
const connections = new Set<ReadableStreamDefaultController>()

export async function GET(request: NextRequest) {
  console.log('[SSE] 新客户端连接')
  
  // 创建Server-Sent Events流
  const stream = new ReadableStream({
    start(controller) {
      console.log('[SSE] 客户端连接成功')
      connections.add(controller)
      
      // 发送连接确认
      const connectData = {
        type: 'connected',
        timestamp: Date.now(),
        message: '连接已建立'
      }
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(connectData)}\n\n`))
      
      // 立即检查数据更新
      checkForUpdates()
      
      // 清理函数
      const cleanup = () => {
        connections.delete(controller)
        controller.close()
        console.log('[SSE] 连接已关闭，剩余连接数:', connections.size)
      }
      
      // 监听客户端断开
      request.signal.addEventListener('abort', cleanup)
      
      // 保持连接活跃
      const keepAlive = setInterval(() => {
        if (connections.has(controller)) {
          const keepAliveData = {
            type: 'keepalive',
            timestamp: Date.now()
          }
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(keepAliveData)}\n\n`))
        } else {
          clearInterval(keepAlive)
        }
      }, 10000) // 每10秒发送心跳
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

// 检查数据更新并广播
async function checkForUpdates() {
  try {
    console.log('[SSE] 检查数据更新...')
    
    const pb = await getPocketBase()
    await authenticateAdmin(pb)
    
    // 检查最新的积分交易
    const latestTransactions = await pb.collection('point_transactions').getList(1, 1, {
      sort: '-created'
    })
    
    // 检查最新的学生积分
    const latestPoints = await pb.collection('student_points').getList(1, 1, {
      sort: '-updated'
    })
    
    // 检查最新的公告
    const latestAnnouncements = await pb.collection('announcements').getList(1, 1, {
      sort: '-created'
    })
    
    const updateData = {
      type: 'data_update',
      timestamp: Date.now(),
      message: '数据已更新',
      latestTransaction: latestTransactions.items[0]?.id || null,
      latestPoints: latestPoints.items[0]?.id || null,
      latestAnnouncement: latestAnnouncements.items[0]?.id || null,
      updateTypes: ['points', 'transactions', 'announcements']
    }
    
    // 广播给所有连接的客户端
    const sseData = `data: ${JSON.stringify(updateData)}\n\n`
    const encoder = new TextEncoder()
    
    connections.forEach(controller => {
      try {
        controller.enqueue(encoder.encode(sseData))
      } catch (error) {
        console.warn('[SSE] 发送数据失败，移除连接:', error)
        connections.delete(controller)
      }
    })
    
    console.log(`[SSE] 数据更新已广播给 ${connections.size} 个客户端`)
    
  } catch (error) {
    console.error('[SSE] 检查数据更新失败:', error)
  }
}

// 导出广播函数供其他API使用
export { checkForUpdates }
