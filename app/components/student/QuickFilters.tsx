"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  GraduationCap, 
  MapPin, 
  Phone, 
  Calendar,
  Star,
  Clock,
  UserCheck,
  UserX
} from "lucide-react"

interface QuickFilter {
  id: string
  label: string
  icon: React.ReactNode
  description: string
  color: 'default' | 'secondary' | 'destructive' | 'outline'
}

interface QuickFiltersProps {
  onFilterSelect: (filterId: string) => void
  activeFilters: string[]
  className?: string
}

const quickFilters: QuickFilter[] = [
  {
    id: 'all',
    label: '全部学生',
    icon: <Users className="h-4 w-4" />,
    description: '显示所有学生',
    color: 'default'
  },
  {
    id: 'primary',
    label: '小学生',
    icon: <GraduationCap className="h-4 w-4" />,
    description: '小学级别学生',
    color: 'secondary'
  },
  {
    id: 'secondary',
    label: '中学生',
    icon: <GraduationCap className="h-4 w-4" />,
    description: '中学级别学生',
    color: 'secondary'
  },
  {
    id: 'has-phone',
    label: '有联系电话',
    icon: <Phone className="h-4 w-4" />,
    description: '有家长联系电话',
    color: 'outline'
  },
  {
    id: 'has-address',
    label: '有地址信息',
    icon: <MapPin className="h-4 w-4" />,
    description: '有完整地址信息',
    color: 'outline'
  },
  {
    id: 'recent',
    label: '最近入学',
    icon: <Calendar className="h-4 w-4" />,
    description: '最近3个月入学',
    color: 'outline'
  },
  {
    id: 'new',
    label: '新生',
    icon: <Star className="h-4 w-4" />,
    description: '本月新入学',
    color: 'outline'
  },
  {
    id: 'active',
    label: '活跃学生',
    icon: <UserCheck className="h-4 w-4" />,
    description: '最近有活动记录',
    color: 'outline'
  },
  {
    id: 'inactive',
    label: '非活跃学生',
    icon: <UserX className="h-4 w-4" />,
    description: '长期无活动记录',
    color: 'outline'
  }
]

export default function QuickFilters({ 
  onFilterSelect, 
  activeFilters, 
  className = "" 
}: QuickFiltersProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">快速筛选</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => {
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
      
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t">
          <span className="text-xs text-gray-500">已选择:</span>
          {activeFilters.map((filterId) => {
            const filter = quickFilters.find(f => f.id === filterId)
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
