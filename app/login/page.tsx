'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, School } from 'lucide-react'
import Link from 'next/link'
import SecureLoginForm from '../components/systems/auth/secure-login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* 页面标题和导航 */}
        <div className="text-center">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-2">
            <School className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">安亲班管理系统</h1>
          </div>
          <p className="text-gray-600">请登录您的账户</p>
        </div>

        {/* 登录表单 */}
        <Card>
          <CardHeader>
            <CardTitle>用户登录</CardTitle>
            <CardDescription>
              登录到安亲班管理系统，管理学生、课程和考勤
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SecureLoginForm />
          </CardContent>
        </Card>

        {/* 系统说明 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">系统功能</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>学生信息管理</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>考勤打卡系统</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>课程排班管理</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>积分奖励系统</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

