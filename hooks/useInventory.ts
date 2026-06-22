"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"

// ─── Types ───────────────────────────────────────────────────────────────

export interface InventoryCategory {
  id: string
  name: string
  description?: string
  status: "active" | "inactive"
}

export interface InventoryItem {
  id: string
  name: string
  categoryId?: string
  centerId?: string
  unit?: string
  costPrice?: number
  sellingPrice?: number
  stock: number
  minStock?: number
  sku?: string
  status: "active" | "discontinued"
  description?: string
  expand?: {
    categoryId?: InventoryCategory
    centerId?: { id: string; name: string }
  }
}

export interface InventoryTransaction {
  id: string
  itemId: string
  type: "stock_in" | "stock_out" | "adjustment"
  quantity: number
  unitPrice?: number
  totalAmount?: number
  reference?: string
  supplier?: string
  notes?: string
  operatorId?: string
  centerId?: string
  date: string
  expand?: {
    itemId?: InventoryItem
    centerId?: { id: string; name: string }
  }
}

// ─── API helper ──────────────────────────────────────────────────────────

async function fetchApi(path: string, options?: RequestInit) {
  const res = await fetch(`/api/pocketbase-proxy${path}`, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || `API error: ${res.status}`)
  return data
}

// ─── Categories ──────────────────────────────────────────────────────────

export function useInventoryCategories() {
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchApi("/api/collections/inventory_categories/records?sort=name&perPage=50")
      setCategories(data?.items || [])
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = useCallback(async (cat: Partial<InventoryCategory>) => {
    const data = await fetchApi("/api/collections/inventory_categories/records", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cat),
    })
    setCategories(prev => [...prev, data])
    return data
  }, [])

  const update = useCallback(async (id: string, cat: Partial<InventoryCategory>) => {
    const data = await fetchApi(`/api/collections/inventory_categories/records/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cat),
    })
    setCategories(prev => prev.map(c => c.id === id ? data : c))
    return data
  }, [])

  const remove = useCallback(async (id: string) => {
    await fetchApi(`/api/collections/inventory_categories/records/${id}`, { method: "DELETE" })
    setCategories(prev => prev.filter(c => c.id !== id))
  }, [])

  return { categories, loading, error, refetch: fetch, create, update, remove }
}

// ─── Items ───────────────────────────────────────────────────────────────

export function useInventoryItems() {
  const searchParams = useSearchParams()
  const centerFilter = searchParams?.get("center") || ""
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (filters?: { categoryId?: string; search?: string; status?: string }) => {
    setLoading(true)
    try {
      let filterParts: string[] = []
      if (centerFilter) filterParts.push(`centerId='${centerFilter}'`)
      if (filters?.categoryId) filterParts.push(`categoryId='${filters.categoryId}'`)
      if (filters?.status) filterParts.push(`status='${filters.status}'`)
      if (filters?.search) filterParts.push(`name~'${encodeURIComponent(filters.search)}'`)
      const filterStr = filterParts.length ? `&filter=(${filterParts.join(")&&(")})` : ""
      const expand = "&expand=categoryId,centerId"
      const sort = "&sort=name"
      const data = await fetchApi(`/api/collections/inventory_items/records?perPage=200${filterStr}${expand}${sort}`)
      setItems(data?.items || [])
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [centerFilter])

  useEffect(() => { fetch() }, [fetch])

  const create = useCallback(async (item: Partial<InventoryItem>) => {
    const data = await fetchApi("/api/collections/inventory_items/records", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
    setItems(prev => [...prev, data])
    return data
  }, [])

  const update = useCallback(async (id: string, item: Partial<InventoryItem>) => {
    const data = await fetchApi(`/api/collections/inventory_items/records/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
    setItems(prev => prev.map(i => i.id === id ? data : i))
    return data
  }, [])

  const remove = useCallback(async (id: string) => {
    await fetchApi(`/api/collections/inventory_items/records/${id}`, { method: "DELETE" })
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  return { items, loading, error, refetch: fetch, create, update, remove }
}

export function useInventoryItem(itemId?: string) {
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!itemId) return
    setLoading(true)
    try {
      const data = await fetchApi(`/api/collections/inventory_items/records/${itemId}?expand=categoryId,centerId`)
      setItem(data)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [itemId])

  useEffect(() => { fetch() }, [fetch])

  return { item, loading, error, refetch: fetch }
}

// ─── Transactions ────────────────────────────────────────────────────────

export function useInventoryTransactions(itemId?: string) {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      if (itemId) {
        const data = await fetchApi(
          `/api/collections/inventory_transactions/records?filter=itemId%3D%27${encodeURIComponent(itemId)}%27&sort=-date&perPage=200&expand=centerId`
        )
        setTransactions(data?.items || [])
      } else {
        const data = await fetchApi(
          `/api/collections/inventory_transactions/records?sort=-date&perPage=100&expand=itemId,centerId`
        )
        setTransactions(data?.items || [])
      }
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [itemId])

  useEffect(() => { fetch() }, [fetch])

  const create = useCallback(async (tx: Partial<InventoryTransaction>) => {
    const data = await fetchApi("/api/collections/inventory_transactions/records", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tx),
    })
    setTransactions(prev => [data, ...prev])
    return data
  }, [])

  return { transactions, loading, error, refetch: fetch, create }
}

// ─── Low Stock Items ─────────────────────────────────────────────────────

export function useLowStockItems() {
  const searchParams = useSearchParams()
  const centerFilter = searchParams?.get("center") || ""
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const filter = centerFilter ? `&filter=(centerId='${centerFilter}')` : ""
      const data = await fetchApi(`/api/collections/inventory_items/records?perPage=200${filter}&expand=categoryId`)
      const lowStock = (data?.items || []).filter(
        (i: InventoryItem) => i.status === "active" && i.minStock != null && i.stock <= i.minStock
      )
      setItems(lowStock)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [centerFilter])

  useEffect(() => { fetch() }, [fetch])

  return { items, loading, refetch: fetch }
}
