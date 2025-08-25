import { useState, useCallback, useEffect, useRef } from "react"
import { getPocketBase } from "@/lib/pocketbase"
import type { Fee } from "@/types/fees"

export const useFees = () => {
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMounted = useRef(true)

  // Map PB → Fee (matches PocketBase fee_items schema exactly)
  const mapRecordToFee = (r: any): Fee => ({
    id: r.id,
    name: r.name ?? "Unnamed",
    category: r.category ?? "学费", // Required field with default
    amount: Number(r.amount ?? 0),
    frequency: (r.frequency as Fee["frequency"]) ?? "recurring", // Changed from type to frequency
    status: (r.status as Fee["status"]) ?? "active",
    description: r.description ?? "",
  })

  const loadFees = useCallback(async () => {
    if (!isMounted.current) return
    
    setLoading(true)
    setError(null)
    
    try {
      const pb = await getPocketBase()
      const records = await pb.collection("fee_items").getFullList(200, {
        sort: "category"
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
      const created = await pb.collection("fee_items").create(feeData)
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
      const updated = await pb.collection("fee_items").update(id, updates)
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
      await pb.collection("fee_items").delete(id)
      setFees(prev => prev.filter(f => f.id !== id))
    } catch (err: any) {
      console.error("❌ Delete fee failed:", err)
      throw err
    }
  }, [])

  const filterFees = useCallback(
    (criteria: Partial<Pick<Fee, "status" | "frequency" | "category">>) => {
      return fees.filter(f =>
        Object.entries(criteria).every(([key, value]) => (f as any)[key] === value)
      )
    },
    [fees]
  )

  useEffect(() => {
    isMounted.current = true
    loadFees()
    
    return () => {
      isMounted.current = false
    }
  }, [])

  return { fees, loading, error, createFee, updateFee, deleteFee, loadFees, filterFees }
} 