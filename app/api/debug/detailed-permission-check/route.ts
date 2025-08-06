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

    // Step 1: Check environment variables
    const envCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    if (!envCredentials) {
      return NextResponse.json({
        step: 'environment_check',
        error: 'GOOGLE_SERVICE_ACCOUNT_JSON not found in environment variables',
        suggestion: 'Please check your .env.local file'
      }, { status: 400 })
    }

    let creds
    try {
      creds = JSON.parse(envCredentials)
    } catch (error) {
      return NextResponse.json({
        step: 'json_parsing',
        error: 'Invalid JSON format in GOOGLE_SERVICE_ACCOUNT_JSON',
        suggestion: 'Please check the JSON format in your .env.local file'
      }, { status: 400 })
    }

    // Step 2: Check required fields
    const requiredFields = ['client_email', 'private_key', 'project_id']
    const missingFields = requiredFields.filter(field => !creds[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        step: 'service_account_check',
        error: `Missing required fields in service account JSON: ${missingFields.join(', ')}`,
        suggestion: 'Please check your service account JSON configuration'
      }, { status: 400 })
    }

    // Step 3: Test authentication
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: SCOPES,
      })

      // Test if we can get an access token
      const client = await auth.getClient()
      const accessToken = await client.getAccessToken()
      
      if (!accessToken.token) {
        return NextResponse.json({
          step: 'authentication',
          error: 'Failed to get access token',
          serviceAccountEmail: creds.client_email,
          suggestion: 'Check if the service account is properly configured and has the necessary permissions'
        }, { status: 401 })
      }

    } catch (error) {
      return NextResponse.json({
        step: 'authentication',
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        serviceAccountEmail: creds.client_email,
        suggestion: 'Check if the service account is properly configured'
      }, { status: 401 })
    }

    // Step 4: Test Google Sheets API access
    try {
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

        return NextResponse.json({
          step: 'metadata_access',
          success: true,
          message: 'Successfully accessed spreadsheet metadata',
          serviceAccountEmail: creds.client_email,
          spreadsheetTitle: metadataResponse.data.properties?.title,
          availableSheets: metadataResponse.data.sheets?.map(s => s.properties?.title) || [],
          suggestion: 'The service account has access to the spreadsheet. Check if the sheet name is correct.'
        })

      } catch (metadataError) {
        return NextResponse.json({
          step: 'metadata_access',
          error: 'Cannot access spreadsheet metadata',
          details: metadataError instanceof Error ? metadataError.message : 'Unknown error',
          serviceAccountEmail: creds.client_email,
          suggestion: 'Make sure the spreadsheet is shared with the service account email'
        }, { status: 403 })
      }

    } catch (sheetsError) {
      return NextResponse.json({
        step: 'sheets_api',
        error: 'Failed to initialize Google Sheets API',
        details: sheetsError instanceof Error ? sheetsError.message : 'Unknown error',
        serviceAccountEmail: creds.client_email,
        suggestion: 'Check if Google Sheets API is enabled in your Google Cloud project'
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