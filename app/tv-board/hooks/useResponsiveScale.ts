import { useState, useEffect } from 'react'

interface ScaleConfig {
  baseWidth: number
  baseHeight: number
  minScale: number
  maxScale: number
}

const defaultConfig: ScaleConfig = {
  baseWidth: 1920,
  baseHeight: 1080,
  minScale: 0.8,  // 增加最小缩放比例，让内容更大
  maxScale: 2.5   // 增加最大缩放比例
}

export function useResponsiveScale(config: ScaleConfig = defaultConfig) {
  const [scale, setScale] = useState(1)
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })

  useEffect(() => {
    const calculateScale = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      // 计算基于宽高比的缩放比例
      const scaleX = width / config.baseWidth
      const scaleY = height / config.baseHeight
      
      // 使用较小的缩放比例确保内容完全可见
      const calculatedScale = Math.min(scaleX, scaleY)
      
      // 限制缩放范围
      const finalScale = Math.max(
        config.minScale, 
        Math.min(config.maxScale, calculatedScale)
      )
      
      // 只有当值真正改变时才更新状态
      setScale(prevScale => {
        if (Math.abs(prevScale - finalScale) > 0.01) {
          return finalScale
        }
        return prevScale
      })
      
      setDimensions(prevDims => {
        if (prevDims.width !== width || prevDims.height !== height) {
          return { width, height }
        }
        return prevDims
      })
    }

    // 初始计算
    calculateScale()

    // 监听窗口大小变化
    window.addEventListener('resize', calculateScale)
    
    // 监听方向变化（移动设备）
    window.addEventListener('orientationchange', () => {
      setTimeout(calculateScale, 100)
    })

    return () => {
      window.removeEventListener('resize', calculateScale)
      window.removeEventListener('orientationchange', calculateScale)
    }
  }, [config.baseWidth, config.baseHeight, config.minScale, config.maxScale])

  return {
    scale,
    dimensions,
    isMobile: dimensions.width < 768,
    isTablet: dimensions.width >= 768 && dimensions.width < 1024,
    isDesktop: dimensions.width >= 1024,
    isTV: dimensions.width >= 1920
  }
}
