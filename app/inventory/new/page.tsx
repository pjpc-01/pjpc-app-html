"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import PageLayout from "@/components/layouts/PageLayout"
import { useInventoryItems, useInventoryCategories } from "@/hooks/useInventory"
import { Button } from "@/components/ui/button"
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
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Save, Package } from "lucide-react"
import Link from "next/link"

const UNITS = ["本", "支", "包", "盒", "张", "个", "条", "双", "套", "瓶", "袋", "箱", "罐", "份"]

export default function NewInventoryItemPage() {
  const router = useRouter()
  const { create } = useInventoryItems()
  const { categories } = useInventoryCategories()

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    unit: "",
    costPrice: "",
    sellingPrice: "",
    stock: "0",
    minStock: "5",
    sku: "",
    description: "",
    status: "active",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError("请输入商品名称")
      return
    }
    setSaving(true)
    setError("")
    try {
      await create({
        name: form.name.trim(),
        categoryId: form.categoryId || undefined,
        unit: form.unit || undefined,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        sellingPrice: form.sellingPrice ? parseFloat(form.sellingPrice) : undefined,
        stock: parseInt(form.stock) || 0,
        minStock: form.minStock ? parseInt(form.minStock) : undefined,
        sku: form.sku || undefined,
        description: form.description || undefined,
        status: "active",
      })
      router.push("/inventory")
    } catch (e: any) {
      setError(e.message || "保存失败")
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout
      title="新增商品"
      description="添加新商品到库存系统"
      actions={
        <Link href="/inventory">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />返回库存
          </Button>
        </Link>
      }
    >
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <Label htmlFor="name">商品名称 *</Label>
                <Input id="name" value={form.name} onChange={e => updateField("name", e.target.value)}
                  placeholder="例：数学练习簿 Standard 4" required />
              </div>

              {/* Category + Unit row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>分类</Label>
                  <Select value={form.categoryId} onValueChange={v => updateField("categoryId", v)}>
                    <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.status === "active").map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>单位</Label>
                  <Select value={form.unit} onValueChange={v => updateField("unit", v)}>
                    <SelectTrigger><SelectValue placeholder="选择单位" /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* SKU */}
              <div>
                <Label>商品编码 (SKU)</Label>
                <Input value={form.sku} onChange={e => updateField("sku", e.target.value)}
                  placeholder="可选，用于内部管理编号" />
              </div>

              {/* Prices row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>进货价 (RM)</Label>
                  <Input type="number" step="0.01" min="0" value={form.costPrice}
                    onChange={e => updateField("costPrice", e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <Label>售价 (RM)</Label>
                  <Input type="number" step="0.01" min="0" value={form.sellingPrice}
                    onChange={e => updateField("sellingPrice", e.target.value)} placeholder="0.00" />
                </div>
              </div>

              {/* Stock row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>初始库存</Label>
                  <Input type="number" min="0" value={form.stock}
                    onChange={e => updateField("stock", e.target.value)} />
                </div>
                <div>
                  <Label>最低库存预警</Label>
                  <Input type="number" min="0" value={form.minStock}
                    onChange={e => updateField("minStock", e.target.value)}
                    placeholder="低于此数量时高亮提醒" />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>描述</Label>
                <Textarea value={form.description} onChange={e => updateField("description", e.target.value)}
                  placeholder="可选，商品说明/规格" rows={3} />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-3">
                <Link href="/inventory">
                  <Button type="button" variant="outline">取消</Button>
                </Link>
                <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "保存中..." : "保存商品"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
