import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Test proxy route is working',
    url: request.url,
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  return NextResponse.json({ 
    message: 'Test proxy POST is working',
    body: body,
    timestamp: new Date().toISOString()
  })
}
