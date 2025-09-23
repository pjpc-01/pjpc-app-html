import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

// 使用正确的PocketBase服务器地址
const pb = new PocketBase('http://pjpc.tplinkdns.com:8090')

export async function GET() {
  const testResults = {
    timestamp: new Date().toISOString(),
    server: 'http://pjpc.tplinkdns.com:8090',
    tests: []
  }

  try {
    // 测试1: 基本连接
    console.log('🔍 测试1: 基本连接...')
    try {
      const health = await pb.health.check()
      testResults.tests.push({
        name: '基本连接',
        status: 'success',
        message: 'PocketBase服务器连接正常',
        data: health
      })
      console.log('✅ 基本连接成功')
    } catch (error: any) {
      testResults.tests.push({
        name: '基本连接',
        status: 'error',
        message: error.message,
        error: error
      })
      console.log('❌ 基本连接失败:', error.message)
    }

    // 测试2: 获取集合列表
    console.log('🔍 测试2: 获取集合列表...')
    try {
      const collections = await pb.collections.getFullList()
      testResults.tests.push({
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
      console.log('✅ 集合列表获取成功:', collections.map(c => c.name))
    } catch (error: any) {
      testResults.tests.push({
        name: '获取集合列表',
        status: 'error',
        message: error.message,
        error: error
      })
      console.log('❌ 集合列表获取失败:', error.message)
    }

    // 测试3: 检查students集合
    console.log('🔍 测试3: 检查students集合...')
    try {
      const studentsCollection = await pb.collections.getOne('students')
      testResults.tests.push({
        name: '检查students集合',
        status: 'success',
        message: 'students集合存在',
        data: {
          name: studentsCollection.name,
          type: studentsCollection.type,
          schema: Object.keys(studentsCollection.schema || {}),
          rules: {
            createRule: studentsCollection.createRule,
            updateRule: studentsCollection.updateRule,
            deleteRule: studentsCollection.deleteRule,
            listRule: studentsCollection.listRule,
            viewRule: studentsCollection.viewRule
          }
        }
      })
      console.log('✅ students集合检查成功')
    } catch (error: any) {
      testResults.tests.push({
        name: '检查students集合',
        status: 'error',
        message: error.message,
        error: error
      })
      console.log('❌ students集合检查失败:', error.message)
    }

    // 测试4: 尝试获取学生数据
    console.log('🔍 测试4: 尝试获取学生数据...')
    try {
      const students = await pb.collection('students').getList(1, 10)
      testResults.tests.push({
        name: '获取学生数据',
        status: 'success',
        message: `成功获取 ${students.items.length} 个学生记录`,
        data: {
          totalItems: students.totalItems,
          totalPages: students.totalPages,
          page: students.page,
          perPage: students.perPage,
          items: students.items.slice(0, 3), // 只显示前3个
          sampleFields: students.items.length > 0 ? Object.keys(students.items[0]) : []
        }
      })
      console.log(`✅ 学生数据获取成功: ${students.items.length} 条记录`)
      if (students.items.length > 0) {
        console.log('🔍 第一个学生数据:', students.items[0])
      }
    } catch (error: any) {
      testResults.tests.push({
        name: '获取学生数据',
        status: 'error',
        message: error.message,
        error: {
          message: error.message,
          status: error.status,
          data: error.data,
          response: error.response
        }
      })
      console.log('❌ 学生数据获取失败:', error.message)
    }

    // 测试5: 尝试创建测试学生（如果集合为空）
    console.log('🔍 测试5: 检查是否需要创建测试数据...')
    try {
      const students = await pb.collection('students').getList(1, 1)
      if (students.items.length === 0) {
        console.log('⚠️ students集合为空，尝试创建测试数据...')
        try {
          const testStudent = await pb.collection('students').create({
            student_id: 'TEST001',
            student_name: '测试学生',
            cardNumber: '***REMOVED***',
            center: 'WX 01',
            status: 'active'
          })
          testResults.tests.push({
            name: '创建测试数据',
            status: 'success',
            message: '成功创建测试学生',
            data: testStudent
          })
          console.log('✅ 测试学生创建成功:', testStudent.id)
        } catch (createError: any) {
          testResults.tests.push({
            name: '创建测试数据',
            status: 'error',
            message: createError.message,
            error: createError
          })
          console.log('❌ 测试学生创建失败:', createError.message)
        }
      } else {
        testResults.tests.push({
          name: '创建测试数据',
          status: 'skipped',
          message: 'students集合已有数据，跳过创建'
        })
        console.log('✅ students集合已有数据，无需创建测试数据')
      }
    } catch (error: any) {
      testResults.tests.push({
        name: '创建测试数据',
        status: 'error',
        message: error.message,
        error: error
      })
      console.log('❌ 检查测试数据失败:', error.message)
    }

  } catch (error: any) {
    console.error('❌ 测试过程中发生严重错误:', error)
    testResults.tests.push({
      name: '总体测试',
      status: 'error',
      message: '测试过程中发生严重错误',
      error: error
    })
  }

  // 计算总体状态
  const successCount = testResults.tests.filter(t => t.status === 'success').length
  const errorCount = testResults.tests.filter(t => t.status === 'error').length
  const totalTests = testResults.tests.length

  testResults.summary = {
    total: totalTests,
    success: successCount,
    errors: errorCount,
    successRate: totalTests > 0 ? Math.round((successCount / totalTests) * 100) : 0
  }

  console.log('📊 测试总结:', testResults.summary)

  return NextResponse.json({
    success: errorCount === 0,
    ...testResults
  })
}
