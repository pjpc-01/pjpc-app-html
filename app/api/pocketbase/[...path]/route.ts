import { NextRequest, NextResponse } from 'next/server'

const POCKETBASE_URL = 'http://192.168.0.59:8090'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathString = path.join('/')
  
  // Remove 'api' from the beginning of the path if it exists
  const cleanPath = pathString.startsWith('api/') ? pathString.substring(4) : pathString
  const url = `${POCKETBASE_URL}/api/${cleanPath}`
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy error:', error)
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
  const url = `${POCKETBASE_URL}/api/${cleanPath}`
  
  console.log('Proxy POST request:', { pathString, url })
  
  try {
    const body = await request.json()
    console.log('Proxy POST body:', body)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    console.log('Proxy POST response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Proxy POST error response:', errorText)
      return NextResponse.json(
        { error: `PocketBase error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('Proxy POST success:', data)
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy POST error:', error)
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
  const url = `${POCKETBASE_URL}/api/${cleanPath}`
  
  try {
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
    console.error('Proxy error:', error)
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
  const url = `${POCKETBASE_URL}/api/${cleanPath}`
  
  try {
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
    console.error('Proxy error:', error)
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
  const url = `${POCKETBASE_URL}/api/${cleanPath}`
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500 }
    )
  }
}
