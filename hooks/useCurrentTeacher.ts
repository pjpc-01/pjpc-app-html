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
      console.log('🔍 开始获取当前教师信息:', { userId: user.id, email: user.email })
      
      // 方法1: 直接通过用户ID查找教师记录（如果教师表中有user_id字段）
      // 或者方法2: 通过用户邮箱查找（作为备选方案）
      
      // 首先尝试通过用户ID查找
      console.log('🔍 尝试通过用户ID查找教师:', user.id)
      let response = await fetch(`/api/teachers?user_id=${user.id}`)
      let data = await response.json()
      console.log('📋 通过用户ID查找结果:', data)
      
      // 如果通过用户ID找不到，则通过邮箱查找
      if (!data.success || !data.data?.items || data.data.items.length === 0) {
        console.log('🔍 通过用户ID未找到，尝试通过邮箱查找:', user.email)
        response = await fetch(`/api/teachers?email=${encodeURIComponent(user.email)}`)
        data = await response.json()
        console.log('📋 通过邮箱查找结果:', data)
      }
      
      if (data.success && data.data?.items && data.data.items.length > 0) {
        const teacherData = data.data.items[0]
        console.log('✅ 找到教师信息:', teacherData)
        setTeacher(teacherData)
        setError(null)
      } else {
        console.log('❌ 未找到对应的教师记录')
        setError('未找到对应的教师记录')
      }
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
