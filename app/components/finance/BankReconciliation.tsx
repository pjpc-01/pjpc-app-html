"use client"

import { useState, useEffect } from "react"
import { useBankAccounts, useBankTransactions, type BankAccount, type BankTransaction } from "@/hooks/useBankAccounts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Plus, Upload, RefreshCw, CheckCircle2, XCircle, AlertCircle, Building2, FileText, Loader2, Search, Trash2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function BankReconciliation() {
  const { t } = useLanguage()
  const { accounts, loading: acctLoading, createAccount, updateAccount, deleteAccount, refetch: refetchAccounts } = useBankAccounts()
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const { transactions, loading: txnLoading, importTransactions, deleteTransaction, refetch: refetchTransactions } = useBankTransactions(selectedAccountId)

  const [activeSection, setActiveSection] = useState<"accounts" | "transactions" | "reconciliation">("accounts")
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [reconciling, setReconciling] = useState(false)
  const [reconResult, setReconResult] = useState<any>(null)

  // Add account form
  const [newAccount, setNewAccount] = useState({ bankName: "", accountNumber: "", accountName: "", openingBalance: "", currentBalance: "" })

  // Import form
  const [importText, setImportText] = useState("")

  const handleAddAccount = async () => {
    if (!newAccount.bankName || !newAccount.accountNumber) {
      toast.error("请填写银行名称和账号")
      return
    }
    try {
      await createAccount({
        bankName: newAccount.bankName,
        accountNumber: newAccount.accountNumber,
        accountName: newAccount.accountName || undefined,
        openingBalance: newAccount.openingBalance ? Number(newAccount.openingBalance) : undefined,
        currentBalance: newAccount.currentBalance ? Number(newAccount.currentBalance) : undefined,
        status: "active"
      })
      toast.success("银行账户已添加")
      setShowAddAccount(false)
      setNewAccount({ bankName: "", accountNumber: "", accountName: "", openingBalance: "", currentBalance: "" })
    } catch (err: any) {
      toast.error(err.message || "添加失败")
    }
  }

  const handleImportTransactions = async () => {
    if (!selectedAccountId) {
      toast.error("请先选择银行账户")
      return
    }
    if (!importText.trim()) {
      toast.error("请输入交易数据")
      return
    }

    // Parse CSV-like text: date, description, amount, type
    const lines = importText.trim().split("\n").filter(l => l.trim())
    const parsed: Omit<BankTransaction, "id">[] = []

    for (const line of lines) {
      const parts = line.split(",").map(s => s.trim())
      if (parts.length < 3) continue
      const [date, description, amountStr, type] = parts
      const amount = parseFloat(amountStr)
      if (isNaN(amount)) continue
      parsed.push({
        bankAccountId: selectedAccountId,
        date,
        description,
        amount: Math.abs(amount),
        type: type?.toLowerCase() === "debit" || amount < 0 ? "debit" : "credit",
        reference: parts[4] || "",
        reconciled: false
      })
    }

    if (parsed.length === 0) {
      toast.error("无法解析任何交易记录，格式：日期, 描述, 金额, credit/debit")
      return
    }

    try {
      const result = await importTransactions(parsed)
      toast.success(`成功导入 ${result.length} 笔交易`)
      setShowImport(false)
      setImportText("")
    } catch (err: any) {
      toast.error(err.message || "导入失败")
    }
  }

  const handleReconciliation = async () => {
    if (!selectedAccountId) {
      toast.error("请先选择银行账户")
      return
    }
    setReconciling(true)
    setReconResult(null)
    try {
      const res = await fetch("/api/finance/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankAccountId: selectedAccountId,
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          endDate: new Date().toISOString().split("T")[0],
          startingBalance: accounts.find(a => a.id === selectedAccountId)?.currentBalance || 0,
        })
      })
      const data = await res.json()
      if (data.success) {
        setReconResult(data.data)
        toast.success(`对账完成：${data.data.matched} 笔已匹配`)
        refetchTransactions()
      } else {
        toast.error(data.error || "对账失败")
      }
    } catch (err: any) {
      toast.error(err.message || "对账失败")
    }
    setReconciling(false)
  }

  const selectedAccount = accounts.find(a => a.id === selectedAccountId)

  // Summary stats
  const totalCredits = transactions.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0)
  const totalDebits = transactions.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0)
  const reconciledCount = transactions.filter(t => t.reconciled).length
  const unreconciledCount = transactions.filter(t => !t.reconciled).length

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <button
          onClick={() => setActiveSection("accounts")}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeSection === "accounts" ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Building2 className="h-4 w-4 inline mr-1" />银行账户
        </button>
        <button
          onClick={() => setActiveSection("transactions")}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeSection === "transactions" ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="h-4 w-4 inline mr-1" />银行流水
        </button>
        <button
          onClick={() => setActiveSection("reconciliation")}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeSection === "reconciliation" ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <RefreshCw className="h-4 w-4 inline mr-1" />对账报告
        </button>
      </div>

      {/* === ACCOUNTS SECTION === */}
      {activeSection === "accounts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">银行账户管理</h3>
            <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />添加账户</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>添加银行账户</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>银行名称 *</Label>
                    <Input value={newAccount.bankName} onChange={e => setNewAccount(p => ({...p, bankName: e.target.value}))} placeholder="例：CIMB Bank" />
                  </div>
                  <div>
                    <Label>账号 *</Label>
                    <Input value={newAccount.accountNumber} onChange={e => setNewAccount(p => ({...p, accountNumber: e.target.value}))} placeholder="例：1234-567-89" />
                  </div>
                  <div>
                    <Label>账户名称</Label>
                    <Input value={newAccount.accountName} onChange={e => setNewAccount(p => ({...p, accountName: e.target.value}))} placeholder="例：PJPC Enterprise" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>期初余额</Label>
                      <Input type="number" value={newAccount.openingBalance} onChange={e => setNewAccount(p => ({...p, openingBalance: e.target.value}))} />
                    </div>
                    <div>
                      <Label>当前余额</Label>
                      <Input type="number" value={newAccount.currentBalance} onChange={e => setNewAccount(p => ({...p, currentBalance: e.target.value}))} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddAccount(false)}>{t('report.cancel')}</Button>
                  <Button onClick={handleAddAccount}>{t('report.save')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {acctLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
          ) : accounts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>暂无银行账户</p>
                <p className="text-sm mt-1">点击"添加账户"开始</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {accounts.map(acct => (
                <Card key={acct.id} className={`cursor-pointer transition-all ${selectedAccountId === acct.id ? "ring-2 ring-indigo-500" : ""}`} onClick={() => setSelectedAccountId(acct.id)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{acct.bankName}</h4>
                        <p className="text-sm text-gray-500">{acct.accountNumber}</p>
                        {acct.accountName && <p className="text-xs text-gray-400 mt-1">{acct.accountName}</p>}
                      </div>
                      <Badge variant={acct.status === "active" ? "default" : "secondary"} className="text-xs">
                        {acct.status === "active" ? "活跃" : "停用"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex justify-between text-sm">
                      <span className="text-gray-500">余额：</span>
                      <span className={`font-semibold ${(acct.currentBalance || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        RM {(acct.currentBalance || 0).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === TRANSACTIONS SECTION === */}
      {activeSection === "transactions" && (
        <div className="space-y-4">
          {!selectedAccountId ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>请在"银行账户"页签选择一个账户</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedAccount?.bankName} - {selectedAccount?.accountNumber}</h3>
                  <p className="text-sm text-gray-500">
                    收入: RM {totalCredits.toFixed(2)} | 支出: RM {totalDebits.toFixed(2)} | 已对账: {reconciledCount} | 未对账: {unreconciledCount}
                  </p>
                </div>
                <Dialog open={showImport} onOpenChange={setShowImport}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline"><Upload className="h-4 w-4 mr-1" />导入流水</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader><DialogTitle>导入银行流水</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <Label>粘贴交易数据（每行一个）</Label>
                      <p className="text-xs text-gray-500">
                        格式：日期, 描述, 金额, credit/debit, 参考号<br />
                        例：<br />
                        2026-06-01, 学费收入-张三, 500, credit, INV-001<br />
                        2026-06-02, 水电费, -150, debit, UTIL-001<br />
                        2026-06-03, 文具采购, 80, debit, SUP-001<br />
                        （正数为 credit 收入，负数为 debit 支出）
                      </p>
                      <textarea
                        className="w-full h-40 p-3 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                        placeholder="粘贴交易数据..."
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowImport(false)}>{t('report.cancel')}</Button>
                      <Button onClick={handleImportTransactions}>导入</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {txnLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
              ) : transactions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>暂无交易记录</p>
                    <p className="text-sm mt-1">点击"导入流水"添加银行交易</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('finance.date')}</TableHead>
                        <TableHead>{t('finance.description')}</TableHead>
                        <TableHead>参考号</TableHead>
                        <TableHead className="text-right">{t('finance.amount')}</TableHead>
                        <TableHead className="text-center">{t('common.type')}</TableHead>
                        <TableHead className="text-center">对账状态</TableHead>
                        <TableHead className="text-right">{t('teacher.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map(txn => (
                        <TableRow key={txn.id}>
                          <TableCell className="text-sm">{new Date(txn.date).toLocaleDateString("zh-CN")}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{txn.description}</TableCell>
                          <TableCell className="text-xs text-gray-500">{txn.reference || "-"}</TableCell>
                          <TableCell className={`text-sm text-right font-medium ${txn.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                            {txn.type === "credit" ? "+" : "-"}RM {txn.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={txn.type === "credit" ? "default" : "destructive"} className="text-xs">
                              {txn.type === "credit" ? "收入" : "支出"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {txn.reconciled ? (
                              <span className="inline-flex items-center text-xs text-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" />已对账</span>
                            ) : (
                              <span className="inline-flex items-center text-xs text-amber-600"><AlertCircle className="h-3 w-3 mr-1" />未对账</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteTransaction(txn.id).then(() => toast.success("已删除"))}>
                              <Trash2 className="h-3 w-3 text-gray-400" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* === RECONCILIATION SECTION === */}
      {activeSection === "reconciliation" && (
        <div className="space-y-4">
          {!selectedAccountId ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>请在"银行账户"页签选择一个账户</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">自动对账</h3>
                  <p className="text-sm text-gray-500">{selectedAccount?.bankName} - {selectedAccount?.accountNumber}</p>
                </div>
                <Button onClick={handleReconciliation} disabled={reconciling || unreconciledCount === 0}>
                  {reconciling ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />对账中...</> : <><RefreshCw className="h-4 w-4 mr-1" />运行对账</>}
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                    <p className="text-xs text-gray-500">总交易数</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{reconciledCount}</p>
                    <p className="text-xs text-gray-500">已对账</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className={`text-2xl font-bold ${unreconciledCount > 0 ? "text-amber-600" : "text-gray-900"}`}>{unreconciledCount}</p>
                    <p className="text-xs text-gray-500">未对账</p>
                  </CardContent>
                </Card>
              </div>

              {/* Reconciliation Result */}
              {reconResult && (
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardHeader>
                    <CardTitle className="text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />对账完成
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-emerald-700">总交易</p>
                        <p className="text-xl font-bold text-emerald-900">{reconResult.total || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-emerald-700">已匹配</p>
                        <p className="text-xl font-bold text-emerald-900">{reconResult.matched || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-emerald-700">未匹配</p>
                        <p className="text-xl font-bold text-amber-600">{reconResult.unmatched || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-emerald-700">匹配率</p>
                        <p className="text-xl font-bold text-emerald-900">
                          {reconResult.total > 0 ? Math.round((reconResult.matched / reconResult.total) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                    {reconResult.runId && (
                      <p className="text-xs text-emerald-600 mt-3">对账ID: {reconResult.runId}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Transactions List with match info */}
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('finance.date')}</TableHead>
                      <TableHead>{t('finance.description')}</TableHead>
                      <TableHead className="text-right">{t('finance.amount')}</TableHead>
                      <TableHead>匹配目标</TableHead>
                      <TableHead className="text-center">匹配类型</TableHead>
                      <TableHead className="text-center">{t('teacher.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-400 py-8">暂无交易</TableCell>
                      </TableRow>
                    ) : (
                      transactions.map(txn => (
                        <TableRow key={txn.id}>
                          <TableCell className="text-sm">{new Date(txn.date).toLocaleDateString("zh-CN")}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{txn.description}</TableCell>
                          <TableCell className={`text-sm text-right font-medium ${txn.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                            RM {txn.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">
                            {txn.matchedTo ? txn.matchedTo.slice(0, 12) + "..." : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            {txn.matchType ? (
                              <Badge variant="outline" className="text-xs bg-indigo-50">{txn.matchType}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {txn.reconciled ? (
                              <Badge variant="default" className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200">已对账</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">未对账</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
