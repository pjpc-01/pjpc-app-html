import { useResponsiveScale } from './useResponsiveScale'
import { useMemo } from 'react'

export function useTransactionLayout() {
  const { isMobile, isTablet, isDesktop, isTV, dimensions } = useResponsiveScale()

  const layoutConfig = useMemo(() => {
    // 根据设备类型和屏幕尺寸动态调整布局
    if (isTV) {
      // TV模式：更大的交易记录区域
      return {
        transactionHeight: 'h-96', // 384px
        gridCols: 'grid-cols-5',
        cardPadding: 'p-3',
        titleSize: 'text-base',
        pointsSize: 'text-lg'
      }
    } else if (isDesktop) {
      // 桌面模式：中等大小
      return {
        transactionHeight: 'h-64', // 256px
        gridCols: 'grid-cols-3',
        cardPadding: 'p-3',
        titleSize: 'text-base',
        pointsSize: 'text-lg'
      }
    } else if (isTablet) {
      // 平板模式：适中大小
      return {
        transactionHeight: 'h-56', // 224px
        gridCols: 'grid-cols-2',
        cardPadding: 'p-3',
        titleSize: 'text-sm',
        pointsSize: 'text-base'
      }
    } else {
      // 手机模式：紧凑布局
      return {
        transactionHeight: 'h-48', // 192px
        gridCols: 'grid-cols-1',
        cardPadding: 'p-2',
        titleSize: 'text-sm',
        pointsSize: 'text-base'
      }
    }
  }, [isMobile, isTablet, isDesktop, isTV])

  // 根据屏幕高度动态调整 - 15%比例
  const dynamicHeight = useMemo(() => {
    const screenHeight = dimensions.height
    // 计算15%的屏幕高度，减去标题栏和间距
    const availableHeight = screenHeight - 80 // 减去标题栏等固定高度
    const fifteenPercentHeight = Math.floor(availableHeight * 0.15)
    
    // 设置最小和最大高度限制
    const minHeight = isTV ? 100 : isDesktop ? 80 : isTablet ? 70 : 60
    const maxHeight = isTV ? 150 : isDesktop ? 120 : isTablet ? 100 : 80
    
    return Math.max(minHeight, Math.min(maxHeight, fifteenPercentHeight))
  }, [dimensions.height, isTV, isDesktop, isTablet])

  return {
    ...layoutConfig,
    dynamicHeight: `${Math.round(dynamicHeight)}px`,
    isCompact: dimensions.height < 600
  }
}
