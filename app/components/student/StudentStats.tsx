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
    const active = students.filter(s => s.status === 'active').length
    const graduated = students.filter(s => s.status === 'graduated').length
    const transferred = students.filter(s => s.status === 'transferred').length
    const inactive = students.filter(s => s.status === 'inactive').length
    
    // 按年级分组
    const byGrade = students.reduce((acc, student) => {
      const grade = student.grade || '未知年级'
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // 按状态分组
    const byStatus = students.reduce((acc, student) => {
      const status = student.status || '未知状态'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // 按家长邮箱分组
    const byEmail = students.reduce((acc, student) => {
      const hasEmail = student.parentEmail ? '有邮箱' : '无邮箱'
      acc[hasEmail] = (acc[hasEmail] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      active,
      graduated,
      transferred,
      inactive,
      byGrade,
      byStatus,
      byEmail,
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
                <span className="text-lg font-semibold">{stats.active}</span>
              </div>
              <p className="text-xs text-gray-600">在读学生</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <GraduationCap className="h-4 w-4 text-purple-500" />
                <span className="text-lg font-semibold">{stats.graduated}</span>
              </div>
              <p className="text-xs text-gray-600">已毕业</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Phone className="h-4 w-4 text-orange-500" />
                <span className="text-lg font-semibold">{stats.transferred}</span>
              </div>
              <p className="text-xs text-gray-600">已转学</p>
            </div>
          </div>

                     {/* 详细信息 */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 按状态分布 */}
            {Object.keys(stats.byStatus).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  按状态分布
                </h4>
                <div className="space-y-1">
                  {Object.entries(stats.byStatus)
                    .sort(([,a], [,b]) => b - a)
                    .map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center text-xs">
                        <span>{status}</span>
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

                         {/* 邮箱统计 */}
             {Object.keys(stats.byEmail).length > 0 && (
               <div>
                 <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                   <TrendingUp className="h-3 w-3" />
                   邮箱分布
                 </h4>
                 <div className="space-y-1">
                   {Object.entries(stats.byEmail)
                     .sort(([,a], [,b]) => b - a)
                     .map(([emailStatus, count]) => (
                       <div key={emailStatus} className="flex justify-between items-center text-xs">
                         <span>{emailStatus}</span>
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
                   <span>非活跃学生</span>
                   <Badge variant="outline" className="text-xs">
                     {stats.inactive}
                   </Badge>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                   <span>总学生数</span>
                   <Badge variant="outline" className="text-xs">
                     {stats.total}
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