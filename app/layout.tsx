import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/pocketbase-auth-context"
import QueryProvider from "@/components/providers/query-provider"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { NfcAuthProvider } from "@/contexts/nfc-auth-context"
import { LanguageProvider } from "@/contexts/language-context"
import GlobalCardScanner from "@/components/attendance/GlobalCardScanner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "安亲班管理系统",
  description: "专业的安亲班教育管理解决方案",
  generator: 'v0.dev',
  icons: {
    icon: '/favicon.ico',
  },
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
              </NfcAuthProvider>
            </AuthProvider>
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
