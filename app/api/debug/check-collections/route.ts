import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const collections = ['students', 'secondary-students']
    const results: Record<string, any> = {}

    for (const collectionName of collections) {
      try {
        console.log(`Checking collection: ${collectionName}`)
        const querySnapshot = await getDocs(collection(db, collectionName))
        const docs = querySnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name,
            grade: data.grade,
            parentName: data.parentName,
            parentEmail: data.parentEmail,
            // Add other fields as needed
          }
        })
        
        results[collectionName] = {
          count: docs.length,
          documents: docs
        }
        
        console.log(`Collection ${collectionName}: ${docs.length} documents`)
      } catch (error) {
        console.error(`Error checking collection ${collectionName}:`, error)
        results[collectionName] = {
          error: error instanceof Error ? error.message : 'Unknown error',
          count: 0,
          documents: []
        }
      }
    }

    return NextResponse.json({
      success: true,
      collections: results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in debug API:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { dataType = 'primary' } = await request.json()
    const collectionName = dataType === 'secondary' ? 'secondary-students' : 'students'

    console.log(`Checking collection for birth date data: ${collectionName}`)
    const querySnapshot = await getDocs(collection(db, collectionName))
    
    const docs = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name,
        grade: data.grade,
        dateOfBirth: data.dateOfBirth,
        // Add other fields as needed
      }
    })
    
    // Get sample data (first 5 documents)
    const sample = docs.slice(0, 5)
    
    const results = {
      [collectionName]: {
        count: docs.length,
        sample: sample
      }
    }

    console.log(`Collection ${collectionName}: ${docs.length} documents, sample:`, sample)

    return NextResponse.json({
      success: true,
      collections: results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in debug API POST:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 