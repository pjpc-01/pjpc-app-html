// TV Board 常量定义
export const STUDENTS_PER_PAGE = 12 // 每页显示学生数量 - 2列x6行
export const DISPLAY_MS = 8000 // 幻灯片切换间隔（毫秒）- 优化为8秒，让用户有足够时间查看内容

// 动画类名
export const ANIMATION_CLASSES = {
  FADE: 'tv-fade',
  MARQUEE: 'tv-marquee'
} as const

// 幻灯片类型
export const SLIDE_TYPES = {
  STUDENT_POINTS: 'student_points',
  TRANSACTIONS: 'transactions',
  BIRTHDAYS: 'birthdays', 
  ANNOUNCEMENTS: 'announcements'
} as const

// 学号前缀排序权重
export const STUDENT_ID_PREFIX_RANK = {
  B: 0,
  G: 1, 
  T: 2
} as const
