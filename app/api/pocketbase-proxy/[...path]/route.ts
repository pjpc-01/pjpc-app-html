import { NextRequest, NextResponse } from 'next/server'

// PocketBase代理 - 解决HTTPS页面访问HTTP PocketBase的混合内容问题
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params.path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params.path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params.path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params.path, 'DELETE')
}

async function handleProxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // 构建PocketBase URL
    const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://pjpc.tplinkdns.com:8090'
    const path = pathSegments.join('/')
    const url = new URL(`/api/${path}`, pocketbaseUrl)
    
    // 复制查询参数
    const searchParams = request.nextUrl.searchParams
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })

    // 准备请求头
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // 复制认证头
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    // 准备请求体
    let body: string | undefined
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text()
      } catch (error) {
        console.error('Error reading request body:', error)
      }
    }

    // 发送请求到PocketBase
    const response = await fetch(url.toString(), {
      method,
      headers,
      body,
    })

    // 获取响应数据
    const responseData = await response.text()
    
    // 创建响应
    const nextResponse = new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
    })

    // 复制重要的响应头
    const contentType = response.headers.get('content-type')
    if (contentType) {
      nextResponse.headers.set('content-type', contentType)
    }

    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
      nextResponse.headers.set('set-cookie', setCookie)
    }

    return nextResponse

  } catch (error) {
    console.error('PocketBase proxy error:', error)
    return NextResponse.json(
      { error: 'Proxy request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

