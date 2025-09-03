import { NextRequest, NextResponse } from 'next/server'
import https from 'https'

const POCKETBASE_URL = 'http://pjpc.tplinkdns.com:8090'

// 创建忽略SSL证书的fetch函数
const fetchWithIgnoreSSL = async (url: string, options: RequestInit = {}) => {
  // 如果是HTTPS URL，使用自定义的fetch
  if (url.startsWith('https://')) {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false
    })
    
    // @ts-ignore
    return fetch(url, {
      ...options,
      agent: httpsAgent
    })
  }
  
  // HTTP URL使用普通fetch
  return fetch(url, options)
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/api/pocketbase-proxy', '')
    const searchParams = url.searchParams.toString()
    
    const targetUrl = `${POCKETBASE_URL}${path}${searchParams ? `?${searchParams}` : ''}`
    
    console.log('🔍 Proxy GET request:', {
      originalPath: path,
      targetUrl,
      searchParams
    })
    
    const response = await fetchWithIgnoreSSL(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 传递原始请求的headers
        ...Object.fromEntries(request.headers.entries())
      }
    })
    
    const data = await response.text()
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (error) {
    console.error('❌ Proxy GET error:', error)
    return NextResponse.json(
      { error: 'Proxy request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/api/pocketbase-proxy', '')
    const body = await request.text()
    
    const targetUrl = `${POCKETBASE_URL}${path}`
    
    console.log('🔍 Proxy POST request:', {
      originalPath: path,
      targetUrl,
      bodyLength: body.length
    })
    
    const response = await fetchWithIgnoreSSL(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 传递原始请求的headers
        ...Object.fromEntries(request.headers.entries())
      },
      body: body
    })
    
    const data = await response.text()
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (error) {
    console.error('❌ Proxy POST error:', error)
    return NextResponse.json(
      { error: 'Proxy request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/api/pocketbase-proxy', '')
    const body = await request.text()
    
    const targetUrl = `${POCKETBASE_URL}${path}`
    
    const response = await fetchWithIgnoreSSL(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries())
      },
      body: body
    })
    
    const data = await response.text()
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (error) {
    console.error('❌ Proxy PUT error:', error)
    return NextResponse.json(
      { error: 'Proxy request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/api/pocketbase-proxy', '')
    
    const targetUrl = `${POCKETBASE_URL}${path}`
    
    const response = await fetchWithIgnoreSSL(targetUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries())
      }
    })
    
    const data = await response.text()
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (error) {
    console.error('❌ Proxy DELETE error:', error)
    return NextResponse.json(
      { error: 'Proxy request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}
