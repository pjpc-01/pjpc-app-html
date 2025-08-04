import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore'

// 模拟 Google Sheets 数据 - 你可以替换为真实的 Google Sheets API 调用
const mockPrimaryStudentsData = [
  {
    name: "张三",
    grade: "Standard 1",
    parentName: "张父",
    parentEmail: "zhang@example.com",
    parentPhone: "012-1234567",
    address: "123 Jalan ABC, Kuala Lumpur",
    dateOfBirth: "15 Mar 2017",
    gender: "Male",
    score: "85",
    food: "Full",
    drink: "Full",
    sections: "Morning",
    createdAt: new Date(),
    updatedAt: new Date(),
    importedFrom: "google-sheets"
  },
  {
    name: "李四",
    grade: "Standard 2", 
    parentName: "李父",
    parentEmail: "li@example.com",
    parentPhone: "012-2345678",
    address: "456 Jalan DEF, Petaling Jaya",
    dateOfBirth: "22 Jun 2016",
    gender: "Female",
    score: "92",
    food: "Half",
    drink: "Half",
    sections: "Afternoon",
    createdAt: new Date(),
    updatedAt: new Date(),
    importedFrom: "google-sheets"
  },
  {
    name: "王五",
    grade: "Standard 3",
    parentName: "王父", 
    parentEmail: "wang@example.com",
    parentPhone: "012-3456789",
    address: "789 Jalan GHI, Subang Jaya",
    dateOfBirth: "10 Sep 2015",
    gender: "Male",
    score: "78",
    food: "Full",
    drink: "None",
    sections: "Morning",
    createdAt: new Date(),
    updatedAt: new Date(),
    importedFrom: "google-sheets"
  }
]

const mockSecondaryStudentsData = [
  {
    name: "陈六",
    grade: "Form 1",
    parentName: "陈父",
    parentEmail: "chen@example.com", 
    parentPhone: "012-4567890",
    address: "321 Jalan JKL, Shah Alam",
    dateOfBirth: "05 Jan 2012",
    gender: "Female",
    score: "88",
    food: "Full",
    drink: "Full",
    sections: "Morning",
    createdAt: new Date(),
    updatedAt: new Date(),
    importedFrom: "google-sheets"
  },
  {
    name: "刘七",
    grade: "Form 2",
    parentName: "刘父",
    parentEmail: "liu@example.com",
    parentPhone: "012-5678901", 
    address: "654 Jalan MNO, Klang",
    dateOfBirth: "18 Apr 2011",
    gender: "Male",
    score: "95",
    food: "Half",
    drink: "Half",
    sections: "Afternoon",
    createdAt: new Date(),
    updatedAt: new Date(),
    importedFrom: "google-sheets"
  },
  {
    name: "赵八",
    grade: "Form 3",
    parentName: "赵父",
    parentEmail: "zhao@example.com",
    parentPhone: "012-6789012",
    address: "987 Jalan PQR, Putrajaya", 
    dateOfBirth: "30 Jul 2010",
    gender: "Female",
    score: "82",
    food: "Full",
    drink: "None",
    sections: "Morning",
    createdAt: new Date(),
    updatedAt: new Date(),
    importedFrom: "google-sheets"
  }
]

export async function POST(request: NextRequest) {
  try {
    const results = {
      primary_students: { success: false, count: 0, error: null },
      secondary_students: { success: false, count: 0, error: null }
    }

    // 清空现有数据
    try {
      const primaryCollection = collection(db, 'primary_students')
      const primarySnapshot = await getDocs(primaryCollection)
      for (const doc of primarySnapshot.docs) {
        await deleteDoc(doc.ref)
      }

      const secondaryCollection = collection(db, 'secondary_students')
      const secondarySnapshot = await getDocs(secondaryCollection)
      for (const doc of secondarySnapshot.docs) {
        await deleteDoc(doc.ref)
      }
    } catch (error) {
      console.warn('Error clearing existing data:', error)
    }

    // 添加小学学生数据
    try {
      const primaryCollection = collection(db, 'primary_students')
      for (const studentData of mockPrimaryStudentsData) {
        await addDoc(primaryCollection, studentData)
      }
      results.primary_students.success = true
      results.primary_students.count = mockPrimaryStudentsData.length
    } catch (error: any) {
      results.primary_students.error = error.message
      console.error('Error adding primary students:', error)
    }

    // 添加中学学生数据
    try {
      const secondaryCollection = collection(db, 'secondary_students')
      for (const studentData of mockSecondaryStudentsData) {
        await addDoc(secondaryCollection, studentData)
      }
      results.secondary_students.success = true
      results.secondary_students.count = mockSecondaryStudentsData.length
    } catch (error: any) {
      results.secondary_students.error = error.message
      console.error('Error adding secondary students:', error)
    }

    const totalStudents = results.primary_students.count + results.secondary_students.count

    return NextResponse.json({
      success: true,
      message: '学生数据填充完成',
      results: {
        ...results,
        totalStudents,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Error in populate student collections:', error)
    return NextResponse.json({
      success: false,
      message: '填充学生数据时出错',
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const results = {
      primary_students: { count: 0, students: [] },
      secondary_students: { count: 0, students: [] }
    }

    // 获取小学学生数据
    try {
      const primaryCollection = collection(db, 'primary_students')
      const primarySnapshot = await getDocs(primaryCollection)
      results.primary_students.count = primarySnapshot.size
      results.primary_students.students = primarySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error fetching primary students:', error)
    }

    // 获取中学学生数据
    try {
      const secondaryCollection = collection(db, 'secondary_students')
      const secondarySnapshot = await getDocs(secondaryCollection)
      results.secondary_students.count = secondarySnapshot.size
      results.secondary_students.students = secondarySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error fetching secondary students:', error)
    }

    const totalStudents = results.primary_students.count + results.secondary_students.count

    return NextResponse.json({
      success: true,
      message: '当前学生数据状态',
      results: {
        ...results,
        totalStudents,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Error getting student collections status:', error)
    return NextResponse.json({
      success: false,
      message: '获取学生数据状态时出错',
      error: error.message
    }, { status: 500 })
  }
} 