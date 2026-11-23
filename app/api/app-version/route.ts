import { NextResponse } from 'next/server'

/**
 * App 版本握手接口（公开，不需要登录）。
 *
 * 手机壳启动时先打这里：
 *  - appVersion / minNativeVersion：壳太旧就提示「请更新 App」并给 GitHub 下载页
 *  - webVersion：网页这边部署的版本（build 时写入），方便排查「他看到的为什么是旧的」
 *  - maintenance：维护窗口（默认每天 01:00–06:15 WSL 关机时段）
 *
 * 为什么要有：壳里 server.url 加载线上站点，网页大改之后旧壳可能不兼容；
 * 有这个接口就能「先拦一下再提示升级」，不至于白屏。
 */

// 每次部署网页都改这里（或由 build 脚本写 env）
const WEB_VERSION = process.env.NEXT_PUBLIC_WEB_VERSION || '2026.11.23'

// 低于这个原生版本就强制更新（原生插件/接口不兼容时才往上加）
const MIN_NATIVE_VERSION = 1

// 每天维护窗口（+08）
const MAINTENANCE = { enabled: true, from: '01:00', to: '06:15' }

function inMaintenance(now = new Date()): boolean {
  if (!MAINTENANCE.enabled) return false
  const [fh, fm] = MAINTENANCE.from.split(':').map(Number)
  const [th, tm] = MAINTENANCE.to.split(':').map(Number)
  const mins = now.getHours() * 60 + now.getMinutes()
  const start = fh * 60 + fm
  const end = th * 60 + tm
  // 跨零点也成立
  return start <= end ? mins >= start && mins < end : mins >= start || mins < end
}

export async function GET() {
  const maintenance = inMaintenance()
  return NextResponse.json(
    {
      success: true,
      webVersion: WEB_VERSION,
      minNativeVersion: MIN_NATIVE_VERSION,
      maintenance,
      maintenanceWindow: MAINTENANCE.enabled ? `${MAINTENANCE.from}-${MAINTENANCE.to}` : null,
      message: maintenance
        ? `系统维护中（每天 ${MAINTENANCE.from}-${MAINTENANCE.to}），早上 ${MAINTENANCE.to} 之后恢复。`
        : '',
      apkUrl: 'https://github.com/pjpc-01/pjpc-app-html/releases/latest',
      serverTime: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
