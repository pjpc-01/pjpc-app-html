/**
 * 学生报告的科目表（按年级）
 *
 * 小学 / 预备班：华文 / 国文 / 英文 / 科学 / 数学
 * 中学（Form 1-6）：与「考试目标」页完全一致 —— 马来文 / 英文 / 华文 / 数学 / 科学 / 历史 / 地理
 *   考试目标的科目定义在 app/api/exam-targets/route.ts 的 SUBJECTS，改那边要同步这里
 *
 * 年级判定直接用 lib/grades.ts 的 isSecondaryGrade（单源）：
 *   它把 'Peralihan' 归为小学（预备班读小学课程），只有 'Form 1'..'Form 6' 算中学。
 */
import { isSecondaryGrade } from './grades'

export const PRIMARY_SUBJECTS = ['华文', '国文', '英文', '科学', '数学']

export const SECONDARY_SUBJECTS = ['马来文', '英文', '华文', '数学', '科学', '历史', '地理']

/**
 * 取该学生该用的报告科目表
 * @param rawGrade 学生原始年级值（内部会归一化，'中一' / '7' / 'Form 1' 都认）
 * @param fallback 小学时优先用模板里的默认科目（没给就用内置五科）
 */
export const reportSubjectsForGrade = (
  rawGrade?: string | null,
  fallback?: string[] | null
): string[] => {
  if (isSecondaryGrade(rawGrade)) return [...SECONDARY_SUBJECTS]
  return fallback && fallback.length > 0 ? [...fallback] : [...PRIMARY_SUBJECTS]
}
