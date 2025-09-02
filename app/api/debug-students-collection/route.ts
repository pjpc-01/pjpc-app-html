import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// 静态导出配置
export const dynamic = 'force-static'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 开始调试students集合...')
    
    // 获取PocketBase实例
    const pb = await getPocketBase()
    console.log('✅ PocketBase实例已创建')
    
    // 管理员认证
    await authenticateAdmin()
    console.log('✅ 管理员认证成功')
    
    // 获取集合详细信息
    try {
      const collections = await pb.collections.getFullList()
      console.log('📋 所有集合:', collections.map(c => ({ name: c.name, type: c.type })))
      
      const studentsCollection = collections.find(c => c.name === 'students')
      if (!studentsCollection) {
        return NextResponse.json({
          success: false,
          error: 'students集合不存在',
          availableCollections: collections.map(c => c.name)
        })
      }
      
      console.log('✅ students集合存在')
      console.log('集合详细信息:', JSON.stringify(studentsCollection, null, 2))
      
      // 尝试获取现有记录
      try {
        const existingRecords = await pb.collection('students').getList(1, 5)
        console.log('📊 现有记录数量:', existingRecords.totalItems)
        console.log('📊 现有记录:', existingRecords.items)
        
        return NextResponse.json({
          success: true,
          message: '集合调试信息',
          collection: {
            name: studentsCollection.name,
            type: studentsCollection.type,
            id: studentsCollection.id,
            created: studentsCollection.created,
            updated: studentsCollection.updated,
            schema: studentsCollection.schema,
            hasSchema: !!studentsCollection.schema,
            schemaLength: studentsCollection.schema ? studentsCollection.schema.length : 0
          },
          existingRecords: {
            totalItems: existingRecords.totalItems,
            items: existingRecords.items,
            hasRecords: existingRecords.totalItems > 0
          }
        })
        
      } catch (recordsError: any) {
        console.error('❌ 获取现有记录失败:', recordsError)
        return NextResponse.json({
          success: true,
          message: '集合存在但无法获取记录',
          collection: {
            name: studentsCollection.name,
            type: studentsCollection.type,
            id: studentsCollection.id,
            schema: studentsCollection.schema,
            hasSchema: !!studentsCollection.schema
          },
          recordsError: {
            message: recordsError.message,
            status: recordsError.status
          }
        })
      }
      
    } catch (error: any) {
      console.error('❌ 检查集合失败:', error)
      return NextResponse.json({
        success: false,
        error: '检查集合失败',
        details: error.message || '未知错误',
        status: error.status
      })
    }
    
  } catch (error: any) {
    console.error('❌ 调试students集合失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '调试students集合失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}
