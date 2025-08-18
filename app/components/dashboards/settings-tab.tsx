"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import UserApproval from "../management/admin/user-approval"
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

  return (
    <div className="space-y-6">
      {/* 系统设置概览 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">系统设置</h2>
        <p className="text-gray-600">系统配置和安全监控</p>
      </div>

      {/* 系统状态指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <p className="text-sm font-medium text-gray-600">待审批</p>
                {statsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-orange-600">{stats?.pendingApprovals || 0}</p>
                    <p className="text-xs text-orange-600 flex items-center mt-1">
                      <FileText className="h-3 w-3 mr-1" />
                      待处理
                    </p>
                  </>
                )}
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
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

      {/* 系统功能卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("user-approval")}>
            <Users className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <h3 className="font-semibold mb-2">用户审批</h3>
            <p className="text-sm text-gray-600 mb-3">新用户注册审批</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {stats?.pendingApprovals || 0} 待审批
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("enterprise-user-approval")}>
            <Brain className="h-12 w-12 mx-auto mb-4 text-purple-600" />
            <h3 className="font-semibold mb-2">AI智能审核</h3>
            <p className="text-sm text-gray-600 mb-3">企业级AI增强用户审批</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                AI增强
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("unified-attendance")}>
            <UserCheck className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="font-semibold mb-2">统一打卡系统</h3>
            <p className="text-sm text-gray-600 mb-3">NFC/RFID统一出勤管理</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                实时监控
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-red-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("security-monitoring")}>
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <h3 className="font-semibold mb-2">安全监控</h3>
            <p className="text-sm text-gray-600 mb-3">系统安全状态监控</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                安全
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("communication-system")}>
            <Bell className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="font-semibold mb-2">通信系统</h3>
            <p className="text-sm text-gray-600 mb-3">消息和通知管理</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {stats?.totalMessages || 0} 消息
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("data-import")}>
            <Database className="h-12 w-12 mx-auto mb-4 text-purple-600" />
            <h3 className="font-semibold mb-2">数据导入</h3>
            <p className="text-sm text-gray-600 mb-3">批量数据导入工具</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                可用
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-orange-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("system-logs")}>
            <Activity className="h-12 w-12 mx-auto mb-4 text-orange-600" />
            <h3 className="font-semibold mb-2">系统日志</h3>
            <p className="text-sm text-gray-600 mb-3">系统操作日志查看</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                实时
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-indigo-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("backup-restore")}>
            <Settings className="h-12 w-12 mx-auto mb-4 text-indigo-600" />
            <h3 className="font-semibold mb-2">备份恢复</h3>
            <p className="text-sm text-gray-600 mb-3">数据备份和恢复</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                自动
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 设置子标签内容 */}
      {settingsSubTab && (
        <div className="mt-8">
          {settingsSubTab === "user-approval" && <UserApproval />}
          {settingsSubTab === "enterprise-user-approval" && <EnterpriseUserApproval />}
          {settingsSubTab === "unified-attendance" && <UnifiedAttendanceSystem />}
          {settingsSubTab === "security-monitoring" && <SecurityMonitoring />}
          {settingsSubTab === "communication-system" && <CommunicationSystem />}
          {settingsSubTab === "data-import" && (
            <div className="text-center py-12 text-gray-500">
              数据导入功能开发中...
            </div>
          )}
          {settingsSubTab === "system-logs" && (
            <div className="text-center py-12 text-gray-500">
              系统日志功能开发中...
            </div>
          )}
          {settingsSubTab === "backup-restore" && (
            <div className="text-center py-12 text-gray-500">
              备份恢复功能开发中...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
