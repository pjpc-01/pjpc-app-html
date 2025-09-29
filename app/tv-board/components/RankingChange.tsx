"use client"

import { motion } from 'framer-motion'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

interface RankingChangeProps {
  change: 'up' | 'down' | 'same'
  points: number
  className?: string
}

export default function RankingChange({ change, points, className = '' }: RankingChangeProps) {
  if (change === 'same') return null

  return (
    <motion.div
      className={`flex items-center gap-1 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      {change === 'up' ? (
        <>
          <motion.div
            animate={{
              y: [0, -5, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <ArrowUpIcon className="w-4 h-4 text-green-400" />
          </motion.div>
          <motion.span
            className="text-green-400 font-bold text-sm"
            animate={{
              color: ['#4ade80', '#22c55e', '#4ade80']
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            +{points}
          </motion.span>
        </>
      ) : (
        <>
          <motion.div
            animate={{
              y: [0, 5, 0],
              x: [0, -2, 2, 0]
            }}
            transition={{
              duration: 0.4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <ArrowDownIcon className="w-4 h-4 text-red-400" />
          </motion.div>
          <motion.span
            className="text-red-400 font-bold text-sm"
            animate={{
              color: ['#f87171', '#ef4444', '#f87171']
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            -{points}
          </motion.span>
        </>
      )}
    </motion.div>
  )
}
