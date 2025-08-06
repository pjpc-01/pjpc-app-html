import { NextRequest, NextResponse } from 'next/server'
import { FirestoreImport } from '@/lib/firestore-import'
import { StudentData } from '@/lib/google-sheets'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dataType = 'primary', testData } = body

    console.log(`Testing Firebase import for dataType: ${dataType}`)

    // Step 1: Test FirestoreImport initialization
    let firestoreImport: FirestoreImport
    try {
      firestoreImport = new FirestoreImport(dataType)
      console.log(`FirestoreImport initialized with collection: ${firestoreImport['COLLECTION_NAME']}`)
    } catch (error) {
      return NextResponse.json({
        step: 'initialization',
        error: 'Failed to initialize FirestoreImport',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Check Firebase configuration'
      }, { status: 500 })
    }

    // Step 2: Test Firebase connection
    try {
      const testStats = await firestoreImport.getImportStats()
      console.log('Firebase connection test successful:', testStats)
    } catch (error) {
      return NextResponse.json({
        step: 'connection',
        error: 'Failed to connect to Firebase',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Check Firebase configuration and network connection'
      }, { status: 500 })
    }

    // Step 3: Test with sample data
    const sampleStudents: StudentData[] = [
      {
        id: 'test-1',
        name: 'Test Student 1',
        grade: 'Grade 1',
        parentName: 'Test Parent 1',
        parentEmail: 'test1@example.com',
        parentPhone: '123-456-7890',
        address: 'Test Address 1',
        dateOfBirth: '2015-01-01',
        gender: 'Male',
        score: '85',
        food: 'Pizza',
        drink: 'Water'
      },
      {
        id: 'test-2',
        name: 'Test Student 2',
        grade: 'Grade 2',
        parentName: 'Test Parent 2',
        parentEmail: 'test2@example.com',
        parentPhone: '123-456-7891',
        address: 'Test Address 2',
        dateOfBirth: '2014-01-01',
        gender: 'Female',
        score: '90',
        food: 'Burger',
        drink: 'Juice'
      }
    ]

    try {
      console.log('Attempting to import test data...')
      const importResult = await firestoreImport.importStudents(sampleStudents, 'test-import')
      console.log('Import result:', importResult)

      return NextResponse.json({
        step: 'import_test',
        success: true,
        message: 'Firebase import test successful',
        importResult,
        collectionName: firestoreImport['COLLECTION_NAME'],
        suggestion: 'Firebase import functionality is working correctly'
      })

    } catch (error) {
      return NextResponse.json({
        step: 'import_test',
        error: 'Failed to import test data to Firebase',
        details: error instanceof Error ? error.message : 'Unknown error',
        collectionName: firestoreImport['COLLECTION_NAME'],
        suggestion: 'Check Firebase permissions and rules'
      }, { status: 500 })
    }

  } catch (error) {
    return NextResponse.json({
      step: 'general',
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Please check your configuration and try again'
    }, { status: 500 })
  }
} 