import { useState, useEffect, useCallback } from 'react'
import { StudentPoints, PointTransaction, PointTransactionCreateData, TeacherWithNFC } from '@/types/points'

export const usePoints = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取学生积分信息
  const getStudentPoints = useCallback(async (studentId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/points?student_id=${studentId}`)
      if (!response.ok) {
        throw new Error('获取学生积分失败')
      }
      const data = await response.json()
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 验证教师NFC卡
  const validateTeacherNFC = useCallback(async (nfcCardNumber: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/points?teacher_nfc_card=${nfcCardNumber}`)
      if (!response.ok) {
        throw new Error('教师NFC卡验证失败')
      }
      const data = await response.json()
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 获取积分排行榜
  const getPointsLeaderboard = useCallback(async (page = 1, perPage = 50) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/points?page=${page}&per_page=${perPage}`)
      if (!response.ok) {
        throw new Error('获取积分排行榜失败')
      }
      const data = await response.json()
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 创建积分交易
  const createPointTransaction = useCallback(async (transactionData: PointTransactionCreateData) => {
    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      Object.entries(transactionData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            formData.append(key, value)
          } else {
            formData.append(key, value.toString())
          }
        }
      })

      const response = await fetch('/api/points', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        let errorMessage = '创建积分交易失败'
        let errorData = null
        
        try {
          const responseText = await response.text()
          console.error('API错误响应文本:', responseText)
          
          if (responseText) {
            errorData = JSON.parse(responseText)
            console.error('API错误响应对象:', errorData)
            errorMessage = errorData.error || errorData.details || errorMessage
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText} (空响应)`
          }
        } catch (parseError) {
          console.error('无法解析错误响应:', parseError)
          errorMessage = `HTTP ${response.status}: ${response.statusText} (解析失败)`
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    getStudentPoints,
    validateTeacherNFC,
    getPointsLeaderboard,
    createPointTransaction
  }
}
