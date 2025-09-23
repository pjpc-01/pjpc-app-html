import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'

// 动态导出配置
export const dynamic = 'force-dynamic'

// 获取学生积分记录
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    
    // 先进行管理员认证
    await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
    console.log('✅ 管理员认证成功')
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const teacherNfcCard = searchParams.get('teacher_nfc_card')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '50')

    if (studentId) {
      // 获取特定学生的积分信息
      try {
        // 首先尝试通过PocketBase记录ID查询
        let studentPoints
        try {
          studentPoints = await pb.collection('student_points').getFirstListItem(`student_id = "${studentId}"`, {
            expand: 'student_id'
          })
        } catch (error) {
          // 如果通过记录ID找不到，尝试通过学号查询
          const student = await pb.collection('students').getFirstListItem(`student_id = "${studentId}"`)
          studentPoints = await pb.collection('student_points').getFirstListItem(`student_id = "${student.id}"`, {
            expand: 'student_id'
          })
        }
        
        const transactions = await pb.collection('point_transactions').getList(page, perPage, {
          filter: `student_id = "${studentId}"`,
          sort: '-created',
          expand: 'student_id,teacher_id'
        })

        // 调整显示值：如果total_earned和total_spent都是1且current_points是0，说明是初始记录
        const adjustedStudentPoints = {
          ...studentPoints,
          total_earned: studentPoints.total_earned === 1 && studentPoints.current_points === 0 ? 0 : studentPoints.total_earned,
          total_spent: studentPoints.total_spent === 1 && studentPoints.current_points === 0 ? 0 : studentPoints.total_spent
        }
        
        return NextResponse.json({
          student_points: adjustedStudentPoints,
          transactions: transactions
        })
      } catch (error) {
        console.log('🔍 学生积分记录不存在，创建新记录...')
        
        // 如果学生积分记录不存在，创建新记录
        try {
          // 首先查找学生记录，确定正确的学生ID
          let actualStudentId = studentId
          try {
            // 尝试通过学号查找学生
            const student = await pb.collection('students').getFirstListItem(`student_id = "${studentId}"`)
            actualStudentId = student.id
          } catch (error) {
            // 如果通过学号找不到，假设传入的就是PocketBase记录ID
            actualStudentId = studentId
          }
          
          const newStudentPoints = await pb.collection('student_points').create({
            student_id: actualStudentId,
            current_points: 0,
            total_earned: 1, // 数据库Nonzero约束要求，初始设为1
            total_spent: 1,  // 数据库Nonzero约束要求，初始设为1
            season_start_date: new Date().toISOString().split('T')[0],
            season_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            season_number: Math.floor(Date.now() / (90 * 24 * 60 * 60 * 1000))
          })
          
          console.log('✅ 创建新学生积分记录成功:', newStudentPoints.id)
          
          // 调整显示值：如果total_earned和total_spent都是1且current_points是0，说明是初始记录
          const adjustedStudentPoints = {
            ...newStudentPoints,
            total_earned: newStudentPoints.total_earned === 1 && newStudentPoints.current_points === 0 ? 0 : newStudentPoints.total_earned,
            total_spent: newStudentPoints.total_spent === 1 && newStudentPoints.current_points === 0 ? 0 : newStudentPoints.total_spent
          }
          
          return NextResponse.json({
            student_points: adjustedStudentPoints,
            transactions: { items: [], totalItems: 0, totalPages: 0, page: 1, perPage: 50 }
          })
        } catch (createError) {
          console.error('❌ 创建学生积分记录失败:', createError)
          
          // 如果创建失败，返回默认值
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
      transactionData.season_number = 1
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
    
    // 确保认证状态有效
    if (!pb.authStore.isValid) {
      console.log('⚠️ 认证状态无效，重新认证...')
      await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      console.log('✅ 重新认证完成')
    }
    
    // 测试PocketBase连接和权限
    try {
      console.log('🧪 测试PocketBase连接...')
      const testCollections = await pb.collections.getFullList()
      console.log('✅ PocketBase连接正常，集合数量:', testCollections.length)
      
      // 测试point_transactions集合访问
      const testList = await pb.collection('point_transactions').getList(1, 1)
      console.log('✅ point_transactions集合访问正常，记录数:', testList.totalItems)
    } catch (testError) {
      console.error('❌ PocketBase连接测试失败:', testError)
      return NextResponse.json({ 
        error: 'PocketBase连接失败', 
        details: testError instanceof Error ? testError.message : '未知错误'
      }, { status: 500 })
    }
    
    // 数据库直接支持这些交易类型，无需转换
    const dbTransactionType = transactionType
    
    let transaction
    let basicTransactionData
    
    try {
      
      // 先尝试创建最基本的记录
      basicTransactionData = {
        student_id: actualStudentId,
        teacher_id: teacher.id, // 使用教师ID作为relation
        points_change: parseInt(pointsChange.toString()),
        transaction_type: dbTransactionType, // 使用数据库接受的格式
        reason: reason,
        status: 'approved', // 默认状态为已批准
        season_number: 1 // 默认赛季为1
      }
      
      // 先尝试创建一个最简单的测试记录
      console.log('🧪 尝试创建测试记录...')
      const testData = {
        student_id: actualStudentId,
        teacher_id: teacher.id,
        points_change: 1,
        transaction_type: 'add_points', // 使用数据库支持的格式
        reason: 'test',
        status: 'approved',
        season_number: 1
      }
      
      try {
        const testTransaction = await pb.collection('point_transactions').create(testData)
        console.log('✅ 测试记录创建成功:', testTransaction.id)
        // 删除测试记录
        await pb.collection('point_transactions').delete(testTransaction.id)
        console.log('✅ 测试记录已删除')
      } catch (testError) {
        console.error('❌ 测试记录创建失败:', testError)
        console.error('❌ 测试错误详情:', (testError as any).data)
        throw testError
      }
      
      console.log('🧪 尝试创建基本积分交易记录:', basicTransactionData)
      console.log('🔍 字段类型检查:')
      console.log('  student_id:', typeof basicTransactionData.student_id, basicTransactionData.student_id)
      console.log('  teacher_id:', typeof basicTransactionData.teacher_id, basicTransactionData.teacher_id)
      console.log('  points_change:', typeof basicTransactionData.points_change, basicTransactionData.points_change)
      console.log('  transaction_type:', typeof basicTransactionData.transaction_type, basicTransactionData.transaction_type)
      console.log('  reason:', typeof basicTransactionData.reason, basicTransactionData.reason)
      console.log('  status:', typeof basicTransactionData.status, basicTransactionData.status)
      console.log('  season_number:', typeof basicTransactionData.season_number, basicTransactionData.season_number)
      
      console.log('🔍 教师信息检查:')
      console.log('  teacher.id:', teacher.id)
      console.log('  teacher.name:', teacher.name)
      console.log('  teacher.email:', teacher.email)
      console.log('  teacherId参数:', teacherId)
      
      // 验证必需字段
      if (!basicTransactionData.student_id) {
        throw new Error('student_id 不能为空')
      }
      if (!basicTransactionData.teacher_id) {
        throw new Error('teacher_id 不能为空')
      }
      if (typeof basicTransactionData.points_change !== 'number' || isNaN(basicTransactionData.points_change)) {
        throw new Error('points_change 必须是有效数字')
      }
      if (!basicTransactionData.transaction_type) {
        throw new Error('transaction_type 不能为空')
      }
      if (!basicTransactionData.reason) {
        throw new Error('reason 不能为空')
      }
      if (!basicTransactionData.status) {
        throw new Error('status 不能为空')
      }
      if (typeof basicTransactionData.season_number !== 'number' || isNaN(basicTransactionData.season_number)) {
        throw new Error('season_number 必须是有效数字')
      }
      
      transaction = await pb.collection('point_transactions').create(basicTransactionData)
      console.log('✅ 积分交易记录创建成功:', transaction)
    } catch (createError: any) {
      console.error('❌ 创建积分交易记录失败:', createError)
      console.error('❌ 错误详情:', createError.data)
      console.error('❌ 完整错误对象:', JSON.stringify(createError, null, 2))
      console.error('❌ 请求数据:', basicTransactionData)
      
      // 尝试获取更详细的错误信息
      if (createError.response) {
        console.error('❌ 响应详情:', createError.response)
      }
      
      // 检查是否是字段验证错误
      if (createError.data && createError.data.data) {
        console.error('❌ 字段验证错误:', createError.data.data)
        return NextResponse.json({ 
          error: '字段验证失败', 
          details: createError.data.data,
          fieldErrors: createError.data.data
        }, { status: 400 })
      }
      
      // 尝试重新认证后再次创建
      console.log('🔄 尝试重新认证后再次创建...')
      try {
        await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        console.log('✅ 重新认证成功')
        
        const basicTransactionData = {
          student_id: actualStudentId,
          teacher_id: teacher.name || teacher.email || teacherId, // 使用教师姓名或邮箱作为文本标识符
          points_change: parseInt(pointsChange.toString()),
          transaction_type: dbTransactionType, // 使用数据库接受的格式
          reason: reason,
          status: 'approved', // 默认状态为已批准
          season_number: 1 // 默认赛季为1
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

    // 根据交易类型计算积分变化
    const isEarnTransaction = dbTransactionType === 'add_points'
    const pointsChangeAmount = Math.abs(pointsChange) // 确保是正数
    
    const newCurrentPoints = isEarnTransaction 
      ? studentPoints.current_points + pointsChangeAmount 
      : studentPoints.current_points - pointsChangeAmount
    
    const newTotalEarned = isEarnTransaction 
      ? studentPoints.total_earned + pointsChangeAmount 
      : studentPoints.total_earned
    
    const newTotalSpent = !isEarnTransaction 
      ? studentPoints.total_spent + pointsChangeAmount 
      : studentPoints.total_spent
    
    // 确保 total_earned 和 total_spent 不为 0（PocketBase Nonzero 验证要求）
    // 但如果是初始状态（都是1且current_points是0），保持为1
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
