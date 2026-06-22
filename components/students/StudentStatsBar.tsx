"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, UserCheck, GraduationCap, TrendingUp } from "lucide-react"

interface StudentStats {
  total: number
  active: number
  inactive: number
  primaryCount: number
  secondaryCount: number
}

interface StudentStatsBarProps {
  stats: StudentStats
}

export default function StudentStatsBar({ stats }: StudentStatsBarProps) {
  const cards = [
    {
      label: "总学生数",
      value: stats.total,
      subtext: "实时数据",
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      textColor: "from-blue-600 to-blue-800",
      subColor: "text-blue-600",
    },
    {
      label: "在读学生",
      value: stats.active,
      subtext: "活跃状态",
      icon: UserCheck,
      gradient: "from-green-500 to-green-600",
      textColor: "from-green-600 to-green-800",
      subColor: "text-green-600",
    },
    {
      label: "小学生",
      value: stats.primaryCount,
      subtext: "一年级到六年级",
      icon: GraduationCap,
      gradient: "from-orange-500 to-orange-600",
      textColor: "from-orange-600 to-orange-800",
      subColor: "text-orange-600",
    },
    {
      label: "中学生",
      value: stats.secondaryCount,
      subtext: "初一到高三",
      icon: GraduationCap,
      gradient: "from-purple-500 to-purple-600",
      textColor: "from-purple-600 to-purple-800",
      subColor: "text-purple-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
        >
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                <p className={`text-3xl font-bold bg-gradient-to-r ${card.textColor} bg-clip-text text-transparent`}>
                  {card.value}
                </p>
                <p className={`text-xs ${card.subColor} flex items-center`}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {card.subtext}
                </p>
              </div>
              <div
                className={`w-12 h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center shadow-lg`}
              >
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
