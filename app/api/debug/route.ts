import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

// 测试不同的PocketBase URL
const POCKETBASE_URLS = [
  'http://pjpc.tplinkdns.com:8090',  // 主要服务器
  'http://pjpc.tplinkdns.com:8090',        // 本地网络
  'http://localhost:8090'             // 本地开发
]

export async function GET() {
  const results = []
  
  for (const url of POCKETBASE_URLS) {
    try {
      console.log(`🔍 测试PocketBase连接: ${url}`)
      const pb = new PocketBase(url)
      
      // 先进行管理员认证
      await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      console.log(`✅ ${url} 管理员认证成功`)
      
      // 测试连接
      const collections = await pb.collections.getFullList()
      console.log(`✅ ${url} 连接成功，找到 ${collections.length} 个集合`)
      
      // 检查students集合
      const students = await pb.collection('students').getList(1, 5)
      console.log(`📊 ${url} students集合有 ${students.items.length} 条记录`)
      
      // 特别检查积分相关集合
      const studentPointsCollection = collections.find(c => c.name === 'student_points')
      const pointTransactionsCollection = collections.find(c => c.name === 'point_transactions')
      
      results.push({
        url,
        status: 'success',
        collections: collections.length,
        students: students.items.length,
        collectionNames: collections.map(c => c.name),
        sampleStudents: students.items.slice(0, 2),
        studentPointsCollection: studentPointsCollection ? {
          name: studentPointsCollection.name,
          id: studentPointsCollection.id,
          schema: studentPointsCollection.schema
        } : null,
        pointTransactionsCollection: pointTransactionsCollection ? {
          name: pointTransactionsCollection.name,
          id: pointTransactionsCollection.id,
          schema: pointTransactionsCollection.schema
        } : null
      })
      
    } catch (error: any) {
      console.error(`❌ ${url} 连接失败:`, error.message)
      results.push({
        url,
        status: 'error',
        error: error.message
      })
    }
  }
  
  return NextResponse.json({
    success: true,
    results,
    timestamp: new Date().toISOString()
  })
}
