"use client"

/**
 * 原生壳（Capacitor Android）桥接。
 *
 * 网页在浏览器里跑时这些函数全部安全返回空值 —— 调用方不用判断平台。
 * 壳里的插件：PjpcNfc（读卡 UID）、PjpcNotify（通知）、App（版本信息）、Camera（拍照）。
 */

type AnyPlugin = Record<string, any>

function cap(): any {
  if (typeof window === "undefined") return null
  return (window as any).Capacitor || null
}

/** 是不是在装好的 App 里（不是浏览器） */
export function isNativeApp(): boolean {
  const c = cap()
  try {
    return !!c?.isNativePlatform?.()
  } catch {
    return false
  }
}

export function nativePlugin(name: string): AnyPlugin | null {
  const c = cap()
  if (!c) return null
  const p = c.Plugins?.[name]
  return p || null
}

/** App 版本信息（壳里才有）：versionName / build(=versionCode) */
export async function appInfo(): Promise<{ versionName: string; versionCode: number } | null> {
  const App = nativePlugin("App")
  if (!App?.getInfo) return null
  try {
    const info = await App.getInfo()
    return {
      versionName: String(info?.version || ""),
      versionCode: Number(info?.build || 0),
    }
  } catch {
    return null
  }
}

/** 当前登录的 PocketBase token（浏览器和壳里都存 localStorage） */
export function currentAuthToken(): string {
  if (typeof window === "undefined") return ""
  try {
    const raw = localStorage.getItem("pocketbase_auth")
    if (!raw) return ""
    return String(JSON.parse(raw)?.token || "")
  } catch {
    return ""
  }
}

/** 把 token 交给原生，后台轮询才拉得到通知；退出登录要清掉 */
export async function syncNativeAuthToken(): Promise<void> {
  const Notify = nativePlugin("PjpcNotify")
  if (!Notify?.setToken) return
  const token = currentAuthToken()
  try {
    await Notify.setToken({ token })
    if (token) {
      await Notify.requestPermission?.()
      await Notify.enableBackground?.()
    } else {
      await Notify.clear?.()
    }
  } catch {
    /* 原生侧失败不影响网页 */
  }
}

/** 弹一条系统通知（壳里才有；浏览器走 Notification，不支持就静默） */
export async function showLocalNotification(title: string, body: string, link = "", id?: number): Promise<void> {
  const Notify = nativePlugin("PjpcNotify")
  if (Notify?.show) {
    try {
      await Notify.show({ title, body, link, id: id ?? Math.floor(Date.now() / 1000) % 100000 })
      return
    } catch {
      /* 落到浏览器分支 */
    }
  }
  if (typeof window !== "undefined" && "Notification" in window) {
    try {
      if (Notification.permission === "granted") new Notification(title, { body })
    } catch {
      /* ignore */
    }
  }
}

/** 用系统浏览器打开外链（壳里 window.open 可能被拦） */
export function openExternal(url: string): void {
  if (typeof window === "undefined") return
  window.open(url, "_blank", "noopener,noreferrer")
}
