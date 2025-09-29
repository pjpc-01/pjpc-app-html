'use client'

import React, { useState, useEffect } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, Copy, Trash2 } from 'lucide-react'
import { format, addDays, isSameDay } from 'date-fns'

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

interface MultiDayDragHandlerProps {
  schedules: Schedule[]
  onCopyToMultipleDays: (schedule: Schedule, targetDates: Date[]) => void
  onDeleteMultiple: (scheduleIds: string[]) => void
  templateColor?: string
}

export default function MultiDayDragHandler({
  schedules,
  onCopyToMultipleDays,
  onDeleteMultiple,
  templateColor = '#6b7280'
}: MultiDayDragHandlerProps) {
  const [selectedSchedules, setSelectedSchedules] = useState<Set<string>>(new Set())
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [showCopyDialog, setShowCopyDialog] = useState(false)
  const [targetDates, setTargetDates] = useState<Date[]>([])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: `multi-schedule-${selectedSchedules.size}`,
    data: {
      type: 'multi-schedule',
      schedules: schedules.filter(s => selectedSchedules.has(s.id))
    }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  // 切换多选模式
  const toggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode)
    if (isMultiSelectMode) {
      setSelectedSchedules(new Set())
    }
  }

  // 选择/取消选择排班
  const toggleScheduleSelection = (scheduleId: string) => {
    const newSelected = new Set(selectedSchedules)
    if (newSelected.has(scheduleId)) {
      newSelected.delete(scheduleId)
    } else {
      newSelected.add(scheduleId)
    }
    setSelectedSchedules(newSelected)
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedSchedules.size === schedules.length) {
      setSelectedSchedules(new Set())
    } else {
      setSelectedSchedules(new Set(schedules.map(s => s.id)))
    }
  }

  // 复制到多天
  const handleCopyToMultipleDays = () => {
    if (selectedSchedules.size === 0) return
    
    const selectedScheduleList = schedules.filter(s => selectedSchedules.has(s.id))
    if (selectedScheduleList.length > 0) {
      onCopyToMultipleDays(selectedScheduleList[0], targetDates)
      setShowCopyDialog(false)
      setSelectedSchedules(new Set())
    }
  }

  // 删除多个排班
  const handleDeleteMultiple = () => {
    if (selectedSchedules.size === 0) return
    
    if (confirm(`确定要删除选中的 ${selectedSchedules.size} 个排班吗？`)) {
      onDeleteMultiple(Array.from(selectedSchedules))
      setSelectedSchedules(new Set())
    }
  }

  // 生成目标日期选项
  const generateTargetDates = (startDate: Date, days: number) => {
    const dates: Date[] = []
    for (let i = 0; i < days; i++) {
      dates.push(addDays(startDate, i))
    }
    return dates
  }

  if (schedules.length === 0) return null

  return (
    <div className="space-y-4">
      {/* 多选控制栏 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            variant={isMultiSelectMode ? "default" : "outline"}
            size="sm"
            onClick={toggleMultiSelect}
          >
            {isMultiSelectMode ? "退出多选" : "多选模式"}
          </Button>
          
          {isMultiSelectMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
              >
                {selectedSchedules.size === schedules.length ? "取消全选" : "全选"}
              </Button>
              
              <Badge variant="secondary">
                已选择 {selectedSchedules.size} 个排班
              </Badge>
            </>
          )}
        </div>

        {isMultiSelectMode && selectedSchedules.size > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCopyDialog(true)}
            >
              <Copy className="h-4 w-4 mr-1" />
              复制到多天
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteMultiple}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              删除选中
            </Button>
          </div>
        )}
      </div>

      {/* 排班列表 */}
      <div className="space-y-2">
        {schedules.map(schedule => (
          <div
            key={schedule.id}
            ref={selectedSchedules.has(schedule.id) ? setNodeRef : undefined}
            style={selectedSchedules.has(schedule.id) ? style : undefined}
            className={`
              p-3 rounded-lg border-l-4 cursor-pointer transition-all
              ${isMultiSelectMode ? 'hover:bg-gray-50' : ''}
              ${selectedSchedules.has(schedule.id) ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200'}
              ${isDragging ? 'opacity-50 scale-95' : ''}
            `}
            style={{
              ...(selectedSchedules.has(schedule.id) ? style : {}),
              borderLeftColor: selectedSchedules.has(schedule.id) ? '#3b82f6' : templateColor
            }}
            onClick={() => {
              if (isMultiSelectMode) {
                toggleScheduleSelection(schedule.id)
              }
            }}
            {...(selectedSchedules.has(schedule.id) ? attributes : {})}
            {...(selectedSchedules.has(schedule.id) ? listeners : {})}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{format(new Date(schedule.date), 'MM月dd日')}</span>
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {schedule.start_time} - {schedule.end_time}
                  </span>
                </div>
                
                {schedule.class_name && (
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{schedule.class_name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={schedule.status === 'scheduled' ? 'default' : 
                            schedule.status === 'confirmed' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {schedule.status === 'scheduled' ? '已安排' :
                     schedule.status === 'confirmed' ? '已确认' :
                     schedule.status === 'in_progress' ? '进行中' :
                     schedule.status === 'completed' ? '已完成' : '已取消'}
                  </Badge>
                  
                  {schedule.is_overtime && (
                    <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                      加班
                    </Badge>
                  )}
                </div>
              </div>

              {isMultiSelectMode && (
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={selectedSchedules.has(schedule.id)}
                    onChange={() => toggleScheduleSelection(schedule.id)}
                    className="h-4 w-4"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 复制到多天对话框 */}
      {showCopyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">复制到多天</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">选择目标日期</label>
                <div className="grid grid-cols-2 gap-2">
                  {generateTargetDates(new Date(), 7).map((date, index) => (
                    <label key={index} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={targetDates.some(d => isSameDay(d, date))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTargetDates([...targetDates, date])
                          } else {
                            setTargetDates(targetDates.filter(d => !isSameDay(d, date)))
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{format(date, 'MM月dd日')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCopyDialog(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleCopyToMultipleDays}
                disabled={targetDates.length === 0}
              >
                复制 ({targetDates.length} 天)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

