/**
 * 分行（中心）归属 —— 单一源头
 *
 * 数据现实（2026-09-21 核实）：
 *   - 支出 expenses.centerId  → 直接是 centers.id（UUID）
 *   - 发票 invoices.studentId → students.center(code) / students.centerId(UUID)
 *   - 薪资 teacher_salary_records.teacher_id → teachers.centerId(UUID)
 *   - 银行流水 / 预算 / 收费标准：数据库里没有分行概念（不做）
 *
 * 定位不到分行的记录归入「未分配」，不硬塞到某个分行，
 * 否则分行损益会假平衡。
 */

export const UNASSIGNED_CENTER = '__unassigned__'

export interface CenterOption {
  code: string
  name: string
}

export interface CenterMaps {
  /** centers.id(UUID) → code，如 'o5nzd…' → 'PU1' */
  centerCodeById: Map<string, string>
  /** students.id → code */
  studentCenterCode: Map<string, string>
  /** teachers.id → code */
  teacherCenterCode: Map<string, string>
  /** 分行下拉选项 */
  centers: CenterOption[]
  /** invoices.id → 该发票学生所属分行 code */
  invoiceCenterCode: Map<string, string>
  /** crossCenter=true 的教师：跨两间分行上班，薪资按分行数均分 */
  crossCenterTeacherIds: Set<string>
}

export function buildCenterMaps(
  centers: any[] = [],
  students: any[] = [],
  teachers: any[] = [],
  invoices: any[] = [],
): CenterMaps {
  const centerCodeById = new Map<string, string>()
  const centersList: CenterOption[] = []
  for (const c of centers) {
    if (!c?.id) continue
    const code = String(c.code || '').trim()
    if (!code) continue
    centerCodeById.set(c.id, code)
    centersList.push({ code, name: String(c.name || code) })
  }

  const studentCenterCode = new Map<string, string>()
  for (const st of students) {
    if (!st?.id) continue
    // 优先用 code 字段（students.center），退回 centerId(UUID) 映射
    const code = String(st.center || centerCodeById.get(st.centerId || '') || '').trim()
    if (code) studentCenterCode.set(st.id, code)
  }

  const teacherCenterCode = new Map<string, string>()
  for (const te of teachers) {
    if (!te?.id) continue
    const code = centerCodeById.get(te.centerId || '') || String(te.center || '').trim()
    if (code) teacherCenterCode.set(te.id, code)
  }

  // 跨中心教师（teachers.crossCenter = true）→ 薪资在两间分行间均分
  const crossCenterTeacherIds = new Set<string>()
  for (const te of teachers) {
    if (!te?.id) continue
    if (te.crossCenter === true || te.crossCenter === 'true') crossCenterTeacherIds.add(te.id)
  }

  const invoiceCenterCode = new Map<string, string>()
  for (const inv of invoices) {
    if (!inv?.id) continue
    const sid = inv.studentId || inv.student || ''
    const code = sid ? studentCenterCode.get(sid) : ''
    if (code) invoiceCenterCode.set(inv.id, code)
  }

  return { centerCodeById, studentCenterCode, teacherCenterCode, invoiceCenterCode, centers: centersList, crossCenterTeacherIds }
}

/** 收款 / 退款 / 收据：透过发票反查分行 */
export function centerOfInvoiceId(invoiceId: string | undefined, m: CenterMaps): string {
  if (!invoiceId) return ''
  return m.invoiceCenterCode.get(invoiceId) || ''
}

export function centerOfExpense(expense: any, m: CenterMaps): string {
  return m.centerCodeById.get(expense?.centerId || '') || ''
}

export function centerOfSalary(salary: any, m: CenterMaps): string {
  return m.teacherCenterCode.get(salary?.teacher_id || '') || ''
}

export function centerOfInvoice(invoice: any, m: CenterMaps): string {
  if (!invoice) return ''
  if (invoice.id && m.invoiceCenterCode.has(invoice.id)) return m.invoiceCenterCode.get(invoice.id) || ''
  const sid = invoice.studentId || invoice.student || ''
  return sid ? (m.studentCenterCode.get(sid) || '') : ''
}

/**
 * 薪资的分行拆分权重。
 * - 普通教师：[{ 他的分行, 1 }]
 * - 跨中心教师（crossCenter=true）：在每个分行各 { 1/分行数 }，例如两间 = 各 50%
 * 这样「全部分行」合计不会重复计算，各分行相加仍等于总额。
 */
export function salaryAllocation(salary: any, m: CenterMaps): Array<{ code: string; weight: number }> {
  const tid = salary?.teacher_id || ''
  if (tid && m.crossCenterTeacherIds.has(tid) && m.centers.length > 0) {
    const w = 1 / m.centers.length
    return m.centers.map(c => ({ code: c.code, weight: w }))
  }
  return [{ code: m.teacherCenterCode.get(tid) || '', weight: 1 }]
}

/** 选中的分行是否包含这条记录 */
export function inCenterScope(code: string, selected?: string): boolean {
  if (!selected || selected === 'all') return true
  if (selected === UNASSIGNED_CENTER) return !code
  return code === selected
}
