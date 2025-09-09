"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react"

interface Student {
  id: string
  student_id: string
  student_name: string
  center: string
  status: string
}

export default function StudentDataTest() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiResponse, setApiResponse] = useState<any>(null)

  const loadStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 开始测试学生数据加载...')
      
      const response = await fetch('/api/students')
      const data = await response.json()
      
      console.log('📊 完整API响应:', data)
      setApiResponse(data)
      
      if (data.success) {
        // 尝试多种可能的数据结构
        const studentsData = data.students || data.data?.items || data.data || []
        console.log('✅ 解析的学生数据:', studentsData)
        setStudents(studentsData)
      } else {
        console.error('❌ API返回失败:', data.error)
        setError(data.error || 'API返回失败')
      }
    } catch (err: any) {
      console.error('❌ 请求异常:', err)
      setError(err.message || '请求失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            学生数据加载测试
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={loadStudents} disabled={loading}>
              {loading ? '加载中...' : '重新加载'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {students.length > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                成功加载 {students.length} 个学生
              </AlertDescription>
            </Alert>
          )}

          {/* API响应详情 */}
          {apiResponse && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">API响应详情</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* 学生列表 */}
          {students.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">学生列表 ({students.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {students.slice(0, 10).map((student) => (
                    <div key={student.id} className="p-3 border rounded-lg">
                      <div className="font-medium">
                        {student.student_name || '未设置姓名'}
                        {!student.student_name && (
                          <span className="text-red-500 ml-2">⚠️ 缺少姓名字段</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        ID: {student.student_id || '未设置'} | 中心: {student.center || '未设置'} | 状态: {student.status || '未设置'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        可用字段: {Object.keys(student).filter(key => student[key as keyof typeof student]).join(', ')}
                      </div>
                    </div>
                  ))}
                  {students.length > 10 && (
                    <div className="text-center text-gray-500 py-2">
                      还有 {students.length - 10} 个学生...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
