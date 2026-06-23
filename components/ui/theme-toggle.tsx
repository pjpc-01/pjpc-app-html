"use client"

import { useTheme } from "next-themes"
import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 防止 hydration 不匹配
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const toggle = () => {
    if (theme === "dark") setTheme("light")
    else if (theme === "light") setTheme("system")
    else setTheme("dark")
  }

  const icon = theme === "dark"
    ? <Sun className="h-4 w-4" />
    : theme === "light"
    ? <Moon className="h-4 w-4" />
    : <Monitor className="h-4 w-4" />

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
      title={`当前: ${theme === 'dark' ? '暗色' : theme === 'light' ? '亮色' : '跟随系统'}`}
    >
      {icon}
    </Button>
  )
}
