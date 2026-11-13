'use client'

import { useEffect, useState } from 'react'

/** 公司资料（抬头/地址/电话/邮箱/口号/logo），来自 /api/company-profile */
export interface CompanyProfile {
  name: string
  name_en: string
  address: string
  phone: string
  phone2: string
  email: string
  slogan: string
  reg_no: string
  logo: string
}

export const EMPTY_COMPANY: CompanyProfile = {
  name: '', name_en: '', address: '', phone: '', phone2: '', email: '', slogan: '', reg_no: '', logo: '',
}

// 同一个页面里多处用，缓存一份，别每个组件都打一次接口
let cache: CompanyProfile | null = null
let inflight: Promise<CompanyProfile> | null = null

export async function loadCompanyProfile(): Promise<CompanyProfile> {
  if (cache) return cache
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const r = await fetch('/api/company-profile', { cache: 'no-store' })
      const j = await r.json()
      cache = (j?.success && j.data ? { ...EMPTY_COMPANY, ...j.data } : EMPTY_COMPANY) as CompanyProfile
    } catch {
      cache = EMPTY_COMPANY
    }
    inflight = null
    return cache as CompanyProfile
  })()
  return inflight
}

export function useCompanyProfile() {
  const [profile, setProfile] = useState<CompanyProfile>(cache || EMPTY_COMPANY)
  const [loading, setLoading] = useState(!cache)
  useEffect(() => {
    let alive = true
    loadCompanyProfile().then((p) => { if (alive) { setProfile(p); setLoading(false) } })
    return () => { alive = false }
  }, [])
  return { profile, loading, refetch: () => { cache = null; return loadCompanyProfile() } }
}
