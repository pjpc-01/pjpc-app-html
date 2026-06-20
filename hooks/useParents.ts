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
      const res = await fetch("/api/pocketbase-proxy/api/collections/parents/records?perPage=200&sort=-created&expand=students")
      const data = await res.json()
      setParents(data?.items || [])
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
