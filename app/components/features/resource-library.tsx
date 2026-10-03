"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RowActions } from "@/components/ui/row-actions"
import { Search, Upload, Download, ExternalLink, Trash2, FileType, Link2, Loader2, FolderOpen } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useResources, ResourceItem } from "@/hooks/useResources"
import { gradeLabel, gradeCanon, gradeRank, GRADE_LABEL, GRADE_CANON_ALL } from "@/lib/grades"

// 学科（筛选 + 上传下拉）
const SUBJECTS = ["数学", "华文", "马来文", "英文", "科学", "历史", "地理", "道德教育", "美术", "音乐", "体育", "其他"]

// 资源类型（与 PB 集合 select values 一致）
const TYPES = ["试卷", "练习", "讲义", "教案", "参考", "多媒体", "其他"]

// 年级分组配色（与「课程管理」同一套）
const GRADE_COLORS: Record<string, string> = {
  'Peralihan': 'bg-cyan-100 text-cyan-700',
  'Standard 1': 'bg-red-100 text-red-700', 'Standard 2': 'bg-orange-100 text-orange-700',
  'Standard 3': 'bg-amber-100 text-amber-700', 'Standard 4': 'bg-yellow-100 text-yellow-700',
  'Standard 5': 'bg-lime-100 text-lime-700', 'Standard 6': 'bg-green-100 text-green-700',
  'Form 1': 'bg-blue-100 text-blue-700', 'Form 2': 'bg-indigo-100 text-indigo-700',
  'Form 3': 'bg-violet-100 text-violet-700', 'Form 4': 'bg-purple-100 text-purple-700',
  'Form 5': 'bg-pink-100 text-pink-700', 'Form 6': 'bg-fuchsia-100 text-fuchsia-700',
}
const getGradeColor = (g: string) => GRADE_COLORS[gradeCanon(g)] || 'bg-gray-100 text-gray-600'

// 类型分栏（练习题 / 模拟考卷 分开看 → 少两个下拉）
const TABS = [
  { key: "all", label: "全部" },
  { key: "练习", label: "练习" },
  { key: "试卷", label: "试卷" },
  { key: "其他", label: "其他" },
] as const
type TabKey = typeof TABS[number]["key"]

// 可预览的文件扩展名（html / pdf / 图片 → 新标签页打开）
const PREVIEWABLE = new Set(["html", "htm", "pdf", "png", "jpg", "jpeg", "gif", "svg", "webp"])

function extOf(name: string): string {
  const i = (name || "").lastIndexOf(".")
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ""
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "-"
  const units = ["B", "KB", "MB", "GB"]
  let n = bytes
  let u = 0
  while (n >= 1024 && u < units.length - 1) { n /= 1024; u++ }
  return `${n.toFixed(n >= 100 || u === 0 ? 0 : 1)}${units[u]}`
}

function formatDate(iso?: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  const p = (x: number) => String(x).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default function ResourceLibrary() {
  const { t } = useLanguage()
  const { userProfile } = useAuth()
  const isAdmin = userProfile?.role === 'admin'

  const [q, setQ] = useState("")
  const [subject, setSubject] = useState("all")
  const [tab, setTab] = useState<TabKey>("all")
  const [page, setPage] = useState(1)
  const PER_PAGE = 200   // 一次拿全，才能按年级分组

  const { items, totalItems, totalPages, page: curPage, loading, error, createResource, removeResource, incrementDownloads, refetch } =
    useResources({ page: 1, per_page: PER_PAGE })

  // 搜索/科目变化 → 拉取（年级、类型改为「分组 + 分栏」，不再走接口筛选）
  const doFetch = useCallback((p: number) => {
    refetch({ q, subject, page: p, per_page: PER_PAGE })
  }, [q, subject, refetch])

  // 筛选取值变化 → 防抖拉取。首次挂载由 useResources 自己拉一次，这里跳过以免重复请求
  const firstFilterRun = useRef(true)
  useEffect(() => {
    if (firstFilterRun.current) { firstFilterRun.current = false; return }
    const id = setTimeout(() => { setPage(1); doFetch(1) }, 350)
    return () => clearTimeout(id)
  }, [q, subject, doFetch])

  // 上传弹窗状态
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    title: "",
    subject: "",
    grade: "",
    type: "",
    tags: "",
    description: "",
    link: "",
  })
  const [file, setFile] = useState<File | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const isPreviewable = (r: ResourceItem) => {
    if (!r.link && !r.fileUrl) return false   // 既无链接也无文件 → 不可预览
    if (r.link) return true                   // 在线资源 → 打开链接
    return PREVIEWABLE.has(extOf(r.file || ""))
  }

  const triggerDownload = async (r: ResourceItem) => {
    try {
      // 有文件：下载并计数 +1；仅链接：只能打开链接（无本地文件可下）
      if (r.fileUrl) {
        const res = await fetch(r.fileUrl)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = `${r.title || "resource"}.${extOf(r.file || "bin")}` || "resource"
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
      }
      incrementDownloads(r.id).catch(() => {})
    } catch (e) {
      setMsg(t("下载失败，请重试"))
      console.error("下载失败", e)
    }
  }

  const openPreview = (r: ResourceItem) => {
    const url = r.link || r.fileUrl
    if (!url) return
    window.open(url, "_blank", "noopener,noreferrer")
    if (r.fileUrl) incrementDownloads(r.id).catch(() => {})
  }

  const handleDelete = async (r: ResourceItem) => {
    if (deletingId) return
    if (!window.confirm(t("确定要删除这份资源吗？"))) return
    setDeletingId(r.id)
    try {
      await removeResource(r.id)
      setMsg(t("资源已删除"))
    } catch (e) {
      setMsg(t("删除失败"))
      console.error("删除失败", e)
    } finally {
      setDeletingId(null)
    }
  }

  const resetForm = () => {
    setForm({ title: "", subject: "", grade: "", type: "", tags: "", description: "", link: "" })
    setFile(null)
    setMsg(null)
  }

  const handleUpload = async () => {
    if (!form.title.trim()) { setMsg(t("请填写资源标题")); return }
    if (!file && !form.link.trim()) { setMsg(t("请上传文件或填写在线链接")); return }
    setUploading(true)
    setMsg(null)
    try {
      await createResource({
        title: form.title.trim(),
        description: form.description.trim(),
        subject: form.subject,
        grade: form.grade,
        type: form.type,
        tags: form.tags.trim(),
        link: form.link.trim(),
        file,
        uploadedBy: userProfile?.id,
        uploaderName: userProfile?.name,
      })
      setOpen(false)
      resetForm()
      setMsg(t("上传成功"))
      setPage(1)
      doFetch(1)
    } catch (e: any) {
      setMsg(e?.message || t("上传失败"))
      console.error("上传失败", e)
    } finally {
      setUploading(false)
    }
  }

  const field = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  // 分栏过滤（练习 / 试卷 客户端切）+ 按年级分组
  const inTab = (r: ResourceItem, key: TabKey) => {
    if (key === "all") return true
    if (key === "其他") return !["练习", "试卷"].includes(r.type || "")
    return (r.type || "") === key
  }
  const tabCount = (key: TabKey) => items.filter((r) => inTab(r, key)).length
  const shown = items.filter((r) => inTab(r, tab))
  const grouped = shown.reduce<Record<string, ResourceItem[]>>((acc, r) => {
    const g = gradeCanon(r.grade) || (r.grade || "") || "未设置年级"
    ;(acc[g] ||= []).push(r)
    return acc
  }, {})
  const gradeKeys = Object.keys(grouped).sort((a, b) => gradeRank(a) - gradeRank(b))

  return (
    <div className="space-y-6">
      {/* 标题行（手机端给汉堡让位） */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pl-10 lg:pl-0">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-gray-900">{t("资源库系统")}</h2>
          <p className="text-sm text-gray-500">{t("教学资源共享、学习资料下载和多媒体内容管理")}</p>
        </div>
        <Button onClick={() => { resetForm(); setOpen(true) }} className="shrink-0">
          <Upload className="h-4 w-4 mr-2" />
          {t("上传资源")}
        </Button>
      </div>

      {msg && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</div>
      )}

      {/* 搜索 + 筛选 */}
      <Card>
        <CardContent className="pt-5">
          {/* 类型分栏：练习题 / 模拟考卷 分开看 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {TABS.map((x) => (
              <Button
                key={x.key}
                size="sm"
                variant={tab === x.key ? "default" : "outline"}
                onClick={() => setTab(x.key)}
              >
                {t(x.label)}
                <span className={tab === x.key ? "ml-1.5 opacity-80" : "ml-1.5 text-gray-400"}>{tabCount(x.key)}</span>
              </Button>
            ))}
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("搜索标题、说明或标签...")}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={subject} onValueChange={(v) => setSubject(v)}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder={t("全部科目")} /></SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  <SelectItem value="all">{t("全部科目")}</SelectItem>
                  {SUBJECTS.map(s => <SelectItem key={s} value={s}>{t(s)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 列表 */}
      {loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p className="text-sm">{t("加载中...")}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => doFetch(curPage)}>{t("重试")}</Button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FolderOpen className="h-12 w-12 mb-3" />
          <p className="text-sm">{t("暂无资源")}</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FolderOpen className="h-12 w-12 mb-3" />
          <p className="text-sm">{t("这个分类下暂无资源")}</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
          {gradeKeys.map((gk) => (
            <div key={gk}>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getGradeColor(gk) + " text-sm px-3 py-1"}>{GRADE_LABEL[gk] || gk}</Badge>
                <span className="text-xs text-gray-400">{grouped[gk].length} {t("份")}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {grouped[gk].map((r) => {
              const previewable = isPreviewable(r)
              return (
                <Card key={r.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-2">
                      <FileType className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                      <CardTitle className="text-base leading-snug">{r.title}</CardTitle>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {r.description || (r.tags ? r.tags : t("暂无说明"))}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {r.type && <Badge variant="outline">{t(r.type)}</Badge>}
                      {r.subject && <Badge variant="secondary">{t(r.subject)}</Badge>}
                    </div>
                    <div className="space-y-1.5 text-sm text-gray-600 flex-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t("大小")}</span>
                        <span>{r.file ? formatBytes(r.fileSize) : (r.link ? t("在线链接") : "-")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t("上传者")}</span>
                        <span>{r.uploaderName || r.uploadedBy || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t("下载次数")}</span>
                        <span>{r.downloads || 0}</span>
                      </div>
                      {r.created && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t("上传时间")}</span>
                          <span>{formatDate(r.created)}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <RowActions
                        primary={{
                          label: previewable ? t("预览") : (r.link ? t("打开") : t("下载")),
                          icon: previewable ? ExternalLink : Download,
                          onClick: () => previewable ? openPreview(r) : (r.link ? openPreview(r) : triggerDownload(r)),
                        }}
                        actions={[
                          r.fileUrl || r.link ? {
                            label: t("下载"),
                            icon: Download,
                            onClick: () => triggerDownload(r),
                          } : false,
                          isAdmin ? {
                            label: t("删除"),
                            icon: Trash2,
                            destructive: true,
                            onClick: () => handleDelete(r),
                            disabled: deletingId === r.id,
                          } : false,
                        ]}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
              </div>
            </div>
          ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={curPage <= 1} onClick={() => { setPage(curPage - 1); doFetch(curPage - 1) }}>
                {t("上一页")}
              </Button>
              <span className="text-sm text-gray-500">{t("第")} {curPage} / {totalPages} {t("页")}</span>
              <Button variant="outline" size="sm" disabled={curPage >= totalPages} onClick={() => { setPage(curPage + 1); doFetch(curPage + 1) }}>
                {t("下一页")}
              </Button>
            </div>
          )}
        </>
      )}

      {/* 上传弹窗 */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("上传资源")}</DialogTitle>
            <DialogDescription>{t("填写资源信息，上传文件或填写在线链接（二选一即可）")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("资源标题")} *</Label>
              <Input value={form.title} onChange={(e) => field("title", e.target.value)} placeholder={t("例如：三年级数学教案")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{t("科目")}</Label>
                <Select value={form.subject} onValueChange={(v) => field("subject", v)}>
                  <SelectTrigger><SelectValue placeholder={t("选择科目...")} /></SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {SUBJECTS.map(s => <SelectItem key={s} value={s}>{t(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("年级")}</Label>
                <Select value={form.grade} onValueChange={(v) => field("grade", v)}>
                  <SelectTrigger><SelectValue placeholder={t("选择年级...")} /></SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {GRADE_CANON_ALL.map(g => <SelectItem key={g} value={g}>{gradeLabel(g)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("类型")}</Label>
                <Select value={form.type} onValueChange={(v) => field("type", v)}>
                  <SelectTrigger><SelectValue placeholder={t("选择类型...")} /></SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {TYPES.map(x => <SelectItem key={x} value={x}>{t(x)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("标签")}</Label>
              <Input value={form.tags} onChange={(e) => field("tags", e.target.value)} placeholder={t("逗号分隔，如：分数,运算")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("说明")}</Label>
              <Input value={form.description} onChange={(e) => field("description", e.target.value)} placeholder={t("资源简介（可选）")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("上传文件")}</Label>
              <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.html,.htm,.png,.jpg,.jpeg,.gif,.svg,.mp4,.mp3,.txt,.zip"
                onChange={(e) => setFile(e.target.files?.[0] || null)} className="cursor-pointer" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("或在线链接")}</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={form.link} onChange={(e) => field("link", e.target.value)} placeholder="https://..." className="pl-9" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>{t("取消")}</Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? t("上传中...") : t("上传")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}