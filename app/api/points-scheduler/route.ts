import { NextRequest, NextResponse } from 'next/server'

// 定时积分数据监控调度器
export async function GET(request: NextRequest) {
  try {
    console.log('[PointsScheduler] 开始定时积分数据监控...')
    
    // 调用积分监控服务
    const monitorResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/points-monitor`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!monitorResponse.ok) {
      throw new Error(`监控服务调用失败: ${monitorResponse.status}`)
    }
    
    const monitorResult = await monitorResponse.json()
    
    // 如果有不一致的数据，记录到日志
    if (monitorResult.summary.inconsistencies_found > 0) {
      console.warn(`[PointsScheduler] 发现 ${monitorResult.summary.inconsistencies_found} 个积分数据不一致`)
      console.warn('[PointsScheduler] 不一致详情:', monitorResult.inconsistencies)
    }
    
    // 如果有修复失败，记录错误
    if (monitorResult.summary.fixes_failed > 0) {
      console.error(`[PointsScheduler] ${monitorResult.summary.fixes_failed} 个积分修复失败`)
      console.error('[PointsScheduler] 修复失败详情:', monitorResult.fixes.filter(f => !f.fixed))
    }
    
    return NextResponse.json({
      success: true,
      message: '定时监控完成',
      timestamp: new Date().toISOString(),
      monitor_result: monitorResult
    })
    
  } catch (error) {
    console.error('[PointsScheduler] 定时监控失败:', error)
    return NextResponse.json({
      success: false,
      error: '定时监控失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 手动触发定时监控
export async function POST(request: NextRequest) {
  return GET(request)
}

