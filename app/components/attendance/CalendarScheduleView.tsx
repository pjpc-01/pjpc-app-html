"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns"
import { zhCN } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"

interface ScheduleEvent {
  id: string
  teacher_name: string
  teacher_id: string
  date: string
  start_time: string
  end_time: string
  status: string
  center?: string
  room?: string
  schedule_type?: string
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
}

export default function CalendarScheduleView() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    fetchSchedules()
  }, [currentMonth])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)
      const filterStart = format(monthStart, "yyyy-MM-dd")
      const filterEnd = format(monthEnd, "yyyy-MM-dd")
      
      const res = await fetch(
        `/api/pocketbase-proxy/api/collections/schedules/records?filter=(date>%3D'${filterStart}'%26%26date<%3D'${filterEnd}')&sort=date,start_time&perPage=200`
      )
      const data = await res.json()
      setEvents(data?.items || [])
    } catch (err) {
      console.error("Failed to fetch schedules", err)
    } finally {
      setLoading(false)
    }
  }

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    
    const days: Date[] = []
    let day = calStart
    while (day <= calEnd) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [currentMonth])

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>()
    events.forEach((evt) => {
      const key = evt.date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(evt)
    })
    return map
  }, [events])

  const selectedDateEvents = selectedDate
    ? eventsByDate.get(format(selectedDate, "yyyy-MM-dd")) || []
    : []

  const weekDays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {format(currentMonth, "yyyy 年 M 月", { locale: zhCN })}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden mb-px">
            {weekDays.map((dayName) => (
              <div key={dayName} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-500">
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, "yyyy-MM-dd")
              const dayEvents = eventsByDate.get(dateKey) || []
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[80px] p-1 text-left transition-colors ${
                    isCurrentMonth ? "bg-white" : "bg-gray-50"
                  } ${
                    isSelected
                      ? "ring-2 ring-indigo-500 z-10"
                      : ""
                  } hover:bg-blue-50 cursor-pointer`}
                >
                  <div className={`text-xs font-medium p-0.5 ${
                    isToday(day) ? "bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center" : ""
                  } ${!isCurrentMonth ? "text-gray-400" : ""}`}>
                    {format(day, "d")}
                  </div>
                  {dayEvents.slice(0, 3).map((evt) => (
                    <div
                      key={evt.id}
                      className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate mt-0.5 border ${
                        statusColors[evt.status] || "bg-gray-50"
                      }`}
                      title={`${evt.teacher_name} ${evt.start_time}-${evt.end_time}`}
                    >
                      {evt.start_time} {evt.teacher_name}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-indigo-600 font-medium px-1">
                      +{dayEvents.length - 3} 更多
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected date events */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {format(selectedDate, "M 月 d 日 EEEE", { locale: zhCN })}
              {isToday(selectedDate) && <Badge className="ml-2">今天</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">当天无排课</p>
            ) : (
              <div className="space-y-2">
                {selectedDateEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 text-center">
                        <div className="text-sm font-medium">{evt.start_time}</div>
                        <div className="text-xs text-muted-foreground">{evt.end_time}</div>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{evt.teacher_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {evt.room && `${evt.room} · `}
                          {evt.schedule_type || "常规"}
                        </div>
                      </div>
                    </div>
                    <Badge variant={evt.status === "confirmed" ? "default" : "secondary"}>
                      {evt.status === "scheduled" ? "已排班" : evt.status === "confirmed" ? "已确认" : evt.status === "completed" ? "已完成" : evt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
