import { google } from 'googleapis'

// Google Sheets API configuration
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

export interface StudentData {
  id: string
  name: string
  studentId?: string
  grade: string
  parentName: string
  parentEmail: string
  phone?: string
  address?: string
  enrollmentDate?: string
  status?: string
  parentPhone?: string
  dateOfBirth?: string
  score?: string
  gender?: string
  food?: string
  drink?: string
  [key: string]: any // Allow additional fields
}

export class GoogleSheetsAPI {
  private auth: any
  private sheets: any

  constructor(credentials: any) {
    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    })
    this.sheets = google.sheets({ version: 'v4', auth: this.auth })
  }

  async getStudentData(spreadsheetId: string, range: string = 'A:Z'): Promise<StudentData[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
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
            student[header.toLowerCase().replace(/\s+/g, '')] = row[colIndex]
          }
        })

        return student as StudentData
      })
    } catch (error) {
      console.error('Error fetching data from Google Sheets:', error)
      throw error
    }
  }

  // Helper method to validate spreadsheet structure
  async validateSpreadsheet(spreadsheetId: string): Promise<{ isValid: boolean; headers: string[] }> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'A1:Z1',
      })

      const headers = response.data.values?.[0] || []
      const requiredFields = ['name', 'grade', 'parentname', 'parentemail']
      const headerLower = headers.map((h: string) => h.toLowerCase().replace(/\s+/g, ''))
      
      const isValid = requiredFields.every(field => 
        headerLower.includes(field)
      )

      return { isValid, headers }
    } catch (error) {
      console.error('Error validating spreadsheet:', error)
      return { isValid: false, headers: [] }
    }
  }
}

// Utility function to create credentials from environment variables
export function createCredentials() {
  return {
    type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE || 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
    token_uri: process.env.GOOGLE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
  }
} 