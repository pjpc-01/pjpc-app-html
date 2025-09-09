import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// 动态导出配置
export const dynamic = 'force-dynamic'

// 获取允许的WiFi网络列表
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    
    // 管理员认证
    try {
      await authenticateAdmin()
      console.log('✅ 管理员认证成功')
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError)
      return NextResponse.json(
        { 
          error: 'PocketBase认证失败', 
          details: '无法以管理员身份登录'
        },
        { status: 500 }
      )
    }

    // 获取WiFi网络配置
    const records = await pb.collection('wifi_networks').getList(1, 100, {
      sort: '-created'
    })

    return NextResponse.json({
      success: true,
      data: records.items,
      totalItems: records.totalItems
    })

  } catch (error: any) {
    console.error('获取WiFi网络配置失败:', error)
    return NextResponse.json(
      { 
        error: '获取WiFi网络配置失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}

// 创建或更新WiFi网络配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      networkName,
      description,
      centerId,
      isActive = true
    } = body

    // 验证必需字段
    if (!networkName) {
      return NextResponse.json(
        { error: '缺少必需字段: networkName' },
        { status: 400 }
      )
    }

    const pb = await getPocketBase()
    
    // 管理员认证
    try {
      await authenticateAdmin()
      console.log('✅ 管理员认证成功')
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError)
      return NextResponse.json(
        { 
          error: 'PocketBase认证失败', 
          details: '无法以管理员身份登录'
        },
        { status: 500 }
      )
    }

    // 检查是否已存在相同的网络名称
    const existingRecords = await pb.collection('wifi_networks').getList(1, 1, {
      filter: `network_name = "${networkName}"`
    })

    let record
    if (existingRecords.items.length > 0) {
      // 更新现有记录
      record = await pb.collection('wifi_networks').update(existingRecords.items[0].id, {
        network_name: networkName,
        description: description || '',
        center_id: centerId || '',
        is_active: isActive,
        updated: new Date().toISOString()
      })
      console.log('✅ WiFi网络配置已更新:', record)
    } else {
      // 创建新记录
      record = await pb.collection('wifi_networks').create({
        network_name: networkName,
        description: description || '',
        center_id: centerId || '',
        is_active: isActive,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      })
      console.log('✅ WiFi网络配置已创建:', record)
    }

    return NextResponse.json({
      success: true,
      data: record,
      message: existingRecords.items.length > 0 ? 'WiFi网络配置已更新' : 'WiFi网络配置已创建'
    })

  } catch (error: any) {
    console.error('WiFi网络配置操作失败:', error)
    return NextResponse.json(
      { 
        error: 'WiFi网络配置操作失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}

// 删除WiFi网络配置
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: '缺少必需参数: id' },
        { status: 400 }
      )
    }

    const pb = await getPocketBase()
    
    // 管理员认证
    try {
      await authenticateAdmin()
      console.log('✅ 管理员认证成功')
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError)
      return NextResponse.json(
        { 
          error: 'PocketBase认证失败', 
          details: '无法以管理员身份登录'
        },
        { status: 500 }
      )
    }

    // 删除记录
    await pb.collection('wifi_networks').delete(id)
    console.log('✅ WiFi网络配置已删除:', id)

    return NextResponse.json({
      success: true,
      message: 'WiFi网络配置已删除'
    })

  } catch (error: any) {
    console.error('删除WiFi网络配置失败:', error)
    return NextResponse.json(
      { 
        error: '删除WiFi网络配置失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}
