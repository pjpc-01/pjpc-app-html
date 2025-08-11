import { NextRequest, NextResponse } from 'next/server'
import { GoogleAuth } from 'google-auth-library'
import { google } from 'googleapis'
import { addStudent, updateStudent } from '@/lib/pocketbase-students'
import { StudentData } from '@/lib/google-sheets'

class GoogleSheetsAPI {
  private auth: any
  private sheets: any

  constructor(credentials: any) {
    this.auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })
    this.sheets = google.sheets({ version: 'v4', auth: this.auth })
  }

  // 年级映射函数：将英文年级转换为华文年级
  private mapGradeToChinese(grade: string): string {
    if (!grade) return '未知年级'
    
    const gradeStr = grade.toString().toLowerCase().trim()
    
    // 英文年级映射
    const englishGradeMap: Record<string, string> = {
      // Standard格式（Google Sheets中的标准格式）
      'standard 1': '一年级',
      'standard1': '一年级',
      'std 1': '一年级',
      'std1': '一年级',
      's1': '一年级',
      '1': '一年级',
      
      'standard 2': '二年级',
      'standard2': '二年级',
      'std 2': '二年级',
      'std2': '二年级',
      's2': '二年级',
      '2': '二年级',
      
      'standard 3': '三年级',
      'standard3': '三年级',
      'std 3': '三年级',
      'std3': '三年级',
      's3': '三年级',
      '3': '三年级',
      
      'standard 4': '四年级',
      'standard4': '四年级',
      'std 4': '四年级',
      'std4': '四年级',
      's4': '四年级',
      '4': '四年级',
      
      'standard 5': '五年级',
      'standard5': '五年级',
      'std 5': '五年级',
      'std5': '五年级',
      's5': '五年级',
      '5': '五年级',
      
      'standard 6': '六年级',
      'standard6': '六年级',
      'std 6': '六年级',
      'std6': '六年级',
      's6': '六年级',
      '6': '六年级',
      
      // Grade格式
      'grade 1': '一年级',
      'grade1': '一年级',
      '1st grade': '一年级',
      '1st': '一年级',
      'first grade': '一年级',
      'first': '一年级',
      
      'grade 2': '二年级',
      'grade2': '二年级',
      '2nd grade': '二年级',
      '2nd': '二年级',
      'second grade': '二年级',
      'second': '二年级',
      
      'grade 3': '三年级',
      'grade3': '三年级',
      '3rd grade': '三年级',
      '3rd': '三年级',
      'third grade': '三年级',
      'third': '三年级',
      
      'grade 4': '四年级',
      'grade4': '四年级',
      '4th grade': '四年级',
      '4th': '四年级',
      'fourth grade': '四年级',
      'fourth': '四年级',
      
      'grade 5': '五年级',
      'grade5': '五年级',
      '5th grade': '五年级',
      '5th': '五年级',
      'fifth grade': '五年级',
      'fifth': '五年级',
      
      'grade 6': '六年级',
      'grade6': '六年级',
      '6th grade': '六年级',
      '6th': '六年级',
      'sixth grade': '六年级',
      'sixth': '六年级',
      
      // 中学年级
      'form 1': '初一',
      'form1': '初一',
      'form 2': '初二',
      'form2': '初二',
      'form 3': '初三',
      'form3': '初三',
      
      'year 1': '初一',
      'year1': '初一',
      'year 2': '初二',
      'year2': '初二',
      'year 3': '初三',
      'year3': '初三',
      
      'secondary 1': '初一',
      'secondary1': '初一',
      'secondary 2': '初二',
      'secondary2': '初二',
      'secondary 3': '初三',
      'secondary3': '初三',
      
      // 华文年级（保持不变）
      '一年级': '一年级',
      '二年级': '二年级',
      '三年级': '三年级',
      '四年级': '四年级',
      '五年级': '五年级',
      '六年级': '六年级',
      '初一': '初一',
      '初二': '初二',
      '初三': '初三',
    }
    
    // 尝试精确匹配
    if (englishGradeMap[gradeStr]) {
      return englishGradeMap[gradeStr]
    }
    
    // 尝试部分匹配
    for (const [english, chinese] of Object.entries(englishGradeMap)) {
      if (gradeStr.includes(english) || english.includes(gradeStr)) {
        return chinese
      }
    }
    
    // 尝试数字匹配（如果输入只是数字）
    const numericMatch = gradeStr.match(/^(\d+)$/)
    if (numericMatch) {
      const num = parseInt(numericMatch[1])
      if (num >= 1 && num <= 6) {
        const chineseGrades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
        return chineseGrades[num - 1]
      }
    }
    
    // 如果无法匹配，返回原值
    console.log(`无法映射年级: "${grade}"，使用原值`)
    return grade
  }

  async getStudentData(spreadsheetId: string, range: string = 'A:Z', sheetName?: string): Promise<StudentData[]> {
    try {
      // If sheetName is provided, use it in the range
      const fullRange = sheetName ? `${sheetName}!${range}` : range
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: fullRange,
      })

      const rows = response.data.values || []
      if (rows.length === 0) {
        return []
      }

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
              case 'name':
              case '姓名':
                student.name = row[colIndex]
                break
              case 'standard':
              case 'grade':
              case '年级':
                // 使用年级映射函数转换年级
                student.grade = this.mapGradeToChinese(row[colIndex])
                break
              case 'parentphonenumberfather':
              case 'fatherphone':
              case '父亲电话':
                student.parentPhone = row[colIndex]
                break
              case 'parentphonenumbermother':
              case 'motherphone':
              case '母亲电话':
                student.parentPhone = student.parentPhone ? `${student.parentPhone}, ${row[colIndex]}` : row[colIndex]
                break
              case 'homeaddress':
              case 'address':
              case '地址':
                student.address = row[colIndex]
                break
              case 'parentname':
              case 'fathername':
              case '父亲姓名':
                student.parentName = row[colIndex]
                break
              case 'parentemail':
              case 'mothername':
              case '母亲姓名':
                student.parentEmail = row[colIndex]
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
              case '成绩':
                student.score = row[colIndex]
                break
              case 'gender':
              case '性别':
                student.gender = row[colIndex]
                break
              case 'food':
              case '食物':
                student.food = row[colIndex]
                break
              case 'drink':
              case '饮料':
                student.drink = row[colIndex]
                break
              default:
                student[cleanHeader] = row[colIndex]
            }
          }
        })

        // Set default values for required fields if missing
        if (!student.name) student.name = `Student ${index + 1}`
        if (!student.grade) student.grade = '未知年级'
        if (!student.parentName) student.parentName = '家长'
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
      const hasStudentName = headerLower.includes('studentname') || headerLower.includes('name') || headerLower.includes('姓名')
      const hasStandard = headerLower.includes('standard') || headerLower.includes('grade') || headerLower.includes('年级')
      const hasParentPhone = headerLower.includes('parentphonenumber') || headerLower.includes('phone') || headerLower.includes('电话')
      
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
          
          // Import to PocketBase
          const importResults = {
            success: 0,
            failed: 0,
            errors: [] as string[]
          }

          for (const studentData of data) {
            try {
              // Convert Google Sheets data to PocketBase format
              const pocketbaseStudent = {
                student_id: studentData.studentId || `STU${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
                student_name: studentData.name,
                standard: studentData.grade,
                father_phone: studentData.phone || studentData.parentPhone || '',
                mother_phone: studentData.phone || studentData.parentPhone || '',
                home_address: studentData.address || '',
                gender: studentData.gender || '',
                dob: studentData.dateOfBirth || '',
                Center: 'WX 01', // 默认中心
                level: (() => {
                  // 根据年级自动设置level
                  if (studentData.grade) {
                    const gradeMatch = studentData.grade.match(/Standard\s*(\d+)/i)
                    if (gradeMatch) {
                      const gradeNum = parseInt(gradeMatch[1])
                      return gradeNum <= 6 ? 'primary' : 'secondary'
                    }
                    // 尝试直接解析数字
                    const gradeNum = parseInt(studentData.grade)
                    if (!isNaN(gradeNum)) {
                      return gradeNum <= 6 ? 'primary' : 'secondary'
                    }
                  }
                  return 'primary' // 默认值
                })()
              }

              await addStudent(pocketbaseStudent)
              importResults.success++
            } catch (error) {
              importResults.failed++
              importResults.errors.push(`Failed to import ${studentData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
          }

          console.log('Import result:', importResults)
          
          return NextResponse.json({
            success: true,
            message: `Successfully imported ${importResults.success} students, ${importResults.failed} failed`,
            details: importResults
          })
        } catch (error) {
          console.error('Import error:', error)
          return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown import error',
            suggestion: 'Check PocketBase configuration and permissions'
          }, { status: 500 })
        }

      case 'stats':
        // Return basic stats for PocketBase
        return NextResponse.json({
          total: 0, // This would need to be implemented with PocketBase queries
          byGrade: {},
          message: 'Stats feature not yet implemented for PocketBase'
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