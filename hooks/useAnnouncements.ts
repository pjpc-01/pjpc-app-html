import { useState, useEffect } from 'react'

export interface Announcement {
  id: string
  title: string
  content: string
  type: string
  priority: string
  author_id: string
  target_audience: Record<string, any>
  publish_date: string
  expiry_date?: string
  status: string
  attachments: any[]
  created: string
  updated: string
  expand?: {
    author_id?: {
      id: string
      name: string
      email: string
    }
  }
}

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  sender_id: string
  recipient_id: string
  is_read: boolean
  read_at?: string
  created: string
  updated: string
  expand?: {
    sender_id?: {
      id: string
      name: string
      email: string
    }
    recipient_id?: {
      id: string
      name: string
      email: string
    }
  }
}

export function useAnnouncements(authorId?: string, type?: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (authorId) params.append('author_id', authorId)
      if (type) params.append('type', type)
      
      const response = await fetch(`/api/announcements?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setAnnouncements(result.data.items || [])
      } else {
        setError(result.error || '获取公告列表失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取公告列表失败')
    } finally {
      setLoading(false)
    }
  }

  const createAnnouncement = async (announcementData: Partial<Announcement>) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchAnnouncements() // 重新获取列表
        return result.data
      } else {
        setError(result.error || '创建公告失败')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建公告失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [authorId, type])

  return {
    announcements,
    loading,
    error,
    fetchAnnouncements,
    createAnnouncement
  }
}

export function useNotifications(recipientId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (recipientId) params.append('recipient_id', recipientId)
      
      const response = await fetch(`/api/notifications?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setNotifications(result.data.items || [])
      } else {
        setError(result.error || '获取通知列表失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取通知列表失败')
    } finally {
      setLoading(false)
    }
  }

  const createNotification = async (notificationData: Partial<Notification>) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchNotifications() // 重新获取列表
        return result.data
      } else {
        setError(result.error || '创建通知失败')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建通知失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId, is_read: true })
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchNotifications() // 重新获取列表
        return result.data
      } else {
        setError(result.error || '标记通知为已读失败')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '标记通知为已读失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [recipientId])

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    createNotification,
    markAsRead
  }
}
