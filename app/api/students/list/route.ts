import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const center = searchParams.get('center')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')

    // 获取PocketBase实例
    const pb = await getPocketBase()
    
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

    // 从PocketBase获取学生数据
    const students = await pb.collection('students').getList(page, limit, {
      filter: filter || undefined,
      sort: '-created',
      expand: 'center'
    })

    // 格式化学生数据
    const formattedStudents = students.items.map(student => ({
      id: student.id,
      student_id: student.student_id,
      student_name: student.student_name,
      studentUrl: student.studentUrl,
      center: student.center,
      status: student.status,
      standard: student.standard,
      created: student.created,
      updated: student.updated
    }))

    return NextResponse.json({
      success: true,
      students: formattedStudents,
      totalItems: students.totalItems,
      totalPages: students.totalPages,
      page: students.page,
      perPage: students.perPage
    })

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
