import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/pocketbase-auth-context'

interface Teacher {
  id: string
  name: string
  email: string
  phone?: string
  position?: string
  department?: string
  status?: string
}

export function useCurrentTeacher() {
  const { user } = useAuth()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentTeacher = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // 方法1: 直接通过用户ID查找教师记录（如果教师表中有user_id字段）
      // 或者方法2: 通过用户邮箱查找（作为备选方案）
      
      // 首先尝试通过用户ID查找
      let response = await fetch(`/api/teachers?user_id=${user.id}`)
      let data = await response.json()
      
      // 如果通过用户ID找不到，则通过邮箱查找
      if (!data.success || data.data.items.length === 0) {
        response = await fetch(`/api/teachers?email=${encodeURIComponent(user.email)}`)
        data = await response.json()
      }
      
      if (data.success && data.data.items.length > 0) {
        setTeacher(data.data.items[0])
      } else {
        setError('未找到对应的教师记录')
      }
    } catch (err) {
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
