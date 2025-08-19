import { useState, useEffect, useCallback } from 'react'
import { 
  StudentCard, 
  getAllStudentCards, 
  createStudentCard, 
  updateStudentCard, 
  deleteStudentCard, 
  searchStudentCards,
  getStudentCardStats,
  updateCardUsage,
  getStudentCardsByLevel,
  batchCreateStudentCards
} from '@/lib/pocketbase-students-card'

export const useStudentCards = () => {
  const [cards, setCards] = useState<StudentCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalCards: 0,
    primaryCards: 0,
    secondaryCards: 0,
    activeCards: 0,
    inactiveCards: 0,
    lostCards: 0,
    graduatedCards: 0,
    totalBalance: 0,
    totalUsageCount: 0
  })

  // 获取所有学生卡片
  const fetchCards = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 使用服务器端 API 获取数据
      const response = await fetch('/api/student-cards/list')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '获取学生卡片失败')
      }
      
      setCards(result.cards)
      console.log(`成功获取 ${result.count} 个学生卡片`)
    } catch (err) {
      console.error('获取学生卡片失败:', err)
      setError(err instanceof Error ? err.message : '获取学生卡片失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 根据级别获取学生卡片
  const fetchCardsByLevel = useCallback(async (level: 'primary' | 'secondary') => {
    try {
      setLoading(true)
      setError(null)
      const fetchedCards = await getStudentCardsByLevel(level)
      setCards(fetchedCards)
    } catch (err) {
      console.error('根据级别获取学生卡片失败:', err)
      setError(err instanceof Error ? err.message : '获取学生卡片失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 搜索学生卡片
  const searchCards = useCallback(async (query: string) => {
    try {
      setLoading(true)
      setError(null)
      const searchResults = await searchStudentCards(query)
      setCards(searchResults)
    } catch (err) {
      console.error('搜索学生卡片失败:', err)
      setError(err instanceof Error ? err.message : '搜索失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 获取统计信息
  const fetchStats = useCallback(async () => {
    try {
      const fetchedStats = await getStudentCardStats()
      setStats(fetchedStats)
    } catch (err) {
      console.error('获取统计信息失败:', err)
      setError(err instanceof Error ? err.message : '获取统计信息失败')
    }
  }, [])

  // 添加学生卡片
  const addCard = useCallback(async (cardData: Omit<StudentCard, 'id' | 'created' | 'updated'>) => {
    try {
      setLoading(true)
      setError(null)
      const newCard = await createStudentCard(cardData)
      setCards(prev => [newCard, ...prev])
      await fetchStats()
      return newCard
    } catch (err) {
      console.error('添加学生卡片失败:', err)
      setError(err instanceof Error ? err.message : '添加失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchStats])

  // 批量导入学生卡片
  const batchImportCards = useCallback(async (cardsData: Omit<StudentCard, 'id' | 'created' | 'updated'>[]) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('开始批量导入学生卡片...')
      
      // 使用简化的服务器端 API 进行批量创建
      const response = await fetch('/api/student-cards/batch-create-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cards: cardsData })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '批量创建失败')
      }
      
      if (result.failed > 0) {
        console.warn(`批量导入完成，但有 ${result.failed} 个记录失败:`, result.errors)
      }
      
      // 更新本地状态
      setCards(prev => [...result.cards, ...prev])
      await fetchStats()
      
      console.log(`成功导入 ${result.created} 个学生卡片`)
      return result.cards
    } catch (err) {
      console.error('批量导入学生卡片失败:', err)
      setError(err instanceof Error ? err.message : '批量导入失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchStats])

  // 更新学生卡片
  const updateCard = useCallback(async (id: string, updates: Partial<StudentCard>) => {
    try {
      setLoading(true)
      setError(null)
      const updatedCard = await updateStudentCard(id, updates)
      setCards(prev => prev.map(card => 
        card.id === id ? updatedCard : card
      ))
      await fetchStats()
      return updatedCard
    } catch (err) {
      console.error('更新学生卡片失败:', err)
      setError(err instanceof Error ? err.message : '更新失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchStats])

  // 删除学生卡片
  const removeCard = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      await deleteStudentCard(id)
      setCards(prev => prev.filter(card => card.id !== id))
      await fetchStats()
    } catch (err) {
      console.error('删除学生卡片失败:', err)
      setError(err instanceof Error ? err.message : '删除失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchStats])

  // 更新卡片使用记录
  const updateUsage = useCallback(async (id: string, currentUsageCount: number) => {
    try {
      const updatedCard = await updateCardUsage(id, currentUsageCount)
      setCards(prev => prev.map(card => 
        card.id === id ? updatedCard : card
      ))
      return updatedCard
    } catch (err) {
      console.error('更新使用记录失败:', err)
      setError(err instanceof Error ? err.message : '更新使用记录失败')
      throw err
    }
  }, [])

  // 访问学生网址
  const accessStudentUrl = useCallback(async (studentId: string, level: 'primary' | 'secondary') => {
    try {
      const card = cards.find(c => c.studentId === studentId && c.level === level)
      if (!card) {
        throw new Error('学生卡片不存在')
      }

      // 更新使用记录
      if (card.id) {
        await updateUsage(card.id, card.usageCount || 0)
      }

      return {
        success: true,
        url: card.studentUrl,
        studentName: card.studentName,
        studentId: card.studentId
      }
    } catch (err) {
      console.error('访问学生网址失败:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : '访问失败'
      }
    }
  }, [cards, updateUsage])

  // 初始化数据
  useEffect(() => {
    fetchCards()
    fetchStats()
  }, [fetchCards, fetchStats])

  return {
    cards,
    loading,
    error,
    stats,
    fetchCards,
    fetchCardsByLevel,
    searchCards,
    addCard,
    batchImportCards,
    updateCard,
    removeCard,
    updateUsage,
    accessStudentUrl,
    fetchStats
  }
}
