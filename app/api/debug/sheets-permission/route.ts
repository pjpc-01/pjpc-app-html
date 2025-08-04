import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { spreadsheetId, sheetName } = body

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Missing spreadsheetId' },
        { status: 400 }
      )
    }

    // Get credentials from environment
    const envCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    if (!envCredentials) {
      return NextResponse.json(
        { error: 'Environment credentials not configured' },
        { status: 400 }
      )
    }

    const creds = JSON.parse(envCredentials)
    console.log('Service Account Email:', creds.client_email)

    // Create auth
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: SCOPES,
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // Test 1: Try to get spreadsheet metadata
    try {
      const metadataResponse = await sheets.spreadsheets.get({
        spreadsheetId,
      })
      console.log('Spreadsheet metadata:', {
        title: metadataResponse.data.properties?.title,
        sheets: metadataResponse.data.sheets?.map(s => s.properties?.title)
      })
    } catch (error) {
      console.error('Error getting spreadsheet metadata:', error)
      return NextResponse.json({
        error: 'Cannot access spreadsheet metadata',
        details: error instanceof Error ? error.message : 'Unknown error',
        serviceAccountEmail: creds.client_email,
        suggestion: 'Make sure the spreadsheet is shared with the service account email'
      }, { status: 403 })
    }

    // Test 2: Try to get sheet data
    try {
      const range = sheetName ? `${sheetName}!A1:Z1` : 'A1:Z1'
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      })
      
      console.log('Sheet data test successful')
      return NextResponse.json({
        success: true,
        message: 'Permission test passed',
        serviceAccountEmail: creds.client_email,
        headers: response.data.values?.[0] || [],
        sheetName: sheetName || 'default'
      })
    } catch (error) {
      console.error('Error getting sheet data:', error)
      return NextResponse.json({
        error: 'Cannot access sheet data',
        details: error instanceof Error ? error.message : 'Unknown error',
        serviceAccountEmail: creds.client_email,
        sheetName: sheetName || 'default',
        suggestion: 'Check if the sheet name is correct and the sheet exists'
      }, { status: 403 })
    }

  } catch (error) {
    console.error('Debug API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 