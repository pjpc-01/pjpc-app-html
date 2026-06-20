"use client"

import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { Center, useCenters } from "./useCenters"

export interface CenterFilterResult {
  /** The centerId from URL (?center=), or 'all' */
  selectedCenterId: string
  /** The resolved Center object, or null if 'all' */
  selectedCenter: Center | null
  /** Whether a specific branch is selected (not 'all') */
  isFiltered: boolean
  /** Build a PB API filter string for this center */
  apiFilter: string
  /** Filter a list of items by centerId (supports both direct field and expand) */
  filterByCenter: <T extends Record<string, any>>(items: T[], centerField?: string) => T[]
}

export function useCenterFilter(): CenterFilterResult {
  const searchParams = useSearchParams()
  const { centers } = useCenters()

  return useMemo(() => {
    const centerId = searchParams?.get("center") || "all"
    const isFiltered = centerId !== "all"
    const center = isFiltered
      ? centers.find((c) => c.id === centerId) || null
      : null

    const apiFilter = isFiltered
      ? `&filter=centerId%3D%22${encodeURIComponent(centerId)}%22`
      : ""

    const filterByCenter = <T extends Record<string, any>>(
      items: T[],
      centerField = "centerId"
    ): T[] => {
      if (!isFiltered) return items
      return items.filter(
        (item) =>
          item[centerField] === centerId ||
          item.expand?.[centerField]?.id === centerId ||
          item[centerField]?.id === centerId
      )
    }

    return {
      selectedCenterId: centerId,
      selectedCenter: center,
      isFiltered,
      apiFilter,
      filterByCenter,
    }
  }, [searchParams, centers])
}
