"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function TestDataPage() {
  const params = useParams<{ center: string }>()
  const center = decodeURIComponent(params.center)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // 测试学生数据API
        const studentsResponse = await fetch(`/api/students?center=${encodeURIComponent(center)}&limit=1000`)
        const studentsData = await studentsResponse.json()
        
        // 测试积分数据API
        const pointsResponse = await fetch(`/api/points?center=${encodeURIComponent(center)}&limit=1000`)
        const pointsData = await pointsResponse.json()
        
        setData({
          students: studentsData,
          points: pointsData,
          timestamp: new Date().toISOString()
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取数据失败')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [center])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">错误</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  const students = data?.students?.students || data?.students?.data || []
  const points = data?.points?.items || data?.points?.data || []

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">数据测试页面 - {center}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 学生数据统计 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-400">学生数据统计</h2>
            <div className="space-y-2">
              <div>总学生数: <span className="text-yellow-400">{students.length}</span></div>
              <div>API状态: <span className="text-green-400">{data?.students?.success ? '成功' : '失败'}</span></div>
              <div>最后更新: <span className="text-gray-400">{data?.timestamp}</span></div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-semibold mb-2">中心分布:</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(
                  students.reduce((acc: Record<string, number>, student: any) => {
                    const studentCenter = student?.center ?? student?.Center ?? student?.centre ?? student?.branch ?? 'Unknown'
                    acc[studentCenter] = (acc[studentCenter] || 0) + 1
                    return acc
                  }, {})
                ).map(([centerName, count]) => (
                  <div key={centerName} className="flex justify-between">
                    <span className={centerName === center ? 'text-yellow-400 font-bold' : 'text-gray-300'}>
                      {centerName}
                    </span>
                    <span className="text-gray-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 积分数据统计 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-green-400">积分数据统计</h2>
            <div className="space-y-2">
              <div>总积分记录数: <span className="text-yellow-400">{points.length}</span></div>
              <div>API状态: <span className="text-green-400">{data?.points?.success ? '成功' : '失败'}</span></div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-semibold mb-2">前5名积分学生:</h3>
              <div className="space-y-1 text-sm">
                {points.slice(0, 5).map((point: any, index: number) => (
                  <div key={point.id} className="flex justify-between">
                    <span className="text-gray-300">
                      {index + 1}. {point.expand?.student_id?.student_name || 'Unknown'}
                    </span>
                    <span className="text-yellow-400">{point.current_points || 0}分</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 原始数据预览 */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-purple-400">原始数据预览</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">学生数据样本:</h3>
              <pre className="bg-gray-900 p-4 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(students.slice(0, 3), null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">积分数据样本:</h3>
              <pre className="bg-gray-900 p-4 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(points.slice(0, 3), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
