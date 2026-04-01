export interface Building {
  id: number;
  code: string;
  name: string;
  address?: string;
  is_active: boolean;
}

export interface Room {
  id: number;
  name: string;
  building_id?: number;
  building?: string;
  floor: number;
  capacity: number;
  has_projector: boolean;
  has_computers: boolean;
  has_whiteboard: boolean;
  has_smartboard: boolean;
  room_type: "classroom" | "lab" | "lecture_hall" | "seminar";
  description?: string;
  extra_info?: Record<string, unknown>;
}

export interface FreeRoom extends Room {
  free_until?: string;
  next_class_at?: string;
  building_code?: string;
}

export interface ScheduleEntry {
  id: number;
  room_id: number;
  day_of_week: number;
  week_start_date?: string;
  time_start: string;
  time_end: string;
  subject: string;
  teacher?: string;
  teacher_id?: number;
  group_name?: string;
  lesson_type?: string;
  is_recurring: boolean;
}

export interface ScheduleEntryCreate {
  room_id: number;
  day_of_week: number;
  week_start_date?: string;
  time_start: string;
  time_end: string;
  subject: string;
  teacher_id?: number;
  group_name?: string;
  lesson_type?: string;
  is_recurring: boolean;
}

export interface Teacher {
  id: number;
  full_name: string;
  position?: string;
  department?: string;
}

export interface SearchFilters {
  time_start?: string;
  time_end?: string;
  day_of_week?: number;
  building?: string;
  min_capacity?: number;
  has_projector?: boolean;
  has_computers?: boolean;
  has_smartboard?: boolean;
  week_number?: number;
  week_start_date?: string;
}

export interface SystemStats {
  rooms_total: number;
  schedule_entries_total: number;
  last_parse?: string;
  last_parse_status?: string;
}

export interface TimeSlot {
  id: number;
  slot_number: number;
  time_start: string;
  time_end: string;
  label?: string;
  duration_type: "standard" | "short";
  is_active: boolean;
}

export const DAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const DAYS_FULL_RU = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

export const ROOM_TYPE_LABELS: Record<string, string> = {
  classroom:    "Аудитория",
  lab:          "Лаборатория",
  lecture_hall: "Лекционный зал",
  seminar:      "Семинарская",
};

export const LESSON_TYPE_LABELS: Record<string, string> = {
  lecture:      "Лекция",
  practice:      "Практика",
  lab:           "Лабораторная",
  seminar:       "Семинар",
  exam:          "Экзамен",
  consultation:  "Консультация",
};

export const TIME_SLOTS = [
  { slot: 1, start: "08:30", end: "10:05", label: "1 пара" },
  { slot: 2, start: "10:15", end: "11:50", label: "2 пара" },
  { slot: 3, start: "12:00", end: "13:35", label: "3 пара" },
  { slot: 4, start: "14:15", end: "15:50", label: "4 пара" },
  { slot: 5, start: "16:00", end: "17:35", label: "5 пара" },
  { slot: 6, start: "18:00", end: "19:35", label: "6 пара" },
  { slot: 7, start: "19:45", end: "21:20", label: "7 пара" },
];
