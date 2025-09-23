import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://pjpc.tplinkdns.com:8090')

export async function GET() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    server: 'http://pjpc.tplinkdns.com:8090',
    steps: [] as Array<{step: string; status: string; message: string; data?: any}>
  }
  
  try {
    console.log('🔍 API: 开始获取学生数据...')
    console.log('🌐 API: 连接到PocketBase服务器:', debugInfo.server)
    
    // 步骤1: 测试PocketBase连接
    console.log('🔍 API: 测试PocketBase连接...')
    try {
      const healthResponse = await fetch(`${debugInfo.server}/api/health`)
      debugInfo.steps.push({ 
        step: 'health_check', 
        status: 'success', 
        message: 'PocketBase连接正常' 
      })
      console.log('✅ API: PocketBase连接正常')
    } catch (healthError: any) {
      debugInfo.steps.push({ 
        step: 'health_check', 
        status: 'error', 
        message: healthError.message 
      })
      console.log('❌ API: PocketBase连接失败:', healthError.message)
    }

    // 步骤2: 检查students集合
    console.log('🔍 API: 检查students集合...')
    try {
      await pb.collection('students').getList(1, 1)
      debugInfo.steps.push({ 
        step: 'collection_check', 
        status: 'success', 
        message: 'students集合存在' 
      })
      console.log('✅ API: students集合存在')
    } catch (collectionError: any) {
      debugInfo.steps.push({ step: 'collection_check', status: 'error', message: collectionError.message })
      console.log('❌ API: students集合检查失败:', collectionError.message)
    }

    // 步骤3: 管理员认证
    console.log('🔍 API: 管理员认证...')
    try {
      await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      debugInfo.steps.push({ 
        step: 'admin_auth', 
        status: 'success', 
        message: '管理员认证成功'
      })
      console.log('✅ API: 管理员认证成功')
    } catch (authError: any) {
      debugInfo.steps.push({ 
        step: 'admin_auth', 
        status: 'error', 
        message: authError.message
      })
      console.log('❌ API: 管理员认证失败:', authError.message)
    }

    // 步骤4: 尝试获取学生数据
    console.log('🔍 API: 尝试获取学生数据...')
    const students = await pb.collection('students').getList(1, 500)
    debugInfo.steps.push({ 
      step: 'get_students', 
      status: 'success', 
      message: `成功获取 ${students.items.length} 个学生记录`,
      data: {
        totalItems: students.totalItems,
        totalPages: students.totalPages,
        page: students.page,
        perPage: students.perPage
      }
    })
    console.log(`✅ API: 获取到 ${students.items.length} 个学生数据`)
    
    if (students.items.length > 0) {
      console.log('🔍 API: 前3个学生数据:', students.items.slice(0, 3))
      debugInfo.steps.push({ 
        step: 'sample_data', 
        status: 'success', 
        message: '学生数据样本',
        data: students.items.slice(0, 3)
      })
    } else {
      console.log('⚠️ API: students集合为空，请检查数据库')
      debugInfo.steps.push({ 
        step: 'empty_collection', 
        status: 'warning', 
        message: 'students集合为空'
      })
    }
    
    return NextResponse.json({ 
      success: true,
      students: students.items,
      total: students.totalItems,
      debug: debugInfo
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (error: any) {
    console.error('❌ API: 获取学生数据失败:', error)
    console.error('❌ API: 错误详情:', {
      message: error.message,
      status: error.status,
      data: error.data,
      response: error.response
    })
    
    debugInfo.steps.push({ 
      step: 'error', 
      status: 'error', 
      message: error.message || '未知错误'
    })
    
    return NextResponse.json({
      success: false,
      error: '获取学生数据失败',
      message: error.message || '未知错误',
      details: error,
      debug: debugInfo
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 API: 开始更新学生数据...')
    
    const body = await request.json()
    console.log('🔍 API: 接收到的请求体:', body)
    
    const { id, studentId, cardNumber } = body
    
    const studentIdToUpdate = id || studentId
    console.log('🔍 API: 要更新的学生ID:', studentIdToUpdate)
    console.log('🔍 API: 卡号:', cardNumber)
    
    if (!studentIdToUpdate) {
      console.log('❌ API: 学生ID为空')
      return NextResponse.json({
        success: false,
        error: '学生ID不能为空'
      }, { status: 400 })
    }
    
    // 管理员认证
    await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
    
    // 更新学生数据
    const updateData: any = {}
    if (cardNumber) updateData.cardNumber = cardNumber
    
    console.log('🔍 API: 更新数据:', updateData)
    
    const updatedStudent = await pb.collection('students').update(studentIdToUpdate, updateData)
    
    console.log('✅ API: 学生数据更新成功:', updatedStudent.student_name)
    console.log('✅ API: 更新后的卡号:', updatedStudent.cardNumber)
    
    return NextResponse.json({
      success: true,
      message: '学生数据更新成功',
      student: updatedStudent
    })
    
  } catch (error: any) {
    console.error('❌ API: 更新学生数据失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '更新学生数据失败',
      message: error.message || '未知错误'
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}