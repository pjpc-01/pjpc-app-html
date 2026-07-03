import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // WebSocket not supported in Node.js runtime
  // This endpoint exists for Deno deploy compatibility
  const upgrade = request.headers.get('upgrade')
  
  if (upgrade !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 })
  }

  // Return 501 Not Implemented - WebSocket requires Deno runtime
  return new Response('WebSocket not supported in Node.js runtime', { status: 501 })
}
