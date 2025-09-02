"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Bell, Settings, LogOut, UserCheck, Wifi, WifiOff, AlertTriangle, CreditCard } from "lucide-react"
import SecureLoginForm from "@/app/components/systems/auth/secure-login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle as AlertTriangleIcon, Mail, Clock } from "lucide-react"

export default function StaticPage() {
  const [activeTab, setActiveTab] = useState("login")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">PJPC安亲班管理系统</h1>
                <p className="text-sm text-gray-500">专业的安亲班教育管理解决方案</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Wifi className="h-3 w-3 mr-1" />
                系统在线
              </Badge>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：登录表单 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  用户登录
                </CardTitle>
                <CardDescription>
                  使用您的账户登录系统，开始管理安亲班事务
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SecureLoginForm />
              </CardContent>
            </Card>

            {/* 系统状态 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  系统状态
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">PocketBase连接</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    正常
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">数据库状态</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    在线
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">系统版本</span>
                  <Badge variant="outline">
                    v2.0.0
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：功能介绍 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  系统功能
                </CardTitle>
                <CardDescription>
                  PJPC安亲班管理系统提供全面的教育管理解决方案
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">考勤管理</h3>
                      <p className="text-sm text-gray-600">学生和教师考勤记录，支持NFC卡片签到</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <GraduationCap className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">学生管理</h3>
                      <p className="text-sm text-gray-600">学生信息管理，成绩跟踪，家长沟通</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">财务管理</h3>
                      <p className="text-sm text-gray-600">费用管理，发票生成，财务报表</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Settings className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">系统管理</h3>
                      <p className="text-sm text-gray-600">用户权限管理，系统配置，数据备份</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快速访问 */}
            <Card>
              <CardHeader>
                <CardTitle>快速访问</CardTitle>
                <CardDescription>
                  常用功能的快速入口
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-12 flex flex-col items-center gap-1">
                    <UserCheck className="h-4 w-4" />
                    <span className="text-xs">考勤管理</span>
                  </Button>
                  <Button variant="outline" className="h-12 flex flex-col items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-xs">学生管理</span>
                  </Button>
                  <Button variant="outline" className="h-12 flex flex-col items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-xs">财务管理</span>
                  </Button>
                  <Button variant="outline" className="h-12 flex flex-col items-center gap-1">
                    <Settings className="h-4 w-4" />
                    <span className="text-xs">系统设置</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 PJPC安亲班管理系统. 保留所有权利.</p>
                               <p className="mt-1">技术支持: 系统管理员 | 版本: v2.0.0 | 部署时间: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
