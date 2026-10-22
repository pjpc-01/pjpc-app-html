import { NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { execSync } from 'child_process'
import path from 'path'

export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'office_admin'])
  if ('error' in gate) return gate.error
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
