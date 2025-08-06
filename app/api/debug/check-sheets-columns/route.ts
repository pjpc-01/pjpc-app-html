import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

export async function POST(request: NextRequest) {
  try {
    const { spreadsheetId, credentials, sheetName } = await request.json()

    if (!spreadsheetId || !credentials) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: spreadsheetId and credentials'
      }, { status: 400 })
    }

    // Create Google Sheets API instance
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    })
    const sheets = google.sheets({ version: 'v4', auth })

    // Get headers from the specified sheet
    const fullRange = sheetName ? `${sheetName}!A1:Z1` : 'A1:Z1'
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: fullRange,
    })

    const headers = response.data.values?.[0] || []
    
    // Get a few sample rows to see the data
    const sampleRange = sheetName ? `${sheetName}!A1:Z5` : 'A1:Z5'
    const sampleResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sampleRange,
    })

    const sampleRows = sampleResponse.data.values || []

    // Analyze headers for potential birth date fields
    const potentialBirthDateFields = headers.map((header: string, index: number) => {
      const cleanHeader = header.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
      const isBirthDateField = cleanHeader.includes('birth') || 
                              cleanHeader.includes('dob') || 
                              cleanHeader.includes('date') ||
                              cleanHeader.includes('生日') ||
                              cleanHeader.includes('出生')
      
      return {
        originalHeader: header,
        cleanHeader: cleanHeader,
        isBirthDateField: isBirthDateField,
        columnIndex: index,
        sampleValue: sampleRows[1]?.[index] || 'N/A'
      }
    })

    return NextResponse.json({
      success: true,
      headers: headers,
      potentialBirthDateFields: potentialBirthDateFields.filter(f => f.isBirthDateField),
      allFields: potentialBirthDateFields,
      sampleRows: sampleRows.slice(1, 4), // First 3 data rows
      sheetName: sheetName || 'default'
    })

  } catch (error) {
    console.error('Error checking sheets columns:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 