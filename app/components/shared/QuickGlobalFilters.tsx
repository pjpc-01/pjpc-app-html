"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  DollarSign, 
  FileText, 
  Receipt, 
  Bell, 
  CreditCard,
  Calendar,
  Star,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from "lucide-react"

interface QuickGlobalFilter {
  id: string
  label: string
  icon: React.ReactNode
  description: string
  color: 'default' | 'secondary' | 'destructive' | 'outline'
  category: 'students' | 'finance' | 'notifications' | 'recent'
}

interface QuickGlobalFiltersProps {
  onFilterSelect: (filterId: string) => void
  activeFilters: string[]
  className?: string
}

const quickGlobalFilters: QuickGlobalFilter[] = [
  // 学生相关
  {
    id: 'all-students',
    label: '所有学生',
    icon: <Users className="h-4 w-4" />,
    description: '查看所有学生',
    color: 'default',
    category: 'students'
  },
  {
    id: 'primary-students',
    label: '小学生',
    icon: <Users className="h-4 w-4" />,
    description: '小学级别学生',
    color: 'secondary',
    category: 'students'
  },
  {
    id: 'secondary-students',
    label: '中学生',
    icon: <Users className="h-4 w-4" />,
    description: '中学级别学生',
    color: 'secondary',
    category: 'students'
  },
  {
    id: 'new-students',
    label: '新生',
    icon: <Star className="h-4 w-4" />,
    description: '最近入学学生',
    color: 'outline',
    category: 'students'
  },

  // 财务相关
  {
    id: 'pending-invoices',
    label: '待处理发票',
    icon: <FileText className="h-4 w-4" />,
    description: '未付款的发票',
    color: 'destructive',
    category: 'finance'
  },
  {
    id: 'overdue-invoices',
    label: '逾期发票',
    icon: <AlertTriangle className="h-4 w-4" />,
    description: '已逾期的发票',
    color: 'destructive',
    category: 'finance'
  },
  {
    id: 'recent-payments',
    label: '最近付款',
    icon: <CreditCard className="h-4 w-4" />,
    description: '最近的付款记录',
    color: 'outline',
    category: 'finance'
  },
  {
    id: 'fee-items',
    label: '费用项目',
    icon: <DollarSign className="h-4 w-4" />,
    description: '所有费用项目',
    color: 'outline',
    category: 'finance'
  },

  // 通知相关
  {
    id: 'active-reminders',
    label: '活跃提醒',
    icon: <Bell className="h-4 w-4" />,
    description: '需要关注的提醒',
    color: 'destructive',
    category: 'notifications'
  },
  {
    id: 'today-reminders',
    label: '今日提醒',
    icon: <Clock className="h-4 w-4" />,
    description: '今天的提醒事项',
    color: 'destructive',
    category: 'notifications'
  },
  {
    id: 'completed-reminders',
    label: '已完成提醒',
    icon: <CheckCircle className="h-4 w-4" />,
    description: '已完成的提醒',
    color: 'outline',
    category: 'notifications'
  },

  // 最近活动
  {
    id: 'recent-activity',
    label: '最近活动',
    icon: <TrendingUp className="h-4 w-4" />,
    description: '最近的活动记录',
    color: 'outline',
    category: 'recent'
  },
  {
    id: 'this-week',
    label: '本周',
    icon: <Calendar className="h-4 w-4" />,
    description: '本周的记录',
    color: 'outline',
    category: 'recent'
  },
  {
    id: 'this-month',
    label: '本月',
    icon: <Calendar className="h-4 w-4" />,
    description: '本月的记录',
    color: 'outline',
    category: 'recent'
  }
]

export default function QuickGlobalFilters({ 
  onFilterSelect, 
  activeFilters, 
  className = "" 
}: QuickGlobalFiltersProps) {
  // 按类别分组
  const groupedFilters = quickGlobalFilters.reduce((acc, filter) => {
    if (!acc[filter.category]) {
      acc[filter.category] = []
    }
    acc[filter.category].push(filter)
    return acc
  }, {} as Record<string, QuickGlobalFilter[]>)

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'students': return '学生管理'
      case 'finance': return '财务管理'
      case 'notifications': return '通知提醒'
      case 'recent': return '最近活动'
      default: return category
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'students': return <Users className="h-4 w-4" />
      case 'finance': return <DollarSign className="h-4 w-4" />
      case 'notifications': return <Bell className="h-4 w-4" />
      case 'recent': return <TrendingUp className="h-4 w-4" />
      default: return <Star className="h-4 w-4" />
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">快速筛选</span>
      </div>
      
      {Object.entries(groupedFilters).map(([category, filters]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            {getCategoryIcon(category)}
            <span className="text-sm font-medium text-gray-600">{getCategoryLabel(category)}</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const isActive = activeFilters.includes(filter.id)
              
              return (
                <Button
                  key={filter.id}
                  variant={isActive ? filter.color : "outline"}
                  size="sm"
                  onClick={() => onFilterSelect(filter.id)}
                  className="flex items-center gap-2 h-auto py-2 px-3"
                >
                  {filter.icon}
                  <span className="text-xs">{filter.label}</span>
                  {isActive && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      ✓
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>
        </div>
      ))}
      
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 pt-4 border-t">
          <span className="text-xs text-gray-500">已选择:</span>
          {activeFilters.map((filterId) => {
            const filter = quickGlobalFilters.find(f => f.id === filterId)
            return filter ? (
              <Badge 
                key={filterId} 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-gray-200"
                onClick={() => onFilterSelect(filterId)}
              >
                {filter.label} ×
              </Badge>
            ) : null
          })}
        </div>
      )}
    </div>
  )
}
