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
    
    // 使用新的认证函数
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
      console.log('🔍 尝试访问students集合...');
      
      // 直接从 students 集合获取学生数据
      const studentsRecords = await pb.collection('students').getList(page, limit * 10, {
        sort: '-created'
      })

      console.log(`✅ 成功获取 ${studentsRecords.items.length} 条学生记录`);

      // 格式化学生数据
      const students = studentsRecords.items.map(student => ({
        id: student.id,
        student_id: student.student_id || '无学号',
        student_name: student.student_name || '未知姓名',
        center: student.center || '未指定',
        status: student.status || 'active',
        standard: student.standard || '未指定',
        created: student.created,
        updated: student.updated
      }));

      // 应用筛选
      let filteredStudents = students;
      if (center && center !== 'all') {
        filteredStudents = students.filter(s => s.center === center);
      }
      if (status && status !== 'all') {
        filteredStudents = students.filter(s => s.status === status);
      }

      // 分页
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

      return NextResponse.json({
        success: true,
        students: paginatedStudents,
        totalItems: filteredStudents.length,
        totalPages: Math.ceil(filteredStudents.length / limit),
        page: page,
        perPage: limit,
        note: '数据来源：students 集合'
      });

    } catch (collectionError) {
      console.error('访问students集合失败:', collectionError);
      
      return NextResponse.json({
        success: false,
        error: 'students集合访问失败',
        details: `集合错误: ${collectionError instanceof Error ? collectionError.message : '未知错误'}`,
        fallback: '建议检查 PocketBase 中 students 集合的配置'
      }, { status: 500 });
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
