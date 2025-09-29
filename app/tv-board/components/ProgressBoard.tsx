"use client"

import { motion } from 'framer-motion'
import { TrendingUpIcon, StarIcon } from 'lucide-react'
// 移除电竞主题引用

interface ProgressData {
  student: any
  points: number
  change: number
  rank: number
}

interface ProgressBoardProps {
  data: ProgressData[]
  className?: string
}

export default function ProgressBoard({ data, className = '' }: ProgressBoardProps) {
  const topProgress = data.slice(0, 5) // 显示前5名进步学生

  return (
    <div className={`relative ${className}`}>
      {/* 背景光扫效果 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* 标题 */}
      <div className="relative z-10 mb-2">
        <motion.div
          className="flex items-center gap-2 mb-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <TrendingUpIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xl font-bold text-cyan-400">
            PROGRESS LEADERBOARD
          </h3>
        </motion.div>
        <div className="text-xs text-gray-400">
          Top performers this week
        </div>
      </div>

      {/* 进步榜列表 */}
      <div className="relative z-10 space-y-1">
        {topProgress.map((item, index) => (
          <motion.div
            key={item.student?.id || index}
            className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{
              scale: 1.02,
              boxShadow: '0 0 20px #00ffff40'
            }}
          >
            {/* 排名和姓名 */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold">
                #{item.rank}
              </div>
              <div>
                <div className="font-semibold text-white">
                  {item.student?.student_name || 'Unknown'}
                </div>
                <div className="text-sm text-gray-300 font-bold bg-gray-700/50 px-2 py-1 rounded">
                  {item.student?.student_id || '--'}
                </div>
              </div>
            </div>

            {/* 积分和变化 */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-bold text-white">
                  {item.points}
                </div>
                <div className="text-sm text-gray-400">
                  points
                </div>
              </div>
              
              {/* 进步指示器 - 根据进步值显示不同效果 */}
              <motion.div
                className="flex items-center gap-1"
                animate={{
                  scale: item.change > 0 ? [1, 1.1, 1] : [1, 0.95, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {item.change > 0 ? (
                  <>
                    <StarIcon className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-bold text-sm">
                      +{item.change}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 text-gray-400">—</div>
                    <span className="text-gray-400 font-bold text-sm">
                      {item.change}
                    </span>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 装饰元素 */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  )
}
