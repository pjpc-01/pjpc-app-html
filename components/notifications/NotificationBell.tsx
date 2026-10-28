"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

/**
 * 站内通知铃铛（侧边栏底部）。
 *
 * 每分钟拉一次未读数；点开看最近通知，点某一条就标记已读并跳到相关页面。
 */
export default function NotificationBell() {
  const { t } = useLanguage()
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pos, setPos] = useState<{ left: number; bottom: number }>({ left: 0, bottom: 0 })
  const boxRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications?limit=20")
      if (!r.ok) return
      const d = await r.json()
      if (d?.success) {
        setItems(d.items || [])
        setUnread(Number(d.unread || 0))
      }
    } catch { /* 网络抖动忽略 */ }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 60000)
    return () => clearInterval(timer)
  }, [load])

  // 点外面关掉
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const el = e.target as Node
      if (boxRef.current?.contains(el) || panelRef.current?.contains(el)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  const openItem = async (x: any) => {
    setOpen(false)
    if (!x.read) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: x.id }),
        })
        setUnread(u => Math.max(0, u - 1))
        setItems(list => list.map(i => (i.id === x.id ? { ...i, read: true } : i)))
      } catch { /* 忽略 */ }
    }
    if (x.link) router.push(x.link)
  }

  const markAll = async () => {
    setLoading(true)
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      })
      setUnread(0)
      setItems(list => list.map(i => ({ ...i, read: true })))
    } finally { setLoading(false) }
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        className={`relative h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${
          unread > 0
            ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
        onClick={() => {
          // 侧边栏是 overflow-hidden，弹窗必须用 fixed 定位才不会被裁掉
          const r = boxRef.current?.getBoundingClientRect()
          if (r) setPos({ left: Math.min(r.left, Math.max(8, window.innerWidth - 328)), bottom: window.innerHeight - r.top + 8 })
          setOpen(o => !o)
        }}
        aria-label={t("通知")}
        title={unread > 0 ? `${unread} ${t("条未读通知")}` : t("通知")}
      >
        <Bell className="h-5 w-5" strokeWidth={2.2} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[10px] leading-4 text-white text-center font-semibold shadow">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          className="fixed max-h-[70vh] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl z-[60]"
          style={{ width: 320, left: pos.left, bottom: pos.bottom }}
        >
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-semibold text-gray-800">{t("通知")}</span>
            {unread > 0 && (
              <button className="text-xs text-blue-600 hover:underline disabled:opacity-50" disabled={loading} onClick={markAll}>
                {t("全部已读")}
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">{t("还没有通知")}</p>
            ) : (
              items.map((x: any) => (
                <button
                  key={x.id}
                  onClick={() => openItem(x)}
                  className={`block w-full border-b px-3 py-2 text-left last:border-0 hover:bg-gray-50 ${x.read ? "" : "bg-blue-50/40"}`}
                >
                  <div className="flex items-start gap-2">
                    {!x.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-gray-800">{x.title}</p>
                      {x.body && <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-500">{x.body}</p>}
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {String(x.created || "").slice(0, 16).replace("T", " ")}
                        {x.actor ? ` · ${x.actor}` : ""}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
