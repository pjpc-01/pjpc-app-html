import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    }

    // 测试用户集合访问
    try {
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      results.tests.users = {
        success: true,
        count: usersSnapshot.size,
        error: null
      }
    } catch (error: any) {
      results.tests.users = {
        success: false,
        count: 0,
        error: error.message
      }
    }

    // 测试小学学生集合访问
    try {
      const primaryStudentsRef = collection(db, 'primary_students')
      const primarySnapshot = await getDocs(primaryStudentsRef)
      results.tests.primary_students = {
        success: true,
        count: primarySnapshot.size,
        error: null
      }
    } catch (error: any) {
      results.tests.primary_students = {
        success: false,
        count: 0,
        error: error.message
      }
    }

    // 测试中学学生集合访问
    try {
      const secondaryStudentsRef = collection(db, 'secondary_students')
      const secondarySnapshot = await getDocs(secondaryStudentsRef)
      results.tests.secondary_students = {
        success: true,
        count: secondarySnapshot.size,
        error: null
      }
    } catch (error: any) {
      results.tests.secondary_students = {
        success: false,
        count: 0,
        error: error.message
      }
    }

    // 测试支付集合访问
    try {
      const paymentsRef = collection(db, 'payments')
      const paymentsSnapshot = await getDocs(paymentsRef)
      results.tests.payments = {
        success: true,
        count: paymentsSnapshot.size,
        error: null
      }
    } catch (error: any) {
      results.tests.payments = {
        success: false,
        count: 0,
        error: error.message
      }
    }

    // 测试特定文档访问
    try {
      const adminDoc = doc(db, 'users', 'admin-001')
      const adminSnapshot = await getDoc(adminDoc)
      results.tests.specific_document = {
        success: true,
        exists: adminSnapshot.exists(),
        error: null
      }
    } catch (error: any) {
      results.tests.specific_document = {
        success: false,
        exists: false,
        error: error.message
      }
    }

    return NextResponse.json({
      success: true,
      message: '权限测试完成',
      results
    })

  } catch (error: any) {
    console.error('权限测试失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '权限测试失败',
        details: error.message 
      },
      { status: 500 }
    )
  }
} 