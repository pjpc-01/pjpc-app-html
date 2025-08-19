// 内网网络配置管理
export interface NetworkConfig {
  name: string
  url: string
  type: 'local' | 'lan' | 'ddns' | 'wan'
  priority: number
  timeout: number
  description: string
}

// 内网环境配置
export const INTRANET_CONFIG: NetworkConfig[] = [
  {
    name: 'DDNS',
    url: 'http://pjpc.tplinkdns.com:8090',
    type: 'ddns',
    priority: 1,
    timeout: 5000,
    description: '外网DDNS地址'
  },
  {
    name: '本地主机',
    url: 'http://localhost:8090',
    type: 'local',
    priority: 2,
    timeout: 1000,
    description: '本机运行的PocketBase服务'
  },
  {
    name: '本地回环',
    url: 'http://127.0.0.1:8090',
    type: 'local',
    priority: 2,
    timeout: 1000,
    description: '本地回环地址'
  },
  {
    name: '内网服务器1',
    url: 'http://192.168.0.59:8090',
    type: 'lan',
    priority: 3,
    timeout: 2000,
    description: '主要内网服务器'
  },
  {
    name: '路由器',
    url: 'http://192.168.0.1:8090',
    type: 'lan',
    priority: 4,
    timeout: 2000,
    description: '路由器端口转发'
  },
  {
    name: '内网服务器2',
    url: 'http://192.168.0.100:8090',
    type: 'lan',
    priority: 5,
    timeout: 2000,
    description: '备用内网服务器'
  },
  {
    name: '内网服务器3',
    url: 'http://192.168.0.200:8090',
    type: 'lan',
    priority: 6,
    timeout: 2000,
    description: '备用内网服务器'
  }
]

// 网络状态检测
export interface NetworkStatus {
  connected: boolean
  url: string
  latency: number
  error?: string
  timestamp: number
}

// 网络环境检测器
export class NetworkDetector {
  private static instance: NetworkDetector
  private lastStatus: NetworkStatus | null = null
  private cacheTimeout = 30000 // 30秒缓存

  static getInstance(): NetworkDetector {
    if (!NetworkDetector.instance) {
      NetworkDetector.instance = new NetworkDetector()
    }
    return NetworkDetector.instance
  }

  // 检测网络环境
  async detectNetwork(): Promise<NetworkStatus> {
    // 检查缓存
    if (this.lastStatus && Date.now() - this.lastStatus.timestamp < this.cacheTimeout) {
      return this.lastStatus
    }

    console.log('🔍 开始网络环境检测...')
    
    // 检查是否为GitHub Pages环境
    const isGitHubPages = typeof window !== 'undefined' && 
      (window.location.hostname.includes('github.io') || 
       window.location.hostname.includes('pjpc-01.github.io'))
    
    if (isGitHubPages) {
      console.log('🌐 检测到GitHub Pages环境，使用DDNS地址')
      // GitHub Pages环境，由于CORS限制，我们假设DDNS连接可用
      // 实际连接测试将在客户端进行
      const result: NetworkStatus = {
        connected: true,
        url: 'http://pjpc.tplinkdns.com:8090',
        latency: 0,
        timestamp: Date.now()
      }
      this.lastStatus = result
      console.log(`✅ GitHub Pages 环境，使用DDNS地址: ${result.url}`)
      return result
    }
    
    // 获取本机IP
    const localIP = await this.getLocalIP()
    console.log('📱 本机IP:', localIP)

    // 构建测试配置
    const testConfigs = this.buildTestConfigs(localIP)
    
    // 并行测试所有配置
    const results = await Promise.all(
      testConfigs.map(config => this.testConnection(config))
    )

    // 找到最佳连接
    const successfulResults = results.filter(r => r.connected)
    
    if (successfulResults.length === 0) {
      const errorStatus: NetworkStatus = {
        connected: false,
        url: 'unknown',
        latency: 0,
        error: '所有网络连接都失败了',
        timestamp: Date.now()
      }
      this.lastStatus = errorStatus
      return errorStatus
    }

    // 按优先级和延迟排序
    const bestResult = successfulResults.sort((a, b) => {
      const configA = testConfigs.find(c => c.url === a.url)
      const configB = testConfigs.find(c => c.url === b.url)
      
      if (configA && configB && configA.priority !== configB.priority) {
        return configA.priority - configB.priority
      }
      return a.latency - b.latency
    })[0]

    this.lastStatus = bestResult
    console.log(`✅ 最佳连接: ${bestResult.url} (延迟: ${bestResult.latency}ms)`)
    
    return bestResult
  }

  // 获取本机IP
  private async getLocalIP(): Promise<string> {
    if (typeof window !== 'undefined') {
      try {
        return new Promise<string>((resolve) => {
          const pc = new RTCPeerConnection({ iceServers: [] })
          pc.createDataChannel('')
          pc.createOffer().then(offer => pc.setLocalDescription(offer))
          
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              const ip = event.candidate.candidate.split(' ')[4]
              if (ip && ip.match(/^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
                pc.close()
                resolve(ip)
              }
            }
          }
          
          setTimeout(() => {
            pc.close()
            resolve('192.168.0.73')
          }, 1000)
        })
      } catch (error) {
        console.warn('获取本机IP失败，使用默认IP')
        return '192.168.0.73'
      }
    }
    return '192.168.0.73'
  }

  // 构建测试配置
  private buildTestConfigs(localIP: string): NetworkConfig[] {
    const baseIP = localIP.substring(0, localIP.lastIndexOf('.'))
    
    return [
      // DDNS配置 (移动设备优先)
      {
        name: 'DDNS',
        url: 'http://pjpc.tplinkdns.com:8090',
        type: 'ddns',
        priority: 1,
        timeout: 5000,
        description: '外网DDNS地址'
      },
      // 本地配置
      {
        name: '本地主机',
        url: 'http://localhost:8090',
        type: 'local',
        priority: 2,
        timeout: 1000,
        description: '本机运行的PocketBase服务'
      },
      {
        name: '本地回环',
        url: 'http://127.0.0.1:8090',
        type: 'local',
        priority: 2,
        timeout: 1000,
        description: '本地回环地址'
      },
      // 内网配置
      {
        name: '内网服务器1',
        url: `http://${baseIP}.59:8090`,
        type: 'lan',
        priority: 3,
        timeout: 2000,
        description: '主要内网服务器'
      },
      {
        name: '路由器',
        url: `http://${baseIP}.1:8090`,
        type: 'lan',
        priority: 4,
        timeout: 2000,
        description: '路由器端口转发'
      },
      {
        name: '内网服务器2',
        url: `http://${baseIP}.100:8090`,
        type: 'lan',
        priority: 5,
        timeout: 2000,
        description: '备用内网服务器'
      },
      {
        name: '内网服务器3',
        url: `http://${baseIP}.200:8090`,
        type: 'lan',
        priority: 6,
        timeout: 2000,
        description: '备用内网服务器'
      }
    ]
  }

  // 测试单个连接
  private async testConnection(config: NetworkConfig): Promise<NetworkStatus> {
    try {
      const startTime = Date.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeout)
      
      console.log(`🔍 测试 ${config.name}: ${config.url}`)
      
      const response = await fetch(`${config.url}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      const endTime = Date.now()
      const latency = endTime - startTime
      
      if (response.ok) {
        console.log(`✅ ${config.name} 连接成功 - 延迟: ${latency}ms`)
        return {
          connected: true,
          url: config.url,
          latency,
          timestamp: Date.now()
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.log(`❌ ${config.name} 连接失败:`, error instanceof Error ? error.message : 'Unknown error')
      return {
        connected: false,
        url: config.url,
        latency: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      }
    }
  }

  // 清除缓存
  clearCache() {
    this.lastStatus = null
  }

  // 获取当前状态
  getLastStatus(): NetworkStatus | null {
    return this.lastStatus
  }
}

// 导出单例实例
export const networkDetector = NetworkDetector.getInstance()
