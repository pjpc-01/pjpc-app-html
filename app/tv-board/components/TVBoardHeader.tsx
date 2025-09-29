"use client"

import { motion } from "framer-motion"
import { RefreshCw, Users, Wifi, WifiOff, CheckCircle, AlertTriangle, XCircle } from "lucide-react"

interface PointsHealthStatus {
  isHealthy: boolean
  lastCheck: Date | null
  inconsistencies: number
  lastError: string | null
}

interface TVBoardHeaderProps {
  center: string
  studentCount: number
  isRealtime: boolean
  onRefresh: () => void
  pointsHealthStatus?: PointsHealthStatus
}

export default function TVBoardHeader({
  center,
  studentCount,
  isRealtime,
  onRefresh,
  pointsHealthStatus
}: TVBoardHeaderProps) {
  return (
    <motion.div
      className="bg-gray-800 rounded-lg p-4 mb-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">
              {center} 积分排行榜
            </h1>
            <p className="text-xl text-gray-400">
              共 {studentCount} 名学生
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* 积分数据健康状态指示器 */}
          {pointsHealthStatus && (
            <div className="flex items-center gap-2 text-sm">
              {pointsHealthStatus.isHealthy ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium">数据正常</span>
                </>
              ) : pointsHealthStatus.lastError ? (
                <>
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-medium">检查失败</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">
                    {pointsHealthStatus.inconsistencies} 个异常
                  </span>
                </>
              )}
            </div>
          )}
          
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm">
              {isRealtime ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium">实时更新</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">离线模式</span>
                </>
              )}
            </div>
          </div>
          
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>
    </motion.div>
  )
}