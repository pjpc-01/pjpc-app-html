"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Users,
  Clock,
  UserCheck,
  Activity,
  Brain,
  Zap,
  Lightbulb,
  Target,
  BarChart,
  Sparkles
} from "lucide-react"

interface ApprovalStatsProps {
  stats: {
    total: number
    pending: number
    approved: number
    suspended: number
    todayApproved: number
    todaySuspended: number
    avgApprovalTime: number
  }
}

export default function ApprovalStats({ stats }: ApprovalStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总用户数</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">待审核</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">今日审核</p>
              <p className="text-2xl font-bold text-green-600">{stats.todayApproved}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">平均审核时间</p>
              <p className="text-2xl font-bold text-purple-600">{stats.avgApprovalTime}h</p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
