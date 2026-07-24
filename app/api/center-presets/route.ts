import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'center-presets.json')

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function writeData(data: Record<string, any>) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export async function GET() {
  return NextResponse.json({ success: true, data: readData() })
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const current = readData()
    const centerId = body.center_id
    if (!centerId) return NextResponse.json({ success: false, error: 'center_id required' }, { status: 400 })
    
    current[centerId] = {
      invoice_settings_id: body.invoice_settings_id || current[centerId]?.invoice_settings_id || '',
      receipt_settings_id: body.receipt_settings_id || current[centerId]?.receipt_settings_id || '',
      payslip_settings_id: body.payslip_settings_id || current[centerId]?.payslip_settings_id || '',
    }
    writeData(current)
    return NextResponse.json({ success: true, data: current })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
