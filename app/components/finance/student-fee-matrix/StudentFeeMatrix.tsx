'use client'

import { useState, useMemo, useEffect } from "react"
import { useFees } from "@/hooks/useFees"
import { useStudents } from "@/hooks/useStudents"
import { useStudentFees } from "@/hooks/useStudentFees"
import { useInvoices } from "@/hooks/useInvoices"
import { StudentFeeMatrixHeader } from "./StudentFeeMatrixHeader"
import { SearchAndFilter } from "./SearchAndFilter"
import { FeeCard } from "./FeeCard"
import { useLanguage } from "@/contexts/language-context"
import { toLocalMonthKey } from "@/lib/utils"
import { buildInvoiceLines, resolveInvoicePeriod } from "@/lib/invoice-build"
import { gradeRank } from "@/lib/grades"

export const StudentFeeMatrix = () => {
  const { t } = useLanguage()
  const { fees } = useFees()
  const { students } = useStudents()
  const { isAssigned, getStudentAmount, assignFeeToStudent, removeFeeFromStudent, enterEditMode, exitEditMode,
    loading: studentFeesLoading, error: studentFeesError, fetchStudentFees,
    setLocalDiscount, toggleLocalSixMonthFeeId, setLocalSixMonthPayRate, setLocalSixMonthPayRateType, getLocalAdjustment, isEditMode: hookEditMode } = useStudentFees()
  const { createInvoice: createInvoiceFromHook, invoices } = useInvoices()

  const [studentInvoices, setStudentInvoices] = useState<Map<string, boolean>>(new Map())
  const [editMode, setEditMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all")
  const [batchMode, setBatchMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  // 只在「第一次加载」显示加载画面 —— 否则每次后台刷新都会整页卸载、卡片状态全丢
  const [everLoaded, setEverLoaded] = useState(false)
  useEffect(() => { if (!studentFeesLoading) setEverLoaded(true) }, [studentFeesLoading])

  const allFees = fees

  const groupedFees = useMemo(() => {
    return allFees.reduce((groups, fee) => {
      const cat = fee.category || "未分类"
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(fee)
      return groups
    }, {} as Record<string, typeof allFees>)
  }, [allFees])

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (s.status === 'graduated') return false
      if (selectedGradeFilter !== "all" && s.standard !== selectedGradeFilter) return false
      if (!searchTerm.trim()) return true
      const q = searchTerm.toLowerCase()
      return (s.student_name?.toLowerCase().includes(q) || s.student_id?.toLowerCase().includes(q) || s.standard?.toLowerCase().includes(q))
    })
  }, [students, searchTerm, selectedGradeFilter])

  const availableGrades = useMemo(() => {
    const grades = [...new Set(students.filter(s => s.status !== 'graduated' && s.standard).map(s => s.standard!))]
    // 排序统一走 @/lib/grades（原来只给了小学 6 级，中学全部并列 99）
    return grades.sort((a, b) => gradeRank(a) - gradeRank(b))
  }, [students])

  // ⚠️ 只在第一次加载时显示加载画面。以前这里无条件判 loading —— 而每次改天数都会
  //    触发 onRefreshFees → setLoading(true) → 整页被替换成「加载中」→ 所有 FeeCard
  //    被卸载，展开状态和刚调的天数全丢，重挂后回到默认 1 天。
  if (studentFeesLoading && !everLoaded) return <div className="py-12 text-center text-muted-foreground">{t('teacher.loading')}</div>
  if (studentFeesError) return <div className="py-12 text-center text-red-600">{t("加载失败:")} {studentFeesError}</div>

  const createInvoice = async (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    if (!student) return
    let adj = getLocalAdjustment(studentId)
    const assignedFees = allFees.filter(f => isAssigned(studentId, f.id))
    const feeQuantities: Record<string, number> = {}

    // 折扣与数量以 PB 的 student_fees 为准
    try {
      const r = await fetch(`/api/pocketbase-proxy/api/collections/student_fees/records?filter=(student_id='${studentId}')&perPage=1`)
      if (r.ok) {
        const data = await r.json()
        if (data.items?.length > 0) {
          adj = { ...adj, discount: data.items[0].discount || 0, discount_type: data.items[0].discount_type || 'amount' }
          const fi = typeof data.items[0].fee_items === 'string' ? JSON.parse(data.items[0].fee_items) : (data.items[0].fee_items || [])
          fi.forEach((x: any) => { if (x.active) feeQuantities[x.id] = x.quantity || 1 })
        }
      }
    } catch {}

    // 明细与总额一律走开票唯一实现（和批量开票同一套）
    const built = buildInvoiceLines({
      lines: assignedFees.map(f => ({
        id: f.id,
        name: f.name || '费用',
        amount: (f.amount || 0) * (feeQuantities[f.id] || 1),
        type: (f as any).type,
      })),
      sixMonthFeeIds: adj.six_month_fee_ids || [],
      sixMonthPayRate: adj.six_month_pay_rate || 0,
      sixMonthPayRateType: (adj.six_month_pay_rate_type || 'percent') as 'amount' | 'percent',
      discount: adj.discount || 0,
      discountType: (adj.discount_type || 'amount') as 'amount' | 'percent',
    })
    const items = built.items
    const total = built.total
    const discount = Number(adj.discount || 0)
    const discountType = (adj.discount_type || 'amount') as 'amount' | 'percent'

    // 迟付款须知
    let latePaymentRule = ''
    try {
      const res = await fetch('/api/pocketbase-proxy/api/collections/invoice_settings/records?filter=(isDefault=true)&perPage=1')
      if (res.ok) {
        const data = await res.json()
        if (data.items?.length > 0) latePaymentRule = data.items[0].latePaymentRule || ''
      }
    } catch {}

    const period = resolveInvoicePeriod()
    createInvoiceFromHook({
      studentId, studentName: student.student_name || '', studentGrade: student.standard || '',
      studentNumber: student.student_id || '',
      totalAmount: total, items, status: 'issued',
      period,
      issueDate: new Date().toISOString().split('T')[0],
      // 到期日跟批量开票一致：账期月 7 号（12 月学费 → 12-07），不再用「今天+15天」
      dueDate: `${period}-07`,
      notes: `${Number(period.slice(5, 7))}月学费`,
      discount: built.discountAmount || undefined,
      discountType: built.discountAmount > 0 ? 'amount' : undefined,
      latePaymentRule: latePaymentRule || undefined,
    })
    setStudentInvoices(prev => { const m = new Map(prev); m.set(studentId, true); return m })
  }

  const hasInvoiceThisMonth = (studentId: string) => {
    // 按账期判断「这个月已经开过票」，不要用开票日 —— 开票日 10-25 开的可能是 11 月的账期
    const p = resolveInvoicePeriod()
    return invoices.some(i => i.studentId === studentId && (i as any).period === p)
  }

  const toggleEditMode = async () => {
    if (!editMode) { enterEditMode(); setEditMode(true) }
    else {
      setIsSaving(true)
      try {
        const result = await exitEditMode()
        if (result?.failures?.length === 0) {
          setEditMode(false)
          // 折扣改完顺手同步到还没缴清的发票 —— 以前只写 student_fees，
          // 发票还是原价，用户以为折扣没算（2026-10-26 反馈）
          try {
            const sync = await fetch('/api/billing/reapply-discounts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dryRun: false }),
            }).then(r => r.json())
            if (sync?.success && sync.updated > 0) {
              alert(`${t("已保存，并同步更新")} ${sync.updated} ${t("张未缴清发票的折扣")}`)
            }
          } catch { /* 同步失败不影响保存本身，去发票管理按「重算折扣」还能补 */ }
        } else alert(`${t("保存失败：")}${result?.failures?.length || 0} ${t("条未保存")}`)
      } catch { alert(t("保存失败")) }
      finally { setIsSaving(false) }
    }
  }

  return (
    <div className="space-y-6">
      <StudentFeeMatrixHeader
        editMode={editMode} onToggleEditMode={toggleEditMode}
        batchMode={batchMode} onToggleBatchMode={() => setBatchMode(!batchMode)}
        isSaving={isSaving}
      />
      <SearchAndFilter
        searchTerm={searchTerm} onSearchChange={setSearchTerm} onClearSearch={() => setSearchTerm("")}
        selectedGradeFilter={selectedGradeFilter} onGradeFilterChange={setSelectedGradeFilter}
        availableGrades={availableGrades} filteredStudentsCount={filteredStudents.length} totalStudentsCount={students.length}
      />

      {filteredStudents.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">{t("没有匹配的学生")}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {filteredStudents.map(student => (
            <FeeCard
              key={student.id}
              student={student}
              activeFees={allFees}
              groupedFees={groupedFees}
              studentTotal={getStudentAmount(student.id, allFees)}
              onCreateInvoice={createInvoice}
              editMode={editMode}
              isAssigned={isAssigned}
              assignFeeToStudent={assignFeeToStudent}
              removeFeeFromStudent={removeFeeFromStudent}
              hasInvoiceThisMonth={hasInvoiceThisMonth}
              getLocalAdjustment={getLocalAdjustment}
              setLocalDiscount={setLocalDiscount}
              toggleLocalSixMonthFeeId={toggleLocalSixMonthFeeId}
              setLocalSixMonthPayRate={setLocalSixMonthPayRate}
              setLocalSixMonthPayRateType={setLocalSixMonthPayRateType}
              onRefreshFees={fetchStudentFees}
            />
          ))}
        </div>
      )}
    </div>
  )
}
