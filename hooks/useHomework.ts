"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"

export interface Homework {
  id: string
  title: string
  description?: string
  subject: string
  grade: string
  centerId?: string
  teacherId?: string
  assignedDate: string
  dueDate: string
  status: "active" | "archived" | "cancelled"
  expand?: {
    teacherId?: { id: string; name: string }
    centerId?: { id: string; name: string }
  }
  submissionCount?: number
  gradedCount?: number
}

export interface Submission {
  id: string
  homeworkId: string
  studentId: string
  content?: string
  status: "pending" | "submitted" | "graded"
  score?: number
  feedback?: string
  gradedBy?: string
  submittedDate?: string
  gradedDate?: string
  expand?: {
    studentId?: { id: string; name: string; grade: string }
    gradedBy?: { id: string; name: string }
  }
}

export function useHomework(homeworkId?: string) {
  const [homework, setHomework] = useState<Homework | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHomework = useCallback(async () => {
    if (!homeworkId) return
    setLoading(true)
    try {
      const [hwRes, subRes] = await Promise.all([
        fetch(`/api/pocketbase-proxy/api/collections/homework/records/${homeworkId}?expand=teacherId,centerId`),
        fetch(`/api/pocketbase-proxy/api/collections/homework_submissions/records?filter=homeworkId%3D%27${encodeURIComponent(homeworkId)}%27&expand=studentId,gradedBy&perPage=200`),
      ])
      const hwData = await hwRes.json()
      const subData = await subRes.json()
      setHomework(hwData)
      setSubmissions(subData?.items || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch homework")
    } finally {
      setLoading(false)
    }
  }, [homeworkId])

  useEffect(() => {
    if (homeworkId) fetchHomework()
  }, [homeworkId, fetchHomework])

  return { homework, submissions, loading, error, refetch: fetchHomework }
}

export function useHomeworkList() {
  const searchParams = useSearchParams()
  const [homeworkList, setHomeworkList] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const centerId = searchParams?.get("center")

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      let filter = "status='active'"
      if (centerId && centerId !== "all") {
        filter += `&&centerId='${encodeURIComponent(centerId)}'`
      }
      const res = await fetch(
        `/api/pocketbase-proxy/api/collections/homework/records?expand=teacherId,centerId&filter=${encodeURIComponent(filter)}&sort=-created&perPage=100`
      )
      const data = await res.json()
      const items: Homework[] = data?.items || []

      // Fetch submission counts per homework
      const itemsWithCounts = await Promise.all(
        items.map(async (hw: Homework) => {
          try {
            const subRes = await fetch(
              `/api/pocketbase-proxy/api/collections/homework_submissions/records?filter=homeworkId%3D%27${hw.id}%27&perPage=1`
            )
            const subData = await subRes.json()
            return { ...hw, submissionCount: subData?.totalItems || 0 }
          } catch {
            return hw
          }
        })
      )

      setHomeworkList(itemsWithCounts)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch homework")
    } finally {
      setLoading(false)
    }
  }, [centerId])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  return { homeworkList, loading, error, refetch: fetchList }
}

export function usePendingGradingCount() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/pocketbase-proxy/api/collections/homework_submissions/records?filter=status%3D%27submitted%27&perPage=1`
      )
      const data = await res.json()
      setCount(data?.totalItems || 0)
    } catch {
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  return { count, loading, refetch: fetchCount }
}
