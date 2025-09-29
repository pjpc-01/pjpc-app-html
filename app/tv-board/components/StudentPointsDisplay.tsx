"use client"

import { motion } from "framer-motion"
import { Trophy, Medal, Award, Star, Users } from "lucide-react"
import { ThemeColors } from "../hooks/useTheme"

interface StudentPointsDisplayProps {
  data: any[]
  isBright: boolean
  colors: ThemeColors
  currentPageIndex: number
  totalStudents: number
  studentsPerPage?: number
}

export default function StudentPointsDisplay({
  data,
  isBright,
  colors,
  currentPageIndex,
  totalStudents,
  studentsPerPage = 12
}: StudentPointsDisplayProps) {
  // 调试信息
  console.log('StudentPointsDisplay 渲染:', {
    dataLength: data?.length || 0,
    currentPageIndex,
    totalStudents,
    studentsPerPage,
    sampleData: data?.slice(0, 3)
  })
  // 获取排名图标 - 基于全局排名
  const getRankIcon = (index: number) => {
    const globalRank = currentPageIndex * studentsPerPage + index + 1
    if (globalRank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (globalRank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (globalRank === 3) return <Award className="w-5 h-5 text-orange-500" />
    return <Star className="w-4 h-4 text-gray-500" />
  }

  // 获取排名颜色 - 基于全局排名
  const getRankColor = (index: number) => {
    const globalRank = currentPageIndex * studentsPerPage + index + 1
    if (globalRank === 1) return "bg-gradient-to-br from-yellow-400 to-yellow-600"
    if (globalRank === 2) return "bg-gradient-to-br from-gray-300 to-gray-500"
    if (globalRank === 3) return "bg-gradient-to-br from-orange-400 to-orange-600"
    return "bg-gradient-to-br from-blue-500 to-blue-700"
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* 学生列表 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 flex-1 overflow-hidden">
        {data.map((student, index) => (
          <motion.div
            key={student.id}
            className={`relative rounded-lg p-4 ${getRankColor(index)} text-white shadow-lg hover:shadow-xl transition-all duration-300`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            {/* 排名 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getRankIcon(index)}
                <span className="student-rank font-bold text-xl">#{currentPageIndex * studentsPerPage + index + 1}</span>
              </div>
            </div>

            {/* 学生信息 */}
            <div className="text-center">
              <div className="student-name font-bold text-xl mb-2 truncate">
                {student.student?.student_name || '未知学生'}
              </div>
              <div className="student-id mb-3">
                {student.student?.student_id || '未知学号'}
              </div>
              <div className="student-points text-3xl font-black mb-2">
                {student.current_points || 0}
              </div>
              <div className="text-base opacity-90">
                积分
              </div>
            </div>

            {/* 特殊排名效果 - 只在第一页显示前3名 */}
            {currentPageIndex === 0 && index < 3 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-gray-800">
                  {index + 1}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}