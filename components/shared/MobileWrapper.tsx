"use client"

import React from 'react'
import { useIsMobile } from '@/hooks/use-mobile'

interface MobileWrapperProps {
  children: React.ReactNode
  mobileClassName?: string
  desktopClassName?: string
  fallback?: React.ReactNode
}

export default function MobileWrapper({ 
  children, 
  mobileClassName = '', 
  desktopClassName = '',
  fallback 
}: MobileWrapperProps) {
  const isMobile = useIsMobile()

  // 如果还在检测中，显示fallback或children
  if (isMobile === undefined) {
    return <>{fallback || children}</>
  }

  const className = isMobile ? mobileClassName : desktopClassName

  return (
    <div className={className}>
      {children}
    </div>
  )
}

// 移动端专用的卡片组件
export function MobileCard({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={`mobile-card ${className}`}>
      {children}
    </div>
  )
}

// 移动端专用的文本组件
export function MobileText({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <span className={`mobile-text ${className}`}>
      {children}
    </span>
  )
}

// 移动端专用的标题组件
export function MobileTitle({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <h1 className={`mobile-title font-bold ${className}`}>
      {children}
    </h1>
  )
}

// 移动端专用的按钮组件
export function MobileButton({ 
  children, 
  className = '',
  ...props 
}: { 
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  return (
    <button className={`mobile-button ${className}`} {...props}>
      {children}
    </button>
  )
}
