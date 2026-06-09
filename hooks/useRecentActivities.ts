"use client"

import { useEffect, useState } from "react"
import PocketBase from "pocketbase"

const pb = new PocketBase("http://127.0.0.1:8090")

export function useRecentActivities() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true)
        
        // Fetch latest payments
        const payments = await pb.collection('payments').getFullList({
          sort: '-created',
          limit: 5,
        })

        // Fetch latest students
        const students = await pb.collection('students').getFullList({
          sort: '-created',
          limit: 5,
        })

        const merged = []

        // Map payments to activity items
        payments.forEach(p => {
          merged.push({
            id: `pay-${p.id}`,
            type: 'payment',
            action: '学费缴纳',
            name: p.studentId ? '学生' : '未知', // Simplified for now, expansion needs expansion
            amount: `RM ${p.amount}`,
            time: new Date(p.created).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) + ' 刚才',
            status: 'success'
          })
        })

        // Map students to activity items
        students.forEach(s => {
          merged.push({
            id: `stu-${s.id}`,
            type: 'student',
            action: '新学生注册',
            name: s.student_name || '未知学生',
            time: new Date(s.created).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) + ' 刚才',
            status: 'success'
          })
        })

        // Sort combined list by creation date (simulated)
        // In a real app, we'd use a global activity log collection
        setActivities(merged.sort(() => Math.random() - 0.5).slice(0, 5))
      } catch (error) {
        console.error("Failed to fetch recent activities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  return { activities, loading }
}
