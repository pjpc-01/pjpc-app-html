import { NextRequest, NextResponse } from 'next/server'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST() {
  try {
    const secondaryStudentsData = [
      {
        name: "陈六",
        grade: "Form 1",
        parentName: "陈父",
        parentEmail: "chen@example.com", 
        phone: "012-4567890",
        address: "321 Jalan JKL, Shah Alam",
        dateOfBirth: "05 Jan 2012",
        status: "active",
        enrollmentDate: "2023-09-01",
        createdAt: new Date(),
        updatedAt: new Date(),
        importedFrom: "test-data"
      },
      {
        name: "刘七",
        grade: "Form 2",
        parentName: "刘父",
        parentEmail: "liu@example.com",
        phone: "012-5678901", 
        address: "654 Jalan MNO, Klang",
        dateOfBirth: "18 Apr 2011",
        status: "active",
        enrollmentDate: "2022-09-01",
        createdAt: new Date(),
        updatedAt: new Date(),
        importedFrom: "test-data"
      },
      {
        name: "赵八",
        grade: "Form 3",
        parentName: "赵父",
        parentEmail: "zhao@example.com",
        phone: "012-6789012",
        address: "987 Jalan PQR, Putrajaya", 
        dateOfBirth: "30 Jul 2010",
        status: "active",
        enrollmentDate: "2021-09-01",
        createdAt: new Date(),
        updatedAt: new Date(),
        importedFrom: "test-data"
      },
      {
        name: "孙九",
        grade: "Form 1",
        parentName: "孙父",
        parentEmail: "sun@example.com",
        phone: "012-7890123",
        address: "123 Jalan STU, Petaling Jaya", 
        dateOfBirth: "12 Mar 2012",
        status: "active",
        enrollmentDate: "2023-09-01",
        createdAt: new Date(),
        updatedAt: new Date(),
        importedFrom: "test-data"
      },
      {
        name: "周十",
        grade: "Form 2",
        parentName: "周父",
        parentEmail: "zhou@example.com",
        phone: "012-8901234",
        address: "456 Jalan VWX, Subang Jaya", 
        dateOfBirth: "25 Jun 2011",
        status: "active",
        enrollmentDate: "2022-09-01",
        createdAt: new Date(),
        updatedAt: new Date(),
        importedFrom: "test-data"
      }
    ]

    const secondaryCollection = collection(db, 'secondary-students')
    const results = []

    for (const studentData of secondaryStudentsData) {
      try {
        const docRef = await addDoc(secondaryCollection, studentData)
        results.push({
          success: true,
          id: docRef.id,
          name: studentData.name
        })
      } catch (error: any) {
        results.push({
          success: false,
          name: studentData.name,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `中学测试数据添加完成：成功 ${successCount} 个，失败 ${errorCount} 个`,
      results
    })

  } catch (error: any) {
    console.error('Error adding secondary test data:', error)
    return NextResponse.json({
      success: false,
      message: '添加中学测试数据失败',
      error: error.message
    }, { status: 500 })
  }
}
