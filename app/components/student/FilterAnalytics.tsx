"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  TrendingUp, 
  MapPin, 
  GraduationCap, 
  Phone, 
  Mail,
  Calendar,
  BarChart3,
  PieChart
} from "lucide-react"
import { Student } from "@/hooks/useStudents"

interface FilterAnalyticsProps {
  students: Student[]
  filteredStudents: Student[]
  filters: any
}

export default function FilterAnalytics({ 
  students, 
  filteredStudents, 
  filters 
}: FilterAnalyticsProps) {
  
  // 计算统计数据
  const analytics = useMemo(() => {
    const total = students.length
    const filtered = filteredStudents.length
    const filterRate = total > 0 ? (filtered / total) * 100 : 0

    // 中心分布
    const centerDistribution = filteredStudents.reduce((acc, student) => {
      const center = student.center || '未指定'
      acc[center] = (acc[center] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 年级分布
    const gradeDistribution = filteredStudents.reduce((acc, student) => {
      const grade = student.standard || '未指定'
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 状态分布
    const statusDistribution = filteredStudents.reduce((acc, student) => {
      const status = student.status || '未指定'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 联系信息完整性
    const contactStats = {
      hasPhone: filteredStudents.filter(s => s.parentPhone || s.father_phone || s.mother_phone).length,
      hasEmail: filteredStudents.filter(s => s.email).length,
      hasAddress: filteredStudents.filter(s => s.home_address || s.address).length
    }

    // 年龄分布
    const ageStats = filteredStudents.reduce((acc, student) => {
      if (student.dob) {
        const age = new Date().getFullYear() - new Date(student.dob).getFullYear()
        if (age >= 0 && age <= 25) {
          acc[age] = (acc[age] || 0) + 1
        }
      }
      return acc
    }, {} as Record<number, number>)

    // 性别分布
    const genderDistribution = filteredStudents.reduce((acc, student) => {
      const gender = student.gender || '未指定'
      acc[gender] = (acc[gender] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      filtered,
      filterRate,
      centerDistribution,
      gradeDistribution,
      statusDistribution,
      contactStats,
      ageStats,
      genderDistribution
    }
  }, [students, filteredStudents])

  // 获取最活跃的筛选条件
  const activeFilters = useMemo(() => {
    const filters: string[] = []
    
    if (analytics.filterRate < 100) {
      filters.push(`筛选出 ${analytics.filtered} 名学生`)
    }
    
    return filters
  }, [analytics])

  return (
    <div className="space-y-4">
      {/* 总体统计 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            筛选结果统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.total}</div>
              <div className="text-sm text-gray-600">总学生数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.filtered}</div>
              <div className="text-sm text-gray-600">筛选结果</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.filterRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">筛选比例</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>筛选进度</span>
              <span>{analytics.filtered}/{analytics.total}</span>
            </div>
            <Progress value={analytics.filterRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* 分布统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 中心分布 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              中心分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.centerDistribution)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([center, count]) => (
                  <div key={center} className="flex items-center justify-between">
                    <span className="text-sm">{center}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / analytics.filtered) * 100}%` }}
                        />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* 年级分布 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              年级分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.gradeDistribution)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([grade, count]) => (
                  <div key={grade} className="flex items-center justify-between">
                    <span className="text-sm">{grade}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(count / analytics.filtered) * 100}%` }}
                        />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 联系信息和状态统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 联系信息完整性 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4" />
              联系信息完整性
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">有电话号码</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(analytics.contactStats.hasPhone / analytics.filtered) * 100}%` }}
                    />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {analytics.contactStats.hasPhone}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-600" />
                  <span className="text-sm">有邮箱地址</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(analytics.contactStats.hasEmail / analytics.filtered) * 100}%` }}
                    />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {analytics.contactStats.hasEmail}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">有地址信息</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${(analytics.contactStats.hasAddress / analytics.filtered) * 100}%` }}
                    />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {analytics.contactStats.hasAddress}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 状态分布 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              状态分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.statusDistribution)
                .sort(([,a], [,b]) => b - a)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm">
                      {status === 'active' ? '在读' : 
                       status === 'graduated' ? '已毕业' : 
                       status === 'transferred' ? '已转学' : 
                       status === 'inactive' ? '非活跃' : status}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{ width: `${(count / analytics.filtered) * 100}%` }}
                        />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 年龄分布 */}
      {Object.keys(analytics.ageStats).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              年龄分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analytics.ageStats)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .slice(0, 8)
                .map(([age, count]) => (
                  <div key={age} className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{age}岁</div>
                    <div className="text-sm text-gray-600">{count}人</div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div 
                        className="bg-indigo-600 h-1 rounded-full" 
                        style={{ width: `${(count / Math.max(...Object.values(analytics.ageStats))) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

