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
    const testStudents = [
      {
        student_id: 'TEST_FLOW_1',
        level: 'primary',
        standard: '一年级',
        student_name: '测试学生1',
        center: 'WX 01',
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
        student_id: 'TEST_FLOW_2',
        level: 'secondary',
        standard: '中一',
        student_name: '测试学生2',
        center: 'WX 01',
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
    
    console.log('测试数据:', testStudents)
    
    const createdStudents = []
    const errors = []
    
    for (const student of testStudents) {
      try {
        // 只包含必要字段
        const cleanStudent = {
          student_id: student.student_id?.trim() || '',
          student_name: student.student_name?.trim() || '',
          level: student.level || 'primary',
          standard: student.standard?.trim() || '',
          center: student.center || 'WX 01',
          status: student.status || 'active',
          cardType: student.cardType || 'NFC',
          balance: typeof student.balance === 'number' ? student.balance : 0
        }
        
        console.log(`尝试创建: ${cleanStudent.student_id}`)
        const record = await pb.collection('students').create(cleanStudent)
        createdStudents.push(record)
        console.log(`✅ 创建成功: ${cleanStudent.student_id}`)
        
      } catch (error) {
        const errorMsg = `创建失败 (${student.student_id}): ${error instanceof Error ? error.message : '未知错误'}`
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
        created: createdStudents.length,
        failed: errors.length,
        errors: errors,
        totalInDatabase: allRecords.length,
        testStudents: createdStudents.map(s => ({ id: s.id, student_id: s.student_id, student_name: s.student_name }))
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
