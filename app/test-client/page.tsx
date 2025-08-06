"use client"

import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function TestClientPage() {
  const [testResults, setTestResults] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const runTests = async () => {
      const results: any = {}

      // 测试用户集合访问
      try {
        const usersRef = collection(db, 'users')
        const usersSnapshot = await getDocs(usersRef)
        results.users = {
          success: true,
          count: usersSnapshot.size,
          error: null
        }
      } catch (error: any) {
        results.users = {
          success: false,
          count: 0,
          error: error.message
        }
      }

      // 测试小学学生集合访问
      try {
        const primaryStudentsRef = collection(db, 'primary_students')
        const primarySnapshot = await getDocs(primaryStudentsRef)
        results.primary_students = {
          success: true,
          count: primarySnapshot.size,
          error: null
        }
      } catch (error: any) {
        results.primary_students = {
          success: false,
          count: 0,
          error: error.message
        }
      }

      // 测试中学学生集合访问
      try {
        const secondaryStudentsRef = collection(db, 'secondary_students')
        const secondarySnapshot = await getDocs(secondaryStudentsRef)
        results.secondary_students = {
          success: true,
          count: secondarySnapshot.size,
          error: null
        }
      } catch (error: any) {
        results.secondary_students = {
          success: false,
          count: 0,
          error: error.message
        }
      }

      // 测试支付集合访问
      try {
        const paymentsRef = collection(db, 'payments')
        const paymentsSnapshot = await getDocs(paymentsRef)
        results.payments = {
          success: true,
          count: paymentsSnapshot.size,
          error: null
        }
      } catch (error: any) {
        results.payments = {
          success: false,
          count: 0,
          error: error.message
        }
      }

      setTestResults(results)
      setLoading(false)
    }

    runTests()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">正在测试客户端访问...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">客户端 Firestore 访问测试</h1>
      
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(testResults).map(([collectionName, result]: [string, any]) => (
          <Card key={collectionName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                {collectionName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>状态:</span>
                  <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                    {result.success ? '成功' : '失败'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>文档数量:</span>
                  <span>{result.count}</span>
                </div>
                {result.error && (
                  <div className="flex justify-between">
                    <span>错误:</span>
                    <span className="text-red-600 text-sm">{result.error}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>测试总结</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>总集合数: {Object.keys(testResults).length}</div>
            <div>成功访问: {Object.values(testResults).filter((r: any) => r.success).length}</div>
            <div>失败访问: {Object.values(testResults).filter((r: any) => !r.success).length}</div>
            <div>总文档数: {Object.values(testResults).reduce((sum: number, r: any) => sum + r.count, 0)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 