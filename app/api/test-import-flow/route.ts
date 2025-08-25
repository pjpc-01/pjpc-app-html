import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'

export async function POST(request: NextRequest) {
  try {
    console.log('测试完整导入流程...')
    
    const pb = await getPocketBase()
    
    // 认证
    await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
    console.log('✅ 认证成功')
    
    // 测试数据 - 模拟前端发送的数据格式
    const testCards = [
      {
        studentId: 'TEST_FLOW_1',
        level: 'primary',
        grade: '一年级',
        studentName: '测试学生1',
        studentUrl: 'https://example.com/1',
        status: 'active',
        cardType: 'NFC',
        balance: 100,
        cardNumber: '',
        issuedDate: '',
        expiryDate: '',
        lastUsed: '',
        usageCount: 0,
        enrollmentDate: '',
        phone: '',
        email: '',
        parentName: '',
        parentPhone: '',
        address: '',
        emergencyContact: '',
        medicalInfo: '',
        notes: ''
      },
      {
        studentId: 'TEST_FLOW_2',
        level: 'secondary',
        grade: '中一',
        studentName: '测试学生2',
        studentUrl: 'https://example.com/2',
        status: 'active',
        cardType: 'NFC',
        balance: 200,
        cardNumber: '',
        issuedDate: '',
        expiryDate: '',
        lastUsed: '',
        usageCount: 0,
        enrollmentDate: '',
        phone: '',
        email: '',
        parentName: '',
        parentPhone: '',
        address: '',
        emergencyContact: '',
        medicalInfo: '',
        notes: ''
      }
    ]
    
    console.log('测试数据:', testCards)
    
    const createdCards = []
    const errors = []
    
    for (const card of testCards) {
      try {
        // 只包含必要字段
        const cleanCard = {
          studentId: card.studentId?.trim() || '',
          studentName: card.studentName?.trim() || '',
          studentUrl: card.studentUrl?.trim() || '',
          level: card.level || '',
          grade: card.grade?.trim() || '',
          cardType: card.cardType || '',
          status: card.status || '',
          balance: typeof card.balance === 'number' ? card.balance : 0
        }
        
        console.log(`尝试创建: ${cleanCard.studentId}`)
        // 创建学生记录
        const record = await pb.collection('students').create(cleanCard)
        createdCards.push(record)
        console.log(`✅ 创建成功: ${cleanCard.studentId}`)
        
      } catch (error) {
        const errorMsg = `创建失败 (${card.studentId}): ${error instanceof Error ? error.message : '未知错误'}`
        console.error(`❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }
    
    // 验证数据是否真的保存了
    const allRecords = await pb.collection('students').getFullList()
    console.log(`数据库中总共有 ${allRecords.length} 条记录`)
    
    return NextResponse.json({
      success: true,
      testResults: {
        created: createdCards.length,
        failed: errors.length,
        errors: errors,
        totalInDatabase: allRecords.length,
        testCards: createdCards.map(c => ({ id: c.id, studentId: c.studentId, studentName: c.studentName }))
      }
    })
    
  } catch (error) {
    console.error('测试失败:', error)
    return NextResponse.json({
      error: '测试失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}
