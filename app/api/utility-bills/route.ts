import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import path from 'path'

export async function GET() {
  try {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'utility_bills_reader.py')
    const result = execSync(`python3 "${scriptPath}"`, {
      timeout: 10000,
      encoding: 'utf-8',
    })

    const data = JSON.parse(result)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
  }
}
