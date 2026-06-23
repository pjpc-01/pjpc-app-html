import { useState, useEffect, useCallback } from 'react'
import { NfcCard } from '@/types/points'

export const useNfcCards = () => {
  const [cards, setCards] = useState<NfcCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/nfc-cards?perPage=200')
      const json = await res.json()
      if (json.success) {
        setCards(json.data.items || [])
      } else {
        setCards([])
        setError(json.error || '获取数据失败')
      }
    } catch (err) {
      console.error('获取 NFC 卡片失败:', err)
      setCards([])
      setError('获取 NFC 卡片失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  // 按 card_uid 查找卡片
  const findByUid = useCallback((cardUid: string) => {
    return cards.find(c => c.card_uid === cardUid) || null
  }, [cards])

  // 按学生查找卡片
  const findByStudent = useCallback((studentId: string) => {
    return cards.filter(c => c.studentId === studentId)
  }, [cards])

  // 创建卡片
  const createCard = useCallback(async (data: {
    card_uid: string
    studentId?: string
    type?: string
    notes?: string
  }) => {
    try {
      const res = await fetch('/api/nfc-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || '创建卡片失败')
      await fetchCards()
      return json.data
    } catch (err) {
      setError('创建卡片失败')
      throw err
    }
  }, [fetchCards])

  // 更新卡片
  const updateCard = useCallback(async (id: string, updates: {
    status?: string
    studentId?: string
    notes?: string
  }) => {
    try {
      const res = await fetch('/api/nfc-cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || '更新卡片失败')
      await fetchCards()
      return json.data
    } catch (err) {
      setError('更新卡片失败')
      throw err
    }
  }, [fetchCards])

  // 根据 card_uid 获取学生信息（NFC 考勤用）
  const getStudentByCardUid = useCallback(async (cardUid: string) => {
    // 先在本地缓存中查找
    const local = cards.find(c => c.card_uid === cardUid && c.status === 'active')
    if (local && local.expand?.studentId) {
      return local.expand.studentId
    }
    // 通过 API 查找
    try {
      const res = await fetch(`/api/nfc-cards?card_uid=${encodeURIComponent(cardUid)}`)
      const json = await res.json()
      if (json.success && json.data?.items?.length > 0) {
        const card = json.data.items[0]
        return card.expand?.studentId || null
      }
    } catch { /* ignore */ }
    return null
  }, [cards])

  return {
    cards,
    loading,
    error,
    findByUid,
    findByStudent,
    createCard,
    updateCard,
    getStudentByCardUid,
    refetch: fetchCards,
  }
}
