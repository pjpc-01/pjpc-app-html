import { NextRequest, NextResponse } from 'next/server'
import { nfcManager } from '@/lib/nfc-rfid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, action } = body

    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing studentId parameter' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'access':
        // 访问学生URL
        const accessResult = await nfcManager.accessStudentUrl(studentId)
        return NextResponse.json({
          success: accessResult.success,
          data: accessResult,
          message: accessResult.message
        })

      case 'get':
        // 获取学生URL
        const url = await nfcManager.getStudentUrl(studentId)
        return NextResponse.json({
          success: true,
          data: { url },
          message: url ? 'URL获取成功' : '未找到学生URL'
        })

      case 'update':
        // 更新学生URL
        const { newUrl } = body
        if (!newUrl) {
          return NextResponse.json(
            { error: 'Missing newUrl parameter' },
            { status: 400 }
          )
        }
        const updateResult = await nfcManager.updateStudentUrl(studentId, newUrl)
        return NextResponse.json({
          success: updateResult,
          message: updateResult ? 'URL更新成功' : '学生不存在'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be access, get, or update' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('URL access error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process URL access',
        success: false
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing studentId parameter' },
        { status: 400 }
      )
    }

    const url = await nfcManager.getStudentUrl(studentId)
    
    return NextResponse.json({
      success: true,
      data: { url },
      message: url ? 'URL获取成功' : '未找到学生URL'
    })

  } catch (error) {
    console.error('Error getting student URL:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get student URL',
        success: false
      },
      { status: 500 }
    )
  }
}
