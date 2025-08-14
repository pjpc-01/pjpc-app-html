// NFC/RFID功能已迁移到PocketBase
console.log('NFC/RFID功能已迁移到PocketBase')

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

// NFC/RFID 管理系统类 - 已迁移到PocketBase
export class NFCManager {
  constructor(collectionName: string = 'nfc_cards') {
    console.log('NFC/RFID功能已迁移到PocketBase，当前为占位实现')
  }

  // 所有方法返回空数据或抛出错误，表示功能已迁移
  async addCard(cardData: Omit<NFCCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<NFCCard> {
    throw new Error('NFC/RFID功能已迁移到PocketBase，请使用PocketBase API')
  }

  async getAllCards(): Promise<NFCCard[]> {
    console.log('NFC/RFID功能已迁移到PocketBase，getAllCards返回空数组')
    return []
  }

  async getCardByStudentId(studentId: string): Promise<NFCCard | null> {
    throw new Error('NFC/RFID功能已迁移到PocketBase，请使用PocketBase API')
  }

  async getCardByNumber(cardNumber: string): Promise<NFCCard | null> {
    throw new Error('NFC/RFID功能已迁移到PocketBase，请使用PocketBase API')
  }

  async updateCard(cardId: string, updates: Partial<NFCCard>): Promise<void> {
    throw new Error('NFC/RFID功能已迁移到PocketBase，请使用PocketBase API')
  }

  async deleteCard(cardId: string): Promise<void> {
    throw new Error('NFC/RFID功能已迁移到PocketBase，请使用PocketBase API')
  }

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
    throw new Error('NFC/RFID功能已迁移到PocketBase，请使用PocketBase API')
  }

  async getAttendanceRecords(
    studentId?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
    deviceType?: string
  ): Promise<AttendanceRecord[]> {
    console.log('NFC/RFID功能已迁移到PocketBase，getAttendanceRecords返回空数组')
    return []
  }

  async addDevice(deviceData: Omit<NFCDevice, 'id'>): Promise<NFCDevice> {
    throw new Error('NFC/RFID功能已迁移到PocketBase，请使用PocketBase API')
  }

  async getAllDevices(): Promise<NFCDevice[]> {
    console.log('NFC/RFID功能已迁移到PocketBase，getAllDevices返回空数组')
    return []
  }

  async updateDevice(deviceId: string, updates: Partial<NFCDevice>): Promise<void> {
    throw new Error('NFC/RFID功能已迁移到PocketBase，请使用PocketBase API')
  }

  async simulateCardRead(deviceId: string): Promise<string | null> {
    console.log('NFC/RFID功能已迁移到PocketBase，simulateCardRead返回null')
    return null
  }

  async getStats(): Promise<{
    totalCards: number
    activeCards: number
    todayAttendance: number
    deviceCount: number
    onlineDevices: number
  }> {
    console.log('NFC/RFID功能已迁移到PocketBase，getStats返回零值')
    return {
      totalCards: 0,
      activeCards: 0,
      todayAttendance: 0,
      deviceCount: 0,
      onlineDevices: 0
    }
  }
}

// 导出默认实例
export const nfcManager = new NFCManager() 