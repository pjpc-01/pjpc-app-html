import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// 动态导出配置
export const dynamic = 'force-dynamic'

// 获取NFC卡补办申请列表
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    
    // 管理员认证
    try {
      await authenticateAdmin()
      console.log('✅ 管理员认证成功')
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError)
      return NextResponse.json(
        { 
          error: 'PocketBase认证失败', 
          details: '无法以管理员身份登录'
        },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const teacherId = searchParams.get('teacher_id')
    const studentId = searchParams.get('student_id')

    // 构建查询条件
    let filter = ''
    if (status) {
      filter += `replacement_status = "${status}"`
    }
    if (teacherId) {
      filter += filter ? ` && teacher = "${teacherId}"` : `teacher = "${teacherId}"`
    }
    if (studentId) {
      filter += filter ? ` && student = "${studentId}"` : `student = "${studentId}"`
    }

    // 获取NFC卡补办申请记录
    const records = await pb.collection('nfc_cards').getList(1, 100, {
      filter,
      sort: '-replacement_request_date',
      expand: 'student,teacher'
    })

    return NextResponse.json({
      success: true,
      data: records.items || [],
      totalItems: records.totalItems || 0
    })

  } catch (error: any) {
    console.error('获取NFC卡补办申请失败:', error)
    return NextResponse.json(
      { 
        error: '获取NFC卡补办申请失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}

// 创建NFC卡补办申请
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      studentId,
      teacherId,
      cardStatus,
      replacementReason,
      lostDate,
      lostLocation,
      urgency,
      notes
    } = body

    // 验证必需字段
    if (!studentId || !teacherId || !cardStatus || !replacementReason) {
      return NextResponse.json(
        { error: '缺少必需字段: studentId, teacherId, cardStatus, replacementReason' },
        { status: 400 }
      )
    }

    const pb = await getPocketBase()
    
    // 管理员认证
    try {
      await authenticateAdmin()
      console.log('✅ 管理员认证成功')
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError)
      return NextResponse.json(
        { 
          error: 'PocketBase认证失败', 
          details: '无法以管理员身份登录'
        },
        { status: 500 }
      )
    }

    // 创建补办申请记录
    const record = await pb.collection('nfc_cards').create({
      student: studentId,
      teacher: teacherId,
      card_status: cardStatus,
      replacement_reason: replacementReason,
      replacement_lost_date: lostDate || null,
      replacement_lost_location: lostLocation || '',
      replacement_urgency: urgency || 'normal',
      replacement_status: 'pending',
      replacement_request_date: new Date().toISOString(),
      replacement_notes: notes || ''
    })

    console.log('✅ NFC卡补办申请已创建:', record)

    return NextResponse.json({
      success: true,
      data: record,
      message: 'NFC卡补办申请已提交'
    })

  } catch (error: any) {
    console.error('创建NFC卡补办申请失败:', error)
    return NextResponse.json(
      { 
        error: '创建NFC卡补办申请失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}

// 更新NFC卡补办申请状态
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id,
      replacementStatus,
      replacementNotes,
      approvedBy
    } = body

    // 验证必需字段
    if (!id || !replacementStatus) {
      return NextResponse.json(
        { error: '缺少必需字段: id, replacementStatus' },
        { status: 400 }
      )
    }

    const pb = await getPocketBase()
    
    // 管理员认证
    try {
      await authenticateAdmin()
      console.log('✅ 管理员认证成功')
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError)
      return NextResponse.json(
        { 
          error: 'PocketBase认证失败', 
          details: '无法以管理员身份登录'
        },
        { status: 500 }
      )
    }

    // 更新补办申请状态
    const updateData: any = {
      replacement_status: replacementStatus
    }

    if (replacementNotes) {
      updateData.replacement_notes = replacementNotes
    }

    if (approvedBy) {
      updateData.approved_by = approvedBy
    }

    const record = await pb.collection('nfc_cards').update(id, updateData)

    console.log('✅ NFC卡补办申请状态已更新:', record)

    return NextResponse.json({
      success: true,
      data: record,
      message: 'NFC卡补办申请状态已更新'
    })

  } catch (error: any) {
    console.error('更新NFC卡补办申请失败:', error)
    return NextResponse.json(
      { 
        error: '更新NFC卡补办申请失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}

// 删除NFC卡补办申请
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: '缺少必需参数: id' },
        { status: 400 }
      )
    }

    const pb = await getPocketBase()
    
    // 管理员认证
    try {
      await authenticateAdmin()
      console.log('✅ 管理员认证成功')
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError)
      return NextResponse.json(
        { 
          error: 'PocketBase认证失败', 
          details: '无法以管理员身份登录'
        },
        { status: 500 }
      )
    }

    // 删除记录
    await pb.collection('nfc_cards').delete(id)
    console.log('✅ NFC卡补办申请已删除:', id)

    return NextResponse.json({
      success: true,
      message: 'NFC卡补办申请已删除'
    })

  } catch (error: any) {
    console.error('删除NFC卡补办申请失败:', error)
    return NextResponse.json(
      { 
        error: '删除NFC卡补办申请失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}
