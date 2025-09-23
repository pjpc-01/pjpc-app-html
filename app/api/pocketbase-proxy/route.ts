import { NextRequest, NextResponse } from 'next/server'

// 尝试多个PocketBase服务器地址
const POCKETBASE_URLS = [
  'http://localhost:8090',  // 本地开发
  'http://192.168.0.59:8090',  // 局域网
  'http://pjpc.tplinkdns.com:8090'  // DDNS
]

// 选择可用的PocketBase URL
const POCKETBASE_URL = POCKETBASE_URLS[2] // 使用DDNS地址

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'PocketBase Proxy API',
      status: 'active',
      pocketbase_url: POCKETBASE_URL,
      available_endpoints: [
        '/api/collections/users/auth-with-password',
        '/api/collections/students',
        '/api/collections/teachers',
        '/api/collections/student_attendance',
        '/api/collections/teacher_attendance',
        '/api/health',
        '/api/collections'
      ],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('代理根路径错误:', error)
    return NextResponse.json(
      { error: '代理服务错误' },
      { status: 500 }
    )
  }
}
