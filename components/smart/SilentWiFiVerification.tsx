"use client"

import { useState, useEffect } from "react"

interface WiFiVerificationProps {
  onWiFiVerified: (isVerified: boolean, networkInfo?: any) => void
  centerId?: string
}

export default function SilentWiFiVerification({ 
  onWiFiVerified, 
  centerId 
}: WiFiVerificationProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // 更隐蔽的WiFi验证方法
  const performSilentVerification = async () => {
    setIsChecking(true)
    
    try {
      // 方法1: 检查网络连接类型
      const getNetworkInfo = () => {
        const info: any = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          timestamp: new Date().toISOString()
        }

        // 尝试获取更多网络信息
        if ('connection' in navigator) {
          const connection = (navigator as any).connection
          if (connection) {
            info.effectiveType = connection.effectiveType
            info.downlink = connection.downlink
            info.rtt = connection.rtt
            info.saveData = connection.saveData
          }
        }

        // 检查是否在移动设备上
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        info.isMobile = isMobile

        // 检查屏幕尺寸
        info.screenWidth = window.screen.width
        info.screenHeight = window.screen.height
        info.viewportWidth = window.innerWidth
        info.viewportHeight = window.innerHeight

        return info
      }

      // 方法2: 检查地理位置（如果可用）
      const getLocationInfo = async () => {
        try {
          if ('geolocation' in navigator) {
            return new Promise((resolve) => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                  })
                },
                () => resolve(null),
                { timeout: 5000, enableHighAccuracy: false }
              )
            })
          }
        } catch (error) {
          console.warn('地理位置获取失败:', error)
        }
        return null
      }

      // 方法3: 检查网络延迟和稳定性
      const checkNetworkStability = async () => {
        const startTime = performance.now()
        try {
          // 尝试访问一个轻量级资源
          const response = await fetch('/api/health', { 
            method: 'HEAD',
            cache: 'no-cache'
          })
          const endTime = performance.now()
          return {
            latency: endTime - startTime,
            status: response.status,
            success: response.ok
          }
        } catch (error) {
          return {
            latency: performance.now() - startTime,
            status: 0,
            success: false,
            error: error.message
          }
        }
      }

      // 获取允许的网络配置
      const getAllowedNetworks = async () => {
        try {
          const response = await fetch('/api/wifi-networks')
          const data = await response.json()
          
          if (data.success && data.data) {
            return data.data
              .filter((network: any) => network.is_active)
              .map((network: any) => network.network_name)
          }
        } catch (error) {
          console.warn('无法加载WiFi网络配置:', error)
        }
        
        // 默认允许的网络列表
        return [
          'PJPC-WiFi',
          'PJPC-Office', 
          'PJPC-Center',
          '安亲班WiFi',
          'PJPC-Admin',
          'PJPC-Teacher',
          ...(centerId ? [`PJPC-${centerId.toUpperCase()}`, `PJPC-${centerId}`] : [])
        ]
      }

      // 执行所有检查
      const [networkInfo, locationInfo, stabilityInfo, allowedNetworks] = await Promise.all([
        Promise.resolve(getNetworkInfo()),
        getLocationInfo(),
        checkNetworkStability(),
        getAllowedNetworks()
      ])

      // 综合分析验证结果
      const verificationResult = analyzeVerificationData({
        networkInfo,
        locationInfo,
        stabilityInfo,
        allowedNetworks,
        centerId
      })

      console.log('静默WiFi验证结果:', verificationResult)
      
      onWiFiVerified(verificationResult.isVerified, {
        ...verificationResult,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('WiFi验证失败:', error)
      onWiFiVerified(false, {
        error: error.message,
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsChecking(false)
    }
  }

  // 分析验证数据
  const analyzeVerificationData = (data: any) => {
    const { networkInfo, locationInfo, stabilityInfo, allowedNetworks, centerId } = data
    
    let score = 0
    let reasons: string[] = []
    
    // 检查网络稳定性
    if (stabilityInfo.success && stabilityInfo.latency < 1000) {
      score += 30
      reasons.push('网络连接稳定')
    } else {
      reasons.push('网络连接不稳定')
    }
    
    // 检查设备类型
    if (networkInfo.isMobile) {
      score += 20
      reasons.push('移动设备访问')
    } else {
      score += 10
      reasons.push('桌面设备访问')
    }
    
    // 检查屏幕尺寸（移动设备应该有合理的屏幕尺寸）
    if (networkInfo.isMobile && networkInfo.viewportWidth < 1024) {
      score += 20
      reasons.push('移动设备屏幕尺寸')
    }
    
    // 检查地理位置（如果可用）
    if (locationInfo) {
      score += 30
      reasons.push('地理位置可获取')
    } else {
      reasons.push('地理位置不可获取')
    }
    
    // 检查在线状态
    if (networkInfo.onLine) {
      score += 10
      reasons.push('设备在线')
    } else {
      reasons.push('设备离线')
    }
    
    // 检查连接类型
    if (networkInfo.effectiveType && ['4g', '3g', '2g'].includes(networkInfo.effectiveType)) {
      score += 20
      reasons.push('移动网络连接')
    } else if (networkInfo.effectiveType === 'slow-2g') {
      score += 5
      reasons.push('慢速网络')
    }
    
    // 综合评分
    const isVerified = score >= 80 // 80分以上认为验证通过（更严格）
    
    return {
      isVerified,
      score,
      reasons,
      networkInfo,
      locationInfo,
      stabilityInfo,
      allowedNetworks,
      centerId
    }
  }

  useEffect(() => {
    // 延迟执行验证，避免立即暴露
    const timer = setTimeout(() => {
      performSilentVerification()
    }, 1000 + Math.random() * 2000) // 1-3秒随机延迟

    return () => clearTimeout(timer)
  }, [])

  // 不渲染任何UI，完全静默
  return null
}
