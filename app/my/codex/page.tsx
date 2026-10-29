"use client"

import { useEffect, useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { useLanguage } from "@/contexts/language-context"
import { CodexSheet, type CodexStudent } from "@/components/codex/CodexCard"

const P = "/api/pocketbase-proxy/api/collections/codex_students/records"

/** 我的学情：学生账号看自己的那一张图鉴卡（代理层强制只返回本人记录） */
export default function MyCodexPage() {
  const { t } = useLanguage()
  const [me, setMe] = useState<CodexStudent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch(`${P}?perPage=1`)
        if (!r.ok) return
        const d = await r.json()
        if (alive) setMe(((d.items || [])[0] || null) as CodexStudent | null)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  return (
    <PageLayout title={t("我的学情")} description={t("我在每一科的进度、目标和下一步")} backUrl="/my">
      <div className="p-3 md:p-5 max-w-4xl">
        <div className="codex-wrap">
          {loading ? (
            <div className="codex-lockmsg">{t("加载中...")}</div>
          ) : me ? (
            <CodexSheet s={me} inline />
          ) : (
            <div className="codex-lockmsg">
              {t("还没有你的学情卡 —— 等你交第一份卷子，或老师给你填目标。")}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
