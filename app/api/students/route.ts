import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase-optimized'
import { authenticateAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const center = searchParams.get('center')
  const limit = parseInt(searchParams.get('limit') || '500')
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    server: process.env.POCKETBASE_URL || 'http://pjpc.tplinkdns.com:8090',
    center,
    limit,
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

    // 步骤2: 获取PocketBase实例
    console.log('🔍 API: 获取PocketBase实例...')
    let pb
    try {
      pb = await getPocketBase()
      debugInfo.steps.push({ 
        step: 'pocketbase_instance', 
        status: 'success', 
        message: 'PocketBase实例获取成功' 
      })
      console.log('✅ API: PocketBase实例获取成功')
    } catch (pbError: any) {
      debugInfo.steps.push({ 
        step: 'pocketbase_instance', 
        status: 'error', 
        message: pbError.message 
      })
      console.log('❌ API: PocketBase实例获取失败:', pbError.message)
      throw pbError
    }

    // 步骤3: 检查students集合
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

    // 步骤4: 管理员认证（可选，只读操作可能不需要认证）
    console.log('🔍 API: 尝试管理员认证...')
    try {
      await authenticateAdmin(pb)
      debugInfo.steps.push({ 
        step: 'admin_auth', 
        status: 'success', 
        message: '管理员认证成功'
      })
      console.log('✅ API: 管理员认证成功')
    } catch (authError: any) {
      debugInfo.steps.push({ 
        step: 'admin_auth', 
        status: 'warning', 
        message: `管理员认证失败: ${authError.message}，尝试无认证访问`
      })
      console.log('⚠️ API: 管理员认证失败，尝试无认证访问:', authError.message)
      // 不抛出错误，继续尝试获取数据
    }

    // 步骤5: 尝试获取学生数据
    console.log('🔍 API: 尝试获取学生数据...', { center, limit })
    
    // 构建过滤条件
    let filter = ''
    if (center) {
      // 先尝试最常见的字段名
      filter = `center = "${center}"`
      console.log('🔍 API: 使用center过滤器:', filter)
    }
    
    // 先获取少量数据检查字段结构
    const sampleStudents = await pb.collection('students').getList(1, 10, {
      sort: 'student_name'
    })
    
    console.log('🔍 API: 样本学生数据字段检查:', {
      count: sampleStudents.items.length,
      sampleFields: sampleStudents.items.length > 0 ? Object.keys(sampleStudents.items[0]) : [],
      sampleCenters: sampleStudents.items.slice(0, 5).map(s => ({
        id: s.id,
        student_name: s.student_name,
        center: s.center,
        Center: s.Center,
        centre: s.centre,
        branch: s.branch,
        allFields: Object.keys(s)
      }))
    })
    
    // 检查是否有WX 01的学生
    const wx01Students = sampleStudents.items.filter(s => 
      s.center === 'WX 01' || s.Center === 'WX 01' || s.centre === 'WX 01' || s.branch === 'WX 01'
    )
    console.log('🔍 API: WX 01学生检查:', {
      total: sampleStudents.items.length,
      wx01Count: wx01Students.length,
      wx01Students: wx01Students.map(s => ({
        id: s.id,
        student_name: s.student_name,
        center: s.center,
        Center: s.Center,
        centre: s.centre,
        branch: s.branch
      }))
    })
    
    const students = await pb.collection('students').getList(1, limit, {
      filter: filter || undefined,
      sort: 'student_name'
    })
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
    
    // 获取 PocketBase 实例
    const pb = await getPocketBase()
    
    let body
    try {
      body = await request.json()
      console.log('🔍 API: 接收到的请求体:', body)
    } catch (jsonError) {
      console.error('❌ JSON解析失败:', jsonError)
      return NextResponse.json({
        success: false,
        error: 'JSON解析失败',
        message: '请求数据格式不正确'
      }, { status: 400 })
    }
    
    // 处理嵌套的数据结构
    let actualBody = body
    let studentIdToUpdate = null
    let updateFields = {}
    
    // 检查是否是嵌套结构 { id: { id: "...", ...data } }
    if (body.id && typeof body.id === 'object' && body.id.id) {
      console.log('🔍 API: 检测到嵌套数据结构，提取数据...')
      studentIdToUpdate = body.id.id
      const { id, ...fields } = body.id
      updateFields = fields
    } else {
      // 正常结构 { id: "...", ...data }
      const { id, studentId, ...fields } = body
      studentIdToUpdate = id || studentId
      updateFields = fields
    }
    
    console.log('🔍 API: 要更新的学生ID:', studentIdToUpdate)
    console.log('🔍 API: 更新字段:', updateFields)
    
    if (!studentIdToUpdate) {
      console.log('❌ API: 学生ID为空')
      return NextResponse.json({
        success: false,
        error: '学生ID不能为空'
      }, { status: 400 })
    }

    // 基于实际数据库结构的有效字段列表
    const validFields = [
      'student_id', 'student_name', 'standard', 'center', 'parentName', 'parents_phone',
      'dob', 'gender', 'home_address', 'status', 'level', 'register_form_url',
      'notes', 'school', 'emergencyContactName', 'emergencyContactPhone',
      'medicalNotes', 'pickupMethod', 'authorizedPickup1Name', 'authorizedPickup1Phone',
      'authorizedPickup2Name', 'authorizedPickup2Phone', 'authorizedPickup3Name',
      'authorizedPickup3Phone', 'nric', 'cardNumber', 'cardType', 'studentUrl',
      'balance', 'cardStatus', 'issuedDate', 'expiryDate', 'enrollmentDate',
      'security_status', 'verification_level', 'services'
    ]

    // 验证 select 字段的值
    const selectFieldValidators = {
      'status': ['active', 'graduated', 'transferred', 'suspended', 'inactive'],
      'center': ['WX 01', 'WX 02', 'WX 03', 'WX 04']
    }

    const filteredFields = {}
    for (const [key, value] of Object.entries(updateFields)) {
      if (validFields.includes(key) && value !== undefined && value !== null) {
        // 验证 select 字段的值
        if (selectFieldValidators[key] && !selectFieldValidators[key].includes(value)) {
          console.log(`⚠️ API: 跳过无效的 ${key} 值: ${value}`)
          continue
        }
        filteredFields[key] = value
      }
    }

    console.log('🔍 API: 原始字段:', Object.keys(updateFields))
    console.log('🔍 API: 有效字段列表:', validFields)
    console.log('🔍 API: 过滤后的字段:', filteredFields)
    console.log('🔍 API: 过滤后字段数量:', Object.keys(filteredFields).length)
    
    // 必须进行管理员认证，因为集合权限要求 @request.auth.id != ""
    try {
      await authenticateAdmin(pb)
      console.log('✅ 管理员认证成功')
    } catch (authError: any) {
      console.log('❌ 管理员认证失败，无法更新学生:', authError.message)
      return NextResponse.json({
        success: false,
        error: '认证失败',
        message: '需要管理员权限才能更新学生'
      }, { status: 401 })
    }
    
    // 使用已经过滤的有效字段
    const updateData = filteredFields
    
    console.log('🔍 API: 原始更新字段:', updateFields)
    console.log('🔍 API: 过滤后的更新数据:', updateData)
    console.log('🔍 API: 更新数据字段数量:', Object.keys(updateData).length)
    
    if (Object.keys(updateData).length === 0) {
      console.log('❌ API: 没有有效的更新数据，所有字段都被过滤掉了')
      return NextResponse.json({
        success: false,
        error: '没有有效的更新数据',
        details: '所有字段都被过滤掉了，请检查数据格式'
      }, { status: 400 })
    }
    
    const updatedStudent = await pb.collection('students').update(studentIdToUpdate, updateData)
    
    console.log('✅ API: 学生数据更新成功:', updatedStudent.student_name)
    console.log('✅ API: 更新后的数据:', updateData)
    
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

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API: 开始创建学生数据...')
    
    // 获取 PocketBase 实例
    const pb = await getPocketBase()
    
    // 必须进行管理员认证，因为集合权限要求 @request.auth.id != ""
    try {
      await authenticateAdmin(pb)
      console.log('✅ 管理员认证成功')
    } catch (authError: any) {
      console.log('❌ 管理员认证失败，无法创建学生:', authError.message)
      return NextResponse.json({
        success: false,
        error: '认证失败',
        message: '需要管理员权限才能创建学生'
      }, { status: 401 })
    }
    
    const body = await request.json()
    console.log('🔍 API: 接收到的学生数据:', body)
    
    const { 
      student_name, 
      standard, 
      parentName, 
      status = 'active',
      center = 'WX 01',
      student_id,
      parents_phone,
      dob,
      gender,
      home_address,
      level,
      school,
      emergencyContactName,
      emergencyContactPhone,
      medicalNotes,
      pickupMethod,
      authorizedPickup1Name,
      authorizedPickup1Phone,
      authorizedPickup2Name,
      authorizedPickup2Phone,
      authorizedPickup3Name,
      authorizedPickup3Phone,
      nric,
      cardNumber,
      cardType,
      studentUrl,
      balance,
      cardStatus,
      issuedDate,
      expiryDate,
      enrollmentDate,
      security_status,
      verification_level,
      services,
      notes
    } = body

    // 验证必需字段
    if (!student_name || !standard || !parentName) {
      return NextResponse.json({
        success: false,
        error: '缺少必需字段',
        message: '学生姓名、年级和家长姓名是必需的'
      }, { status: 400 })
    }

    // 验证 status 字段值
    const validStatuses = ['active', 'graduated', 'transferred', 'suspended', 'inactive']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: '无效的状态值',
        message: `状态必须是以下值之一: ${validStatuses.join(', ')}`
      }, { status: 400 })
    }

    // 验证 center 字段值
    const validCenters = ['WX 01', 'WX 02', 'WX 03', 'WX 04']
    if (center && !validCenters.includes(center)) {
      return NextResponse.json({
        success: false,
        error: '无效的中心值',
        message: `中心必须是以下值之一: ${validCenters.join(', ')}`
      }, { status: 400 })
    }

    // 只使用必需字段和基本字段，避免类型错误
    const studentData = {
      student_name,
      standard,
      parentName,
      status,
      center
    }

    // 只添加非空的可选字段
    if (student_id) studentData.student_id = student_id
    if (parents_phone) studentData.parents_phone = parents_phone
    if (dob) studentData.dob = dob
    if (gender) studentData.gender = gender
    if (home_address) studentData.home_address = home_address
    if (level) studentData.level = level
    if (school) studentData.school = school
    if (emergencyContactName) studentData.emergencyContactName = emergencyContactName
    if (emergencyContactPhone) studentData.emergencyContactPhone = emergencyContactPhone
    if (medicalNotes) studentData.medicalNotes = medicalNotes
    if (pickupMethod) studentData.pickupMethod = pickupMethod
    if (authorizedPickup1Name) studentData.authorizedPickup1Name = authorizedPickup1Name
    if (authorizedPickup1Phone) studentData.authorizedPickup1Phone = authorizedPickup1Phone
    if (authorizedPickup2Name) studentData.authorizedPickup2Name = authorizedPickup2Name
    if (authorizedPickup2Phone) studentData.authorizedPickup2Phone = authorizedPickup2Phone
    if (authorizedPickup3Name) studentData.authorizedPickup3Name = authorizedPickup3Name
    if (authorizedPickup3Phone) studentData.authorizedPickup3Phone = authorizedPickup3Phone
    if (nric) studentData.nric = nric
    if (cardNumber) studentData.cardNumber = cardNumber
    if (cardType) studentData.cardType = cardType
    if (studentUrl) studentData.studentUrl = studentUrl
    if (balance !== undefined && balance !== null) studentData.balance = balance
    if (cardStatus) studentData.cardStatus = cardStatus
    if (issuedDate) studentData.issuedDate = issuedDate
    if (expiryDate) studentData.expiryDate = expiryDate
    if (enrollmentDate) studentData.enrollmentDate = enrollmentDate
    if (security_status) studentData.security_status = security_status
    if (verification_level) studentData.verification_level = verification_level
    if (services) studentData.services = services
    if (notes) studentData.notes = notes

    console.log('🔍 API: 准备创建的学生数据:', studentData)

    const student = await pb.collection('students').create(studentData)
    console.log('✅ API: 学生创建成功:', student.id)
    
    return NextResponse.json({ 
      success: true, 
      message: '学生创建成功',
      student 
    })
    
  } catch (error: any) {
    console.error('❌ API: 创建学生失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '创建学生失败',
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