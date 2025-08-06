import { db } from './firebase'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'

// NFC/RFID 卡信息接口
export interface NFCCard {
  id: string
  cardNumber: string // 卡号
  studentId: string // 关联的学生ID
  studentName: string // 学生姓名
  cardType: 'NFC' | 'RFID' // 卡类型
  status: 'active' | 'inactive' | 'lost' | 'replaced' // 卡状态
  issuedDate: Date // 发卡日期
  expiryDate?: Date // 过期日期
  lastUsed?: Date // 最后使用时间
  usageCount: number // 使用次数
  notes?: string // 备注
  createdAt: Date
  updatedAt: Date
}

// 打卡记录接口
export interface AttendanceRecord {
  id: string
  cardNumber: string // 卡号
  studentId: string // 学生ID
  studentName: string // 学生姓名
  timestamp: Date // 打卡时间
  location: string // 打卡地点
  deviceId: string // 设备ID
  deviceName: string // 设备名称
  type: 'check_in' | 'check_out' | 'break_start' | 'break_end' // 打卡类型
  status: 'success' | 'failed' | 'duplicate' // 打卡状态
  notes?: string // 备注
}

// 设备信息接口
export interface NFCDevice {
  id: string
  name: string // 设备名称
  location: string // 设备位置
  deviceType: 'NFC' | 'RFID' | 'hybrid' // 设备类型
  status: 'online' | 'offline' | 'maintenance' // 设备状态
  lastActivity?: Date // 最后活动时间
  cardCount: number // 今日打卡次数
  errorCount: number // 错误次数
  ipAddress?: string // IP地址
  macAddress?: string // MAC地址
  firmwareVersion?: string // 固件版本
  notes?: string // 备注
}

// NFC/RFID 管理系统类
export class NFCManager {
  private collectionName: string

  constructor(collectionName: string = 'nfc_cards') {
    this.collectionName = collectionName
  }

  // 添加新卡
  async addCard(cardData: Omit<NFCCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<NFCCard> {
    try {
      const cardRef = doc(collection(db, this.collectionName))
      const newCard: NFCCard = {
        ...cardData,
        id: cardRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      await setDoc(cardRef, newCard)
      return newCard
    } catch (error) {
      console.error('Error adding NFC card:', error)
      throw new Error('Failed to add NFC card')
    }
  }

  // 获取所有卡
  async getAllCards(): Promise<NFCCard[]> {
    try {
      const cardsRef = collection(db, this.collectionName)
      const q = query(cardsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        issuedDate: doc.data().issuedDate?.toDate(),
        expiryDate: doc.data().expiryDate?.toDate(),
        lastUsed: doc.data().lastUsed?.toDate(),
      })) as NFCCard[]
    } catch (error) {
      console.error('Error getting NFC cards:', error)
      throw new Error('Failed to get NFC cards')
    }
  }

  // 根据学生ID获取卡
  async getCardByStudentId(studentId: string): Promise<NFCCard | null> {
    try {
      const cardsRef = collection(db, this.collectionName)
      const q = query(cardsRef, where('studentId', '==', studentId))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) return null
      
      const doc = querySnapshot.docs[0]
      return {
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        issuedDate: doc.data().issuedDate?.toDate(),
        expiryDate: doc.data().expiryDate?.toDate(),
        lastUsed: doc.data().lastUsed?.toDate(),
      } as NFCCard
    } catch (error) {
      console.error('Error getting NFC card by student ID:', error)
      throw new Error('Failed to get NFC card')
    }
  }

  // 根据卡号获取卡
  async getCardByNumber(cardNumber: string): Promise<NFCCard | null> {
    try {
      console.log(`Looking for card: ${cardNumber} in collection: ${this.collectionName}`)
      const cardsRef = collection(db, this.collectionName)
      const q = query(cardsRef, where('cardNumber', '==', cardNumber))
      const querySnapshot = await getDocs(q)
      
      console.log(`Found ${querySnapshot.size} cards with number: ${cardNumber}`)
      if (querySnapshot.empty) return null
      
      const doc = querySnapshot.docs[0]
      return {
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        issuedDate: doc.data().issuedDate?.toDate(),
        expiryDate: doc.data().expiryDate?.toDate(),
        lastUsed: doc.data().lastUsed?.toDate(),
      } as NFCCard
    } catch (error) {
      console.error('Error getting NFC card by number:', error)
      throw new Error('Failed to get NFC card')
    }
  }

  // 更新卡信息
  async updateCard(cardId: string, updates: Partial<NFCCard>): Promise<void> {
    try {
      const cardRef = doc(db, this.collectionName, cardId)
      await updateDoc(cardRef, {
        ...updates,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error('Error updating NFC card:', error)
      throw new Error('Failed to update NFC card')
    }
  }

  // 删除卡
  async deleteCard(cardId: string): Promise<void> {
    try {
      const cardRef = doc(db, this.collectionName, cardId)
      await deleteDoc(cardRef)
    } catch (error) {
      console.error('Error deleting NFC card:', error)
      throw new Error('Failed to delete NFC card')
    }
  }

  // 处理打卡
  async processAttendance(
    cardNumber: string, 
    deviceId: string, 
    deviceName: string, 
    location: string,
    deviceInfo?: {
      deviceType: 'RFID' | 'NFC'
      frequency: string
      uid: string
    }
  ): Promise<AttendanceRecord> {
    try {
      // 获取卡信息
      const card = await this.getCardByNumber(cardNumber)
      if (!card) {
        throw new Error('Card not found')
      }

      if (card.status !== 'active') {
        throw new Error('Card is not active')
      }

      // 验证设备类型与卡类型匹配
      if (deviceInfo) {
        if (deviceInfo.deviceType === 'RFID' && card.cardType !== 'RFID') {
          throw new Error('RFID device cannot read NFC card')
        }
        if (deviceInfo.deviceType === 'NFC' && card.cardType !== 'NFC') {
          throw new Error('NFC device cannot read RFID card')
        }
      }

      // 检查是否重复打卡（5分钟内）
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      
      const attendanceRef = collection(db, 'attendance_records')
      const q = query(
        attendanceRef,
        where('cardNumber', '==', cardNumber),
        where('timestamp', '>=', fiveMinutesAgo)
      )
      const recentRecords = await getDocs(q)
      
      if (!recentRecords.empty) {
        throw new Error('Duplicate attendance record')
      }

      // 创建打卡记录
      const recordRef = doc(collection(db, 'attendance_records'))
      const attendanceRecord: AttendanceRecord = {
        id: recordRef.id,
        cardNumber,
        studentId: card.studentId,
        studentName: card.studentName,
        timestamp: now,
        location,
        deviceId,
        deviceName,
        type: 'check_in', // 默认为签到，可以根据时间判断
        status: 'success',
        notes: `Card type: ${card.cardType}, Device type: ${deviceInfo?.deviceType || 'Unknown'}, Frequency: ${deviceInfo?.frequency || 'Unknown'}`
      }

      await setDoc(recordRef, attendanceRecord)

      // 更新卡的最后使用时间
      await this.updateCard(card.id, {
        lastUsed: now,
        usageCount: card.usageCount + 1,
      })

      return attendanceRecord
    } catch (error) {
      console.error('Error processing attendance:', error)
      throw error
    }
  }

  // 获取打卡记录
  async getAttendanceRecords(
    studentId?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
    deviceType?: string
  ): Promise<AttendanceRecord[]> {
    try {
      const recordsRef = collection(db, 'attendance_records')
      let q = query(recordsRef, orderBy('timestamp', 'desc'))

      if (studentId) {
        q = query(q, where('studentId', '==', studentId))
      }

      if (startDate) {
        q = query(q, where('timestamp', '>=', startDate))
      }

      if (endDate) {
        q = query(q, where('timestamp', '<=', endDate))
      }

      const querySnapshot = await getDocs(q)
      
      let records = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      })) as AttendanceRecord[]

      // 如果指定了设备类型，在内存中过滤
      if (deviceType) {
        records = records.filter(record => {
          const notes = record.notes || ''
          return notes.includes(`Device type: ${deviceType}`)
        })
      }

      return records.slice(0, limit)
    } catch (error) {
      console.error('Error getting attendance records:', error)
      throw new Error('Failed to get attendance records')
    }
  }

  // 设备管理
  async addDevice(deviceData: Omit<NFCDevice, 'id'>): Promise<NFCDevice> {
    try {
      const deviceRef = doc(collection(db, 'nfc_devices'))
      const newDevice: NFCDevice = {
        ...deviceData,
        id: deviceRef.id,
      }
      
      await setDoc(deviceRef, newDevice)
      return newDevice
    } catch (error) {
      console.error('Error adding NFC device:', error)
      throw new Error('Failed to add NFC device')
    }
  }

  async getAllDevices(): Promise<NFCDevice[]> {
    try {
      const devicesRef = collection(db, 'nfc_devices')
      const querySnapshot = await getDocs(devicesRef)
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        lastActivity: doc.data().lastActivity?.toDate(),
      })) as NFCDevice[]
    } catch (error) {
      console.error('Error getting NFC devices:', error)
      throw new Error('Failed to get NFC devices')
    }
  }

  async updateDevice(deviceId: string, updates: Partial<NFCDevice>): Promise<void> {
    try {
      const deviceRef = doc(db, 'nfc_devices', deviceId)
      await updateDoc(deviceRef, updates)
    } catch (error) {
      console.error('Error updating NFC device:', error)
      throw new Error('Failed to update NFC device')
    }
  }

  // 模拟硬件接口
  async simulateCardRead(deviceId: string): Promise<string | null> {
    // 模拟读取卡号
    const mockCards = ['1234567890', '0987654321', '1122334455', '5566778899']
    const randomCard = mockCards[Math.floor(Math.random() * mockCards.length)]
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    return randomCard
  }

  // 获取统计信息
  async getStats(): Promise<{
    totalCards: number
    activeCards: number
    todayAttendance: number
    deviceCount: number
    onlineDevices: number
  }> {
    try {
      const cards = await this.getAllCards()
      const devices = await this.getAllDevices()
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayRecords = await this.getAttendanceRecords(undefined, today)
      
      return {
        totalCards: cards.length,
        activeCards: cards.filter(card => card.status === 'active').length,
        todayAttendance: todayRecords.length,
        deviceCount: devices.length,
        onlineDevices: devices.filter(device => device.status === 'online').length,
      }
    } catch (error) {
      console.error('Error getting NFC stats:', error)
      throw new Error('Failed to get NFC stats')
    }
  }
}

// 导出默认实例
export const nfcManager = new NFCManager() 