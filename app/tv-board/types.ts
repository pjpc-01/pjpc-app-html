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
  current_points: number 
}

export type SlideData = {
  type: "student_points" | "birthdays" | "announcements";
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
