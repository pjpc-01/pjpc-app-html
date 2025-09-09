import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// 静态导出配置
export const dynamic = 'force-static'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const center = searchParams.get('center')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '500')
    const page = parseInt(searchParams.get('page') || '1')

    // 获取PocketBase实例
    const pb = await getPocketBase()
    
    // 使用优化的管理员认证
    try {
      await authenticateAdmin()
      console.log('✅ 管理员认证成功')
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError)
      return NextResponse.json(
        { 
          success: false,
          error: 'PocketBase认证失败', 
          details: '无法以管理员身份登录'
        },
        { status: 500 }
      )
    }
    
    // 构建过滤条件
    let filter = ''
    const filters = []

    if (center) {
      filters.push(`center = "${center}"`)
    }

    if (status) {
      filters.push(`status = "${status}"`)
    }

    if (filters.length > 0) {
      filter = filters.join(' && ')
    }

    try {
      // 确保认证状态有效
      if (!pb.authStore.isValid) {
        console.log('⚠️ 认证状态无效，重新认证...')
        await authenticateAdmin()
      }
      
      console.log('🔍 开始获取学生数据...')
      console.log('🔑 认证状态:', pb.authStore.isValid ? '有效' : '无效')
      console.log('🔑 认证模型:', pb.authStore.model ? '已设置' : '未设置')
      
      // 从PocketBase获取学生数据
      const students = await pb.collection('students').getList(page, limit, {
        sort: 'student_name',
        filter: filter || undefined
      })

      console.log(`✅ 成功获取 ${students.items.length} 个学生记录`);

      // 如果集合为空，返回空数组
      if (!students.items || students.items.length === 0) {
        console.log('⚠️ students 集合为空，返回空数组');
        return NextResponse.json({
          success: true,
          students: [],
          totalItems: 0,
          totalPages: 0,
          page: 1,
          perPage: limit
        });
      }

      // 格式化学生数据
      const formattedStudents = students.items.map(student => {
        console.log('📝 原始学生数据:', student)
        return {
          id: student.id,
          student_id: student.student_id || student.id || '无学号',
          student_name: student.student_name || student.name || student.full_name || '未知姓名',
          center: student.center || '未指定',
          status: student.status || 'active',
          standard: student.standard || '未指定',
          studentUrl: student.studentUrl || '',
          created: student.created,
          updated: student.updated
        };
      })

      return NextResponse.json({
        success: true,
        students: formattedStudents,
        totalItems: students.totalItems,
        totalPages: students.totalPages,
        page: students.page,
        perPage: students.perPage
      })
    } catch (collectionError) {
      console.error('访问students集合失败:', collectionError)
      
      // 尝试列出所有集合来诊断问题
      try {
        const collections = await pb.collections.getFullList()
        console.log('可用集合:', collections.map(c => c.name))
        
        return NextResponse.json({
          success: false,
          error: '访问students集合失败',
          details: collectionError instanceof Error ? collectionError.message : '未知错误',
          availableCollections: collections.map(c => c.name)
        }, { status: 500 })
      } catch (listError) {
        console.error('无法列出集合:', listError)
        return NextResponse.json({
          success: false,
          error: '访问students集合失败',
          details: collectionError instanceof Error ? collectionError.message : '未知错误'
        }, { status: 500 })
      }
    }
  } catch (error: any) {
    console.error('获取学生数据失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '获取学生数据失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 收到添加学生请求:', body)

    // 获取PocketBase实例
    const pb = await getPocketBase()
    
    // 使用优化的管理员认证
    try {
      await authenticateAdmin()
      console.log('✅ 管理员认证成功')
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError)
      return NextResponse.json(
        { 
          success: false,
          error: 'PocketBase认证失败', 
          details: '无法以管理员身份登录'
        },
        { status: 500 }
      )
    }

    try {
      // 确保认证状态有效
      if (!pb.authStore.isValid) {
        console.log('⚠️ 认证状态无效，重新认证...')
        await authenticateAdmin()
      }

      // 准备学生数据
      const studentData = {
        student_name: body.student_name || '未命名学生',
        student_id: body.student_id || '',
        standard: body.standard || '',
        center: body.center || 'WX 01',
        status: body.status || 'active',
        gender: body.gender || 'male',
        serviceType: body.serviceType || 'afterschool',
        dob: body.dob || '',
        parentName: body.parentName || '',
        email: body.email || '',
        // 扩展信息
        nric: body.nric || '',
        school: body.school || '',
        parentPhone: body.parentPhone || '',
        emergencyContact: body.emergencyContact || '',
        emergencyPhone: body.emergencyPhone || '',
        healthInfo: body.healthInfo || '',
        pickupMethod: body.pickupMethod || 'parent',
        // 接送安排
        authorizedPickup1Name: body.authorizedPickup1Name || '',
        authorizedPickup1Phone: body.authorizedPickup1Phone || '',
        authorizedPickup1Relation: body.authorizedPickup1Relation || '',
        authorizedPickup2Name: body.authorizedPickup2Name || '',
        authorizedPickup2Phone: body.authorizedPickup2Phone || '',
        authorizedPickup2Relation: body.authorizedPickup2Relation || '',
        authorizedPickup3Name: body.authorizedPickup3Name || '',
        authorizedPickup3Phone: body.authorizedPickup3Phone || '',
        authorizedPickup3Relation: body.authorizedPickup3Relation || '',
        registrationDate: body.registrationDate || new Date().toISOString().split('T')[0],
        tuitionStatus: body.tuitionStatus || 'pending',
        birthCertificate: body.birthCertificate || null,
        avatar: body.avatar || null
      }

      console.log('💾 准备保存的学生数据:', studentData)

      // 创建学生记录
      const newStudent = await pb.collection('students').create(studentData)
      
      console.log('✅ 学生创建成功:', newStudent.id)

      return NextResponse.json({
        success: true,
        student: newStudent,
        message: '学生添加成功'
      })

    } catch (createError: any) {
      console.error('❌ 创建学生失败:', createError)
      
      return NextResponse.json({
        success: false,
        error: '创建学生失败',
        details: createError instanceof Error ? createError.message : '未知错误'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ 处理添加学生请求失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '处理请求失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}