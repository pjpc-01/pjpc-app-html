"use client"

import React, { useState, useEffect } from "react"
import { useParentPortal } from "@/hooks/useParentPortal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Bell, Megaphone, Calendar } from "lucide-react"

export default function ParentNotificationsPage() {
  const { children, loading } = useParentPortal()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setFetching(true)
      try {
        const res = await fetch(
          `/api/pocketbase-proxy/api/collections/announcements/records?perPage=20&sort=-created`
        )
        const data = await res.json()
        setAnnouncements(data?.items || [])
      } catch (e) {
        console.error("Failed to fetch announcements:", e)
      } finally {
        setFetching(false)
      }
    }
    fetchAnnouncements()
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">通知消息</h1>
      <p className="text-gray-500">来自安亲班的公告与通知</p>

      {fetching ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Bell className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">暂无通知消息</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <Card key={ann.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Megaphone className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{ann.title || "公告"}</span>
                      {ann.priority === "high" && (
                        <Badge variant="destructive">重要</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {ann.content || ann.description || ""}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(ann.created).toLocaleDateString("zh-CN")}
                      {ann.centerId && <span>· {ann.centerName || ""}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
