import { useState, useEffect, useCallback, useRef } from 'react'

export interface ResourceItem {
  id: string
  title: string
  description?: string
  subject?: string
  grade?: string
  type?: string
  tags?: string
  link?: string
  file?: string
  uploadedBy?: string
  uploaderName?: string
  downloads?: number
  center?: string
  status?: string
  created?: string
  fileUrl?: string | null
  fileSize?: number
}

export interface ResourceListData {
  items: ResourceItem[]
  totalItems: number
  page: number
  perPage: number
  totalPages: number
}

export interface ResourceQuery {
  q?: string
  subject?: string
  grade?: string
  type?: string
  page?: number
  per_page?: number
}

export interface CreateResourceData {
  title: string
  description?: string
  subject?: string
  grade?: string
  type?: string
  tags?: string
  link?: string
  uploadedBy?: string
  uploaderName?: string
  center?: string
  file?: File | null
}

export const useResources = (initialQuery: ResourceQuery = {}) => {
  const [items, setItems] = useState<ResourceItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [perPage] = useState(initialQuery.per_page || 12)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ⚠️ 初值必须放 ref：组件通常直接传对象字面量（如 useResources({page:1,per_page:12})），
  // 字面量每次渲染都是新身份；若让它进 useCallback 依赖，fetchResources 会每渲染换身份，
  // 下面那个 useEffect([fetchResources]) 就会「fetch→setState→重渲染→再 fetch」无限循环。
  const initialRef = useRef<ResourceQuery>(initialQuery)
  initialRef.current = initialQuery

  const fetchResources = useCallback(
    async (override: ResourceQuery = {}) => {
      const base = initialRef.current
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({
          q: override.q ?? base.q ?? '',
          subject: override.subject ?? base.subject ?? '',
          grade: override.grade ?? base.grade ?? '',
          type: override.type ?? base.type ?? '',
          page: String(override.page ?? base.page ?? 1),
          per_page: String(override.per_page ?? base.per_page ?? 12),
        })
        const res = await fetch(`/api/resources?${params.toString()}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.error || '获取资源失败')
        const data: ResourceListData = json.data
        setItems(data.items)
        setTotalItems(data.totalItems)
        setTotalPages(data.totalPages || 1)
        setPage(data.page)
      } catch (err: any) {
        console.error('获取资源失败:', err)
        setError(err?.message || '获取资源失败')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  const createResource = useCallback(async (data: CreateResourceData) => {
    const form = new FormData()
    form.append('title', data.title)
    if (data.description) form.append('description', data.description)
    if (data.subject) form.append('subject', data.subject)
    if (data.grade) form.append('grade', data.grade)
    if (data.type) form.append('type', data.type)
    if (data.tags) form.append('tags', data.tags)
    if (data.link) form.append('link', data.link)
    if (data.uploadedBy) form.append('uploadedBy', data.uploadedBy)
    if (data.uploaderName) form.append('uploaderName', data.uploaderName)
    if (data.center) form.append('center', data.center)
    if (data.file) form.append('file', data.file)

    const res = await fetch('/api/resources', { method: 'POST', body: form })
    const json = await res.json()
    if (!json.success) throw new Error(json.error || '上传资源失败')
    await fetchResources()
    return json.data as ResourceItem
  }, [fetchResources])

  const updateResource = useCallback(async (id: string, updates: Partial<ResourceItem>) => {
    const res = await fetch(`/api/resources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error || '更新资源失败')
    return json.data as ResourceItem
  }, [])

  // 下载计数 +1（不刷新列表，避免打断用户操作；调用方需要时可主动 refetch）
  const incrementDownloads = useCallback(async (id: string) => {
    const res = await fetch(`/api/resources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incrementDownloads: true }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error || '更新下载次数失败')
    return json.data as ResourceItem
  }, [])

  const removeResource = useCallback(async (id: string) => {
    const res = await fetch(`/api/resources/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!json.success) throw new Error(json.error || '删除资源失败')
    await fetchResources()
  }, [fetchResources])

  return {
    items,
    totalItems,
    totalPages,
    page,
    perPage,
    loading,
    error,
    createResource,
    updateResource,
    incrementDownloads,
    removeResource,
    refetch: fetchResources,
  }
}