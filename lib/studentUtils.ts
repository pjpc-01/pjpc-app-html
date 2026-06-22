/**
 * 获取学生所属中心名称（兼容新旧字段）
 * 优先使用 centerId relation，fallback 到旧版 center 文本字段
 */
export function getStudentCenterName(student: {
  centerId?: string
  center?: string
  expand?: {
    centerId?: { name?: string; code?: string }
  }
}): string {
  // 如果有 expand 数据，直接用
  if (student.expand?.centerId?.name) {
    return student.expand.centerId.name
  }
  if (student.expand?.centerId?.code) {
    return student.expand.centerId.code
  }
  // fallback: 旧版文本字段
  if (student.center) {
    return student.center
  }
  return "未设置"
}
