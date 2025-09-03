import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'

// 动态导出配置
export const dynamic = 'force-dynamic'

// 调试集合结构
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 开始检查 PocketBase 集合结构...')
    const pb = await getPocketBase()
    
    // 确保认证状态有效
    if (!pb.authStore.isValid) {
      console.log('⚠️ 认证状态无效，重新认证...')
      await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
    }
    
    // 获取所有集合
    const collections = await pb.collections.getFullList()
    console.log(`✅ 找到 ${collections.length} 个集合`)
    
    // 查找相关集合
    const relevantCollections = collections.filter(c => 
      c.name.includes('student') || 
      c.name.includes('point') || 
      c.name.includes('teacher') ||
      c.name.includes('transaction')
    )
    
    const collectionInfo = relevantCollections.map(collection => ({
      name: collection.name,
      type: collection.type,
      schema: collection.schema.map((field: any) => ({
        name: field.name,
        type: field.type,
        required: field.required,
        options: field.options,
        system: field.system
      })),
      indexes: collection.indexes,
      listRule: collection.listRule,
      viewRule: collection.viewRule,
      createRule: collection.createRule,
      updateRule: collection.updateRule,
      deleteRule: collection.deleteRule
    }))
    
    // 特别检查 student_points 和 point_transactions 集合
    const studentPointsCollection = collections.find(c => c.name === 'student_points')
    const pointTransactionsCollection = collections.find(c => c.name === 'point_transactions')
    
    const result = {
      totalCollections: collections.length,
      relevantCollections: collectionInfo,
      studentPointsExists: !!studentPointsCollection,
      pointTransactionsExists: !!pointTransactionsCollection,
      studentPointsDetails: studentPointsCollection ? {
        name: studentPointsCollection.name,
        type: studentPointsCollection.type,
        schema: studentPointsCollection.schema.map((field: any) => ({
          name: field.name,
          type: field.type,
          required: field.required,
          options: field.options,
          system: field.system
        })),
        rules: {
          listRule: studentPointsCollection.listRule,
          viewRule: studentPointsCollection.viewRule,
          createRule: studentPointsCollection.createRule,
          updateRule: studentPointsCollection.updateRule,
          deleteRule: studentPointsCollection.deleteRule
        }
      } : null,
      pointTransactionsDetails: pointTransactionsCollection ? {
        name: pointTransactionsCollection.name,
        type: pointTransactionsCollection.type,
        schema: pointTransactionsCollection.schema.map((field: any) => ({
          name: field.name,
          type: field.type,
          required: field.required,
          options: field.options,
          system: field.system
        })),
        rules: {
          listRule: pointTransactionsCollection.listRule,
          viewRule: pointTransactionsCollection.viewRule,
          createRule: pointTransactionsCollection.createRule,
          updateRule: pointTransactionsCollection.updateRule,
          deleteRule: pointTransactionsCollection.deleteRule
        }
      } : null
    }
    
    console.log('📋 集合检查结果:', JSON.stringify(result, null, 2))
    
    return NextResponse.json({
      success: true,
      data: result
    })
    
  } catch (error) {
    console.error('❌ 检查集合结构失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
