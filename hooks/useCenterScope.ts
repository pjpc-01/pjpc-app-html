import { useState, useEffect } from 'react'
import { fetchSecureData } from '@/lib/secure-api-client'
import { buildCenterMaps, type CenterMaps, type CenterOption } from '@/lib/center-scope'

export interface CenterScope extends CenterMaps {
  loading: boolean
  /** 下拉选项：全部 / 各分行 / 未分配 */
  options: CenterOption[]
}

const EMPTY: CenterMaps = {
  centerCodeById: new Map(),
  studentCenterCode: new Map(),
  teacherCenterCode: new Map(),
  invoiceCenterCode: new Map(),
  centers: [],
}

/**
 * 分行归属映射 —— 页面筛选分行时用它判断每条记录的归属。
 * 归属规则见 lib/center-scope.ts（支出直连 centerId；发票/收款走学生；薪资走教师）。
 */
export const useCenterScope = (): CenterScope => {
  const [maps, setMaps] = useState<CenterMaps>(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const grab = async (coll: string): Promise<any[]> => {
      try {
        const r = await fetchSecureData<any>(coll, { fullList: true })
        return Array.isArray(r) ? r : (r?.items || [])
      } catch {
        return []
      }
    }
    ;(async () => {
      const [centers, students, teachers, invoices] = await Promise.all([
        grab('centers'),
        grab('students'),
        grab('teachers'),
        grab('invoices'),
      ])
      if (cancelled) return
      setMaps(buildCenterMaps(centers, students, teachers, invoices))
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  return { ...maps, loading, options: maps.centers }
}
