import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'

// POST — 从 DataStudio 批量导入成绩
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const center = body.center || ''

    const cmd = `/home/pjpc/.hermes/hermes-agent/venv/bin/python3 /home/pjpc/pjpc-app-prod/scripts/datastudio_import.py "${center}"`
    const output = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 600000, // 10 min
      env: { ...process.env, HOME: '/home/pjpc' },
    })

    // Parse JSON result from script's stdout
    const lines = output.trim().split('\n')
    const jsonLine = lines[lines.length - 1]

    try {
      const result = JSON.parse(jsonLine)
      return NextResponse.json(result)
    } catch {
      return NextResponse.json({ success: false, error: '解析导入结果失败', raw: output.slice(-500) }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ DataStudio 导入失败:', error)
    return NextResponse.json(
      { error: '导入失败', details: error.message || '未知错误' },
      { status: 500 }
    )
  }
}
