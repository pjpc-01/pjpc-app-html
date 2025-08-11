import { NextRequest, NextResponse } from 'next/server'

// 智能PocketBase URL检测
const getPocketBaseUrl = async () => {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_POCKETBASE_URL) {
    return process.env.NEXT_PUBLIC_POCKETBASE_URL
  }
  
  // 智能检测网络环境
  const testUrls = [
    'http://192.168.0.59:8090',  // 局域网
    'http://pjpc.tplinkdns.com:8090',  // DDNS
  ]
  
  for (const url of testUrls) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        console.log(`API代理使用: ${url}`)
        return url
      }
    } catch (error) {
      console.log(`API代理连接失败: ${url}`, error)
      continue
    }
  }
  
  // 默认使用DDNS
  console.log('API代理使用默认DDNS地址')
  return 'http://pjpc.tplinkdns.com:8090'
}

// 缓存检测结果
let cachedPocketBaseUrl: string | null = null
let lastCheckTime = 0
const CACHE_DURATION = 60000 // 1分钟缓存

const getCachedPocketBaseUrl = async () => {
  const now = Date.now()
  
  // 如果缓存过期或不存在，重新检测
  if (!cachedPocketBaseUrl || (now - lastCheckTime) > CACHE_DURATION) {
    cachedPocketBaseUrl = await getPocketBaseUrl()
    lastCheckTime = now
  }
  
  return cachedPocketBaseUrl
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathString = path.join('/')
  
  // Remove 'api' from the beginning of the path if it exists
  const cleanPath = pathString.startsWith('api/') ? pathString.substring(4) : pathString
  
  try {
    const pocketBaseUrl = await getCachedPocketBaseUrl()
    const url = `${pocketBaseUrl}/api/${cleanPath}`
    
    console.log(`代理GET请求: ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('代理GET错误:', error)
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathString = path.join('/')
  
  // Remove 'api' from the beginning of the path if it exists
  const cleanPath = pathString.startsWith('api/') ? pathString.substring(4) : pathString
  
  try {
    const pocketBaseUrl = await getCachedPocketBaseUrl()
    const url = `${pocketBaseUrl}/api/${cleanPath}`
    
    console.log('代理POST请求:', { pathString, url })
    
    const body = await request.json()
    console.log('代理POST body:', body)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    console.log('代理POST响应状态:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('代理POST错误响应:', errorText)
      return NextResponse.json(
        { error: `PocketBase error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('代理POST成功:', data)
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('代理POST错误:', error)
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathString = path.join('/')
  
  // Remove 'api' from the beginning of the path if it exists
  const cleanPath = pathString.startsWith('api/') ? pathString.substring(4) : pathString
  
  try {
    const pocketBaseUrl = await getCachedPocketBaseUrl()
    const url = `${pocketBaseUrl}/api/${cleanPath}`
    
    const body = await request.json()
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('代理PUT错误:', error)
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathString = path.join('/')
  
  // Remove 'api' from the beginning of the path if it exists
  const cleanPath = pathString.startsWith('api/') ? pathString.substring(4) : pathString
  
  try {
    const pocketBaseUrl = await getCachedPocketBaseUrl()
    const url = `${pocketBaseUrl}/api/${cleanPath}`
    
    const body = await request.json()
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('代理PATCH错误:', error)
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathString = path.join('/')
  
  // Remove 'api' from the beginning of the path if it exists
  const cleanPath = pathString.startsWith('api/') ? pathString.substring(4) : pathString
  
  try {
    const pocketBaseUrl = await getCachedPocketBaseUrl()
    const url = `${pocketBaseUrl}/api/${cleanPath}`
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('代理DELETE错误:', error)
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500 }
    )
  }
}
