"use client"

import { useEffect } from 'react'
import { X, Printer, GraduationCap, Clock } from 'lucide-react'

export interface PreviewCell {
  title: string
  subject?: string
  teacher?: string
  colorClass?: string
}

export interface PreviewSlot {
  start: string
  end: string
}

interface Props {
  open: boolean
  onClose: () => void
  gradeLabel: string
  days: { key: string; label: string }[]
  slots: PreviewSlot[]
  /** key = `${dayKey}|${slotIndex}` */
  cells: Record<string, PreviewCell[]>
  centerName?: string
}

/**
 * 时间表全屏预览 —— 只读、无任何编辑控件，适合给家长/学生展示或投屏。
 * 配色柔和、字号放大，Esc 或右上角关闭，支持打印。
 */
export default function TimetablePreview({
  open, onClose, gradeLabel, days, slots, cells, centerName = 'PJPC 安亲班',
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const totalCells = slots.length * days.length
  let filled = 0
  for (let i = 0; i < slots.length; i++) {
    for (const d of days) {
      if ((cells[`${d.key}|${i}`] || []).length > 0) filled++
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 overflow-auto print:static print:bg-white">
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-grid { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>

      <div className="max-w-[1500px] mx-auto px-6 py-8 print:px-0 print:py-0">
        {/* 顶部 — 标题 + 操作 */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 print:shadow-none">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <div className="text-sm font-medium text-indigo-600 tracking-wide uppercase">
                {centerName}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                每周课程时间表
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                  {gradeLabel}
                </span>
                <span>{slots.length} 个时段 · {days.length} 天 · 已排 {filled}/{totalCells} 格</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 no-print">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium shadow-sm"
            >
              <Printer className="h-4 w-4" /> 打印
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm"
            >
              <X className="h-4 w-4" /> 关闭
            </button>
          </div>
        </div>

        {/* 网格 */}
        <div className="print-grid rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
          {/* 表头 */}
          <div
            className="grid bg-gradient-to-r from-gray-50 to-gray-100/70 border-b border-gray-200"
            style={{ gridTemplateColumns: `130px repeat(${days.length}, minmax(0, 1fr))` }}
          >
            <div className="px-3 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-center gap-1">
              <Clock className="h-3.5 w-3.5" /> 时段
            </div>
            {days.map(d => (
              <div key={d.key} className="px-3 py-4 text-center">
                <div className="text-base font-bold text-gray-800">{d.label}</div>
              </div>
            ))}
          </div>

          {/* 行 */}
          {slots.map((slot, si) => (
            <div
              key={`${slot.start}-${si}`}
              className={`grid border-b border-gray-100 last:border-b-0 ${si % 2 ? 'bg-gray-50/40' : 'bg-white'}`}
              style={{ gridTemplateColumns: `130px repeat(${days.length}, minmax(0, 1fr))` }}
            >
              <div className="px-3 py-4 flex flex-col items-center justify-center border-r border-gray-100">
                <div className="text-sm font-bold text-gray-700 tabular-nums">{slot.start}</div>
                <div className="text-[11px] text-gray-400 tabular-nums mt-0.5">{slot.end}</div>
              </div>
              {days.map(d => {
                const list = cells[`${d.key}|${si}`] || []
                return (
                  <div key={`${d.key}-${si}`} className="p-2 min-h-[74px] border-r border-gray-100 last:border-r-0">
                    {list.length === 0 ? (
                      <div className="h-full" />
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {list.map((c, ci) => (
                          <div
                            key={ci}
                            className={`rounded-lg border px-2.5 py-2 ${c.colorClass || 'bg-slate-50 border-slate-200'}`}
                          >
                            <div className="text-[13px] font-semibold leading-snug text-gray-800">
                              {c.title}
                            </div>
                            {c.teacher && (
                              <div className="text-[11px] text-gray-600 mt-0.5 truncate">
                                {c.teacher}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="mt-5 text-center text-xs text-gray-400 print:mt-3">
          课程如有调整以中心最新通知为准 · {centerName}
        </div>
      </div>
    </div>
  )
}
