import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

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
