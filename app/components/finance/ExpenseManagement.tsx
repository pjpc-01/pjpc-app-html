"use client"

import React, { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogDescription
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Plus, 
  Trash2, 
  Download, 
  Calendar as CalendarIcon, 
  ArrowDownCircle,
  Tag,
  CreditCard,
  FileText,
  DollarSign,
  Paperclip,
  Eye,
  X,
  Briefcase,
  Building,
  Zap,
  Megaphone,
  Pen,
  Wrench,
  MoreHorizontal
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useExpenses } from "@/hooks/useExpenses"
import { useSearchParams } from "next/navigation"
import { useCenters } from "@/hooks/useCenters"
import { formatDate } from "@/lib/utils"
import UtilityBillsCard from "./UtilityBillsCard"


const EXPENSE_CATEGORIES = [
  { id: "salary", label: "教师薪资", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Briefcase },
  { id: "rent", label: "办公室租金", color: "bg-purple-100 text-purple-800 border-purple-200", icon: Building },
  { id: "utilities", label: "水电费", color: "bg-cyan-100 text-cyan-800 border-cyan-200", icon: Zap },
  { id: "marketing", label: "市场推广", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Megaphone },
  { id: "stationery", label: "办公文具", color: "bg-green-100 text-green-800 border-green-200", icon: Pen },
  { id: "maintenance", label: "设备维护", color: "bg-orange-100 text-orange-800 border-orange-200", icon: Wrench },
  { id: "misc", label: "其他杂项", color: "bg-gray-100 text-gray-800 border-gray-200", icon: MoreHorizontal },
]

const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  EXPENSE_CATEGORIES.map(c => [c.id, c.color])
)

export default function ExpenseManagement() {
  const searchParams = useSearchParams()
  const centerParam = searchParams.get("center")
  const { centers } = useCenters()
  
  const { 
    expenses, 
    loading, 
    error, 
    createExpense, 
    createExpenseWithReceipt,
    deleteExpense 
  } = useExpenses()
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: "",
    description: "",
    amount: "",
    method: "Bank Transfer",
    centerId: ""
  })

  const isFormValid = newExpense.category !== "" && newExpense.amount !== "" && newExpense.description.trim() !== ""

  const handleAddExpense = async () => {
    try {
      if (receiptFile) {
        await createExpenseWithReceipt({
          date: newExpense.date,
          category: newExpense.category,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          method: newExpense.method,
          centerId: newExpense.centerId || undefined
        }, receiptFile)
      } else {
        await createExpense({
          date: newExpense.date,
          category: newExpense.category,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          method: newExpense.method,
          centerId: newExpense.centerId || undefined
        })
      }
      setIsAddDialogOpen(false)
      receiptFileCleanup()
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        category: "",
        description: "",
        amount: "",
        method: "Bank Transfer",
        centerId: ""
      })
    } catch (err) {
      alert("添加支出记录失败，请重试")
    }
  }

  const receiptFileCleanup = () => {
    setReceiptFile(null)
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview)
      setReceiptPreview(null)
    }
  }

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptFile(file)
    // Create preview URL for images
    if (file.type.startsWith('image/')) {
      setReceiptPreview(URL.createObjectURL(file))
    } else {
      setReceiptPreview(null)
    }
  }

  const POCKETBASE_URL = 'http://127.0.0.1:8090'
  const getReceiptUrl = (filename: string, recordId: string) => {
    return `${POCKETBASE_URL}/api/files/expenses/${recordId}/${filename}`
  }

  const handleDeleteExpense = async (id: string) => {
    if (confirm("确定要删除此支出记录吗？")) {
      try {
        await deleteExpense(id)
      } catch (err) {
        alert("删除失败，请重试")
      }
    }
  }

  const safeExpenses = Array.isArray(expenses) ? expenses : []
  const totalExpenses = safeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  // Category breakdown
  const categoryTotals = safeExpenses.reduce((acc, e) => {
    const cat = e.category || "misc"
    acc[cat] = (acc[cat] || 0) + (e.amount || 0)
    return acc
  }, {} as Record<string, number>)

  // Month filter
  const [monthFilter, setMonthFilter] = useState("all")
  const currentMonth = new Date().toISOString().slice(0, 7)
  const months = [...new Set(safeExpenses.map(e => (e.date || "").slice(0, 7)).filter(Boolean))].sort().reverse()

  const filteredExpenses = safeExpenses.filter(e => {
    // Month filter
    if (monthFilter !== "all" && !(e.date || "").startsWith(monthFilter)) return false
    // Center filter
    if (centerParam && e.centerId !== centerParam) return false
    return true
  })

  const filteredTotal = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="h-6 w-6 text-red-500" />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => {
            const csv = "日期,类别,描述,分行,方式,金额\n" + filteredExpenses.map(e => {
              const cat = EXPENSE_CATEGORIES.find(c => c.id === e.category)?.label || e.category
              const center = centers.find(c => c.id === e.centerId)
              const centerName = center ? `${center.code}-${center.name}` : "-"
              return `"${e.date}","${cat}","${e.description}","${centerName}","${e.method}","${e.amount}"`
            }).join("\n")
            const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url; a.download = `expenses_${new Date().toISOString().slice(0, 10)}.csv`
            a.click(); URL.revokeObjectURL(url)
          }}>
            <Download className="h-4 w-4" /> 导出账单
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white shadow-sm">
                <Plus className="h-4 w-4" /> 添加支出
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl overflow-hidden">
              <DialogHeader className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Plus className="h-5 w-5 text-red-600" />
                  </div>
                  <DialogTitle className="text-xl">新增支出记录</DialogTitle>
                </div>
                <DialogDescription>
                  详细记录每一笔经营成本，确保财务报表准确无误。
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      支出日期
                    </Label>
                    <Input 
                      type="date" 
                      value={newExpense.date} 
                      onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      支出类别
                    </Label>
                    <Select 
                      value={newExpense.category} 
                      onValueChange={(v) => setNewExpense({...newExpense, category: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择类别" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      金额 (RM)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">RM</span>
                      <Input 
                        type="number" 
                        className="pl-10 font-mono" 
                        placeholder="0.00" 
                        value={newExpense.amount} 
                        onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      支付方式
                    </Label>
                    <Select 
                      value={newExpense.method} 
                      onValueChange={(v) => setNewExpense({...newExpense, method: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择支付方式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bank Transfer">银行转账</SelectItem>
                        <SelectItem value="Cash">现金</SelectItem>
                        <SelectItem value="Credit Card">信用卡</SelectItem>
                        <SelectItem value="Online Banking">网银</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      所属分行
                    </Label>
                    <Select 
                      value={newExpense.centerId} 
                      onValueChange={(v) => setNewExpense({...newExpense, centerId: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择分行（可选）" />
                      </SelectTrigger>
                      <SelectContent>
                        {centers.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      支出描述
                    </Label>
                    <Textarea 
                      placeholder="例如: 6月办公室租金, 某某老师薪资" 
                      value={newExpense.description} 
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                  {/* Receipt Upload */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                      收据凭证（可选）
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleReceiptFileChange}
                      className="hidden"
                    />
                    {receiptPreview ? (
                      <div className="relative border rounded-lg overflow-hidden">
                        <img 
                          src={receiptPreview} 
                          alt="收据预览" 
                          className="w-full h-32 object-cover"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white h-6 w-6 rounded-full"
                          onClick={() => {
                            receiptFileCleanup()
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : receiptFile ? (
                      <div className="flex items-center gap-2 p-2 border rounded-lg bg-slate-50">
                        <Paperclip className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600 truncate flex-1">{receiptFile.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setReceiptFile(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-24 border-dashed flex flex-col gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-6 w-6 text-slate-400" />
                        <span className="text-sm text-slate-500">点击上传收据照片或PDF</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>取消</Button>
                <Button 
                  onClick={handleAddExpense} 
                  disabled={!isFormValid}
                  className="bg-red-600 hover:bg-red-700 text-white px-8"
                >
                  确认添加
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-red-600 font-medium">总支出</CardDescription>
            <CardTitle className="text-3xl font-bold text-red-900">RM {totalExpenses.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-medium">记录笔数</CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900">{safeExpenses.length} 笔</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-medium">最大单笔支出</CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900">
              RM {safeExpenses.length > 0 ? Math.max(...safeExpenses.map(e => e.amount || 0)).toLocaleString() : 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">分类支出汇总</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(categoryTotals).sort(([,a], [,b]) => b - a).map(([cat, total]) => {
                const catInfo = EXPENSE_CATEGORIES.find(c => c.id === cat)
                return (
                  <div key={cat} className={`p-3 rounded-lg border ${catInfo?.color || "bg-gray-50"}`}>
                    <p className="text-xs font-medium opacity-70">{catInfo?.label || cat}</p>
                    <p className="text-lg font-bold">RM {total.toLocaleString()}</p>
                    <p className="text-xs opacity-60">{totalExpenses > 0 ? ((total / totalExpenses) * 100).toFixed(1) : 0}%</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>支出流水明细</CardTitle>
              <CardDescription>所有已记录的经营支出明细</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {months.length > 0 && (
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="全部月份" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部月份</SelectItem>
                    {months.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {monthFilter !== "all" && (
                <Badge variant="secondary">RM {filteredTotal.toLocaleString()}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">错误: {error}</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无支出记录</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">日期</TableHead>
                  <TableHead className="w-[150px]">类别</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead className="w-[100px]">分行</TableHead>
                  <TableHead className="w-[100px]">方式</TableHead>
                  <TableHead className="w-[60px] text-center">凭证</TableHead>
                  <TableHead className="text-right w-[120px]">金额</TableHead>
                  <TableHead className="text-center w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} className="group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3 text-slate-400" />
                        {formatDate(expense.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`font-normal border ${CATEGORY_COLORS[expense.category] || "bg-gray-50 text-gray-700"}`} variant="outline">
                        {EXPENSE_CATEGORIES.find(c => c.id === expense.category)?.label || expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{expense.description}</TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {(() => {
                        const center = centers.find(c => c.id === expense.centerId)
                        return center ? `${center.code}-${center.name}` : "-"
                      })()}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">{expense.method}</TableCell>
                    <TableCell className="text-center">
                      {expense.receipt ? (
                        <a 
                          href={getReceiptUrl(expense.receipt, expense.id)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                          title="查看收据"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      - RM {expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UtilityBillsCard />
    </div>
  )
}
