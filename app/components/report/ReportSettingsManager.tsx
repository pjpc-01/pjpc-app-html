"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Building2, Save, Palette, FileText, Eye, Upload, Trash2, Settings,
  Plus, Copy, CheckCircle, Smartphone, Mail, ArrowUp, ArrowDown, GripVertical,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"

export interface ReportSection {
  id: string
  type: 'subjects' | 'growth' | 'problems' | 'improvements' | 'goals' | 'summary' | 'text'
  title: string
  enabled: boolean
  content?: string
}

export interface ReportSettingsPreset {
  id: string
  name: string
  schoolName: string
  schoolNameEn: string
  schoolLogo: string
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  primaryColor: string
  headerTitle: string
  headerSubtitle: string
  footerText: string
  defaultSubjects: string[]
  growthMessage: string
  problems: string[]
  improvements: string[]
  futureGoalAcademic: string
  futureGoalAbility: string
  futureGoalCharacter: string
  summary: string
  sections: ReportSection[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

const DEFAULT_SECTIONS: ReportSection[] = [
  { id: "growth", type: "growth", title: "成长寄语", enabled: true },
  { id: "academic", type: "subjects", title: "一、学业表现", enabled: true },
  { id: "problems", type: "problems", title: "二、存在问题", enabled: true },
  { id: "improvements", type: "improvements", title: "三、改进措施与建议", enabled: true },
  { id: "goals", type: "goals", title: "四、未来目标", enabled: true },
  { id: "summary", type: "summary", title: "五、总结", enabled: true },
]

const createDefaultPreset = (overrides?: Partial<ReportSettingsPreset>): ReportSettingsPreset => ({
  id: Date.now().toString(),
  name: "默认设置",
  schoolName: "",
  schoolNameEn: "",
  schoolLogo: "",
  schoolAddress: "",
  schoolPhone: "",
  schoolEmail: "",
  primaryColor: "#3b82f6",
  headerTitle: "学生报告",
  headerSubtitle: "— 全面发展 · 健康成长 · 追求卓越 —",
  footerText: "自信自强 | 勤学善思 | 合作共进 | 全面发展",
  defaultSubjects: ["华文","国文","英文","数学","科学","地理","历史","道德","美术","体育"],
  growthMessage: "成长不在于做得最好，而在于愿意不断尝试、不断进步。{studentName}，继续加油！",
  problems: ["在理科学习中，解题思路不够灵活，需加强思维训练。","有时会因拖延导致作业完成质量不高。","阅读量不足，知识面有待拓宽。"],
  improvements: ["制定学习计划，提高学习效率，减少拖延。","多做练习题，总结解题方法和技巧。","每天阅读，拓宽知识面，做好读书笔记。","遇到问题及时请教老师或同学，加强理解与应用。"],
  futureGoalAcademic: "提高各科成绩，争取进入班级前列。",
  futureGoalAbility: "积极参与更多课外活动，提升自己的组织和沟通能力。",
  futureGoalCharacter: "培养良好的学习和生活习惯，做一个全面发展的学生。",
  summary: "本学期，我在学习和生活中都取得了一定的进步，但也认识到自己的不足。在未来的日子里，我将以更高的标准要求自己，不断超越自我，实现自己的目标，成为更好的自己！",
  sections: DEFAULT_SECTIONS,
  isDefault: true,
  createdAt: new Date().toISOString().split('T')[0],
  updatedAt: new Date().toISOString().split('T')[0],
  ...overrides
})

// ─── Sample student data for realistic preview ───
const SAMPLE_STUDENT = {
  name: "张明",
  studentId: "M001",
  grade: "四年级",
  dob: "2016-03-18",
  age: 10,
  reportDate: "2026-06-15",
}

const SAMPLE_SUBJECTS = [
  { name: "华文", midterm: 85, final: 90 },
  { name: "国文", midterm: 88, final: 85 },
  { name: "英文", midterm: 92, final: 95 },
  { name: "数学", midterm: 78, final: 82 },
  { name: "科学", midterm: 90, final: 93 },
  { name: "地理", midterm: 76, final: 80 },
  { name: "历史", midterm: 82, final: 86 },
]

const scoreToEval = (score: number): string => {
  if (score >= 90) return "优秀"
  if (score >= 80) return "良好"
  if (score >= 60) return "及格"
  return "待加强"
}

const SAMPLE_ACTIVITIES = [
  "参加学校书法比赛获得二等奖",
  "英语朗诵比赛荣获年级组第三名",
  "担任班级卫生委员，积极组织值日工作",
]

const SAMPLE_PROBLEMS = [
  "在理科学习中，解题思路不够灵活，需加强思维训练。",
  "有时会因拖延导致作业完成质量不高。",
  "阅读量不足，知识面有待拓宽。",
]

const SAMPLE_IMPROVEMENTS = [
  "制定学习计划，提高学习效率，减少拖延。",
  "多做练习题，总结解题方法和技巧。",
  "每天阅读，拓宽知识面，做好读书笔记。",
]

// ─── Render helpers for report preview ───

const renderPreviewGrowth = (section: ReportSection, growthMsg: string, color: string): string => `
  <div class="growth-box">
    ❝ ${growthMsg} ❞
  </div>`

const renderPreviewSubjects = (section: ReportSection, rows: string, overallAvg: number, color: string): string => `
  <div class="section-label" style="background:${color}">📚 ${section.title}</div>
  const { t } = useLanguage()
  <p style="font-size:13px;color:#6b7280;margin-bottom:8px;">
    在本学期中，该生在各个学科的学习中总体表现良好，能够按时完成作业，积极参与课堂讨论，成绩稳中有进。
  </p>
  <table>
    <tr><th>{t('report.subject')}</th><th>期中</th><th>期末</th><th>评价</th></tr>
    ${rows}
  </table>
  <div class="stat-row">
    <div class="stat"><div class="num">${overallAvg}</div><div class="label">{t('report.average_score')}</div></div>
    <div class="stat"><div class="num">8</div><div class="label">班级排名</div></div>
    <div class="stat"><div class="num">↑2</div><div class="label">进步幅度</div></div>
  </div>
  <div style="margin-top:12px;font-size:12px;color:#6b7280;background:#f8fafc;padding:10px 14px;border-radius:8px;">
    本学期整体成绩良好，英文和科学科目表现优秀，学习态度认真。建议继续保持良好的学习习惯，进一步加强数学的理解与应用能力。
  </div>`

const renderPreviewProblems = (section: ReportSection, problemsHTML: string, color: string): string => `
  <div class="section-label orange">⚠ ${section.title}</div>
  <ul>${problemsHTML}</ul>`

const renderPreviewImprovements = (section: ReportSection, improvementsHTML: string, color: string): string => `
  <div class="section-label green">✓ ${section.title}</div>
  <ul>${improvementsHTML}</ul>`

const renderPreviewGoals = (section: ReportSection, goalAcademic: string, goalAbility: string, goalCharacter: string, color: string): string => `
  <div class="section-label" style="background:${color}">🏁 ${section.title}</div>
  <p style="font-size:13px;color:#6b7280;margin-bottom:12px;">
    在今后的学习和生活中，该生将继续努力，争取在各方面取得更大的进步。
  </p>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
    <div class="goal-box">
      <h4>📖 学业提升</h4>
      <p>${goalAcademic}</p>
    </div>
    <div class="goal-box">
      <h4>🌟 综合能力</h4>
      <p>${goalAbility}</p>
    </div>
    <div class="goal-box">
      <h4>💖 品格发展</h4>
      <p>${goalCharacter}</p>
    </div>
  </div>`

const renderPreviewSummary = (section: ReportSection, summaryText: string, color: string): string => `
  <div class="section-label purple">📝 ${section.title}</div>
  <div class="summary-box">
    ${summaryText}
  </div>`

const renderPreviewText = (section: ReportSection, color: string): string => {
  const content = section.content || ''
  // Show content as markdown-like text
  const lines = content.split('\n').filter(l => l.trim())
  if (lines.length === 0) {
    return `<div class="section-label" style="background:${color}">📄 ${section.title}</div>
            <p style="font-size:13px;color:#9ca3af;">暂无内容</p>`
  }
  const body = lines.map(l => `<p style="font-size:13px;color:#4b5563;line-height:1.6;margin-bottom:4px;">${l}</p>`).join('')
  return `<div class="section-label" style="background:${color}">📄 ${section.title}</div>${body}`
}

// ─── Realistic report preview HTML ───
export const generateReportPreviewHTML = (settings: ReportSettingsPreset): string => {
  const color = settings.primaryColor || "#3b82f6"
  const sections = (settings.sections && settings.sections.length > 0) ? settings.sections : DEFAULT_SECTIONS

  // Compute sample data used by multiple section types
  const subjects = settings.defaultSubjects?.length > 0 ? settings.defaultSubjects : SAMPLE_SUBJECTS.map(s => s.name)
  const sampleScores = subjects.map((name, i) => ({
    name,
    midterm: SAMPLE_SUBJECTS[i]?.midterm ?? Math.round(65 + Math.random() * 30),
    final: SAMPLE_SUBJECTS[i]?.final ?? Math.round(65 + Math.random() * 30),
  }))

  const midtermScores = sampleScores.map(s => s.midterm)
  const finalScores = sampleScores.map(s => s.final)
  const midtermAvg = Math.round(midtermScores.reduce((a, b) => a + b, 0) / midtermScores.length * 10) / 10
  const finalAvg = Math.round(finalScores.reduce((a, b) => a + b, 0) / finalScores.length * 10) / 10
  const overallAvg = Math.round((midtermAvg + finalAvg) / 2 * 10) / 10

  const rows = sampleScores.map(subj => {
    const midtermEval = scoreToEval(subj.midterm)
    const finalEval = scoreToEval(subj.final)
    return `
      <tr>
        <td style="font-weight:600;color:#374151;">${subj.name}</td>
        <td style="text-align:center;">${subj.midterm}</td>
        <td style="text-align:center;">${subj.final}</td>
        <td style="text-align:center;"><span class="eval-badge eval-${finalEval}">${finalEval}</span></td>
      </tr>`
  }).join('')

  const growthMsg = settings.growthMessage
    ? settings.growthMessage.replace('{studentName}', SAMPLE_STUDENT.name)
    : `成长不在于做得最好，而在于愿意不断尝试、不断进步。${SAMPLE_STUDENT.name}，继续保持！`

  const problemsList = settings.problems?.length > 0 ? settings.problems : SAMPLE_PROBLEMS
  const problemsHTML = problemsList.map(p =>
    `<li style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#4b5563;margin-bottom:4px;">
      <span style="color:#f97316;flex-shrink:0;">⚠</span>${p}
    </li>`
  ).join('')

  const improvementsList = settings.improvements?.length > 0 ? settings.improvements : SAMPLE_IMPROVEMENTS
  const improvementsHTML = improvementsList.map(imp =>
    `<li style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#4b5563;margin-bottom:4px;">
      <span style="color:#22c55e;flex-shrink:0;">✓</span>${imp}
    </li>`
  ).join('')

  const goalAcademic = settings.futureGoalAcademic || "提高各科成绩，争取进入班级前列。"
  const goalAbility = settings.futureGoalAbility || "积极参与更多课外活动，提升自己的组织和沟通能力。"
  const goalCharacter = settings.futureGoalCharacter || "培养良好的学习和生活习惯，做一个全面发展的学生。"
  const summaryText = settings.summary || "本学期，我在学习和生活中都取得了一定的进步，但也认识到自己的不足。"

  const logoBlock = settings.schoolLogo
    ? `<div style="width:56px;height:56px;margin:0 auto 8px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
        <img src="${settings.schoolLogo}" alt="logo" style="width:100%;height:100%;object-fit:contain;" />
      </div>`
    : ''

  // Build sections HTML dynamically from sections config
  // NOTE: growth/subjects/comprehensive are rendered inline above, NOT in this loop
  const sectionsHTML = sections
    .filter(s => s.enabled)
    .map(section => {
      switch(section.type) {
        case 'subjects':
          return `<div class="card">${renderPreviewSubjects(section, rows, overallAvg, color)}</div>`
        case 'problems':
          return `<div class="card">${renderPreviewProblems(section, problemsHTML, color)}</div>`
        case 'improvements':
          return `<div class="card">${renderPreviewImprovements(section, improvementsHTML, color)}</div>`
        case 'goals':
          return `<div class="card">${renderPreviewGoals(section, goalAcademic, goalAbility, goalCharacter, color)}</div>`
        case 'summary':
          return `<div class="card">${renderPreviewSummary(section, summaryText, color)}</div>`
        case 'text':
          return `<div class="card">${renderPreviewText(section, color)}</div>`
        default:
          return ''
      }
    }).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>学生报告预览</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Microsoft YaHei','PingFang SC','Noto Sans SC',Arial,sans-serif;
    color:#374151; padding:16px; background:#f1f5f9;
  }
  .report { max-width:750px; margin:0 auto; }
  .card {
    background:#fff; border-radius:12px; padding:20px 24px; margin-bottom:16px;
    box-shadow:0 1px 3px rgba(0,0,0,0.06);
  }
  .header {
    background:linear-gradient(135deg,${color},${color}dd); color:#fff;
    padding:24px 24px; text-align:center; border-radius:12px; margin-bottom:16px;
  }
  .header h1 { font-size:24px; font-weight:700; }
  .header .school-name { font-size:14px; font-weight:600; opacity:0.9; margin-top:4px; }
  .header .subtitle { font-size:12px; opacity:0.75; margin-top:2px; }
  .section-label {
    background:${color}; color:#fff; padding:6px 14px; border-radius:8px;
    font-size:13px; font-weight:600; display:inline-flex; align-items:center; gap:6px; margin-bottom:12px;
  }
  .section-label.orange { background:#f97316; }
  .section-label.green { background:#22c55e; }
  .section-label.purple { background:#8b5cf6; }
  table { width:100%; border-collapse:collapse; margin:12px 0; }
  th {
    background:${color}15; color:${color};
    font-size:11px; text-transform:uppercase; padding:9px 12px; text-align:left;
    border-bottom:2px solid ${color}30;
  }
  th:first-child { border-radius:8px 0 0 0; }
  th:last-child { border-radius:0 8px 0 0; }
  td { padding:10px 12px; border-bottom:1px solid #f3f4f6; font-size:13px; }
  tr:last-child td { border-bottom:none; }
  .eval-badge {
    display:inline-block; padding:2px 10px; border-radius:10px; font-size:11px; font-weight:600;
  }
  .eval-优秀 { background:#d1fae5; color:#065f46; }
  .eval-良好 { background:#dbeafe; color:#1e40af; }
  .eval-及格 { background:#fef3c7; color:#92400e; }
  .eval-待加强 { background:#fee2e2; color:#991b1b; }
  .stat-row { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:12px; }
  .stat {
    background:${color}; color:#fff; border-radius:10px; padding:14px; text-align:center;
  }
  .stat .num { font-size:24px; font-weight:700; }
  .stat .label { font-size:10px; opacity:0.8; margin-top:2px; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  ul { list-style:none; padding:0; }
  .goal-box {
    background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:14px;
  }
  .goal-box h4 { font-size:12px; font-weight:600; color:#1e40af; margin-bottom:6px; }
  .goal-box p { font-size:12px; color:#4b5563; line-height:1.5; }
  .footer {
    background:#374151; color:#fff; text-align:center; padding:12px;
    border-radius:12px; font-size:12px; font-weight:500;
  }
  .growth-box {
    background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px;
    padding:14px 16px; margin-top:12px; font-size:13px; color:#4b5563; line-height:1.6;
  }
  .summary-box {
    background:#faf5ff; border:1px solid #e9d5ff; border-radius:10px;
    padding:14px 16px; font-size:13px; color:#4b5563; line-height:1.8;
  }
  .student-info { display:flex; gap:16px; align-items:center; margin-bottom:4px; }
  .student-avatar {
    width:64px; height:64px; background:#e5e7eb; border-radius:10px;
    display:flex; align-items:center; justify-content:center;
    font-size:28px; color:#9ca3af; flex-shrink:0;
  }
  .info-grid { font-size:13px; line-height:1.9; color:#4b5563; }
  .info-grid b { color:#1f2937; }
  @media print { body{background:#fff;padding:0;} .card{box-shadow:none;} .header{border-radius:0;} }
</style></head>
<body>
<div class="report">
  <div class="header">
    ${logoBlock}
    <h1>${settings.headerTitle || '学生报告'}</h1>
    ${settings.schoolName ? `<p class="school-name">${settings.schoolName}</p>` : ''}
    <p class="subtitle">${settings.headerSubtitle || '— 全面发展 · 健康成长 · 追求卓越 —'}</p>
  </div>

  <!-- Student Info -->
  <div class="card">
    <div class="student-info">
      <div class="student-avatar">👤</div>
      <div class="info-grid">
        <b>${SAMPLE_STUDENT.name}</b><br/>
        编号: ${SAMPLE_STUDENT.studentId} · 年级: ${SAMPLE_STUDENT.grade}<br/>
        出生: ${SAMPLE_STUDENT.dob} · 年龄: ${SAMPLE_STUDENT.age}岁<br/>
        报告日期: ${SAMPLE_STUDENT.reportDate}
      </div>
    </div>
    ${sections.find(s => s.type === 'growth')?.enabled ? renderPreviewGrowth(sections.find(s => s.type === 'growth')!, growthMsg, color) : ''}
  </div>

  ${sectionsHTML}

  <!-- Footer -->
  ${settings.schoolAddress || settings.schoolPhone ? `
  <div style="background:#f9fafb;border-radius:10px;padding:10px 16px;font-size:11px;color:#6b7280;text-align:center;margin-bottom:12px;">
    ${settings.schoolAddress || ''} ${settings.schoolAddress && settings.schoolPhone ? '·' : ''} ${settings.schoolPhone || ''}
  </div>` : ''}
  <div class="footer">${settings.footerText || ''}</div>
</div>
</body></html>`
}

interface ReportSettingsManagerProps {
  onSettingsChange?: (settings: ReportSettingsPreset) => void
  activePresetId?: string
}

export default function ReportSettingsManager({ onSettingsChange, activePresetId }: ReportSettingsManagerProps) {
  const { t } = useLanguage()
  const [presets, setPresets] = useState<ReportSettingsPreset[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const [settings, setSettings] = useState<ReportSettingsPreset>(createDefaultPreset())
  const [activeTab, setActiveTab] = useState("school")
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewHTML, setPreviewHTML] = useState("")
  const [fullscreenPreviewHTML, setFullscreenPreviewHTML] = useState("")
  const logoSpanRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)

  // Compute preview HTML only on client side to avoid SSR/CSR mismatch from Math.random()
  useEffect(() => {
    setPreviewHTML(generateReportPreviewHTML(settings))
    setFullscreenPreviewHTML(generateReportPreviewHTML(settings))
  }, [settings])

  // Load from PB on mount
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/pocketbase-proxy/api/collections/report_settings/records?perPage=50&sort=-created')
        if (!res.ok) return
        const data = await res.json()
        const items = (data.items || []).map((r: any) => ({
          id: r.id, name: r.name || '默认设置',
          schoolName: r.schoolName || '', schoolNameEn: r.schoolNameEn || '',
          schoolLogo: r.schoolLogo || '', schoolAddress: r.schoolAddress || '',
          schoolPhone: r.schoolPhone || '', schoolEmail: r.schoolEmail || '',
          primaryColor: r.primaryColor || '#3b82f6',
          headerTitle: r.headerTitle || '学生报告',
          headerSubtitle: r.headerSubtitle || '— 全面发展 · 健康成长 · 追求卓越 —',
          footerText: r.footerText || '自信自强 | 勤学善思 | 合作共进 | 全面发展',
          defaultSubjects: r.defaultSubjects || ["华文","国文","英文","数学","科学","地理","历史","道德","美术","体育"],
          growthMessage: r.growthMessage || "成长不在于做得最好，而在于愿意不断尝试、不断进步。{studentName}，继续加油！",
          problems: r.problems || ["在理科学习中，解题思路不够灵活，需加强思维训练。","有时会因拖延导致作业完成质量不高。","阅读量不足，知识面有待拓宽。"],
          improvements: r.improvements || ["制定学习计划，提高学习效率，减少拖延。","多做练习题，总结解题方法和技巧。","每天阅读，拓宽知识面，做好读书笔记。","遇到问题及时请教老师或同学，加强理解与应用。"],
          futureGoalAcademic: r.futureGoalAcademic || "提高各科成绩，争取进入班级前列。",
          futureGoalAbility: r.futureGoalAbility || "积极参与更多课外活动，提升自己的组织和沟通能力。",
          futureGoalCharacter: r.futureGoalCharacter || "培养良好的学习和生活习惯，做一个全面发展的学生。",
          summary: r.summary || "本学期，我在学习和生活中都取得了一定的进步，但也认识到自己的不足。在未来的日子里，我将以更高的标准要求自己，不断超越自我，实现自己的目标，成为更好的自己！",
          sections: r.sections || DEFAULT_SECTIONS,
          isDefault: r.isDefault || false, createdAt: r.created || '', updatedAt: r.updated || '',
        } as ReportSettingsPreset))
          // Filter old presets that don't have sections
          items.forEach((r: any) => { if (!r.sections) r.sections = DEFAULT_SECTIONS })
          if (cancelled) return
        if (items.length > 0) {
          setPresets(items)
          const defId = activePresetId || items.find(p => p.isDefault)?.id || items[0].id
          setActiveId(defId)
          const active = items.find(p => p.id === defId)
          if (active) { setSettings(active); onSettingsChange?.(active) }
        } else {
          const d = createDefaultPreset()
          setPresets([d]); setActiveId(d.id); setSettings(d)
        }
      } catch (e) { console.error('Failed to load report settings:', e) }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const savePreset = async (preset: ReportSettingsPreset, isNew = false) => {
    const { id, createdAt, updatedAt, ...data } = preset as any
    const url = isNew
      ? '/api/pocketbase-proxy/api/collections/report_settings/records'
      : `/api/pocketbase-proxy/api/collections/report_settings/records/${id}`
    const method = isNew ? 'POST' : 'PATCH'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) throw new Error('Save failed')
    return await res.json()
  }

  const deletePreset = async (presetId: string) => {
    await fetch(`/api/pocketbase-proxy/api/collections/report_settings/records/${presetId}`, { method: 'DELETE' })
  }

  const updateSettings = async (updates: Partial<ReportSettingsPreset>) => {
    const ns = { ...settings, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
    setSettings(ns)
    setPresets(prev => prev.map(p => p.id === activeId ? ns : p))
    try { await savePreset(ns) } catch (e) { console.error('Save failed:', e) }
    onSettingsChange?.(ns)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => updateSettings({ schoolLogo: ev.target?.result as string })
    reader.readAsDataURL(file)
  }

  const handleSelectPreset = (id: string) => {
    const p = presets.find(p => p.id === id)
    if (p) { setActiveId(p.id); setSettings(p); onSettingsChange?.(p) }
  }

  const handleSaveAsNew = async () => {
    const name = prompt("预设名称：")
    if (!name) return
    const np = createDefaultPreset({ ...settings, id: Date.now().toString(), name, isDefault: false })
    try {
      const saved = await savePreset(np, true)
      setPresets(prev => [...prev, { ...np, id: saved.id }])
      setActiveId(saved.id); setSettings({ ...np, id: saved.id })
    } catch (e) { console.error(e) }
  }

  const handleDuplicate = async () => {
    const dup = createDefaultPreset({ ...settings, id: Date.now().toString(), name: settings.name + " (副本)", isDefault: false })
    try {
      const saved = await savePreset(dup, true)
      setPresets(prev => [...prev, { ...dup, id: saved.id }])
      setActiveId(saved.id)
      setSettings({ ...dup, id: saved.id })
    } catch (e) { console.error(e) }
  }

  const handleDeletePreset = async () => {
    if (presets.length <= 1) { alert("至少需要保留一个预设"); return }
    try {
      await deletePreset(activeId)
      const updated = presets.filter(p => p.id !== activeId)
      setPresets(updated)
      setActiveId(updated[0].id); setSettings(updated[0])
    } catch (e) { console.error(e) }
  }

  const handleSetDefault = async () => {
    const updated = presets.map(p => ({ ...p, isDefault: p.id === activeId }))
    setPresets(updated)
    for (const p of updated) {
      if (p.isDefault !== presets.find(op => op.id === p.id)?.isDefault) {
        try { await savePreset(p) } catch {}
      }
    }
  }

  const handlePrintPreview = () => {
    const iframe = previewRef.current
    if (iframe) { iframe.contentWindow?.print() }
  }

  const activePreset = presets.find(p => p.id === activeId)

  return (
    <div className="space-y-6">
      {/* Preset Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-3">
          <Label className="whitespace-nowrap font-medium text-sm">预设方案:</Label>
          <Select value={activeId} onValueChange={handleSelectPreset}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="选择预设" />
            </SelectTrigger>
            <SelectContent>
              {presets.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} {p.isDefault ? '⭐' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleSaveAsNew}>
            <Plus className="h-4 w-4 mr-1" />另存为新预设
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-1" />复制
          </Button>
          <Button variant="outline" size="sm" onClick={handleSetDefault}>
            <CheckCircle className="h-4 w-4 mr-1" />设为默认
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeletePreset}>
            <Trash2 className="h-4 w-4 mr-1" />删除
          </Button>
        </div>
      </div>

      {/* Main Content: Form + Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Settings Form */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="school"><Building2 className="h-4 w-4 mr-1" />{t('report.school_info')}</TabsTrigger>
              <TabsTrigger value="style"><Palette className="h-4 w-4 mr-1" />样式 & 内容</TabsTrigger>
              <TabsTrigger value="content"><FileText className="h-4 w-4 mr-1" />内容模板</TabsTrigger>
            </TabsList>

            {/* Tab: School Info */}
            <TabsContent value="school" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('report.basic_info')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>学校名称 (中文)</Label>
                      <Input value={settings.schoolName} onChange={e => updateSettings({ schoolName: e.target.value })} placeholder="智慧教育学校" />
                    </div>
                    <div>
                      <Label>学校名称 (英文)</Label>
                      <Input value={settings.schoolNameEn} onChange={e => updateSettings({ schoolNameEn: e.target.value })} placeholder="Smart Education School" />
                    </div>
                  </div>
                  <div>
                    <Label>学校地址</Label>
                    <Textarea value={settings.schoolAddress} onChange={e => updateSettings({ schoolAddress: e.target.value })} rows={2} placeholder="详细地址" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label><Smartphone className="h-3.5 w-3.5 inline mr-1" />{t('report.phone')}</Label>
                      <Input value={settings.schoolPhone} onChange={e => updateSettings({ schoolPhone: e.target.value })} placeholder="010-12345678" />
                    </div>
                    <div>
                      <Label><Mail className="h-3.5 w-3.5 inline mr-1" />{t('report.email')}</Label>
                      <Input value={settings.schoolEmail} onChange={e => updateSettings({ schoolEmail: e.target.value })} placeholder="info@school.com" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">学校标志 (Logo)</Label>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-muted bg-muted/20 flex items-center justify-center overflow-hidden flex-shrink-0 group relative cursor-pointer hover:border-primary/40 transition-colors"
                        onClick={() => logoSpanRef.current?.click()}>
                        {settings.schoolLogo ? (
                          <>
                            <img src={settings.schoolLogo} alt="logo" className="w-full h-full object-contain p-1" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="h-5 w-5 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Building2 className="h-8 w-8" />
                            <span className="text-[10px] mt-1">{t('report.click_to_upload')}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <input ref={logoSpanRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        <Button variant="outline" size="sm" onClick={() => logoSpanRef.current?.click()}>
                          <Upload className="h-4 w-4 mr-1" />上传Logo
                        </Button>
                        <p className="text-xs text-muted-foreground">建议正方形，PNG/SVG</p>
                        {settings.schoolLogo && (
                          <Button variant="ghost" size="sm" onClick={() => updateSettings({ schoolLogo: '' })} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5 mr-1" />移除Logo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Style & Content */}
            <TabsContent value="style" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">颜色方案</CardTitle>
                  <CardDescription>自定义学生报告的主题颜色</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Label className="text-xs">主色</Label>
                    <input type="color" value={settings.primaryColor} onChange={e => updateSettings({ primaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer border" />
                    <Input className="h-8 text-sm w-28 font-mono" value={settings.primaryColor} onChange={e => updateSettings({ primaryColor: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-lg border bg-gray-50">
                    <div className="text-sm text-gray-600">预览效果：</div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded" style={{ backgroundColor: settings.primaryColor }} title="主色" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">报告内容</CardTitle>
                  <CardDescription>自定义报告标题、副标题和页脚</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>{t('report.title')}</Label>
                    <Input value={settings.headerTitle} onChange={e => updateSettings({ headerTitle: e.target.value })} placeholder="学生报告" />
                  </div>
                  <div>
                    <Label>副标题</Label>
                    <Input value={settings.headerSubtitle} onChange={e => updateSettings({ headerSubtitle: e.target.value })} placeholder="— 全面发展 · 健康成长 · 追求卓越 —" />
                  </div>
                  <div>
                    <Label>页脚文字</Label>
                    <Textarea value={settings.footerText} onChange={e => updateSettings({ footerText: e.target.value })} rows={2} placeholder="自信自强 | 勤学善思 | 合作共进 | 全面发展" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Content Templates */}
            <TabsContent value="content" className="space-y-4 mt-4">
              {/* ── Section Manager ── */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">板块管理</CardTitle>
                    <CardDescription>自定义报告板块的顺序、标题和可见性</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    const newSection: ReportSection = {
                      id: `custom-${Date.now()}`,
                      type: 'text',
                      title: '自定义板块',
                      enabled: true,
                      content: '',
                    }
                    updateSettings({ sections: [...(settings.sections || []), newSection] })
                  }}>
                    <Plus className="h-3.5 w-3.5 mr-1" />添加自定义板块
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(settings.sections || []).map((section, i) => (
                    <div key={section.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          disabled={i === 0}
                          onClick={() => {
                            const arr = [...(settings.sections || [])]
                            if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]] }
                            updateSettings({ sections: arr })
                          }}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
                        ><ArrowUp className="h-3 w-3" /></button>
                        <button
                          disabled={i === (settings.sections || []).length - 1}
                          onClick={() => {
                            const arr = [...(settings.sections || [])]
                            if (i < arr.length - 1) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]] }
                            updateSettings({ sections: arr })
                          }}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
                        ><ArrowDown className="h-3 w-3" /></button>
                      </div>
                      {/* Title input */}
                      <Input
                        value={section.title}
                        onChange={e => {
                          const arr = [...(settings.sections || [])]
                          arr[i] = { ...arr[i], title: e.target.value }
                          updateSettings({ sections: arr })
                        }}
                        className="h-8 text-sm flex-1 min-w-0"
                        placeholder="板块标题"
                      />
                      {/* Type badge */}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 whitespace-nowrap capitalize">
                        {section.type === 'subjects' ? '学业' :
                         section.type === 'growth' ? '寄语' :
                         section.type === 'problems' ? '问题' :
                         section.type === 'improvements' ? '建议' :
                         section.type === 'goals' ? '目标' :
                         section.type === 'summary' ? '总结' : '自定义'}
                      </span>
                      {/* Content editor for 'text' type sections */}
                      {section.type === 'text' && (
                        <input
                          className="h-8 text-sm px-2 border rounded min-w-[80px] max-w-[120px]"
                          placeholder="内容..."
                          value={section.content || ''}
                          onChange={e => {
                            const arr = [...(settings.sections || [])]
                            arr[i] = { ...arr[i], content: e.target.value }
                            updateSettings({ sections: arr })
                          }}
                        />
                      )}
                      {/* Enable/disable toggle */}
                      <Switch
                        checked={section.enabled}
                        onCheckedChange={checked => {
                          const arr = [...(settings.sections || [])]
                          arr[i] = { ...arr[i], enabled: checked }
                          updateSettings({ sections: arr })
                        }}
                      />
                      {/* Delete button (only for custom 'text' sections) */}
                      {section.type === 'text' && (
                        <button
                          onClick={() => {
                            const arr = (settings.sections || []).filter(s => s.id !== section.id)
                            updateSettings({ sections: arr })
                          }}
                          className="text-red-400 hover:text-red-600"
                        >×</button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">默认科目</CardTitle>
                  <CardDescription>设置新建报告时的默认科目列表</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(settings.defaultSubjects || []).map((subj, i) => (
                      <div key={i} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm">
                        <span>{subj}</span>
                        <button
                          onClick={() => {
                            const updated = (settings.defaultSubjects || []).filter((_, idx) => idx !== i)
                            updateSettings({ defaultSubjects: updated })
                          }}
                          className="text-gray-400 hover:text-red-500 ml-1"
                        >×</button>
                      </div>
                    ))}
                    <input
                      className="px-3 py-1.5 border rounded-full text-sm outline-none focus:border-blue-400 min-w-[80px]"
                      placeholder="添加科目..."
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim()
                          if (val && !(settings.defaultSubjects || []).includes(val)) {
                            updateSettings({ defaultSubjects: [...(settings.defaultSubjects || []), val] })
                          }
                          (e.target as HTMLInputElement).value = ''
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">成长寄语模板</CardTitle>
                  <CardDescription>使用 {'{studentName}'} 作为学生姓名占位符</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea value={settings.growthMessage || ""} onChange={e => updateSettings({ growthMessage: e.target.value })} rows={3} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">存在问题模板</CardTitle>
                  <CardDescription>每个问题占一行，可添加多个</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(settings.problems || []).map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <Textarea value={p} onChange={e => {
                        const arr = [...(settings.problems || [])]
                        arr[i] = e.target.value
                        updateSettings({ problems: arr })
                      }} rows={1} className="flex-1" />
                      <Button variant="ghost" size="sm" className="text-red-400 h-auto" onClick={() => {
                        const arr = (settings.problems || []).filter((_, idx) => idx !== i)
                        updateSettings({ problems: arr })
                      }}>×</Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => updateSettings({ problems: [...(settings.problems || []), ""] })}>
                    <Plus className="h-3.5 w-3.5 mr-1" />添加问题
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">改进建议模板</CardTitle>
                  <CardDescription>每条建议占一行，可添加多个</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(settings.improvements || []).map((imp, i) => (
                    <div key={i} className="flex gap-2">
                      <Textarea value={imp} onChange={e => {
                        const arr = [...(settings.improvements || [])]
                        arr[i] = e.target.value
                        updateSettings({ improvements: arr })
                      }} rows={1} className="flex-1" />
                      <Button variant="ghost" size="sm" className="text-red-400 h-auto" onClick={() => {
                        const arr = (settings.improvements || []).filter((_, idx) => idx !== i)
                        updateSettings({ improvements: arr })
                      }}>×</Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => updateSettings({ improvements: [...(settings.improvements || []), ""] })}>
                    <Plus className="h-3.5 w-3.5 mr-1" />添加建议
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">未来目标模板</CardTitle>
                  <CardDescription>学业、能力、品格三个维度的目标</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">学业目标</Label>
                    <Textarea value={settings.futureGoalAcademic || ""} onChange={e => updateSettings({ futureGoalAcademic: e.target.value })} rows={2} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">能力目标</Label>
                    <Textarea value={settings.futureGoalAbility || ""} onChange={e => updateSettings({ futureGoalAbility: e.target.value })} rows={2} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">品格目标</Label>
                    <Textarea value={settings.futureGoalCharacter || ""} onChange={e => updateSettings({ futureGoalCharacter: e.target.value })} rows={2} className="mt-1" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">总结模板</CardTitle>
                  <CardDescription>学期总结的默认内容</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea value={settings.summary || ""} onChange={e => updateSettings({ summary: e.target.value })} rows={4} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4" />
              报告预览
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrintPreview}>
                <FileText className="h-4 w-4 mr-1" />打印预览
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsPreviewDialogOpen(true)}>
                <Eye className="h-4 w-4 mr-1" />全屏预览
              </Button>
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm" style={{ minHeight: 500 }}>
            {previewHTML ? (
              <iframe
                ref={previewRef}
                srcDoc={previewHTML}
                className="w-full border-0"
                style={{ minHeight: 500, height: 'calc(100vh - 400px)' }}
                title="报告预览"
              />
            ) : (
              <div className="p-8 text-center text-gray-400">加载预览中...</div>
            )}
          </div>
        </div>
      </div>

      {/* Save Status */}
      <div className="flex items-center justify-end text-xs text-gray-500 border-t pt-3">
        <Save className="h-3.5 w-3.5 mr-1" />
        自动保存 · 最后更新: {settings.updatedAt}
        {activePreset?.isDefault && <Badge variant="outline" className="ml-2 text-xs">默认预设</Badge>}
      </div>

      {/* Fullscreen Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle>报告预览 - {settings.name}</DialogTitle>
            <DialogDescription>使用当前设置生成的学生报告样式</DialogDescription>
          </DialogHeader>
          <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[70vh]">
            {fullscreenPreviewHTML ? (
              <iframe
                srcDoc={fullscreenPreviewHTML}
                className="w-full border-0 bg-white rounded-lg shadow-sm"
                style={{ minHeight: 600 }}
                title="全屏报告预览"
              />
            ) : (
              <div className="p-8 text-center text-gray-400">加载预览中...</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
