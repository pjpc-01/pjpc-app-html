"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import PageLayout from "@/components/layouts/PageLayout"
import { useInventoryItem, useInventoryTransactions, useInventoryCategories } from "@/hooks/useInventory"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  AlertTriangle,
  Plus,
  History,
  DollarSign,
  Edit3,
} from "lucide-react"

export default function InventoryItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const itemId = params.id as string

  const { item, loading, error, refetch: refetchItem } = useInventoryItem(itemId)
  const { transactions, loading: txLoading, create: createTransaction, refetch: refetchTx } = useInventoryTransactions(itemId)
  const { categories } = useInventoryCategories()

  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [stockType, setStockType] = useState<"stock_in" | "stock_out">("stock_in")
  const [txForm, setTxForm] = useState({ quantity: "", unitPrice: "", notes: "", supplier: "", reference: "" })
  const [txSaving, setTxSaving] = useState(false)
  const [txError, setTxError] = useState("")

  const categoryName = categories.find(c => c.id === item?.categoryId)?.name || "—"
  const isLowStock = item ? (item.minStock != null && item.stock <= item.minStock) : false

  const openStockIn = () => { setStockType("stock_in"); setStockDialogOpen(true); setTxForm({ quantity: "", unitPrice: "", notes: "", supplier: "", reference: "" }); setTxError("") }
  const openStockOut = () => { setStockType("stock_out"); setStockDialogOpen(true); setTxForm({ quantity: "", unitPrice: "", notes: "", supplier: "", reference: "" }); setTxError("") }

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(txForm.quantity)
    if (!qty || qty <= 0) { setTxError("请输入有效数量"); return }
    if (stockType === "stock_out" && item && qty > item.stock) { setTxError("出库数量不能大于当前库存"); return }

    setTxSaving(true)
    setTxError("")
    try {
      const actualQty = stockType === "stock_in" ? qty : -qty
      await createTransaction({
        itemId,
        type: stockType,
        quantity: actualQty,
        unitPrice: txForm.unitPrice ? parseFloat(txForm.unitPrice) : undefined,
        notes: txForm.notes || undefined,
        supplier: txForm.supplier || undefined,
        reference: txForm.reference || undefined,
        date: new Date().toISOString().split("T")[0],
      })
      // Update stock on item
      const newStock = stockType === "stock_in" ? (item!.stock + qty) : (item!.stock - qty)
      await fetch(`/api/pocketbase-proxy/api/collections/inventory_items/records/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      })
      setStockDialogOpen(false)
      refetchItem()
      refetchTx()
    } catch (e: any) {
      setTxError(e.message || "操作失败")
    } finally {
      setTxSaving(false)
    }
  }

  if (loading) return (
    <PageLayout title="商品详情" actions={<Link href="/inventory"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />返回</Button></Link>}>
      <div className="text-center py-16 text-gray-500"><Package className="h-8 w-8 mx-auto mb-2 animate-pulse" /><p>加载中...</p></div>
    </PageLayout>
  )

  if (error || !item) return (
    <PageLayout title="商品详情" actions={<Link href="/inventory"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />返回</Button></Link>}>
      <div className="text-center py-16 text-red-500"><AlertTriangle className="h-8 w-8 mx-auto mb-2" /><p>{error || "商品不存在"}</p></div>
    </PageLayout>
  )

  return (
    <PageLayout
      title={item.name}
      description={item.sku ? `SKU: ${item.sku}` : undefined}
      actions={
        <div className="flex gap-2">
          <Link href="/inventory">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />返回</Button>
          </Link>
        </div>
      }
    >
      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Basic Info */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" />基本信息</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-500">分类</span><p className="font-medium">{categoryName}</p></div>
              <div><span className="text-gray-500">单位</span><p className="font-medium">{item.unit || "—"}</p></div>
              <div><span className="text-gray-500">状态</span><p><Badge className={item.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"}>{item.status === "active" ? "在售" : "停产"}</Badge></p></div>
              <div><span className="text-gray-500">进货价</span><p className="font-medium">{item.costPrice != null ? `RM ${item.costPrice}` : "—"}</p></div>
              <div><span className="text-gray-500">售价</span><p className="font-medium">{item.sellingPrice != null ? `RM ${item.sellingPrice}` : "—"}</p></div>
              <div><span className="text-gray-500">毛利率</span><p className="font-medium">{item.costPrice && item.sellingPrice ? `${Math.round((item.sellingPrice - item.costPrice) / item.sellingPrice * 100)}%` : "—"}</p></div>
              <div><span className="text-gray-500">最低库存</span><p className="font-medium">{item.minStock != null ? item.minStock : "未设置"}</p></div>
              {item.description && <div className="col-span-3"><span className="text-gray-500">描述</span><p className="mt-1 text-gray-700">{item.description}</p></div>}
            </div>
          </CardContent>
        </Card>

        {/* Stock Summary */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />库存概况</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-4xl font-bold mb-1">{item.stock}</p>
              <p className="text-sm text-gray-500">{item.unit || "件"}</p>
            </div>
            {isLowStock && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                库存低于警戒线！({item.stock} / {item.minStock} {item.unit})
              </div>
            )}
            <div className="space-y-2">
              <Button onClick={openStockIn} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <TrendingUp className="h-4 w-4 mr-2" />入库
              </Button>
              <Button onClick={openStockOut} className="w-full bg-amber-600 hover:bg-amber-700"
                disabled={item.stock <= 0}>
                <TrendingDown className="h-4 w-4 mr-2" />出库
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />库存流水
            <span className="text-sm font-normal text-gray-400 ml-2">({transactions.length} 条记录)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>暂无库存记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="text-left py-2 pr-4">日期</th>
                    <th className="text-left py-2 pr-4">类型</th>
                    <th className="text-right py-2 pr-4">数量</th>
                    <th className="text-right py-2 pr-4">单价</th>
                    <th className="text-right py-2 pr-4">金额</th>
                    <th className="text-left py-2 pr-4">供应商/备注</th>
                    <th className="text-left py-2 pr-4">凭证号</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="py-2 pr-4 text-gray-600">{tx.date}</td>
                      <td className="py-2 pr-4">
                        <Badge className={
                          tx.type === "stock_in" ? "bg-emerald-100 text-emerald-700" :
                          tx.type === "stock_out" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        }>
                          {tx.type === "stock_in" ? "入库" : tx.type === "stock_out" ? "出库" : "调整"}
                        </Badge>
                      </td>
                      <td className={`py-2 pr-4 text-right font-medium ${
                        tx.quantity > 0 ? "text-emerald-600" : "text-red-600"
                      }`}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </td>
                      <td className="py-2 pr-4 text-right text-gray-600">
                        {tx.unitPrice != null ? `RM ${tx.unitPrice}` : "—"}
                      </td>
                      <td className="py-2 pr-4 text-right text-gray-600">
                        {tx.totalAmount != null ? `RM ${tx.totalAmount}` : "—"}
                      </td>
                      <td className="py-2 pr-4 text-gray-600 max-w-[200px] truncate">
                        {tx.supplier && <span className="block text-xs text-gray-400">供应商: {tx.supplier}</span>}
                        {tx.notes || "—"}
                      </td>
                      <td className="py-2 pr-4 text-gray-500 text-xs">
                        {tx.reference || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {stockType === "stock_in" ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-amber-600" />}
              {stockType === "stock_in" ? "入库操作" : "出库操作"}
              <span className="text-sm font-normal text-gray-400 ml-2">
                （当前库存: {item.stock} {item.unit || "件"}）
              </span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStockSubmit} className="space-y-4">
            <div>
              <Label>数量 *</Label>
              <Input type="number" min="1" value={txForm.quantity}
                onChange={e => setTxForm(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder={`入库/出库数量（${item.unit || "件"}）`} required />
            </div>
            <div>
              <Label>单价 (RM)</Label>
              <Input type="number" step="0.01" min="0" value={txForm.unitPrice}
                onChange={e => setTxForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                placeholder="可选" />
            </div>
            <div>
              <Label>供应商</Label>
              <Input value={txForm.supplier}
                onChange={e => setTxForm(prev => ({ ...prev, supplier: e.target.value }))}
                placeholder="入库来源/出库去向" />
            </div>
            <div>
              <Label>凭证号 / 采购单号</Label>
              <Input value={txForm.reference}
                onChange={e => setTxForm(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="可选" />
            </div>
            <div>
              <Label>备注</Label>
              <Textarea value={txForm.notes}
                onChange={e => setTxForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="可选备注" rows={2} />
            </div>
            {txError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{txError}</div>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setStockDialogOpen(false)}>取消</Button>
              <Button type="submit" disabled={txSaving} className="bg-indigo-600 hover:bg-indigo-700">
                {txSaving ? "处理中..." : "确认"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
