'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import DraggableScheduleItem from './DraggableScheduleItem'

interface DroppableScheduleCellProps {
  date: Date
  employeeId: string
  schedules: any[]
  onAddSchedule?: (date: Date, employeeId: string) => void
  onEditSchedule?: (schedule: any) => void
  onDeleteSchedule?: (scheduleId: string) => void
  templates: any[]
  isToday?: boolean
  isWeekend?: boolean
  className?: string
  isBulkMode?: boolean
  isSelected?: boolean
}

export default function DroppableScheduleCell({
  date,
  employeeId,
  schedules,
  onAddSchedule,
  onEditSchedule,
  onDeleteSchedule,
  templates,
  isToday = false,
  isWeekend = false,
  className,
  isBulkMode = false,
  isSelected = false
}: DroppableScheduleCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell-${employeeId}-${date.toISOString()}`,
    data: {
      type: 'schedule-cell',
      date,
      employeeId
    }
  })

  const getTemplateColor = (scheduleType: string) => {
    const template = templates.find(t => t.type === scheduleType)
    return template?.color || '#6b7280'
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-2 text-center min-h-24 relative cursor-pointer",
        "transition-all duration-200",
        isOver ? "bg-blue-50 border-2 border-blue-300 border-dashed" : "",
        isToday ? "bg-blue-50" : "",
        isWeekend ? "bg-gray-50" : "",
        isBulkMode && isSelected ? "bg-blue-100 border-2 border-blue-500" : "",
        isBulkMode && !isWeekend ? "hover:bg-gray-100" : "",
        className
      )}
      onClick={() => {
        if (isBulkMode && !isWeekend) {
          onAddSchedule?.(date, employeeId)
        }
      }}
    >
      <div className="space-y-1">
        {schedules.map(schedule => (
          <DraggableScheduleItem
            key={schedule.id}
            schedule={schedule}
            onEdit={onEditSchedule}
            onDelete={onDeleteSchedule}
            templateColor={getTemplateColor(schedule.schedule_type)}
          />
        ))}
        
        {schedules.length === 0 && !isWeekend && (
          <div className="text-gray-400 text-xs py-2">
            {isOver ? (
              <div className="flex items-center justify-center gap-1 text-blue-600">
                <Plus className="h-3 w-3" />
                放置排班
              </div>
            ) : (
              <div 
                className="cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => onAddSchedule?.(date, employeeId)}
              >
                点击添加
              </div>
            )}
          </div>
        )}
        
        {isWeekend && (
          <div className="text-gray-400 text-xs py-2">
            周末
          </div>
        )}
      </div>
    </div>
  )
}
