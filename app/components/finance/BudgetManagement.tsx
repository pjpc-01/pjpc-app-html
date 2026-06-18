"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, AlertTriangle, Loader2, DollarSign, TrendingUp, TrendingDown } from "lucide-react"

const BUDGET_CATEGORIES = [
  "Rent", "Utilities", "Salary", "Supplies", "Food",
  "Transport", "Marketing", "Maintenance", "Other"
]

const CATEGORY_LABELS: Record<string, string> = {
  Rent: "租金", Utilities: "水电", Salary: "薪资", Supplies: "文具教材",
  Food: "餐饮", Transport: "交通", Marketing: "推广", Maintenance: "维修", Other: "其他"
}

const CATEGORY_COLORS: Record<string, string> = {
  Rent: "bg-violet-100 text-violet-800", Utilities: "bg-blue-100 text-blue-800",
  Salary: "bg-orange-100 text-orange-800", Supplies: "bg-cyan-100 text-cyan-800",
  Food: "bg-green-100 text-green-800", Transport: "bg-yellow-100 text-yellow-800",
  Marketing: "bg-pink-100 text-pink-800", Maintenance: "bg-gray-100 text-gray-800",
  Other: "bg-slate-100 text-slate-800"
}

interface Budget {
  id: string
  category: string
  month: number
  year: number
  budgetAmount: number
  spent: number
  variance: number
  percentage: number
  notes?: string
  status?: string
}

interface BudgetSummary {
  totalBudget: number
  totalSpent: number
  variance: number
}

export default function BudgetManagement() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [summary, setSummary] = useState<BudgetSummary>({ totalBudget: 0, totalSpent: 0, variance: 0 })
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    category: "",
    budgetAmount: "",
    notes: ""
  })

  const fetchBudgets = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/finance/budgets?month=${month}&year=${year}`)
      const data = await res.json()
      if (data.success) {
        setBudgets(data.data?.budgets || [])
        setSummary(data.data?.summary || { totalBudget: 0, totalSpent: 0, variance: 0 })
      }
    } catch (err) {
      console.error("Failed to fetch budgets:", err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchBudgets() }, [month, year])

  const resetForm = () => {
    setFormData({ category: "", budgetAmount: "", notes: "" })
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!formData.category || !formData.budgetAmount) {
      toast.error("请填写类别和预算金额")
      return
    }

    const payload = {
      category: formData.category,
      month,
      year,
      budgetAmount: Number(formData.budgetAmount),
      notes: formData.notes || undefined,
      status: "active"
    }

    try {
      let res
      if (editingId) {
        res = await fetch(`/api/finance/budgets?id=${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch("/api/finance/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      }
      const data = await res.json()
      if (data.success) {
        toast.success(editingId ? "预算已更新" : "预算已创建")
        setShowAdd(false)
        resetForm()
        fetchBudgets()
      } else {
        toast.error(data.error || "保存失败")
      }
    } catch (err: any) {
      toast.error(err.message || "保存失败")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此预算？")) return
    try {
      const res = await fetch(`/api/finance/budgets?id=${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast.success("已删除")
        fetchBudgets()
      }
    } catch (err: any) {
      toast.error(err.message || "删除失败")
    }
  }

  const handleEdit = (budget: Budget) => {
    setFormData({
      category: budget.category,
      budgetAmount: String(budget.budgetAmount),
      notes: budget.notes || ""
    })
    setEditingId(budget.id)
    setShowAdd(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}月</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2025, 2026, 2027].map(y => (
                <SelectItem key={y} value={String(y)}>{y}年</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={showAdd} onOpenChange={v => { setShowAdd(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />设置预算</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "编辑预算" : "设置预算"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>类别 *</Label>
                <Select value={formData.category} onValueChange={v => setFormData(p => ({...p, category: v}))}>
                  <SelectTrigger><SelectValue placeholder="选择费用类别" /></SelectTrigger>
                  <SelectContent>
                    {BUDGET_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{CATEGORY_LABELS[c] || c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>预算金额 (RM) *</Label>
                <Input type="number" value={formData.budgetAmount} onChange={e => setFormData(p => ({...p, budgetAmount: e.target.value}))} placeholder="0.00" />
              </div>
              <div>
                <Label>备注</Label>
                <Input value={formData.notes} onChange={e => setFormData(p => ({...p, notes: e.target.value}))} placeholder="预算说明" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAdd(false); resetForm() }}>取消</Button>
              <Button onClick={handleSave}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">预算总额</p>
            <p className="text-2xl font-bold text-gray-900">RM {summary.totalBudget.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">实际支出</p>
            <p className="text-2xl font-bold text-indigo-600">RM {summary.totalSpent.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">结余</p>
            <p className={`text-2xl font-bold ${summary.variance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              RM {summary.variance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget vs Actual Table */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>暂无预算数据</p>
            <p className="text-sm mt-1">点击"设置预算"添加 {year}年{month}月 预算</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>费用类别</TableHead>
                <TableHead className="text-right">预算 (RM)</TableHead>
                <TableHead className="text-right">实际 (RM)</TableHead>
                <TableHead className="text-right">差异 (RM)</TableHead>
                <TableHead>使用率</TableHead>
                <TableHead className="text-center">状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map(b => {
                const spent = b.spent || 0
                const budgetAmt = b.budgetAmount || 0
                const percentage = budgetAmt > 0 ? (spent / budgetAmt) * 100 : 0
                const variance = budgetAmt - spent
                const isOver = percentage > 100
                const isWarning = percentage >= 80 && percentage <= 100
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${CATEGORY_COLORS[b.category] || "bg-gray-100"}`}>
                        {CATEGORY_LABELS[b.category] || b.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">RM {b.budgetAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">RM {b.spent.toFixed(2)}</TableCell>
                    <TableCell className={`text-right font-medium ${variance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {variance >= 0 ? "+" : ""}RM {variance.toFixed(2)}
                    </TableCell>
                    <TableCell className="w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${isOver ? "text-red-600" : "text-gray-500"}`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {isOver ? (
                        <Badge variant="destructive" className="text-xs">超支</Badge>
                      ) : isWarning ? (
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">接近上限</Badge>
                      ) : (
                        <Badge variant="default" className="text-xs bg-emerald-100 text-emerald-800">正常</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(b)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(b.id)}>
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Overspend Alert */}
      {budgets.filter(b => {
        const amt = b.budgetAmount || 0
        const sp = b.spent || 0
        return amt > 0 && (sp / amt) * 100 > 100
      }).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-red-800">超支提醒</p>
              <p className="text-sm text-red-600 mt-1">
                以下类别已超出预算：
                {budgets.filter(b => {
                  const amt = b.budgetAmount || 0
                  const sp = b.spent || 0
                  return amt > 0 && (sp / amt) * 100 > 100
                }).map(b => CATEGORY_LABELS[b.category] || b.category).join("、")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
