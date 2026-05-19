import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import { authenticateAdmin } from '@/lib/auth-utils'
import PocketBase from 'pocketbase'

// 从环境变量获取PocketBase URL
const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8090'

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
    
    // 如果路径为空或只有斜杠，返回PocketBase API信息
    if (path === '' || path === '/') {
      return NextResponse.json({
        message: 'PocketBase Proxy API',
        status: 'active',
        pocketbase_url: POCKETBASE_URL,
        available_endpoints: [
          '/api/collections/users/auth-with-password',
          '/api/collections/students',
          '/api/health',
          '/api/collections'
        ],
        timestamp: new Date().toISOString()
      })
    }

    // 对于需要认证的集合，先进行管理员认证
    const pb = new PocketBase(POCKETBASE_URL)
    try {
      await authenticateAdmin(pb)
      console.log('✅ Proxy: 管理员认证成功')
    } catch (authError) {
      console.error('❌ Proxy: 管理员认证失败:', authError)
      return NextResponse.json(
        { error: '认证失败', details: authError instanceof Error ? authError.message : '未知错误' },
        { status: 401 }
      )
    }
    
    console.log('🔍 Proxy GET request:', {
      originalPath: path,
      searchParams
    })
    
    // 使用已认证的PocketBase实例直接获取数据
    let result
    try {
      if (path.includes('/api/collections/') && path.includes('/records')) {
        // 解析集合名称和参数
        const pathParts = path.split('/')
        const collectionIndex = pathParts.indexOf('collections')
        const collectionName = pathParts[collectionIndex + 1]
        
        // 解析查询参数
        const page = parseInt(searchParams.match(/page=(\d+)/)?.[1] || '1')
        const perPage = parseInt(searchParams.match(/perPage=(\d+)/)?.[1] || '100')
        const filter = searchParams.match(/filter=([^&]+)/)?.[1]
        const sort = searchParams.match(/sort=([^&]+)/)?.[1]
        
        // 构建查询选项
        const options: any = {}
        if (filter) options.filter = decodeURIComponent(filter)
        if (sort) options.sort = decodeURIComponent(sort)
        
        console.log(`📊 获取集合 ${collectionName}:`, { page, perPage, options })
        
        // 获取数据
        try {
          result = await pb.collection(collectionName).getList(page, perPage, options)
        } catch (collectionError: any) {
          console.error(`❌ 获取集合 ${collectionName} 失败:`, collectionError)
          
          // 如果集合不存在或没有权限，返回空结果而不是错误
          if (collectionError.status === 400 || collectionError.status === 404 || collectionError.status === 403) {
            console.log(`⚠️ 集合 ${collectionName} 可能不存在或无权限，返回空结果`)
            result = {
              items: [],
              totalItems: 0,
              page: page,
              perPage: perPage,
              totalPages: 0
            }
          } else {
            throw collectionError
          }
        }
      } else {
        // 其他请求仍然使用fetch
        const finalPath = path
        const targetUrl = `${POCKETBASE_URL}${finalPath}${searchParams ? `?${searchParams}` : ''}`
        
        const response = await fetchWithIgnoreSSL(targetUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': pb.authStore.token,
            ...Object.fromEntries(request.headers.entries())
          }
        })
        
        result = await response.json()
      }
      
      return NextResponse.json(result, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      })
    } catch (fetchError) {
      console.error('❌ Proxy: 数据获取失败:', fetchError)
      return NextResponse.json(
        { error: '数据获取失败', details: fetchError instanceof Error ? fetchError.message : '未知错误' },
        { status: 500 }
      )
    }
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
    
    // 如果路径为空或只有斜杠，返回PocketBase API信息
    if (path === '' || path === '/') {
      return NextResponse.json({
        message: 'PocketBase Proxy API',
        status: 'active',
        pocketbase_url: POCKETBASE_URL,
        available_endpoints: [
          '/api/collections/users/auth-with-password',
          '/api/collections/students',
          '/api/health',
          '/api/collections'
        ],
        timestamp: new Date().toISOString()
      })
    }
    
    const finalPath = path
    const targetUrl = `${POCKETBASE_URL}${finalPath}`
    
    console.log('🔍 Proxy POST request:', {
      originalPath: path,
      finalPath,
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
    
    // 如果路径为空，返回PocketBase API信息
    if (path === '') {
      return NextResponse.json({
        message: 'PocketBase Proxy API',
        status: 'active',
        pocketbase_url: POCKETBASE_URL,
        available_endpoints: [
          '/api/collections/users/auth-with-password',
          '/api/collections/students',
          '/api/health',
          '/api/collections'
        ],
        timestamp: new Date().toISOString()
      })
    }
    
    const finalPath = path
    const targetUrl = `${POCKETBASE_URL}${finalPath}`
    
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
    
    // 如果路径为空，返回PocketBase API信息
    if (path === '') {
      return NextResponse.json({
        message: 'PocketBase Proxy API',
        status: 'active',
        pocketbase_url: POCKETBASE_URL,
        available_endpoints: [
          '/api/collections/users/auth-with-password',
          '/api/collections/students',
          '/api/health',
          '/api/collections'
        ],
        timestamp: new Date().toISOString()
      })
    }
    
    const finalPath = path
    const targetUrl = `${POCKETBASE_URL}${finalPath}`
    
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
