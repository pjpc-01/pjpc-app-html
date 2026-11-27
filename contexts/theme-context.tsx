"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import { ThemeAmbient, ThemeFlash, ThemeRouteSweep } from "@/components/motion/ThemeKinetic"

/**
 * 全站主题（2026-11-27）
 *
 * 做法：主题 = `<html data-theme="...">` + app/globals.css 里的一组 CSS 变量覆盖。
 * 组件本身只写语义类（bg-card / text-foreground / border-border），所以换主题不用碰页面。
 *
 * 注意：三个主题都是「浅底 + 强性格」，因为页面里有大量写死的 bg-white / text-gray-*，
 * 真正深色底需要逐页改，暂时不做，免得一换主题整站花掉。
 */

export type ThemeId = "phantom" | "glitch" | "scramble"

export type ThemeMeta = {
  id: ThemeId
  name: string
  nameEn: string
  desc: string
  emoji: string
  /** 预览用色块（cls 值不含 hsl()，直接给 CSS 颜色字符串） */
  swatch: { bg: string; primary: string; accent: string; text: string }
}

export const THEMES: ThemeMeta[] = [
  {
    id: "phantom",
    name: "幽灵玻璃",
    nameEn: "Phantom Glass",
    desc: "原本的中性灰白玻璃质感，最稳、最耐看",
    emoji: "🪟",
    swatch: { bg: "#FAFAFA", primary: "#2E2E2E", accent: "#E5E5E5", text: "#2E2E2E" },
  },
  {
    id: "glitch",
    name: "故障霓虹",
    nameEn: "Glitch Neon",
    desc: "青洋红双色、扫描线、标题 RGB 错位抖动",
    emoji: "⚡",
    swatch: { bg: "#F6FAFC", primary: "#00C2D4", accent: "#FF2D95", text: "#0B1B22" },
  },
  {
    id: "scramble",
    name: "乱码终端",
    nameEn: "Scramble Terminal",
    desc: "荧光绿 + 等宽字 + 闪烁光标，像在敲终端",
    emoji: "💻",
    swatch: { bg: "#F7FAF7", primary: "#12A150", accent: "#8CF7B0", text: "#10231A" },
  },
]

const STORAGE_KEY = "pjpc_theme"

type ThemeCtx = {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
  themes: ThemeMeta[]
}

const ThemeContext = createContext<ThemeCtx | undefined>(undefined)

function applyTheme(id: ThemeId) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  if (id === "phantom") {
    delete root.dataset.theme
  } else {
    root.dataset.theme = id
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("phantom")
  // 换主题时 +1，用来触发一次全屏动效
  const [flash, setFlash] = useState(0)

  // 首帧：读本地保存的主题（layout 里还有一段内联脚本先设好，避免闪一下）
  useEffect(() => {
    let saved = "phantom" as ThemeId
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (v === "glitch" || v === "scramble" || v === "phantom") saved = v
    } catch { /* 隐私模式读不到就用默认 */ }
    setThemeState(saved)
    applyTheme(saved)
  }, [])

  const setTheme = useCallback((t: ThemeId) => {
    const changed = t !== theme
    setThemeState(t)
    applyTheme(t)
    try { localStorage.setItem(STORAGE_KEY, t) } catch { /* 忽略 */ }
    // 只有真的换了才播动效，重复点同一个主题不闪
    if (changed) setFlash((n) => n + 1)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
      <ThemeAmbient theme={theme} />
      <ThemeRouteSweep theme={theme} />
      <ThemeFlash theme={theme} trigger={flash} />
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme 必须在 ThemeProvider 内使用")
  return ctx
}
