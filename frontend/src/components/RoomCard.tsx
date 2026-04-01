import { FreeRoom, ROOM_TYPE_LABELS } from "@/types";
import { Monitor, Users, Clock, Building2, DoorOpen } from "lucide-react";
import clsx from "clsx";

interface Props {
  room: FreeRoom;
  onClick?: () => void;
}

export default function RoomCard({ room, onClick }: Props) {
  const isAllDay = room.free_until === "весь день";

  return (
    <div
      onClick={onClick}
      className="room-card group rounded-3xl p-6 cursor-pointer animate-slide-up relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative flex items-start justify-between mb-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <DoorOpen className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest">
              {ROOM_TYPE_LABELS[room.room_type] || "Аудитория"}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight truncate pr-2">
            {room.name}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              Корпус {room.building}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>{room.floor} этаж</span>
          </div>
        </div>

        <div className={clsx(
          "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0",
          isAllDay
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 glow-emerald"
            : "bg-amber-500/15 text-amber-400 border border-amber-500/30 glow-amber"
        )}>
          <span className={clsx(
            "w-1.5 h-1.5 rounded-full",
            isAllDay ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
          )} />
          <span>{room.free_until ?? "Свободна"}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 mb-5">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <div className="w-9 h-9 rounded-xl bg-slate-500/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <span className="font-semibold text-white">{room.capacity}</span>
          <span className="text-slate-500">мест</span>
        </div>
        
        <div className="flex-1 h-4 flex items-center justify-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
        
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <span>{room.has_projector ? "📽️" : ""} {room.has_computers ? "💻" : ""}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {room.has_projector && <Chip label="Проектор" icon="📽️" />}
        {room.has_computers && <Chip label="ПК" icon="💻" />}
        {room.has_whiteboard && <Chip label="Доска" icon="📝" />}
        {room.has_smartboard && <Chip label="Smart" icon="✨" accent />}
      </div>

      {room.next_class_at && (
        <div className="flex items-center gap-2 text-xs text-slate-500 pt-4 mt-4 border-t border-white/5">
          <Clock className="w-3.5 h-3.5" />
          <span>Следующая пара в</span>
          <span className="font-semibold text-blue-400">{room.next_class_at}</span>
        </div>
      )}
    </div>
  );
}

function Chip({ label, icon, accent }: { label: string; icon?: string; accent?: boolean }) {
  return (
    <span className={clsx(
      "inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium",
      accent
        ? "bg-gradient-to-r from-purple-500/15 to-blue-500/15 text-purple-400 border border-purple-500/20"
        : "bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-slate-300 transition-colors"
    )}>
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}
