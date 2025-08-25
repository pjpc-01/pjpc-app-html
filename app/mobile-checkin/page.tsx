"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  CreditCard, 
  Globe, 
  Shield, 
  Zap,
  ArrowRight,
  Home,
  Info
} from "lucide-react"
import Link from "next/link"

// 中心信息
const centers = [
  {
    id: 'wx01',
    name: 'WX 01',
    description: '主要教学中心',
    status: 'active',
    studentCount: 25,
    lastActivity: '2分钟前'
  },
  {
    id: 'wx02', 
    name: 'WX 02',
    description: '分校教学点',
    status: 'active',
    studentCount: 18,
    lastActivity: '5分钟前'
  },
  {
    id: 'wx03',
    name: 'WX 03', 
    description: '新开教学中心',
    status: 'active',
    studentCount: 12,
    lastActivity: '1小时前'
  },
  {
    id: 'wx04',
    name: 'WX 04',
    description: '远程教学点',
    status: 'maintenance',
    studentCount: 8,
    lastActivity: '维护中'
  }
]

export default function MobileCheckinIndexPage() {
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Smartphone className="h-12 w-12 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">移动端考勤系统</h1>
              <p className="text-gray-600 mt-1">选择中心进行NFC考勤打卡</p>
            </div>
          </div>
          
          {/* 返回首页按钮 */}
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <Home className="h-4 w-4" />
            <span>返回首页</span>
          </Link>
        </div>

        {/* 系统状态概览 */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Shield className="h-5 w-5" />
              系统状态概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {centers.filter(c => c.status === 'active').length}
                </div>
                <div className="text-sm text-blue-700">活跃中心</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {centers.reduce((sum, c) => sum + c.studentCount, 0)}
                </div>
                <div className="text-sm text-green-700">总学生数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {centers.filter(c => c.status === 'active').length}
                </div>
                <div className="text-sm text-purple-700">可用打卡点</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  HTTPS
                </div>
                <div className="text-sm text-orange-700">安全协议</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 中心选择 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 text-center">
            选择考勤中心
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {centers.map((center) => (
              <Card 
                key={center.id}
                className={`border-2 transition-all hover:shadow-lg cursor-pointer ${
                  center.status === 'active' 
                    ? 'border-green-200 hover:border-green-300 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
                onClick={() => center.status === 'active' && setSelectedCenter(center.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">{center.name}</h3>
                    </div>
                    <Badge variant={center.status === 'active' ? 'default' : 'secondary'}>
                      {center.status === 'active' ? '可用' : '维护中'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{center.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>学生数: {center.studentCount}</span>
                    <span>活动: {center.lastActivity}</span>
                  </div>
                  
                  {center.status === 'active' ? (
                    <Link href={`/mobile-checkin/${center.id}`}>
                      <Button className="w-full" size="sm">
                        <span>开始打卡</span>
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-full" size="sm" disabled>
                      维护中
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 使用说明 */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="h-5 w-5" />
              使用说明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>选择你要进行考勤的中心</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>确保手机支持NFC功能</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>使用HTTPS协议访问页面</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>将学生NFC卡片贴近手机背面进行打卡</p>
            </div>
          </CardContent>
        </Card>

        {/* 技术特性 */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Zap className="h-5 w-5" />
              技术特性
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">HTTPS安全协议</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">NFC卡片读取</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">实时考勤记录</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">多中心支持</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">设备信息记录</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">离线缓存支持</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 快速访问链接 */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">快速访问链接</p>
          <div className="flex flex-wrap justify-center gap-2">
            {centers.filter(c => c.status === 'active').map(center => (
              <Link key={center.id} href={`/mobile-checkin/${center.id}`}>
                <Button variant="outline" size="sm">
                  {center.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
