import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function GET() {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      collections: {}
    }

    // 检查所有可能的中学生集合
    const secondaryCollections = [
      'secondary-students',
      'secondary_students', 
      'secondarystudents',
      'middle_students',
      'middle-students'
    ]

    for (const collectionName of secondaryCollections) {
      try {
        const collectionRef = collection(db, collectionName)
        const snapshot = await getDocs(collectionRef)
        
        const students = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        results.collections[collectionName] = {
          exists: true,
          count: students.length,
          students: students.slice(0, 5) // 只显示前5个学生
        }

      } catch (error: any) {
        results.collections[collectionName] = {
          exists: false,
          count: 0,
          error: error.message
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '中学数据检查完成',
      results
    })

  } catch (error: any) {
    console.error('Error checking secondary data:', error)
    return NextResponse.json({
      success: false,
      message: '检查中学数据时出错',
      error: error.message
    }, { status: 500 })
  }
}
