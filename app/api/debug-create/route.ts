import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== 详细调试创建过程 ===')
    
    const pb = await getPocketBase()
    
    // 认证
    await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
    console.log('✅ 认证成功')
    
    // 测试数据 - 完全匹配简单创建的数据格式
    const testData = {
      studentId: 'DEBUG_' + Date.now(),
      studentName: '调试学生',
      studentUrl: 'https://example.com/debug'
    }
    
    console.log('测试数据:', testData)
    console.log('数据类型检查:')
    console.log('- studentId:', typeof testData.studentId, testData.studentId)
    console.log('- studentName:', typeof testData.studentName, testData.studentName)
    console.log('- studentUrl:', typeof testData.studentUrl, testData.studentUrl)
    
    try {
      console.log('尝试创建记录...')
      const record = await pb.collection('students_card').create(testData)
      console.log('✅ 创建成功:', record)
      
      return NextResponse.json({
        success: true,
        message: '调试创建成功',
        record: record,
        debugInfo: {
          dataType: typeof testData,
          fields: Object.keys(testData),
          fieldTypes: Object.fromEntries(
            Object.entries(testData).map(([key, value]) => [key, typeof value])
          )
        }
      })
      
    } catch (createError) {
      console.error('❌ 创建失败:', createError)
      
      // 获取详细的错误信息
      let errorDetails = '未知错误'
      if (createError instanceof Error) {
        errorDetails = createError.message
        console.error('错误详情:', createError)
        console.error('错误堆栈:', createError.stack)
      }
      
      return NextResponse.json({
        error: '调试创建失败',
        details: errorDetails,
        testData: testData,
        debugInfo: {
          dataType: typeof testData,
          fields: Object.keys(testData),
          fieldTypes: Object.fromEntries(
            Object.entries(testData).map(([key, value]) => [key, typeof value])
          )
        }
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('调试失败:', error)
    return NextResponse.json({
      error: '调试失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}
