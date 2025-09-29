"use client"

import { useSearchParams } from "next/navigation"
import { CreditCard, CheckCircle, AlertTriangle, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import PageLayout from "@/components/layouts/PageLayout"
import StatsGrid from "@/components/ui/StatsGrid"
import UnifiedCardManager from "../components/systems/UnifiedCardManager"

export default function CardManagementPage() {
  const searchParams = useSearchParams()
  const centerId = searchParams.get('center')

  const stats = [
    {
      title: "总卡片数",
      value: "1,234",
      icon: CreditCard,
      color: "bg-blue-100",
      trend: "+12 本周新增"
    },
    {
      title: "活跃卡片",
      value: "1,156",
      icon: CheckCircle,
      color: "bg-green-100",
      description: "93.7% 活跃率"
    },
    {
      title: "待补办",
      value: "23",
      icon: AlertTriangle,
      color: "bg-orange-100",
      description: "需要处理"
    },
    {
      title: "今日使用",
      value: "456",
      icon: BarChart3,
      color: "bg-purple-100",
      trend: "+8.2% 较昨日"
    }
  ]

  return (
    <PageLayout
      title="卡片管理系统"
      description="NFC/RFID卡片管理、补办、关联、监控"
      backUrl="/"
      userRole="admin"
      status="系统正常"
      background="from-purple-50 to-indigo-100"
    >
      {/* 快速统计卡片 */}
      <StatsGrid stats={stats} columns={4} />

      {/* 统一卡片管理组件 */}
      <UnifiedCardManager center={centerId || undefined} />
    </PageLayout>
  )
}