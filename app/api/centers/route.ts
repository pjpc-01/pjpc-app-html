import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
import { authenticateAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    
    // 管理员认证
    try {
      await authenticateAdmin(pb)
      console.log('✅ 管理员认证成功')
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError)
      return NextResponse.json(
        { 
          success: false,
          error: 'PocketBase认证失败', 
          details: authError instanceof Error ? authError.message : '未知认证错误'
        },
        { status: 401 }
      )
    }

    // 从学生数据中提取centers
    try {
      const students = await pb.collection('students').getFullList({
        fields: 'id,student_id,student_name,center,status'
      })

      // 统计每个center的学生数量
      const centerMap = new Map<string, number>()
      
      students.forEach((student: any) => {
        const center = student?.center ?? student?.Center ?? student?.centre ?? student?.branch
        if (center && student?.status === 'active') {
          centerMap.set(center, (centerMap.get(center) || 0) + 1)
        }
      })

      // 转换为数组格式
      const centers = Array.from(centerMap.entries()).map(([name, count]) => ({
        id: name,
        name: name,
        count: count
      }))

      // 如果没有找到centers，返回默认值
      if (centers.length === 0) {
        return NextResponse.json({
          success: true,
          data: [
            { id: 'WX 01', name: 'WX 01', count: 0 },
            { id: 'WX 02', name: 'WX 02', count: 0 },
            { id: 'WX 03', name: 'WX 03', count: 0 }
          ]
        })
      }

      console.log(`✅ 获取到 ${centers.length} 个centers`)
      
      return NextResponse.json({
        success: true,
        data: centers
      })

    } catch (studentsError) {
      console.error('❌ 获取学生数据失败:', studentsError)
      
      // 返回默认centers
      return NextResponse.json({
        success: true,
        data: [
          { id: 'WX 01', name: 'WX 01', count: 0 },
          { id: 'WX 02', name: 'WX 02', count: 0 },
          { id: 'WX 03', name: 'WX 03', count: 0 }
        ]
      })
    }

  } catch (error) {
    console.error('❌ 获取centers失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '获取centers失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
