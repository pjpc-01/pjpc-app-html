import { useState, useEffect, useCallback } from 'react'
import { fetchSecureData, createRecord, updateRecord, deleteRecord } from '@/lib/secure-api-client'

export type ClaimStatus = 'draft' | 'submitted' | 'supervisor_approved' | 'finance_approved' | 'rejected'

export interface ClaimItem {
  no?: string
  date: string
  desc: string
  amount: number
  note: string
  receipt: boolean
}

export interface ClaimForm {
  id: string
  claimant: string
  position: string
  center: string
  claim_no: string
  fill_date: string
  period: string
  items: ClaimItem[]
  total: number
  notes: string
  status: ClaimStatus
  created_by: string
  created_by_name: string
  supervisor_comment: string
  finance_comment: string
  supervisor_at: string
  finance_at: string
  created?: string
  updated?: string
}

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  draft: '草稿',
  submitted: '待审批（已提交）',
  supervisor_approved: '主管已批（待财务）',
  finance_approved: '已批可发',
  rejected: '已驳回',
}

export const useClaimForms = () => {
  const [claims, setClaims] = useState<ClaimForm[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const data = await fetchSecureData<ClaimForm>('claim_forms', { sort: '-created', fullList: true })
      setClaims(data)
    } catch (e) {
      console.error('fetch claim_forms:', e)
      setError(e instanceof Error ? e.message : '获取报销单失败')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchClaims() }, [fetchClaims])

  const create = async (data: Omit<ClaimForm, 'id'>) => {
    const rec = await createRecord('claim_forms', data) as ClaimForm
    setClaims(prev => [rec, ...prev])
    return rec
  }

  const update = async (id: string, updates: Partial<ClaimForm>) => {
    const rec = await updateRecord('claim_forms', id, updates) as ClaimForm
    setClaims(prev => prev.map(c => c.id === id ? rec : c))
    return rec
  }

  const remove = async (id: string) => {
    await deleteRecord('claim_forms', id)
    setClaims(prev => prev.filter(c => c.id !== id))
  }

  const setStatus = (id: string, status: ClaimStatus, comment: string, role: 'supervisor' | 'finance') => {
    const now = new Date()
    const stamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
    const updates: Partial<ClaimForm> = { status } as any
    if (role === 'supervisor') { updates.supervisor_comment = comment; updates.supervisor_at = stamp }
    else { updates.finance_comment = comment; updates.finance_at = stamp }
    return update(id, updates)
  }

  return { claims, loading, error, fetchClaims, create, update, remove, setStatus }
}