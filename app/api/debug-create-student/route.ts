import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 开始调试创建学生...')
    
    // 获取PocketBase实例
    const pb = await getPocketBase()
    console.log('✅ PocketBase实例已创建')
    
    // 管理员认证
    await authenticateAdmin()
    console.log('✅ 管理员认证成功')
    
    // 检查集合是否存在
    try {
      const collections = await pb.collections.getFullList()
      console.log('📋 可用集合:', collections.map(c => c.name))
      
      const studentsCollection = collections.find(c => c.name === 'students')
      if (!studentsCollection) {
        return NextResponse.json({
          success: false,
          error: 'students集合不存在',
          availableCollections: collections.map(c => c.name)
        })
      }
      
      console.log('✅ students集合存在')
      console.log('集合完整信息:', JSON.stringify(studentsCollection, null, 2))
      
      // 检查schema字段
      if (studentsCollection.schema) {
        console.log('集合字段:', JSON.stringify(studentsCollection.schema, null, 2))
        
        // 检查必填字段
        const requiredFields = studentsCollection.schema.filter((field: any) => field.required)
        console.log('必填字段:', requiredFields.map((f: any) => f.name))
        
        // 检查字段类型
        const fieldTypes = studentsCollection.schema.map((field: any) => ({
          name: field.name,
          type: field.type,
          required: field.required,
          options: field.options
        }))
        console.log('字段类型:', JSON.stringify(fieldTypes, null, 2))
      } else {
        console.log('⚠️ 集合没有schema字段')
      }
      
      // 返回集合信息，不尝试创建学生
      return NextResponse.json({
        success: true,
        message: '集合信息获取成功',
        collection: {
          name: studentsCollection.name,
          type: studentsCollection.type,
          schema: studentsCollection.schema,
          hasSchema: !!studentsCollection.schema
        }
      })
      
    } catch (error) {
      console.error('❌ 检查集合失败:', error)
      return NextResponse.json({
        success: false,
        error: '检查集合失败',
        details: error instanceof Error ? error.message : '未知错误'
      })
    }
    
  } catch (error: any) {
    console.error('❌ 调试创建学生失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '调试创建学生失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}
