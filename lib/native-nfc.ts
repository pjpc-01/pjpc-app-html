"use client"

import { isNativeApp, nativePlugin } from "@/lib/native-app"

/**
 * 原生 NFC 读一次卡（只在装好的 App 里可用）。
 *
 * 返回卡片 UID（大写十六进制，跟 nfc_cards.card_uid 对齐）；
 * 不是 App 环境返回 null，调用方自己退回 Web NFC。
 *
 * 为什么不用 Web NFC：Web NFC（NDEFReader）只有 Android Chrome 浏览器有，
 * WebView 里根本不存在；原生 Reader Mode 还能读没有 NDEF 记录的卡。
 */
export async function readNativeCardOnce(timeoutMs = 30000): Promise<string | null> {
  if (!isNativeApp()) return null

  const Nfc = nativePlugin("PjpcNfc")
  if (!Nfc?.start) return null

  const state = await Nfc.isAvailable().catch(() => null)
  if (state && state.available === false) {
    throw new Error(state.hardware === false ? "这台手机没有 NFC" : "NFC 没打开，请到系统设置里打开 NFC")
  }

  return new Promise<string | null>(async (resolve) => {
    let listener: any = null
    let done = false

    const cleanup = async () => {
      try { await listener?.remove?.() } catch { /* ignore */ }
      try { await Nfc.stop?.() } catch { /* ignore */ }
    }

    const finish = async (uid: string | null) => {
      if (done) return
      done = true
      clearTimeout(timer)
      await cleanup()
      resolve(uid)
    }

    const timer = setTimeout(() => { void finish(null) }, timeoutMs)

    try {
      listener = await Nfc.addListener("nfcTag", (data: any) => {
        const uid = String(data?.uid || "").replace(/[^0-9A-Fa-f]/g, "").toUpperCase()
        if (uid) void finish(uid)
      })
      await Nfc.start()
    } catch (e: any) {
      clearTimeout(timer)
      throw new Error(e?.message || "开启 NFC 失败")
    }
  })
}
