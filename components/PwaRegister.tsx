"use client"

import { useEffect } from "react"

/**
 * 注册 PWA service worker。
 * 只在浏览器 + https（或 localhost）下注册：安卓「添加到主屏幕」要求有 SW，
 * 没有它只会生成一个普通网页快捷方式。
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
        console.warn("[PWA] service worker 注册失败:", err?.message || err)
      })
    }

    // 等页面空闲再注册，别抢首屏带宽
    if (document.readyState === "complete") register()
    else window.addEventListener("load", register, { once: true })
  }, [])

  return null
}
