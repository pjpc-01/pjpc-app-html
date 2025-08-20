import { useState, useCallback, useEffect, useRef } from "react"
import { getPocketBase } from "@/lib/pocketbase"
import type { Fee } from "@/types/fees"

export const useFees = () => {
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMounted = useRef(true)

  // Map PB → Fee (matches PocketBase fees_items schema exactly)
  const mapRecordToFee = (r: any): Fee => ({
    id: r.id,
    name: r.name ?? "Unnamed",
    category: r.category, // Optional, can be undefined
    amount: Number(r.amount ?? 0),
    type: (r.type as Fee["type"]) ?? "monthly",
    status: (r.status as Fee["status"]) ?? "active",
    description: r.description ?? "",
    applicableCenters: r.applicableCenters ?? [],
    applicableLevels: r.applicableLevels ?? [],
  })

  const loadFees = useCallback(async () => {
    if (!isMounted.current) return
    
    setLoading(true)
    setError(null)
    
    try {
      const pb = await getPocketBase()
      const records = await pb.collection("fees_items").getFullList(200, {
        sort: "category",
        requestKey: null, // ✅ prevent auto-cancel
      })
      
      if (isMounted.current) {
        const mappedFees = records.map(mapRecordToFee)
        setFees(mappedFees)
      }
    } catch (err: any) {
      console.error("❌ Load fees failed:", err)
      if (isMounted.current) {
        setError(err.message ?? "Failed to load fees")
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [])

  const createFee = useCallback(async (feeData: Omit<Fee, "id">) => {
    try {
      const pb = await getPocketBase()
      const created = await pb.collection("fees_items").create(feeData, {
        requestKey: null, // ✅ prevent auto-cancel
      })
      const mapped = mapRecordToFee(created)
      setFees(prev => [...prev, mapped])
      return mapped
    } catch (err: any) {
      console.error("❌ Create fee failed:", err)
      throw err
    }
  }, [])

  const updateFee = useCallback(async (id: string, updates: Partial<Fee>) => {
    try {
      const pb = await getPocketBase()
      const updated = await pb.collection("fees_items").update(id, updates, {
        requestKey: null, // ✅ prevent auto-cancel
      })
      const mapped = mapRecordToFee(updated)
      setFees(prev => prev.map(f => (f.id === id ? mapped : f)))
    } catch (err: any) {
      console.error("❌ Update fee failed:", err)
      throw err
    }
  }, [])

  const deleteFee = useCallback(async (id: string) => {
    try {
      const pb = await getPocketBase()
      await pb.collection("fees_items").delete(id, {
        requestKey: null, // ✅ prevent auto-cancel
      })
      setFees(prev => prev.filter(f => f.id !== id))
    } catch (err: any) {
      console.error("❌ Delete fee failed:", err)
      throw err
    }
  }, [])

  const filterFees = useCallback(
    (criteria: Partial<Pick<Fee, "status" | "type" | "category">>) => {
      return fees.filter(f =>
        Object.entries(criteria).every(([key, value]) => (f as any)[key] === value)
      )
    },
    [fees]
  )

  useEffect(() => {
    // ✅ Mark component as mounted
    isMounted.current = true
    
    // Load the fees
    loadFees()
    
    return () => {
      isMounted.current = false
    }
  }, []) // Remove loadFees from dependency array to prevent infinite loop

  return { fees, loading, error, createFee, updateFee, deleteFee, loadFees, filterFees }
} 