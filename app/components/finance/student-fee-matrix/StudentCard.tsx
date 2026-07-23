"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ChevronDown, ChevronRight, FileText, CheckCircle, Pencil, GraduationCap, Package, CalendarDays, Utensils, Bus, FolderOpen, BookOpen, School, ClipboardList, Receipt, Banknote, ScrollText, Library } from "lucide-react"
import { createElement, type ComponentType } from "react"
import { useLanguage } from "@/contexts/language-context"

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  GraduationCap, BookOpen, Package, CalendarDays, Utensils, Bus,
  ClipboardList, Receipt, Banknote, ScrollText, School, Library, FolderOpen,
}

const renderCategoryIcon = (iconName: string | undefined, className = "h-3.5 w-3.5") => {
  const Icon = iconName ? ICON_MAP[iconName] : undefined
  return Icon ? createElement(Icon, { className }) : <FolderOpen className={className} />
}
import { ToggleSwitch } from "../ToggleSwitch"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { Fee } from "@/types/fees"
import { Student } from "@/hooks/useStudents"
import type { StudentAdjustment } from "@/hooks/useStudentFees"

interface StudentCardProps {
  student: Student
  isExpanded: boolean
  onToggleExpansion: () => void
  activeFees: Fee[]
  groupedFees: Record<string, Fee[]>
  studentTotal: number
  onCreateInvoice: (studentId: string) => void
  editMode: boolean
  isAssigned: (studentId: string, feeId: string) => boolean
  assignFeeToStudent: (studentId: string, feeId: string) => void
  removeFeeFromStudent: (studentId: string, feeId: string) => void
  hasInvoiceThisMonth: (studentId: string) => boolean
  // Per-student adjustments
  getLocalAdjustment: (studentId: string) => StudentAdjustment
  setLocalDiscount: (studentId: string, discount: number, discount_type?: 'amount' | 'percent') => void
  setLocalSixMonthPay: (studentId: string, val: boolean) => void
  setLocalSixMonthPayRate: (studentId: string, rate: number) => void
}

export const StudentCard = ({
  student, isExpanded, onToggleExpansion,
  activeFees, groupedFees, studentTotal,
  onCreateInvoice, editMode, isAssigned,
  assignFeeToStudent, removeFeeFromStudent,
  hasInvoiceThisMonth,
  getLocalAdjustment, setLocalDiscount,
  setLocalSixMonthPay, setLocalSixMonthPayRate,
}: StudentCardProps) => {
  const studentId = student.id
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set(Object.keys(groupedFees)))
  const [localEditMode, setLocalEditMode] = useState(false)

  const adjustment = getLocalAdjustment ? getLocalAdjustment(studentId) : { discount: 0, six_month_pay: false, six_month_pay_rate: 0 }

  const toggleFeeAssignment = (feeId: string) => {
    if (!editMode && !localEditMode) return
    isAssigned(studentId, feeId)
      ? removeFeeFromStudent(studentId, feeId)
      : assignFeeToStudent(studentId, feeId)
  }

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  return (
    <>
      <Card className="overflow-hidden">
        {/* ── Student Header ── */}
        <div
          className="bg-muted/30 px-5 py-3 border-b cursor-pointer hover:bg-muted/60 transition-colors"
          onClick={onToggleExpansion}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <div>
                <h3 className="font-medium text-sm">{student.student_name}</h3>
                <p className="text-xs text-muted-foreground">{student.standard} · {student.student_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-green-600">RM {studentTotal}</span>
              {hasInvoiceThisMonth(studentId) && <CheckCircle className="h-4 w-4 text-green-500" />}
              <Button
                variant={localEditMode ? "default" : "ghost"}
                size="sm" className="h-7 w-7 p-0"
                onClick={(e) => { e.stopPropagation(); setLocalEditMode(!localEditMode) }}
                title="编辑该学生费用"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={studentTotal === 0}
                onClick={(e) => { e.stopPropagation(); setShowConfirmDialog(true) }}>
                <FileText className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* ── Expanded: flat fee list + adjustments ── */}
        {isExpanded && (
          <CardContent className="p-0">
            {/* ── Discount / Six-Month Pay Panel (visible when editing) ── */}
            {(localEditMode) && (
              <div className="px-5 py-3 bg-blue-50/50 border-b space-y-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">费用调整</p>
                <div className="grid grid-cols-3 gap-3">
                  {/* Discount */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">月折扣 (RM)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={adjustment.discount || 0}
                      onChange={(e) => setLocalDiscount?.(studentId, parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                  {/* Six Month Pay Toggle */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">六月一次付</Label>
                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        checked={adjustment.six_month_pay || false}
                        onCheckedChange={(v) => setLocalSixMonthPay?.(studentId, v)}
                      />
                      <span className="text-xs text-muted-foreground">{adjustment.six_month_pay ? '是' : '否'}</span>
                    </div>
                  </div>
                  {/* Six Month Pay Rate */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">六月付折扣率 (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={((adjustment.six_month_pay_rate || 0) * 100).toFixed(0)}
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value) || 0;
                        setLocalSixMonthPayRate?.(studentId, Math.min(100, Math.max(0, pct)) / 100);
                      }}
                      disabled={!adjustment.six_month_pay}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="divide-y">
              {Object.entries(groupedFees).map(([category, categoryFees]) => {
                const isCollapsed = collapsedCategories.has(category)
                const assignedCount = categoryFees.filter(f => isAssigned(studentId, f.id)).length
                const assignedAmount = categoryFees.filter(f => isAssigned(studentId, f.id)).reduce((s, f) => s + f.amount, 0)
                return (
                  <div key={category} className="px-5 py-3">
                    <button
                      className="flex items-center justify-between w-full mb-2 cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center gap-1.5">
                        {isCollapsed
                          ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                        {renderCategoryIcon(
                          categoryFees.find(f => f.icon)?.icon
                        )}
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{assignedCount}/{categoryFees.length} 项</span>
                        {assignedAmount > 0 && <span className="text-green-600 font-medium">RM {assignedAmount}</span>}
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="space-y-1">
                        {categoryFees.map(fee => {
                          const assigned = isAssigned(studentId, fee.id)
                          return (
                            <div
                              key={fee.id}
                              className={`flex items-center justify-between py-1.5 px-2 rounded transition-colors ${
                                assigned ? "bg-primary/5" : ""
                              } ${editMode ? "hover:bg-accent" : ""}`}
                            >
                              <div className="flex-1 min-w-0">
                                <span className="text-sm">{fee.name}</span>
                                {fee.description && (
                                  <span className="text-xs text-muted-foreground ml-2 truncate">{fee.description}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">RM {fee.amount}</span>
                                <ToggleSwitch
                                  checked={assigned}
                                  onChange={() => toggleFeeAssignment(fee.id)}
                                  disabled={!editMode && !localEditMode}
                                  className={(!editMode && !localEditMode) ? "opacity-50 cursor-not-allowed" : ""}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}

              {activeFees.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  暂无可分配的费用项目
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认开具发票</AlertDialogTitle>
            <AlertDialogDescription>
              确定要为 {student.student_name} 开具发票吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('report.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onCreateInvoice(studentId); setShowConfirmDialog(false) }}>
              确认开具
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
