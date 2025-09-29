import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // 检查是否支持WebSocket升级
  const upgrade = request.headers.get('upgrade')
  
  if (upgrade !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 })
  }

  // 创建WebSocket连接
  const { socket, response } = Deno.upgradeWebSocket(request)
  
  socket.onopen = () => {
    console.log('[WebSocket] 客户端连接成功')
    
    // 定期广播数据更新信号
    const broadcastInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'data_update',
          timestamp: Date.now(),
          message: '数据已更新'
        }))
      } else {
        clearInterval(broadcastInterval)
      }
    }, 5000) // 每5秒广播一次
    
    socket.onclose = () => {
      console.log('[WebSocket] 客户端断开连接')
      clearInterval(broadcastInterval)
    }
  }
  
  socket.onerror = (error) => {
    console.error('[WebSocket] 连接错误:', error)
  }
  
  return response
}

