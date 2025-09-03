import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'

// 动态导出配置
export const dynamic = 'force-dynamic'

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
        console.log('🔍 学生积分记录不存在，返回默认值...')
        
        // 如果学生积分记录不存在，返回默认值而不是创建
        const defaultStudentPoints = {
          id: 'default',
          student_id: studentId,
          current_points: 0,
          total_earned: 0,
          total_spent: 0,
          season_start_date: new Date().toISOString().split('T')[0],
          season_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          season_number: Math.floor(Date.now() / (90 * 24 * 60 * 60 * 1000))
        }

        return NextResponse.json({
          student_points: defaultStudentPoints,
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
    console.log('🚀 积分API开始处理请求...')
    console.log('🔍 请求URL:', request.url)
    console.log('🔍 请求方法:', request.method)
    console.log('🔍 请求头:', Object.fromEntries(request.headers.entries()))
    
    const pb = await getPocketBase()
    console.log('✅ PocketBase实例获取成功')
    
    // 尝试解析请求数据
    let requestData
    const contentType = request.headers.get('content-type') || ''
    console.log('🔍 Content-Type:', contentType)
    
    try {
      if (contentType.includes('application/json')) {
        requestData = await request.json()
        console.log('✅ JSON解析成功')
      } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
        requestData = await request.formData()
        console.log('✅ FormData解析成功')
      } else {
        console.log('⚠️ 未知的Content-Type，尝试FormData解析...')
        requestData = await request.formData()
        console.log('✅ FormData解析成功（回退）')
      }
    } catch (parseError) {
      console.error('❌ 请求数据解析失败:', parseError)
      return NextResponse.json({ 
        error: '请求数据解析失败', 
        details: parseError instanceof Error ? parseError.message : '未知错误'
      }, { status: 400 })
    }
    
    // 根据数据类型获取字段值
    const getFieldValue = (fieldName: string) => {
      if (requestData instanceof FormData) {
        return requestData.get(fieldName)
      } else {
        return requestData[fieldName]
      }
    }
    
    const studentId = getFieldValue('student_id') as string
    const teacherId = getFieldValue('teacher_id') as string
    const pointsChange = parseInt(getFieldValue('points_change') as string)
    const transactionType = getFieldValue('transaction_type') as string
    const reason = getFieldValue('reason') as string
    const proofImage = getFieldValue('proof_image') as File | null
    const giftName = getFieldValue('gift_name') as string | null
    const giftPoints = getFieldValue('gift_points') as string | null
    
    // 添加调试信息
    console.log('🔍 接收到的学生ID:', studentId)
    console.log('🔍 接收到的教师ID:', teacherId)

    console.log('积分交易请求数据:', {
      studentId,
      teacherId,
      pointsChange,
      transactionType,
      reason,
      hasProofImage: !!proofImage,
      giftName,
      giftPoints
    })

    // 验证教师权限
    console.log('🔍 开始验证教师权限...')
    let teacher
    try {
      // 确保认证状态有效
      if (!pb.authStore.isValid) {
        console.log('⚠️ 认证状态无效，重新认证...')
        await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      }
      
      teacher = await pb.collection('teachers').getOne(teacherId)
      console.log('✅ 教师验证成功')
    } catch (error) {
      console.error('❌ 获取教师信息失败:', error)
      return NextResponse.json({ 
        error: '无效的教师信息', 
        details: error instanceof Error ? error.message : '未知错误',
        teacherId: teacherId
      }, { status: 403 })
    }
    
    if (!teacher) {
      return NextResponse.json({ error: '无效的教师信息' }, { status: 403 })
    }
    
    console.log('教师验证成功:', {
      id: teacher.id,
      name: teacher.name,
      teacherUrl: teacher.teacherUrl,
      nfc_card_number: teacher.nfc_card_number
    })

    // 验证学生存在 - 先尝试直接获取，如果失败则搜索
    let student
    try {
      // 确保认证状态有效
      if (!pb.authStore.isValid) {
        console.log('⚠️ 认证状态无效，重新认证...')
        await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      }
      
      student = await pb.collection('students').getOne(studentId)
      console.log('✅ 学生验证成功:', { id: student.id, name: student.name })
    } catch (error) {
      console.error('❌ 学生验证失败，尝试搜索学生:', error)
      
      // 尝试通过其他方式查找学生
      try {
        const searchResults = await pb.collection('students').getList(1, 10, {
          filter: `id = "${studentId}" || student_id = "${studentId}"`
        })
        
        if (searchResults.items.length > 0) {
          student = searchResults.items[0]
          console.log('✅ 通过搜索找到学生:', { id: student.id, name: student.name })
        } else {
          console.error('❌ 学生完全不存在，ID:', studentId)
          return NextResponse.json({ 
            error: '学生不存在', 
            details: `找不到ID为 ${studentId} 的学生`,
            studentId: studentId
          }, { status: 404 })
        }
      } catch (searchError) {
        console.error('❌ 搜索学生也失败:', searchError)
        return NextResponse.json({ 
          error: '学生验证失败', 
          details: searchError instanceof Error ? searchError.message : '未知错误',
          studentId: studentId
        }, { status: 404 })
      }
    }

    // 创建交易记录 - 检查字段类型
    console.log('🔍 检查字段类型:')
    console.log('  studentId:', typeof studentId, studentId)
    console.log('  teacherId:', typeof teacherId, teacherId)
    console.log('  pointsChange:', typeof pointsChange, pointsChange)
    console.log('  transactionType:', typeof transactionType, transactionType)
    console.log('  reason:', typeof reason, reason)
    
    // 使用实际找到的学生ID
    const actualStudentId = student.id
    console.log('🔍 使用实际学生ID:', actualStudentId, '而不是前端传递的ID:', studentId)
    
    const transactionData: any = {
      student_id: actualStudentId,
      teacher_id: teacherId,
      points_change: parseInt(pointsChange.toString()), // 确保是数字
      transaction_type: transactionType,
      reason: reason
    }
    
    console.log('📋 基础交易数据:', transactionData)

    // 尝试添加可选字段
    try {
      transactionData.status = 'approved'
      console.log('✅ 添加status字段成功')
    } catch (e) {
      console.log('⚠️ 添加status字段失败:', e)
    }

    try {
      transactionData.season_number = Math.floor(Date.now() / (90 * 24 * 60 * 60 * 1000))
      console.log('✅ 添加season_number字段成功')
    } catch (e) {
      console.log('⚠️ 添加season_number字段失败:', e)
    }

    if (proofImage && proofImage.size > 0) {
      try {
        transactionData.proof_image = proofImage
        console.log('✅ 添加proof_image字段成功')
      } catch (e) {
        console.log('⚠️ 添加proof_image字段失败:', e)
      }
    }

    if (giftName) {
      try {
        transactionData.gift_name = giftName
        console.log('✅ 添加gift_name字段成功')
      } catch (e) {
        console.log('⚠️ 添加gift_name字段失败:', e)
      }
    }

    if (giftPoints) {
      try {
        transactionData.gift_points = parseInt(giftPoints)
        console.log('✅ 添加gift_points字段成功')
      } catch (e) {
        console.log('⚠️ 添加gift_points字段失败:', e)
      }
    }

    console.log('📋 准备创建积分交易记录:', transactionData)
    
    // 先检查集合是否存在
    try {
      const collections = await pb.collections.getFullList()
      const pointTransactionsCollection = collections.find(c => c.name === 'point_transactions')
      console.log('🔍 point_transactions集合信息:', pointTransactionsCollection ? {
        name: pointTransactionsCollection.name,
        schema: pointTransactionsCollection.schema
      } : '集合不存在')
    } catch (e) {
      console.log('⚠️ 无法获取集合信息:', e)
    }
    
    // 检查认证状态
    console.log('🔑 当前认证状态:', {
      isValid: pb.authStore.isValid,
      model: pb.authStore.model ? '已设置' : '未设置',
      token: pb.authStore.token ? '存在' : '不存在'
    })
    
    let transaction
    try {
      // 先尝试创建最基本的记录
      const basicTransactionData = {
        student_id: actualStudentId,
        teacher_id: teacherId,
        points_change: parseInt(pointsChange.toString()),
        transaction_type: transactionType,
        reason: reason
      }
      
      console.log('🧪 尝试创建基本积分交易记录:', basicTransactionData)
      transaction = await pb.collection('point_transactions').create(basicTransactionData)
      console.log('✅ 积分交易记录创建成功:', transaction)
    } catch (createError: any) {
      console.error('❌ 创建积分交易记录失败:', createError)
      console.error('❌ 错误详情:', createError.data)
      console.error('❌ 完整错误对象:', JSON.stringify(createError, null, 2))
      console.error('❌ 请求数据:', transactionData)
      
      // 尝试获取更详细的错误信息
      if (createError.response) {
        console.error('❌ 响应详情:', createError.response)
      }
      
      // 尝试重新认证后再次创建
      console.log('🔄 尝试重新认证后再次创建...')
      try {
        await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        console.log('✅ 重新认证成功')
        
        const basicTransactionData = {
          student_id: actualStudentId,
          teacher_id: teacherId,
          points_change: parseInt(pointsChange.toString()),
          transaction_type: transactionType,
          reason: reason
        }
        
        transaction = await pb.collection('point_transactions').create(basicTransactionData)
        console.log('✅ 重新认证后积分交易记录创建成功:', transaction)
      } catch (retryError: any) {
        console.error('❌ 重新认证后仍然失败:', retryError)
        throw createError
      }
    }

    // 更新学生积分总数
    let studentPoints
    try {
      studentPoints = await pb.collection('student_points').getFirstListItem(`student_id = "${actualStudentId}"`)
      console.log('✅ 找到现有学生积分记录:', studentPoints.id)
    } catch (error) {
      console.log('🔍 学生积分记录不存在，检查是否真的不存在...')
      
      // 尝试列出所有学生积分记录来调试
      try {
        const allStudentPoints = await pb.collection('student_points').getList(1, 10)
        console.log('🔍 所有学生积分记录:', allStudentPoints.items.map(item => ({ id: item.id, student_id: item.student_id })))
        
        // 检查是否有匹配的记录
        const matchingRecords = allStudentPoints.items.filter(item => item.student_id === actualStudentId)
        if (matchingRecords.length > 0) {
          console.log('✅ 找到匹配的记录，使用第一个:', matchingRecords[0].id)
          studentPoints = matchingRecords[0]
        } else {
          console.log('🔍 确实没有匹配的记录，使用默认值...')
          studentPoints = {
            id: 'default',
            student_id: actualStudentId,
            current_points: 0,
            total_earned: 0,
            total_spent: 0,
            season_start_date: new Date().toISOString().split('T')[0],
            season_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            season_number: Math.floor(Date.now() / (90 * 24 * 60 * 60 * 1000))
          }
        }
      } catch (listError) {
        console.error('❌ 列出学生积分记录失败:', listError)
        // 如果列出也失败，使用默认值
        studentPoints = {
          id: 'default',
          student_id: actualStudentId,
          current_points: 0,
          total_earned: 0,
          total_spent: 0,
          season_start_date: new Date().toISOString().split('T')[0],
          season_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          season_number: Math.floor(Date.now() / (90 * 24 * 60 * 60 * 1000))
        }
      }
    }

    const newCurrentPoints = studentPoints.current_points + pointsChange
    const newTotalEarned = pointsChange > 0 ? studentPoints.total_earned + pointsChange : studentPoints.total_earned
    const newTotalSpent = pointsChange < 0 ? studentPoints.total_spent + Math.abs(pointsChange) : studentPoints.total_spent
    
    // 确保 total_earned 和 total_spent 不为 0（PocketBase 验证要求）
    const finalTotalEarned = newTotalEarned === 0 ? 1 : newTotalEarned
    const finalTotalSpent = newTotalSpent === 0 ? 1 : newTotalSpent

    // 如果学生积分记录是默认值，创建新记录；否则更新现有记录
    if (studentPoints.id === 'default') {
      console.log('🔍 创建新的学生积分记录...')
      try {
        // 根据集合验证规则，total_earned 和 total_spent 是必需字段且不能为0
        const createData: any = {
          student_id: actualStudentId,
          current_points: newCurrentPoints,
          total_earned: finalTotalEarned, // 必需字段，不能为0
          total_spent: finalTotalSpent,   // 必需字段，不能为0
          season_start_date: studentPoints.season_start_date,
          season_end_date: studentPoints.season_end_date,
          season_number: studentPoints.season_number
        }
        
        console.log('📋 创建学生积分记录数据:', createData)
        console.log('🔍 数据类型检查:')
        console.log('  student_id:', typeof createData.student_id, createData.student_id)
        console.log('  current_points:', typeof createData.current_points, createData.current_points)
        console.log('  season_start_date:', typeof createData.season_start_date, createData.season_start_date)
        console.log('  season_end_date:', typeof createData.season_end_date, createData.season_end_date)
        console.log('  season_number:', typeof createData.season_number, createData.season_number)
        
        // 验证学生ID是否存在
        try {
          const studentCheck = await pb.collection('students').getOne(createData.student_id)
          console.log('✅ 学生ID验证成功:', studentCheck.id)
        } catch (studentError) {
          console.error('❌ 学生ID验证失败:', studentError)
          throw new Error(`学生ID ${createData.student_id} 不存在`)
        }
        
        // 检查集合权限和结构
        try {
          const collections = await pb.collections.getFullList()
          const studentPointsCollection = collections.find(c => c.name === 'student_points')
          if (studentPointsCollection) {
            console.log('✅ student_points 集合存在')
            console.log('🔍 集合字段:', studentPointsCollection.schema.map((f: any) => ({ name: f.name, type: f.type, required: f.required })))
          } else {
            console.error('❌ student_points 集合不存在')
            throw new Error('student_points 集合不存在')
          }
        } catch (collectionError) {
          console.error('❌ 检查集合失败:', collectionError)
        }
        
        const createdRecord = await pb.collection('student_points').create(createData)
        console.log('✅ 学生积分记录创建成功:', createdRecord)
      } catch (createError: any) {
        console.error('❌ 创建学生积分记录失败:', createError)
        console.error('❌ 错误详情:', createError.data)
        console.error('❌ 完整错误对象:', JSON.stringify(createError, null, 2))
        throw new Error(`创建学生积分记录失败: ${createError.data?.message || createError.message}`)
      }
    } else {
      console.log('🔍 更新现有学生积分记录...')
      try {
        const updateData: any = {
          current_points: newCurrentPoints,
          total_earned: finalTotalEarned, // 必需字段，不能为0
          total_spent: finalTotalSpent    // 必需字段，不能为0
        }
        
        console.log('📋 更新学生积分记录数据:', updateData)
        await pb.collection('student_points').update(studentPoints.id, updateData)
        console.log('✅ 学生积分记录更新成功')
      } catch (updateError: any) {
        console.error('❌ 更新学生积分记录失败:', updateError)
        console.error('❌ 错误详情:', updateError.data)
        throw new Error(`更新学生积分记录失败: ${updateError.data?.message || updateError.message}`)
      }
    }

    console.log('积分交易创建成功:', transaction)
    return NextResponse.json({ success: true, transaction })
  } catch (error) {
    console.error('❌ 创建积分交易失败 - 主错误处理器:', error)
    console.error('❌ 错误类型:', typeof error)
    console.error('❌ 错误详情:', {
      message: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      cause: error instanceof Error ? error.cause : undefined,
      toString: error?.toString?.()
    })
    
    // 确保总是返回有效的错误响应
    let errorMessage = '创建积分交易失败'
    let errorDetails = '未知错误'
    
    if (error instanceof Error) {
      errorMessage = error.message || errorMessage
      errorDetails = error.stack || errorDetails
    } else if (typeof error === 'string') {
      errorMessage = error
      errorDetails = error
    } else if (error && typeof error === 'object') {
      errorMessage = (error as any).message || (error as any).error || errorMessage
      errorDetails = JSON.stringify(error)
    }
    
    const errorResponse = {
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      type: error instanceof Error ? error.name : 'UnknownError',
      status: 500
    }
    
    console.error('📤 返回错误响应:', errorResponse)
    
    try {
      return NextResponse.json(errorResponse, { status: 500 })
    } catch (jsonError) {
      console.error('❌ 无法序列化错误响应:', jsonError)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
