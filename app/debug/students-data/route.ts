import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const center = searchParams.get('center')
    const debug = searchParams.get('debug') === 'true'

    console.log('🔍 调试学生数据API被调用')
    console.log('📍 请求的中心ID:', center)
    console.log('🔧 调试模式:', debug)

    // 获取PocketBase实例
    const pb = await getPocketBase()
    console.log('✅ PocketBase实例获取成功')
    
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
          details: '无法以管理员身份登录',
          authError: authError instanceof Error ? authError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    // 首先获取所有集合信息
    let collectionsInfo = []
    try {
      const collections = await pb.collections.getFullList()
      collectionsInfo = collections.map(c => ({
        name: c.name,
        type: c.type,
        schema: Object.keys(c.schema)
      }))
      console.log('📚 可用集合:', collections.map(c => c.name))
    } catch (collectionsError) {
      console.error('❌ 获取集合列表失败:', collectionsError)
      collectionsInfo = [{ error: '无法获取集合列表' }]
    }

    // 尝试获取所有学生数据（不限制中心）
    let allStudents = []
    let centerFilteredStudents = []
    let filterQuery = ''

    try {
      // 获取所有学生
      const allStudentsResult = await pb.collection('students').getList(1, 1000, {
        sort: 'student_name'
      })
      
      allStudents = allStudentsResult.items.map(student => ({
        id: student.id,
        student_id: student.student_id || '无学号',
        student_name: student.student_name || '未知姓名',
        center: student.center || '未指定',
        status: student.status || 'active',
        standard: student.standard || '未指定',
        created: student.created,
        updated: student.updated
      }))

      console.log(`✅ 成功获取 ${allStudents.length} 个学生记录`)
      console.log('📊 学生中心分布:', allStudents.reduce((acc, s) => {
        acc[s.center] = (acc[s.center] || 0) + 1
        return acc
      }, {} as Record<string, number>))

      // 如果指定了中心，进行过滤
      if (center) {
        filterQuery = `center = "${center}"`
        console.log('🔍 应用中心过滤:', filterQuery)
        
        const filteredResult = await pb.collection('students').getList(1, 1000, {
          sort: 'student_name',
          filter: filterQuery
        })
        
        centerFilteredStudents = filteredResult.items.map(student => ({
          id: student.id,
          student_id: student.student_id || '无学号',
          student_name: student.student_name || '未知姓名',
          center: student.center || '未指定',
          status: student.status || 'active',
          standard: student.standard || '未指定',
          created: student.created,
          updated: student.updated
        }))

        console.log(`✅ 中心 ${center} 过滤后: ${centerFilteredStudents.length} 个学生`)
      }

    } catch (studentsError) {
      console.error('❌ 获取学生数据失败:', studentsError)
      return NextResponse.json({
        success: false,
        error: '获取学生数据失败',
        details: studentsError instanceof Error ? studentsError.message : '未知错误',
        collectionsInfo,
        debug: {
          center,
          filterQuery,
          error: studentsError
        }
      }, { status: 500 })
    }

    // 返回调试信息
    return NextResponse.json({
      success: true,
      debug: {
        requestedCenter: center,
        filterQuery,
        totalStudents: allStudents.length,
        centerFilteredStudents: centerFilteredStudents.length,
        collectionsInfo
      },
      allStudents: debug ? allStudents : [],
      centerFilteredStudents: center ? centerFilteredStudents : [],
      summary: {
        totalStudents: allStudents.length,
        centers: Object.keys(allStudents.reduce((acc, s) => {
          acc[s.center] = (acc[s.center] || 0) + 1
          return acc
        }, {} as Record<string, number>)),
        centerDistribution: allStudents.reduce((acc, s) => {
          acc[s.center] = (acc[s.center] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    })

  } catch (error: any) {
    console.error('❌ 调试API失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '调试API失败', 
        details: error.message || '未知错误',
        stack: error.stack
      },
      { status: 500 }
    )
  }
}
