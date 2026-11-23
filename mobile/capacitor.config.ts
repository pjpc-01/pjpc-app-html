import type { CapacitorConfig } from '@capacitor/cli'

/**
 * PJPC 手机壳配置。
 *
 * 关键：server.url 指向线上的 pjpcapp.com —— 网页改完，App 立刻就是新的，
 * 不需要重新打包、不需要上架。原生壳只在「加了原生插件 / 改图标 / 升级 SDK」时才重打包。
 *
 * webDir 里的 www/ 只是离线兜底页（服务器连不上时显示），不是业务代码。
 */
const config: CapacitorConfig = {
  appId: 'com.pjpc.app',
  appName: 'PJPC',
  webDir: 'www',
  server: {
    // 线上站点；改端口/域名只改这里
    url: 'https://pjpcapp.com',
    androidScheme: 'https',
    // 断网/5xx 时不要白屏：交给 www/index.html 兜底
    errorPath: 'index.html',
  },
  android: {
    allowMixedContent: false,
    // 网页里有 NFC 扫描（PointsNfcScanner）走的是原生插件，不需要 WebView 的 Web NFC
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 600,
      backgroundColor: '#0d0d11',
      showSpinner: false,
    },
  },
}

export default config
