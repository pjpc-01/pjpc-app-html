// 教学评估 ➜ 学生报告 同步用的共用规则
// 2026-11-17：老板要「英文老师填教学评估，学生报告的评语自动出现」

/** 评估期间 → 学期序号（1/2/3）：第一次 1–4 月、第二次 5–8 月、第三次 9–12 月 */
export function termIndexFromPeriod(period?: string): 1 | 2 | 3 | null {
  const p = (period || '').trim().toLowerCase()
  if (p === 'first') return 1
  if (p === 'second') return 2
  if (p === 'third') return 3
  return null
}

/** 用日期推学期：1–4 月=1、5–8 月=2、9–12 月=3 */
export function termIndexFromDate(date?: string): 1 | 2 | 3 | null {
  const m = Number((date || '').slice(5, 7))
  if (!m) return null
  if (m <= 4) return 1
  if (m <= 8) return 2
  return 3
}

/** 报告的学期序号：优先 term 文本（Term 1/2/3），否则用 report_date 推 */
export function termIndexFromReport(term?: string, date?: string): 1 | 2 | 3 | null {
  // 报告日期优先：现有报告 term 大多是建表时的默认值 "Term 1"，不能当真（2026-11-17 实测）
  const byDate = termIndexFromDate(date)
  if (byDate) return byDate
  const m = (term || '').match(/term\s*([123])/i)
  if (m) return Number(m[1]) as 1 | 2 | 3
  const cn = (term || '').match(/第\s*([一二三])\s*学期/)
  if (cn) return ({ 一: 1, 二: 2, 三: 3 } as Record<string, 1 | 2 | 3>)[cn[1]] ?? null
  return termIndexFromDate(date)
}

/** 科目名归一化：中英马三种写法都收成同一个标准名 */
const SUBJECT_ALIASES: Record<string, string> = {
  chinese: '华文', 'bahasa cina': '华文', 中文: '华文', 华语: '华文',
  malay: '国文', 'bahasa melayu': '国文', 马来文: '国文', 马来语: '国文',
  english: '英文', 'english language': '英文', 英语: '英文',
  math: '数学', maths: '数学', mathematics: '数学',
  science: '科学',
  sejarah: '历史',
  geografi: '地理', geography: '地理',
  'prinsip perakaunan': '会计', accounting: '会计',
  'additional mathematics': '高数', 'add math': '高数', 高级数学: '高数',
}

export function normalizeSubject(name?: string): string {
  const raw = (name || '').trim()
  if (!raw) return ''
  const key = raw.toLowerCase()
  return SUBJECT_ALIASES[key] || raw
}

/** 学生名归一化（去掉英文名括号、空格、大小写差异），旧评估只存名字时用来对 id */
export function normalizeStudentName(name?: string): string {
  let s = (name || '').trim()
  const cn = s.match(/[\u4e00-\u9fa5]+/g)
  if (cn && cn.length) s = cn.join('')
  else s = s.toLowerCase()
  return s.replace(/\s+/g, '')
}
