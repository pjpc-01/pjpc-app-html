"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import NFCBackgroundRunner from "@/app/components/systems/nfc-background-runner"
import { useTheme } from "../hooks/useTheme"
import { useTVBoardData } from "../hooks/useTVBoardData"
import TVBoardHeader from "../components/TVBoardHeader"
import StudentPointsDisplay from "../components/StudentPointsDisplay"
import BirthdaysDisplay from "../components/BirthdaysDisplay"
import AnnouncementsDisplay from "../components/AnnouncementsDisplay"
import { DISPLAY_MS, isSameCenter, compareStudentIds, getDobDate } from "../utils"
import { SlideData } from "../types"

export default function TVBoardByCenter() {
  const params = useParams<{ center: string }>()
  const center = decodeURIComponent(params.center)

  const [idx, setIdx] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // 使用自定义hooks
  const { isBright, wrapClass, colors } = useTheme()
  const { announcements, students, points, ready } = useTVBoardData(center)

  // slides build
  const slides = useMemo(() => {
    const list: SlideData[] = []

    // points pages
    const studentByRecordId: Record<string, any> = {}
    const studentByStudentId: Record<string, any> = {}
    for (const s of students as any[]) {
      const normCenter = (s?.center ?? s?.Center ?? s?.centre ?? s?.branch) as string | undefined
      const merged: any = { ...(s as any), center: normCenter }
      if (merged.id) studentByRecordId[merged.id] = merged
      if (merged.student_id) studentByStudentId[merged.student_id] = merged
    }
    const pts = (points || []).map((p: any) => {
      const expanded = p?.expand?.student_id
      const studentObj: any = Array.isArray(expanded) ? expanded[0] : expanded
      const studentRaw: any = studentObj || studentByRecordId[p.student_id] || studentByStudentId[p.student_id] || null
      const student: any = studentRaw ? { ...(studentRaw as any), center: (studentRaw?.center ?? studentRaw?.Center ?? studentRaw?.centre ?? studentRaw?.branch) as any } : null
      return { ...p, student }
    })
    // 严格按分行过滤
    const studentsFiltered = students.filter(s => isSameCenter(s.center, center))
    let ptsFiltered = pts.filter(p => isSameCenter(p.student?.center, center))

    // 若本分行没有积分记录，用本分行学生合成"0分"占位，避免空白
    if (ptsFiltered.length === 0 && studentsFiltered.length > 0) {
      ptsFiltered = studentsFiltered.map(s => ({
        id: `synthetic-${s.id}`,
        student_id: s.id,
        current_points: 0,
        student: s,
      })) as any
    }
    // 排序：按学号 B* -> G* -> T*，同前缀按数字升序；若 student 缺失则按积分降序兜底
    const sorted = ptsFiltered.sort((a, b) => {
      const aid = a.student?.student_id
      const bid = b.student?.student_id
      if (aid && bid) {
        const cmp = compareStudentIds(aid, bid)
        if (cmp !== 0) return cmp
      }
      return (b.current_points || 0) - (a.current_points || 0)
    })
    const perPage = 15
    for (let i = 0; i < sorted.length; i += perPage) {
      list.push({ type: "student_points", data: sorted.slice(i, i + perPage) })
    }

    // birthdays
    const now = new Date()
    const month = now.getMonth()
    const monthStr = String(month + 1).padStart(2, '0')
    // 本分行当月生日
    console.log('[TV] Debug - All students count:', students.length)
    console.log('[TV] Debug - Current month:', month, 'monthStr:', monthStr)
    console.log('[TV] Debug - Today is:', now.toLocaleDateString('zh-CN'), 'Looking for month:', month + 1)
    console.log('[TV] Debug - Current date:', now.getDate(), 'Current month:', now.getMonth() + 1)
    console.log('[TV] Debug - Today is 2025/9/12, looking for September birthdays')
    
    let monthBirthdays = students
      .filter(s => {
        const isCenterMatch = isSameCenter(s.center, center)
        if ((s.student_id === 'T1' || s.student_id === 'B15') && center === 'WX 02') {
          console.log('[TV]', s.student_id, 'center filter:', { 
            student_center: s.center, 
            target_center: center, 
            isMatch: isCenterMatch,
            dob: s.dob
          })
        }
        return isCenterMatch
      })
      .map(s => ({ s, d: getDobDate(s.dob) }))
      .filter(x => {
        const hasDate = !!x.d
        const hasStringMatch = x.s.dob && String(x.s.dob).includes(`-${monthStr}-`)
        const isMatch = hasDate || hasStringMatch
        if ((x.s.student_id === 'T1' || x.s.student_id === 'B15') && center === 'WX 02') {
          console.log('[TV]', x.s.student_id, 'birthday filter:', { 
            student_id: x.s.student_id, 
            center: x.s.center, 
            dob: x.s.dob, 
            parsedDate: x.d?.toISOString().slice(0,10),
            hasDate, 
            hasStringMatch, 
            isMatch,
            monthStr
          })
        }
        return isMatch
      })
      .filter(x => x.d ? x.d.getMonth() === month : true)
      .sort((a, b) => {
        const da = a.d ? a.d.getDate() : 99
        const db = b.d ? b.d.getDate() : 99
        return da - db
      })
      .map(x => x.s)
    // 生日分页（每页15个），无数据也加入空态页
    console.log('[TV] monthBirthdays count:', monthBirthdays.length, 'for center:', center)
    if (monthBirthdays.length === 0) {
      list.push({ type: "birthdays", data: [] })
    } else {
      const perPageB = 15
      for (let i = 0; i < monthBirthdays.length; i += perPageB) {
        list.push({ type: "birthdays", data: monthBirthdays.slice(i, i + perPageB) })
      }
    }

    // announcements
    if ((announcements || []).length > 0) list.push({ type: "announcements", data: announcements })

    return list.length > 0 ? list : [{ type: "announcements", data: [] }]
  }, [students, points, announcements, center])

  // auto-rotate
  useEffect(() => {
    if (!ready || slides.length === 0) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIdx((v) => (v + 1) % slides.length)
    }, DISPLAY_MS)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [ready, slides.length])

  const current = slides[idx] || null

  const goPrev = () => setIdx((v) => (v - 1 + slides.length) % slides.length)
  const goNext = () => setIdx((v) => (v + 1) % slides.length)

  // keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length])

  return (
    <div className={wrapClass}>
      <NFCBackgroundRunner center={center} enabled={true} />
      {!ready ? (
        <div className={`h-full flex items-center justify-center ${colors.textMuted}`}>加载中...</div>
      ) : !current ? (
        <div className={`h-full flex items-center justify-center ${colors.textMuted}`}>暂无内容</div>
      ) : (
        <div className="h-full w-full flex flex-col">
          {/* 顶部栏组件 */}
          <TVBoardHeader
            center={center}
            isBright={isBright}
            colors={colors}
            currentSlideIndex={idx}
            totalSlides={slides.length}
            currentSlideType={current.type as "student_points" | "birthdays" | "announcements"}
          />

          {/* Content */}
          <div className="flex-1 px-6 pb-4 pt-2 tv-fade">
            {current && current.type === "student_points" && (
              <StudentPointsDisplay
                data={current.data}
                isBright={isBright}
                colors={colors}
                currentPageIndex={idx}
              />
            )}

            {current && current.type === "birthdays" && (
              <BirthdaysDisplay
                data={current.data}
                isBright={isBright}
                colors={colors}
              />
            )}

            {current && current.type === "announcements" && (
              <AnnouncementsDisplay
                data={current.data}
                isBright={isBright}
                colors={colors}
              />
            )}
          </div>

          {/* Slide indicators */}
          <div className="pb-4 px-6 flex items-center justify-center gap-2">
            {slides.map((s, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? `w-8 ${colors.indicatorActive}` : `w-3 ${colors.indicator}`}`}></div>
            ))}
          </div>

          {/* Manual controls */}
          <div className="pointer-events-none fixed inset-0 flex items-center justify-between px-2 md:px-6">
            <button
              aria-label="上一页"
              onClick={goPrev}
              className="pointer-events-auto h-12 w-12 md:h-14 md:w-14 rounded-full bg-black/20 text-white/80 text-2xl flex items-center justify-center hover:bg-black/30 transition shadow-lg border border-white/10"
            >
              ‹
            </button>
            <button
              aria-label="下一页"
              onClick={goNext}
              className="pointer-events-auto h-12 w-12 md:h-14 md:w-14 rounded-full bg-black/20 text-white/80 text-2xl flex items-center justify-center hover:bg-black/30 transition shadow-lg border border-white/10"
            >
              ›
            </button>
          </div>
        </div>
      )}
      {/* local animations */}
      <style jsx global>{`
        @keyframes tvFadeSlide { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
        .tv-fade { animation: tvFadeSlide 420ms ease; }
        @keyframes tvMarquee { 0% { transform: translateX(100%);} 100% { transform: translateX(-100%);} }
        .tv-marquee { animation: tvMarquee 20s linear infinite; }
      `}</style>
    </div>
  )
}