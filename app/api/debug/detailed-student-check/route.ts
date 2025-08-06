import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'

export async function GET() {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      collections: {},
      summary: {}
    }

    // 检查所有可能的学生集合
    const studentCollections = [
      'students',
      'primary_students', 
      'secondary_students',
      'primary-students',
      'secondary-students',
      'elementary_students',
      'middle_students',
      'high_students'
    ]

    let totalStudents = 0
    const allStudents: any[] = []

    for (const collectionName of studentCollections) {
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
          students: students
        }

        totalStudents += students.length
        allStudents.push(...students.map(s => ({ ...s, collection: collectionName })))

      } catch (error: any) {
        results.collections[collectionName] = {
          exists: false,
          count: 0,
          error: error.message
        }
      }
    }

    // 总结
    results.summary = {
      totalStudents,
      collectionsFound: Object.keys(results.collections).filter(key => results.collections[key].exists),
      allStudents: allStudents.slice(0, 10) // 只显示前10个学生作为示例
    }

    return NextResponse.json({
      success: true,
      message: '详细学生数据检查完成',
      results
    })

  } catch (error: any) {
    console.error('Error in detailed student check:', error)
    return NextResponse.json({
      success: false,
      message: '检查学生数据时出错',
      error: error.message
    }, { status: 500 })
  }
} 