import { useMemo, useCallback } from 'react'
import { useTVBoardData } from './useTVBoardData'
import { useStudentPoints } from './useStudentPoints'
import { useBirthdaySlides } from './useBirthdaySlides'
import { useSlides } from './useSlides'
import { useResponsiveScale } from './useResponsiveScale'

/**
 * 优化的数据管理Hook
 * 减少不必要的重新计算和渲染
 */

// 每页显示学生数量配置表
const STUDENTS_PER_PAGE = {
  mobile: 8,
  tablet: 12,
  desktop: 18,
  tv: 27
} as const

export function useOptimizedData(center: string) {
  const { 
    announcements, 
    students, 
    points, 
    transactions,
    ready, 
    lastUpdate, 
    isRealtime, 
    error,
    refetch 
  } = useTVBoardData(center)
  
  const { isMobile, isTablet, isDesktop } = useResponsiveScale()

  // 错误处理：提供安全的默认数据
  const safeAnnouncements = announcements || []
  const safeStudents = students || []
  const safePoints = points || []
  const safeTransactions = transactions || []

  // 缓存每页显示数量 - 使用配置表，更易维护
  const studentsPerPage = useMemo(() => {
    if (isMobile) return STUDENTS_PER_PAGE.mobile
    if (isTablet) return STUDENTS_PER_PAGE.tablet
    if (isDesktop) return STUDENTS_PER_PAGE.desktop
    return STUDENTS_PER_PAGE.tv
  }, [isMobile, isTablet, isDesktop])

  // 学生积分数据处理 - 使用安全数据
  const sortedStudents = useStudentPoints(safeStudents, safePoints, center)
  
  // 调试信息
  console.log('useOptimizedData 调试:', {
    safeStudentsLength: safeStudents.length,
    safePointsLength: safePoints.length,
    sortedStudentsLength: sortedStudents.length,
    center: center,
    safeStudentsSample: safeStudents.slice(0, 2),
    safePointsSample: safePoints.slice(0, 2)
  })
  
  // 生日数据处理 - 使用安全数据
  const monthBirthdays = useBirthdaySlides(safeStudents, center, safePoints)

  // 幻灯片数据处理 - 使用安全数据和优化的每页数量
  const slides = useSlides(sortedStudents, monthBirthdays, safeAnnouncements, safeTransactions, studentsPerPage)
  
  // 调试信息
  console.log('useOptimizedData 幻灯片调试:', {
    slidesLength: slides.length,
    slideTypes: slides.map(s => s.type),
    studentPointsSlides: slides.filter(s => s.type === 'student_points').length,
    slidesSample: slides.slice(0, 2)
  })

  // 缓存数据统计信息 - 依赖整个数组确保数据更新时同步
  const dataStats = useMemo(() => ({
    studentsCount: sortedStudents.length,
    pointsCount: safePoints.length,
    announcementsCount: safeAnnouncements.length,
    transactionsCount: safeTransactions.length,
    slidesCount: slides.length,
    lastUpdate: lastUpdate?.toISOString() || null,
    hasError: !!error
  }), [sortedStudents, safePoints, safeAnnouncements, safeTransactions, slides, lastUpdate, error])

  // 优化的数据刷新函数 - 只刷新数据，不reload整页
  const refreshData = useCallback(async () => {
    try {
      console.log('[useOptimizedData] 开始刷新数据...')
      await refetch()
      console.log('[useOptimizedData] 数据刷新完成')
    } catch (error) {
      console.error('[useOptimizedData] 数据刷新失败:', error)
    }
  }, [refetch])

  const result = {
    // 原始数据（安全版本）
    announcements: safeAnnouncements,
    students: safeStudents,
    points: safePoints,
    transactions: safeTransactions,
    ready,
    lastUpdate,
    isRealtime,
    error,
    
    // 处理后的数据
    sortedStudents,
    monthBirthdays,
    slides,
    studentsPerPage,
    
    // 统计信息
    dataStats,
    
    // 功能函数
    refreshData
  }
  
  // 调试信息
  console.log('useOptimizedData 最终结果:', {
    sortedStudentsLength: result.sortedStudents.length,
    slidesLength: result.slides.length,
    ready: result.ready,
    error: result.error,
    slidesSample: result.slides.slice(0, 2)
  })
  
  return result
}