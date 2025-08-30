"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  MapPin, 
  ArrowRight,
  Users,
  Activity,
  Clock
} from "lucide-react"

interface Center {
  id: string
  name: string
  status: 'active' | 'inactive'
  studentCount: number
  todayAttendance: number
  attendanceRate: number
}

export default function MobileCheckinPage() {
  const router = useRouter()
  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟获取中心数据，实际应该从API获取
    const mockCenters: Center[] = [
      {
        id: 'wx01',
        name: 'WX 01',
        status: 'active',
        studentCount: 25,
        todayAttendance: 22,
        attendanceRate: 88
      },
      {
        id: 'wx02',
        name: 'WX 02',
        status: 'active',
        studentCount: 30,
        todayAttendance: 28,
        attendanceRate: 93
      },
      {
        id: 'wx03',
        name: 'WX 03',
        status: 'active',
        studentCount: 20,
        todayAttendance: 18,
        attendanceRate: 90
      },
      {
        id: 'wx04',
        name: 'WX 04',
        status: 'active',
        studentCount: 28,
        todayAttendance: 25,
        attendanceRate: 89
      }
    ]

    setCenters(mockCenters)
    setLoading(false)
  }, [])

  const handleCenterSelect = (centerId: string) => {
    router.push(`/mobile-checkin/${centerId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载中心信息...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部标题 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Smartphone className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">移动端考勤系统</h1>
            <p className="text-gray-600">请选择要考勤的中心</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* 系统说明 */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold text-blue-800 mb-2">使用说明</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• 选择对应的中心进行考勤</p>
                <p>• 搜索并选择学生</p>
                <p>• 选择考勤状态（出勤/迟到/缺席）</p>
                <p>• 确认提交考勤记录</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 中心列表 */}
        <div className="space-y-4">
          {centers.map((center) => (
            <Card 
              key={center.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                center.status === 'active' 
                  ? 'border-2 border-green-200 hover:border-green-300 bg-green-50' 
                  : 'border-2 border-gray-200 bg-gray-50 opacity-50'
              }`}
              onClick={() => center.status === 'active' && handleCenterSelect(center.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{center.name}</h3>
                      <p className="text-sm text-gray-600">学生考勤中心</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={center.status === 'active' ? 'default' : 'secondary'} className="mb-2">
                      {center.status === 'active' ? '可用' : '维护中'}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      学生: {center.studentCount}人
                    </div>
                  </div>
                </div>

                {center.status === 'active' && (
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">{center.todayAttendance}</div>
                      <div className="text-xs text-green-600">今日打卡</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">{center.studentCount - center.todayAttendance}</div>
                      <div className="text-xs text-blue-600">待打卡</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">{center.attendanceRate}%</div>
                      <div className="text-xs text-purple-600">出勤率</div>
                    </div>
                  </div>
                )}

                {center.status === 'active' && (
                  <div className="mt-4 flex items-center justify-center">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCenterSelect(center.id)
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      进入考勤
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 快速统计 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-gray-900">今日总览</CardTitle>
            <CardDescription>所有中心的考勤统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {centers.reduce((sum, center) => sum + center.studentCount, 0)}
                </div>
                <div className="text-xs text-blue-600">总学生</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {centers.reduce((sum, center) => sum + center.todayAttendance, 0)}
                </div>
                <div className="text-xs text-green-600">已打卡</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(centers.reduce((sum, center) => sum + center.attendanceRate, 0) / centers.length)}
                </div>
                <div className="text-xs text-purple-600">平均出勤率</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
