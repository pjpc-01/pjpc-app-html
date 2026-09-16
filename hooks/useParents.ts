"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"

export interface Parent {
  id: string
  name: string
  nric?: string
  phone: string
  email?: string
  address?: string
  relationship: string
  occupation?: string
  notes?: string
  status: string
  created?: string
  updated?: string
  expand?: {
    students?: { id: string; name: string; grade: string }[]
  }
  studentCount?: number
}

export interface StudentParent {
  id: string
  studentId: string
  parentId: string
  relationship?: string
  isPrimary?: boolean
  expand?: {
    parentId?: Parent
    studentId?: { id: string; name: string; grade: string }
  }
}

export function useParents() {
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchParents = useCallback(async () => {
    setLoading(true)
    try {
      // 家长 + 关联表一起拉。
      // ⚠️ 关联的唯一数据源是 student_parents（人工维护，含 isPrimary/relationship）。
      //    不要用 parents 表上的字段做 expand —— 那样会变成两套关联、互相不同步。
      const [pRes, spRes] = await Promise.all([
        fetch("/api/pocketbase-proxy/api/collections/parents/records?perPage=500&sort=-created"),
        fetch("/api/pocketbase-proxy/api/collections/student_parents/records?perPage=1000&expand=studentId"),
      ])
      const pData = await pRes.json()
      const spData = await spRes.json()
      const list: Parent[] = pData?.items || []
      const links: any[] = spData?.items || []

      // 按 parentId 归组
      const byParent = new Map<string, { id: string; name: string; grade: string }[]>()
      for (const l of links) {
        const pid = l.parentId
        if (!pid) continue
        const stu = l.expand?.studentId
        const entry = stu
          ? { id: stu.id, name: stu.name || "", grade: stu.grade || "" }
          : { id: l.studentId || "", name: "", grade: "" }
        const arr = byParent.get(pid)
        if (arr) {
          if (!arr.some(x => x.id === entry.id)) arr.push(entry)
        } else {
          byParent.set(pid, [entry])
        }
      }

      setParents(list.map(p => {
        const students = byParent.get(p.id) || []
        return { ...p, studentCount: students.length, expand: { students } }
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch parents")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchParents() }, [fetchParents])

  return { parents, loading, error, refetch: fetchParents }
}

export function useStudentParents(studentId?: string) {
  const [links, setLinks] = useState<StudentParent[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!studentId) return
    setLoading(true)
    fetch(`/api/pocketbase-proxy/api/collections/student_parents/records?filter=studentId%3D%27${studentId}%27&expand=parentId&perPage=10`)
      .then(r => r.json())
      .then(d => setLinks(d?.items || []))
      .catch(() => setLinks([]))
      .finally(() => setLoading(false))
  }, [studentId])

  return { links, loading }
}
