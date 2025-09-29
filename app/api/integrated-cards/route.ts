import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// 动态导出配置
export const dynamic = 'force-dynamic'

// 获取整合的卡片数据
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
    const center = searchParams.get('center')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // 获取学生数据
    let studentFilter = ''
    if (center) {
      studentFilter = `center = "${center}"`
    }

    const students = await pb.collection('students').getList(1, 1000, {
      filter: studentFilter,
      sort: 'student_id'
    })

    // 获取NFC卡片数据
    let cardFilter = ''
    if (status) {
      cardFilter += `replacement_status = "${status}"`
    }

    const nfcCards = await pb.collection('nfc_cards').getList(1, 1000, {
      filter: cardFilter,
      sort: '-replacement_request_date',
      expand: 'student,teacher'
    })

    // 整合数据
    const integratedCards = []

    // 处理有NFC卡片记录的学生
    for (const nfcCard of nfcCards.items) {
      const student = students.items.find(s => s.id === nfcCard.student)
      if (student) {
        integratedCards.push({
          id: nfcCard.id,
          cardNumber: student.cardNumber || nfcCard.card_number || '',
          studentId: student.student_id || '',
          studentName: student.student_name || '',
          cardType: 'NFC', // 默认NFC类型
          status: nfcCard.replacement_status || 'approved', // 使用replacement_status字段
          issuedDate: nfcCard.replacement_request_date || '',
          expiryDate: '', // 没有过期日期字段
          notes: nfcCard.replacement_notes || '',
          lastUsed: nfcCard.replacement_request_date || '',
          isAssociated: true,
          associationDate: nfcCard.replacement_request_date || '',
          replacementRequestId: nfcCard.replacement_request_id || '',
          totalCheckins: 0, // 没有打卡统计字段
          lastCheckin: '',
          studentCenter: student.center || '',
          studentGrade: student.standard || '',
          studentStatus: student.status || 'active',
          // 学生信息对象
          student: {
            id: student.id,
            student_id: student.student_id,
            student_name: student.student_name,
            center: student.center,
            standard: student.standard,
            gender: student.gender,
            serviceType: student.serviceType,
            parentName: student.parentName,
            parentPhone: student.parentPhone,
          },
          // 原始数据
          rawNfcCard: nfcCard,
          rawStudent: student
        })
      }
    }

    // 注意：不再创建临时卡片，只显示真实的NFC卡片记录
    // 如果学生有cardNumber但没有NFC记录，他们需要先创建NFC记录才能显示在卡片管理中

    // 应用类型筛选
    let filteredCards = integratedCards
    if (type && type !== 'all') {
      filteredCards = filteredCards.filter(card => card.cardType === type)
    }

    // 计算统计信息
    const stats = {
      totalCards: filteredCards.length,
      activeCards: filteredCards.filter(c => c.status === 'active').length,
      associatedCards: filteredCards.filter(c => c.isAssociated).length,
      pendingReplacements: filteredCards.filter(c => c.status === 'pending').length,
      todayCheckins: filteredCards.filter(c => 
        c.lastCheckin && new Date(c.lastCheckin).toDateString() === new Date().toDateString()
      ).length,
      systemHealth: 95
    }

    console.log('✅ 获取整合卡片数据成功:', {
      totalCards: stats.totalCards,
      activeCards: stats.activeCards,
      associatedCards: stats.associatedCards
    })

    return NextResponse.json({
      success: true,
      data: filteredCards,
      stats,
      total: filteredCards.length
    })

  } catch (error: any) {
    console.error('❌ 获取整合卡片数据失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '获取整合卡片数据失败',
      message: error.message || '未知错误'
    }, { status: 500 })
  }
}

// 创建新的卡片关联
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { cardNumber, studentId, cardType = 'NFC', notes = '' } = body

    if (!cardNumber || !studentId) {
      return NextResponse.json({
        success: false,
        error: '卡片号和学生ID不能为空'
      }, { status: 400 })
    }

    // 查找学生 - 支持通过ID或student_id查找
    let students
    try {
      // 首先尝试通过ID查找
      students = await pb.collection('students').getList(1, 1, {
        filter: `id = "${studentId}"`
      })
      
      // 如果没找到，尝试通过student_id查找
      if (students.items.length === 0) {
        students = await pb.collection('students').getList(1, 1, {
          filter: `student_id = "${studentId}"`
        })
      }
    } catch (error) {
      console.error('❌ 查找学生失败:', error)
      return NextResponse.json({
        success: false,
        error: '查找学生时发生错误'
      }, { status: 500 })
    }

    if (students.items.length === 0) {
      console.log('❌ 找不到指定的学生:', studentId)
      return NextResponse.json({
        success: false,
        error: '找不到指定的学生'
      }, { status: 404 })
    }

    const student = students.items[0]
    console.log('✅ 找到学生:', student.student_name, student.student_id)

    // 更新学生的卡片信息
    await pb.collection('students').update(student.id, {
      cardNumber: cardNumber,
      nfc_tag_id: cardNumber
    })

    // 创建NFC卡片记录 - 使用正确的字段名
    const nfcCardData = {
      card_number: cardNumber,           // 卡片号 - 使用card_number字段
      student: student.id,               // 学生关联
      card_status: 'normal',             // 卡片状态：normal, lost, damaged, replaced
      replacement_request_id: '',        // 补办申请ID
      replacement_reason: '',            // 补办原因
      replacement_lost_date: '',         // 丢失日期
      replacement_lost_location: '',     // 丢失地点
      replacement_urgency: 'normal',     // 紧急程度：low, normal, high, urgent
      replacement_status: 'approved',    // 补办状态：pending, approved, rejected, completed
      replacement_request_date: new Date().toISOString(), // 申请日期
      replacement_notes: notes || ''     // 备注
    }

    const nfcCard = await pb.collection('nfc_cards').create(nfcCardData)

    console.log('✅ 创建卡片关联成功:', {
      cardNumber,
      studentName: student.student_name,
      nfcCardId: nfcCard.id
    })

    return NextResponse.json({
      success: true,
      message: '卡片关联创建成功',
      data: {
        id: nfcCard.id,
        cardNumber,
        studentId: student.student_id,
        studentName: student.student_name,
        cardType,
        status: 'active',
        issuedDate: nfcCardData.issuedDate,
        isAssociated: true,
        associationDate: nfcCardData.lastUsed
      }
    })

  } catch (error: any) {
    console.error('❌ 创建卡片关联失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '创建卡片关联失败',
      message: error.message || '未知错误'
    }, { status: 500 })
  }
}

// 更新卡片信息
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { cardId, cardNumber, studentId, cardType, status, notes } = body

    if (!cardId) {
      return NextResponse.json({
        success: false,
        error: '卡片ID不能为空'
      }, { status: 400 })
    }

    // 更新NFC卡片记录 - 使用正确的字段名
    const updateData: any = {}
    if (cardNumber) updateData.card_number = cardNumber
    // cardType 在nfc_cards表中没有对应字段，跳过
    if (status) {
      // 根据数据库字段配置，replacement_status支持: pending, approved, rejected, completed
      // 我们需要将前端状态映射到数据库支持的状态
      const statusMapping: { [key: string]: string } = {
        'active': 'approved',      // 活跃状态映射为已批准
        'inactive': 'rejected',    // 停用状态映射为已拒绝
        'lost': 'pending',         // 丢失状态映射为待处理
        'replaced': 'completed',   // 已补办映射为已完成
        'pending': 'pending',      // 待处理保持不变
        'approved': 'approved',    // 已批准保持不变
        'rejected': 'rejected',    // 已拒绝保持不变
        'completed': 'completed'   // 已完成保持不变
      }
      
      if (statusMapping[status]) {
        updateData.replacement_status = statusMapping[status]
        console.log('✅ 状态映射成功:', `${status} -> ${statusMapping[status]}`)
      } else {
        // 对于未知状态，默认设为pending
        updateData.replacement_status = 'pending'
        console.log('⚠️ 未知状态值，设为pending:', status)
      }
    }
    if (notes !== undefined) updateData.replacement_notes = notes

    console.log('🔍 更新数据详情:', {
      cardId,
      updateData,
      collection: 'nfc_cards'
    })

    // 注意：不再处理临时卡片，只更新真实的NFC卡片记录

    // 先检查记录是否存在
    try {
      const existingCard = await pb.collection('nfc_cards').getOne(cardId)
      console.log('✅ 找到现有记录:', {
        id: existingCard.id,
        card_number: existingCard.card_number,
        replacement_status: existingCard.replacement_status
      })
    } catch (getError) {
      console.error('❌ 记录不存在或无法访问:', getError)
      return NextResponse.json({
        success: false,
        error: '卡片记录不存在',
        message: `无法找到ID为 ${cardId} 的卡片记录`
      }, { status: 404 })
    }

    const updatedCard = await pb.collection('nfc_cards').update(cardId, updateData)

    console.log('✅ 更新卡片信息成功:', {
      cardId: cardId,
      cardNumber: updatedCard.cardNumber,
      status: updatedCard.replacement_status
    })

    return NextResponse.json({
      success: true,
      message: '卡片信息更新成功',
      data: updatedCard
    })

  } catch (error: any) {
    console.error('❌ 更新卡片信息失败:', error)
    console.error('❌ 错误详情:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cardId: cardId,
      updateData: updateData
    })
    
    return NextResponse.json({
      success: false,
      error: '更新卡片信息失败',
      message: error.message || '未知错误',
      details: error.stack || '无详细错误信息',
      cardId: cardId,
      updateData: updateData
    }, { status: 500 })
  }
}

// 删除卡片关联
export async function DELETE(request: NextRequest) {
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
          details: '无法以管理员身份登录',
          authError: authError.message
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { cardId } = body

    if (!cardId) {
      return NextResponse.json({
        success: false,
        error: '卡片ID不能为空'
      }, { status: 400 })
    }

    // 删除NFC卡片记录（只处理真实卡片）
    try {
      await pb.collection('nfc_cards').delete(cardId)
      console.log('✅ 删除NFC卡片记录成功:', { cardId })
    } catch (nfcError) {
      console.error('❌ 删除NFC卡片记录失败:', nfcError)
      return NextResponse.json({
        success: false,
        error: '删除NFC卡片记录失败',
        message: nfcError.message || '未知错误'
      }, { status: 500 })
    }

    console.log('✅ 删除卡片关联成功:', { cardId })

    return NextResponse.json({
      success: true,
      message: '卡片关联删除成功'
    })

  } catch (error: any) {
    console.error('❌ 删除卡片关联失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '删除卡片关联失败',
      message: error.message || '未知错误'
    }, { status: 500 })
  }
}
