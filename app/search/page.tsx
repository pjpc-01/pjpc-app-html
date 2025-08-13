"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  ArrowLeft, 
  Filter, 
  X,
  Users,
  DollarSign,
  FileText,
  Receipt,
  Bell,
  CreditCard,
  TrendingUp,
  Clock
} from "lucide-react"
import { GlobalSearch, QuickGlobalFilters } from "@/components/shared"
import { useAuth } from "@/contexts/pocketbase-auth-context"

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userProfile } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // 从URL参数获取初始搜索词
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setSearchTerm(q)
    }
  }, [searchParams])

  const handleFilterSelect = (filterId: string) => {
    setActiveFilters(prev => {
      if (prev.includes(filterId)) {
        return prev.filter(id => id !== filterId)
      } else {
        return [...prev, filterId]
      }
    })
  }

  const clearAllFilters = () => {
    setActiveFilters([])
  }

  const handleSearchResult = (result: any) => {
    // 处理搜索结果点击
    console.log('Search result clicked:', result)
  }

  const getFilterDescription = () => {
    if (activeFilters.length === 0) return "显示所有结果"
    
    const filterLabels = activeFilters.map(filterId => {
      switch (filterId) {
        case 'all-students': return '所有学生'
        case 'primary-students': return '小学生'
        case 'secondary-students': return '中学生'
        case 'new-students': return '新生'
        case 'pending-invoices': return '待处理发票'
        case 'overdue-invoices': return '逾期发票'
        case 'recent-payments': return '最近付款'
        case 'fee-items': return '费用项目'
        case 'active-reminders': return '活跃提醒'
        case 'today-reminders': return '今日提醒'
        case 'completed-reminders': return '已完成提醒'
        case 'recent-activity': return '最近活动'
        case 'this-week': return '本周'
        case 'this-month': return '本月'
        default: return filterId
      }
    })
    
    return `筛选: ${filterLabels.join(', ')}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                返回
              </Button>
              <div className="flex items-center gap-2">
                <Search className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">全局搜索</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                筛选
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧筛选面板 */}
          {showFilters && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    筛选选项
                  </CardTitle>
                  <CardDescription>
                    快速筛选不同类型的数据
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QuickGlobalFilters
                    onFilterSelect={handleFilterSelect}
                    activeFilters={activeFilters}
                  />
                  
                  {activeFilters.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllFilters}
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        清除所有筛选
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* 主搜索区域 */}
          <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            <div className="space-y-6">
              {/* 搜索框 */}
              <Card>
                <CardContent className="p-6">
                  <GlobalSearch
                    placeholder="搜索学生、费用、发票、收据、提醒..."
                    className="w-full"
                    onResultClick={handleSearchResult}
                  />
                </CardContent>
              </Card>

              {/* 筛选状态 */}
              {activeFilters.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{getFilterDescription()}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                      >
                        <X className="h-4 w-4 mr-1" />
                        清除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 搜索统计 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    搜索统计
                  </CardTitle>
                  <CardDescription>
                    系统数据概览
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">学生</div>
                      <div className="text-sm text-gray-600">管理学生档案</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">费用</div>
                      <div className="text-sm text-gray-600">费用项目管理</div>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">发票</div>
                      <div className="text-sm text-gray-600">发票管理</div>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <Receipt className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-orange-600">收据</div>
                      <div className="text-sm text-gray-600">收据管理</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 搜索提示 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    搜索提示
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">学生搜索</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 按姓名搜索：输入学生姓名</li>
                        <li>• 按学号搜索：输入学生ID</li>
                        <li>• 按年级搜索：输入年级名称</li>
                        <li>• 按中心搜索：输入中心名称</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">财务搜索</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 按发票号搜索：输入发票号码</li>
                        <li>• 按费用名称搜索：输入费用项目</li>
                        <li>• 按状态搜索：待处理、已付款等</li>
                        <li>• 按金额搜索：输入具体金额</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 最近搜索 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    最近搜索
                  </CardTitle>
                  <CardDescription>
                    您最近的搜索记录
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>开始搜索以查看历史记录</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
