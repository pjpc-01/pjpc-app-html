"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Smartphone, 
  Laptop, 
  Wifi,
  Shield,
  Zap,
  BookOpen,
  Users,
  Settings
} from "lucide-react"

export default function NFCGuidePage() {
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<any>(null)

  useEffect(() => {
    // 检测NFC支持
    const checkNFCSupport = () => {
      if (typeof window !== 'undefined') {
        const supported = 'NDEFReader' in window
        setNfcSupported(supported)
        
        // 获取设备信息
        setDeviceInfo({
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          isSecureContext: window.isSecureContext,
          hasNFC: supported
        })
      }
    }
    checkNFCSupport()
  }, [])

  const getBrowserSupport = () => {
    if (!deviceInfo) return '检测中...'
    
    const ua = deviceInfo.userAgent.toLowerCase()
    if (ua.includes('chrome')) return 'Chrome (支持)'
    if (ua.includes('firefox')) return 'Firefox (部分支持)'
    if (ua.includes('safari')) return 'Safari (不支持)'
    if (ua.includes('edge')) return 'Edge (支持)'
    return '未知浏览器'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NFC积分系统使用指南</h1>
          <p className="text-gray-600">了解如何使用NFC功能进行积分操作</p>
        </div>

        {/* 设备状态检测 */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Info className="h-5 w-5" />
              设备状态检测
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">NFC支持</p>
                  <p className={`text-sm ${nfcSupported ? 'text-green-600' : 'text-red-600'}`}>
                    {nfcSupported === null ? '检测中...' : nfcSupported ? '支持' : '不支持'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">安全连接</p>
                  <p className={`text-sm ${deviceInfo?.isSecureContext ? 'text-green-600' : 'text-red-600'}`}>
                    {deviceInfo?.isSecureContext ? 'HTTPS' : 'HTTP'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Smartphone className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">浏览器</p>
                  <p className="text-sm text-gray-600">{getBrowserSupport()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NFC功能说明 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                NFC扫描功能
              </CardTitle>
              <CardDescription>如何使用NFC扫描学生卡片</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                  <div>
                    <h4 className="font-medium text-gray-900">准备NFC卡片</h4>
                    <p className="text-sm text-gray-600">确保学生NFC卡片已写入正确的URL或学号信息</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                  <div>
                    <h4 className="font-medium text-gray-900">点击扫描按钮</h4>
                    <p className="text-sm text-gray-600">在积分管理页面点击"扫描学生NFC卡片"按钮</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                  <div>
                    <h4 className="font-medium text-gray-900">贴近设备</h4>
                    <p className="text-sm text-gray-600">将NFC卡片贴近支持NFC的设备（手机或平板）</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
                  <div>
                    <h4 className="font-medium text-gray-900">自动识别</h4>
                    <p className="text-sm text-gray-600">系统自动识别学生信息并显示积分详情</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                手动输入功能
              </CardTitle>
              <CardDescription>当NFC不可用时的替代方案</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                  <div>
                    <h4 className="font-medium text-gray-900">输入学生信息</h4>
                    <p className="text-sm text-gray-600">在输入框中输入学生学号、URL或NFC卡号</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                  <div>
                    <h4 className="font-medium text-gray-900">点击处理按钮</h4>
                    <p className="text-sm text-gray-600">点击"扫描学生卡片"按钮处理输入的信息</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                  <div>
                    <h4 className="font-medium text-gray-900">系统匹配</h4>
                    <p className="text-sm text-gray-600">系统自动匹配学生信息并显示积分详情</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 支持的输入格式 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              支持的输入格式
            </CardTitle>
            <CardDescription>系统支持多种学生信息输入格式</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">学生学号</h4>
                <p className="text-sm text-gray-600 mb-2">直接输入学生学号</p>
                <div className="bg-gray-100 p-2 rounded text-xs font-mono">S001</div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">学生URL</h4>
                <p className="text-sm text-gray-600 mb-2">完整的学生URL地址</p>
                <div className="bg-gray-100 p-2 rounded text-xs font-mono break-all">https://example.com/student/S001</div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">NFC卡号</h4>
                <p className="text-sm text-gray-600 mb-2">NFC卡片中的唯一标识</p>
                <div className="bg-gray-100 p-2 rounded text-xs font-mono">NFC123456</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 浏览器兼容性 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              浏览器兼容性
            </CardTitle>
            <CardDescription>不同浏览器对NFC功能的支持情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Chrome (Android)</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">完全支持</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Edge (Android)</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">完全支持</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">Firefox (Android)</span>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">部分支持</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Safari (iOS)</span>
                  </div>
                  <Badge className="bg-red-100 text-red-800">不支持</Badge>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">重要提示</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• NFC功能需要HTTPS安全连接</li>
                  <li>• 建议使用Chrome浏览器获得最佳体验</li>
                  <li>• 如果NFC不可用，系统会自动切换到手动输入模式</li>
                  <li>• 确保设备支持NFC功能</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 操作步骤 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-600" />
              完整操作流程
            </CardTitle>
            <CardDescription>从扫描到完成积分操作的完整步骤</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { step: '扫描学生', desc: '扫描学生NFC卡片或手动输入学生信息', icon: CreditCard },
                { step: '查看积分', desc: '系统显示学生当前积分和详细信息', icon: Users },
                { step: '选择操作', desc: '选择添加积分、扣除积分或兑换礼品', icon: Settings },
                { step: '验证教师', desc: '验证教师身份以确保操作安全', icon: Shield },
                { step: '确认操作', desc: '填写操作原因并确认积分变更', icon: CheckCircle },
                { step: '完成', desc: '操作完成，积分已更新', icon: Zap }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                      <item.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.step}</h4>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                  {index < 5 && (
                    <div className="flex-shrink-0 mt-5">
                      <div className="w-0.5 h-8 bg-gray-200"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 测试按钮 */}
        <div className="text-center">
          <Button 
            onClick={() => window.open('/points-management', '_blank')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            开始使用NFC积分系统
          </Button>
        </div>
      </div>
    </div>
  )
}
