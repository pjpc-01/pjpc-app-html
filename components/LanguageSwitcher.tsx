"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-0.5 bg-gray-100/50 rounded-lg p-0.5">
      <Button
        variant={language === "zh" ? "default" : "ghost"}
        size="sm"
        className="h-6 px-2 text-xs font-medium"
        onClick={() => setLanguage("zh")}
      >
        中文
      </Button>
      <Button
        variant={language === "en" ? "default" : "ghost"}
        size="sm"
        className="h-6 px-2 text-xs font-medium"
        onClick={() => setLanguage("en")}
      >
        EN
      </Button>
    </div>
  )
}
