"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bell, Settings, LogOut } from "lucide-react"
import Link from "next/link"

export interface PageLayoutProps {
  title: string
  description: string
  backUrl?: string
  userRole: 'admin' | 'teacher' | 'parent' | 'accountant'
  status?: string
  background?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export default function PageLayout({
  title,
  description,
  backUrl,
  userRole,
  status,
  background = "from-gray-50 to-gray-100",
  actions,
  children,
}: PageLayoutProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'from-blue-50 to-indigo-100'
      case 'teacher':
        return 'from-green-50 to-emerald-100'
      case 'parent':
        return 'from-purple-50 to-violet-100'
      case 'accountant':
        return 'from-orange-50 to-amber-100'
      default:
        return 'from-gray-50 to-gray-100'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理员'
      case 'teacher':
        return '老师'
      case 'parent':
        return '家长'
      case 'accountant':
        return '会计'
      default:
        return role
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${background}`}>
      {/* 页面头部 */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {backUrl && (
                <Link href={backUrl}>
                  <Button variant="ghost" size="sm" className="mr-2">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {status && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {status}
                </Badge>
              )}
              
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {getRoleLabel(userRole)}
              </Badge>
              
              {actions}
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}