"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Center = {
  id: string
  name: string
  count?: number
}

export default function TVBoardPage() {
  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCenters = async () => {
      try {
        // 尝试从API获取centers
        const response = await fetch('/api/centers')
        if (response.ok) {
          const data = await response.json()
          if (data.data && data.data.length > 0) {
            setCenters(data.data.map((c: any) => ({
              id: c.id || c.name,
              name: c.name,
              count: c.count
            })))
            setLoading(false)
            return
          }
        }
        
        // 如果API失败或返回空数据，从学生数据中推导centers
        const studentsResponse = await fetch('/api/students?limit=1000')
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json()
          const students = studentsData.data || studentsData.students || []
          
          // 从学生数据中提取unique centers
          const centerMap = new Map<string, number>()
          students.forEach((s: any) => {
            const center = s?.center ?? s?.Center ?? s?.centre ?? s?.branch
            if (center) {
              centerMap.set(center, (centerMap.get(center) || 0) + 1)
            }
          })
          
          const derivedCenters = Array.from(centerMap.entries()).map(([name, count]) => ({
            id: name,
            name: name,
            count: count
          }))
          
          setCenters(derivedCenters)
        }
      } catch (error) {
        console.error('Failed to load centers:', error)
        // 设置默认centers
        setCenters([
          { id: 'WX 01', name: 'WX 01', count: 0 },
          { id: 'WX 02', name: 'WX 02', count: 0 },
          { id: 'WX 03', name: 'WX 03', count: 0 }
        ])
      } finally {
        setLoading(false)
      }
    }

    loadCenters()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-800 mb-4">
            📺 TV Board 选择
          </h1>
          <p className="text-xl text-gray-600">
            选择要显示的分行
          </p>
        </div>

        {/* 分行列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {centers.map((center) => (
            <Link
              key={center.id}
              href={`/tv-board/${encodeURIComponent(center.name)}`}
              className="group"
            >
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-blue-200">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl text-white">📺</span>
                  </div>
                  
                  <h3 className="text-2xl font-black text-gray-800 mb-2">
                    {center.name}
                  </h3>
                  
                  {center.count !== undefined && (
                    <p className="text-gray-500 font-semibold">
                      {center.count} 位学生
                    </p>
                  )}
                  
                  <div className="mt-6">
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold group-hover:from-blue-600 group-hover:to-purple-700 transition-all duration-300">
                      进入 TV Board
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 说明 */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl p-6 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              📋 TV Board 功能说明
            </h3>
            <div className="text-gray-600 space-y-2">
              <p>• 自动轮播显示学生积分、生日和公告</p>
              <p>• 背景运行NFC考勤功能</p>
              <p>• 支持手动导航和键盘控制</p>
              <p>• 当天生日学生特殊显示效果</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}