import { NextRequest } from 'next/server'
import { registerSSEConnection, removeSSEConnection, checkForUpdates } from '@/lib/sse-broadcast'

export async function GET(request: NextRequest) {
  console.log('[SSE] 新客户端连接')
  
  // 创建Server-Sent Events流
  const stream = new ReadableStream({
    start(controller) {
      console.log('[SSE] 客户端连接成功')
      registerSSEConnection(controller)
      
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
        removeSSEConnection(controller)
        controller.close()
        console.log('[SSE] 连接已关闭')
      }
      
      // 监听客户端断开
      request.signal.addEventListener('abort', cleanup)
      
      // 保持连接活跃
      const keepAlive = setInterval(() => {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'keepalive', timestamp: Date.now() })}\n\n`))
      }, 10000) // 每10秒发送心跳

      // 清理定时器
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive)
      })
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
