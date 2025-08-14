"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, GraduationCap, Users, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export type EducationDataType = 'primary' | 'secondary' | 'teachers'

interface EducationDropdownProps {
  selectedType: EducationDataType
  onTypeChange: (type: EducationDataType) => void
  className?: string
  showCounts?: boolean
  primaryCount?: number
  secondaryCount?: number
  teachersCount?: number
}

const educationTypeConfig = {
  primary: {
    label: '小学生',
    icon: GraduationCap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: '小学学生管理'
  },
  secondary: {
    label: '中学生',
    icon: BookOpen,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: '中学学生管理'
  },
  teachers: {
    label: '老师',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: '教师管理'
  }
}

export default function EducationDropdown({
  selectedType,
  onTypeChange,
  className,
  showCounts = false,
  primaryCount = 0,
  secondaryCount = 0,
  teachersCount = 0
}: EducationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Ensure selectedType is valid, default to 'primary' if not
  const validSelectedType = selectedType && educationTypeConfig[selectedType] 
    ? selectedType 
    : 'primary'
  
  const currentConfig = educationTypeConfig[validSelectedType]
  const CurrentIcon = currentConfig.icon

  const getCount = (type: EducationDataType) => {
    switch (type) {
      case 'primary': return primaryCount
      case 'secondary': return secondaryCount
      case 'teachers': return teachersCount
      default: return 0
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 px-4 py-2 flex items-center gap-2 justify-between min-w-[140px]",
            currentConfig.bgColor,
            currentConfig.borderColor,
            "hover:shadow-md transition-all duration-200",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <CurrentIcon className={cn("h-4 w-4", currentConfig.color)} />
            <span className="font-medium">{currentConfig.label}</span>
            {showCounts && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {getCount(validSelectedType)}
              </Badge>
            )}
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-56">
        {Object.entries(educationTypeConfig).map(([type, config]) => {
          const Icon = config.icon
          const count = getCount(type as EducationDataType)
          
          return (
            <DropdownMenuItem
              key={type}
              onClick={() => {
                onTypeChange(type as EducationDataType)
                setIsOpen(false)
              }}
              className={cn(
                "flex items-center justify-between p-3 cursor-pointer",
                validSelectedType === type && "bg-accent"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("h-5 w-5", config.color)} />
                <div>
                  <div className="font-medium">{config.label}</div>
                  <div className="text-xs text-muted-foreground">{config.description}</div>
                </div>
              </div>
              {showCounts && (
                <Badge variant="outline" className="text-xs">
                  {count}
                </Badge>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
