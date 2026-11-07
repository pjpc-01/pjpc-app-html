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
    const latestTransactions = await pb.collection('point_logs').getList(1, 1, {
      sort: '-created'
    })
    
    // 注意：原来这里读 `points` 集合判断「积分有更新」。那张表是废弃的旧表
    // （studentId 存成 ["xxx"] 数组字符串、3,800 行全对不上学生），现在没有任何代码写它，
    // 继续读只会让看板收不到积分变化。改用 point_logs 的最新一条作为积分更新信号。
    
    // 检查最新的公告（公告数据源已统一到 activities，PB 无 announcements 集合）
    // ⚠️ activities 集合没有 created/updated 字段，只能按 date 排序（用 -created 会 400）
    const latestAnnouncements = await pb.collection('activities').getList(1, 1, {
      sort: '-date'
    })
    
    const updateData = {
      type: 'data_update',
      timestamp: Date.now(),
      message: '数据已更新',
      latestTransaction: latestTransactions.items[0]?.id || null,
      latestPoints: latestTransactions.items[0]?.id || null,
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
