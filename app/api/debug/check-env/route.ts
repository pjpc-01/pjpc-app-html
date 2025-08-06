import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const envCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    
    if (!envCredentials) {
      return NextResponse.json({
        error: 'GOOGLE_SERVICE_ACCOUNT_JSON not found in environment variables',
        suggestion: 'Please check your .env.local file'
      }, { status: 400 })
    }

    let creds
    try {
      creds = JSON.parse(envCredentials)
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid JSON format in GOOGLE_SERVICE_ACCOUNT_JSON',
        suggestion: 'Please check the JSON format in your .env.local file'
      }, { status: 400 })
    }

    // Check required fields
    const requiredFields = ['client_email', 'private_key', 'project_id']
    const missingFields = requiredFields.filter(field => !creds[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Missing required fields in service account JSON: ${missingFields.join(', ')}`,
        suggestion: 'Please check your service account JSON configuration'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      serviceAccountEmail: creds.client_email,
      projectId: creds.project_id,
      hasPrivateKey: !!creds.private_key,
      message: 'Environment configuration looks correct'
    })

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Please check your environment configuration'
    }, { status: 500 })
  }
} 