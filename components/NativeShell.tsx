"use client"

import { useEffect, useState } from "react"
import { appInfo, isNativeApp, nativePlugin, currentAuthToken, syncNativeAuthToken, openExternal } from "@/lib/native-app"
import { takePhoto } from "@/lib/native-camera"
import { registerPush } from "@/lib/native-push"
import { useLanguage } from "@/contexts/language-context";

/**
 * 只在装好的 App（Capacitor 壳）里生效的几件事：
 *  1) 版本检查：太旧整屏拦住，有新版本给一张可关的横幅
 *  2) 把登录 token 交给原生（后台每 15 分钟拉通知靠它）
 *  3) App 在前台时自己轮询未读通知，有新就弹系统通知（后台那条由 WorkManager 负责）
 *
 * 在浏览器里打开时组件什么也不渲染、什么也不请求。
 */

type VersionInfo = {
  latestVersionCode: number
  latestVersionName: string
  minSupportedVersionCode: number
  apkUrl: string
  releaseUrl: string
  updateNotes: string
}

const POLL_MS = 90_000
const SEEN_KEY = "pjpc_notice_seen"

function loadSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"))
  } catch {
    return new Set()
  }
}

function saveSeen(ids: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(ids).slice(-200)))
  } catch {
    /* ignore */
  }
}

export default function NativeShell() {
  const { t } = useLanguage();
  const [blocked, setBlocked] = useState<VersionInfo | null>(null)
  const [update, setUpdate] = useState<VersionInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!isNativeApp()) return

    let alive = true
    let timer: any = null

    const checkVersion = async () => {
      try {
        const info = await appInfo()
        const res = await fetch("/api/app-version", { cache: "no-store" })
        if (!res.ok) return
        const v: VersionInfo = await res.json()
        if (!alive || !info || !info.versionCode) return

        if (v.minSupportedVersionCode && info.versionCode < v.minSupportedVersionCode) {
          setBlocked(v)
        } else if (v.latestVersionCode && info.versionCode < v.latestVersionCode) {
          setUpdate(v)
        } else {
          setUpdate(null)
          setBlocked(null)
        }
      } catch {
        /* 网络不通就不拦，别把人挡在门外 */
      }
    }

    const pollNotifications = async () => {
      const token = currentAuthToken()
      if (!token) return
      try {
        const res = await fetch("/api/notifications?limit=5", {
          headers: { Authorization: token },
          cache: "no-store",
        })
        if (!res.ok) return
        const data = await res.json()
        const items: any[] = Array.isArray(data?.items) ? data.items : []
        const seen = loadSeen()
        const fresh = items.filter((n) => n && !n.read && !seen.has(n.id))
        const Notify = nativePlugin("PjpcNotify")
        for (const n of fresh.slice(0, 3)) {
          try {
            await Notify?.show?.({
              title: n.title || "PJPC",
              body: n.body || "",
              link: n.link || "",
              id: Math.abs(String(n.id).split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)) % 100000,
            })
          } catch {
            /* ignore */
          }
          seen.add(n.id)
        }
        if (fresh.length) saveSeen(seen)
      } catch {
        /* 网络抖动不打扰用户 */
      }
    }

    const boot = async () => {
      await checkVersion()
      await syncNativeAuthToken()
      // FCM 推送（配了 Firebase 才真正拿到 token；没配就静默失败，靠下面的轮询兜底）
      if (currentAuthToken()) void registerPush()
      await pollNotifications()
      // 登录状态可能在页面里才建立，隔几秒再同步一次 token
      setTimeout(() => { if (alive) syncNativeAuthToken() }, 4000)
      timer = setInterval(() => {
        if (!alive) return
        if (document.visibilityState === "visible") pollNotifications()
      }, POLL_MS)
    }

    boot()

    // 相机：壳里所有「选图片」的 <input type="file" accept="image/*"> 都改成开原生相机 / 相册，
    // 再用 DataTransfer 把照片塞回原 input 并派发 change —— 各页面上传逻辑一行都不用改。
    const onFileInputClick = async (ev: MouseEvent) => {
      const el = ev.target as HTMLInputElement | null
      if (!el || el.tagName !== "INPUT") return
      const input = el as HTMLInputElement
      if (input.type !== "file") return
      const accept = (input.getAttribute("accept") || "").toLowerCase()
      if (!accept.includes("image")) return
      ev.preventDefault()
      ev.stopPropagation()
      try {
        const file = await takePhoto("prompt")
        if (!file) return
        const dt = new DataTransfer()
        dt.items.add(file)
        input.files = dt.files
        input.dispatchEvent(new Event("change", { bubbles: true }))
      } catch (e: any) {
        console.warn("[NATIVE] 拍照失败:", e?.message || e)
      }
    }
    document.addEventListener("click", onFileInputClick, true)

    const onVisible = () => {
      if (document.visibilityState !== "visible") return
      checkVersion()
      syncNativeAuthToken()
      if (currentAuthToken()) void registerPush()
      pollNotifications()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      alive = false
      if (timer) clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
      document.removeEventListener("click", onFileInputClick, true)
    }
  }, [])

  if (blocked) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-white px-6 text-center">
        <div className="text-base font-semibold text-gray-900">{t("这个版本的 App 已经不能再用了")}</div>
        <div className="text-sm leading-relaxed text-gray-600">
          {t("必须更新到")} {blocked.latestVersionName} {t("才能继续使用。")}
          <br />
          {blocked.updateNotes}
        </div>
        <button
          type="button"
          onClick={() => openExternal(blocked.apkUrl)}
          className="rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white"
        >
          {t("立即更新")}
        </button>
        <div className="text-xs text-gray-400">{t("下载后点安装，装完回到这里就会自动进入")}</div>
      </div>
    )
  }

  if (update && !dismissed) {
    return (
      <div className="fixed inset-x-0 top-0 z-[9998] flex items-center gap-2 bg-amber-500 px-3 py-2 text-white shadow">
        <div className="min-w-0 flex-1 text-[13px] leading-tight">
          <span className="font-semibold">{t("有新版本")} {update.latestVersionName}</span>
          <span className="ml-1 opacity-90">{update.updateNotes}</span>
        </div>
        <button
          type="button"
          onClick={() => openExternal(update.apkUrl)}
          className="shrink-0 rounded-full bg-white/95 px-3 py-1 text-[13px] font-medium text-amber-700"
        >
          {t("更新")}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 px-1 text-sm opacity-90"
          aria-label={t("稍后")}
        >
          {t("稍后")}
        </button>
      </div>
    )
  }

  return null
}
