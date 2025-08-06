"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function FirebaseStatus() {
  const [status, setStatus] = useState<{
    apiKey: boolean
    authDomain: boolean
    projectId: boolean
    storageBucket: boolean
    messagingSenderId: boolean
    appId: boolean
  }>({
    apiKey: false,
    authDomain: false,
    projectId: false,
    storageBucket: false,
    messagingSenderId: false,
    appId: false,
  })

  useEffect(() => {
    setStatus({
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    })
  }, [])

  const allConfigured = Object.values(status).every(Boolean)

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {allConfigured ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          Firebase 配置状态
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(status).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-sm">{key}</span>
              <Badge variant={value ? "default" : "destructive"}>{value ? "已配置" : "未配置"}</Badge>
            </div>
          ))}
        </div>
        {!allConfigured && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">请检查 .env.local 文件中的 Firebase 配置</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
