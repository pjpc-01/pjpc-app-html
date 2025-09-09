"use client"

import React, { useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  DollarSign,
  Settings,
  BookOpen,
  Shield,
  CreditCard,
  Smartphone,
  Activity,
  Users,
  Globe,
  Trophy,
  Star,
} from "lucide-react"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useFinancialStats } from "@/hooks/useFinancialStats"
import OverviewTab from "./overview-tab"
import FinanceTab from "./finance-tab"
import EducationTab from "./education-tab"
import SettingsTab from "./settings-tab"
import ManagementTab from "./management-tab"

interface AdminDashboardProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function AdminDashboard({ activeTab, setActiveTab }: AdminDashboardProps) {
  const { user, userProfile, loading: authLoading, error: authError } = useAuth()
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats()
  const { stats: financialStats, loading: financialLoading, error: financialError } = useFinancialStats()
  const [educationDataType, setEducationDataType] = useState<string>('primary')

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full h-auto sm:h-12 ${
          userProfile?.role === "admin" ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-3"
        }`}>
          <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-0">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">概览</span>
            <span className="xs:hidden">概</span>
          </TabsTrigger>
          {userProfile?.role === "admin" && (
            <TabsTrigger value="management" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-0">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">管理</span>
              <span className="xs:hidden">管</span>
            </TabsTrigger>
          )}
          {userProfile?.role === "admin" && (
            <TabsTrigger value="finance" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-0">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">财务</span>
              <span className="xs:hidden">财</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="education" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-0">
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">教育</span>
            <span className="xs:hidden">教</span>
          </TabsTrigger>
          {userProfile?.role === "admin" && (
            <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-0">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">设定</span>
              <span className="xs:hidden">设</span>
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
          <TabsContent value="management" className="mt-6">
            <ManagementTab 
              stats={stats}
              statsLoading={statsLoading}
              setActiveTab={setActiveTab}
            />
          </TabsContent>
        )}

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
