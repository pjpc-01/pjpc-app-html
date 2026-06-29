"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

export type ThemeId = "amber" | "planhat" | "superlist" | "basedash" | "phantom"

export interface ThemeInfo {
  id: ThemeId
  name: string
  nameZh: string
  description: string
  previewColor: string
  previewBg: string
  previewAccent: string
  style: string
}

export const THEMES: ThemeInfo[] = [
  {
    id: "amber",
    name: "Warm Card",
    nameZh: "🏡 暖琥珀",
    description: "圆润卡片，暖琥珀色，温馨亲切 — 当前默认风格",
    previewColor: "#D97706",
    previewBg: "#FEF3C7",
    previewAccent: "#FDE68A",
    style: "card",
  },
  {
    id: "planhat",
    name: "Flat Data",
    nameZh: "📊 数据优先",
    description: "扁平直角，低阴影，灰调配色，数据驱动 — 灵感 Planhat",
    previewColor: "#64748B",
    previewBg: "#F1F5F9",
    previewAccent: "#CBD5E1",
    style: "flat",
  },
  {
    id: "superlist",
    name: "Playful",
    nameZh: "🎨 创意画板",
    description: "超大圆角，色彩丰富，蓬松阴影，活泼创意 — 灵感 Superlist",
    previewColor: "#A855F7",
    previewBg: "#F3E8FF",
    previewAccent: "#E9D5FF",
    style: "playful",
  },
  {
    id: "basedash",
    name: "Data Tool",
    nameZh: "⚡ 数据工具",
    description: "深色侧栏，紧凑表格，蓝色系专业 — 灵感 Basedash",
    previewColor: "#3B82F6",
    previewBg: "#EFF6FF",
    previewAccent: "#BFDBFE",
    style: "compact",
  },
  {
    id: "phantom",
    name: "Glassmorphism",
    nameZh: "✨ 幻影玻璃",
    description: "毛玻璃效果，优雅中性色，高级感 — 灵感 Phantom",
    previewColor: "#6B7280",
    previewBg: "#F9FAFB",
    previewAccent: "#E5E7EB",
    style: "glass",
  },
]

interface ThemeContextType {
  themeId: ThemeId
  themeInfo: ThemeInfo
  setTheme: (id: ThemeId) => void
  availableThemes: ThemeInfo[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = "pjpc-theme"
const DEFAULT_THEME: ThemeId = "amber"

// Backward compatibility: old theme IDs → new theme IDs
const THEME_MIGRATION: Record<string, ThemeId> = {
  ocean: "planhat",
  forest: "superlist",
  lavender: "basedash",
  midnight: "phantom",
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME)
  const [mounted, setMounted] = useState(false)

  // On mount, read saved theme from localStorage (with migration support)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as string | null
      if (saved) {
        // Migrate old theme names
        const migrated = THEME_MIGRATION[saved] || saved
        if (THEMES.some((t) => t.id === migrated)) {
          setThemeId(migrated as ThemeId)
        }
      }
    } catch {}
    setMounted(true)
  }, [])

  // Apply/remove theme class on <html>
  useEffect(() => {
    const html = document.documentElement

    // Remove all theme classes
    for (const t of THEMES) {
      html.classList.remove(`theme-${t.id}`)
    }

    // Add the active theme class (not for default 'amber' to keep it clean)
    if (themeId !== "amber") {
      html.classList.add(`theme-${themeId}`)
    }

    // Save preference
    try {
      localStorage.setItem(STORAGE_KEY, themeId)
    } catch {}
  }, [themeId])

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id)
  }, [])

  const themeInfo = THEMES.find((t) => t.id === themeId) || THEMES[0]

  // Still wrap with provider even before mount for SSR
  return (
    <ThemeContext.Provider
      value={{
        themeId,
        themeInfo,
        setTheme,
        availableThemes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
