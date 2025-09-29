'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, GripVertical } from 'lucide-react'

interface Schedule {
  id: string
  teacher_id: string
  teacher_name?: string
  class_id?: string
  class_name?: string
  date: string
  start_time: string
  end_time: string
  center: string
  room?: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  is_overtime: boolean
  hourly_rate?: number
  total_hours: number
  schedule_type: 'fulltime' | 'parttime' | 'teaching_only' | 'admin' | 'support' | 'service'
  template_id?: string
  notes?: string
  created_by?: string
  approved_by?: string
  created?: string
  updated?: string
}

interface DraggableScheduleItemProps {
  schedule: Schedule
  onEdit?: (schedule: Schedule) => void
  onDelete?: (scheduleId: string) => void
  templateColor?: string
  isDragging?: boolean
}

export default function DraggableScheduleItem({
  schedule,
  onEdit,
  onDelete,
  templateColor = '#6b7280',
  isDragging = false
}: DraggableScheduleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingState
  } = useDraggable({
    id: schedule.id,
    data: {
      type: 'schedule',
      schedule
    }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'no_show': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return '已安排'
      case 'confirmed': return '已确认'
      case 'in_progress': return '进行中'
      case 'completed': return '已完成'
      case 'cancelled': return '已取消'
      case 'no_show': return '未到'
      default: return status
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        p-2 rounded text-xs border-l-2 cursor-move select-none
        transition-all duration-200 hover:shadow-md
        ${isDraggingState || isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
        ${isDraggingState ? 'z-50' : 'z-10'}
      `}
      style={{
        ...style,
        borderLeftColor: templateColor,
        backgroundColor: `${templateColor}10`
      }}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {schedule.start_time} - {schedule.end_time}
          </div>
          {schedule.class_name && (
            <div className="text-gray-600 truncate text-xs">
              {schedule.class_name}
            </div>
          )}
          <div className="flex items-center gap-1 mt-1">
            <Badge 
              variant="outline" 
              className={`text-xs ${getStatusColor(schedule.status)}`}
            >
              {getStatusText(schedule.status)}
            </Badge>
            {schedule.is_overtime && (
              <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                加班
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          <GripVertical className="h-3 w-3 text-gray-400" />
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-200"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(schedule)
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500 hover:bg-red-100"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(schedule.id)
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

