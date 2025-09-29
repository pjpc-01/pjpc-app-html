"use client"

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description: string
  backUrl?: string
  userRole?: 'admin' | 'teacher' | 'parent' | 'accountant'
  status?: string
  showStats?: boolean
  actions?: React.ReactNode
}

export default function PageHeader({
  title,
  description,
  backUrl,
  userRole = 'admin',
  status = '系统正常',
  showStats = false,
  actions
}: PageHeaderProps) {
  const getStatusColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'teacher':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'parent':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'accountant':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-green-50 text-green-700 border-green-200'
    }
  }

  const getBackText = (role: string) => {
    switch (role) {
      case 'admin':
        return '返回管理中心'
      case 'teacher':
        return '返回工作台'
      case 'parent':
        return '返回家长中心'
      case 'accountant':
        return '返回会计中心'
      default:
        return '返回首页'
    }
  }

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左侧：返回和标题 */}
          <div className="flex items-center space-x-4">
            {backUrl && (
              <>
                <Link 
                  href={backUrl} 
                  className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {getBackText(userRole)}
                </Link>
                <div className="h-6 w-px bg-gray-300" />
              </>
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>

          {/* 右侧：状态和操作 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{new Date().toLocaleString('zh-CN')}</span>
            </div>
            <Badge variant="outline" className={cn("", getStatusColor(userRole))}>
              {status}
            </Badge>
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
