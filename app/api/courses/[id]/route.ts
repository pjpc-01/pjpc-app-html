import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export const dynamic = 'force-dynamic'

// 获取单个课程
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()

    const course = await pb.collection('courses').getOne(params.id, {
      expand: 'teacher_id'
    })

    return NextResponse.json({
      success: true,
      data: course
    })

  } catch (error) {
    console.error('获取课程失败:', error)
    return NextResponse.json(
      { 
        error: '获取课程失败', 
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// 更新课程
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()

    const body = await request.json()
    const course = await pb.collection('courses').update(params.id, body)

    return NextResponse.json({
      success: true,
      data: course
    })

  } catch (error) {
    console.error('更新课程失败:', error)
    return NextResponse.json(
      { 
        error: '更新课程失败', 
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// 删除课程
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()

    await pb.collection('courses').delete(params.id)

    return NextResponse.json({
      success: true,
      message: '课程删除成功'
    })

  } catch (error) {
    console.error('删除课程失败:', error)
    return NextResponse.json(
      { 
        error: '删除课程失败', 
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

