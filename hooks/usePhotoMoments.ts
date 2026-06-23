import { useState, useCallback } from 'react'
import { fetchSecureData } from '@/lib/secure-api-client'

export interface PhotoMoment {
  id: string
  studentId: string
  teacherId: string
  image_url: string
  caption: string
  date: string
  category: string
  parent_viewed: boolean
  liked: boolean
  created: string
  expand?: {
    studentId?: { id: string; name: string; grade: string }
    teacherId?: { id: string; name: string }
  }
}

export const usePhotoMoments = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getTodayPhotos = useCallback(async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const data = await fetchSecureData<PhotoMoment[]>('photo_moments', {
        fullList: true, sort: '-created',
        filter: `date = "${today}"`,
        expand: 'studentId,teacherId',
      })
      return data || []
    } catch (err) { setError('获取失败'); return [] }
    finally { setLoading(false) }
  }, [])

  const getStudentPhotos = useCallback(async (studentId: string) => {
    try {
      setLoading(true)
      const data = await fetchSecureData<PhotoMoment[]>('photo_moments', {
        fullList: true, sort: '-date',
        filter: `studentId = "${studentId}"`,
        expand: 'studentId,teacherId',
      })
      return data || []
    } catch (err) { setError('获取失败'); return [] }
    finally { setLoading(false) }
  }, [])

  const postPhoto = useCallback(async (data: {
    studentId: string; image_url: string; caption?: string; category?: string
  }) => {
    const res = await fetch('/api/photo-moments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, date: new Date().toISOString().split('T')[0] }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    return json.data
  }, [])

  return { loading, error, getTodayPhotos, getStudentPhotos, postPhoto }
}
