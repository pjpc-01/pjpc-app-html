"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Search, AlertCircle, CheckCircle, XCircle } from "lucide-react"

interface Student {
  id: string
  student_id: string
  student_name: string
  center: string
  status: string
  standard: string
  created: string
  updated: string
}

interface DebugData {
  success: boolean
  debug: {
    requestedCenter: string | null
    filterQuery: string
    totalStudents: number
    centerFilteredStudents: number
    collectionsInfo: any[]
  }
  allStudents: Student[]
  centerFilteredStudents: Student[]
  summary: {
    totalStudents: number
    centers: string[]
    centerDistribution: Record<string, number>
  }
}

export default function StudentsDataDebugPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [centerFilter, setCenterFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const fetchDebugData = async (center?: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = center 
        ? `/api/debug/students-data?center=${encodeURIComponent(center)}&debug=true`
        : '/api/debug/students-data?debug=true'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setDebugData(data)
      } else {
        setError(data.error || '获取数据失败')
      }
    } catch (err: any) {
      setError(err.message || '网络请求失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  const handleCenterFilter = () => {
    if (centerFilter.trim()) {
      fetchDebugData(centerFilter.trim())
    } else {
      fetchDebugData()
    }
  }

  const filteredStudents = debugData?.allStudents.filter(student => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      student.student_name.toLowerCase().includes(search) ||
      student.student_id.toLowerCase().includes(search) ||
      student.center.toLowerCase().includes(search)
    )
  }) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">正在获取调试数据...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">错误: {error}</p>
          <Button onClick={() => fetchDebugData()}>重试</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">学生数据调试页面</h1>
          <p className="text-gray-600">用于诊断学生数据加载和中心过滤问题</p>
        </div>

        {/* 中心过滤控制 */}
        <Card>
          <CardHeader>
            <CardTitle>中心过滤测试</CardTitle>
            <CardDescription>测试特定中心的学生数据过滤</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="输入中心ID (如: wx01)"
                value={centerFilter}
                onChange={(e) => setCenterFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCenterFilter()}
              />
              <Button onClick={handleCenterFilter}>测试过滤</Button>
              <Button variant="outline" onClick={() => fetchDebugData()}>重置</Button>
            </div>
          </CardContent>
        </Card>

        {/* 调试信息概览 */}
        {debugData && (
          <Card>
            <CardHeader>
              <CardTitle>调试信息概览</CardTitle>
              <CardDescription>系统状态和数据统计</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{debugData.summary.totalStudents}</div>
                  <div className="text-sm text-blue-600">总学生数</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{debugData.debug.centerFilteredStudents}</div>
                  <div className="text-sm text-green-600">中心过滤后</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{debugData.summary.centers.length}</div>
                  <div className="text-sm text-purple-600">可用中心</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{debugData.debug.collectionsInfo.length}</div>
                  <div className="text-sm text-orange-600">集合数量</div>
                </div>
              </div>

              {/* 中心分布 */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">中心分布</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(debugData.summary.centerDistribution).map(([center, count]) => (
                    <div key={center} className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="font-semibold text-gray-800">{center}</div>
                      <div className="text-sm text-gray-600">{count} 人</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 集合信息 */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">可用集合</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {debugData.debug.collectionsInfo.map((collection, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-800">{collection.name}</div>
                      <div className="text-xs text-gray-600">类型: {collection.type}</div>
                      <div className="text-xs text-gray-500">
                        字段: {Array.isArray(collection.schema) ? collection.schema.join(', ') : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 学生列表 */}
        {debugData && (
          <Card>
            <CardHeader>
              <CardTitle>学生数据列表</CardTitle>
              <CardDescription>
                显示所有学生数据 (共 {filteredStudents.length} 人)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 搜索框 */}
              <div className="mb-4">
                <Input
                  placeholder="搜索学生姓名、学号或中心..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>

              {/* 学生表格 */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">学号</th>
                      <th className="text-left p-2">姓名</th>
                      <th className="text-left p-2">中心</th>
                      <th className="text-left p-2">状态</th>
                      <th className="text-left p-2">年级</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono">{student.student_id}</td>
                        <td className="p-2">{student.student_name}</td>
                        <td className="p-2">
                          <Badge variant={student.center === centerFilter ? "default" : "secondary"}>
                            {student.center}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge 
                            variant={
                              student.status === 'active' ? 'default' : 
                              student.status === 'inactive' ? 'secondary' : 'destructive'
                            }
                          >
                            {student.status}
                          </Badge>
                        </td>
                        <td className="p-2">{student.standard}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 刷新按钮 */}
        <div className="text-center">
          <Button onClick={() => fetchDebugData(centerFilter || undefined)} size="lg">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>
      </div>
    </div>
  )
}
