import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, doc, setDoc } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    // 创建示例用户数据
    const usersData = [
      {
        uid: 'admin-001',
        email: 'admin@pjpc.edu',
        name: '系统管理员',
        role: 'admin',
        status: 'approved',
        createdAt: new Date(),
        lastLogin: new Date()
      },
      {
        uid: 'teacher-001',
        email: 'teacher1@pjpc.edu',
        name: '张老师',
        role: 'teacher',
        status: 'approved',
        createdAt: new Date(),
        lastLogin: new Date()
      },
      {
        uid: 'teacher-002',
        email: 'teacher2@pjpc.edu',
        name: '李老师',
        role: 'teacher',
        status: 'approved',
        createdAt: new Date(),
        lastLogin: new Date()
      },
      {
        uid: 'parent-001',
        email: 'parent1@example.com',
        name: '王家长',
        role: 'parent',
        status: 'approved',
        createdAt: new Date(),
        lastLogin: new Date()
      },
      {
        uid: 'user-pending',
        email: 'pending@example.com',
        name: '待审核用户',
        role: 'parent',
        status: 'pending',
        createdAt: new Date()
      }
    ]

    // 创建示例小学学生数据
    const primaryStudentsData = [
      {
        name: '小明',
        grade: '一年级',
        class: '1A',
        parentId: 'parent-001',
        status: 'active',
        createdAt: new Date()
      },
      {
        name: '小红',
        grade: '二年级',
        class: '2B',
        parentId: 'parent-001',
        status: 'active',
        createdAt: new Date()
      }
    ]

    // 创建示例中学学生数据
    const secondaryStudentsData = [
      {
        name: '小华',
        grade: '初一',
        class: '7A',
        parentId: 'parent-001',
        status: 'active',
        createdAt: new Date()
      },
      {
        name: '小强',
        grade: '初二',
        class: '8B',
        parentId: 'parent-001',
        status: 'active',
        createdAt: new Date()
      }
    ]

    // 创建示例支付数据
    const paymentsData = [
      {
        amount: 5000,
        type: 'payment',
        status: 'completed',
        description: '学费缴纳',
        studentName: '小明',
        date: new Date(),
        paymentMethod: '银行转账',
        parentId: 'parent-001'
      },
      {
        amount: 3000,
        type: 'payment',
        status: 'pending',
        description: '教材费',
        studentName: '小红',
        date: new Date(),
        paymentMethod: '在线支付',
        parentId: 'parent-001'
      },
      {
        amount: 8000,
        type: 'payment',
        status: 'completed',
        description: '学费缴纳',
        studentName: '小华',
        date: new Date(),
        paymentMethod: '银行转账',
        parentId: 'parent-001'
      }
    ]

    // 添加用户数据
    const usersRef = collection(db, 'users')
    for (const userData of usersData) {
      await setDoc(doc(usersRef, userData.uid), userData)
    }

    // 添加小学学生数据
    const primaryStudentsRef = collection(db, 'primary_students')
    for (const studentData of primaryStudentsData) {
      await addDoc(primaryStudentsRef, studentData)
    }

    // 添加中学学生数据
    const secondaryStudentsRef = collection(db, 'secondary_students')
    for (const studentData of secondaryStudentsData) {
      await addDoc(secondaryStudentsRef, studentData)
    }

    // 添加支付数据
    const paymentsRef = collection(db, 'payments')
    for (const paymentData of paymentsData) {
      await addDoc(paymentsRef, paymentData)
    }

    return NextResponse.json({
      success: true,
      message: '示例数据创建成功',
      data: {
        users: usersData.length,
        primaryStudents: primaryStudentsData.length,
        secondaryStudents: secondaryStudentsData.length,
        payments: paymentsData.length
      }
    })

  } catch (error) {
    console.error('创建示例数据时出错:', error)
    return NextResponse.json(
      { success: false, error: '创建示例数据失败' },
      { status: 500 }
    )
  }
} 