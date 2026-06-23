// 📚 课程管理 Hook — 使用真实 PB API 数据
// 替代原来的全部 mock 数据

import { useState, useEffect, useCallback } from 'react'
import {
  Course,
  CourseCreateData,
  CourseUpdateData,
  getAllCourses,
  createCourse as createCourseApi,
  updateCourse as updateCourseApi,
  deleteCourse as deleteCourseApi,
  buildClassGroups,
  fetchTeachers,
  ClassGroup,
} from '@/lib/pocketbase-courses'

export type { Course, ClassGroup, CourseCreateData, CourseUpdateData }

// ============================================================
// useCourses — 课程列表 CRUD
// ============================================================

export function useCourses(teacherId?: string) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getAllCourses({ teacher_id: teacherId })
      setCourses(result.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取课程列表失败')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const createCourse = useCallback(async (data: CourseCreateData) => {
    try {
      const newCourse = await createCourseApi(data)
      await fetchCourses() // 刷新列表
      return newCourse
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '创建课程失败')
    }
  }, [fetchCourses])

  const updateCourse = useCallback(async (id: string, data: CourseUpdateData) => {
    try {
      const updated = await updateCourseApi(id, data)
      await fetchCourses()
      return updated
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '更新课程失败')
    }
  }, [fetchCourses])

  const deleteCourse = useCallback(async (id: string) => {
    try {
      await deleteCourseApi(id)
      await fetchCourses()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '删除课程失败')
    }
  }, [fetchCourses])

  return {
    courses,
    loading,
    error,
    refetch: fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
  }
}

// ============================================================
// useCourseStats — 课程统计
// ============================================================

export function useCourseStats() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalStudents: 0,
    subjectDistribution: {} as Record<string, number>,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getAllCourses()
      const items = result.items

      const subjectDist: Record<string, number> = {}
      for (const c of items) {
        const subj = c.subject || '未分类'
        subjectDist[subj] = (subjectDist[subj] || 0) + 1
      }

      setStats({
        totalCourses: items.length,
        activeCourses: items.filter(c => c.status === 'active').length,
        totalStudents: 0, // 暂无学生关联数据
        subjectDistribution: subjectDist,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取统计失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}

// ============================================================
// useClassGroups — 班级分组（course + grade_level）
// ============================================================

export function useClassGroups() {
  const [groups, setGroups] = useState<ClassGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getAllCourses()
      const teacherMap = await fetchTeachers()
      const classGroups = buildClassGroups(result.items, teacherMap)
      setGroups(classGroups)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取班级分组失败')
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  return { groups, loading, error, refetch: fetchGroups }
}
