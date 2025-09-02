import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// 静态导出配置
export const dynamic = 'force-static'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const center = searchParams.get('center')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
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
      // 从PocketBase获取学生数据 - 使用最简单的查询，不指定任何字段
      const students = await pb.collection('students').getList(page, limit, {
        sort: '-created'
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

      // 格式化学生数据 - 只使用最基本的字段
      const formattedStudents = students.items.map(student => {
        // 只返回最基本的字段，避免字段不匹配问题
        return {
          id: student.id,
          student_id: student.student_id || '无学号',
          student_name: student.student_name || '未知姓名',
          center: student.center || '未指定',
          status: student.status || 'active',
          standard: student.standard || '未指定',
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
          error: 'students集合访问失败',
          details: `集合错误: ${collectionError.message}`,
          availableCollections: collections.map(c => c.name)
        }, { status: 500 })
      } catch (listError) {
        return NextResponse.json({
          success: false,
          error: 'students集合访问失败',
          details: `集合错误: ${collectionError.message}, 无法列出可用集合: ${listError.message}`
        }, { status: 500 })
      }
    }

  } catch (error) {
    console.error('获取学生列表失败:', error)
    return NextResponse.json({ 
      success: false, 
      error: '获取学生列表失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, student_name, studentUrl, center, status, standard } = body

    // 验证必填字段
    if (!student_id || !student_name) {
      return NextResponse.json({ 
        success: false, 
        error: '学生ID和姓名是必填字段' 
      }, { status: 400 })
    }

    // 获取PocketBase实例
    const pb = await getPocketBase()

    // 检查学生ID是否已存在
    const existingStudent = await pb.collection('students').getFirstListItem(`student_id = "${student_id}"`)
    if (existingStudent) {
      return NextResponse.json({ 
        success: false, 
        error: '学生ID已存在' 
      }, { status: 400 })
    }

    // 创建新学生
    const studentData = {
      student_id,
      student_name,
      studentUrl: studentUrl || null,
      center: center || 'WX 01',
      status: status || 'active',
      standard: standard || null
    }

    const newStudent = await pb.collection('students').create(studentData)

    return NextResponse.json({
      success: true,
      message: '学生创建成功',
      student: {
        id: newStudent.id,
        student_id: newStudent.student_id,
        student_name: newStudent.student_name,
        studentUrl: newStudent.studentUrl,
        center: newStudent.center,
        status: newStudent.status,
        standard: newStudent.standard,
        created: newStudent.created,
        updated: newStudent.updated
      }
    })

  } catch (error) {
    console.error('创建学生失败:', error)
    return NextResponse.json({ 
      success: false, 
      error: '创建学生失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}
