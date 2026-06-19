"use client"

import { useState, useEffect } from 'react'

export interface Center {
  id: string
  code: string
  name: string
  address?: string
  phone?: string
  studentCount: number
}

export function useCenters() {
  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCenters() {
      try {
        const res = await fetch('/api/pocketbase-proxy/api/collections/centers/records?sort=code&perPage=10')
        const data = await res.json()
        if (data?.items) {
          const enriched = await Promise.all(
            data.items.map(async (c: any) => {
              let count = 0
              try {
                const s = await fetch(
                  `/api/pocketbase-proxy/api/collections/students/records?perPage=1&filter=centerId%3D%22${c.id}%22`
                )
                const sd = await s.json()
                count = sd.totalItems || 0
              } catch {}
              return {
                id: c.id,
                code: c.code,
                name: c.name,
                address: c.address,
                phone: c.phone,
                studentCount: count,
              } as Center
            })
          )
          setCenters(enriched)
        }
      } catch (e) {
        console.error('Failed to fetch centers:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchCenters()
  }, [])

  return { centers, loading }
}
