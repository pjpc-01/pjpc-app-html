"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/pocketbase-auth-context"

export interface PortalChild {
  id: string
  name: string
  grade: string
  school?: string
  center?: string
  centerId?: string
  status: string
  studentId?: string
  parentRelationship?: string
}

export interface PortalData {
  parentId: string
  parentName: string
  children: PortalChild[]
  loading: boolean
  error: string | null
}

export function useParentPortal(): PortalData {
  const { user, userProfile } = useAuth()
  const [parentId, setParentId] = useState<string>("")
  const [parentName, setParentName] = useState<string>("")
  const [children, setChildren] = useState<PortalChild[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChildren = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Find parent record linked to this user
      const parentRes = await fetch(
        `/api/pocketbase-proxy/api/collections/parents/records?filter=userId%3D%27${user.id}%27&perPage=1`
      )
      const parentData = await parentRes.json()
      const parentRecords = parentData?.items || []

      if (parentRecords.length === 0) {
        setLoading(false)
        return
      }

      const parent = parentRecords[0]
      setParentId(parent.id)
      setParentName(parent.name || userProfile?.name || "")

      // 2. Find student_parents links for this parent
      const linksRes = await fetch(
        `/api/pocketbase-proxy/api/collections/student_parents/records?filter=parentId%3D%27${parent.id}%27&expand=studentId&perPage=20`
      )
      const linksData = await linksRes.json()
      const links = linksData?.items || []

      // 3. Extract children data
      const childList: PortalChild[] = links
        .filter((link: any) => link.expand?.studentId)
        .map((link: any) => {
          const student = link.expand!.studentId
          return {
            id: student.id,
            name: student.name || "",
            grade: student.grade || student.standard || "",
            school: student.school || "",
            center: student.center || "",
            centerId: student.centerId || "",
            status: student.status || "active",
            parentRelationship: link.relationship || parent.relationship || "",
          }
        })

      setChildren(childList)
    } catch (e: any) {
      console.error("useParentPortal error:", e)
      setError(e.message || "获取数据失败")
    } finally {
      setLoading(false)
    }
  }, [user?.id, userProfile?.name])

  useEffect(() => {
    fetchChildren()
  }, [fetchChildren])

  return { parentId, parentName, children, loading, error }
}
