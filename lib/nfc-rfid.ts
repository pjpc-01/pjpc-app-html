// NFC/RFID 统一打卡系统
// 支持NFC和RFID两种技术，包含读写功能和企业级特性

// 卡片信息接口
export interface NFCCard {
  id: string
  cardNumber: string // 卡号/UID
  studentId: string // 关联的学生ID
  studentName: string // 学生姓名
  cardType: 'NFC' | 'RFID' // 卡类型
  frequency: '13.56MHz' | '125KHz' | '433MHz' // 频率
  status: 'active' | 'inactive' | 'lost' | 'replaced' // 卡状态
  issuedDate: Date // 发卡日期
  expiryDate?: Date // 过期日期
  lastUsed?: Date // 最后使用时间
  usageCount: number // 使用次数
  balance?: number // 余额（如果支持）
  notes?: string // 备注
  createdAt: Date
  updatedAt: Date
}

// 打卡记录接口
export interface AttendanceRecord {
  id: string
  cardNumber: string // 卡号/UID
  studentId: string // 学生ID
  studentName: string // 学生姓名
  timestamp: Date // 打卡时间
  location: string // 打卡地点
  deviceId: string // 设备ID
  deviceName: string // 设备名称
  deviceType: 'NFC' | 'RFID' | 'hybrid' // 设备类型
  type: 'check_in' | 'check_out' | 'break_start' | 'break_end' // 打卡类型
  status: 'success' | 'failed' | 'duplicate' | 'unauthorized' // 打卡状态
  frequency?: string // 读取频率
  signalStrength?: number // 信号强度
  notes?: string // 备注
}

// 设备信息接口
export interface NFCDevice {
  id: string
  name: string // 设备名称
  location: string // 设备位置
  deviceType: 'NFC' | 'RFID' | 'hybrid' // 设备类型
  status: 'online' | 'offline' | 'maintenance' | 'error' // 设备状态
  lastActivity?: Date // 最后活动时间
  cardCount: number // 今日打卡次数
  errorCount: number // 错误次数
  ipAddress?: string // IP地址
  macAddress?: string // MAC地址
  firmwareVersion?: string // 固件版本
  supportedFrequencies: string[] // 支持的频率
  readRange: number // 读取范围（厘米）
  writeCapability: boolean // 是否支持写入
  notes?: string // 备注
}

// 读写操作接口
export interface CardOperation {
  id: string
  cardNumber: string
  operationType: 'read' | 'write' | 'format' | 'lock' | 'unlock'
  timestamp: Date
  deviceId: string
  deviceName: string
  status: 'success' | 'failed' | 'in_progress'
  data?: any // 读写的数据
  error?: string // 错误信息
}

// NFC/RFID 统一管理系统
export class UnifiedCardSystem {
  private cards: NFCCard[] = []
  private devices: NFCDevice[] = []
  private attendanceRecords: AttendanceRecord[] = []
  private operations: CardOperation[] = []

  constructor() {
    console.log('NFC/RFID统一打卡系统已初始化')
    this.initializeMockData()
  }

  // 初始化模拟数据
  private initializeMockData() {
    // 模拟设备数据
    this.devices = [
      {
        id: 'device-1',
        name: '主入口读卡器',
        location: '学校正门',
        deviceType: 'hybrid',
        status: 'online',
        lastActivity: new Date(),
        cardCount: 0,
        errorCount: 0,
        ipAddress: '192.168.1.100',
        macAddress: '00:11:22:33:44:55',
        firmwareVersion: 'v2.1.0',
        supportedFrequencies: ['13.56MHz', '125KHz'],
        readRange: 10,
        writeCapability: true,
        notes: '支持NFC和RFID双模式'
      },
      {
        id: 'device-2',
        name: '图书馆读卡器',
        location: '图书馆入口',
        deviceType: 'NFC',
        status: 'online',
        lastActivity: new Date(),
        cardCount: 0,
        errorCount: 0,
        ipAddress: '192.168.1.101',
        macAddress: '00:11:22:33:44:56',
        firmwareVersion: 'v2.0.5',
        supportedFrequencies: ['13.56MHz'],
        readRange: 5,
        writeCapability: false,
        notes: '仅支持NFC读取'
      }
    ]

    // 模拟卡片数据
    this.cards = [
      {
        id: 'card-1',
        cardNumber: '1234567890',
        studentId: 'STU001',
        studentName: '张三',
        cardType: 'NFC',
        frequency: '13.56MHz',
        status: 'active',
        issuedDate: new Date('2024-01-01'),
        usageCount: 45,
        balance: 100,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      },
      {
        id: 'card-2',
        cardNumber: '0987654321',
        studentId: 'STU002',
        studentName: '李四',
        cardType: 'RFID',
        frequency: '125KHz',
        status: 'active',
        issuedDate: new Date('2024-01-15'),
        usageCount: 32,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date()
      }
    ]
  }

  // ==================== 卡片管理 ====================
  
  async addCard(cardData: Omit<NFCCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<NFCCard> {
    const newCard: NFCCard = {
      ...cardData,
      id: `card-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.cards.push(newCard)
    console.log('添加卡片:', newCard)
    return newCard
  }

  async getAllCards(): Promise<NFCCard[]> {
    return this.cards
  }

  async getCardByNumber(cardNumber: string): Promise<NFCCard | null> {
    return this.cards.find(card => card.cardNumber === cardNumber) || null
  }

  async getCardByStudentId(studentId: string): Promise<NFCCard | null> {
    return this.cards.find(card => card.studentId === studentId) || null
  }

  async updateCard(cardId: string, updates: Partial<NFCCard>): Promise<void> {
    const cardIndex = this.cards.findIndex(card => card.id === cardId)
    if (cardIndex !== -1) {
      this.cards[cardIndex] = {
        ...this.cards[cardIndex],
        ...updates,
        updatedAt: new Date()
      }
    }
  }

  async deleteCard(cardId: string): Promise<void> {
    this.cards = this.cards.filter(card => card.id !== cardId)
  }

  // ==================== 设备管理 ====================
  
  async addDevice(deviceData: Omit<NFCDevice, 'id'>): Promise<NFCDevice> {
    const newDevice: NFCDevice = {
      ...deviceData,
      id: `device-${Date.now()}`,
      cardCount: 0,
      errorCount: 0
    }
    this.devices.push(newDevice)
    console.log('添加设备:', newDevice)
    return newDevice
  }

  async getAllDevices(): Promise<NFCDevice[]> {
    return this.devices
  }

  async updateDevice(deviceId: string, updates: Partial<NFCDevice>): Promise<void> {
    const deviceIndex = this.devices.findIndex(device => device.id === deviceId)
    if (deviceIndex !== -1) {
      this.devices[deviceIndex] = {
        ...this.devices[deviceIndex],
        ...updates
      }
    }
  }

  // ==================== 打卡处理 ====================
  
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
    // 查找卡片
    const card = await this.getCardByNumber(cardNumber)
    if (!card) {
      throw new Error(`卡片 ${cardNumber} 不存在`)
    }

    // 查找设备
    const device = this.devices.find(d => d.id === deviceId)
    if (!device) {
      throw new Error(`设备 ${deviceId} 不存在`)
    }

    // 检查卡片状态
    if (card.status !== 'active') {
      throw new Error(`卡片状态为 ${card.status}，无法打卡`)
    }

    // 检查设备状态
    if (device.status !== 'online') {
      throw new Error(`设备状态为 ${device.status}，无法打卡`)
    }

    // 检查是否重复打卡（5分钟内）
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recentRecord = this.attendanceRecords.find(record => 
      record.cardNumber === cardNumber && 
      record.timestamp > fiveMinutesAgo
    )

    if (recentRecord) {
      const duplicateRecord: AttendanceRecord = {
        id: `record-${Date.now()}`,
        cardNumber,
        studentId: card.studentId,
        studentName: card.studentName,
        timestamp: new Date(),
        location,
        deviceId,
        deviceName,
        deviceType: device.deviceType,
        type: 'check_in',
        status: 'duplicate',
        frequency: deviceInfo?.frequency,
        notes: '重复打卡'
      }
      this.attendanceRecords.push(duplicateRecord)
      return duplicateRecord
    }

    // 创建打卡记录
    const attendanceRecord: AttendanceRecord = {
      id: `record-${Date.now()}`,
      cardNumber,
      studentId: card.studentId,
      studentName: card.studentName,
      timestamp: new Date(),
      location,
      deviceId,
      deviceName,
      deviceType: device.deviceType,
      type: 'check_in',
      status: 'success',
      frequency: deviceInfo?.frequency,
      signalStrength: Math.floor(Math.random() * 30) + 70, // 模拟信号强度
      notes: '打卡成功'
    }

    this.attendanceRecords.push(attendanceRecord)

    // 更新卡片使用次数
    card.usageCount++
    card.lastUsed = new Date()
    card.updatedAt = new Date()

    // 更新设备统计
    device.cardCount++
    device.lastActivity = new Date()

    console.log('打卡成功:', attendanceRecord)
    return attendanceRecord
  }

  async getAttendanceRecords(
    studentId?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
    deviceType?: string
  ): Promise<AttendanceRecord[]> {
    let records = this.attendanceRecords

    if (studentId) {
      records = records.filter(record => record.studentId === studentId)
    }

    if (startDate) {
      records = records.filter(record => record.timestamp >= startDate)
    }

    if (endDate) {
      records = records.filter(record => record.timestamp <= endDate)
    }

    if (deviceType) {
      records = records.filter(record => record.deviceType === deviceType)
    }

    return records.slice(0, limit)
  }

  // ==================== 卡片读写操作 ====================
  
  async readCard(cardNumber: string, deviceId: string, deviceName: string): Promise<CardOperation> {
    const card = await this.getCardByNumber(cardNumber)
    if (!card) {
      throw new Error(`卡片 ${cardNumber} 不存在`)
    }

    const operation: CardOperation = {
      id: `op-${Date.now()}`,
      cardNumber,
      operationType: 'read',
      timestamp: new Date(),
      deviceId,
      deviceName,
      status: 'success',
      data: {
        cardInfo: card,
        readTime: new Date(),
        deviceInfo: {
          deviceId,
          deviceName
        }
      }
    }

    this.operations.push(operation)
    console.log('读取卡片:', operation)
    return operation
  }

  async writeCard(
    cardNumber: string, 
    deviceId: string, 
    deviceName: string, 
    data: any
  ): Promise<CardOperation> {
    const card = await this.getCardByNumber(cardNumber)
    if (!card) {
      throw new Error(`卡片 ${cardNumber} 不存在`)
    }

    // 检查设备是否支持写入
    const device = this.devices.find(d => d.id === deviceId)
    if (!device?.writeCapability) {
      throw new Error(`设备 ${deviceName} 不支持写入操作`)
    }

    const operation: CardOperation = {
      id: `op-${Date.now()}`,
      cardNumber,
      operationType: 'write',
      timestamp: new Date(),
      deviceId,
      deviceName,
      status: 'success',
      data: {
        writtenData: data,
        writeTime: new Date(),
        deviceInfo: {
          deviceId,
          deviceName
        }
      }
    }

    this.operations.push(operation)
    console.log('写入卡片:', operation)
    return operation
  }

  async getCardOperations(
    cardNumber?: string,
    operationType?: string,
    limit: number = 50
  ): Promise<CardOperation[]> {
    let operations = this.operations

    if (cardNumber) {
      operations = operations.filter(op => op.cardNumber === cardNumber)
    }

    if (operationType) {
      operations = operations.filter(op => op.operationType === operationType)
    }

    return operations.slice(0, limit)
  }

  // ==================== 统计信息 ====================
  
  async getStats(): Promise<{
    totalCards: number
    activeCards: number
    todayAttendance: number
    deviceCount: number
    onlineDevices: number
    totalOperations: number
    successRate: number
  }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayRecords = this.attendanceRecords.filter(record => 
      record.timestamp >= today
    )

    const totalOperations = this.operations.length
    const successfulOperations = this.operations.filter(op => op.status === 'success').length
    const successRate = totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0

    return {
      totalCards: this.cards.length,
      activeCards: this.cards.filter(card => card.status === 'active').length,
      todayAttendance: todayRecords.length,
      deviceCount: this.devices.length,
      onlineDevices: this.devices.filter(device => device.status === 'online').length,
      totalOperations,
      successRate: Math.round(successRate * 100) / 100
    }
  }

  // ==================== 模拟功能 ====================
  
  async simulateCardRead(deviceId: string): Promise<string | null> {
    // 模拟卡片读取
    const device = this.devices.find(d => d.id === deviceId)
    if (!device || device.status !== 'online') {
      return null
    }

    // 随机选择一个卡片
    const activeCards = this.cards.filter(card => card.status === 'active')
    if (activeCards.length === 0) {
      return null
    }

    const randomCard = activeCards[Math.floor(Math.random() * activeCards.length)]
    
    // 更新设备活动时间
    device.lastActivity = new Date()
    
    return randomCard.cardNumber
  }

  // ==================== 设备健康检查 ====================
  
  async checkDeviceHealth(deviceId: string): Promise<{
    status: 'healthy' | 'warning' | 'error'
    issues: string[]
    lastActivity: Date | null
    errorRate: number
  }> {
    const device = this.devices.find(d => d.id === deviceId)
    if (!device) {
      throw new Error(`设备 ${deviceId} 不存在`)
    }

    const issues: string[] = []
    let status: 'healthy' | 'warning' | 'error' = 'healthy'

    // 检查设备状态
    if (device.status !== 'online') {
      issues.push(`设备状态: ${device.status}`)
      status = 'error'
    }

    // 检查最后活动时间
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    if (device.lastActivity && device.lastActivity < fiveMinutesAgo) {
      issues.push('设备超过5分钟无活动')
      status = status === 'healthy' ? 'warning' : status
    }

    // 计算错误率
    const totalOperations = device.cardCount + device.errorCount
    const errorRate = totalOperations > 0 ? (device.errorCount / totalOperations) * 100 : 0

    if (errorRate > 10) {
      issues.push(`错误率过高: ${errorRate.toFixed(1)}%`)
      status = status === 'healthy' ? 'warning' : status
    }

    return {
      status,
      issues,
      lastActivity: device.lastActivity || null,
      errorRate: Math.round(errorRate * 100) / 100
    }
  }
}

// 导出默认实例
export const unifiedCardSystem = new UnifiedCardSystem()

// 为了向后兼容，保留旧的导出
export const nfcManager = unifiedCardSystem 