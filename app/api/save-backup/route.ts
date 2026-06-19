import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { filename, content } = body
    
    if (!filename || !content) {
      return NextResponse.json({ error: 'Missing filename or content' }, { status: 400 })
    }
    
    // Save to project root
    const filePath = path.join(process.cwd(), filename)
    fs.writeFileSync(filePath, content, 'utf-8')
    
    return NextResponse.json({ success: true, path: filePath })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
