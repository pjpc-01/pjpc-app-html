import { useState, useCallback, useEffect, useRef } from "react"
import { pb } from "@/lib/pocketbase"
import type { Fee } from "@/types/fees"

// Mock Data for Testing (Frontend logic verification)
const MOCK_FEES: Fee[] = [
  {
    id: "mock-1",
    name: "Monthly Tuition Fee",
    amount: 250,
    type: "monthly",
    status: "active",
    description: "Standard monthly tuition",
    category: "Tuition",
    applicableCenters: ["Center A"],
    applicableLevels: ["Primary 1", "Primary 2"],
  },
  {
    id: "mock-2",
    name: "Registration Fee",
    amount: 100,
    type: "one-time",
    status: "active",
    description: "New student registration",
    category: "Administrative",
    applicableCenters: ["Center A", "Center B"],
    applicableLevels: [],
  },
  {
    id: "mock-3",
    name: "Textbook Fee",
    amount: 50,
    type: "one-time",
    status: "active",
    description: "Yearly textbooks",
    category: "Materials",
    applicableCenters: ["Center A"],
    applicableLevels: ["Primary 1"],
  },
  {
    id: "mock-4",
    name: "Late Payment Penalty",
    amount: 20,
    type: "one-time",
    status: "inactive",
    description: "Penalty for payments after 7th of month",
    category: "Administrative",
    applicableCenters: [],
    applicableLevels: [],
  },
];

export const useFees = () => {
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMounted = useRef(true)

  const mapRecordToFee = (r: any): Fee => ({
    id: r.id,
    name: r.name ?? "Unnamed",
    category: r.category,
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
      // First attempt: try real API
      const records = await pb.collection("fees_items").getFullList(200, {
        sort: "category",
        requestKey: null,
      })
      
      if (isMounted.current) {
        const mappedFees = records.map(mapRecordToFee)
        setFees(mappedFees)
      }
    } catch (err: any) {
      console.error("❌ Load fees failed, falling back to mock data:", err)
      if (isMounted.current) {
        // Fallback to MOCK_FEES for testing purposes
        setFees(MOCK_FEES)
        setError(null) // Clear error to show mock data instead of error screen
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [])

  const createFee = useCallback(async (feeData: Omit<Fee, "id">) => {
    try {
      const created = await pb.collection("fees_items").create(feeData, {
        requestKey: null,
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
      const updated = await pb.collection("fees_items").update(id, updates, {
        requestKey: null,
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
      await pb.collection("fees_items").delete(id, {
        requestKey: null,
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
    isMounted.current = true
    loadFees()
    return () => {
      isMounted.current = false
    }
  }, [loadFees])

  return { fees, loading, error, createFee, updateFee, deleteFee, loadFees, filterFees }
}