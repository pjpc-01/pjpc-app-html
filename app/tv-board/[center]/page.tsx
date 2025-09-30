"use client"

import { useCallback, useEffect, useMemo, useRef, useReducer, useState } from "react"
import "../styles/safe-area.css"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import NFCBackgroundRunner from "../components/systems/nfc-background-runner"
import { useTheme } from "../hooks/useTheme"
import { useOptimizedData } from "../hooks/useOptimizedData"
import { useResponsiveScale } from "../hooks/useResponsiveScale"
import { useTransactions } from "../hooks/useTransactions"
import { useTransactionLayout } from "../hooks/useTransactionLayout"
import { useMemoryOptimization } from "../hooks/useMemoryOptimization"
import { useSmartLoading, useSmartError, useSmartAnimation } from "../hooks/useUIOptimization"
import { usePointsHealthCheck } from "../hooks/usePointsHealthCheck"
import { DISPLAY_MS, ANIMATION_CLASSES } from "../constants"
import { SlideData } from "../types"

// Components
import TVBoardHeader from "../components/TVBoardHeader"
import StudentPointsDisplay from "../components/StudentPointsDisplay"
import BirthdaysDisplay from "../components/BirthdaysDisplay"
import AnnouncementsDisplay from "../components/AnnouncementsDisplay"
import SlideIndicators from "../components/SlideIndicators"
import NavigationControls from "../components/NavigationControls"
import PageTransition from "../components/PageTransition"
import MilestoneEffect from "../components/MilestoneEffect"
import RecentTransactions from "../components/RecentTransactions"
import LoadingScreen from "../components/LoadingScreen"
import ErrorScreen from "../components/ErrorScreen"
import SafeAreaLayout from "../components/SafeAreaLayout"
import TVBoardContainer from "../components/TVBoardContainer"

// 调试模式 - 在开发环境启用
const DEBUG_MODE = process.env.NODE_ENV === 'development'

// 导航状态类型
interface NavigationState {
  idx: number
  direction: 'left' | 'right'
}

// 导航动作类型
type NavigationAction = 
  | { type: 'NEXT'; totalSlides: number }
  | { type: 'PREV'; totalSlides: number }
  | { type: 'GOTO'; idx: number; direction: 'left' | 'right' }
  | { type: 'RESET_INTERVAL' }

// 导航状态管理器
function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'NEXT':
      return {
        idx: state.idx < action.totalSlides - 1 ? state.idx + 1 : 0,
        direction: 'right'
      }
    case 'PREV':
      return {
        idx: state.idx > 0 ? state.idx - 1 : action.totalSlides - 1,
        direction: 'left'
      }
    case 'GOTO':
      return {
        idx: action.idx,
        direction: action.direction
      }
    case 'RESET_INTERVAL':
      return state
    default:
      return state
  }
}

// 预生成的里程碑数组（缓存）
const MILESTONE_CACHE = Array.from({ length: 100 }, (_, i) => (i + 1) * 50)

export default function TVBoardByCenter() {
  const params = useParams<{ center: string }>()
  const router = useRouter()
  const center = decodeURIComponent(params.center)
  
  // 响应式缩放
  const { scale, dimensions, isMobile, isTablet, isDesktop, isTV } = useResponsiveScale()
  
  // 交易记录布局配置
  const { dynamicHeight } = useTransactionLayout()
  
  // 内存优化
  const { registerCleanup, createInterval, createTimeout } = useMemoryOptimization()
  
  // UI优化
  const { loading: smartLoading, loadingProgress, loadingMessage, startLoading, finishLoading } = useSmartLoading()
  const { errors, addError, removeError, clearErrors } = useSmartError()
  const { animationsEnabled } = useSmartAnimation()
  
  // 使用 useReducer 管理导航状态
  const [navigationState, dispatchNavigation] = useReducer(navigationReducer, {
    idx: 0,
    direction: 'right'
  })
  
  // 里程碑状态
  const [showMilestone, setShowMilestone] = useState(false)
  const [milestoneData, setMilestoneData] = useState<{student: any, milestone: number} | null>(null)
  
  // 使用 useRef 存储不需要触发重渲染的数据
  const previousPointsRef = useRef<Map<string, number>>(new Map())
  const lastMilestoneTimeRef = useRef<number>(0)
  const autoSlideIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastManualActionRef = useRef<number>(0)
  
  // 优化的数据管理
  const { 
    announcements, 
    students, 
    sortedStudents, 
    monthBirthdays, 
    slides, 
    ready,
    error,
    refreshData,
    studentsPerPage
  } = useOptimizedData(center)
  
  // 教师数据状态
  const [teachers, setTeachers] = useState<any[]>([])
  
  // 获取教师数据
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch(`/api/teachers?center=${encodeURIComponent(center)}&limit=100`)
        const data = await response.json()
        if (data.success) {
          setTeachers(data.data || [])
        }
      } catch (error) {
        console.error('获取教师数据失败:', error)
      }
    }
    
    if (center) {
      fetchTeachers()
    }
  }, [center])
  
  // 交易记录
  const { 
    transactions, 
    loading: transactionsLoading, 
    error: transactionsError,
    isRealtime: transactionsRealtime
  } = useTransactions(center)
  
  // 主题
  const { isBright, colors } = useTheme()
  
  // 积分数据健康检查
  const { healthStatus } = usePointsHealthCheck(center)

  // 优化的里程碑检测逻辑
  const detectMilestones = useCallback(() => {
    if (sortedStudents.length === 0) return
    
    const now = Date.now()
    // 防重复触发：5秒内不重复显示里程碑
    if (now - lastMilestoneTimeRef.current < 5000) return
    
    const newPreviousPoints = new Map(previousPointsRef.current)
    let milestoneInfo: { student: any, milestone: number } | null = null
    
    // 使用 for...of 提前 break，找到第一个里程碑就停止
    for (const student of sortedStudents) {
      const studentId = student.student?.id
      if (!studentId) continue
      
      const currentPoints = student.current_points || 0
      const previousPointsValue = newPreviousPoints.get(studentId) || 0
      
      if (currentPoints > previousPointsValue) {
        // 使用缓存的里程碑数组
        const maxPoint = Math.max(currentPoints, previousPointsValue)
        const relevantMilestones = MILESTONE_CACHE.filter(m => m <= maxPoint + 50)
        
        const reachedMilestone = relevantMilestones.find(milestone => 
          previousPointsValue < milestone && currentPoints >= milestone
        )
        
        if (reachedMilestone) {
          milestoneInfo = { student: student.student, milestone: reachedMilestone }
          lastMilestoneTimeRef.current = now
          break // 找到第一个里程碑就停止
        }
        
        newPreviousPoints.set(studentId, currentPoints)
      }
    }
    
    // 更新引用
    previousPointsRef.current = newPreviousPoints
    
    // 显示里程碑
    if (milestoneInfo) {
      setMilestoneData(milestoneInfo)
      setShowMilestone(true)
    }
  }, [sortedStudents])

  // 里程碑检测效果
  useEffect(() => {
    detectMilestones()
  }, [detectMilestones])

  // 导航回调函数
  const goPrev = useCallback(() => {
    dispatchNavigation({ type: 'PREV', totalSlides: slides.length })
    lastManualActionRef.current = Date.now()
  }, [slides.length])

  const goNext = useCallback(() => {
    dispatchNavigation({ type: 'NEXT', totalSlides: slides.length })
    lastManualActionRef.current = Date.now()
  }, [slides.length])

  const goToSlide = useCallback((idx: number) => {
    const direction = idx > navigationState.idx ? 'right' : 'left'
    dispatchNavigation({ type: 'GOTO', idx, direction })
    lastManualActionRef.current = Date.now()
  }, [navigationState.idx])

  // 重置自动轮播定时器
  const resetAutoSlide = useCallback(() => {
    if (autoSlideIntervalRef.current) {
      clearInterval(autoSlideIntervalRef.current)
    }
    
    if (slides.length <= 1) return
    
    autoSlideIntervalRef.current = createInterval(() => {
      // 检查是否在手动操作后30秒内，如果是则不自动切换
      const now = Date.now()
      if (now - lastManualActionRef.current < 30000) return
      
      dispatchNavigation({ type: 'NEXT', totalSlides: slides.length })
    }, DISPLAY_MS)
  }, [slides.length, createInterval])

  // 自动轮播效果
  useEffect(() => {
    resetAutoSlide()
    return () => {
      if (autoSlideIntervalRef.current) {
        clearInterval(autoSlideIntervalRef.current)
      }
    }
  }, [resetAutoSlide])

  // 里程碑关闭
  const handleMilestoneClose = useCallback(() => {
    setShowMilestone(false)
    setMilestoneData(null)
  }, [])

  // 统一错误处理
  useEffect(() => {
    if (error) {
      addError(error)
    }
    if (transactionsError) {
      addError(transactionsError)
    }
  }, [error, transactionsError, addError])

  // 渲染幻灯片内容
  const renderSlide = useCallback((current: SlideData) => {
    const commonProps = {
      isBright,
      colors
    }

    switch (current.type) {
      case "student_points":
        return (
          <PageTransition currentPage={navigationState.idx} direction={navigationState.direction}>
            <StudentPointsDisplay
              data={current.data}
              currentPageIndex={navigationState.idx}
              totalStudents={sortedStudents.length}
              studentsPerPage={studentsPerPage}
              {...commonProps}
            />
          </PageTransition>
        )
      
      case "transactions":
        return (
          <PageTransition currentPage={navigationState.idx} direction={navigationState.direction}>
            <RecentTransactions 
              transactions={current.data}
              loading={transactionsLoading}
              error={transactionsError}
              isRealtime={transactionsRealtime}
            />
          </PageTransition>
        )
      
      case "birthdays":
        return (
          <PageTransition currentPage={navigationState.idx} direction={navigationState.direction}>
            <BirthdaysDisplay 
              data={current.data} 
              {...commonProps}
            />
          </PageTransition>
        )
      
      case "announcements":
        return (
          <PageTransition currentPage={navigationState.idx} direction={navigationState.direction}>
            <AnnouncementsDisplay 
              data={current.data} 
              {...commonProps}
            />
          </PageTransition>
        )
      
      default:
        return null
    }
  }, [navigationState, sortedStudents.length, studentsPerPage, isBright, colors, transactions, transactionsLoading, transactionsError, transactionsRealtime])

  // 分区加载：主数据加载中但交易数据可能已就绪
  if (!ready) {
    return <LoadingScreen center={center} />
  }

  // 统一错误处理
  if (errors.size > 0) {
    return <ErrorScreen error={Array.from(errors.values())[0]} onRetry={refreshData} />
  }

  // 没有数据
  if (slides.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">暂无数据</h2>
          <p className="text-gray-400">该中心暂无学生数据</p>
        </div>
      </div>
    )
  }

  const current = slides[navigationState.idx]

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* NFC 后台运行器 */}
      <NFCBackgroundRunner 
        center={center} 
        enabled={true}
        students={students}
        teachers={teachers}
        onCardRead={(cardData) => {
          // 处理读卡成功后的逻辑
          console.log('NFC读卡成功:', cardData)
        }}
      />
      
      {/* 安全区域布局 */}
      <SafeAreaLayout>
        <TVBoardContainer>
          {/* 标题栏 */}
          <TVBoardHeader
            center={center}
            studentCount={sortedStudents.length}
            isRealtime={true}
            onRefresh={refreshData}
            pointsHealthStatus={healthStatus}
          />

          {/* 主要内容区域 */}
          <div className="flex-1 flex flex-col px-4">
            <AnimatePresence mode="wait">
              {renderSlide(current)}
            </AnimatePresence>
          </div>

          {/* 底部导航 */}
          <div className="p-4">
            <SlideIndicators 
              currentIndex={navigationState.idx} 
              totalSlides={slides.length}
              colors={colors}
              onSlideClick={goToSlide}
            />
            <NavigationControls 
              onPrev={goPrev}
              onNext={goNext}
            />
          </div>
        </TVBoardContainer>
      </SafeAreaLayout>

      {/* 里程碑效果 */}
      {showMilestone && milestoneData && (
        <MilestoneEffect
          student={milestoneData.student}
          milestone={milestoneData.milestone}
          isVisible={showMilestone}
          onComplete={handleMilestoneClose}
        />
      )}
    </div>
  )
}