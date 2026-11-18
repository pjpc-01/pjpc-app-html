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

// 教学评估 ➜ 学生报告：把一个学生的评语写进该学期报告的对应科目
// 方法 A（老板 2026-11-17 定）：
//   学期 = 每学期一份（第一次 1–4 月 / 第二次 5–8 月 / 第三次 9–12 月）
//   同一科多人评：合并，每段前面加「老师名：」
//   自动覆盖：报告里那条评语以教学评估为准
// body: { reportId?: string, dryRun?: boolean }
//   reportId 给了就只同步那一份评估；没给就把该学年该学期全部评估同步一遍（手动补同步用）

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

    // 1) 取要处理的评估
    const filter = onlyId
      ? `id = "${onlyId}"`
      : `deleted != true && status = "submitted"`
    const assessments: any[] = await pb
      .collection('teacher_teaching_reports')
      .getFullList({ filter, sort: '-date' })

    if (!assessments.length) {
      return NextResponse.json({ success: true, message: '没有可同步的教学评估', updated: 0 })
    }

    // 2) 学生名 ➜ id（旧评估只存名字，没有 student_id）
    const students: any[] = await pb.collection('students').getFullList({
      fields: 'id,name,grade,status',
    })
    const idByName = new Map<string, string>()
    for (const st of students) {
      idByName.set(normalizeStudentName(st.name), st.id)
    }

    // 3) 把评估按「学年 + 学期 + 科目 + 年级」分组，组内合并同名学生的评语
    type Bucket = Map<string, { teacher: string; text: string }[]> // key = 学年|学期|科目|年级|学生
    const buckets: Bucket = new Map()

    for (const a of assessments) {
      const year = String(a.date || '').slice(0, 4)
      const termIdx = termIndexFromPeriod(a.assessment_period) ?? termIndexFromDate(a.date)
      if (!year || !termIdx) continue
      const subject = normalizeSubject(a.subject)
      if (!subject) continue
      const grade = (a.grade || '').trim()
      const teacherName = (a.teacher_name || '').trim()

      for (const p of (a.student_performances || []) as Perf[]) {
        const text = String(p.comment || '').trim()
        if (!text) continue
        const sid = p.student_id || idByName.get(normalizeStudentName(p.student_name as string)) || ''
        if (!sid) continue
        const key = [year, termIdx, subject, grade, sid].join('|')
        const list = buckets.get(key) || []
        list.push({ teacher: teacherName, text })
        buckets.set(key, list)
      }
    }

    if (!buckets.size) {
      return NextResponse.json({ success: true, message: '评估里还没有填写学生评语', updated: 0 })
    }

    // 4) 取同一学年的学生报告，按报告自己的学期序号对号入座
    const years = Array.from(new Set(Array.from(buckets.keys()).map((k) => k.split('|')[0])))
    const reports: any[] = await pb.collection('student_reports').getFullList({
      filter: years.map((y) => `year = ${y}`).join(' || '),
    })

    let updated = 0
    const changes: any[] = []

    for (const rep of reports) {
      const repYear = String(rep.year || '')
      const repTerm = termIndexFromReport(rep.term, rep.report_date)
      if (!repTerm) continue
      const sid = rep.studentId
      if (!sid) continue

      const subjects: any[] = Array.isArray(rep.subjects) ? [...rep.subjects] : []
      let dirty = false

      for (const [key, entries] of buckets) {
        const [y, termIdx, subject, , studentId] = key.split('|')
        if (y !== repYear) continue
        if (Number(termIdx) !== repTerm) continue
        if (studentId !== sid) continue
        // 年级不比：评估写「中二」、学生档案写「Form 2」，直接比会全部漏掉（2026-11-17 踩过）
        // 学生 id + 学期 + 科目已经够定位

        // 合并：一位老师就写他自己的话；多位老师各自一段并署名
        const teachers = Array.from(new Set(entries.map((e) => e.teacher).filter(Boolean)))
        const merged = teachers.length <= 1
          ? entries.map((e) => e.text).join('\n')
          : entries.map((e) => `${e.teacher || '老师'}：${e.text}`).join('\n')

        let idx = subjects.findIndex((s: any) => normalizeSubject(s?.name) === subject)
        if (idx === -1) {
          subjects.push({ name: subject, midterm: null, final: null, evaluation: merged, source: 'eval' })
          idx = subjects.length - 1
        } else if ((subjects[idx].evaluation || '').trim() !== merged.trim()) {
          subjects[idx] = { ...subjects[idx], evaluation: merged, source: 'eval' }
        } else {
          continue
        }
        dirty = true
        changes.push({ reportId: rep.id, subject, text: merged.slice(0, 60) })
      }

      if (dirty) {
        if (!dryRun) {
          await pb.collection('student_reports').update(rep.id, { subjects })
        }
        updated++
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      updated,
      details: changes,
      message: dryRun
        ? `预演：会更新 ${updated} 份报告`
        : `已同步 ${updated} 份学生报告`,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '同步失败' }, { status: 500 })
  }
}
