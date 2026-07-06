"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { fetchSecureData, createRecord, updateRecord, deleteRecord } from "@/lib/secure-api-client"
import type { Fee } from "@/types/fees"

export interface FeeData extends Fee {
  // UI-friendly aliases if needed in the future
  frequency_alias?: string
}

export const useFees = () => {
  const [fees, setFees] = useState<FeeData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMounted = useRef(true)

  const mapRecordToFee = (r: any): FeeData => ({
    id: r.id,
    name: r.name ?? "Unnamed",
    category: r.category,
    amount: Number(r.amount ?? 0),
    type: (r.frequency as Fee["type"]) ?? "monthly", // Map DB 'frequency' to UI 'type'
    status: (r.status as Fee["status"]) ?? "active",
    description: r.description ?? "",
    icon: r.icon, // Lucide icon name
    applicableCenters: [], // Not in current DB schema
    applicableLevels: [], // Not in current DB schema
    frequency_alias: r.frequency
  })

  const loadFees = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await fetchSecureData<any[]>('fee_items', {
        fullList: true,
        sort: 'category',
      })
      
      if (isMounted.current) {
        const mappedFees = (data || []).map(mapRecordToFee)
        setFees(mappedFees)
      }
    } catch (err: any) {
      console.error("❌ Load fees failed:", err)
      if (isMounted.current) {
        setError(err.message || "Failed to load fee items")
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [])

  const createFee = useCallback(async (feeData: Omit<Fee, "id">) => {
    try {
      // Map UI fields back to DB schema
      const dataToSave = {
        ...feeData,
        frequency: feeData.type, // Map 'type' back to 'frequency'
      }
      // Remove UI-only fields that would cause DB errors
      delete (dataToSave as any).type
      delete (dataToSave as any).applicableCenters
      delete (dataToSave as any).applicableLevels

      const result = await createRecord('fee_items', dataToSave)
      await loadFees()
      return mapRecordToFee(result)
    } catch (err: any) {
      console.error("❌ Create fee failed:", err)
      throw new Error(`创建费用项失败: ${err.message}`)
    }
  }, [loadFees])

  const updateFee = useCallback(async (id: string, updates: Partial<Fee>) => {
    try {
      const dataToUpdate: any = { ...updates }
      if (updates.type) {
        dataToUpdate.frequency = updates.type
        delete dataToUpdate.type
      }
      delete dataToUpdate.applicableCenters
      delete dataToUpdate.applicableLevels

      await updateRecord('fee_items', id, dataToUpdate)
      await loadFees()
    } catch (err: any) {
      console.error("❌ Update fee failed:", err)
      throw new Error(`更新费用项失败: ${err.message}`)
    }
  }, [loadFees])

  const deleteFee = useCallback(async (id: string) => {
    try {
      await deleteRecord('fee_items', id)
      await loadFees()
    } catch (err: any) {
      console.error("❌ Delete fee failed:", err)
      throw new Error(`删除费用项失败: ${err.message}`)
    }
  }, [loadFees])

  const filterFees = useCallback(
    (criteria: Partial<Pick<Fee, "status" | "type" | "category">>) => {
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
  }, [loadFees])

  return { fees, loading, error, createFee, updateFee, deleteFee, loadFees, filterFees }
}
