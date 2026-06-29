"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

export type ThemeId = "amber" | "ocean" | "forest" | "lavender" | "midnight"

export interface ThemeInfo {
  id: ThemeId
  name: string
  nameZh: string
  description: string
  previewColor: string
  previewBg: string
}

export const THEMES: ThemeInfo[] = [
  {
    id: "amber",
    name: "Amber",
    nameZh: "暖琥珀",
    description: "温暖明亮的琥珀色系，温馨亲切",
    previewColor: "#D97706",
    previewBg: "#FEF3C7",
  },
  {
    id: "ocean",
    name: "Ocean",
    nameZh: "海洋蓝",
    description: "冷静专业的蓝色系，沉稳可靠",
    previewColor: "#2563EB",
    previewBg: "#DBEAFE",
  },
  {
    id: "forest",
    name: "Forest",
    nameZh: "森林绿",
    description: "自然生长的绿色系，清新活力",
    previewColor: "#059669",
    previewBg: "#D1FAE5",
  },
  {
    id: "lavender",
    name: "Lavender",
    nameZh: "薰衣草",
    description: "优雅浪漫的紫色系，创意柔和",
    previewColor: "#9333EA",
    previewBg: "#F3E8FF",
  },
  {
    id: "midnight",
    name: "Midnight",
    nameZh: "午夜暗",
    description: "深色背景护眼模式，适合夜间使用",
    previewColor: "#F59E0B",
    previewBg: "#1F2937",
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

  // On mount, read saved theme from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null
      if (saved && THEMES.some((t) => t.id === saved)) {
        setThemeId(saved)
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

  // Prevent flash of wrong theme during SSR — still wrap with provider
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
