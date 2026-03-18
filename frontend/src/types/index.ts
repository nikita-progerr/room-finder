export interface Room {
  id: number;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  has_projector: boolean;
  has_computers: boolean;
  has_whiteboard: boolean;
  has_smartboard: boolean;
  room_type: "classroom" | "lab" | "lecture_hall" | "seminar";
  description?: string;
}

export interface FreeRoom extends Room {
  free_until?: string;   // "до 14:30" | "весь день"
  next_class_at?: string;
}

export interface ScheduleEntry {
  id: number;
  room_id: number;
  day_of_week: number;
  week_type: "odd" | "even" | "both";
  time_start: string;
  time_end: string;
  subject: string;
  teacher?: string;
  group_name?: string;
  lesson_type?: string;
}

export interface SearchFilters {
  time_start?: string;
  time_end?: string;
  day_of_week?: number;
  building?: string;
  min_capacity?: number;
  has_projector?: boolean;
  has_computers?: boolean;
}

export interface SystemStats {
  rooms_total: number;
  schedule_entries_total: number;
  last_parse?: string;
  last_parse_status?: string;
}

export const DAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const DAYS_FULL_RU = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

export const ROOM_TYPE_LABELS: Record<string, string> = {
  classroom:    "Аудитория",
  lab:          "Лаборатория",
  lecture_hall: "Лекционный зал",
  seminar:      "Семинарская",
};
