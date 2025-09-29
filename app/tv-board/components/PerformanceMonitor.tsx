"use client"

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  renderTime: number
  componentCount: number
  lastUpdate: Date
}

interface PerformanceMonitorProps {
  enabled?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  showDetails?: boolean
}

export default function PerformanceMonitor({ 
  enabled = false, 
  position = 'top-right',
  showDetails = false 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    componentCount: 0,
    lastUpdate: new Date()
  })
  
  const [isVisible, setIsVisible] = useState(false)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const animationFrameRef = useRef<number>()
  const renderStartRef = useRef(0)

  // 渲染时间测量 - 合并为单个effect避免无限循环
  useEffect(() => {
    const startTime = performance.now()
    const renderTime = performance.now() - startTime
    setMetrics(prev => ({ ...prev, renderTime }))
  }, []) // 只在组件挂载时运行一次

  // FPS 计算
  useEffect(() => {
    if (!enabled) return

    const measureFPS = () => {
      const now = performance.now()
      frameCountRef.current++
      
      if (now - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current))
        setMetrics(prev => ({ ...prev, fps, lastUpdate: new Date() }))
        frameCountRef.current = 0
        lastTimeRef.current = now
      }
      
      animationFrameRef.current = requestAnimationFrame(measureFPS)
    }

    animationFrameRef.current = requestAnimationFrame(measureFPS)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [enabled])

  // 内存使用情况
  useEffect(() => {
    if (!enabled) return

    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
        setMetrics(prev => ({ ...prev, memoryUsage }))
      }
    }

    const interval = setInterval(measureMemory, 1000)
    return () => clearInterval(interval)
  }, [enabled])

  // 组件数量统计
  useEffect(() => {
    if (!enabled) return

    const countComponents = () => {
      const componentCount = document.querySelectorAll('[data-component]').length
      setMetrics(prev => ({ ...prev, componentCount }))
    }

    const interval = setInterval(countComponents, 2000)
    return () => clearInterval(interval)
  }, [enabled])

  // 键盘快捷键切换显示
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (!enabled || !isVisible) return null

  const getPositionClass = () => {
    switch (position) {
      case 'top-left': return 'top-4 left-4'
      case 'top-right': return 'top-4 right-4'
      case 'bottom-left': return 'bottom-4 left-4'
      case 'bottom-right': return 'bottom-4 right-4'
      default: return 'top-4 right-4'
    }
  }

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'text-green-400'
    if (fps >= 30) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getMemoryColor = (memory: number) => {
    if (memory < 50) return 'text-green-400'
    if (memory < 100) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`fixed ${getPositionClass()} z-50 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 text-xs font-mono`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-cyan-400 font-bold">Performance</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-400">FPS:</span>
          <span className={getFPSColor(metrics.fps)}>{metrics.fps}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Memory:</span>
          <span className={getMemoryColor(metrics.memoryUsage)}>{metrics.memoryUsage}MB</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Render:</span>
          <span className="text-cyan-400">{metrics.renderTime.toFixed(2)}ms</span>
        </div>

        {showDetails && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-400">Components:</span>
              <span className="text-cyan-400">{metrics.componentCount}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Updated:</span>
              <span className="text-gray-400">
                {metrics.lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="mt-2 text-gray-500 text-xs">
        Press Ctrl+Shift+P to toggle
      </div>
    </motion.div>
  )
}
