/**
 * 积分系统 API 路由
 * 支持原子性事务、并发控制、数据一致性验证
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
import { authenticateAdmin } from '@/lib/auth-utils'
import { TransactionType, TransactionStatus } from '@/types/points'

// 积分操作锁，防止并发问题
const operationLocks = new Map<string, Promise<any>>()

// 认证锁，防止并发认证冲突
let authLock: Promise<void> | null = null

// 确保管理员认证（带并发控制）
async function ensureAdminAuth(pb: any) {
  // 如果已有认证，直接返回
  if (pb.authStore.isValid) {
    console.log('✅ 使用现有认证')
    return
  }
  
  // 如果已有认证进行中，等待完成
  if (authLock) {
    console.log('⏳ 等待认证完成...')
    await authLock
    return
  }
  
  // 创建认证锁
  authLock = (async () => {
    try {
      const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'pjpcemerlang@gmail.com'
      const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || '0122270775Sw!'
      
      console.log('🔑 开始管理员认证...', { email: adminEmail })
      await pb.admins.authWithPassword(adminEmail, adminPassword)
      console.log('✅ 管理员认证成功')
    } catch (error) {
      console.error('❌ 管理员认证失败:', error)
      throw new Error(`管理员认证失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      // 清除认证锁
      authLock = null
    }
  })()
  
  await authLock
}

// 原子性积分更新函数
async function atomicUpdatePoints(
  pb: any, 
  studentId: string, 
  transactionData: any, 
  retryCount = 0
): Promise<{ success: boolean; transaction?: any; error?: string }> {
  const lockKey = `points_update_${studentId}`
  
  // 如果已有相同学生的操作在进行，等待完成
  if (operationLocks.has(lockKey)) {
    console.log(`⏳ 等待学生 ${studentId} 的积分操作完成...`)
    await operationLocks.get(lockKey)
  }
  
  // 创建新的操作锁
  const operationPromise = (async () => {
    try {
      console.log(`🔒 开始原子性积分更新 - 学生: ${studentId}`)
      
      // 1. 获取当前积分数据（带锁）
      let studentPoints
      try {
        studentPoints = await pb.collection('student_points').getFirstListItem(`student_id = "${studentId}"`)
        console.log('📊 当前积分数据:', {
          current: studentPoints.current_points,
          earned: studentPoints.total_earned,
          spent: studentPoints.total_spent
        })
      } catch (error) {
        // 如果学生积分记录不存在，创建新记录
        console.log('📝 创建新的学生积分记录')
        studentPoints = await pb.collection('student_points').create({
          student_id: studentId,
          total_earned: 0,
          total_spent: 0,
          current_points: 0,
          season_id: transactionData.season_id
        })
      }
      
      // 2. 验证数据一致性
      const consistencyCheck = await validatePointsConsistency(pb, studentId, studentPoints)
      if (!consistencyCheck.isConsistent) {
        console.log('⚠️ 检测到数据不一致，自动修复...')
        await fixPointsConsistency(pb, studentId, consistencyCheck.expectedPoints)
        // 重新获取修复后的数据
        studentPoints = await pb.collection('student_points').getFirstListItem(`student_id = "${studentId}"`)
      }
      
      // 3. 创建交易记录
      const transaction = await pb.collection('point_transactions').create(transactionData)
      console.log('✅ 交易记录创建成功:', transaction.id)
      
      // 4. 计算新的积分值
      const isEarnTransaction = transactionData.transaction_type === TransactionType.Add
      const isDeductTransaction = transactionData.transaction_type === TransactionType.Deduct
      
      const newTotalEarned = studentPoints.total_earned + (isEarnTransaction ? transactionData.points_change : 0)
      const newTotalSpent = studentPoints.total_spent + (isDeductTransaction ? Math.abs(transactionData.points_change) : 0)
      const newCurrentPoints = studentPoints.current_points + transactionData.points_change
      
      // 5. 更新积分（使用乐观锁）
      const updateData = {
        total_earned: newTotalEarned,
        total_spent: newTotalSpent,
        current_points: newCurrentPoints,
        updated: new Date().toISOString()
      }
      
      try {
        await pb.collection('student_points').update(studentPoints.id, updateData)
        console.log('✅ 积分更新成功:', updateData)
        
        // 6. 验证更新后的数据一致性
        const finalCheck = await validatePointsConsistency(pb, studentId)
        if (!finalCheck.isConsistent) {
          console.error('❌ 更新后数据仍然不一致，需要重试')
          throw new Error('数据一致性验证失败')
        }
        
        return { success: true, transaction }
        
      } catch (updateError) {
        console.error('❌ 积分更新失败:', updateError)
        
        // 如果更新失败，删除刚创建的交易记录
        try {
          await pb.collection('point_transactions').delete(transaction.id)
          console.log('🔄 已回滚交易记录')
        } catch (rollbackError) {
          console.error('❌ 回滚交易记录失败:', rollbackError)
        }
        
        throw updateError
      }
      
    } catch (error) {
      console.error('❌ 原子性积分更新失败:', error)
      
      // 重试逻辑
      if (retryCount < 3) {
        console.log(`🔄 重试积分更新 (${retryCount + 1}/3)...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
        return atomicUpdatePoints(pb, studentId, transactionData, retryCount + 1)
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      }
    } finally {
      // 清理操作锁
      operationLocks.delete(lockKey)
    }
  })()
  
  operationLocks.set(lockKey, operationPromise)
  return operationPromise
}

// 验证积分数据一致性
async function validatePointsConsistency(
  pb: any, 
  studentId: string, 
  studentPoints?: any
): Promise<{ isConsistent: boolean; expectedPoints?: any }> {
  try {
    if (!studentPoints) {
      studentPoints = await pb.collection('student_points').getFirstListItem(`student_id = "${studentId}"`)
    }
    
    // 获取所有已批准的交易记录
    const transactions = await pb.collection('point_transactions').getList(1, 1000, {
      filter: `student_id = "${studentId}" && status = "approved"`,
      sort: 'created'
    })
    
    let calculatedEarned = 0
    let calculatedSpent = 0
    
    transactions.items.forEach((t: any) => {
      if (t.points_change > 0) {
        calculatedEarned += t.points_change
      } else {
        calculatedSpent += Math.abs(t.points_change)
      }
    })
    
    const calculatedCurrent = calculatedEarned - calculatedSpent
    const expectedPoints = {
      current_points: calculatedCurrent,
      total_earned: calculatedEarned,
      total_spent: calculatedSpent
    }
    
    const isConsistent = 
      studentPoints.current_points === calculatedCurrent &&
      studentPoints.total_earned === calculatedEarned &&
      studentPoints.total_spent === calculatedSpent
    
    console.log('🔍 数据一致性检查:', {
      isConsistent,
      current: { actual: studentPoints.current_points, expected: calculatedCurrent },
      earned: { actual: studentPoints.total_earned, expected: calculatedEarned },
      spent: { actual: studentPoints.total_spent, expected: calculatedSpent }
    })
    
    return { isConsistent, expectedPoints }
    
  } catch (error) {
    console.error('❌ 数据一致性验证失败:', error)
    return { isConsistent: false }
  }
}

// 修复积分数据一致性
async function fixPointsConsistency(pb: any, studentId: string, expectedPoints: any) {
  try {
    console.log('🔧 开始修复积分数据一致性...')
    
    const studentPoints = await pb.collection('student_points').getFirstListItem(`student_id = "${studentId}"`)
    
    await pb.collection('student_points').update(studentPoints.id, {
      current_points: expectedPoints.current_points,
      total_earned: expectedPoints.total_earned,
      total_spent: expectedPoints.total_spent,
      updated: new Date().toISOString()
    })
    
    console.log('✅ 积分数据修复成功:', expectedPoints)
    
  } catch (error) {
    console.error('❌ 积分数据修复失败:', error)
    throw error
  }
}

// 获取积分数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const center = searchParams.get('center')
    const getTransactions = searchParams.get('transactions') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '50')
    const limit = parseInt(searchParams.get('limit') || '50')

    const pb = await getPocketBase()
    console.log('✅ PocketBase实例获取成功')

    // 持久化管理员认证
    try {
      console.log('🔑 开始认证检查...', { 
        isValid: pb.authStore.isValid, 
        hasModel: !!pb.authStore.model,
        baseUrl: pb.baseUrl 
      })
      await ensureAdminAuth(pb)
      console.log('✅ 认证检查完成')
    } catch (authError) {
      console.error('❌ 认证失败:', authError)
      return NextResponse.json({
        success: false,
        error: authError instanceof Error ? authError.message : 'PocketBase认证失败'
      }, { status: 401 })
    }

    if (studentId) {
      // 获取特定学生的积分数据
      try {
        let studentPoints
        try {
          studentPoints = await pb.collection('student_points').getFirstListItem(`student_id = "${studentId}"`, {
            expand: 'student_id,season_id'
          })
        } catch (error) {
          // 如果学生积分记录不存在，创建新记录
          console.log('📝 学生积分记录不存在，创建新记录')
          
          // 获取活跃赛季
          let activeSeason
          try {
            activeSeason = await pb.collection('point_seasons').getFirstListItem('is_active = true')
          } catch (seasonError) {
            console.log('⚠️ 未找到活跃赛季，使用默认赛季')
            activeSeason = { id: 'default-season' }
          }
          
          const newStudentPoints = await pb.collection('student_points').create({
            student_id: studentId,
            total_earned: 0,
            total_spent: 0,
            current_points: 0,
            season_id: activeSeason.id
          })
          
          return NextResponse.json({
            student_points: newStudentPoints,
            transactions: { items: [], totalItems: 0 }
          })
        }

        // 验证数据一致性
        const consistencyCheck = await validatePointsConsistency(pb, studentId, studentPoints)
        if (!consistencyCheck.isConsistent) {
          console.log('⚠️ 检测到数据不一致，自动修复...')
          await fixPointsConsistency(pb, studentId, consistencyCheck.expectedPoints!)
          // 重新获取修复后的数据
          studentPoints = await pb.collection('student_points').getFirstListItem(`student_id = "${studentId}"`, {
            expand: 'student_id,season_id'
          })
        }

        if (getTransactions) {
          // 获取交易记录
          const transactions = await pb.collection('point_transactions').getList(page, perPage, {
            filter: `student_id = "${studentId}"`,
            sort: '-created',
            expand: 'student_id,teacher_id,season_id'
          })

          return NextResponse.json({
            student_points: studentPoints,
            transactions: transactions
          })
        } else {
          return NextResponse.json({
            student_points: studentPoints,
            transactions: { items: [], totalItems: 0 }
          })
        }
      } catch (error) {
        console.error('❌ 获取学生积分失败:', error)
        return NextResponse.json({
          success: false,
          error: '获取学生积分失败',
          details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 })
      }
    } else if (getTransactions) {
      // 获取交易记录
      try {
        console.log('🔍 开始获取交易记录...', { center, page, limit })
        
        // 确保管理员认证
        await ensureAdminAuth(pb)
        console.log('✅ 管理员认证成功')
        
        let filter = ''
        if (center) {
          // 修改过滤器语法，因为student_id是关联字段
          filter = `student_id.center = "${center}"`
          console.log('🔍 使用过滤器:', filter)
        }
        
        console.log('🔍 尝试获取交易记录...')
        console.log('🔍 PocketBase实例:', pb.baseUrl)
        console.log('🔍 认证状态:', pb.authStore.isValid)
        console.log('🔍 认证用户:', pb.authStore.model)
        
        const allTransactions = await pb.collection('point_transactions').getList(page, limit, {
          filter: filter || undefined,
          sort: '-created',
          expand: 'student_id,teacher_id,season_id'
        })
        
        console.log('🔍 原始数据:', JSON.stringify(allTransactions.items.slice(0, 2), null, 2))
        console.log('🔍 总记录数:', allTransactions.totalItems)
        console.log('🔍 当前页记录数:', allTransactions.items.length)
        
        console.log('✅ 交易记录获取成功，数量:', allTransactions.items.length)
        
        // 格式化交易记录
        const formattedTransactions = allTransactions.items.map((transaction: any) => ({
          id: transaction.id,
          student_name: transaction.expand?.student_id?.student_name || 'Unknown',
          student_id: transaction.expand?.student_id?.student_id || '--',
          teacher_name: transaction.expand?.teacher_id?.teacher_name || 
                       transaction.expand?.teacher_id?.name || 'Unknown',
          points_change: transaction.points_change,
          transaction_type: transaction.transaction_type,
          reason: transaction.reason,
          status: transaction.status,
          created: transaction.created,
          gift_name: transaction.gift_name || null,
          gift_points: transaction.gift_points || null
        }))
        
        return NextResponse.json({
          success: true,
          items: formattedTransactions,
          totalItems: allTransactions.totalItems,
          page: allTransactions.page,
          perPage: allTransactions.perPage,
          totalPages: allTransactions.totalPages,
          transactions: formattedTransactions, // 保持向后兼容
          total: allTransactions.totalItems,
          count: allTransactions.items.length
        })
      } catch (transactionError) {
        console.error('❌ 获取交易记录失败:', transactionError)
        console.error('❌ 错误详情:', {
          message: transactionError instanceof Error ? transactionError.message : '未知错误',
          stack: transactionError instanceof Error ? transactionError.stack : undefined,
          name: transactionError instanceof Error ? transactionError.name : undefined,
          center: center,
          page: page,
          limit: limit
        })
        return NextResponse.json({
          success: false,
          error: '获取交易记录失败',
          details: transactionError instanceof Error ? transactionError.message : '未知错误',
          debug: {
            center: center,
            page: page,
            limit: limit
          }
        }, { status: 500 })
      }
    } else {
      // 获取所有学生积分排行榜
      let filter = ''
      if (center) {
        // 按分行过滤学生积分
        filter = `student_id.center = "${center}"`
        console.log('🔍 积分API使用分行过滤器:', filter)
      }
      
      const allStudentPoints = await pb.collection('student_points').getList(page, perPage, {
        filter: filter || undefined,
        sort: '-current_points',
        expand: 'student_id,season_id'
      })

      console.log('🔍 积分API返回数据:', {
        center: center,
        totalItems: allStudentPoints.totalItems,
        itemsCount: allStudentPoints.items.length,
        sampleCenters: allStudentPoints.items.slice(0, 3).map((item: any) => ({
          student_id: item.expand?.student_id?.student_id,
          student_name: item.expand?.student_id?.student_name,
          center: item.expand?.student_id?.center
        }))
      })

      return NextResponse.json(allStudentPoints)
    }
  } catch (error) {
    console.error('获取积分数据失败:', error)
    return NextResponse.json({ 
      success: false,
      error: '获取积分数据失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 创建积分交易
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 积分API开始处理请求...')
    
    const pb = await getPocketBase()
    console.log('✅ PocketBase实例获取成功')
    
    // 解析请求数据
    let requestData
    const contentType = request.headers.get('content-type') || ''
    
    try {
      if (contentType.includes('application/json')) {
        requestData = await request.json()
        console.log('✅ JSON解析成功')
      } else {
        requestData = await request.formData()
        console.log('✅ FormData解析成功')
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
    
    const studentId = getFieldValue('studentId') as string || getFieldValue('student_id') as string
    const teacherId = getFieldValue('teacherId') as string || getFieldValue('teacher_id') as string
    const pointsChange = parseInt(getFieldValue('pointsChange') as string || getFieldValue('points_change') as string || '0')
    const transactionType = getFieldValue('transactionType') as string || getFieldValue('transaction_type') as string
    const reason = getFieldValue('reason') as string || ''
    const giftName = getFieldValue('giftName') as string || getFieldValue('gift_name') as string
    const giftPoints = parseInt(getFieldValue('giftPoints') as string || getFieldValue('gift_points') as string || '0')
    
    console.log('📝 交易数据:', {
      studentId,
      teacherId,
      pointsChange,
      transactionType,
      reason,
      giftName,
      giftPoints
    })
    
    // 验证必填字段
    if (!studentId || !teacherId || isNaN(pointsChange) || !transactionType) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段',
        details: {
          studentId: studentId || '缺少学生ID',
          teacherId: teacherId || '缺少教师ID', 
          pointsChange: isNaN(pointsChange) ? '积分变化必须是数字' : pointsChange,
          transactionType: transactionType || '缺少交易类型'
        }
      }, { status: 400 })
    }
    
    // 持久化管理员认证
    try {
      await ensureAdminAuth(pb)
    } catch (authError) {
      return NextResponse.json({
        success: false,
        error: authError instanceof Error ? authError.message : 'PocketBase认证失败'
      }, { status: 401 })
    }
    
    // 获取当前活跃赛季
    let activeSeason
    try {
      activeSeason = await pb.collection('point_seasons').getFirstListItem('is_active = true')
    } catch (error) {
      console.log('⚠️ 未找到活跃赛季，使用默认赛季')
      activeSeason = { id: 'default-season' }
    }
    
    // 创建交易数据
    const transactionData = {
      student_id: studentId,
      teacher_id: teacherId,
      points_change: pointsChange,
      transaction_type: transactionType,
      reason: reason,
      status: TransactionStatus.Approved,
      season_id: activeSeason.id,
      gift_name: giftName || null,
      gift_points: giftPoints || null
    }
    
    // 使用原子性更新
    const result = await atomicUpdatePoints(pb, studentId, transactionData)
    
    if (result.success) {
      console.log('✅ 积分交易创建成功')
      return NextResponse.json({
        success: true,
        transaction: result.transaction,
        message: '积分交易创建成功'
      })
    } else {
      console.error('❌ 积分交易创建失败:', result.error)
      return NextResponse.json({
        success: false,
        error: '积分交易创建失败',
        details: result.error
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('积分API处理失败:', error)
    return NextResponse.json({
      success: false,
      error: '积分API处理失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}