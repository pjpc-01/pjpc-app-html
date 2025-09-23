// USB NFC/RFID 读卡器支持
// 扩展原有的NFC系统以支持USB读卡器

// USB设备信息接口
export interface USBDevice {
  id: string
  vendorId: number
  productId: number
  productName: string
  manufacturerName: string
  serialNumber?: string
  deviceType: 'nfc' | 'rfid' | 'hybrid'
  status: 'connected' | 'disconnected' | 'error'
  lastSeen: Date
}

// 串口设备信息接口
export interface SerialDevice {
  id: string
  portName: string
  baudRate: number
  deviceType: 'nfc' | 'rfid' | 'hybrid'
  status: 'connected' | 'disconnected' | 'error'
  lastSeen: Date
}

// NFC读取器类型
export type NFCReaderType = 'web-nfc' | 'usb' | 'serial'

// 统一NFC读取器接口
export interface NFCReader {
  type: NFCReaderType
  id: string
  name: string
  isConnected: boolean
  isScanning: boolean
  startScan(): Promise<void>
  stopScan(): void
  onCardDetected: (data: string) => void
  onError: (error: string) => void
}

// Web NFC读取器实现
export class WebNFCReader implements NFCReader {
  public type: NFCReaderType = 'web-nfc'
  public id: string
  public name: string
  public isConnected: boolean = false
  public isScanning: boolean = false
  public onCardDetected: (data: string) => void = () => {}
  public onError: (error: string) => void = () => {}

  private reader: any = null

  constructor(id: string, name: string) {
    this.id = id
    this.name = name
    this.checkConnection()
  }

  private async checkConnection() {
    try {
      if ('NDEFReader' in window) {
        this.isConnected = true
        console.log(`[Web NFC] ${this.name} 已连接`)
      } else {
        this.isConnected = false
        console.log(`[Web NFC] ${this.name} 不支持`)
      }
    } catch (error) {
      this.isConnected = false
      console.error(`[Web NFC] ${this.name} 连接检查失败:`, error)
    }
  }

  async startScan(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Web NFC 未连接')
    }

    try {
      this.reader = new (window as any).NDEFReader()
      await this.reader.scan()
      this.isScanning = true

      this.reader.addEventListener('reading', (event: any) => {
        try {
          console.log(`[Web NFC] ${this.name} 检测到NFC标签:`, event)
          
          // 提取UID
          const uid = this.extractUIDFromNFC(event)
          if (uid) {
            const cardData = {
              uid: uid,
              type: 'NFC Card',
              timestamp: new Date().toISOString(),
              serialNumber: event.serialNumber || 'Unknown'
            }
            
            console.log(`[Web NFC] ${this.name} UID:`, uid)
            this.onCardDetected(JSON.stringify(cardData))
          } else {
            // 如果没有UID，尝试读取其他数据
            const decoder = new TextDecoder()
            let nfcData = ""
            for (const record of event.message.records) {
              nfcData += decoder.decode(record.data)
            }
            this.onCardDetected(nfcData)
          }
        } catch (error) {
          this.onError(`NFC数据解析失败: ${error}`)
        }
      })

      this.reader.addEventListener('readingerror', (event: any) => {
        this.onError(`NFC读取错误: ${event.error}`)
      })

      console.log(`[Web NFC] ${this.name} 开始扫描`)
    } catch (error) {
      this.isScanning = false
      throw new Error(`Web NFC 扫描启动失败: ${error}`)
    }
  }

  stopScan(): void {
    if (this.reader) {
      try {
        this.reader.onreading = null
        this.reader.onreadingerror = null
        this.reader = null
      } catch (error) {
        console.error('Web NFC 停止扫描失败:', error)
      }
    }
    this.isScanning = false
    console.log(`[Web NFC] ${this.name} 停止扫描`)
  }
}

// USB NFC读取器实现
export class USBNFCReader implements NFCReader {
  public type: NFCReaderType = 'usb'
  public id: string
  public name: string
  public isConnected: boolean = false
  public isScanning: boolean = false
  public onCardDetected: (data: string) => void = () => {}
  public onError: (error: string) => void = () => {}

  private device: USBDevice | null = null
  private port: any = null

  constructor(id: string, name: string) {
    this.id = id
    this.name = name
    this.checkConnection()
  }

  private async checkConnection() {
    try {
      if ('usb' in navigator) {
        const devices = await navigator.usb.getDevices()
        
        // 首先尝试查找标准的NFC/RFID设备
        let nfcDevice = devices.find(device => 
          device.productName?.toLowerCase().includes('nfc') ||
          device.productName?.toLowerCase().includes('rfid') ||
          device.productName?.toLowerCase().includes('card reader') ||
          device.productName?.toLowerCase().includes('hid-compliant') ||
          device.productName?.toLowerCase().includes('13.56') ||
          device.productName?.toLowerCase().includes('mhz') ||
          device.productName?.toLowerCase().includes('acr122') ||
          device.productName?.toLowerCase().includes('pn532') ||
          device.productName?.toLowerCase().includes('mifare') ||
          device.productName?.toLowerCase().includes('proximity') ||
          device.productName?.toLowerCase().includes('contactless') ||
          device.productName?.toLowerCase().includes('smart card') ||
          // 添加对特定设备的支持
          (device.vendorId === 0xFFFF && device.productId === 0x0035)
        )

        // 如果没有找到标准设备，尝试查找任何HID设备
        if (!nfcDevice && devices.length > 0) {
          console.log(`[USB NFC] ${this.name} 检测到 ${devices.length} 个USB设备:`)
          devices.forEach((device, index) => {
            console.log(`  设备 ${index + 1}:`, {
              productName: device.productName,
              vendorId: device.vendorId,
              productId: device.productId,
              manufacturerName: device.manufacturerName
            })
          })
          
          // 选择第一个设备作为潜在读卡器
          nfcDevice = devices[0]
          console.log(`[USB NFC] ${this.name} 尝试使用设备: ${nfcDevice.productName}`)
        }

        if (nfcDevice) {
          this.device = {
            id: nfcDevice.serialNumber || nfcDevice.productId.toString(),
            vendorId: nfcDevice.vendorId,
            productId: nfcDevice.productId,
            productName: nfcDevice.productName || 'Unknown NFC Reader',
            manufacturerName: nfcDevice.manufacturerName || 'Unknown',
            serialNumber: nfcDevice.serialNumber,
            deviceType: 'hybrid',
            status: 'connected',
            lastSeen: new Date()
          }
          this.isConnected = true
          console.log(`[USB NFC] ${this.name} 已连接:`, this.device.productName)
        } else {
          this.isConnected = false
          console.log(`[USB NFC] ${this.name} 未找到任何USB设备`)
        }
      } else {
        this.isConnected = false
        console.log(`[USB NFC] ${this.name} 浏览器不支持USB API`)
      }
    } catch (error) {
      this.isConnected = false
      console.error(`[USB NFC] ${this.name} 连接检查失败:`, error)
    }
  }

  async startScan(): Promise<void> {
    try {
      let device: USBDevice

      if (this.isConnected && this.device) {
        // 如果已有设备，尝试使用现有设备
        try {
          const devices = await navigator.usb.getDevices()
          const existingDevice = devices.find(d => 
            d.vendorId === this.device!.vendorId && 
            d.productId === this.device!.productId
          )
          
          if (existingDevice) {
            device = existingDevice
            console.log(`[USB NFC] ${this.name} 使用现有设备: ${device.productName}`)
          } else {
            throw new Error('现有设备不可用')
          }
        } catch (error) {
          console.log(`[USB NFC] ${this.name} 现有设备不可用，尝试选择新设备`)
          // 如果现有设备不可用，让用户选择设备
          device = await navigator.usb.requestDevice({
            filters: [] // 空过滤器，显示所有设备
          })
        }
      } else {
        // 如果没有设备，让用户选择
        console.log(`[USB NFC] ${this.name} 请求用户选择设备`)
        device = await navigator.usb.requestDevice({
          filters: [] // 空过滤器，显示所有设备
        })
      }

      await device.open()
      await device.selectConfiguration(1)
      
      // 尝试声明接口，如果失败则跳过
      try {
        await device.claimInterface(0)
        console.log(`[USB NFC] ${this.name} 成功声明接口 0`)
      } catch (interfaceError: any) {
        if (interfaceError.message.includes('protected class')) {
          console.log(`[USB NFC] ${this.name} 接口 0 受保护，尝试其他接口`)
          
          // 尝试其他接口
          let interfaceClaimed = false
          for (let i = 1; i < device.configuration.interfaces.length; i++) {
            try {
              await device.claimInterface(i)
              console.log(`[USB NFC] ${this.name} 成功声明接口 ${i}`)
              interfaceClaimed = true
              break
            } catch (err) {
              console.log(`[USB NFC] ${this.name} 接口 ${i} 不可用:`, err)
              continue
            }
          }
          
          if (!interfaceClaimed) {
            console.log(`[USB NFC] ${this.name} 所有接口都受保护，尝试HID模式`)
            // 对于HID设备，我们可能需要使用不同的方法
          }
        } else {
          throw interfaceError
        }
      }

      this.port = device
      this.isScanning = true

      // 监听USB数据传输
      this.startUSBDataListener()

      console.log(`[USB NFC] ${this.name} 开始扫描设备: ${device.productName}`)

      // 更新设备信息
      this.device = {
        id: device.serialNumber || device.productId.toString(),
        vendorId: device.vendorId,
        productId: device.productId,
        productName: device.productName || 'Unknown NFC Reader',
        manufacturerName: device.manufacturerName || 'Unknown',
        serialNumber: device.serialNumber,
        deviceType: 'hybrid',
        status: 'connected',
        lastSeen: new Date()
      }

    } catch (error: any) {
      this.isScanning = false
      if (error.name === 'NotFoundError') {
        throw new Error('未找到USB设备')
      } else if (error.name === 'NotAllowedError') {
        throw new Error('用户拒绝了设备访问权限')
      } else {
        throw new Error(`USB NFC 扫描启动失败: ${error.message}`)
      }
    }
  }

  private async startUSBDataListener() {
    if (!this.port) return

    try {
      // 持续读取USB数据
      const readData = async () => {
        try {
          // 对于HID设备，尝试不同的端点
          const endpoints = [1, 2, 3, 4, 5] // 尝试多个端点
          let dataReceived = false
          
          for (const endpoint of endpoints) {
            try {
              const result = await this.port.transferIn(endpoint, 64) // 读取64字节数据
              if (result.data && result.data.byteLength > 0) {
                const decoder = new TextDecoder()
                const data = decoder.decode(result.data)
                
                console.log(`[USB NFC] ${this.name} 从端点 ${endpoint} 接收到数据:`, data)
                
                // 解析NFC/RFID数据
                const cardData = this.parseCardData(data)
                if (cardData) {
                  this.onCardDetected(cardData)
                  dataReceived = true
                  break // 找到数据后停止尝试其他端点
                }
              }
            } catch (endpointError) {
              // 端点不可用，继续尝试下一个
              continue
            }
          }
          
          // 如果没有接收到数据，记录状态
          if (!dataReceived && this.isScanning) {
            console.log(`[USB NFC] ${this.name} 监听中... (尝试端点: ${endpoints.join(', ')})`)
            
            // 对于MIFARE/Proximity读卡器，提供特殊指导
            if (this.device?.productName?.toLowerCase().includes('mifare') || 
                this.device?.productName?.toLowerCase().includes('proximity')) {
              console.log(`[USB NFC] ${this.name} 检测到MIFARE/Proximity读卡器`)
              console.log(`[USB NFC] ${this.name} 设备信息:`, {
                productName: this.device.productName,
                vendorId: this.device.vendorId,
                productId: this.device.productId,
                manufacturerName: this.device.manufacturerName
              })
              console.log(`[USB NFC] ${this.name} MIFARE读卡器使用说明:`)
              console.log(`  1. 将MIFARE卡片贴近读卡器感应区`)
              console.log(`  2. 卡片应距离读卡器2-5cm范围内`)
              console.log(`  3. 保持卡片稳定，避免快速移动`)
              console.log(`  4. 支持MIFARE Classic、Ultralight、NTAG等卡片`)
            }
            
            // 对于HID键盘设备，提供详细诊断信息
            else if (this.device?.productName?.includes('Keyboard')) {
              console.log(`[USB NFC] ${this.name} 检测到键盘设备，这可能不是标准的RFID读卡器`)
              console.log(`[USB NFC] ${this.name} 设备信息:`, {
                productName: this.device.productName,
                vendorId: this.device.vendorId,
                productId: this.device.productId,
                manufacturerName: this.device.manufacturerName
              })
              console.log(`[USB NFC] ${this.name} 建议：`)
              console.log(`  1. 确认设备是否为13.56MHz RFID读卡器`)
              console.log(`  2. 检查设备是否需要特定的驱动`)
              console.log(`  3. 尝试使用设备厂商提供的专用软件`)
              console.log(`  4. 考虑购买标准的ACR122U或PN532读卡器`)
            }
          }
        } catch (error) {
          if (this.isScanning) {
            console.error('USB数据读取错误:', error)
            this.onError(`USB数据读取失败: ${error}`)
          }
        }

        // 继续监听
        if (this.isScanning) {
          setTimeout(readData, 1000) // 1秒间隔，减少日志输出
        }
      }

      readData()
    } catch (error) {
      this.onError(`USB数据监听启动失败: ${error}`)
    }
  }

  private parseCardData(data: string): string | null {
    try {
      // 清理数据
      const cleanData = data.replace(/\0/g, '').trim()
      
      console.log(`[USB NFC] ${this.name} 原始数据:`, cleanData)
      
      // 检查是否是有效的MIFARE UID格式
      if (cleanData.length >= 8 && cleanData.length <= 16) {
        // 可能是UID（8-16位十六进制）
        const uidMatch = cleanData.match(/^[0-9A-Fa-f]{8,16}$/)
        if (uidMatch) {
          const uid = uidMatch[0].toUpperCase()
          console.log(`[USB NFC] ${this.name} 检测到MIFARE UID:`, uid)
          
          return JSON.stringify({
            uid: uid,
            type: 'MIFARE Card',
            frequency: '13.56MHz',
            protocol: 'ISO14443 Type A',
            manufacturer: this.getMIFAREManufacturer(uid),
            timestamp: new Date().toISOString()
          })
        }
      }

      // 尝试解析MIFARE Classic格式 (4字节UID)
      const mifareClassicMatch = cleanData.match(/^([0-9A-Fa-f]{8})$/i)
      if (mifareClassicMatch) {
        const uid = mifareClassicMatch[1].toUpperCase()
        console.log(`[USB NFC] ${this.name} 检测到MIFARE Classic UID:`, uid)
        
        return JSON.stringify({
          uid: uid,
          type: 'MIFARE Classic',
          frequency: '13.56MHz',
          protocol: 'ISO14443 Type A',
          manufacturer: this.getMIFAREManufacturer(uid),
          timestamp: new Date().toISOString()
        })
      }

      // 尝试解析MIFARE Ultralight格式 (7字节UID)
      const mifareUltralightMatch = cleanData.match(/^([0-9A-Fa-f]{14})$/i)
      if (mifareUltralightMatch) {
        const uid = mifareUltralightMatch[1].toUpperCase()
        console.log(`[USB NFC] ${this.name} 检测到MIFARE Ultralight UID:`, uid)
        
        return JSON.stringify({
          uid: uid,
          type: 'MIFARE Ultralight',
          frequency: '13.56MHz',
          protocol: 'ISO14443 Type A',
          manufacturer: this.getMIFAREManufacturer(uid),
          timestamp: new Date().toISOString()
        })
      }

      // 尝试解析十六进制数据
      const hexMatch = cleanData.match(/[0-9A-Fa-f]{8,}/)
      if (hexMatch) {
        const uid = hexMatch[0].toUpperCase()
        console.log(`[USB NFC] ${this.name} 检测到通用RFID UID:`, uid)
        
        return JSON.stringify({
          uid: uid,
          type: '13.56MHz RFID Card',
          frequency: '13.56MHz',
          protocol: 'ISO14443 Type A/B',
          manufacturer: this.getMIFAREManufacturer(uid),
          timestamp: new Date().toISOString()
        })
      }

      // 尝试解析ATR格式
      const atrMatch = cleanData.match(/^[0-9A-Fa-f\s]{20,}$/)
      if (atrMatch) {
        console.log(`[USB NFC] ${this.name} 检测到ATR格式数据`)
        return JSON.stringify({
          uid: 'ATR格式数据',
          atr: cleanData,
          type: 'NFC Card',
          timestamp: new Date().toISOString()
        })
      }

      console.log(`[USB NFC] ${this.name} 无法解析数据格式:`, cleanData)
      return null
    } catch (error) {
      console.error('NFC卡片数据解析失败:', error)
      return null
    }
  }

  // 获取MIFARE制造商信息
  private getMIFAREManufacturer(uid: string): string {
    const prefix = uid.substring(0, 2).toUpperCase()
    
    const manufacturers: { [key: string]: string } = {
      '04': 'NXP Semiconductors',
      '08': 'NXP Semiconductors',
      '09': 'NXP Semiconductors',
      '0A': 'NXP Semiconductors',
      '0B': 'NXP Semiconductors',
      '0C': 'NXP Semiconductors',
      '0D': 'NXP Semiconductors',
      '0E': 'NXP Semiconductors',
      '0F': 'NXP Semiconductors',
      '10': 'NXP Semiconductors',
      '11': 'NXP Semiconductors',
      '12': 'NXP Semiconductors',
      '13': 'NXP Semiconductors',
      '14': 'NXP Semiconductors',
      '15': 'NXP Semiconductors',
      '16': 'NXP Semiconductors',
      '17': 'NXP Semiconductors',
      '18': 'NXP Semiconductors',
      '19': 'NXP Semiconductors',
      '1A': 'NXP Semiconductors',
      '1B': 'NXP Semiconductors',
      '1C': 'NXP Semiconductors',
      '1D': 'NXP Semiconductors',
      '1E': 'NXP Semiconductors',
      '1F': 'NXP Semiconductors'
    }
    
    return manufacturers[prefix] || 'Unknown Manufacturer'
  }

  stopScan(): void {
    if (this.port) {
      try {
        this.port.close()
        this.port = null
      } catch (error) {
        console.error('USB NFC 停止扫描失败:', error)
      }
    }
    this.isScanning = false
    console.log(`[USB NFC] ${this.name} 停止扫描`)
  }
}

// 串口NFC读取器实现
export class SerialNFCReader implements NFCReader {
  public type: NFCReaderType = 'serial'
  public id: string
  public name: string
  public isConnected: boolean = false
  public isScanning: boolean = false
  public onCardDetected: (data: string) => void = () => {}
  public onError: (error: string) => void = () => {}

  private port: any = null
  private reader: ReadableStreamDefaultReader | null = null

  constructor(id: string, name: string) {
    this.id = id
    this.name = name
    this.checkConnection()
  }

  private async checkConnection() {
    try {
      if ('serial' in navigator) {
        // 检查是否有可用的串口设备
        try {
          const ports = await navigator.serial.getPorts()
          const hasSerialDevice = ports.length > 0
          
          // 进一步检查设备是否可用
          if (hasSerialDevice) {
            // 尝试检查设备状态（不实际打开）
            for (const port of ports) {
              try {
                // 检查端口是否可用（通过尝试获取信息）
                if (port.readable && port.writable) {
                  this.isConnected = true
                  console.log(`[Serial NFC] ${this.name} 检测到可用串口设备`)
                  break
                }
              } catch (error) {
                console.log(`[Serial NFC] 端口检查失败:`, error)
              }
            }
          }
          
          if (!this.isConnected) {
            console.log(`[Serial NFC] ${this.name} 支持串口通信，但无可用设备`)
          }
        } catch (error) {
          // 如果没有权限或设备，仍然标记为支持但未连接
          this.isConnected = false
          console.log(`[Serial NFC] ${this.name} 支持串口通信，但无可用设备`)
        }
      } else {
        this.isConnected = false
        console.log(`[Serial NFC] ${this.name} 浏览器不支持串口API`)
      }
    } catch (error) {
      this.isConnected = false
      console.error(`[Serial NFC] ${this.name} 连接检查失败:`, error)
    }
  }

  async startScan(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('串口 NFC 未连接或无可用的串口设备')
    }

    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        // 首先检查是否有已授权的串口设备
        const ports = await navigator.serial.getPorts()
        if (ports.length === 0) {
          // 如果没有已授权的设备，请求用户选择
          this.port = await navigator.serial.requestPort()
        } else {
          // 尝试使用已授权的设备
          this.port = ports[0]
        }
        
        // 尝试打开串口
        await this.port.open({ 
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: 'none'
        })

        this.isScanning = true

        // 开始读取数据
        this.startSerialDataListener()

        console.log(`[Serial NFC] ${this.name} 开始扫描`)
        return // 成功启动，退出重试循环
        
      } catch (error: any) {
        retryCount++
        console.error(`[Serial NFC] 第 ${retryCount} 次尝试失败:`, error)
        
        // 清理资源
        if (this.port) {
          try {
            await this.port.close()
          } catch (closeError) {
            console.log('关闭端口时出错:', closeError)
          }
          this.port = null
        }
        
        if (retryCount >= maxRetries) {
          // 所有重试都失败了
          this.isScanning = false
          if (error.name === 'NotAllowedError') {
            throw new Error('用户拒绝了串口访问权限')
          } else if (error.name === 'NotFoundError') {
            throw new Error('未找到串口设备')
          } else if (error.name === 'NetworkError') {
            throw new Error('串口设备被其他程序占用或无法打开。请检查：\n1. 设备是否被其他程序使用\n2. 设备驱动是否正确安装\n3. 尝试重新插拔设备')
          } else if (error.name === 'InvalidStateError') {
            throw new Error('串口设备状态无效，请重新连接设备')
          } else {
            throw new Error(`串口 NFC 扫描启动失败: ${error.message}`)
          }
        }
        
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }
  }

  private async startSerialDataListener() {
    if (!this.port) return

    try {
      const textDecoder = new TextDecoder()
      this.reader = this.port.readable.getReader()

      while (this.isScanning) {
        const { value, done } = await this.reader.read()
        
        if (done) {
          break
        }

        if (value) {
          const data = textDecoder.decode(value)
          const cardData = this.parseSerialCardData(data)
          
          if (cardData) {
            this.onCardDetected(cardData)
          }
        }
      }
    } catch (error) {
      if (this.isScanning) {
        console.error('串口数据读取错误:', error)
        this.onError(`串口数据读取失败: ${error}`)
      }
    }
  }

  private parseSerialCardData(data: string): string | null {
    try {
      // 清理数据
      const cleanData = data.replace(/\r\n/g, '').replace(/\n/g, '').trim()
      
      // 检查是否是有效的卡片数据
      if (cleanData.length >= 4 && cleanData.length <= 20) {
        return cleanData
      }

      // 尝试解析十六进制数据
      const hexMatch = cleanData.match(/[0-9A-Fa-f]{8,}/)
      if (hexMatch) {
        return hexMatch[0]
      }

      return null
    } catch (error) {
      console.error('串口卡片数据解析失败:', error)
      return null
    }
  }

  stopScan(): void {
    if (this.reader) {
      try {
        this.reader.cancel()
        this.reader = null
      } catch (error) {
        console.error('串口 NFC 停止扫描失败:', error)
      }
    }

    if (this.port) {
      try {
        this.port.close()
        this.port = null
      } catch (error) {
        console.error('串口 NFC 关闭失败:', error)
      }
    }

    this.isScanning = false
    console.log(`[Serial NFC] ${this.name} 停止扫描`)
  }
}

// 统一NFC管理器
export class UnifiedNFCManager {
  private readers: NFCReader[] = []
  private onCardDetected: (data: string, readerType: NFCReaderType) => void = () => {}
  private onError: (error: string, readerType: NFCReaderType) => void = () => {}

  constructor() {
    this.initializeReaders()
  }

  private initializeReaders() {
    // 初始化Web NFC读取器
    const webNFCReader = new WebNFCReader('web-nfc-1', 'Web NFC Reader')
    this.readers.push(webNFCReader)

    // 初始化USB NFC读取器
    const usbNFCReader = new USBNFCReader('usb-nfc-1', 'USB NFC Reader')
    this.readers.push(usbNFCReader)

    // 初始化串口NFC读取器
    const serialNFCReader = new SerialNFCReader('serial-nfc-1', 'Serial NFC Reader')
    this.readers.push(serialNFCReader)

    console.log(`[Unified NFC] 初始化了 ${this.readers.length} 个读取器`)
  }

  // 设置回调函数
  setCallbacks(
    onCardDetected: (data: string, readerType: NFCReaderType) => void,
    onError: (error: string, readerType: NFCReaderType) => void
  ) {
    this.onCardDetected = onCardDetected
    this.onError = onError

    // 为所有读取器设置回调
    this.readers.forEach(reader => {
      reader.onCardDetected = (data: string) => {
        this.onCardDetected(data, reader.type)
      }
      reader.onError = (error: string) => {
        this.onError(error, reader.type)
      }
    })
  }

  // 手动触发卡片读取事件（用于测试）
  triggerCardRead(data: any, readerType: NFCReaderType = 'usb') {
    console.log(`[Unified NFC] 手动触发卡片读取:`, data)
    this.onCardDetected(JSON.stringify(data), readerType)
  }

  // 获取可用的读取器
  getAvailableReaders(): NFCReader[] {
    return this.readers.filter(reader => {
      // Web NFC 总是可用的（如果浏览器支持）
      if (reader.type === 'web-nfc') {
        return reader.isConnected
      }
      
      // USB 和串口读取器需要实际检测设备
      if (reader.type === 'usb') {
        return reader.isConnected
      }
      
      // 串口读取器需要更严格的检查
      if (reader.type === 'serial') {
        return reader.isConnected
      }
      
      return reader.isConnected
    })
  }

  // 获取所有读取器状态
  getAllReadersStatus(): { type: NFCReaderType; name: string; connected: boolean; scanning: boolean }[] {
    return this.readers.map(reader => ({
      type: reader.type,
      name: reader.name,
      connected: reader.isConnected,
      scanning: reader.isScanning
    }))
  }

  // 开始扫描所有可用的读取器
  async startScanning(): Promise<void> {
    const availableReaders = this.getAvailableReaders()
    
    if (availableReaders.length === 0) {
      throw new Error('没有可用的NFC读取器')
    }

    console.log(`[Unified NFC] 开始扫描 ${availableReaders.length} 个读取器`)

    // 并行启动所有读取器，但允许部分失败
    const scanPromises = availableReaders.map(async (reader) => {
      try {
        await reader.startScan()
        console.log(`[Unified NFC] ${reader.name} 扫描已启动`)
        return { reader, success: true }
      } catch (error) {
        console.error(`[Unified NFC] ${reader.name} 扫描启动失败:`, error)
        this.onError(`读取器 ${reader.name} 启动失败: ${error}`, reader.type)
        return { reader, success: false, error }
      }
    })

    const results = await Promise.allSettled(scanPromises)
    const successfulScans = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length

    if (successfulScans === 0) {
      throw new Error('所有读取器启动失败')
    } else if (successfulScans < availableReaders.length) {
      console.warn(`[Unified NFC] ${successfulScans}/${availableReaders.length} 个读取器启动成功`)
    }
  }

  // 停止所有扫描
  stopScanning(): void {
    console.log('[Unified NFC] 停止所有扫描')
    
    this.readers.forEach(reader => {
      if (reader.isScanning) {
        reader.stopScan()
        console.log(`[Unified NFC] ${reader.name} 扫描已停止`)
      }
    })
  }

  // 重新检测设备
  async refreshDevices(): Promise<void> {
    console.log('[Unified NFC] 重新检测设备')
    
    // 重新初始化读取器
    for (const reader of this.readers) {
      if (reader.type === 'web-nfc') {
        (reader as WebNFCReader).checkConnection()
      } else if (reader.type === 'usb') {
        (reader as USBNFCReader).checkConnection()
      } else if (reader.type === 'serial') {
        (reader as SerialNFCReader).checkConnection()
      }
    }
  }

  // 主动请求USB设备权限
  async requestUSBDeviceAccess(): Promise<void> {
    try {
      if ('usb' in navigator) {
        console.log('[Unified NFC] 请求USB设备访问权限')
        
        // 请求用户选择USB设备
        const device = await navigator.usb.requestDevice({
          filters: [] // 空过滤器，显示所有设备
        })
        
        console.log('[Unified NFC] 用户选择了设备:', {
          productName: device.productName,
          vendorId: device.vendorId,
          productId: device.productId,
          manufacturerName: device.manufacturerName
        })
        
        // 重新检测设备
        await this.refreshDevices()
        
      } else {
        throw new Error('浏览器不支持USB API')
      }
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        throw new Error('未找到USB设备')
      } else if (error.name === 'NotAllowedError') {
        throw new Error('用户拒绝了设备访问权限')
      } else {
        throw new Error(`USB设备访问请求失败: ${error.message}`)
      }
    }
  }

  // 检查设备健康状态
  async checkDeviceHealth(): Promise<{ healthy: NFCReader[]; unhealthy: NFCReader[] }> {
    const healthy: NFCReader[] = []
    const unhealthy: NFCReader[] = []

    for (const reader of this.readers) {
      try {
        if (reader.type === 'serial') {
          // 对串口设备进行特殊检查
          const serialReader = reader as SerialNFCReader
          if (serialReader.isConnected) {
            // 尝试检查串口是否真正可用
            const ports = await navigator.serial.getPorts()
            const hasAvailablePort = ports.some(port => {
              try {
                return port.readable && port.writable
              } catch {
                return false
              }
            })
            
            if (hasAvailablePort) {
              healthy.push(reader)
            } else {
              unhealthy.push(reader)
            }
          } else {
            unhealthy.push(reader)
          }
        } else {
          // 其他设备类型
          if (reader.isConnected) {
            healthy.push(reader)
          } else {
            unhealthy.push(reader)
          }
        }
      } catch (error) {
        console.error(`设备健康检查失败 ${reader.name}:`, error)
        unhealthy.push(reader)
      }
    }

    return { healthy, unhealthy }
  }
}

// 导出单例实例
export const unifiedNFCManager = new UnifiedNFCManager()
