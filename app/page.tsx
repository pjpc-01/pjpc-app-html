"use client"

import React, { useState } from "react"
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
  const { logout, resendVerification, clearError } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ===========================================================================
  // DEV MODE: FULL AUTH BYPASS
  // ===========================================================================
  const user = { id: 'dev-admin', email: 'admin@pjpc.com' }
  const userProfile = {
    id: 'dev-admin',
    name: 'Dev Admin',
    role: 'admin',
    status: 'active',
    email: 'admin@pjpc.com'
  }
  const loading = false
  const connectionStatus = 'connected'
  const error = null
  // ===========================================================================

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-30"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {getRoleTitle()}
                </h1>
                <p className="text-xs text-gray-500">Smart Education Management System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block">
                <ConnectionStatus />
              </div>
              
              <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {userProfile.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
                    <p className="text-xs text-gray-500">{getRoleLabel()}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/50">
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/50">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout}
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative">
        <div className="absolute inset-0 bg-gray-100 opacity-40"></div>
        
        <div className="relative z-10">
          {error && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
              <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50/80 backdrop-blur-sm">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button variant="ghost" size="sm" onClick={clearError} className="text-red-600 hover:text-red-700">
                    Close
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ErrorBoundary>
              {renderDashboard()}
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  )
}
