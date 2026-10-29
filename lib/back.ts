"use client"

/**
 * 返回上一页：有站内历史就真的退回去，没有才去 fallback。
 *
 * 为什么不能用 window.history.length > 1 判断：只要浏览器开过一次新页面它就 > 1，
 * 直接打开 /teacher-teaching-report（例如 NFC 刷卡后跳进来、或从书签进）也会误判，
 * 于是「返回」把用户弹回首页，看起来就是返回键坏了。
 *
 * Next App Router 会在 history.state 里放 idx（当前是第几条历史记录）：
 *   idx > 0  → 前面还有站内页面，安全地 back()
 *   idx <= 0 → 是这一页的第一个，退无可退，改成去 fallback
 */
export function goBack(fallback: string = "/") {
  if (typeof window === "undefined") return
  const state: any = window.history.state
  const idx = state && typeof state.idx === "number" ? state.idx : 0
  if (idx > 0) window.history.back()
  else window.location.assign(fallback)
}

/** 老师退回教师工作台，其他角色退仪表板 —— 页面没历史时用 */
export function goBackForRole(role?: string) {
  goBack(role === "teacher" ? "/teacher-workspace" : "/")
}
