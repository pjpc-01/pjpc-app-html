import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }
    
    const text = await file.text()
    const { data } = Papa.parse(text, { header: true, skipEmptyLines: true })
    
    const origin = new URL(request.url).origin.replace('https://', 'http://')
    let importedCount = 0
    const errors = []
    
    // Correct Mapping based on your backup CSV
    const mapping: Record<string, string> = {
      "Student Name": "name",
      "ID": "student_id",
      "Standard": "grade",
      "D.O.B": "dob",
      "Parents Phone Number (Father)": "parentPhone",
      "Home Address": "address",
      "Gender": "gender",
      "Score": "status"
    }
    
    for (const row of data) {
      const record: Record<string, any> = {}
      for (const [csvCol, pbField] of Object.entries(mapping)) {
        if (row[csvCol]) record[pbField] = row[csvCol]
      }
      
      if (!record.name) continue
      
      const response = await fetch(`${origin}/api/pocketbase-proxy/api/collections/students/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      })
      
      if (response.ok) {
        importedCount++
      } else {
        errors.push(`Failed to import ${record.name}: ${response.statusText}`)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      importedCount, 
      errors: errors.slice(0, 10) 
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
