import axios from "axios";
import type { FreeRoom, Room, ScheduleEntry, SearchFilters, SystemStats, Building, Teacher } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  timeout: 10000,
});

// ── Rooms ──────────────────────────────────────────────────────────

export async function getFreeRooms(filters: SearchFilters): Promise<FreeRoom[]> {
  const params: Record<string, string | number | boolean> = {};

  if (filters.time_start)  params.time_start  = filters.time_start;
  if (filters.time_end)    params.time_end    = filters.time_end;
  if (filters.day_of_week !== undefined) params.day_of_week = filters.day_of_week;
  if (filters.building)    params.building    = filters.building;
  if (filters.min_capacity) params.min_capacity = filters.min_capacity;
  if (filters.has_projector !== undefined) params.has_projector = filters.has_projector;
  if (filters.has_computers !== undefined) params.has_computers = filters.has_computers;
  if (filters.week_start_date) params.week_start_date = filters.week_start_date;
  
  params._t = Date.now();

  const { data } = await api.get<FreeRoom[]>("/rooms/free", { params });
  return data;
}

export async function getAllRooms(building?: string): Promise<Room[]> {
  const params = building ? { building } : {};
  const { data } = await api.get<Room[]>("/rooms/", { params });
  return data;
}

export async function getRoomSchedule(
  roomId: number,
  dayOfWeek?: number,
  weekStartDate?: string
): Promise<ScheduleEntry[]> {
  const params: Record<string, string | number> = {};
  if (dayOfWeek !== undefined) params.day_of_week = dayOfWeek;
  if (weekStartDate) params.week_start_date = weekStartDate;
  const { data } = await api.get<ScheduleEntry[]>(`/rooms/${roomId}/schedule`, { params });
  return data;
}

// ── Admin ──────────────────────────────────────────────────────────

export async function triggerParse(): Promise<{ message: string; task_id: string }> {
  const { data } = await api.post("/admin/parse/trigger");
  return data;
}

export async function getSystemStats(): Promise<SystemStats> {
  const { data } = await api.get<SystemStats>("/admin/stats");
  return data;
}

export async function getBuildings(): Promise<Building[]> {
  const { data } = await api.get<Building[]>("/rooms/buildings");
  return data;
}

export async function getTeachers(search?: string): Promise<Teacher[]> {
  const params = search ? { search } : {};
  const { data } = await api.get<Teacher[]>("/schedule/teachers", { params });
  return data;
}

// ── Schedule Entries ─────────────────────────────────────────────────

export async function getAllScheduleEntries(
  dayOfWeek?: number,
  roomId?: number,
  groupName?: string
): Promise<ScheduleEntry[]> {
  const params: Record<string, string | number> = {};
  if (dayOfWeek !== undefined) params.day_of_week = dayOfWeek;
  if (roomId) params.room_id = roomId;
  if (groupName) params.group_name = groupName;
  
  const { data } = await api.get<ScheduleEntry[]>("/schedule/entries", { params });
  return data;
}

export async function createScheduleEntry(entry: Partial<ScheduleEntry>): Promise<ScheduleEntry> {
  const { data } = await api.post<ScheduleEntry>("/schedule/entries", entry);
  return data;
}

export async function updateScheduleEntry(
  entryId: number,
  entry: Partial<ScheduleEntry>
): Promise<ScheduleEntry> {
  const { data } = await api.patch<ScheduleEntry>(`/schedule/entries/${entryId}`, entry);
  return data;
}

export async function deleteScheduleEntry(entryId: number): Promise<void> {
  await api.delete(`/schedule/entries/${entryId}`);
}
