"use client"

/**
 * 支出类别 —— 自定义类别数据源
 *
 * 存在 PB 集合 `expense_categories`（照 fee_categories 模式）：
 *   name(显示名) / key(存进 expenses.category 的代号) / sort_order / color(hex) / deleted
 *
 * 关键设计：
 * - expenses.category 存的是 **key**，所以「改名」只动 name，历史记录不受影响
 * - 「删除」是**软删**（deleted=true）：下拉里不再出现，但历史支出仍能解析出正确名称
 * - 取不到数据时回退到内置默认列表，页面不会白屏
 */

import { useState, useEffect, useCallback, useMemo } from "react"

const PROXY = "/api/pocketbase-proxy/api/collections/expense_categories"

export interface ExpenseCategory {
  id: string
  name: string
  key: string
  sort_order: number
  color: string
  deleted?: boolean
}

/** 内置默认（与迁移前的硬编码一致）—— 作为拉取失败时的兜底 */
const DEFAULTS: ExpenseCategory[] = [
  { id: "salary", key: "salary", name: "教师薪资", sort_order: 1, color: "#1D4ED8" },
  { id: "rent", key: "rent", name: "办公室租金", sort_order: 2, color: "#7E22CE" },
  { id: "utilities", key: "utilities", name: "水电费", sort_order: 3, color: "#0E7490" },
  { id: "marketing", key: "marketing", name: "市场推广", sort_order: 4, color: "#B45309" },
  { id: "stationery", key: "stationery", name: "办公文具", sort_order: 5, color: "#15803D" },
  { id: "maintenance", key: "maintenance", name: "设备维护", sort_order: 6, color: "#C2410C" },
  { id: "misc", key: "misc", name: "其他杂项", sort_order: 7, color: "#4B5563" },
]

/** 新类别自动轮换的配色 */
export const CATEGORY_PALETTE = [
  "#1D4ED8", "#7E22CE", "#0E7490", "#B45309", "#15803D", "#C2410C",
  "#BE123C", "#4F46E5", "#0F766E", "#A16207", "#4B5563", "#9333EA",
]

/** 由名称生成 key：纯 ASCII 用 slug；中文名 slug 只剩零散字母，必须补随机后缀防撞 key */
export function makeCategoryKey(name: string): string {
  const raw = (name || "").trim().toLowerCase()
  const slug = raw.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
  const hasNonAscii = /[^\x00-\x7F]/.test(raw)
  // 「测试类别XYZ」→「xyz」这种：既短又来自中文名，撞车风险高 → 加随机后缀
  if (slug.length >= 3 && !hasNonAscii) return slug
  const rand = Math.random().toString(36).slice(2, 6)
  return slug ? `${slug}_${rand}` : `cat_${rand}`
}

export function useExpenseCategories() {
  const [all, setAll] = useState<ExpenseCategory[]>(DEFAULTS)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${PROXY}/records?perPage=200&sort=+sort_order`)
      const data = await res.json()
      const items = (data?.items || []) as any[]
      if (items.length > 0) {
        setAll(items.map(x => ({
          id: x.id, name: x.name || x.key, key: x.key || x.id,
          sort_order: Number(x.sort_order) || 0, color: x.color || "#4B5563",
          deleted: x.deleted === true,
        })))
      }
    } catch { /* 用默认 */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  /** 下拉用：未删除 + 按 sort_order */
  const categories = useMemo(
    () => all.filter(c => !c.deleted).sort((a, b) => (a.sort_order - b.sort_order) || a.name.localeCompare(b.name)),
    [all]
  )

  /** 显示用：包含已删的，保证历史支出还能显示正确名称 */
  const byKey = useMemo(() => new Map(all.map(c => [c.key, c])), [all])

  const labelOf = useCallback((key: string) => byKey.get(key)?.name || key, [byKey])
  const colorOf = useCallback((key: string) => byKey.get(key)?.color || "#4B5563", [byKey])

  const create = async (name: string, color: string) => {
    const key = makeCategoryKey(name)
    const sort_order = (categories[categories.length - 1]?.sort_order || 0) + 1
    const res = await fetch(`${PROXY}/records`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), key, sort_order, color, deleted: false }),
    })
    if (!res.ok) throw new Error("添加失败")
    await load()
  }

  const rename = async (id: string, name: string) => {
    await fetch(`${PROXY}/records/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    })
    await load()
  }

  const setColor = async (id: string, color: string) => {
    await fetch(`${PROXY}/records/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    })
    await load()
  }

  /** 软删：从下拉消失，历史记录仍可解析名称 */
  const remove = async (id: string) => {
    await fetch(`${PROXY}/records/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleted: true }),
    })
    await load()
  }

  /** 排序：与相邻项交换 sort_order */
  const move = async (id: string, dir: -1 | 1) => {
    const list = [...categories]
    const i = list.findIndex(c => c.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= list.length) return
    const a = list[i], b = list[j]
    await Promise.all([
      fetch(`${PROXY}/records/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: b.sort_order }) }),
      fetch(`${PROXY}/records/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: a.sort_order }) }),
    ])
    await load()
  }

  return { categories, all, loading, labelOf, colorOf, create, rename, setColor, remove, move, reload: load }
}
