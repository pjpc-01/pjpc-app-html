"use client"

import { useAuth } from "@/contexts/pocketbase-auth-context"
import ConnectionStatus from "@/components/ConnectionStatus"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { GraduationCap, Bell, LogOut } from "lucide-react"

interface TeacherNavigationProps {
  title?: string
  showUnifiedAttendance?: boolean
}

export default function TeacherNavigation({ 
  title = "教师工作台",
  showUnifiedAttendance = false 
}: TeacherNavigationProps) {
  const { user, userProfile, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="温馨小屋" 
                className="h-8 w-auto mr-3"
                onError={(e) => {
                  // 如果logo文件不存在，显示备用图标
                  e.currentTarget.style.display = 'none'
                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                  if (nextElement) {
                    nextElement.style.display = 'block'
                  }
                }}
              />
              <GraduationCap className="h-8 w-8 text-blue-600 mr-3 hidden" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <ConnectionStatus />
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {userProfile?.name?.charAt(0) || user?.email?.charAt(0) || 'T'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{userProfile?.name || '教师'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              退出
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
