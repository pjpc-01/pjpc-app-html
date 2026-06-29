import { getPocketBase } from '@/lib/pocketbase'
import { authenticateAdmin } from '@/lib/auth-utils'

// 全局连接管理
const connections = new Set<ReadableStreamDefaultController>()

// 注册 SSE 连接
export function registerSSEConnection(controller: ReadableStreamDefaultController) {
  connections.add(controller)
}

// 移除 SSE 连接
export function removeSSEConnection(controller: ReadableStreamDefaultController) {
  connections.delete(controller)
}

// 获取当前连接数
export function getConnectionCount(): number {
  return connections.size
}

// 检查数据更新并广播
export async function checkForUpdates() {
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
