"use client"

import React, { useState } from "react"
import Link from "next/link"
import PageLayout from "@/components/layouts/PageLayout"
import { useInventoryItems, useInventoryCategories, useLowStockItems } from "@/hooks/useInventory"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  PackageOpen,
  TrendingUp,
  TrendingDown,
  Boxes,
} from "lucide-react"

export default function InventoryPage() {
  const { items, loading, error, refetch } = useInventoryItems()
  const { categories } = useInventoryCategories()
  const { items: lowStockItems } = useLowStockItems()

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Filter items
  const filtered = items.filter(item => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter !== "all" && item.categoryId !== categoryFilter) return false
    if (statusFilter === "low_stock" && (item.minStock == null || item.stock > item.minStock)) return false
    if (statusFilter === "active" && item.status !== "active") return false
    if (statusFilter === "discontinued" && item.status !== "discontinued") return false
    return true
  })

  const totalStockValue = items.reduce((sum, i) => sum + (i.costPrice || 0) * i.stock, 0)
  const totalSellingValue = items.reduce((sum, i) => sum + (i.sellingPrice || 0) * i.stock, 0)
  const activeItems = items.filter(i => i.status === "active").length

  const getCategoryName = (id?: string) => categories.find(c => c.id === id)?.name || "—"
  const getStatusColor = (status: string) => status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"
  const isLowStock = (item: typeof items[0]) => item.minStock != null && item.stock <= item.minStock

  return (
    <PageLayout
      title="库存管理"
      description={`${activeItems} 种商品 · ${lowStockItems.length} 项低库存`}
      actions={
        <Link href="/inventory/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />新增商品
          </Button>
        </Link>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg"><Package className="h-5 w-5 text-indigo-600" /></div>
              <div>
                <p className="text-sm text-gray-500">商品总数</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg"><Boxes className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="text-sm text-gray-500">在售商品</p>
                <p className="text-2xl font-bold">{activeItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-sm text-gray-500">低库存预警</p>
                <p className="text-2xl font-bold text-amber-600">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-gray-500">库存总值 (成本)</p>
                <p className="text-2xl font-bold">RM {totalStockValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索商品名称..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="全部分类" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {categories.filter(c => c.status === "active").map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="全部状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">在售</SelectItem>
            <SelectItem value="discontinued">已停产</SelectItem>
            <SelectItem value="low_stock">低库存</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => refetch()}>
          <PackageOpen className="h-4 w-4 mr-2" />刷新
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          <Package className="h-8 w-8 mx-auto mb-2 animate-pulse" />
          <p>加载库存数据...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12 text-red-500">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>加载失败：{error}</p>
          <Button variant="outline" className="mt-2" onClick={() => refetch()}>重试</Button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">
            {items.length === 0 ? "还没有商品" : "没有匹配的结果"}
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            {items.length === 0 ? "点击右上角「新增商品」开始建立库存" : "尝试调整筛选条件"}
          </p>
          {items.length === 0 && (
            <Link href="/inventory/new">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />新增商品
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Items Table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">商品名称</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">分类</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">单位</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">进价</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">售价</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">库存</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/inventory/${item.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                        {item.name}
                      </Link>
                      {item.sku && <span className="text-xs text-gray-400 ml-2">SKU: {item.sku}</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getCategoryName(item.categoryId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.unit || "—"}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {item.costPrice != null ? `RM ${item.costPrice}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {item.sellingPrice != null ? `RM ${item.sellingPrice}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-medium ${isLowStock(item) ? "text-red-600" : "text-gray-900"}`}>
                        {item.stock}
                      </span>
                      {isLowStock(item) && (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 inline ml-1" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status === "active" ? "在售" : "停产"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/inventory/${item.id}`}>
                        <Button variant="ghost" size="sm">详情</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
