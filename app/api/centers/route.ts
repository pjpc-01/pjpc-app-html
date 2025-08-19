import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://192.168.0.59:8090')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const centerId = searchParams.get('id')

    if (centerId) {
      // 获取特定中心信息
      try {
        const record = await pb.collection('centers').getOne(centerId)
        return NextResponse.json({
          success: true,
          data: record
        })
      } catch (error) {
        return NextResponse.json(
          { error: '中心不存在' },
          { status: 404 }
        )
      }
    } else {
      // 获取所有中心列表
      const records = await pb.collection('centers').getList(1, 100, {
        sort: 'name'
      })

      return NextResponse.json({
        success: true,
        data: records.items
      })
    }

  } catch (error) {
    console.error('获取中心信息失败:', error)
    return NextResponse.json(
      { error: '获取中心信息失败' },
      { status: 500 }
    )
  }
}
