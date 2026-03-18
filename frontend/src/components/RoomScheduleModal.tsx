"use client";

import { useEffect, useState } from "react";
import type { FreeRoom, ScheduleEntry } from "@/types";
import { DAYS_FULL_RU, ROOM_TYPE_LABELS } from "@/types";
import { getRoomSchedule } from "@/services/api";
import { X, Loader2, Calendar, Users, Monitor } from "lucide-react";
import clsx from "clsx";

interface Props {
  room: FreeRoom;
  onClose: () => void;
}

const LESSON_LABELS: Record<string, string> = {
  lecture: "Лекция", practice: "Практика", lab: "Лаб.", seminar: "Семинар",
};

const DAY_COLORS = [
  "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "text-purple-400 bg-purple-500/10 border-purple-500/20",
  "text-teal-400 bg-teal-500/10 border-teal-500/20",
  "text-orange-400 bg-orange-500/10 border-orange-500/20",
  "text-red-400 bg-red-500/10 border-red-500/20",
  "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  "text-slate-400 bg-slate-500/10 border-slate-500/20",
];

export default function RoomScheduleModal({ room, onClose }: Props) {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRoomSchedule(room.id).then(setSchedule).catch(console.error).finally(() => setLoading(false));
  }, [room.id]);

  const byDay: Record<number, ScheduleEntry[]> = {};
  schedule.forEach((e) => {
    if (!byDay[e.day_of_week]) byDay[e.day_of_week] = [];
    byDay[e.day_of_week].push(e);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="glass-panel rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-white">{room.name}</span>
              <span className="text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                {ROOM_TYPE_LABELS[room.room_type]}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Корпус {room.building} · {room.floor} этаж</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badges */}
        <div className="px-6 py-3 flex gap-4 border-b border-white/5">
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
            <Users className="w-4 h-4 text-slate-600" />{room.capacity} мест
          </span>
          {room.has_projector && (
            <span className="text-sm text-slate-400">Проектор</span>
          )}
          {room.has_computers && (
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
              <Monitor className="w-4 h-4 text-slate-600" />ПК
            </span>
          )}
        </div>

        {/* Schedule */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-widest mb-4">
            <Calendar className="w-3.5 h-3.5" />
            Расписание
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            </div>
          ) : schedule.length === 0 ? (
            <p className="text-center text-slate-600 py-10 text-sm">Расписание отсутствует</p>
          ) : (
            <div className="space-y-5">
              {[0,1,2,3,4,5].map((day) => {
                const entries = byDay[day];
                if (!entries?.length) return null;
                return (
                  <div key={day}>
                    <span className={clsx("text-xs font-semibold px-2.5 py-1 rounded-lg inline-block mb-2 border", DAY_COLORS[day])}>
                      {DAYS_FULL_RU[day]}
                    </span>
                    <div className="space-y-2">
                      {entries.sort((a,b) => a.time_start.localeCompare(b.time_start)).map((e) => (
                        <div key={e.id} className="flex gap-3 items-start bg-white/[0.03] border border-white/5 rounded-xl p-3">
                          <div className="text-xs font-mono text-slate-600 pt-0.5 shrink-0 w-12">
                            {e.time_start.slice(0,5)}<br/>{e.time_end.slice(0,5)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 leading-snug truncate">{e.subject}</p>
                            {e.teacher && <p className="text-xs text-slate-500 mt-0.5">{e.teacher}</p>}
                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                              {e.group_name && <Tag>{e.group_name}</Tag>}
                              {e.lesson_type && <Tag>{LESSON_LABELS[e.lesson_type] ?? e.lesson_type}</Tag>}
                              {e.week_type !== "both" && (
                                <Tag accent>{e.week_type === "odd" ? "Нечёт." : "Чёт."}</Tag>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span className={clsx(
      "text-xs px-1.5 py-0.5 rounded border",
      accent
        ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
        : "bg-white/5 border-white/10 text-slate-500"
    )}>
      {children}
    </span>
  );
}
