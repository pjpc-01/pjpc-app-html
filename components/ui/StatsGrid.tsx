"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCard {
  title: string
  value: string | number
  icon: LucideIcon
  color: string
  trend?: string
  description?: string
}

interface StatsGridProps {
  stats: StatCard[]
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export default function StatsGrid({ 
  stats, 
  columns = 4, 
  className 
}: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5'
  }

  return (
    <div className={cn("grid gap-6 mb-8", gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
                {stat.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                )}
                {stat.trend && (
                  <p className="text-xs text-green-600 mt-1">
                    {stat.trend}
                  </p>
                )}
              </div>
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                stat.color
              )}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
