/**
 * 年级的唯一源头 —— 归一化 / 显示名 / 下拉选项 / 排序
 *
 * 背景：全站年级值来源极乱（`Standard 1`、`一年级`、`1`、`7`、`Y4`、`Peralihan`、`预备班`…），
 * 历史上有 7 处页面各写死一套映射，导致：
 *   - 措辞不统一（「预备班」vs「中学预备班」）
 *   - 漏年级（下拉里没有「中学预备班」→ 学生选不进报告）
 *   - 排序失效（order 数组与实际值对不上 → indexOf 恒为 -1）
 * 现在：**任何跟年级有关的显示/选项/排序，一律从这里取。**
 *
 * 两层数据：
 *   1) canonical（英文，和 lib/utils 的 formatGrade() 一致）：`Peralihan` / `Standard 1`..`Standard 6` / `Form 1`..`Form 6`
 *   2) 显示名（中文）：`中学预备班` / `一年级`..`六年级` / `中一`..`中六`
 *
 * ⚠️ 别在页面里再写 GRADE_DISPLAY / GRADE_OPTIONS / gradeOrder —— 会漏年级。
 * ⚠️ 「预备班」统一叫 **中学预备班**（用户口径）。
 */
import { formatGrade } from '@/lib/utils'

/** canonical 顺序（排序、比较都用它） */
export const GRADE_CANON = [
  'Peralihan',
  'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6',
  'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6',
] as const

/** canonical + 明年新生（列表筛选用；明年新生会排最后） */
export const GRADE_CANON_ALL = [...GRADE_CANON, '明年新生']

/** canonical → 中文显示名（唯一定义处） */
export const GRADE_LABEL: Record<string, string> = {
  'Peralihan': '中学预备班',
  'Standard 1': '一年级', 'Standard 2': '二年级', 'Standard 3': '三年级',
  'Standard 4': '四年级', 'Standard 5': '五年级', 'Standard 6': '六年级',
  'Form 1': '中一', 'Form 2': '中二', 'Form 3': '中三',
  'Form 4': '中四', 'Form 5': '中五', 'Form 6': '中六',
  '明年新生': '明年新生',
}

/** 中文名 → canonical（补 lib/utils 没覆盖的中文中学术语） */
const ZH_TO_CANON: Record<string, string> = {
  '中学预备班': 'Peralihan', '预备班': 'Peralihan', '中一': 'Form 1', '中二': 'Form 2',
  '中三': 'Form 3', '中四': 'Form 4', '中五': 'Form 5', '中六': 'Form 6',
}

/** 中文下拉选项（值 = 中文，用于把中文直接存库的页面，如教学评估报告、作业） */
export const GRADE_OPTIONS_ZH = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '中学预备班',
  '中一', '中二', '中三', '中四', '中五', '中六',
]

/** 归一：任何乱值 → canonical（'一年级' / '1' / '7' / 'Y4' / 'Form 1' / '中一' / 'Peralihan' …） */
export const gradeCanon = (raw: string | undefined | null, isPeralihan?: boolean): string => {
  if (!raw) return ''
  const s = String(raw).trim()
  if (!s) return ''
  // 中文学段名先转（formatGrade 未覆盖 '中一'..'中六'）
  const zh = ZH_TO_CANON[s] || s
  // formatGrade 处理 '一年级' / '1' / '7' / 'y4' / 'Peralihan' / '明年新生'
  let out = formatGrade(zh, isPeralihan) || zh
  // 补大小写：'Y4' → 'y4'
  if (!GRADE_LABEL[out] && GRADE_CANON.includes(out as any) === false) {
    const lower = out.toLowerCase()
    out = formatGrade(lower, isPeralihan) || out
  }
  return out
}

/** 显示：任何乱值 → 中文名（页面直接调这个，别自己写映射表） */
export const gradeLabel = (raw: string | undefined | null, isPeralihan?: boolean): string => {
  if (!raw) return ''
  const canon = gradeCanon(raw, isPeralihan)
  return GRADE_LABEL[canon] || canon
}

/** 排序键：canonical 顺序；未知值排最后（原来用写死的 order 数组 + indexOf，对不上就恒 -1 → 排序失效） */
export const gradeRank = (raw: string | undefined | null): number => {
  const canon = gradeCanon(raw)
  const i = (GRADE_CANON as readonly string[]).indexOf(canon)
  return i === -1 ? GRADE_CANON.length + 1 : i
}
