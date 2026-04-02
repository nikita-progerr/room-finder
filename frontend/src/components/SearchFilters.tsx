"use client";

import { useRoomStore } from "@/store/roomStore";
import { getFreeRooms } from "@/services/api";
import { DAYS_RU } from "@/types";
import { Search, RotateCcw, Zap, SlidersHorizontal } from "lucide-react";
import clsx from "clsx";
import { useEffect } from "react";

const BUILDINGS = ["1", "2", "3", "4", "5"];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function SearchFiltersPanel() {
  const { filters, setFilters, resetFilters, searchRooms, searchNow, isLoading } = useRoomStore();

  const today = new Date().getDay();
  const todayMapped = today === 0 ? 6 : today - 1;
  
  const currentMonday = getMonday(new Date());
  
  useEffect(() => {
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
    
    setFilters({ 
      week_start_date: weekStartDate,
      day_of_week: dayOfWeek,
      time_start: timeStart,
      time_end: timeEnd,
    });
    
    setTimeout(() => {
      searchRooms();
    }, 0);
  }, []);

  return (
    <div className="glass-panel rounded-3xl p-6 space-y-5 animate-slide-up relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="text-sm font-semibold text-white/90 uppercase tracking-widest">Фильтры</h2>
        </div>
        <button
          onClick={resetFilters}
          className="text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1.5 transition-colors duration-200 mt-2"
        >
          <RotateCcw className="w-3 h-3" />
          Сбросить все
        </button>
      </div>

      <button
        onClick={searchNow}
        disabled={isLoading}
        className={clsx(
          "now-btn relative w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl",
          "font-bold text-sm tracking-wide transition-all duration-300",
          isLoading && "opacity-60 cursor-not-allowed"
        )}
      >
        <Zap className="w-5 h-5" />
        <span>Свободно сейчас</span>
        <span className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 hover:opacity-100 transition-opacity" />
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="text-[10px] text-slate-600 uppercase tracking-widest">или</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Начало">
            <input
              type="time"
              value={filters.time_start ?? ""}
              onChange={(e) => { setFilters({ time_start: e.target.value || undefined }); searchRooms(); }}
              className={inputCls}
            />
          </Field>
          <Field label="Конец">
            <input
              type="time"
              value={filters.time_end ?? ""}
              onChange={(e) => { setFilters({ time_end: e.target.value || undefined }); searchRooms(); }}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="День недели">
          <div className="flex gap-2 flex-wrap">
            {DAYS_RU.map((day, i) => (
              <button
                key={i}
                onClick={() => { setFilters({ day_of_week: filters.day_of_week === i ? undefined : i }); searchRooms(); }}
                className={clsx(
                  "w-10 h-10 rounded-2xl text-xs font-semibold transition-all duration-200",
                  filters.day_of_week === i
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40 transform scale-105"
                    : i === todayMapped
                    ? "bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20"
                    : "bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300 border border-white/5"
                )}
              >
                {day.slice(0, 2)}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Корпус">
          <div className="grid grid-cols-4 gap-2.5">
            {BUILDINGS.map((b) => (
              <button
                key={b}
                onClick={() => { setFilters({ building: filters.building === b ? undefined : b }); searchRooms(); }}
                className={clsx(
                  "py-3 rounded-2xl text-sm font-bold transition-all duration-200",
                  filters.building === b
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5"
                )}
              >
                {b}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Вместимость">
          <div className="relative">
            <input
              type="number"
              min={1}
              placeholder="Минимум мест"
              value={filters.min_capacity ?? ""}
              onChange={(e) => setFilters({ min_capacity: e.target.value ? Number(e.target.value) : undefined })}
              className={clsx(inputCls, "pl-10")}
            />
            <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          </div>
        </Field>

        <Field label="Оборудование">
          <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <GlassCheckbox
              label="Проектор"
              checked={filters.has_projector}
              onChange={(v) => setFilters({ has_projector: v })}
            />
            <GlassCheckbox
              label="Компьютеры"
              checked={filters.has_computers}
              onChange={(v) => setFilters({ has_computers: v })}
            />
            <GlassCheckbox
              label="Интерактивная доска"
              checked={filters.has_smartboard}
              onChange={(v) => setFilters({ has_smartboard: v })}
            />
          </div>
        </Field>
      </div>

      <button
        onClick={searchRooms}
        disabled={isLoading}
        className={clsx(
          "w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl",
          "bg-gradient-to-r from-slate-700/50 to-slate-800/50 hover:from-slate-700 hover:to-slate-800",
          "border border-white/10 hover:border-white/20",
          "text-white text-sm font-semibold tracking-wide transition-all duration-200",
          isLoading && "opacity-60 cursor-not-allowed"
        )}
      >
        <Search className="w-4 h-4" />
        {isLoading ? "Поиск..." : "Найти аудитории"}
      </button>
    </div>
  );
}

const inputCls =
  "w-full rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200 hover:border-white/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function GlassCheckbox({
  label, checked, onChange,
}: {
  label: string;
  checked?: boolean;
  onChange: (v: boolean | undefined) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group py-1">
      <div
        onClick={() => onChange(checked === true ? undefined : true)}
        className={clsx(
          "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
          checked
            ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500 shadow-lg shadow-blue-500/30"
            : "border-white/20 group-hover:border-white/40 bg-white/5"
        )}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-sm text-slate-400 group-hover:text-white transition-colors">{label}</span>
    </label>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
