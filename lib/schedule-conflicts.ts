// ⏰ 排课冲突检测工具
// 检测教师时间重叠、排班冲突

export interface TimeSlot {
  teacher_id: string
  teacher_name?: string
  date: string       // 'yyyy-MM-dd'
  start_time: string // 'HH:mm'
  end_time: string   // 'HH:mm'
  id?: string
  notes?: string
}

export interface ConflictResult {
  hasConflict: boolean
  conflicts: Conflict[]
}

export interface Conflict {
  type: 'time_overlap' | 'exceeds_max_hours'
  withSchedule: TimeSlot
  description: string
  severity: 'error' | 'warning'
}

// ============================================================
// 时间解析
// ============================================================

function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}小时${m > 0 ? `${m}分钟` : ''}` : `${m}分钟`
}

// ============================================================
// 核心冲突检测
// ============================================================

/**
 * 检测单个排班是否与现有排班冲突
 */
export function detectConflicts(
  newSlot: TimeSlot,
  existingSlots: TimeSlot[]
): ConflictResult {
  const conflicts: Conflict[] = []

  const newStart = parseTime(newSlot.start_time)
  const newEnd = parseTime(newSlot.end_time)

  for (const existing of existingSlots) {
    // 跳过自己
    if (existing.id && existing.id === newSlot.id) continue
    // 必须是同一天同一教师
    if (existing.date !== newSlot.date) continue
    if (existing.teacher_id !== newSlot.teacher_id) continue

    const existStart = parseTime(existing.start_time)
    const existEnd = parseTime(existing.end_time)

    // 时间重叠检测: [newStart, newEnd) ∩ [existStart, existEnd) ≠ ∅
    if (newStart < existEnd && newEnd > existStart) {
      const overlapStart = Math.max(newStart, existStart)
      const overlapEnd = Math.min(newEnd, existEnd)
      const overlapMinutes = overlapEnd - overlapStart

      conflicts.push({
        type: 'time_overlap',
        withSchedule: existing,
        description:
          `⏰ 与 ${existing.teacher_name || '同一位教师'} 的 ` +
          `${existing.start_time}-${existing.end_time} 排班冲突 ` +
          `（重叠 ${formatDuration(overlapMinutes)}）`,
        severity: 'error',
      })
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  }
}

/**
 * 批量检测：检查一组排班中所有冲突
 */
export function detectAllConflicts(slots: TimeSlot[]): ConflictResult {
  const allConflicts: Conflict[] = []
  const checked = new Set<string>()

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i]
      const b = slots[j]

      if (a.date !== b.date || a.teacher_id !== b.teacher_id) continue

      const aStart = parseTime(a.start_time)
      const aEnd = parseTime(a.end_time)
      const bStart = parseTime(b.start_time)
      const bEnd = parseTime(b.end_time)

      if (aStart < bEnd && aEnd > bStart) {
        const overlapStart = Math.max(aStart, bStart)
        const overlapEnd = Math.min(aEnd, bEnd)
        const overlapMinutes = overlapEnd - overlapStart

        // 用组合 key 避免重复
        const key = [a.id, b.id].sort().join('-')
        if (checked.has(key)) continue
        checked.add(key)

        allConflicts.push({
          type: 'time_overlap',
          withSchedule: b,
          description:
            `⏰ 教师 ${a.teacher_name || '同一位教师'} 在 ${a.date} ` +
            `有 ${a.start_time}-${a.end_time} 和 ${b.start_time}-${b.end_time} ` +
            `重叠 ${formatDuration(overlapMinutes)}`,
          severity: 'error',
        })
      }
    }
  }

  return {
    hasConflict: allConflicts.length > 0,
    conflicts: allConflicts,
  }
}

// ============================================================
// 工时上限检测
// ============================================================

/**
 * 检测教师一周工时是否超限
 */
export function detectOvertime(
  teacherId: string,
  weekSlots: TimeSlot[],
  maxHoursPerWeek: number = 40
): ConflictResult {
  const teacherSlots = weekSlots.filter(s => s.teacher_id === teacherId)
  const totalMinutes = teacherSlots.reduce((sum, s) => {
    return sum + (parseTime(s.end_time) - parseTime(s.start_time))
  }, 0)
  const totalHours = totalMinutes / 60

  if (totalHours > maxHoursPerWeek) {
    return {
      hasConflict: true,
      conflicts: [{
        type: 'exceeds_max_hours',
        withSchedule: teacherSlots[teacherSlots.length - 1],
        description:
          `⚠️ 教师本周总工时 ${totalHours.toFixed(1)} 小时，` +
          `超过上限 ${maxHoursPerWeek} 小时`,
        severity: 'warning',
      }],
    }
  }

  return { hasConflict: false, conflicts: [] }
}

// ============================================================
// 获取冲突颜色/badge
// ============================================================

export function getConflictBadge(count: number): {
  label: string
  color: string
} {
  if (count === 0) return { label: '无冲突', color: 'bg-emerald-100 text-emerald-700' }
  if (count <= 2) return { label: `${count} 个冲突`, color: 'bg-amber-100 text-amber-700' }
  return { label: `${count} 个冲突`, color: 'bg-red-100 text-red-700' }
}
