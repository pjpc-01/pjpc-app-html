export type AnnouncementItem = { 
  id: string; 
  title: string; 
  content: string; 
  priority?: string 
}

export type Student = { 
  id: string; 
  student_id: string; 
  student_name: string; 
  center?: string; 
  dob?: string 
}

export type StudentPoints = { 
  id: string; 
  student_id: string; 
  current_points: number;
  total_earned: number;
  total_spent: number;
  season_id: string;
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
