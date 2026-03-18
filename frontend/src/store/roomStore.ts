import { create } from "zustand";
import type { FreeRoom, SearchFilters } from "@/types";
import { getFreeRooms } from "@/services/api";

interface RoomStore {
  // State
  rooms: FreeRoom[];
  isLoading: boolean;
  error: string | null;
  filters: SearchFilters;
  lastSearched: Date | null;

  // Actions
  setFilters: (f: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  searchRooms: () => Promise<void>;
  searchNow: () => Promise<void>;
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
    // Поиск "прямо сейчас" без фильтров по времени
    set({ isLoading: true, error: null, filters: defaultFilters });
    try {
      const rooms = await getFreeRooms({});
      set({ rooms, lastSearched: new Date() });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка при поиске";
      set({ error: msg });
    } finally {
      set({ isLoading: false });
    }
  },
}));
