import { create } from "zustand";
import type { FreeRoom, SearchFilters, ScheduleEntry, ScheduleEntryCreate, Room, Teacher, Building } from "@/types";
import { getFreeRooms, getAllRooms, getAllScheduleEntries, createScheduleEntry, updateScheduleEntry as updateEntry, deleteScheduleEntry, getTeachers, getBuildings } from "@/services/api";

interface RoomStore {
  // State
  rooms: FreeRoom[];
  allRooms: Room[];
  buildings: Building[];
  teachers: Teacher[];
  scheduleEntries: ScheduleEntry[];
  isLoading: boolean;
  error: string | null;
  filters: SearchFilters;
  lastSearched: Date | null;

  // Actions
  setFilters: (f: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  searchRooms: () => Promise<void>;
  searchNow: () => Promise<void>;
  loadAllRooms: () => Promise<void>;
  loadBuildings: () => Promise<void>;
  loadTeachers: () => Promise<void>;
  loadSchedule: (dayOfWeek?: number, roomId?: number) => Promise<void>;
  addScheduleEntry: (entry: ScheduleEntryCreate) => Promise<void>;
  updateScheduleEntry: (entryId: number, entry: Partial<ScheduleEntry>) => Promise<void>;
  removeScheduleEntry: (entryId: number) => Promise<void>;
}

const defaultFilters: SearchFilters = {};

export const useRoomStore = create<RoomStore>((set, get) => ({
  rooms: [],
  isLoading: false,
  error: null,
  filters: defaultFilters,
  lastSearched: null,

  setFilters: (f) =>
    set((s) => ({ filters: { ...s.filters, ...f } })),

  resetFilters: () => set({ filters: defaultFilters }),

  searchRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const rooms = await getFreeRooms(get().filters);
      set({ rooms, lastSearched: new Date() });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка при поиске";
      set({ error: msg });
    } finally {
      set({ isLoading: false });
    }
  },

  searchNow: async () => {
    // Поиск "прямо сейчас" - используем текущее время браузера
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMinute = String(now.getMinutes()).padStart(2, '0');
    const timeStart = `${currentHour}:${currentMinute}`;
    
    const endDate = new Date(now.getTime() + 90 * 60 * 1000);
    const endHour = String(endDate.getHours()).padStart(2, '0');
    const endMinute = String(endDate.getMinutes()).padStart(2, '0');
    const timeEnd = `${endHour}:${endMinute}`;
    
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    const weekStartDate = monday.toISOString().split('T')[0];
    const dayOfWeek = day === 0 ? 6 : day - 1;
    
    set({ isLoading: true, error: null, filters: { week_start_date: weekStartDate, day_of_week: dayOfWeek, time_start: timeStart, time_end: timeEnd } });
    try {
      const rooms = await getFreeRooms({ week_start_date: weekStartDate, day_of_week: dayOfWeek, time_start: timeStart, time_end: timeEnd });
      set({ rooms, lastSearched: new Date() });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка при поиске";
      set({ error: msg });
    } finally {
      set({ isLoading: false });
    }
  },

  allRooms: [],
  buildings: [],
  teachers: [],
  scheduleEntries: [],

  loadBuildings: async () => {
    try {
      const buildings = await getBuildings();
      set({ buildings });
    } catch (e) {
      console.error("Failed to load buildings:", e);
    }
  },

  loadAllRooms: async () => {
    try {
      const allRooms = await getAllRooms();
      set({ allRooms });
    } catch (e) {
      console.error("Failed to load rooms:", e);
    }
  },

  loadTeachers: async (search?: string) => {
    try {
      const teachers = await getTeachers(search);
      set({ teachers });
    } catch (e) {
      console.error("Failed to load teachers:", e);
    }
  },

  loadSchedule: async (dayOfWeek?: number, roomId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const entries = await getAllScheduleEntries(dayOfWeek, roomId);
      set({ scheduleEntries: entries });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки расписания";
      set({ error: msg });
    } finally {
      set({ isLoading: false });
    }
  },

  addScheduleEntry: async (entry: ScheduleEntryCreate) => {
    set({ isLoading: true, error: null });
    try {
      await createScheduleEntry(entry);
      await get().loadSchedule();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка добавления занятия";
      set({ error: msg });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  updateScheduleEntry: async (entryId: number, entry: Partial<ScheduleEntry>) => {
    set({ isLoading: true, error: null });
    try {
      await updateEntry(entryId, entry);
      await get().loadSchedule();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка обновления занятия";
      set({ error: msg });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  removeScheduleEntry: async (entryId: number) => {
    set({ isLoading: true, error: null });
    try {
      await deleteScheduleEntry(entryId);
      await get().loadSchedule();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка удаления занятия";
      set({ error: msg });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },
}));
