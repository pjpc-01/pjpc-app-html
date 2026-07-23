"use client"

import { motion } from "framer-motion"
import { RefreshCw, Users, Wifi, WifiOff } from "lucide-react"

interface TVBoardHeaderProps {
  center: string
  studentCount: number
  isRealtime: boolean
  onRefresh: () => void
}

export default function TVBoardHeader({
  center,
  studentCount,
  isRealtime,
  onRefresh,
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
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm">
              {isRealtime ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium">实时更新</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 font-medium">离线模式</span>
                </>
              )}
            </div>
            <button
              onClick={onRefresh}
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mt-1"
            >
              <RefreshCw className="w-3 h-3" />
              刷新
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
