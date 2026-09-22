"use client"

/**
 * 支出类别管理 —— 添加 / 改名 / 改色 / 排序 / 删除
 *
 * 删除是软删（deleted=true）：下拉里消失，但历史支出仍显示原名称。
 * 若类别已被支出使用，删除前会提示笔数。
 */

import { useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, Tags, AlertTriangle } from "lucide-react"
import { CATEGORY_PALETTE, type ExpenseCategory } from "@/hooks/useExpenseCategories"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  categories: ExpenseCategory[]
  expenses: any[]
  onCreate: (name: string, color: string) => Promise<void>
  onRename: (id: string, name: string) => Promise<void>
  onSetColor: (id: string, color: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onMove: (id: string, dir: -1 | 1) => Promise<void>
}

export default function ExpenseCategoryManager({
  open, onOpenChange, categories, expenses, onCreate, onRename, onSetColor, onRemove, onMove,
}: Props) {
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(CATEGORY_PALETTE[0])
  const [busy, setBusy] = useState(false)
  const [draftNames, setDraftNames] = useState<Record<string, string>>({})
  const [confirmDel, setConfirmDel] = useState<{ cat: ExpenseCategory; count: number } | null>(null)

  const usageOf = (key: string) => expenses.filter((e: any) => e.category === key && e.deleted !== true).length

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    if (categories.some(c => c.name === name)) { alert("已经有同名类别了"); return }
    setBusy(true)
    try {
      await onCreate(name, newColor)
      setNewName("")
      setNewColor(CATEGORY_PALETTE[(categories.length + 1) % CATEGORY_PALETTE.length])
    } catch (e: any) { alert(e?.message || "添加失败") } finally { setBusy(false) }
  }

  const askDelete = (cat: ExpenseCategory) => {
    const count = usageOf(cat.key)
    if (count > 0) { setConfirmDel({ cat, count }); return }
    if (confirm(`确定删除类别「${cat.name}」？`)) onRemove(cat.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-amber-600" /> 管理支出类别
          </DialogTitle>
          <DialogDescription>
            可添加、改名、改色、排序、删除。改名不影响历史记录；删除的类别不再出现在下拉，但旧记录仍显示原名称。
          </DialogDescription>
        </DialogHeader>

        {/* 现有类别 */}
        <div className="divide-y border rounded-lg">
          {categories.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">还没有类别，先添加一个</div>
          )}
          {categories.map((cat, idx) => {
            const used = usageOf(cat.key)
            const draft = draftNames[cat.id] ?? cat.name
            return (
              <div key={cat.id} className="flex items-center gap-2 p-2">
                <input
                  type="color"
                  value={cat.color}
                  onChange={e => onSetColor(cat.id, e.target.value)}
                  className="h-8 w-8 rounded border cursor-pointer shrink-0 bg-transparent p-0.5"
                  title="改颜色"
                />
                <Input
                  value={draft}
                  onChange={e => setDraftNames(p => ({ ...p, [cat.id]: e.target.value }))}
                  onBlur={() => {
                    const v = (draftNames[cat.id] ?? "").trim()
                    if (v && v !== cat.name) onRename(cat.id, v)
                    else setDraftNames(p => { const q = { ...p }; delete q[cat.id]; return q })
                  }}
                  onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
                  className="h-8 flex-1 text-sm"
                />
                <Badge variant="outline" className="text-[10px] shrink-0" style={{ color: cat.color, borderColor: cat.color + "55", backgroundColor: cat.color + "14" }}>
                  {used} 笔
                </Badge>
                <div className="flex items-center shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={idx === 0} onClick={() => onMove(cat.id, -1)} title="上移">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={idx === categories.length - 1} onClick={() => onMove(cat.id, 1)} title="下移">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => askDelete(cat)} title="删除">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* 添加 */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="color"
            value={newColor}
            onChange={e => setNewColor(e.target.value)}
            className="h-9 w-9 rounded border cursor-pointer shrink-0 bg-transparent p-0.5"
            title="新类别颜色"
          />
          <Input
            placeholder="新类别名称，例如：维修费"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAdd() }}
            className="h-9 flex-1"
          />
          <Button onClick={handleAdd} disabled={busy || !newName.trim()} className="h-9 bg-amber-600 hover:bg-amber-700">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> 添加</>}
          </Button>
        </div>

        {/* 删除确认（类别在用） */}
        {confirmDel && (
          <div className="border border-amber-300 bg-amber-50 rounded-lg p-3 text-sm">
            <p className="flex items-center gap-2 font-medium text-amber-800">
              <AlertTriangle className="h-4 w-4" /> 「{confirmDel.cat.name}」正被 {confirmDel.count} 笔支出使用
            </p>
            <p className="text-amber-700 mt-1 text-xs">
              删除后这 {confirmDel.count} 笔历史记录仍会显示「{confirmDel.cat.name}」，但新建支出时不再有这个选项。
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => setConfirmDel(null)}>取消</Button>
              <Button size="sm" variant="destructive" onClick={async () => { await onRemove(confirmDel.cat.id); setConfirmDel(null) }}>
                仍要删除
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="outline" onClick={() => onOpenChange(false)}>关闭</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
