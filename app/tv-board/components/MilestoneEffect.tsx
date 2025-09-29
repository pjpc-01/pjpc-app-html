"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Star, Zap, Trophy } from 'lucide-react'

interface MilestoneEffectProps {
  student: any
  milestone: number
  isVisible: boolean
  onComplete: () => void
}

export default function MilestoneEffect({ student, milestone, isVisible, onComplete }: MilestoneEffectProps) {
  const [showEffect, setShowEffect] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShowEffect(true)
      const timer = setTimeout(() => {
        setShowEffect(false)
        // 延迟调用onComplete，让退出动画完成
        setTimeout(() => {
          onComplete()
        }, 300) // 缩短退出动画时间
      }, 1000) // 改为1秒显示时间
      return () => clearTimeout(timer)
    } else {
      // 如果isVisible变为false，立即隐藏
      setShowEffect(false)
    }
  }, [isVisible, onComplete])

  const getMilestoneConfig = (milestone: number) => {
    if (milestone >= 500) {
      return {
        icon: Trophy,
        color: 'text-yellow-400',
        title: 'LEGENDARY!',
        message: `${student?.student_name} reached ${milestone} points!`
      }
    } else if (milestone >= 300) {
      return {
        icon: Star,
        color: 'text-purple-400',
        title: 'EPIC!',
        message: `${student?.student_name} reached ${milestone} points!`
      }
    } else if (milestone >= 200) {
      return {
        icon: Zap,
        color: 'text-blue-400',
        title: 'AMAZING!',
        message: `${student?.student_name} reached ${milestone} points!`
      }
    } else {
      return {
        icon: Star,
        color: 'text-green-400',
        title: 'GREAT!',
        message: `${student?.student_name} reached ${milestone} points!`
      }
    }
  }

  const config = getMilestoneConfig(milestone)
  const IconComponent = config.icon

  return (
    <AnimatePresence>
      {showEffect && (
        <motion.div
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* 背景闪光 */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20"
            animate={{
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 1]
            }}
            transition={{
              duration: 1,
              ease: "easeInOut"
            }}
          />

          {/* 烟花效果 */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              style={{
                left: '50%',
                top: '50%'
              }}
              animate={{
                x: [0, Math.cos(i * 30 * Math.PI / 180) * 200],
                y: [0, Math.sin(i * 30 * Math.PI / 180) * 200],
                opacity: [1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 1.5,
                delay: 0.2,
                ease: "easeOut"
              }}
            />
          ))}

          {/* 主要内容 - 底部紧凑版本 */}
          <motion.div
            className="relative text-center bg-black/80 backdrop-blur-sm rounded-2xl p-6 border border-cyan-400/50"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => {
                setShowEffect(false)
                setTimeout(() => onComplete(), 300)
              }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-600/50 hover:bg-gray-500/50 text-white text-xs flex items-center justify-center transition-colors"
            >
              ×
            </button>
            {/* 图标 */}
            <motion.div
              className="mb-3"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <IconComponent className={`w-12 h-12 ${config.color} drop-shadow-lg`} />
            </motion.div>

            {/* 标题 */}
            <motion.h2
              className={`text-2xl font-black ${config.color} mb-2`}
              animate={{
                textShadow: [
                  '0 0 0px currentColor',
                  '0 0 20px currentColor',
                  '0 0 0px currentColor'
                ]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {config.title}
            </motion.h2>

            {/* 消息 */}
            <motion.p
              className="text-lg text-white font-semibold mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {config.message}
            </motion.p>

            {/* 积分数字 */}
            <motion.div
              className={`text-4xl font-black ${config.color}`}
              animate={{
                scale: [1, 1.1, 1],
                textShadow: [
                  '0 0 0px currentColor',
                  '0 0 30px currentColor',
                  '0 0 0px currentColor'
                ]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {milestone}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
