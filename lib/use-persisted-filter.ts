"use client"

import { useState, type SetStateAction } from "react"

/**
 * 把列表页的筛选值持久化到 sessionStorage。
 * 用途：列表页打开 item／关闭弹窗导致组件重挂载时，筛选不要被清空。
 * 每个页面给一个唯一的 key（见调用处）。
 */
export function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial
    try {
      const raw = window.sessionStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initial
    } catch { return initial }
  })

  // 完全兼容 useState 的 setter：支持直接传值，也支持函数式更新
  const set = (next: SetStateAction<T>) => {
    setValue(prev => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next
      try { window.sessionStorage.setItem(key, JSON.stringify(resolved)) } catch { /* 忽略 */ }
      return resolved
    })
  }

  return [value, set] as const
}
