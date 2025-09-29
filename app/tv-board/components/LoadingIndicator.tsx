"use client"

import { motion } from "framer-motion"

interface LoadingIndicatorProps {
  message?: string
  progress?: number
  isVisible: boolean
}

export default function LoadingIndicator({ 
  message = "加载中...", 
  progress, 
  isVisible 
}: LoadingIndicatorProps) {
  if (!isVisible) return null

  return (
    <motion.div
      className="fixed top-4 right-4 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-4 shadow-lg z-50"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        <motion.div
          className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <div className="text-white">
          <div className="text-sm font-medium">{message}</div>
          {progress !== undefined && (
            <div className="text-xs text-gray-400 mt-1">
              {Math.round(progress)}%
            </div>
          )}
        </div>
      </div>
      
      {progress !== undefined && (
        <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
          <motion.div
            className="bg-cyan-400 h-1 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </motion.div>
  )
}
