"use client"

import { isNativeApp, nativePlugin } from "@/lib/native-app"

/**
 * App 内更新（只在装好的 App 里有）。
 *
 * 流程：App 里点「更新」→ 原生下载 apk（带进度）→ 校验签名是不是我们自己的证书
 *      → 交给系统安装器 → 用户点一次「安装」→ 覆盖完成，数据都在。
 *
 * 安卓不允许完全静默安装（除了企业 MDM 托管的设备），那一次点击省不掉；
 * 但用户不用去浏览器、不用翻文件管理器，也不用自己找下载的文件。
 */

export type UpdateResult =
  | { ok: true }
  | { ok: false; reason: "not-native" | "need-permission" | "failed"; message?: string }

export async function installUpdate(url: string, onProgress?: (pct: number) => void): Promise<UpdateResult> {
  if (!isNativeApp()) return { ok: false, reason: "not-native" }

  const U = nativePlugin("PjpcUpdater")
  if (!U?.install) return { ok: false, reason: "not-native" }

  try {
    const state = await U.canInstall?.().catch(() => ({ allowed: true }))
    if (state && state.allowed === false) {
      // 直接把他带到「允许安装未知应用」的开关页，省得自己找
      await U.openInstallSettings?.().catch(() => {})
      return { ok: false, reason: "need-permission" }
    }

    if (onProgress) {
      try {
        await U.addListener?.("progress", (p: any) => onProgress(Number(p?.percent || 0)))
      } catch {
        /* 没进度也能装 */
      }
    }

    await U.install({ url })
    return { ok: true }
  } catch (e: any) {
    return { ok: false, reason: "failed", message: e?.message || "更新失败" }
  }
}
