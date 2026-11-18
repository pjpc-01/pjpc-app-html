import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getPocketBase } from '@/lib/pocketbase'
import { authenticateAdmin } from '@/lib/auth-utils'
import {
  normalizeSubject,
  normalizeStudentName,
  termIndexFromDate,
  termIndexFromPeriod,
  termIndexFromReport,
} from '@/lib/report-sync'

// 教学评估 ➜ 学生报告：把学生的评语写进该学期报告的对应科目
// 方案 A（老板 2026-11-17 定）：
//   学期 = 每学期一份（第一次 1–4 月 / 第二次 5–8 月 / 第三次 9–12 月）
//   同一科多人评：合并，每段前面加「老师名：」
//   自动覆盖：报告里那条评语以教学评估为准
// body: { reportId?: string, dryRun?: boolean }
//   reportId 给了就以这份评估为锚（学年/学期/科目/年级），同科同期的其他老师评语照样合并
//   不给就把全部已提交评估同步一遍（手动补同步用）

type Perf = {
  student_id?: string
  student_name?: string
  student_grade?: string
  comment?: string
  [k: string]: unknown
}

export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'principal'])
  if ('error' in gate) return gate.error

  try {
    const body = await request.json().catch(() => ({} as any))
    const dryRun = body?.dryRun === true
    const onlyId: string | undefined = body?.reportId

    const pb = await getPocketBase()
    if (!pb.authStore.isValid) await authenticateAdmin(pb)

    // 1) 锚点：指定 reportId 时，只同步这份评估所属的 学年 + 学期 + 科目 (+年级)
    let anchor: { year: string; termIdx: number; subject: string; grade: string } | null = null
    if (onlyId) {
      const one: any = await pb.collection('teacher_teaching_reports').getOne(onlyId)
      const year = String(one.date || '').slice(0, 4)
      const termIdx = termIndexFromPeriod(one.assessment_period) ?? termIndexFromDate(one.date)
      const subject = normalizeSubject(one.subject)
      if (!year || !termIdx || !subject) {
        return NextResponse.json({ success: true, message: '这份评估缺日期/学期/科目，无法同步', updated: 0 })
      }
      anchor = { year, termIdx, subject, grade: (one.grade || '').trim() }
    }

    // 2) 取评估：锚点模式把同科同期的其他老师一起拉进来，否则单人提交会抹掉别人的评语
    const assessments: any[] = anchor
      ? await pb.collection('teacher_teaching_reports').getFullList({
          filter: `deleted != true && status = "submitted" && date >= "${anchor.year}-01-01" && date < "${Number(anchor.year) + 1}-01-01"`,
        })
      : await pb.collection('teacher_teaching_reports').getFullList({
          filter: `deleted != true && status = "submitted"`,
        })

    if (!assessments.length) {
      return NextResponse.json({ success: true, message: '没有可同步的教学评估', updated: 0 })
    }

    // 3) 学生名 ➜ id（很旧的评估只存名字，没有 student_id）
    const students: any[] = await pb.collection('students').getFullList({ fields: 'id,name' })
    const idByName = new Map<string, string>()
    for (const st of students) idByName.set(normalizeStudentName(st.name), st.id)

    // 4) 汇总评语；touched 记录「这次碰到的组合」，用来在评语被删掉时清空报告那条
    type Entry = { teacher: string; text: string }
    const buckets = new Map<string, Entry[]>()
    const touched = new Set<string>()
    const unresolvedNames = new Set<string>()

    for (const a of assessments) {
      const year = String(a.date || '').slice(0, 4)
      const termIdx = termIndexFromPeriod(a.assessment_period) ?? termIndexFromDate(a.date)
      const subject = normalizeSubject(a.subject)
      if (!year || !termIdx || !subject) continue
      if (anchor) {
        if (year !== anchor.year || termIdx !== anchor.termIdx || subject !== anchor.subject) continue
        const g = (a.grade || '').trim()
        if (anchor.grade && g && g !== anchor.grade) continue
      }
      const teacherName = (a.teacher_name || '').trim()

      for (const p of (a.student_performances || []) as Perf[]) {
        const sid = p.student_id || idByName.get(normalizeStudentName(p.student_name as string)) || ''
        if (!sid) {
          if (p.student_name) unresolvedNames.add(String(p.student_name))
          continue
        }
        const key = [year, termIdx, subject, sid].join('|')
        touched.add(key)
        const text = String(p.comment || '').trim()
        if (!text) continue
        const list = buckets.get(key) || []
        list.push({ teacher: teacherName, text })
        buckets.set(key, list)
      }
    }

    if (!touched.size) {
      return NextResponse.json({
        success: true,
        message: '评估里的学生名字都对不上学生档案，没法同步',
        updated: 0,
        unresolved: Array.from(unresolvedNames).slice(0, 20),
      })
    }

    // 5) 取相关学年的报告，按报告自己的学期（日期优先）建索引
    const years = Array.from(new Set(Array.from(touched).map((k) => k.split('|')[0])))
    const reports: any[] = await pb.collection('student_reports').getFullList({
      filter: years.map((y) => `year = ${Number(y)}`).join(' || '),
    })
    const reportByKey = new Map<string, any>()
    for (const rep of reports) {
      const termIdx = termIndexFromReport(rep.term, rep.report_date)
      if (!termIdx || !rep.studentId) continue
      reportByKey.set(`${String(rep.year)}|${termIdx}|${rep.studentId}`, rep)
    }

    // 6) 合并写回：一份报告可能被多个科目碰到，所以先在内存里改完再一次性 PATCH
    const subjectsByReport = new Map<string, any[]>()
    for (const rep of reports) {
      subjectsByReport.set(rep.id, Array.isArray(rep.subjects) ? [...rep.subjects] : [])
    }

    const dirtyReports = new Set<string>()
    const changes: any[] = []
    const missing: string[] = []

    for (const key of touched) {
      const [year, termIdxStr, subject, sid] = key.split('|')
      const rep = reportByKey.get(`${year}|${Number(termIdxStr)}|${sid}`)
      if (!rep) {
        missing.push(key)
        continue
      }
      const subjects = subjectsByReport.get(rep.id) as any[]

      const entries = buckets.get(key) || []
      const teachers = Array.from(new Set(entries.map((e) => e.teacher).filter(Boolean)))
      const merged = entries.length === 0
        ? ''
        : teachers.length <= 1
          ? entries.map((e) => e.text).join('\n')
          : entries.map((e) => `${e.teacher || '老师'}：${e.text}`).join('\n')

      const idxs = subjects
        .map((s: any, i: number) => (normalizeSubject(s?.name) === subject ? i : -1))
        .filter((i) => i >= 0)

      if (!idxs.length) {
        if (!merged) continue // 没评语、报告里也没这科 → 不建空条目
        subjects.push({ name: subject, midterm: null, final: null, evaluation: merged, source: 'eval' })
        dirtyReports.add(rep.id)
        changes.push({ reportId: rep.id, subject, text: merged.slice(0, 60) })
        continue
      }

      let changed = false
      for (const i of idxs) {
        const cur = (subjects[i].evaluation || '').trim()
        if (merged && cur === merged.trim()) continue
        if (!merged) {
          // 评语被删掉了：只清当初由评估写入的，老师手打的不动
          if (subjects[i].source !== 'eval' || !cur) continue
          const cleared: any = { ...subjects[i], evaluation: '' }
          delete cleared.source // 清空后不再标成「评估写入」，避免下次误清老师手打的内容
          subjects[i] = cleared
        } else {
          subjects[i] = { ...subjects[i], evaluation: merged, source: 'eval' }
        }
        changed = true
      }
      if (changed) {
        dirtyReports.add(rep.id)
        changes.push({ reportId: rep.id, subject, text: merged.slice(0, 60) })
      }
    }

    if (!dryRun) {
      for (const reportId of dirtyReports) {
        await pb.collection('student_reports').update(reportId, { subjects: subjectsByReport.get(reportId) })
      }
    }

    const updated = dirtyReports.size
    return NextResponse.json({
      success: true,
      dryRun,
      updated,
      missingReports: missing.length,
      unresolved: Array.from(unresolvedNames).slice(0, 20),
      details: changes,
      message: dryRun
        ? `预演：会更新 ${updated} 份报告`
        : `已同步 ${updated} 份学生报告${missing.length ? `；${missing.length} 位学生该学期还没有报告` : ''}`,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '同步失败' }, { status: 500 })
  }
}
