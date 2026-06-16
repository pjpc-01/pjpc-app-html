"use client"

import React from "react"
import { can, type Permission, type UserRole } from "@/lib/permissions"

interface PermissionGateProps {
  permission: Permission
  role?: UserRole
  children: React.ReactNode
  fallback?: React.ReactNode
  showDisabled?: boolean
}

export default function PermissionGate({
  permission,
  role = 'admin',
  children,
  fallback = null,
  showDisabled = false,
}: PermissionGateProps) {
  const hasPermission = can(role, permission)

  if (!hasPermission) {
    if (showDisabled) {
      return (
        <span className="opacity-30 cursor-not-allowed inline-block" title="无权执行此操作">
          {children}
        </span>
      )
    }
    return <>{fallback}</>
  }

  return <>{children}</>
}
