import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 开始创建简单学生...')
    
    // 获取PocketBase实例
    const pb = await getPocketBase()
    console.log('✅ PocketBase实例已创建')
    
    // 管理员认证
    await authenticateAdmin()
    console.log('✅ 管理员认证成功')
    
    // 使用现有记录中确实存在的字段
    const simpleStudent = {
      student_id: 'TEST001',
      student_name: '测试学生',
      center: 'WX 01',
      status: 'active',
      gender: 'Male',
      standard: '一年级',
      parents_name: '测试家长',
      parents_phone: '012-3456789',
      home_address: '测试地址',
      studentUrl: 'https://example.com/test'
    }
    
    console.log('🔄 尝试创建简单学生数据:', simpleStudent)
    
    try {
      const student = await pb.collection('students').create(simpleStudent)
      console.log('✅ 创建学生成功:', student)
      
      return NextResponse.json({
        success: true,
        message: '成功创建测试学生',
        student: student
      })
      
    } catch (createError: any) {
      console.error('❌ 创建学生失败:', createError)
      console.error('错误详情:', createError.message)
      console.error('错误代码:', createError.status)
      console.error('完整错误:', createError)
      
      return NextResponse.json({
        success: false,
        error: '创建学生失败',
        details: createError.message || '未知错误',
        errorCode: createError.status,
        fullError: createError.toString()
      })
    }
    
  } catch (error: any) {
    console.error('❌ 创建简单学生失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '创建简单学生失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}
