export type AnnouncementItem = { 
  id: string; 
  title?: string; 
  content: string; 
  priority?: string;
  // 看板里用到的附加字段
  type?: 'info' | 'warning' | 'success' | 'danger';
  center?: string;
}

export type Student = { 
  id: string; 
  student_id?: string; 
  student_name: string; 
  center?: string; 
  dob?: string;
  avatar?: string;
  // 看板要显示的附加字段
  standard?: string;
  grade?: string;
  status?: string;
  points?: number;
}

export type StudentPoints = { 
  id: string; 
  student_id: string; 
  current_points?: number;
  total_earned?: number;
  total_spent?: number;
  season_id?: string;
  // 简化的点位（看板占位数据用）
  points?: number;
  last_update?: string;
  expand?: {
    student_id?: {
      id: string;
      student_name: string;
      student_id: string;
      center?: string;
    };
    season_id?: {
      id: string;
      season_name: string;
      is_active: boolean;
    };
  };
}

export type SlideData = {
  type: "student_points" | "transactions" | "birthdays" | "announcements";
  data: any;
}

export type ThemeColors = {
  textMuted: string;
  cardBase: string;
  number: string;
  rankBadge: string;
  indicatorActive: string;
  indicator: string;
}
