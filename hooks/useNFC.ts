import { useState, useEffect, useCallback } from 'react'
import { nfcManager, NFCCard, AttendanceRecord, NFCDevice } from '@/lib/nfc-rfid'

export const useNFC = () => {
  const [cards, setCards] = useState<NFCCard[]>([])
  const [devices, setDevices] = useState<NFCDevice[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalCards: 0,
    activeCards: 0,
    todayAttendance: 0,
    deviceCount: 0,
    onlineDevices: 0,
  })

  // 获取所有卡
  const fetchCards = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedCards = await nfcManager.getAllCards()
      setCards(fetchedCards)
    } catch (err) {
      console.error('Error fetching cards:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch cards')
    } finally {
      setLoading(false)
    }
  }, [])

  // 获取所有设备
  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedDevices = await nfcManager.getAllDevices()
      setDevices(fetchedDevices)
    } catch (err) {
      console.error('Error fetching devices:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch devices')
    } finally {
      setLoading(false)
    }
  }, [])

  // 获取打卡记录
  const fetchAttendanceRecords = useCallback(async (
    studentId?: string,
    startDate?: Date,
    endDate?: Date
  ) => {
    try {
      setLoading(true)
      setError(null)
      const records = await nfcManager.getAttendanceRecords(studentId, startDate, endDate)
      setAttendanceRecords(records)
    } catch (err) {
      console.error('Error fetching attendance records:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance records')
    } finally {
      setLoading(false)
    }
  }, [])

  // 获取统计信息
  const fetchStats = useCallback(async () => {
    try {
      const fetchedStats = await nfcManager.getStats()
      setStats(fetchedStats)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
    }
  }, [])

  // 添加新卡
  const addCard = useCallback(async (cardData: Omit<NFCCard, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true)
      setError(null)
      const newCard = await nfcManager.addCard(cardData)
      setCards(prev => [newCard, ...prev])
      await fetchStats()
      return newCard
    } catch (err) {
      console.error('Error adding card:', err)
      setError(err instanceof Error ? err.message : 'Failed to add card')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchStats])

  // 更新卡
  const updateCard = useCallback(async (cardId: string, updates: Partial<NFCCard>) => {
    try {
      setLoading(true)
      setError(null)
      await nfcManager.updateCard(cardId, updates)
      setCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, ...updates } : card
      ))
      await fetchStats()
    } catch (err) {
      console.error('Error updating card:', err)
      setError(err instanceof Error ? err.message : 'Failed to update card')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchStats])

  // 删除卡
  const deleteCard = useCallback(async (cardId: string) => {
    try {
      setLoading(true)
      setError(null)
      await nfcManager.deleteCard(cardId)
      setCards(prev => prev.filter(card => card.id !== cardId))
      await fetchStats()
    } catch (err) {
      console.error('Error deleting card:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete card')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchStats])

  // 添加设备
  const addDevice = useCallback(async (deviceData: Omit<NFCDevice, 'id'>) => {
    try {
      setLoading(true)
      setError(null)
      const newDevice = await nfcManager.addDevice(deviceData)
      setDevices(prev => [newDevice, ...prev])
      await fetchStats()
      return newDevice
    } catch (err) {
      console.error('Error adding device:', err)
      setError(err instanceof Error ? err.message : 'Failed to add device')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchStats])

  // 更新设备
  const updateDevice = useCallback(async (deviceId: string, updates: Partial<NFCDevice>) => {
    try {
      setLoading(true)
      setError(null)
      await nfcManager.updateDevice(deviceId, updates)
      setDevices(prev => prev.map(device => 
        device.id === deviceId ? { ...device, ...updates } : device
      ))
      await fetchStats()
    } catch (err) {
      console.error('Error updating device:', err)
      setError(err instanceof Error ? err.message : 'Failed to update device')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchStats])

  // 处理打卡
  const processAttendance = useCallback(async (
    cardNumber: string,
    deviceId: string,
    deviceName: string,
    location: string
  ) => {
    try {
      setLoading(true)
      setError(null)
      const record = await nfcManager.processAttendance(cardNumber, deviceId, deviceName, location)
      setAttendanceRecords(prev => [record, ...prev])
      await fetchStats()
      return record
    } catch (err) {
      console.error('Error processing attendance:', err)
      setError(err instanceof Error ? err.message : 'Failed to process attendance')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchStats])

  // 模拟打卡
  const simulateAttendance = useCallback(async (deviceId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // 模拟读取卡号
      const cardNumber = await nfcManager.simulateCardRead(deviceId)
      if (!cardNumber) {
        throw new Error('No card detected')
      }

      // 获取设备信息
      const device = devices.find(d => d.id === deviceId)
      if (!device) {
        throw new Error('Device not found')
      }

      // 处理打卡
      const record = await processAttendance(cardNumber, deviceId, device.name, device.location)
      return record
    } catch (err) {
      console.error('Error simulating attendance:', err)
      setError(err instanceof Error ? err.message : 'Failed to simulate attendance')
      throw err
    } finally {
      setLoading(false)
    }
  }, [devices, processAttendance])

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // URL访问功能
  const accessStudentUrl = useCallback(async (studentId: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await nfcManager.accessStudentUrl(studentId)
      return result
    } catch (err) {
      console.error('Error accessing student URL:', err)
      setError(err instanceof Error ? err.message : 'Failed to access student URL')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getStudentUrl = useCallback(async (studentId: string) => {
    try {
      setError(null)
      const url = await nfcManager.getStudentUrl(studentId)
      return url
    } catch (err) {
      console.error('Error getting student URL:', err)
      setError(err instanceof Error ? err.message : 'Failed to get student URL')
      throw err
    }
  }, [])

  const updateStudentUrl = useCallback(async (studentId: string, newUrl: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await nfcManager.updateStudentUrl(studentId, newUrl)
      if (result) {
        // 更新本地卡片数据
        setCards(prev => prev.map(card => 
          card.studentId === studentId 
            ? { ...card, studentUrl: newUrl, updatedAt: new Date() }
            : card
        ))
      }
      return result
    } catch (err) {
      console.error('Error updating student URL:', err)
      setError(err instanceof Error ? err.message : 'Failed to update student URL')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchCards(),
          fetchDevices(),
          fetchStats(),
        ])
      } catch (err) {
        console.error('Error initializing NFC data:', err)
      }
    }

    initializeData()
  }, [fetchCards, fetchDevices, fetchStats])

  return {
    // 数据
    cards,
    devices,
    attendanceRecords,
    stats,
    loading,
    error,
    
    // 操作
    fetchCards,
    fetchDevices,
    fetchAttendanceRecords,
    fetchStats,
    addCard,
    updateCard,
    deleteCard,
    addDevice,
    updateDevice,
    processAttendance,
    simulateAttendance,
    clearError,
    
    // URL功能
    accessStudentUrl,
    getStudentUrl,
    updateStudentUrl,
  }
} 