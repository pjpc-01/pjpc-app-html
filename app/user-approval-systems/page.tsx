"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  Shield, 
  Users, 
  Zap, 
  BarChart3, 
  Activity,
  ArrowRight,
  Star,
  Sparkles,
  Target,
  CheckCircle,
  AlertTriangle
} from "lucide-react"

export default function UserApprovalSystemsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                用户审核系统
              </h1>
              <p className="text-gray-600 text-lg mt-2">
                选择适合您需求的用户审核解决方案
              </p>
            </div>
          </div>
        </div>

        {/* 系统选择卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* AI增强企业级系统 */}
          <Card className="relative overflow-hidden border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl">
            <div className="absolute top-0 right-0 p-2">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <Star className="w-3 h-3 mr-1" />
                推荐
              </Badge>
            </div>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-blue-900">AI增强企业级审核系统</CardTitle>
                  <CardDescription className="text-blue-700">
                    智能审核助手 - 基于AI的风险评估和自动决策
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 核心特性 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">AI智能分析</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">自动审核</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">实时分析</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">风险预测</span>
                </div>
              </div>

              {/* 功能列表 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>基于机器学习的风险评估算法</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>高置信度自动审核决策</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>智能批量处理和审核</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>详细的风险因素分析</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>实时数据可视化和监控</span>
                </div>
              </div>

              {/* 适用场景 */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">适用场景</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• 大型企业用户管理</div>
                  <div>• 金融机构客户审核</div>
                  <div>• 教育机构用户管理</div>
                  <div>• 需要高自动化审核的场景</div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <Link href="/ai-user-approval" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                    <Sparkles className="w-4 h-4 mr-2" />
                    体验AI增强系统
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 传统企业级系统 */}
          <Card className="relative overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all duration-300 hover:shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-900">传统企业级审核系统</CardTitle>
                  <CardDescription className="text-gray-700">
                    经典审核平台 - 功能完整的人工审核流程
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 核心特性 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">人工审核</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">批量操作</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">审计日志</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">数据分析</span>
                </div>
              </div>

              {/* 功能列表 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>完整的用户管理功能</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>批量审核和操作</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>详细的审计日志记录</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>多维度数据筛选</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>统计分析和报告</span>
                </div>
              </div>

              {/* 适用场景 */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">适用场景</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>• 中小型企业用户管理</div>
                  <div>• 需要完全人工控制的场景</div>
                  <div>• 传统审核流程</div>
                  <div>• 对AI技术有顾虑的组织</div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <Link href="/enterprise-user-approval" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Shield className="w-4 h-4 mr-2" />
                    使用传统系统
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 系统对比 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">系统功能对比</CardTitle>
            <CardDescription>详细的功能对比，帮助您选择最适合的解决方案</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">功能特性</th>
                    <th className="text-center py-3 px-4 font-medium">AI增强系统</th>
                    <th className="text-center py-3 px-4 font-medium">传统系统</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-3 px-4">AI风险评估</td>
                    <td className="text-center py-3 px-4">
                      <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center py-3 px-4">
                      <AlertTriangle className="w-4 h-4 text-gray-400 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">自动审核决策</td>
                    <td className="text-center py-3 px-4">
                      <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center py-3 px-4">
                      <AlertTriangle className="w-4 h-4 text-gray-400 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">智能批量处理</td>
                    <td className="text-center py-3 px-4">
                      <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center py-3 px-4">
                      <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">风险因素分析</td>
                    <td className="text-center py-3 px-4">
                      <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center py-3 px-4">
                      <AlertTriangle className="w-4 h-4 text-gray-400 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">实时数据可视化</td>
                    <td className="text-center py-3 px-4">
                      <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center py-3 px-4">
                      <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">审计日志</td>
                    <td className="text-center py-3 px-4">
                      <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center py-3 px-4">
                      <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">人工审核控制</td>
                    <td className="text-center py-3 px-4">
                      <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center py-3 px-4">
                      <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 联系信息 */}
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-gray-600 mb-4">
              需要更多信息或有特殊需求？请联系我们的技术支持团队
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                联系支持
              </Button>
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                查看演示
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
