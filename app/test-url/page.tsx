"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, Globe, User, CheckCircle, XCircle } from "lucide-react"

export default function TestURLPage() {
  const [studentId, setStudentId] = useState("")
  const [url, setUrl] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // 测试访问学生URL
  const testAccessURL = async () => {
    if (!studentId) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/nfc/url-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          action: 'access'
        })
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: '请求失败'
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取学生URL
  const getStudentURL = async () => {
    if (!studentId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/nfc/url-access?studentId=${studentId}`)
      const data = await response.json()
      setResult(data)
      if (data.success && data.data?.url) {
        setUrl(data.data.url)
      }
    } catch (error) {
      setResult({
        success: false,
        error: '请求失败'
      })
    } finally {
      setLoading(false)
    }
  }

  // 更新学生URL
  const updateStudentURL = async () => {
    if (!studentId || !url) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/nfc/url-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          action: 'update',
          newUrl: url
        })
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: '请求失败'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Globe className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">学生URL功能测试</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 输入区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              学生信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="studentId">学生ID</Label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="输入学生ID，如：STU001"
              />
            </div>
            
            <div>
              <Label htmlFor="url">学生专属网址</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://school.com/student/STU001"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={testAccessURL} 
                disabled={!studentId || loading}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                访问URL
              </Button>
              
              <Button 
                onClick={getStudentURL} 
                disabled={!studentId || loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                获取URL
              </Button>
              
              <Button 
                onClick={updateStudentURL} 
                disabled={!studentId || !url || loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                更新URL
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 结果显示区域 */}
        <Card>
          <CardHeader>
            <CardTitle>测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                处理中...
              </div>
            ) : result ? (
              <div className="space-y-4">
                <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription>
                      {result.message || result.error || '操作完成'}
                    </AlertDescription>
                  </div>
                </Alert>

                {result.data && (
                  <div className="space-y-2">
                    {result.data.url && (
                      <div>
                        <Label className="text-sm font-medium">URL:</Label>
                        <div className="flex items-center gap-2">
                          <a 
                            href={result.data.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-sm"
                          >
                            {result.data.url}
                          </a>
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    )}
                    
                    {result.data.studentName && (
                      <div>
                        <Label className="text-sm font-medium">学生姓名:</Label>
                        <p className="text-sm">{result.data.studentName}</p>
                      </div>
                    )}
                    
                    {result.data.accessTime && (
                      <div>
                        <Label className="text-sm font-medium">访问时间:</Label>
                        <p className="text-sm">{new Date(result.data.accessTime).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )}

                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                请输入学生ID并点击按钮进行测试
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 测试数据说明 */}
      <Card>
        <CardHeader>
          <CardTitle>测试数据说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>系统中有以下测试学生数据：</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>STU001</strong> - 张三 (NFC卡) - https://school.com/student/STU001</li>
              <li><strong>STU002</strong> - 李四 (RFID卡) - https://school.com/student/STU002</li>
              <li><strong>G16</strong> - 张三 (NFC测试卡) - https://school.com/student/G16</li>
              <li><strong>G17</strong> - 李四 (RFID测试卡) - https://school.com/student/G17</li>
              <li><strong>G18</strong> - 王五 (NFC测试卡) - https://school.com/student/G18</li>
              <li><strong>G19</strong> - 赵六 (RFID测试卡) - https://school.com/student/G19</li>
            </ul>
            <p className="mt-4 text-gray-600">
              您可以输入这些学生ID来测试URL功能，或者使用其他学生ID来测试错误处理。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
