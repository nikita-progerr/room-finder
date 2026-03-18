"use client";

import { useRoomStore } from "@/store/roomStore";
import RoomCard from "./RoomCard";
import { DoorOpen, SearchX, Loader2 } from "lucide-react";
import { useState } from "react";
import RoomScheduleModal from "./RoomScheduleModal";
import type { FreeRoom } from "@/types";

export default function RoomList() {
  const { rooms, isLoading, error, lastSearched } = useRoomStore();
  const [selectedRoom, setSelectedRoom] = useState<FreeRoom | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-sm">Ищем свободные аудитории...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <SearchX className="w-7 h-7 text-red-400" />
        </div>
        <p className="text-white font-medium">Ошибка загрузки</p>
        <p className="text-sm text-slate-500 max-w-xs">{error}</p>
      </div>
    );
  }

  if (!lastSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <DoorOpen className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <p className="text-white font-medium">Найдите свободную аудиторию</p>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">
            Нажмите «Свободно прямо сейчас» или задайте интервал
          </p>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <SearchX className="w-7 h-7 text-amber-400" />
        </div>
        <p className="text-white font-medium">Свободных аудиторий не найдено</p>
        <p className="text-sm text-slate-500">Попробуйте изменить время или фильтры</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Найдено:{" "}
          <span className="font-semibold text-white">{rooms.length}</span>{" "}
          аудитори{plural(rooms.length)}
        </p>
        <p className="text-xs text-slate-600">
          {lastSearched.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} onClick={() => setSelectedRoom(room)} />
        ))}
      </div>

      {selectedRoom && (
        <RoomScheduleModal room={selectedRoom} onClose={() => setSelectedRoom(null)} />
      )}
    </>
  );
}

function plural(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return "я";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "и";
  return "й";
}
