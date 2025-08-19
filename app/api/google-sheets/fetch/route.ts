import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL 是必需的' },
        { status: 400 }
      )
    }

    // 提取 Google Sheets ID
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) {
      return NextResponse.json(
        { error: '无效的 Google Sheets URL' },
        { status: 400 }
      )
    }

    const sheetId = match[1]
    
    // 尝试多种方式获取数据
    const urls = [
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv`
    ]
    
    let csv = null
    let lastError = null
    
    for (const csvUrl of urls) {
      try {
        const response = await fetch(csvUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        })
        
        if (response.ok) {
          csv = await response.text()
          break
        }
      } catch (err) {
        lastError = err
        console.log(`尝试 URL ${csvUrl} 失败:`, err)
      }
    }
    
    if (!csv) {
      return NextResponse.json(
        { 
          error: '无法访问 Google Sheets。请确保文件已设置为"任何人都可以查看"，或者使用 CSV 数据方式导入'
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: csv
    })

  } catch (error) {
    console.error('获取 Google Sheets 数据失败:', error)
    return NextResponse.json(
      { error: '获取数据失败' },
      { status: 500 }
    )
  }
}
