import { NextRequest, NextResponse } from 'next/server'

// 排班模板功能已并入 schedules（day_of_week 为空的 = 具体日期班；有值 = 周模板）
// 与 course_time_slots（年级时段）。PB 无 schedule_templates 集合，
// 这里保留兼容层，返回空模板，避免前端拿到 500。
export async function GET(_request: NextRequest) {
  return NextResponse.json({ success: true, templates: [], note: '模板已并入 schedules / course_time_slots' })
}

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { success: false, error: '排班模板功能已停用，请在「课程管理 → 时间表」维护时段模板' },
    { status: 501 }
  )
}

export async function PUT(_request: NextRequest) {
  return NextResponse.json(
    { success: false, error: '排班模板功能已停用' },
    { status: 501 }
  )
}

export async function DELETE(_request: NextRequest) {
  return NextResponse.json(
    { success: false, error: '排班模板功能已停用' },
    { status: 501 }
  )
}
