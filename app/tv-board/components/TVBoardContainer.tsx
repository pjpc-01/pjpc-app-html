import { ReactNode } from 'react'
import { useResponsiveScale } from '../hooks/useResponsiveScale'

interface TVBoardContainerProps {
  children: ReactNode
  className?: string
  debugMode?: boolean
}

export default function TVBoardContainer({ 
  children, 
  className = '', 
  debugMode = false 
}: TVBoardContainerProps) {
  const { scale, dimensions, isMobile, isTablet, isDesktop, isTV } = useResponsiveScale()

  // 计算TV Board的标准尺寸和缩放
  const getTVBoardDimensions = () => {
    const baseWidth = 1920
    const baseHeight = 1080
    
    if (isTV) {
      // TV模式：保持原始比例，居中显示
      return {
        width: baseWidth,
        height: baseHeight,
        scale: 1,
        transformOrigin: 'center center'
      }
    } else if (isDesktop) {
      // 桌面模式：缩放到适合屏幕
      const scaleX = dimensions.width / baseWidth
      const scaleY = dimensions.height / baseHeight
      const finalScale = Math.min(scaleX, scaleY, 1) // 不放大，只缩小
      
      return {
        width: baseWidth,
        height: baseHeight,
        scale: finalScale,
        transformOrigin: 'center center'
      }
    } else if (isTablet) {
      // 平板模式：适当缩放
      const scaleX = dimensions.width / baseWidth
      const scaleY = dimensions.height / baseHeight
      const finalScale = Math.min(scaleX, scaleY, 0.8)
      
      return {
        width: baseWidth,
        height: baseHeight,
        scale: finalScale,
        transformOrigin: 'center center'
      }
    } else {
      // 手机模式：大幅缩放
      const scaleX = dimensions.width / baseWidth
      const scaleY = dimensions.height / baseHeight
      const finalScale = Math.min(scaleX, scaleY, 0.6)
      
      return {
        width: baseWidth,
        height: baseHeight,
        scale: finalScale,
        transformOrigin: 'center center'
      }
    }
  }

  const tvDimensions = getTVBoardDimensions()

  return (
    <div 
      className={`tv-board-container ${className} ${
        debugMode ? 'debug-tv-container' : ''
      }`}
      style={{
        // 容器样式
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        
        // 调试模式样式
        ...(debugMode && {
          background: 'rgba(0, 0, 255, 0.05)',
          border: '1px dashed rgba(0, 0, 255, 0.3)'
        })
      }}
    >
      {/* TV Board 内容 */}
      <div 
        className="tv-board-content"
        style={{
          width: tvDimensions.width,
          height: tvDimensions.height,
          transform: `scale(${tvDimensions.scale})`,
          transformOrigin: tvDimensions.transformOrigin,
          position: 'relative',
          overflow: 'hidden',
          
          // 调试模式样式
          ...(debugMode && {
            border: '2px solid rgba(255, 255, 0, 0.5)',
            background: 'rgba(255, 255, 0, 0.02)'
          })
        }}
      >
        {children}
      </div>

      {/* 调试信息 */}
      {debugMode && (
        <div 
          className="debug-tv-info"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          <div>TV Board: {tvDimensions.width}x{tvDimensions.height}</div>
          <div>缩放: {tvDimensions.scale.toFixed(2)}x</div>
          <div>屏幕: {dimensions.width}x{dimensions.height}</div>
          <div>设备: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : isDesktop ? 'Desktop' : 'TV'}</div>
        </div>
      )}
    </div>
  )
}
