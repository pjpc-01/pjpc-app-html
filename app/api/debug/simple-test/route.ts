import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export async function GET(request: NextRequest) {
  try {
    // 简单的测试：尝试读取一个文档
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    
    return NextResponse.json({
      success: true,
      message: 'Firestore 访问成功',
      count: snapshot.size,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Firestore 测试失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Firestore 访问失败',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({
      success: true,
      message: 'POST request received',
      data: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
} 