"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  currentPage: number
  direction?: 'left' | 'right'
}

export default function PageTransition({ children, currentPage, direction = 'right' }: PageTransitionProps) {
  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? '-100%' : '100%',
      opacity: 0
    })
  }

  const lightSweepVariants = {
    initial: { x: '-100%', opacity: 0 },
    animate: { 
      x: '100%', 
      opacity: [0, 1, 0],
      transition: {
        duration: 0.8,
        ease: "easeInOut"
      }
    }
  }

  return (
    <div className="relative overflow-hidden">
      {/* 光扫效果 */}
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none"
        variants={lightSweepVariants}
        initial="initial"
        animate="animate"
        key={`sweep-${currentPage}`}
      >
        <div className="w-full h-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
      </motion.div>

      {/* 页面内容 */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentPage}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
