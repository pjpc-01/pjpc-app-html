"use client"

import React from 'react'
import { usePermission } from '@/hooks/usePermission'

interface PermissionGateProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAll?: boolean
  permissions?: string[]
}

export default function PermissionGate({ 
  permission, 
  children, 
  fallback = null,
  requireAll = false,
  permissions = []
}: PermissionGateProps) {
  const { hasPermission, canAccess } = usePermission()
  
  const checkPermission = () => {
    if (permissions.length > 0) {
      if (requireAll) {
        return permissions.every(p => hasPermission(p))
      } else {
        return permissions.some(p => hasPermission(p))
      }
    }
    return canAccess(permission)
  }
  
  if (!checkPermission()) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}
