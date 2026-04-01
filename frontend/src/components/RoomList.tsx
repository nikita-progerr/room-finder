"use client";

import { useRoomStore } from "@/store/roomStore";
import RoomCard from "./RoomCard";
import { DoorOpen, SearchX, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import RoomScheduleModal from "./RoomScheduleModal";
import type { FreeRoom } from "@/types";

export default function RoomList() {
  const { rooms, isLoading, error, lastSearched, filters } = useRoomStore();
  const [selectedRoom, setSelectedRoom] = useState<FreeRoom | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-slate-400">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
          </div>
          <div className="absolute inset-0 bg-blue-400/20 rounded-2xl blur-xl animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-white font-medium mb-1">Поиск аудиторий</p>
          <p className="text-sm text-slate-500">Проверяем доступные помещения...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <SearchX className="w-10 h-10 text-red-400" />
          </div>
          <div className="absolute inset-0 bg-red-400/10 rounded-2xl blur-xl" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg mb-1">Ошибка загрузки</p>
          <p className="text-sm text-slate-500 max-w-sm">{error}</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          Попробуйте обновить страницу
        </div>
      </div>
    );
  }

  if (!lastSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-center animate-fade-in">
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 flex items-center justify-center">
            <DoorOpen className="w-12 h-12 text-blue-400" />
          </div>
          <div className="absolute inset-0 bg-blue-400/10 rounded-2xl blur-xl animate-pulse" />
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-pulse" />
        </div>
        <div className="text-center max-w-sm">
          <h3 className="text-xl font-semibold text-white mb-2">Найдите свободную аудиторию</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Нажмите кнопку &quot;Свободно сейчас&quot; или задайте удобное время для поиска
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-500">Система обновляется автоматически</span>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center animate-fade-in">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <SearchX className="w-10 h-10 text-amber-400" />
          </div>
          <div className="absolute inset-0 bg-amber-400/10 rounded-2xl blur-xl" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg mb-1">Ничего не найдено</p>
          <p className="text-sm text-slate-500">Попробуйте изменить время или фильтры</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">
              Найдено: <span className="font-bold text-white text-xl">{rooms.length}</span>{" "}
              аудитори{plural(rooms.length)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <span className="text-xs text-slate-500">
            {lastSearched.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rooms.map((room, index) => (
          <div
            key={room.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <RoomCard room={room} onClick={() => setSelectedRoom(room)} />
          </div>
        ))}
      </div>

      {selectedRoom && (
        <RoomScheduleModal room={selectedRoom} selectedDay={filters.day_of_week} onClose={() => setSelectedRoom(null)} />
      )}
    </>
  );
}

function plural(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return "я";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "и";
  return "й";
}
