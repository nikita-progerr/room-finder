"use client";

import { useRoomStore } from "@/store/roomStore";
import { DAYS_RU } from "@/types";
import { Search, RotateCcw, Zap } from "lucide-react";
import clsx from "clsx";

const BUILDINGS = ["1", "2", "3", "4"];

export default function SearchFiltersPanel() {
  const { filters, setFilters, resetFilters, searchRooms, searchNow, isLoading } = useRoomStore();

  const today = new Date().getDay();
  const todayMapped = today === 0 ? 6 : today - 1;

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/90 uppercase tracking-widest">Фильтры</h2>
        <button
          onClick={resetFilters}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Сбросить
        </button>
      </div>

      {/* NOW button */}
      <button
        onClick={searchNow}
        disabled={isLoading}
        className={clsx(
          "now-btn w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl",
          "font-semibold text-sm tracking-wide transition-all duration-200",
          isLoading && "opacity-60 cursor-not-allowed"
        )}
      >
        <Zap className="w-4 h-4" />
        Свободно прямо сейчас
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-slate-500">или задать время</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Time */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="С">
          <input
            type="time"
            value={filters.time_start ?? ""}
            onChange={(e) => setFilters({ time_start: e.target.value || undefined })}
            className={inputCls}
          />
        </Field>
        <Field label="По">
          <input
            type="time"
            value={filters.time_end ?? ""}
            onChange={(e) => setFilters({ time_end: e.target.value || undefined })}
            className={inputCls}
          />
        </Field>
      </div>

      {/* Day */}
      <Field label="День недели">
        <div className="flex gap-1.5 flex-wrap">
          {DAYS_RU.map((day, i) => (
            <button
              key={i}
              onClick={() => setFilters({ day_of_week: filters.day_of_week === i ? undefined : i })}
              className={clsx(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                filters.day_of_week === i
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : i === todayMapped
                  ? "bg-white/10 text-blue-300 border border-blue-500/40"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5"
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </Field>

      {/* Building */}
      <Field label="Корпус">
        <div className="flex gap-2">
          {BUILDINGS.map((b) => (
            <button
              key={b}
              onClick={() => setFilters({ building: filters.building === b ? undefined : b })}
              className={clsx(
                "flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-150",
                filters.building === b
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5"
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </Field>

      {/* Capacity */}
      <Field label="Минимум мест">
        <input
          type="number"
          min={1}
          placeholder="Любая"
          value={filters.min_capacity ?? ""}
          onChange={(e) => setFilters({ min_capacity: e.target.value ? Number(e.target.value) : undefined })}
          className={inputCls}
        />
      </Field>

      {/* Equipment */}
      <Field label="Оборудование">
        <div className="flex flex-col gap-2">
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
        </div>
      </Field>

      {/* Search button */}
      <button
        onClick={searchRooms}
        disabled={isLoading}
        className={clsx(
          "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl",
          "bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30",
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
  "w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-widest">{label}</label>
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
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        onClick={() => onChange(checked === true ? undefined : true)}
        className={clsx(
          "w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150",
          checked
            ? "bg-blue-500 border-blue-500 shadow-md shadow-blue-500/30"
            : "border-white/20 group-hover:border-white/40 bg-white/5"
        )}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
    </label>
  );
}
