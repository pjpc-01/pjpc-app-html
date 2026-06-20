"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Bell, Settings, LogOut, UserCheck, Wifi, WifiOff, AlertTriangle, CreditCard, Menu, X } from "lucide-react"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import ModernAdminDashboard from "./components/dashboards/modern-admin-dashboard"
import ModernParentDashboard from "./components/dashboards/modern-parent-dashboard"
import AccountantDashboard from "./components/dashboards/accountant-dashboard"
import ErrorBoundary from "@/components/shared/error-boundary"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle as AlertTriangleIcon, Mail, Clock } from "lucide-react"
import ConnectionStatus from "@/components/ConnectionStatus"
import TeacherNavigation from "@/components/shared/TeacherNavigation"
import dynamic from "next/dynamic"

// Dynamically import TeacherWorkspace to avoid hydration issues
const TeacherWorkspace = dynamic(() => import('./teacher-workspace/page'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-600">Loading Teacher Workspace...</p>
      </div>
    </div>
  )
})

export default function Dashboard() {
  const { user, userProfile, loading, connectionStatus, error, logout, resendVerification, clearError } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 家长角色重定向到家长门户
  useEffect(() => {
    if (!loading && userProfile?.role === "parent") {
      router.replace("/parent/dashboard")
    }
  }, [loading, userProfile?.role, router])

  const renderDashboard = () => {
    switch (userProfile.role) {
      case "admin":
        return <ModernAdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      case "teacher":
        return <TeacherWorkspace />
      case "parent":
        return <ModernParentDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      case "accountant":
        return <AccountantDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      default:
        return (
          <div className="text-center py-12">
            <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Unknown Role</p>
          </div>
        )
    }
  }

  const getRoleTitle = () => {
    switch (userProfile.role) {
      case "admin": return "Admin Console"
      case "teacher": return "Teacher Workspace"
      case "parent": return "Parent Portal"
      case "accountant": return "Accountant Workspace"
      default: return "Management System"
    }
  }

  const getRoleLabel = () => {
    switch (userProfile.role) {
      case "admin": return "Administrator"
      case "teacher": return "Teacher"
      case "parent": return "Parent"
      case "accountant": return "Accountant"
      default: return userProfile.role
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  return (
    <div className="min-h-screen">
      {error && (
        <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50/80">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError} className="text-red-600 hover:text-red-700">
              Close
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <ErrorBoundary>
        {renderDashboard()}
      </ErrorBoundary>
    </div>
  )
}
