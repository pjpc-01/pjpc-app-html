import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'

// 获取学生积分记录
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const teacherNfcCard = searchParams.get('teacher_nfc_card')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '50')

    if (studentId) {
      // 获取特定学生的积分信息
      try {
        const studentPoints = await pb.collection('student_points').getFirstListItem(`student_id = "${studentId}"`, {
          expand: 'student_id'
        })
        
        const transactions = await pb.collection('point_transactions').getList(page, perPage, {
          filter: `student_id = "${studentId}"`,
          sort: '-created',
          expand: 'student_id,teacher_id'
        })

        return NextResponse.json({
          student_points: studentPoints,
          transactions: transactions
        })
      } catch (error) {
        // 如果学生积分记录不存在，创建一个
        const newStudentPoints = await pb.collection('student_points').create({
          student_id: studentId,
          current_points: 0,
          total_earned: 0,
          total_spent: 0,
          season_start_date: new Date().toISOString().split('T')[0],
          season_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          season_number: Math.floor(Date.now() / (90 * 24 * 60 * 60 * 1000))
        })

        return NextResponse.json({
          student_points: newStudentPoints,
          transactions: { items: [], totalItems: 0, totalPages: 0, page: 1, perPage: 50 }
        })
      }
    } else if (teacherNfcCard) {
      // 验证教师NFC卡
      try {
        const teacher = await pb.collection('teachers').getFirstListItem(`nfc_card_number = "${teacherNfcCard}"`)
        return NextResponse.json({ teacher, valid: true })
      } catch (error) {
        return NextResponse.json({ valid: false, error: '无效的教师NFC卡' }, { status: 404 })
      }
    } else {
      // 获取所有学生积分排行榜
      const allStudentPoints = await pb.collection('student_points').getList(page, perPage, {
        sort: '-current_points',
        expand: 'student_id'
      })

      return NextResponse.json(allStudentPoints)
    }
  } catch (error) {
    console.error('获取积分数据失败:', error)
    return NextResponse.json({ error: '获取积分数据失败' }, { status: 500 })
  }
}

// 创建积分交易
export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const formData = await request.formData()
    
    const studentId = formData.get('student_id') as string
    const teacherId = formData.get('teacher_id') as string
    const pointsChange = parseInt(formData.get('points_change') as string)
    const transactionType = formData.get('transaction_type') as string
    const reason = formData.get('reason') as string
    const proofImage = formData.get('proof_image') as File | null
    const giftName = formData.get('gift_name') as string | null
    const giftPoints = formData.get('gift_points') as string | null

    // 验证教师权限
    const teacher = await pb.collection('teachers').getOne(teacherId)
    if (!teacher || !teacher.nfc_card_number) {
      return NextResponse.json({ error: '无效的教师信息' }, { status: 403 })
    }

    // 创建交易记录
    const transactionData: any = {
      student_id: studentId,
      teacher_id: teacherId,
      points_change: pointsChange,
      transaction_type: transactionType,
      reason: reason,
      status: 'approved', // 教师操作直接批准
      season_number: Math.floor(Date.now() / (90 * 24 * 60 * 60 * 1000))
    }

    if (proofImage && proofImage.size > 0) {
      transactionData.proof_image = proofImage
    }

    if (giftName) {
      transactionData.gift_name = giftName
    }

    if (giftPoints) {
      transactionData.gift_points = parseInt(giftPoints)
    }

    const transaction = await pb.collection('point_transactions').create(transactionData)

    // 更新学生积分总数
    let studentPoints
    try {
      studentPoints = await pb.collection('student_points').getFirstListItem(`student_id = "${studentId}"`)
    } catch (error) {
      // 如果不存在，创建新记录
      studentPoints = await pb.collection('student_points').create({
        student_id: studentId,
        current_points: 0,
        total_earned: 0,
        total_spent: 0,
        season_start_date: new Date().toISOString().split('T')[0],
        season_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        season_number: Math.floor(Date.now() / (90 * 24 * 60 * 60 * 1000))
      })
    }

    const newCurrentPoints = studentPoints.current_points + pointsChange
    const newTotalEarned = pointsChange > 0 ? studentPoints.total_earned + pointsChange : studentPoints.total_earned
    const newTotalSpent = pointsChange < 0 ? studentPoints.total_spent + Math.abs(pointsChange) : studentPoints.total_spent

    await pb.collection('student_points').update(studentPoints.id, {
      current_points: newCurrentPoints,
      total_earned: newTotalEarned,
      total_spent: newTotalSpent
    })

    return NextResponse.json({ success: true, transaction })
  } catch (error) {
    console.error('创建积分交易失败:', error)
    return NextResponse.json({ error: '创建积分交易失败' }, { status: 500 })
  }
}
