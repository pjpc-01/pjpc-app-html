"use client"

import React, { useState } from "react"
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
  DollarSign
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useExpenses } from "@/hooks/useExpenses"

const EXPENSE_CATEGORIES = [
  { id: "salary", label: "教师薪资 (Tutor Salary)" },
  { id: "rent", label: "办公室租金 (Rent)" },
  { id: "utilities", label: "水电费 (Electricity & Water)" },
  { id: "marketing", label: "市场推广 (Marketing)" },
  { id: "stationery", label: "办公文具 (Stationery)" },
  { id: "maintenance", label: "设备维护 (Maintenance)" },
  { id: "misc", label: "其他杂项 (Miscellaneous)" },
]

export default function ExpenseManagement() {
  const { 
    expenses, 
    loading, 
    error, 
    createExpense, 
    deleteExpense 
  } = useExpenses()
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: "",
    description: "",
    amount: "",
    method: "Bank Transfer"
  })

  const isFormValid = newExpense.category !== "" && newExpense.amount !== "" && newExpense.description.trim() !== ""

  const handleAddExpense = async () => {
    try {
      await createExpense({
        date: newExpense.date,
        category: newExpense.category,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        method: newExpense.method
      })
      setIsAddDialogOpen(false)
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        category: "",
        description: "",
        amount: "",
        method: "Bank Transfer"
      })
    } catch (err) {
      alert("添加支出记录失败，请重试")
    }
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

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ArrowDownCircle className="h-6 w-6 text-red-500" />
            支出管理
          </h2>
          <p className="text-slate-500">记录中心所有经营支出，用于计算净利润</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
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
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      支出描述
                    </Label>
                    <Textarea 
                      placeholder="例如: 6月办公室租金, 某某老师薪资" 
                      value={newExpense.description} 
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                      className="resize-none"
                      rows={4}
                    />
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
            <CardDescription className="text-red-600 font-medium">本月总支出</CardDescription>
            <CardTitle className="text-3xl font-bold text-red-900">RM {totalExpenses.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-medium">记录笔数</CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900">{expenses.length} 笔</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-medium">最大单笔支出</CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900">
              RM {expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)).toLocaleString() : 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>支出流水明细</CardTitle>
          <CardDescription>所有已记录的经营支出明细</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">错误: {error}</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无支出记录</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">日期</TableHead>
                  <TableHead className="w-[150px]">类别</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead className="w-[120px]">方式</TableHead>
                  <TableHead className="text-right w-[120px]">金额</TableHead>
                  <TableHead className="text-center w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id} className="group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3 text-slate-400" />
                        {expense.date}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{expense.category}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{expense.description}</TableCell>
                    <TableCell className="text-slate-500 text-xs">{expense.method}</TableCell>
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
    </div>
  )
}
