import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

const POCKETBASE_URL = 'http://pjpc.tplinkdns.com:8090'

export async function GET() {
  const config: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    pocketbase: {
      url: POCKETBASE_URL,
      status: 'unknown'
    },
    tests: [] as any[],
  }

  try {
    // 测试1: 基本连接
    console.log('🔍 测试PocketBase连接...')
    try {
      const pb = new PocketBase(POCKETBASE_URL)
      const health = await pb.health.check()
      config.pocketbase.status = 'connected'
      config.tests.push({
        name: 'PocketBase连接',
        status: 'success',
        message: '连接成功',
        data: health
      })
      console.log('✅ PocketBase连接成功')
    } catch (error: any) {
      config.pocketbase.status = 'error'
      config.tests.push({
        name: 'PocketBase连接',
        status: 'error',
        message: error.message,
        error: error
      })
      console.log('❌ PocketBase连接失败:', error.message)
    }

    // 测试2: 检查集合
    if (config.pocketbase.status === 'connected') {
      try {
        const pb = new PocketBase(POCKETBASE_URL)
        const collections = await pb.collections.getFullList()
        config.tests.push({
          name: '获取集合列表',
          status: 'success',
          message: `找到 ${collections.length} 个集合`,
          data: {
            collections: collections.map(c => ({
              name: c.name,
              type: c.type,
              schema: Object.keys(c.schema || {})
            }))
          }
        })
        console.log('✅ 集合列表获取成功')
      } catch (error: any) {
        config.tests.push({
          name: '获取集合列表',
          status: 'error',
          message: error.message,
          error: error
        })
        console.log('❌ 集合列表获取失败:', error.message)
      }
    }

    // 测试3: 检查students集合
    if (config.pocketbase.status === 'connected') {
      try {
        const pb = new PocketBase(POCKETBASE_URL)
        const students = await pb.collection('students').getList(1, 5)
        config.tests.push({
          name: '获取学生数据',
          status: 'success',
          message: `找到 ${students.items.length} 个学生`,
          data: {
            totalItems: students.totalItems,
            sampleData: students.items.slice(0, 2)
          }
        })
        console.log('✅ 学生数据获取成功')
      } catch (error: any) {
        config.tests.push({
          name: '获取学生数据',
          status: 'error',
          message: error.message,
          error: error
        })
        console.log('❌ 学生数据获取失败:', error.message)
      }
    }

    // 测试4: 检查teachers集合
    if (config.pocketbase.status === 'connected') {
      try {
        const pb = new PocketBase(POCKETBASE_URL)
        const teachers = await pb.collection('teachers').getList(1, 5)
        config.tests.push({
          name: '获取教师数据',
          status: 'success',
          message: `找到 ${teachers.items.length} 个教师`,
          data: {
            totalItems: teachers.totalItems,
            sampleData: teachers.items.slice(0, 2)
          }
        })
        console.log('✅ 教师数据获取成功')
      } catch (error: any) {
        config.tests.push({
          name: '获取教师数据',
          status: 'error',
          message: error.message,
          error: error
        })
        console.log('❌ 教师数据获取失败:', error.message)
      }
    }

  } catch (error: any) {
    console.error('❌ 服务器配置检查失败:', error)
    config.tests.push({
      name: '总体检查',
      status: 'error',
      message: error.message,
      error: error
    })
  }

  // 计算总体状态
  const successCount = config.tests.filter((t: any) => t.status === 'success').length
  const errorCount = config.tests.filter((t: any) => t.status === 'error').length
  const totalTests = config.tests.length

  config.summary = {
    total: totalTests,
    success: successCount,
    errors: errorCount,
    successRate: totalTests > 0 ? Math.round((successCount / totalTests) * 100) : 0
  }

  console.log('📊 服务器配置检查完成:', config.summary)

  return NextResponse.json({
    success: errorCount === 0,
    ...config
  })
}
