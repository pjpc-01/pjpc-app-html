'use client'

import React, { useState, useEffect } from 'react'
import { 
  format, 
  addDays, 
  startOfWeek, 
  isSameDay, 
  isWeekend,
  addWeeks,
  subWeeks
} from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 简化的数据结构
interface Teacher {
  id: string
  name: string
  subjects: string[]
  grades: string[]
  status: 'available' | 'busy' | 'off'
}

interface Class {
  id: string
  name: string
  subject: string
  grade: string
  time: string
  teacher?: string
  students: number
  color: string
}

interface Schedule {
  id: string
  date: string
  classes: Class[]
}

export default function BasicSchedule() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isAddingClass, setIsAddingClass] = useState(false)
  const [newClass, setNewClass] = useState<Partial<Class>>({})

  // 模拟数据
  const mockTeachers: Teacher[] = [
    { id: '1', name: 'Cheng Mun Poo', subjects: ['数学', '科学'], grades: ['四年级', '五年级', '六年级'], status: 'available' },
    { id: '2', name: 'Teacher 2', subjects: ['英文', '华文'], grades: ['一年级', '二年级', '三年级'], status: 'available' },
    { id: '3', name: 'Teacher 3', subjects: ['数学', '英文'], grades: ['中一', '中二'], status: 'busy' }
  ]

  const mockClasses: Class[] = [
    { id: '1', name: '四年级数学', subject: '数学', grade: '四年级', time: '09:00-10:00', teacher: 'Cheng Mun Poo', students: 12, color: '#3b82f6' },
    { id: '2', name: '五年级科学', subject: '科学', grade: '五年级', time: '10:00-11:00', teacher: 'Cheng Mun Poo', students: 8, color: '#10b981' },
    { id: '3', name: '二年级英文', subject: '英文', grade: '二年级', time: '14:00-15:00', teacher: 'Teacher 2', students: 15, color: '#f59e0b' },
    { id: '4', name: '三年级华文', subject: '华文', grade: '三年级', time: '15:00-16:00', teacher: 'Teacher 2', students: 10, color: '#8b5cf6' }
  ]

  // 获取一周的日期
  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }

  // 获取某天的课程
  const getClassesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const schedule = schedules.find(s => s.date === dateStr)
    return schedule?.classes || []
  }

  // 获取科目颜色
  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      '数学': '#3b82f6',
      '英文': '#10b981',
      '华文': '#f59e0b',
      '科学': '#8b5cf6'
    }
    return colors[subject] || '#6b7280'
  }

  // 添加课程
  const addClass = () => {
    if (!newClass.name || !newClass.subject || !newClass.grade || !newClass.time) return

    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const existingSchedule = schedules.find(s => s.date === dateStr)
    
    const classToAdd: Class = {
      id: `class-${Date.now()}`,
      name: newClass.name!,
      subject: newClass.subject!,
      grade: newClass.grade!,
      time: newClass.time!,
      teacher: newClass.teacher,
      students: newClass.students || 0,
      color: getSubjectColor(newClass.subject!)
    }

    if (existingSchedule) {
      setSchedules(prev => prev.map(s => 
        s.date === dateStr 
          ? { ...s, classes: [...s.classes, classToAdd] }
          : s
      ))
    } else {
      setSchedules(prev => [...prev, { id: `schedule-${Date.now()}`, date: dateStr, classes: [classToAdd] }])
    }

    setNewClass({})
    setIsAddingClass(false)
  }

  // 删除课程
  const deleteClass = (classId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    setSchedules(prev => prev.map(s => 
      s.date === dateStr 
        ? { ...s, classes: s.classes.filter(c => c.id !== classId) }
        : s
    ))
  }

  // 智能排班
  const autoSchedule = () => {
    const weekDays = getWeekDays()
    const newSchedules: Schedule[] = []

    weekDays.forEach(date => {
      if (isWeekend(date)) return

      const dateStr = format(date, 'yyyy-MM-dd')
      const existingSchedule = schedules.find(s => s.date === dateStr)
      
      if (!existingSchedule) {
        const classes: Class[] = []
        
        // 数学课
        const mathTeacher = teachers.find(t => t.status === 'available' && t.subjects.includes('数学'))
        if (mathTeacher) {
          classes.push({
            id: `class-${Date.now()}-math`,
            name: '四年级数学',
            subject: '数学',
            grade: '四年级',
            time: '09:00-10:00',
            teacher: mathTeacher.name,
            students: 12,
            color: '#3b82f6'
          })
        }

        // 英文课
        const englishTeacher = teachers.find(t => t.status === 'available' && t.subjects.includes('英文'))
        if (englishTeacher) {
          classes.push({
            id: `class-${Date.now()}-english`,
            name: '二年级英文',
            subject: '英文',
            grade: '二年级',
            time: '14:00-15:00',
            teacher: englishTeacher.name,
            students: 15,
            color: '#10b981'
          })
        }

        if (classes.length > 0) {
          newSchedules.push({
            id: `schedule-${Date.now()}`,
            date: dateStr,
            classes
          })
        }
      }
    })

    setSchedules(prev => [...prev, ...newSchedules])
  }

  // 初始化数据
  useEffect(() => {
    setTeachers(mockTeachers)
    
    // 为今天添加一些示例课程
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    setSchedules([{
      id: 'today',
      date: todayStr,
      classes: mockClasses
    }])
  }, [])

  const weekDays = getWeekDays()

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">课程排班</h2>
          <p className="text-gray-600">简单直观的课程安排管理</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={autoSchedule}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            ⚡ 智能排班
          </button>
          <button 
            onClick={() => setIsAddingClass(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            ➕ 添加课程
          </button>
        </div>
      </div>

      {/* 周导航 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentWeek(prev => subWeeks(prev, 1))}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ←
            </button>
            <button 
              onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              📅 本周
            </button>
            <button 
              onClick={() => setCurrentWeek(prev => addWeeks(prev, 1))}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              →
            </button>
          </div>
          <div className="text-lg font-semibold">
            {format(weekDays[0], 'MM月dd日', { locale: zhCN })} - {format(weekDays[6], 'MM月dd日', { locale: zhCN })}
          </div>
        </div>
      </div>

      {/* 课程表 */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map(date => {
          const classes = getClassesForDate(date)
          const isToday = isSameDay(date, new Date())
          const isWeekendDay = isWeekend(date)
          
          return (
            <div 
              key={date.toISOString()} 
              className={`bg-white rounded-lg shadow p-4 ${isToday ? 'ring-2 ring-blue-500' : ''} ${isWeekendDay ? 'bg-gray-50' : ''}`}
            >
              <div className="text-center mb-4">
                <div className="text-sm font-medium text-gray-600">
                  {format(date, 'EEE', { locale: zhCN })}
                </div>
                <div className="text-lg font-bold">
                  {format(date, 'd')}
                </div>
                {isToday && (
                  <div className="text-xs text-blue-600 font-bold">今天</div>
                )}
              </div>
              <div className="space-y-2">
                {classes.map(classItem => (
                  <div 
                    key={classItem.id}
                    className="p-2 rounded-lg text-xs"
                    style={{ backgroundColor: classItem.color + '20', borderLeft: `3px solid ${classItem.color}` }}
                  >
                    <div className="font-medium">{classItem.name}</div>
                    <div className="text-gray-600">{classItem.time}</div>
                    <div className="text-gray-500">{classItem.teacher}</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-500">{classItem.students}人</span>
                      <button 
                        onClick={() => deleteClass(classItem.id, date)}
                        className="text-red-500 hover:text-red-700"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                {classes.length === 0 && !isWeekendDay && (
                  <div className="text-center text-gray-400 text-xs py-4">
                    无课程
                  </div>
                )}
                {isWeekendDay && (
                  <div className="text-center text-gray-400 text-xs py-4">
                    周末
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 教师状态 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          👥 教师状态
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teachers.map(teacher => (
            <div key={teacher.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                teacher.status === 'available' ? 'bg-green-500' :
                teacher.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <div className="flex-1">
                <div className="font-medium">{teacher.name}</div>
                <div className="text-sm text-gray-500">
                  {teacher.subjects.join(', ')} • {teacher.grades.join(', ')}
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                teacher.status === 'available' ? 'bg-green-100 text-green-800' :
                teacher.status === 'busy' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {teacher.status === 'available' ? '可用' :
                 teacher.status === 'busy' ? '忙碌' : '离线'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 添加课程对话框 */}
      {isAddingClass && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">添加课程</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">课程名称</label>
              <input 
                type="text"
                value={newClass.name || ''}
                onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例如：四年级数学"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">科目</label>
              <select 
                value={newClass.subject || ''}
                onChange={(e) => setNewClass(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择科目</option>
                <option value="数学">数学</option>
                <option value="英文">英文</option>
                <option value="华文">华文</option>
                <option value="科学">科学</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
              <select 
                value={newClass.grade || ''}
                onChange={(e) => setNewClass(prev => ({ ...prev, grade: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择年级</option>
                <option value="一年级">一年级</option>
                <option value="二年级">二年级</option>
                <option value="三年级">三年级</option>
                <option value="四年级">四年级</option>
                <option value="五年级">五年级</option>
                <option value="六年级">六年级</option>
                <option value="中一">中一</option>
                <option value="中二">中二</option>
                <option value="中三">中三</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">时间</label>
              <input 
                type="text"
                value={newClass.time || ''}
                onChange={(e) => setNewClass(prev => ({ ...prev, time: e.target.value }))}
                placeholder="例如：09:00-10:00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">教师</label>
              <select 
                value={newClass.teacher || ''}
                onChange={(e) => setNewClass(prev => ({ ...prev, teacher: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择教师</option>
                {teachers.filter(t => t.status === 'available').map(teacher => (
                  <option key={teacher.id} value={teacher.name}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">学生人数</label>
              <input 
                type="number"
                value={newClass.students || ''}
                onChange={(e) => setNewClass(prev => ({ ...prev, students: parseInt(e.target.value) || 0 }))}
                placeholder="学生人数"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button 
              onClick={() => setIsAddingClass(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button 
              onClick={addClass}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              💾 保存
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
