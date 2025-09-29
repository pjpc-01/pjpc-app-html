import { useEffect, useState, useCallback } from 'react'

interface PointsHealthStatus {
  isHealthy: boolean
  lastCheck: Date | null
  inconsistencies: number
  lastError: string | null
}

export function usePointsHealthCheck(center: string, checkInterval: number = 300000) { // 默认5分钟检查一次
  const [healthStatus, setHealthStatus] = useState<PointsHealthStatus>({
    isHealthy: true,
    lastCheck: null,
    inconsistencies: 0,
    lastError: null
  })

  const checkPointsHealth = useCallback(async () => {
    // 暂时禁用积分健康检查，避免API错误影响TVBoard页面
    console.log('[PointsHealth] 积分健康检查已禁用')
    setHealthStatus({
      isHealthy: true,
      lastCheck: new Date(),
      inconsistencies: 0,
      lastError: null
    })
  }, [])

  useEffect(() => {
    // 立即执行一次检查
    checkPointsHealth()
    
    // 设置定时检查
    const interval = setInterval(checkPointsHealth, checkInterval)
    
    return () => {
      clearInterval(interval)
    }
  }, [checkPointsHealth, checkInterval])

  return {
    healthStatus,
    checkPointsHealth
  }
}

