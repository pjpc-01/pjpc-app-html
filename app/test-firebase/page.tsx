"use client"

import { useEffect, useState } from "react"
import { checkFirebaseConnection } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function TestFirebasePage() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [testTime, setTestTime] = useState<number>(0)

  const testConnection = async () => {
    setStatus('loading')
    setError(null)
    const startTime = Date.now()
    
    try {
      const result = await checkFirebaseConnection()
      const endTime = Date.now()
      setTestTime(endTime - startTime)
      
      if (result.connected) {
        setStatus('connected')
      } else {
        setStatus('disconnected')
        setError(result.error || 'Unknown error')
      }
    } catch (err) {
      setStatus('disconnected')
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Firebase 连接测试
          </CardTitle>
          <CardDescription>
            测试 Firebase 连接状态和响应时间
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === 'connected' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {status === 'disconnected' && <XCircle className="h-4 w-4 text-red-500" />}
            <span className="text-sm">
              {status === 'loading' && '测试中...'}
              {status === 'connected' && '连接成功'}
              {status === 'disconnected' && '连接失败'}
            </span>
          </div>
          
          {testTime > 0 && (
            <div className="text-sm text-gray-600">
              响应时间: {testTime}ms
            </div>
          )}
          
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button onClick={testConnection} className="w-full">
            重新测试
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 