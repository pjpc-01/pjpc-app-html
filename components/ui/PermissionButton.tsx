"use client"

import React from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { usePermission } from '@/hooks/usePermission'

interface PermissionButtonProps extends ButtonProps {
  permission: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
}

export default function PermissionButton({ 
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
  ...props 
}: PermissionButtonProps) {
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
  
  return (
    <Button {...props}>
      {children}
    </Button>
  )
}
