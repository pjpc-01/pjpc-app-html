import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/pocketbase-auth-context'

interface Teacher {
  id: string
  name?: string
  teacher_name?: string
  email?: string
  phone?: string
  position?: string
  department?: string
  status?: string
  avatar?: string
  teacherUrl?: string
  cardNumber?: string
  center_assignment?: string
}

export function useCurrentTeacher() {
  const { user } = useAuth()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentTeacher = async () => {
    if (!user?.id) {
      console.log('❌ 用户ID不存在，无法获取教师信息')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('🔍 开始获取当前教师信息:', { userId: user.id, email: user.email, teacher_id: user.teacher_id })
      
      // NFC 登录的用户有 teacher_id 字段 — 直接按 ID 查
      if (user.teacher_id) {
        console.log('🔍 NFC 用户，直接按 teacher_id 查找:', user.teacher_id)
        const response = await fetch(`/api/teachers?id=${encodeURIComponent(user.teacher_id)}`)
        const data = await response.json()
        console.log('📋 按 teacher_id 查找结果:', data)
        
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const teacherData = data.data[0]
          console.log('✅ 找到教师信息:', teacherData)
          setTeacher(teacherData)
          setError(null)
          setLoading(false)
          return
        }
      }
      
      // Fallback: 按邮箱查找
      if (user.email) {
        console.log('🔍 按邮箱查找教师:', user.email)
        const response = await fetch(`/api/teachers?email=${encodeURIComponent(user.email)}`)
        const data = await response.json()
        console.log('📋 按邮箱查找结果:', data)
        
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const teacherData = data.data[0]
          console.log('✅ 找到教师信息:', teacherData)
          setTeacher(teacherData)
          setError(null)
          setLoading(false)
          return
        }
      }
      
      console.log('❌ 未找到对应的教师记录')
      setError('未找到对应的教师记录，请联系管理员创建教师档案')
    } catch (err) {
      console.error('❌ 获取教师信息失败:', err)
      setError(err instanceof Error ? err.message : '获取教师信息失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrentTeacher()
  }, [user?.id, user?.email])

  return {
    teacher,
    loading,
    error,
    refetch: fetchCurrentTeacher
  }
}
