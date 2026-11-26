"use client"

import { isNativeApp, nativePlugin, currentAuthToken, appInfo } from "@/lib/native-app"

/**
 * FCM 推送注册（装好的 App 里才有；浏览器里什么都不做）。
 *
 * 流程：要权限 → 注册 → 拿到 FCM token → 交给服务器存起来（按账号）。
 * 服务器发通知时按账号查 token 直接推，手机秒收，App 不用在后台跑。
 *
 * 没配 Firebase（没有 google-services.json）时，这里会静默失败，
 * 后台那一套 15 分钟轮询照旧能兜底。
 */

let registered = false

export async function registerPush(): Promise<boolean> {
  if (!isNativeApp() || registered) return false

  const Push = nativePlugin("PushNotifications")
  if (!Push) return false

  try {
    const perm = await Push.checkPermissions?.()
    let granted = perm?.receive === "granted"
    if (!granted) {
      const req = await Push.requestPermissions?.()
      granted = req?.receive === "granted"
    }
    if (!granted) return false

    // 拿 token 的回调先挂上，再 register
    await Push.addListener?.("registration", async (t: any) => {
      const fcm = String(t?.value || "")
      if (!fcm) return
      const auth = currentAuthToken()
      if (!auth) return
      const info = await appInfo().catch(() => null)
      try {
        await fetch("/api/push/register", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: auth },
          body: JSON.stringify({
            token: fcm,
            platform: "android",
            appVersion: info?.versionName || "",
          }),
        })
        registered = true
        // 推送已经能到了，就不需要那套 15 分钟轮询，也就没必要在原生层留着明文会话 token
        const Notify = nativePlugin("PjpcNotify")
        try {
          await Notify?.disableBackground?.()
          await Notify?.setToken?.({ token: "" })
        } catch {
          /* ignore */
        }
      } catch {
        /* 网络问题下次启动再试 */
      }
    })

    await Push.addListener?.("registrationError", (e: any) => {
      console.warn("[PUSH] 注册失败:", e?.error || e)
    })

    // App 在前台时系统不会自己弹，这里手动补一条
    await Push.addListener?.("pushNotificationReceived", async (n: any) => {
      const title = n?.title || "PJPC"
      const body = n?.body || ""
      const link = String(n?.data?.link || "")
      const Notify = nativePlugin("PjpcNotify")
      try {
        await Notify?.show?.({ title, body, link, id: Math.floor(Date.now() / 1000) % 100000 })
      } catch {
        /* ignore */
      }
    })

    // 点了通知 → 跳到对应页面（壳里就是改地址）
    await Push.addListener?.("pushNotificationActionPerformed", (ev: any) => {
      const link = String(ev?.notification?.data?.link || "")
      if (!link) return
      try {
        window.location.assign(link.startsWith("http") ? link : `https://pjpcapp.com${link}`)
      } catch {
        /* ignore */
      }
    })

    await Push.register?.()
    return true
  } catch (e: any) {
    console.warn("[PUSH] 初始化失败:", e?.message || e)
    return false
  }
}

/** 退出登录时把 token 从服务器注销，别把别人的通知推到这台手机 */
export async function unregisterPush(): Promise<void> {
  if (!isNativeApp()) return
  const Push = nativePlugin("PushNotifications")
  try {
    await Push?.removeAllListeners?.()
  } catch {
    /* ignore */
  }
  registered = false
}
