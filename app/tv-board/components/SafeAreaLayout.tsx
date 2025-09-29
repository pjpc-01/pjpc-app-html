import { ReactNode } from 'react'
import { useResponsiveScale } from '../hooks/useResponsiveScale'

interface SafeAreaLayoutProps {
  children: ReactNode
  className?: string
  debugMode?: boolean
}

export default function SafeAreaLayout({ 
  children, 
  className = '', 
  debugMode = false 
}: SafeAreaLayoutProps) {
  const { scale, dimensions, isMobile, isTablet, isDesktop, isTV } = useResponsiveScale()

  // 计算安全区域 - 进一步减少左右边距，最大化内容显示
  const getSafeAreaInsets = () => {
    if (isMobile) {
      return {
        top: 'env(safe-area-inset-top, 20px)',
        right: 'env(safe-area-inset-right, 4px)', // 进一步减少从8px到4px
        bottom: 'env(safe-area-inset-bottom, 20px)',
        left: 'env(safe-area-inset-left, 4px)' // 进一步减少从8px到4px
      }
    } else if (isTablet) {
      return {
        top: 'env(safe-area-inset-top, 24px)',
        right: 'env(safe-area-inset-right, 6px)', // 进一步减少从12px到6px
        bottom: 'env(safe-area-inset-bottom, 24px)',
        left: 'env(safe-area-inset-left, 6px)' // 进一步减少从12px到6px
      }
    } else if (isTV) {
      return {
        top: 'env(safe-area-inset-top, 32px)',
        right: 'env(safe-area-inset-right, 8px)', // 进一步减少从16px到8px
        bottom: 'env(safe-area-inset-bottom, 32px)',
        left: 'env(safe-area-inset-left, 8px)' // 进一步减少从16px到8px
      }
    } else {
      // Desktop - 保持无边距
      return {
        top: 'env(safe-area-inset-top, 0px)',
        right: 'env(safe-area-inset-right, 0px)',
        bottom: 'env(safe-area-inset-bottom, 0px)',
        left: 'env(safe-area-inset-left, 0px)'
      }
    }
  }

  const safeAreaInsets = getSafeAreaInsets()

  return (
    <div 
      className={`safe-area-container ${className} ${
        debugMode ? 'debug-safe-area' : ''
      }`}
      style={{
        // 基础容器样式
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        
        // Safe Area 内边距
        paddingTop: safeAreaInsets.top,
        paddingRight: safeAreaInsets.right,
        paddingBottom: safeAreaInsets.bottom,
        paddingLeft: safeAreaInsets.left,
        
        // 确保内容在安全区域内
        boxSizing: 'border-box',
        
        // 调试模式样式
        ...(debugMode && {
          border: '2px dashed rgba(0, 255, 0, 0.5)',
          background: 'rgba(0, 255, 0, 0.05)'
        })
      }}
    >
      {/* 内容区域 */}
      <div 
        className="safe-area-content"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          
          // 调试模式样式
          ...(debugMode && {
            border: '1px solid rgba(255, 0, 0, 0.3)',
            background: 'rgba(255, 0, 0, 0.02)'
          })
        }}
      >
        {children}
      </div>

      {/* 调试信息 */}
      {debugMode && (
        <div 
          className="debug-info"
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
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
          <div>设备: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : isDesktop ? 'Desktop' : 'TV'}</div>
          <div>缩放: {scale.toFixed(2)}x</div>
          <div>尺寸: {dimensions.width}x{dimensions.height}</div>
          <div>Safe Area: {safeAreaInsets.top} / {safeAreaInsets.right} / {safeAreaInsets.bottom} / {safeAreaInsets.left}</div>
        </div>
      )}
    </div>
  )
}
