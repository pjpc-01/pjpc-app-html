"use client"

import { useState } from "react"

/**
 * 把列表页的筛选值持久化到 sessionStorage。
 * 用途：列表页打开 item／关闭弹窗导致组件重挂载时，筛选不要被清空。
 * 每个页面给一个唯一的 key（见调用处）。
 */
export function usePersistedFilter(key: string, initial = "") {
  const [value, setValue] = useState<string>(() => {
    if (typeof window === "undefined") return initial
    try { return window.sessionStorage.getItem(key) ?? initial } catch { return initial }
  })

  const set = (next: string) => {
    setValue(next)
    try { window.sessionStorage.setItem(key, next) } catch { /* 忽略隐私模式等异常 */ }
  }

  return [value, set] as const
}
