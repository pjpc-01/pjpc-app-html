import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export async function POST(request: NextRequest) {
  try {
    // 获取PocketBase实例
    const pb = await getPocketBase()
    
    // 管理员认证
    await authenticateAdmin()
    
    // 测试学生数据 - 使用完整的学生字段结构
    const testStudents = [
      {
        // 基本信息
        student_id: 'B001',
        student_name: '张三',
        dob: '2015-03-15',
        gender: 'male',
        standard: '1',
        level: 'primary',
        center: 'WX 01',
        serviceType: 'afterschool',
        status: 'active',
        
        // 学校信息
        school: '华文小学',
        
        // 父母信息
        parents_name: '张父',
        parents_phone: '012-3456789',
        email: 'zhang@example.com',
        
        // 紧急联络人
        emergencyContactName: '张母',
        emergencyContactPhone: '012-3456790',
        
        // 健康信息
        medicalNotes: '无特殊健康状况',
        
        // 接送信息
        pickupMethod: 'parent',
        
        // 注册信息
        registrationDate: '2024-01-15',
        tuitionStatus: 'paid',
        
        // 考勤相关
        cardNumber: 'NFC001',
        cardType: 'NFC',
        studentUrl: 'https://example.com/student/B001',
        balance: 100.00,
        enrollmentDate: '2024-01-15'
      },
      {
        // 基本信息
        student_id: 'G002',
        student_name: '李四',
        dob: '2014-07-20',
        gender: 'female',
        standard: '2',
        level: 'primary',
        center: 'WX 01',
        serviceType: 'tuition',
        status: 'active',
        
        // 学校信息
        school: '华文小学',
        
        // 父母信息
        parents_name: '李父',
        parents_phone: '012-3456788',
        email: 'li@example.com',
        
        // 紧急联络人
        emergencyContactName: '李母',
        emergencyContactPhone: '012-3456787',
        
        // 健康信息
        medicalNotes: '对花生过敏',
        
        // 接送信息
        pickupMethod: 'authorized',
        authorizedPickup1Name: '李奶奶',
        authorizedPickup1Phone: '012-3456786',
        authorizedPickup1Relation: '奶奶',
        
        // 注册信息
        registrationDate: '2024-01-20',
        tuitionStatus: 'paid',
        
        // 考勤相关
        cardNumber: 'NFC002',
        cardType: 'NFC',
        studentUrl: 'https://example.com/student/G002',
        balance: 150.00,
        enrollmentDate: '2024-01-20'
      },
      {
        // 基本信息
        student_id: 'B003',
        student_name: '王五',
        dob: '2013-11-10',
        gender: 'male',
        standard: '3',
        level: 'primary',
        center: 'WX 01',
        serviceType: 'afterschool',
        status: 'active',
        
        // 学校信息
        school: '华文小学',
        
        // 父母信息
        parents_name: '王父',
        parents_phone: '012-3456785',
        email: 'wang@example.com',
        
        // 紧急联络人
        emergencyContactName: '王母',
        emergencyContactPhone: '012-3456784',
        
        // 健康信息
        medicalNotes: '无特殊健康状况',
        
        // 接送信息
        pickupMethod: 'parent',
        
        // 注册信息
        registrationDate: '2024-01-25',
        tuitionStatus: 'partial',
        
        // 考勤相关
        cardNumber: 'NFC003',
        cardType: 'NFC',
        studentUrl: 'https://example.com/student/B003',
        balance: 75.00,
        enrollmentDate: '2024-01-25'
      },
      {
        // 基本信息
        student_id: 'G004',
        student_name: '赵六',
        dob: '2012-05-08',
        gender: 'female',
        standard: '4',
        level: 'primary',
        center: 'WX 02',
        serviceType: 'afterschool',
        status: 'active',
        
        // 学校信息
        school: '华文小学',
        
        // 父母信息
        parents_name: '赵父',
        parents_phone: '012-3456783',
        email: 'zhao@example.com',
        
        // 紧急联络人
        emergencyContactName: '赵母',
        emergencyContactPhone: '012-3456782',
        
        // 健康信息
        medicalNotes: '无特殊健康状况',
        
        // 接送信息
        pickupMethod: 'guardian',
        
        // 注册信息
        registrationDate: '2024-02-01',
        tuitionStatus: 'paid',
        
        // 考勤相关
        cardNumber: 'NFC004',
        cardType: 'NFC',
        studentUrl: 'https://example.com/student/G004',
        balance: 200.00,
        enrollmentDate: '2024-02-01'
      },
      {
        // 基本信息
        student_id: 'B005',
        student_name: '钱七',
        dob: '2011-09-12',
        gender: 'male',
        standard: '5',
        level: 'primary',
        center: 'WX 02',
        serviceType: 'tuition',
        status: 'active',
        
        // 学校信息
        school: '华文小学',
        
        // 父母信息
        parents_name: '钱父',
        parents_phone: '012-3456781',
        email: 'qian@example.com',
        
        // 紧急联络人
        emergencyContactName: '钱母',
        emergencyContactPhone: '012-3456780',
        
        // 健康信息
        medicalNotes: '无特殊健康状况',
        
        // 接送信息
        pickupMethod: 'parent',
        
        // 注册信息
        registrationDate: '2024-02-05',
        tuitionStatus: 'pending',
        
        // 考勤相关
        cardNumber: 'NFC005',
        cardType: 'NFC',
        studentUrl: 'https://example.com/student/B005',
        balance: 0.00,
        enrollmentDate: '2024-02-05'
      }
    ]
    
    const createdStudents = []
    
    for (const studentData of testStudents) {
      try {
        console.log(`🔄 正在创建学生: ${studentData.student_name} (${studentData.student_id})`)
        console.log('学生数据:', JSON.stringify(studentData, null, 2))
        
        const student = await pb.collection('students').create(studentData)
        createdStudents.push(student)
        console.log(`✅ 创建学生成功: ${studentData.student_name} (${studentData.student_id})`)
      } catch (error: any) {
        console.error(`❌ 创建学生失败: ${studentData.student_name}`, error)
        console.error('错误详情:', error.message)
        console.error('错误代码:', error.status)
        console.error('完整错误:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `成功创建 ${createdStudents.length} 个测试学生`,
      students: createdStudents
    })
    
  } catch (error: any) {
    console.error('创建测试学生失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '创建测试学生失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}
