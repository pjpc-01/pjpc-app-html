'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'
import SecureLoginForm from '../components/systems/auth/secure-login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Nunito, sans-serif' }}>安亲班管理系统</h1>
          <p className="text-amber-700/70 text-sm mt-1">请登录您的账户</p>
        </div>

        {/* Login Form */}
        <Card className="border-amber-200/60 shadow-xl shadow-amber-200/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-800">用户登录</CardTitle>
          </CardHeader>
          <CardContent>
            <SecureLoginForm />
          </CardContent>
        </Card>

        {/* System features */}
        <Card className="border-amber-100/50 bg-white/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-700">系统功能</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span>学生管理</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span>考勤打卡</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span>课程排班</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span>积分奖励</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
