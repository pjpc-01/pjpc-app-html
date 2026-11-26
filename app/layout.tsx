import type React from "react"
// ★ 必须放第一个 import：全局 fetch 拦截器要在任何网络请求之前生效（见 lib/auth-fetch.ts）
import "@/lib/auth-fetch"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/pocketbase-auth-context"
import QueryProvider from "@/components/providers/query-provider"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { NfcAuthProvider } from "@/contexts/nfc-auth-context"
import { LanguageProvider } from "@/contexts/language-context"
import GlobalCardScanner from "@/components/attendance/GlobalCardScanner"
import WelcomeGate from "@/components/motion/WelcomeGate"
import PwaRegister from "@/components/PwaRegister"
import NativeShell from "@/components/NativeShell"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PJPC 安亲班管理系统",
  description: "PJPC 安亲班 · 学生、考勤、点名、费用、积分管理",
  applicationName: "PJPC",
  generator: 'v0.dev',
  // PWA：加到主屏幕用（iOS 认 apple-touch-icon，Android 认 manifest）
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'PJPC',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#fffaf0',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <LanguageProvider>
            <AuthProvider>
              <NfcAuthProvider>
                <DashboardLayout>
                  {children}
                </DashboardLayout>
                <GlobalCardScanner />
                {/* 登录后的一次性欢迎动效（只在这个标签页的这次登录播一次） */}
                <WelcomeGate />
                <PwaRegister />
                {/* 只在装好的 App 里生效：版本强制更新、通知、token 交接 */}
                <NativeShell />
              </NfcAuthProvider>
            </AuthProvider>
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
