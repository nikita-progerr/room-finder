"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Users, Building2, DoorOpen, Clock } from "lucide-react";
import type { FreeRoom, ScheduleEntry } from "@/types";
import { TIME_SLOTS, DAYS_RU } from "@/types";
import { getRoomSchedule } from "@/services/api";

interface Props {
  room: FreeRoom;
  selectedDay?: number;
  onClose: () => void;
}

export default function RoomScheduleModal({ room, selectedDay, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const dayToShow = selectedDay !== undefined ? selectedDay : (() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  })();

  useEffect(() => {
    setMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setShow(true));
    });

    const loadSchedule = async () => {
      try {
        const now = new Date();
        now.setHours(now.getHours() + 3);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now);
        monday.setDate(diff);
        const weekStartDate = monday.toISOString().split('T')[0];
        
        const data = await getRoomSchedule(room.id, dayToShow, weekStartDate);
        setSchedule(data);
      } catch (e) {
        console.error("Failed to load schedule:", e);
      } finally {
        setLoading(false);
      }
    };
    loadSchedule();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, room.id, dayToShow]);

  const handleClose = useCallback(() => {
    setShow(false);
    setTimeout(onClose, 400);
  }, [onClose]);

  if (!mounted) return null;

  const formatTime = (dateStr: string | undefined | null) => {
    if (!dateStr) return "—";
    return dateStr;
  };

  const getSlotSchedule = (slotIndex: number): ScheduleEntry | undefined => {
    return schedule.find(entry => {
      const [hours, minutes] = entry.time_start.split(":").map(Number);
      const entryMinutes = hours * 60 + minutes;
      const slotTimes = [510, 615, 720, 855, 960, 1080, 1185];
      return entryMinutes === slotTimes[slotIndex];
    });
  };

  const roomTypeLabel = {
    classroom: "Аудитория",
    lab: "Лаборатория",
    lecture_hall: "Лекционный зал",
    seminar: "Семинарская",
  }[room.room_type] || room.room_type;

  return createPortal(
    <div 
      onClick={handleClose}
      className="fixed inset-0 z-[2147483647] flex items-center justify-center p-6"
      style={{
        backgroundColor: "rgba(10, 15, 30, 0.8)",
        backdropFilter: "blur(16px)",
        opacity: show ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="room-card w-full max-w-xl relative rounded-3xl"
        style={{
          transform: show ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
          opacity: show ? 1 : 0,
          transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-blue-500/15 to-purple-500/15 rounded-full blur-3xl" />

        <div className="relative p-10">
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all hover:rotate-90 duration-300"
            style={{ boxShadow: 'none' }}
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <DoorOpen className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xs font-bold text-blue-400/80 uppercase tracking-widest">
              {roomTypeLabel}
            </span>
          </div>

          <h2 className="text-4xl font-bold text-white tracking-tight mb-4">
            {room.name}
          </h2>
          <div className="flex items-center gap-5 text-base text-slate-500 mb-10">
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Корпус {room.building}
            </span>
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            <span>{room.floor} этаж</span>
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            <span>{DAYS_RU[dayToShow]}</span>
          </div>

          <div className="flex items-center gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 mb-8">
            <div className="flex items-center gap-3 text-base text-slate-400">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="font-semibold text-white text-xl">{room.capacity}</span>
              <span className="text-slate-500">мест</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <div className="flex items-center gap-3">
              {room.has_projector && (
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center" title="Проектор">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v12" />
                  </svg>
                </div>
              )}
              {room.has_smartboard && (
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center" title="Интерактивная доска">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {room.has_computers && (
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center" title="Компьютеры">
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Расписание на сегодня
              </span>
            </div>
            {loading ? (
              <div className="text-slate-500 text-sm">Загрузка...</div>
            ) : schedule.length === 0 ? (
              <div className="text-emerald-400 text-sm font-medium">Нет занятий</div>
            ) : (
              <div className="space-y-3">
                {TIME_SLOTS.slice(0, 7).map((slot, idx) => {
                  const entry = getSlotSchedule(idx);
                  const isOccupied = !!entry;
                  return (
                    <div key={idx} className="flex items-center gap-5 group">
                      <span className="text-sm text-slate-600 w-12">{slot.start}</span>
                      <div 
                        className="flex-1 h-8 rounded-lg flex items-center justify-end pr-4 transition-all duration-300 group-hover:scale-[1.02]"
                        style={{ 
                          backgroundColor: isOccupied ? "rgba(244, 63, 94, 0.12)" : "rgba(16, 185, 129, 0.12)",
                        }}
                      >
                        <span className={`text-sm font-medium ${isOccupied ? "text-rose-400" : "text-emerald-400"}`}>
                          {isOccupied ? (entry?.subject || "Занято") : "Свободно"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {schedule.length > 0 && (
            <div className="flex items-center gap-3 text-base text-slate-500 pb-6 mb-6 border-b border-white/5">
              <Clock className="w-5 h-5" />
              <span>Всего занятий сегодня:</span>
              <span className="font-semibold text-blue-400">{schedule.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
