import { NextResponse } from 'next/server'

/**
 * App 版本握手接口（公开，不需要登录）。
 *
 * App 每次启动（以及从后台回来）都会打这里，拿到三件事：
 *  1) 有没有新版本 → latestVersionCode / latestVersionName / apkUrl，App 弹横幅让用户更新
 *  2) 是不是低于底线版本 → minSupportedVersionCode，低于就整屏拦住，不让继续用
 *  3) 现在是不是维护窗口 → maintenance（每天 01:00–06:15 WSL 关机时段）
 *
 * 为什么要「底线版本」：原生插件（NFC / 相机 / 通知）一变，旧壳调不动新网页里的桥，
 * 与其让用户白屏，不如明确告诉他先升级。
 *
 * 版本号口径：以 Android 的 versionCode（整数）为准，别用 "0.2.0" 字符串比大小。
 */

// 网页这边的版本（build 时写入，方便排查「他看到的为什么是旧的」）
const WEB_VERSION = process.env.NEXT_PUBLIC_WEB_VERSION || '2026.11.26'

// 最新原生版本（每次出 APK 都要改这两个）
const LATEST_VERSION_CODE = 3
const LATEST_VERSION_NAME = '0.2.1'

// 低于这个 versionCode 就强制更新（整屏拦住）
const MIN_SUPPORTED_VERSION_CODE = 1

// 强制更新开关：临时出问题时可以关掉，只提示不拦
const ENFORCE_MIN_VERSION = true

// 每天维护窗口（+08）
const MAINTENANCE = { enabled: true, from: '01:00', to: '06:15' }

const APK_URL =
  `https://github.com/pjpc-01/pjpc-app-html/releases/download/v${LATEST_VERSION_NAME}/app-release.apk`
const RELEASE_URL = 'https://github.com/pjpc-01/pjpc-app-html/releases/latest'

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
  const minCode = ENFORCE_MIN_VERSION ? MIN_SUPPORTED_VERSION_CODE : 0
  return NextResponse.json(
    {
      success: true,
      webVersion: WEB_VERSION,

      // 更新用
      latestVersionCode: LATEST_VERSION_CODE,
      latestVersionName: LATEST_VERSION_NAME,
      minSupportedVersionCode: minCode,
      apkUrl: APK_URL,
      releaseUrl: RELEASE_URL,
      updateNotes: '推送改成 Google 通道，通知秒到。',

      // 兼容旧字段（旧壳只认这个）
      minNativeVersion: minCode,

      maintenance,
      maintenanceWindow: MAINTENANCE.enabled ? `${MAINTENANCE.from}-${MAINTENANCE.to}` : null,
      message: maintenance
        ? `系统维护中（每天 ${MAINTENANCE.from}-${MAINTENANCE.to}），早上 ${MAINTENANCE.to} 之后恢复。`
        : '',
      serverTime: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
