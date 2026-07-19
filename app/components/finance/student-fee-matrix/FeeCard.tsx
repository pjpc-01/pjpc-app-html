"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ChevronDown, ChevronRight, FileText, CheckCircle, Pencil,
  GraduationCap, MapPin, Phone, Mail, CreditCard,
  Package, CalendarDays, Utensils, Bus, FolderOpen, BookOpen, School,
  ClipboardList, Receipt, Banknote, ScrollText, Library, User
} from "lucide-react"
import { createElement, type ComponentType, useState } from "react"
import { Fee } from "@/types/fees"
import { Student } from "@/hooks/useStudents"
import type { StudentAdjustment } from "@/hooks/useStudentFees"

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  GraduationCap, BookOpen, Package, CalendarDays, Utensils, Bus,
  ClipboardList, Receipt, Banknote, ScrollText, School, Library, FolderOpen,
}

const renderCategoryIcon = (iconName: string | undefined, className = "h-3.5 w-3.5") => {
  const Icon = iconName ? ICON_MAP[iconName] : undefined
  return Icon ? createElement(Icon, { className }) : <FolderOpen className={className} />
}

interface FeeCardProps {
  student: Student
  activeFees: Fee[]
  groupedFees: Record<string, Fee[]>
  studentTotal: number
  onCreateInvoice: (studentId: string) => void
  editMode: boolean
  isAssigned: (studentId: string, feeId: string) => boolean
  assignFeeToStudent: (studentId: string, feeId: string) => void
  removeFeeFromStudent: (studentId: string, feeId: string) => void
  hasInvoiceThisMonth: (studentId: string) => boolean
  getLocalAdjustment: (studentId: string) => StudentAdjustment
  setLocalDiscount: (studentId: string, discount: number, discount_type?: 'amount' | 'percent') => void
  toggleLocalSixMonthFeeId: (studentId: string, feeId: string) => void
  setLocalSixMonthPayRate: (studentId: string, rate: number) => void
  setLocalSixMonthPayRateType: (studentId: string, rateType: 'amount' | 'percent') => void
}

export const FeeCard = ({
  student, activeFees, groupedFees, studentTotal,
  onCreateInvoice, editMode, isAssigned,
  assignFeeToStudent, removeFeeFromStudent, hasInvoiceThisMonth,
  getLocalAdjustment, setLocalDiscount, toggleLocalSixMonthFeeId, setLocalSixMonthPayRate, setLocalSixMonthPayRateType,
}: FeeCardProps) => {
  const studentId = student.id
  const [expanded, setExpanded] = useState(false)
  const [localEditMode, setLocalEditMode] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set(Object.keys(groupedFees)))
  const [showInvoiceConfirm, setShowInvoiceConfirm] = useState(false)

  const adjustment = getLocalAdjustment?.(studentId) || { discount: 0, discount_type: 'amount' as const, six_month_fee_ids: [] as string[], six_month_pay_rate: 0, six_month_pay_rate_type: 'percent' as const }
  const initial = (student.student_name || "?")[0]
  const guardian = student.father_name || student.mother_name || student.parentName || "-"
  const guardianPhone = student.father_phone || student.mother_phone || student.parentPhone || "-"
  const hasInvoice = hasInvoiceThisMonth?.(studentId)

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const assignedCount = activeFees.filter(f => isAssigned?.(studentId, f.id)).length

  return (
    <Card className="overflow-hidden border border-slate-200 hover:shadow-md transition-shadow duration-200">
      {/* ── Card Header ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0 bg-gradient-to-br from-amber-400 to-amber-600">
            <AvatarFallback className="text-white font-bold">{initial}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm text-slate-900 truncate">{student.student_name}</h3>
              {hasInvoice ? (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4">已开单</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-blue-200 text-blue-600">待开单</Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{student.student_id}</p>
          </div>
        </div>

        {/* Detail row */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <GraduationCap className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate">{student.standard || "-"}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate">{student.center || "-"}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate">{guardian}</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate">{guardianPhone}</span>
          </div>
        </div>
      </div>

      {/* ── Fee total & actions ── */}
      <div className="px-4 py-3 bg-slate-50/80 border-t border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-emerald-500" />
          <span className="text-lg font-bold text-emerald-600">RM {studentTotal}</span>
          {studentTotal > 0 && (
            <span className="text-xs text-slate-400">({assignedCount}项)</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="sm" className="h-7 text-xs"
            onClick={(e) => { e.stopPropagation(); setLocalEditMode(!localEditMode) }}
          >
            <Pencil className="h-3 w-3 mr-1" />
            {localEditMode ? '完成' : '调整'}
          </Button>
          <Button
            variant="outline" size="sm" className="h-7 text-xs"
            disabled={studentTotal === 0 || hasInvoice}
            onClick={(e) => { e.stopPropagation(); onCreateInvoice?.(studentId) }}
          >
            <FileText className="h-3 w-3 mr-1" />
            开单
          </Button>
          <Button
            variant="ghost" size="sm" className="h-7 w-7 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* ── Expanded: fee items + adjustments ── */}
      {expanded && (
        <CardContent className="p-0">
          {/* Discount panel */}
          {(editMode || localEditMode) && (
            <div className="px-4 py-3 bg-blue-50/50 border-b space-y-2">
              <p className="text-xs font-semibold text-blue-700">费用调整</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-slate-500">
                    月折扣({adjustment.discount_type === 'percent' ? '%' : 'RM'})
                  </Label>
                  <div className="flex gap-1">
                    <Input
                      type="number" min="0" step="1"
                      value={adjustment.discount || 0}
                      onChange={(e) => setLocalDiscount?.(studentId, parseFloat(e.target.value) || 0)}
                      className="h-7 text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newType = adjustment.discount_type === 'percent' ? 'amount' : 'percent'
                        setLocalDiscount?.(studentId, adjustment.discount || 0, newType)
                      }}
                      className={`h-7 w-7 rounded text-[10px] font-bold shrink-0 border ${
                        adjustment.discount_type === 'percent'
                          ? 'bg-purple-100 text-purple-700 border-purple-300'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {adjustment.discount_type === 'percent' ? '%' : 'RM'}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500">
                    预付折扣({adjustment.six_month_pay_rate_type === 'percent' ? '%' : 'RM'})
                  </Label>
                  <div className="flex gap-1">
                    <Input
                      type="number" min="0" max={adjustment.six_month_pay_rate_type === 'percent' ? "100" : undefined} step="1"
                      value={adjustment.six_month_pay_rate_type === 'percent' ? ((adjustment.six_month_pay_rate || 0) * 100).toFixed(0) : (adjustment.six_month_pay_rate || 0).toFixed(0)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        if (adjustment.six_month_pay_rate_type === 'percent') {
                          setLocalSixMonthPayRate?.(studentId, Math.min(100, Math.max(0, val)) / 100)
                        } else {
                          setLocalSixMonthPayRate?.(studentId, Math.max(0, val))
                        }
                      }}
                      disabled={!adjustment.six_month_fee_ids?.length}
                      className="h-7 text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newType = adjustment.six_month_pay_rate_type === 'percent' ? 'amount' : 'percent'
                        setLocalSixMonthPayRateType?.(studentId, newType)
                      }}
                      className={`h-7 w-7 rounded text-[10px] font-bold shrink-0 border ${
                        adjustment.six_month_pay_rate_type === 'percent'
                          ? 'bg-purple-100 text-purple-700 border-purple-300'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {adjustment.six_month_pay_rate_type === 'percent' ? '%' : 'RM'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fee items by category */}
          <div className="divide-y">
            {Object.entries(groupedFees).map(([cat, fees]) => {
              const isCollapsed = collapsedCategories.has(cat)
              const catAssigned = fees.filter(f => isAssigned?.(studentId, f.id)).length
              const catAmount = fees.filter(f => isAssigned?.(studentId, f.id)).reduce((s, f) => s + f.amount, 0)
              return (
                <div key={cat} className="px-4 py-2">
                  <button
                    className="flex items-center justify-between w-full cursor-pointer hover:text-slate-900 text-slate-500"
                    onClick={() => toggleCategory(cat)}
                  >
                    <div className="flex items-center gap-1.5">
                      {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {renderCategoryIcon(fees.find(f => f.icon)?.icon, "h-3 w-3")}
                      <span className="text-[11px] font-semibold uppercase">{cat}</span>
                    </div>
                    <span className="text-[11px]">{catAssigned}/{fees.length} · {catAmount > 0 ? `RM${catAmount}` : ''}</span>
                  </button>
                  {!isCollapsed && (
                    <div className="mt-1 space-y-0.5">
                      {fees.map(fee => {
                        const assigned = isAssigned?.(studentId, fee.id)
                        return (
                          <div
                            key={fee.id}
                            className={`flex items-center justify-between py-1 px-1.5 rounded text-xs cursor-pointer ${
                              assigned ? "bg-amber-50" : ""
                            } ${(editMode || localEditMode) ? "hover:bg-slate-100" : ""}`}
                            onClick={() => {
                              if (editMode || localEditMode) {
                                assigned
                                  ? removeFeeFromStudent?.(studentId, fee.id)
                                  : assignFeeToStudent?.(studentId, fee.id)
                              }
                            }}
                          >
                            <span className="truncate">{fee.name}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              {(editMode || localEditMode) && assigned && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleLocalSixMonthFeeId?.(studentId, fee.id) }}
                                  className={`text-[10px] px-1 py-0.5 rounded border ${
                                    adjustment.six_month_fee_ids?.includes(fee.id)
                                      ? 'bg-amber-100 border-amber-400 text-amber-700'
                                      : 'border-slate-200 text-slate-400'
                                  }`}
                                >6月</button>
                              )}
                              <span className="text-slate-400">RM{fee.amount}</span>
                              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                assigned ? "bg-amber-500 border-amber-500 text-white" : "border-slate-300"
                              }`}>
                                {assigned && <CheckCircle className="h-2.5 w-2.5" />}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
