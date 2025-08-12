"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  GraduationCap, 
  MapPin, 
  Phone, 
  Calendar,
  TrendingUp,
  UserCheck,
  UserX
} from "lucide-react"
import { Student } from "@/hooks/useStudents"

interface StudentStatsProps {
  students: Student[]
  totalStudents: number
  className?: string
}

export default function StudentStats({ 
  students, 
  totalStudents, 
  className = "" 
}: StudentStatsProps) {
  const stats = useMemo(() => {
    const total = students.length
    const primary = students.filter(s => s.level === 'primary').length
    const secondary = students.filter(s => s.level === 'secondary').length
    const hasPhone = students.filter(s => s.father_phone || s.mother_phone || s.phone).length
    const hasAddress = students.filter(s => s.home_address || s.address).length
    
    // 按中心分组
    const byCenter = students.reduce((acc, student) => {
      const center = student.center || '未知中心'
      acc[center] = (acc[center] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // 按年级分组
    const byGrade = students.reduce((acc, student) => {
      const grade = student.standard || student.grade || '未知年级'
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // 按性别分组
    const byGender = students.reduce((acc, student) => {
      const gender = student.gender || '未知'
      acc[gender] = (acc[gender] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // 最近入学的学生（3个月内）
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const recent = students.filter(student => {
      const enrollmentDate = new Date(student.enrollmentDate || student.createdAt)
      return enrollmentDate >= threeMonthsAgo
    }).length
    
    // 本月新入学
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const newThisMonth = students.filter(student => {
      const enrollmentDate = new Date(student.enrollmentDate || student.createdAt)
      return enrollmentDate >= firstDayOfMonth
    }).length

    return {
      total,
      primary,
      secondary,
      hasPhone,
      hasAddress,
      byCenter,
      byGrade,
      byGender,
      recent,
      newThisMonth,
      percentage: totalStudents > 0 ? Math.round((total / totalStudents) * 100) : 0
    }
  }, [students, totalStudents])

  if (students.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>没有找到匹配的学生</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* 主要统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-lg font-semibold">{stats.total}</span>
              </div>
              <p className="text-xs text-gray-600">筛选结果</p>
              {stats.percentage < 100 && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {stats.percentage}% 的总数
                </Badge>
              )}
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <GraduationCap className="h-4 w-4 text-green-500" />
                <span className="text-lg font-semibold">{stats.primary}</span>
              </div>
              <p className="text-xs text-gray-600">小学生</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <GraduationCap className="h-4 w-4 text-purple-500" />
                <span className="text-lg font-semibold">{stats.secondary}</span>
              </div>
              <p className="text-xs text-gray-600">中学生</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Phone className="h-4 w-4 text-orange-500" />
                <span className="text-lg font-semibold">{stats.hasPhone}</span>
              </div>
              <p className="text-xs text-gray-600">有电话</p>
            </div>
          </div>

          {/* 详细信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 按中心分布 */}
            {Object.keys(stats.byCenter).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  按中心分布
                </h4>
                <div className="space-y-1">
                  {Object.entries(stats.byCenter)
                    .sort(([,a], [,b]) => b - a)
                    .map(([center, count]) => (
                      <div key={center} className="flex justify-between items-center text-xs">
                        <span>{center}</span>
                        <Badge variant="outline" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 按年级分布 */}
            {Object.keys(stats.byGrade).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  按年级分布
                </h4>
                <div className="space-y-1">
                  {Object.entries(stats.byGrade)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([grade, count]) => (
                      <div key={grade} className="flex justify-between items-center text-xs">
                        <span>{grade}</span>
                        <Badge variant="outline" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 其他统计 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                其他统计
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span>有地址</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.hasAddress}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>最近入学</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.recent}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>本月新生</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.newThisMonth}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 