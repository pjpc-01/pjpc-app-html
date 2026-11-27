"use client"

import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { useTheme } from "@/contexts/theme-context"

/**
 * 主题选择器（设置页 + 我的账号页共用）
 *
 * 主题存在 localStorage，跟着浏览器走，不写数据库 —— 换主题是纯显示偏好，
 * 不想为它加字段、加迁移、加同步。
 */
export default function ThemePicker({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage()
  const { theme, setTheme, themes } = useTheme()

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {themes.map((meta) => {
          const active = theme === meta.id
          return (
            <button
              key={meta.id}
              type="button"
              onClick={() => setTheme(meta.id)}
              className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
                active
                  ? "border-primary ring-2 ring-primary/40 shadow-md"
                  : "border-border hover:border-primary/50 hover:shadow-sm"
              }`}
            >
              <div className="mb-2 flex h-12 overflow-hidden rounded-lg ring-1 ring-black/5">
                <div className="flex-1" style={{ background: meta.swatch.bg }} />
                <div className="w-8" style={{ background: meta.swatch.primary }} />
                <div className="w-5" style={{ background: meta.swatch.accent }} />
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <span aria-hidden>{meta.emoji}</span>
                <span>{t(meta.name)}</span>
                {active && (
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {t("使用中")}
                  </Badge>
                )}
              </div>
              {!compact && (
                <>
                  <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {meta.nameEn}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(meta.desc)}
                  </p>
                </>
              )}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("提示：三个主题都是浅底配色。深色底需要逐页改掉写死的白底，暂时不做。")}
      </p>
    </div>
  )
}
