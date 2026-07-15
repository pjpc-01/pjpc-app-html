import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// 获取薪资参数设置
export async function GET() {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()

    const settings = await pb.collection('salary_settings').getList(1, 1, {
      sort: '-created'
    })

    if (settings.items.length > 0) {
      const s = settings.items[0]
      return NextResponse.json({
        success: true,
        data: {
          id: s.id,
          epf_rate: s.epf_rate ?? 0.11,
          socso_rate: s.socso_rate ?? 0.005,
          eis_rate: s.eis_rate ?? 0.002,
          tax_rate: s.tax_rate ?? 0,
          epf_employer_rate: s.epf_employer_rate ?? 0.13
        }
      })
    }

    // 默认值
    return NextResponse.json({
      success: true,
      data: {
        epf_rate: 0.11,
        socso_rate: 0.005,
        eis_rate: 0.002,
        tax_rate: 0,
        epf_employer_rate: 0.13
      }
    })
  } catch (error) {
    console.error('获取薪资参数设置失败:', error)
    return NextResponse.json(
      { success: false, error: '获取薪资参数设置失败' },
      { status: 500 }
    )
  }
}

// 保存薪资参数设置
export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()

    const data = await request.json()
    const { epf_rate, socso_rate, eis_rate, tax_rate, epf_employer_rate } = data

    // 检查是否已存在记录
    const existing = await pb.collection('salary_settings').getList(1, 1, {
      sort: '-created'
    })

    const settingsData = {
      epf_rate: epf_rate ?? 0.11,
      socso_rate: socso_rate ?? 0.005,
      eis_rate: eis_rate ?? 0.002,
      tax_rate: tax_rate ?? 0,
      epf_employer_rate: epf_employer_rate ?? 0.13
    }

    let result
    if (existing.items.length > 0) {
      result = await pb.collection('salary_settings').update(existing.items[0].id, settingsData)
    } else {
      result = await pb.collection('salary_settings').create(settingsData)
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: '薪资参数设置已保存'
    })
  } catch (error) {
    console.error('保存薪资参数设置失败:', error)
    return NextResponse.json(
      { success: false, error: '保存薪资参数设置失败' },
      { status: 500 }
    )
  }
}
