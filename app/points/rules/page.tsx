"use client"

import { useState, useEffect } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Trash2, Save, Minus } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface PointRule {
  id: string
  label: string
  amount: number
  type: "add" | "subtract"
  enabled: boolean
}

const DEFAULT_RULES: Omit<PointRule, "id">[] = [
  { label: "举手回答", amount: 2, type: "add", enabled: true },
  { label: "功课满分", amount: 3, type: "add", enabled: true },
  { label: "帮助同学", amount: 2, type: "add", enabled: true },
  { label: "课堂表现好", amount: 1, type: "add", enabled: true },
  { label: "完成额外功课", amount: 3, type: "add", enabled: true },
  { label: "迟到", amount: -1, type: "subtract", enabled: true },
  { label: "没做功课", amount: -2, type: "subtract", enabled: true },
  { label: "扰乱课堂", amount: -3, type: "subtract", enabled: true },
  { label: "打架/争吵", amount: -5, type: "subtract", enabled: true },
  { label: "说脏话", amount: -2, type: "subtract", enabled: true },
]

const STORAGE_KEY = "pjpc_point_rules"

export default function RulesPage() {
  const { t } = useLanguage()
  const [rules, setRules] = useState<PointRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // New rule inputs — one set per type
  const [addLabel, setAddLabel] = useState("")
  const [addAmount, setAddAmount] = useState(1)
  const [subLabel, setSubLabel] = useState("")
  const [subAmount, setSubAmount] = useState(1)

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setRules(JSON.parse(saved))
      } else {
        setRules(DEFAULT_RULES.map((r, i) => ({ ...r, id: `rule_${i}` })))
      }
    } catch {
      setRules(DEFAULT_RULES.map((r, i) => ({ ...r, id: `rule_${i}` })))
    }
    setLoading(false)
  }, [])

  const save = async () => {
    setSaving(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
    setTimeout(() => setSaving(false), 300)
  }

  const addRule = (type: "add" | "subtract") => {
    const label = type === "add" ? addLabel : subLabel
    const amount = type === "add" ? addAmount : subAmount
    if (!label.trim()) return
    const id = `rule_${Date.now()}`
    setRules(prev => [...prev, { id, label: label.trim(), amount: type === "add" ? amount : -amount, type, enabled: true }])
    if (type === "add") { setAddLabel(""); setAddAmount(1) }
    else { setSubLabel(""); setSubAmount(1) }
  }

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id))
  }

  const updateAmount = (id: string, amount: number) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, amount, type: amount >= 0 ? "add" : "subtract" } : r))
  }

  const updateLabel = (id: string, label: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, label } : r))
  }

  if (loading) {
    return (
      <PageLayout title={t('points.points_rules')} description={t('teacher.loading')} backUrl="/points" userRole="admin" background="from-amber-50 to-yellow-50">
        <div className="text-center py-16"><Loader2 className="h-6 w-6 mx-auto animate-spin text-amber-500" /></div>
      </PageLayout>
    )
  }

  const addRules = rules.filter(r => r.type === "add")
  const subRules = rules.filter(r => r.type === "subtract")
  const activeAdd = addRules.filter(r => r.enabled)
  const activeSub = subRules.filter(r => r.enabled)

  const RuleRow = ({ rule }: { rule: PointRule }) => {
    const isAdd = rule.type === "add"
    return (
      <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 transition-colors ${
        rule.enabled ? "" : "opacity-40 bg-gray-50/50"
      }`}>
        {/* Amount stepper */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => updateAmount(rule.id, rule.amount - 1)}
            className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 text-xs"
          >−</button>
          <span className={`text-sm font-bold w-9 text-center tabular-nums ${
            isAdd ? "text-green-600" : "text-red-600"
          }`}>
            {isAdd ? "+" : ""}{rule.amount}
          </span>
          <button
            onClick={() => updateAmount(rule.id, rule.amount + 1)}
            className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 text-xs"
          >+</button>
        </div>

        {/* Label */}
        <input
          value={rule.label}
          onChange={e => updateLabel(rule.id, e.target.value)}
          className="flex-1 text-sm bg-transparent border-none outline-none text-gray-700 font-medium min-w-0"
        />

        {/* Toggle */}
        <button
          onClick={() => toggleRule(rule.id)}
          className={`text-[10px] px-2 py-0.5 rounded-full transition-colors flex-shrink-0 ${
            rule.enabled ? (isAdd ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600") : "bg-gray-100 text-gray-400"
          }`}
        >
          {rule.enabled ? "启用" : "停用"}
        </button>

        {/* Delete */}
        <button onClick={() => deleteRule(rule.id)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  const AddNewRow = ({ type }: { type: "add" | "subtract" }) => {
    const isAdd = type === "add"
    const label = isAdd ? addLabel : subLabel
    const amount = isAdd ? addAmount : subAmount
    const setLabel = isAdd ? setAddLabel : setSubLabel
    const setAmount = isAdd ? setAddAmount : setSubAmount

    return (
      <div className="flex items-center gap-3 px-4 py-3 border-t-2 border-dashed border-gray-200 bg-gray-50/30">
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={() => setAmount(Math.max(1, amount - 1))} className="w-5 h-5 rounded border text-xs">−</button>
          <span className={`text-sm font-bold w-9 text-center ${isAdd ? "text-green-500" : "text-red-500"}`}>
            {isAdd ? "+" : "-"}{amount}
          </span>
          <button onClick={() => setAmount(amount + 1)} className="w-5 h-5 rounded border text-xs">+</button>
        </div>
        <Input
          placeholder={isAdd ? "新加分规则…" : "新减分规则…"}
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addRule(type)}
          className="h-8 text-sm flex-1"
        />
        <Button onClick={() => addRule(type)} size="sm" className={`h-8 text-xs flex-shrink-0 ${isAdd ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"}`}>
          <Plus className="h-3.5 w-3.5 mr-1" />添加
        </Button>
      </div>
    )
  }

  return (
    <PageLayout
      title={t('points.points_rules')}
      description={`${activeAdd.length + activeSub.length} 条生效中`}
      backUrl="/points"
      userRole="admin"
      background="from-amber-50 to-yellow-50"
    >
      <div className="space-y-4">
        {/* Save bar */}
        <div className="flex justify-end">
          <Button size="sm" onClick={save} disabled={saving} className="h-8 text-xs">
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            保存
          </Button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ── 加分模板 ── */}
          <Card className="border-green-200 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Plus className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-green-800">加分模板</CardTitle>
                  <p className="text-[11px] text-green-500">{activeAdd.length} 条生效 · {addRules.length} 条总计</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[640px] overflow-y-auto">
                {addRules.length === 0 ? (
                  <div className="px-4 py-16 text-center text-gray-400 text-sm">暂无加分规则，点击下方添加</div>
                ) : (
                  addRules.map(rule => <RuleRow key={rule.id} rule={rule} />)
                )}
              </div>
              <AddNewRow type="add" />
            </CardContent>
          </Card>

          {/* ── 减分模板 ── */}
          <Card className="border-red-200 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <Minus className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-red-800">减分模板</CardTitle>
                  <p className="text-[11px] text-red-500">{activeSub.length} 条生效 · {subRules.length} 条总计</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[640px] overflow-y-auto">
                {subRules.length === 0 ? (
                  <div className="px-4 py-16 text-center text-gray-400 text-sm">暂无减分规则，点击下方添加</div>
                ) : (
                  subRules.map(rule => <RuleRow key={rule.id} rule={rule} />)
                )}
              </div>
              <AddNewRow type="subtract" />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
