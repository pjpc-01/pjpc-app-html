import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { FirestoreImport } from '@/lib/firestore-import'
import { StudentData } from '@/lib/google-sheets'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

class GoogleSheetsAPI {
  private auth: any
  private sheets: any

  constructor(credentials: any) {
    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    })
    this.sheets = google.sheets({ version: 'v4', auth: this.auth })
  }

  async getStudentData(spreadsheetId: string, range: string = 'A:Z', sheetName?: string): Promise<StudentData[]> {
    try {
      // If sheetName is provided, use it in the range
      const fullRange = sheetName ? `${sheetName}!${range}` : range
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: fullRange,
      })

      const rows = response.data.values
      if (!rows || rows.length === 0) {
        throw new Error('No data found in spreadsheet')
      }

      // Assume first row contains headers
      const headers = rows[0]
      const dataRows = rows.slice(1)

      return dataRows.map((row: any[], index: number) => {
        const student: any = { id: (index + 1).toString() }
        
        headers.forEach((header: string, colIndex: number) => {
          if (row[colIndex] !== undefined) {
            const cleanHeader = header.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
            
            // Map your column names to our expected format
            switch (cleanHeader) {
              case 'studentname':
                student.name = row[colIndex]
                break
              case 'standard':
                student.grade = row[colIndex]
                break
              case 'parentphonenumberfather':
                student.parentPhone = row[colIndex]
                break
              case 'parentphonenumbermother':
                student.parentPhone = student.parentPhone ? `${student.parentPhone}, ${row[colIndex]}` : row[colIndex]
                break
              case 'homeaddress':
                student.address = row[colIndex]
                break
              // Birth date field mappings
              case 'dob':
              case 'birthdate':
              case 'birth':
              case 'dateofbirth':
              case 'birthday':
              case '生日':
              case '出生日期':
              case '出生':
                student.dateOfBirth = row[colIndex]
                break
              case 'score':
                student.score = row[colIndex]
                break
              case 'gender':
                student.gender = row[colIndex]
                break
              case 'food':
                student.food = row[colIndex]
                break
              case 'drink':
                student.drink = row[colIndex]
                break
              default:
                student[cleanHeader] = row[colIndex]
            }
          }
        })

        // Set default values for required fields if missing
        if (!student.name) student.name = `Student ${index + 1}`
        if (!student.grade) student.grade = 'Unknown'
        if (!student.parentName) student.parentName = 'Parent'
        if (!student.parentEmail) student.parentEmail = 'parent@example.com'

        return student as StudentData
      })
    } catch (error) {
      console.error('Error fetching data from Google Sheets:', error)
      throw error
    }
  }

  async validateSpreadsheet(spreadsheetId: string, sheetName?: string): Promise<{ isValid: boolean; headers: string[] }> {
    try {
      // If sheetName is provided, use it in the range
      const fullRange = sheetName ? `${sheetName}!A1:Z1` : 'A1:Z1'
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: fullRange,
      })

      const headers = response.data.values?.[0] || []
      const headerLower = headers.map((h: string) => h.toLowerCase().replace(/\s+/g, ''))
      
      // Check for required fields in your format
      const hasStudentName = headerLower.includes('studentname') || headerLower.includes('name')
      const hasStandard = headerLower.includes('standard') || headerLower.includes('grade')
      const hasParentPhone = headerLower.includes('parentphonenumber') || headerLower.includes('phone')
      
      const isValid = hasStudentName && hasStandard

      return { isValid, headers }
    } catch (error) {
      console.error('Error validating spreadsheet:', error)
      return { isValid: false, headers: [] }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { spreadsheetId, spreadsheetRange, credentials, dataType = 'primary', action, sheetName } = body

    // For stats action, we don't need spreadsheetId and credentials
    if (action !== 'stats' && (!spreadsheetId || !credentials)) {
      return NextResponse.json(
        { error: 'Missing required fields: spreadsheetId and credentials' },
        { status: 400 }
      )
    }

    let creds
    try {
      if (credentials === 'env') {
        // Use environment variable for credentials
        const envCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
        if (!envCredentials) {
          return NextResponse.json(
            { error: 'Environment credentials not configured. Please set GOOGLE_SERVICE_ACCOUNT_JSON.' },
            { status: 400 }
          )
        }
        creds = JSON.parse(envCredentials)
      } else {
        creds = JSON.parse(credentials)
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON credentials format. Please check your service account key.' },
        { status: 400 }
      )
    }
    const sheetsAPI = new GoogleSheetsAPI(creds)
    const firestoreImport = new FirestoreImport(dataType as 'primary' | 'secondary')

    switch (action) {
      case 'validate':
        const validation = await sheetsAPI.validateSpreadsheet(spreadsheetId, sheetName)
        return NextResponse.json(validation)

      case 'preview':
        const previewData = await sheetsAPI.getStudentData(spreadsheetId, spreadsheetRange, sheetName)
        return NextResponse.json({ data: previewData.slice(0, 5) })

      case 'import':
        try {
          console.log(`Starting import process for dataType: ${dataType}`)
          console.log(`Spreadsheet ID: ${spreadsheetId}, Sheet Name: ${sheetName || 'default'}`)
          
          const data = await sheetsAPI.getStudentData(spreadsheetId, spreadsheetRange, sheetName)
          console.log(`Retrieved ${data.length} students from Google Sheets`)
          
          if (data.length === 0) {
            return NextResponse.json({
              error: 'No data found to import',
              suggestion: 'Please check your spreadsheet data and sheet name'
            }, { status: 400 })
          }
          
          console.log('Sample data:', data.slice(0, 2))
          
          const result = await firestoreImport.importStudents(data, 'google-sheets')
          console.log('Import result:', result)
          
          return NextResponse.json(result)
        } catch (error) {
          console.error('Import error:', error)
          return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown import error',
            suggestion: 'Check Firebase configuration and permissions'
          }, { status: 500 })
        }

      case 'stats':
        const stats = await firestoreImport.getImportStats()
        return NextResponse.json({
          total: stats.total || 0,
          byGrade: stats.byGrade || {}
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: validate, preview, import, or stats' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 