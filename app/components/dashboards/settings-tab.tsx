"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Settings,
  Shield,
  Users,
  Activity,
  FileText,
  Database,
  Bell,
  RefreshCw,
  UserCheck,
  CreditCard,
  Brain,
  Zap,
  ArrowLeft,
  X,
  CheckCircle,
  Target,
  Sparkles,
  BarChart3,
  Clock,
  MessageSquare,
  Upload,
} from "lucide-react"
import SecurityMonitoring from "../systems/security-monitoring"
import CommunicationSystem from "../systems/communication-system"
import EnterpriseUserApproval from "../management/admin/enterprise-user-approval"
import UnifiedAttendanceSystem from "../systems/unified-attendance-system"

interface SettingsTabProps {
  stats: any
  statsLoading: boolean
  setActiveTab: (tab: string) => void
}

export default function SettingsTab({ stats, statsLoading, setActiveTab }: SettingsTabProps) {
  const [settingsSubTab, setSettingsSubTab] = useState<string>('')

  const handleCardClick = (tab: string) => {
    console.log('Settings card clicked, setting settingsSubTab to:', tab)
    setSettingsSubTab(tab)
  }

  const handleBackToMain = () => {
    setSettingsSubTab('')
  }

  // 如果当前在子功能中，显示子功能界面
  if (settingsSubTab) {
    return (
      <div className="space-y-6">
        {/* 子功能头部导航 */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToMain}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回设置
            </Button>
            <div className="h-4 w-px bg-gray-300" />
            <h2 className="text-lg font-medium text-gray-900">
              {settingsSubTab === "enterprise-user-approval" && "AI智能审核"}
              {settingsSubTab === "unified-attendance" && "统一打卡系统"}
              {settingsSubTab === "security-monitoring" && "安全监控"}
              {settingsSubTab === "communication-system" && "通信系统"}
              {settingsSubTab === "data-import" && "数据导入"}
              {settingsSubTab === "system-logs" && "系统日志"}
              {settingsSubTab === "backup-restore" && "备份恢复"}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToMain}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 子功能内容 */}
        <div className="min-h-[600px]">
          {settingsSubTab === "enterprise-user-approval" && <EnterpriseUserApproval />}
          {settingsSubTab === "unified-attendance" && <UnifiedAttendanceSystem />}
          {settingsSubTab === "security-monitoring" && <SecurityMonitoring />}
          {settingsSubTab === "communication-system" && <CommunicationSystem />}
          {settingsSubTab === "data-import" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">数据导入</h3>
                  <p className="text-sm text-gray-500">直接导入 CSV 数据到 PocketBase</p>
                </div>
                <Button
                  onClick={() => window.open('/data-import', '_blank')}
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  打开数据导入页面
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左侧：指南和模板 */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">导入指南</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 支持 CSV 文件格式</li>
                      <li>• 可直接粘贴数据</li>
                      <li>• 自动字段映射</li>
                      <li>• 实时预览功能</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">模板下载</h4>
                    <p className="text-sm text-gray-600 mb-3">下载标准模板文件</p>
                    <Button variant="outline" size="sm" className="w-full">
                      下载模板
                    </Button>
                  </div>
                </div>
                
                {/* 右侧：导入功能预览 */}
                <div className="lg:col-span-2">
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h4 className="font-medium mb-2">数据导入功能</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      点击上方按钮打开完整的数据导入页面
                    </p>
                    <Button
                      onClick={() => window.open('/data-import', '_blank')}
                      variant="outline"
                    >
                      在新窗口打开
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {settingsSubTab === "system-logs" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">系统日志</h3>
                  <p className="text-sm text-gray-500">查看系统操作和审计日志</p>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  即将推出
                </Badge>
              </div>
              
              <div className="text-center py-12">
                <Activity className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">系统日志功能</h4>
                <p className="text-gray-500 mb-4">系统操作日志查看功能正在开发中</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• 用户操作审计</p>
                  <p>• 系统事件记录</p>
                  <p>• 错误日志追踪</p>
                  <p>• 实时日志监控</p>
                </div>
              </div>
            </div>
          )}
          {settingsSubTab === "backup-restore" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">备份恢复</h3>
                  <p className="text-sm text-gray-500">数据备份和恢复管理</p>
                </div>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                  即将推出
                </Badge>
              </div>
              
              <div className="text-center py-12">
                <Settings className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">备份恢复功能</h4>
                <p className="text-gray-500 mb-4">数据备份和恢复功能正在开发中</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• 自动数据备份</p>
                  <p>• 手动备份创建</p>
                  <p>• 数据恢复功能</p>
                  <p>• 备份历史管理</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 主设置界面
  return (
    <div className="space-y-6">
      {/* 系统设置概览 */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-1 text-gray-700">设置</h2>
        <p className="text-sm text-gray-500">系统配置</p>
      </div>

      {/* 系统状态指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">系统状态</p>
                {statsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-green-600">正常</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <Activity className="h-3 w-3 mr-1" />
                      运行中
                    </p>
                  </>
                )}
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">在线用户</p>
                {statsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-blue-600">{stats?.onlineUsers || 0}</p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <Users className="h-3 w-3 mr-1" />
                      活跃用户
                    </p>
                  </>
                )}
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">数据库</p>
                {statsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-purple-600">正常</p>
                    <p className="text-xs text-purple-600 flex items-center mt-1">
                      <Database className="h-3 w-3 mr-1" />
                      连接正常
                    </p>
                  </>
                )}
              </div>
              <Database className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 系统功能卡片 - 企业级设计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <CardContent className="p-6 text-center relative" onClick={() => handleCardClick("enterprise-user-approval")}>
            <div className="p-3 bg-purple-100 rounded-lg w-16 h-16 mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <Brain className="h-10 w-10 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-purple-700">AI智能审核</h3>
            <p className="text-sm text-purple-600 mb-3">企业级AI增强用户审批系统</p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-center text-xs text-purple-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                智能风险评估
              </div>
              <div className="flex items-center justify-center text-xs text-purple-700">
                <Target className="h-3 w-3 mr-1" />
                自动审批流程
              </div>
              <div className="flex items-center justify-center text-xs text-purple-700">
                <Shield className="h-3 w-3 mr-1" />
                安全防护
              </div>
            </div>
            {!statsLoading && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white group-hover:scale-105 transition-transform">
                <Sparkles className="h-3 w-3 mr-1" />
                AI增强
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <CardContent className="p-6 text-center relative" onClick={() => handleCardClick("unified-attendance")}>
            <div className="p-3 bg-green-100 rounded-lg w-16 h-16 mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <UserCheck className="h-10 w-10 text-green-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-green-700">统一打卡系统</h3>
            <p className="text-sm text-green-600 mb-3">NFC/RFID统一出勤管理</p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-center text-xs text-green-700">
                <Activity className="h-3 w-3 mr-1" />
                实时监控
              </div>
              <div className="flex items-center justify-center text-xs text-green-700">
                <Clock className="h-3 w-3 mr-1" />
                自动记录
              </div>
              <div className="flex items-center justify-center text-xs text-green-700">
                <BarChart3 className="h-3 w-3 mr-1" />
                数据分析
              </div>
            </div>
            {!statsLoading && (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white group-hover:scale-105 transition-transform">
                <Activity className="h-3 w-3 mr-1" />
                实时监控
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-red-300 bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <CardContent className="p-6 text-center relative" onClick={() => handleCardClick("security-monitoring")}>
            <div className="p-3 bg-red-100 rounded-lg w-16 h-16 mx-auto mb-4 group-hover:bg-red-200 transition-colors">
              <Shield className="h-10 w-10 text-red-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-red-700">安全监控</h3>
            <p className="text-sm text-red-600 mb-3">系统安全状态监控</p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-center text-xs text-red-700">
                <Shield className="h-3 w-3 mr-1" />
                实时防护
              </div>
              <div className="flex items-center justify-center text-xs text-red-700">
                <Activity className="h-3 w-3 mr-1" />
                威胁检测
              </div>
              <div className="flex items-center justify-center text-xs text-red-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                安全审计
              </div>
            </div>
            {!statsLoading && (
              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white group-hover:scale-105 transition-transform">
                <Shield className="h-3 w-3 mr-1" />
                安全
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <CardContent className="p-6 text-center relative" onClick={() => handleCardClick("communication-system")}>
            <div className="p-3 bg-blue-100 rounded-lg w-16 h-16 mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <Bell className="h-10 w-10 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-blue-700">通信系统</h3>
            <p className="text-sm text-blue-600 mb-3">消息和通知管理</p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-center text-xs text-blue-700">
                <Bell className="h-3 w-3 mr-1" />
                实时通知
              </div>
              <div className="flex items-center justify-center text-xs text-blue-700">
                <MessageSquare className="h-3 w-3 mr-1" />
                消息管理
              </div>
              <div className="flex items-center justify-center text-xs text-blue-700">
                <Users className="h-3 w-3 mr-1" />
                用户沟通
              </div>
            </div>
            {!statsLoading && (
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white group-hover:scale-105 transition-transform">
                <Bell className="h-3 w-3 mr-1" />
                {stats?.totalMessages || 0} 消息
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <CardContent className="p-6 text-center relative" onClick={() => handleCardClick("data-import")}>
            <div className="p-3 bg-purple-100 rounded-lg w-16 h-16 mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <Database className="h-10 w-10 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-purple-700">数据导入</h3>
            <p className="text-sm text-purple-600 mb-3">批量数据导入工具</p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-center text-xs text-purple-700">
                <Database className="h-3 w-3 mr-1" />
                CSV导入
              </div>
              <div className="flex items-center justify-center text-xs text-purple-700">
                <Upload className="h-3 w-3 mr-1" />
                批量处理
              </div>
              <div className="flex items-center justify-center text-xs text-purple-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                数据验证
              </div>
            </div>
            {!statsLoading && (
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white group-hover:scale-105 transition-transform">
                <Database className="h-3 w-3 mr-1" />
                可用
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <CardContent className="p-6 text-center relative" onClick={() => handleCardClick("system-logs")}>
            <div className="p-3 bg-orange-100 rounded-lg w-16 h-16 mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
              <Activity className="h-10 w-10 text-orange-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-orange-700">系统日志</h3>
            <p className="text-sm text-orange-600 mb-3">系统操作日志查看</p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-center text-xs text-orange-700">
                <Activity className="h-3 w-3 mr-1" />
                实时监控
              </div>
              <div className="flex items-center justify-center text-xs text-orange-700">
                <FileText className="h-3 w-3 mr-1" />
                操作审计
              </div>
              <div className="flex items-center justify-center text-xs text-orange-700">
                <BarChart3 className="h-3 w-3 mr-1" />
                数据分析
              </div>
            </div>
            {!statsLoading && (
              <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white group-hover:scale-105 transition-transform">
                <Activity className="h-3 w-3 mr-1" />
                实时
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-indigo-300 bg-gradient-to-br from-indigo-50 to-blue-50 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <CardContent className="p-6 text-center relative" onClick={() => handleCardClick("backup-restore")}>
            <div className="p-3 bg-indigo-100 rounded-lg w-16 h-16 mx-auto mb-4 group-hover:bg-indigo-200 transition-colors">
              <Settings className="h-10 w-10 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-indigo-700">备份恢复</h3>
            <p className="text-sm text-indigo-600 mb-3">数据备份和恢复</p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-center text-xs text-indigo-700">
                <Database className="h-3 w-3 mr-1" />
                自动备份
              </div>
              <div className="flex items-center justify-center text-xs text-indigo-700">
                <Shield className="h-3 w-3 mr-1" />
                数据保护
              </div>
              <div className="flex items-center justify-center text-xs text-indigo-700">
                <RefreshCw className="h-3 w-3 mr-1" />
                快速恢复
              </div>
            </div>
            {!statsLoading && (
              <Badge className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white group-hover:scale-105 transition-transform">
                <Settings className="h-3 w-3 mr-1" />
                自动
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
