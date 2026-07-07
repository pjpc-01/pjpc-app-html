import { useState, useEffect, useCallback } from 'react'
import { fetchSecureData, createRecord } from '@/lib/secure-api-client'
import { StudentPoints, PointTransaction, PointTransactionCreateData } from '@/types/points'

export const usePoints = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取学生积分
  const getStudentPoints = useCallback(async (studentId: string) => {
    try {
      setLoading(true)
      setError(null)
      // 获取积分余额
      const pointsData = await fetchSecureData<any[]>('points', {
        fullList: true,
        filter: `studentId = "${studentId}"`,
        expand: 'studentId',
      })
      const studentPoints: StudentPoints | null = (pointsData && pointsData.length > 0)
        ? { ...pointsData[0], current_points: pointsData[0].total_points || 0 }
        : null

      // 获取交易记录
      const txData = await fetchSecureData<any[]>('points_transactions', {
        fullList: true,
        sort: '-created',
        filter: `studentId = "${studentId}"`,
        expand: 'studentId,operatorId',
      })

      return {
        student_points: studentPoints,
        transactions: { items: txData || [], totalItems: txData?.length || 0 },
      }
    } catch (err) {
      console.error('获取学生积分失败:', err)
      setError('获取积分失败')
      return { student_points: null, transactions: { items: [], totalItems: 0 } }
    } finally {
      setLoading(false)
    }
  }, [])

  // 获取积分排行榜
  const getPointsLeaderboard = useCallback(async (limit = 50) => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchSecureData<any[]>('points', {
        fullList: true,
        sort: '-total_points',
        expand: 'studentId',
      })
      const items = (data || []).slice(0, limit).map((item: any) => ({
        ...item,
        student_id: Array.isArray(item.studentId) ? item.studentId[0] : item.studentId,
        current_points: item.total_points || 0,
      }))
      return { items, totalItems: items.length }
    } catch (err) {
      console.error('获取排行榜失败:', err)
      setError('获取排行榜失败')
      return { items: [], totalItems: 0 }
    } finally {
      setLoading(false)
    }
  }, [])

  // 创建积分交易
  const createPointTransaction = useCallback(async (data: PointTransactionCreateData) => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await result.json()
      if (!json.success) throw new Error(json.error || '操作失败')
      return json.data
    } catch (err) {
      console.error('积分操作失败:', err)
      setError('积分操作失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 批量创建积分（给多个学生）
  const bulkCreateTransactions = useCallback(async (transactions: PointTransactionCreateData[]) => {
    const results = []
    for (const tx of transactions) {
      try {
        const result = await createPointTransaction(tx)
        results.push({ success: true, data: result })
      } catch (err) {
        results.push({ success: false, error: err })
      }
    }
    return results
  }, [createPointTransaction])

  return {
    loading,
    error,
    getStudentPoints,
    getPointsLeaderboard,
    createPointTransaction,
    bulkCreateTransactions,
  }
}
