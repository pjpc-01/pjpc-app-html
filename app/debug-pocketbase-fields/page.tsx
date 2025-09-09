"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, AlertCircle } from "lucide-react"

export default function PocketBaseFieldTest() {
  const [rawData, setRawData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testPocketBaseFields = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 测试PocketBase字段...')
      
      const response = await fetch('/api/students')
      const data = await response.json()
      
      console.log('📊 完整响应:', data)
      
      if (data.success && data.students && data.students.length > 0) {
        // 显示第一个学生的所有字段
        const firstStudent = data.students[0]
        console.log('👤 第一个学生的所有字段:', firstStudent)
        setRawData(firstStudent)
      } else {
        setError('没有学生数据或API失败')
      }
    } catch (err: any) {
      console.error('❌ 测试失败:', err)
      setError(err.message || '测试失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            PocketBase字段测试
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testPocketBaseFields} disabled={loading}>
            {loading ? '测试中...' : '测试PocketBase字段'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {rawData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">第一个学生的原始数据</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">所有字段:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(rawData).map(([key, value]) => (
                      <div key={key} className="p-2 border rounded">
                        <div className="font-medium text-blue-600">{key}:</div>
                        <div className="text-gray-600">
                          {value === null ? 'null' : 
                           value === undefined ? 'undefined' : 
                           typeof value === 'string' && value === '' ? '(空字符串)' :
                           String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-100 rounded">
                  <div className="text-sm font-medium mb-2">JSON格式:</div>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(rawData, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
