"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Users, CreditCard, BarChart3, Settings, Bell } from "lucide-react"

interface StaticPageProps {
  className?: string
}

export default function StaticPage({ className = "" }: StaticPageProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${className}`}>
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            欢迎使用安亲班管理系统
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            一个现代化的教育管理平台，帮助您更好地管理学生、教师和财务信息
          </p>
        </div>

        {/* 功能卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* 学生管理 */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">学生管理</CardTitle>
                  <CardDescription>管理学生信息和积分系统</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                完整的学生档案管理，包括基本信息、积分记录、考勤统计等。
              </p>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                核心功能
              </Badge>
            </CardContent>
          </Card>

          {/* 教师管理 */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">教师管理</CardTitle>
                  <CardDescription>教师信息和权限管理</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                教师账户管理，权限分配，教学任务安排等功能。
              </p>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                管理功能
              </Badge>
            </CardContent>
          </Card>

          {/* 财务管理 */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">财务管理</CardTitle>
                  <CardDescription>学费和支出管理</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                学费收取，发票管理，财务报表生成等功能。
              </p>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                财务功能
              </Badge>
            </CardContent>
          </Card>

          {/* 数据分析 */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">数据分析</CardTitle>
                  <CardDescription>统计报表和趋势分析</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                学生表现分析，财务统计，考勤报告等数据可视化。
              </p>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                分析功能
              </Badge>
            </CardContent>
          </Card>

          {/* 系统设置 */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Settings className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">系统设置</CardTitle>
                  <CardDescription>系统配置和参数调整</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                系统参数配置，用户权限管理，数据备份等功能。
              </p>
              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                系统功能
              </Badge>
            </CardContent>
          </Card>

          {/* 通知中心 */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Bell className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">通知中心</CardTitle>
                  <CardDescription>消息和提醒管理</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                系统通知，重要提醒，消息推送等功能。
              </p>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                通知功能
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* 底部信息 */}
        <div className="text-center text-gray-500">
          <p className="mb-2">© 2024 安亲班管理系统. 保留所有权利.</p>
          <p className="text-sm">版本 1.0.0 | 技术支持: 系统管理员</p>
        </div>
      </div>
    </div>
  )
}
