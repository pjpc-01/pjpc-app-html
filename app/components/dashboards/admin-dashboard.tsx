"use client"

import { useState, useCallback, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  DollarSign,
  Settings,
  BookOpen,
} from "lucide-react"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useFinancialStats } from "@/hooks/useFinancialStats"
import OverviewTab from "./overview-tab"
import FinanceTab from "./finance-tab"
import EducationTab from "./education-tab"
import SettingsTab from "./settings-tab"

interface AdminDashboardProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

// ========================================
// Debug Configuration
// ========================================
const DEBUG = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG === 'true'

const debugLog = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`🔍 [AdminDashboard] ${message}`, data || '')
  }
}

export default function AdminDashboard({ activeTab, setActiveTab }: AdminDashboardProps) {
  const { user, userProfile, loading: authLoading, error: authError } = useAuth()
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats()
  const { stats: financialStats, loading: financialLoading, error: financialError } = useFinancialStats()
  const [educationDataType, setEducationDataType] = useState<string>('primary')

  // Add debugging for tab changes (conditional)
  debugLog('Render', {
    activeTab,
    userRole: userProfile?.role,
    authLoading,
    statsLoading,
    financialLoading
  })

  // Add useEffect to track tab changes (conditional)
  useEffect(() => {
    debugLog('Active tab changed to:', activeTab)
  }, [activeTab])

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full h-12 ${
          userProfile?.role === "admin" ? "grid-cols-4" : "grid-cols-3"
        }`}>
          <TabsTrigger value="overview" className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            概览
          </TabsTrigger>
          {userProfile?.role === "admin" && (
            <TabsTrigger value="finance" className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              财务
            </TabsTrigger>
          )}
          <TabsTrigger value="education" className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4" />
            教育
          </TabsTrigger>
          {userProfile?.role === "admin" && (
            <TabsTrigger value="settings" className="flex items-center gap-2 text-sm">
              <Settings className="h-4 w-4" />
              设定
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab 
            stats={stats}
            statsLoading={statsLoading}
            statsError={statsError}
          />
        </TabsContent>

        {userProfile?.role === "admin" && (
          <TabsContent value="finance" className="mt-6">
            <FinanceTab 
              financialStats={financialStats}
              financialLoading={financialLoading}
              setActiveTab={setActiveTab}
            />
          </TabsContent>
        )}

        <TabsContent value="education" className="mt-6">
          <EducationTab 
            stats={stats}
            statsLoading={statsLoading}
            educationDataType={educationDataType}
            setEducationDataType={setEducationDataType}
            setActiveTab={setActiveTab}
          />
        </TabsContent>

        {userProfile?.role === "admin" && (
          <TabsContent value="settings" className="mt-6">
            <SettingsTab 
              stats={stats}
              statsLoading={statsLoading}
              setActiveTab={setActiveTab}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
