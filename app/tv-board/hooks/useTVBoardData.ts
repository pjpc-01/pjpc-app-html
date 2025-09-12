import { useEffect, useState } from "react"
import { AnnouncementItem, Student, StudentPoints } from "../types"
import { isSameCenter } from "../utils"

export function useTVBoardData(center: string) {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [points, setPoints] = useState<StudentPoints[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const fetchJson = async (url: string) => {
          const r = await fetch(url)
          if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
          return r.json()
        }

        // students: 多级回退
        let stuJson: any = null
        try {
          // 优先使用更稳定的 list 端点，减少 500 噪声
          stuJson = await fetchJson(`/api/students/list?center=${encodeURIComponent(center)}&limit=1000`)
        } catch {
          try {
            stuJson = await fetchJson(`/api/students/list-alternative?center=${encodeURIComponent(center)}&limit=1000`)
          } catch {
            stuJson = await fetchJson(`/api/students?center=${encodeURIComponent(center)}&limit=1000`)
          }
        }

        // 如果按分行获取失败或为空，退化为全量获取后前端筛选
        let studentList: any[] = Array.isArray(stuJson?.students) ? stuJson.students : []
        if (studentList.length === 0) {
          try {
            const allA = await fetchJson(`/api/students?limit=1000`)
            studentList = Array.isArray(allA?.students) ? allA.students : []
          } catch {
            try {
              const allB = await fetchJson(`/api/students/list?limit=1000`)
              studentList = Array.isArray(allB?.students) ? allB.students : []
            } catch {
              const allC = await fetchJson(`/api/students/list-alternative?limit=1000`)
              studentList = Array.isArray(allC?.students) ? allC.students : []
            }
          }
        }

        // points + announcements
        const [ptsJson, annJson] = await Promise.all([
          fetchJson(`/api/points?page=1&per_page=500`),
          fetchJson(`/api/announcements?status=published&page=1&per_page=50`),
        ])

        if (!mounted) return

        // 归一化学生 center 字段（兼容 center/Center/centre/branch）
        const normalizedStudents = (studentList || []).map((s: any) => ({
          ...s,
          center: s?.center ?? s?.Center ?? s?.centre ?? s?.branch ?? s?.CENTER ?? s?.Centre ?? s?.Branch ?? s?.CenterName ?? s?.center_name,
          dob: s?.dob ?? s?.dateOfBirth ?? s?.birthDate ?? s?.birthday ?? null,
        }))

        console.log('[TV] center:', center, 'students count:', normalizedStudents.length)
        const monthDebug = normalizedStudents
          .map((s: any) => ({ id: s.student_id, c: s.center, dob: s.dob, d: new Date(s.dob)?.toISOString().slice(0,10) }))
          .filter(Boolean)
        console.log('[TV] month debug sample:', monthDebug.slice(0, 5))
        const watch = new Set(['B15','T1','T23'])
        const watchLog = monthDebug.filter(x => watch.has((x.id||'').toString().toUpperCase()))
        if (watchLog.length) console.log('[TV] watch IDs:', watchLog)
        
        setStudents(normalizedStudents)
        setPoints(ptsJson?.items || ptsJson?.data?.items || [])
        setAnnouncements(annJson?.data?.items || annJson?.items || [])
        setReady(true)
      } catch (e) {
        setReady(true)
      }
    }
    load()
    const refresh = setInterval(load, 30000)
    return () => { mounted = false; clearInterval(refresh) }
  }, [center])

  return {
    announcements,
    students,
    points,
    ready
  }
}
