import { NextRequest, NextResponse } from 'next/server'
import { pb } from '@/lib/pocketbase'

// 获取排班模板
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let filter = ''
    if (type && type !== 'all') {
      filter = `type = "${type}"`
    }

    const templates = await pb.collection('schedule_templates').getList(1, 100, {
      filter,
      sort: 'name'
    })

    return NextResponse.json({
      success: true,
      templates: templates.items
    })
  } catch (error) {
    console.error('获取排班模板失败:', error)
    return NextResponse.json(
      { success: false, error: '获取排班模板失败' },
      { status: 500 }
    )
  }
}

// 创建排班模板
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const templateData = {
      name: data.name,
      type: data.type,
      work_days: data.workDays,
      start_time: data.startTime,
      end_time: data.endTime,
      break_duration: data.breakDuration,
      max_hours_per_week: data.maxHoursPerWeek,
      color: data.color,
      description: data.description,
      requirements: data.requirements || []
    }

    const template = await pb.collection('schedule_templates').create(templateData)

    return NextResponse.json({
      success: true,
      template
    })
  } catch (error) {
    console.error('创建排班模板失败:', error)
    return NextResponse.json(
      { success: false, error: '创建排班模板失败' },
      { status: 500 }
    )
  }
}

// 更新排班模板
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data

    const template = await pb.collection('schedule_templates').update(id, updateData)

    return NextResponse.json({
      success: true,
      template
    })
  } catch (error) {
    console.error('更新排班模板失败:', error)
    return NextResponse.json(
      { success: false, error: '更新排班模板失败' },
      { status: 500 }
    )
  }
}

// 删除排班模板
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少模板ID' },
        { status: 400 }
      )
    }

    await pb.collection('schedule_templates').delete(id)

    return NextResponse.json({
      success: true,
      message: '排班模板删除成功'
    })
  } catch (error) {
    console.error('删除排班模板失败:', error)
    return NextResponse.json(
      { success: false, error: '删除排班模板失败' },
      { status: 500 }
    )
  }
}
