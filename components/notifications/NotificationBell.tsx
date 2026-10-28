"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
  const boxRef = useRef<HTMLDivElement>(null)

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
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
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
        className="relative h-7 w-7 rounded-md flex items-center justify-center text-gray-500/60 hover:text-gray-800 hover:bg-gray-100/40 transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-label={t("通知")}
      >
        <Bell className="h-3.5 w-3.5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-red-500 text-[9px] leading-[14px] text-white text-center font-semibold">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-80 max-h-[70vh] overflow-hidden rounded-xl border bg-white shadow-xl z-50">
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
        </div>
      )}
    </div>
  )
}
