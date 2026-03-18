import { FreeRoom, ROOM_TYPE_LABELS } from "@/types";
import { Monitor, Users, Clock } from "lucide-react";
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
      className="room-card group rounded-2xl p-5 cursor-pointer animate-slide-up"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs font-medium text-blue-400/80 uppercase tracking-widest">
            {ROOM_TYPE_LABELS[room.room_type] || "Аудитория"}
          </span>
          <h3 className="text-2xl font-bold text-white mt-0.5 tracking-tight">
            {room.name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Корпус {room.building} · {room.floor} эт.
          </p>
        </div>

        <div className={clsx(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold",
          isAllDay
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
            : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
        )}>
          <span className={clsx(
            "w-1.5 h-1.5 rounded-full",
            isAllDay ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
          )} />
          {room.free_until ?? "Свободна"}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-3">
        <Users className="w-3.5 h-3.5" />
        <span>{room.capacity} мест</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {room.has_projector && <Chip label="Проектор" />}
        {room.has_computers && <Chip label="ПК" icon={<Monitor className="w-3 h-3" />} />}
        {room.has_whiteboard && <Chip label="Доска" />}
        {room.has_smartboard && <Chip label="Smart" accent />}
      </div>

      {room.next_class_at && (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-3 mt-3 border-t border-white/5">
          <Clock className="w-3 h-3" />
          <span>Следующая пара в {room.next_class_at}</span>
        </div>
      )}
    </div>
  );
}

function Chip({ label, icon, accent }: { label: string; icon?: React.ReactNode; accent?: boolean }) {
  return (
    <span className={clsx(
      "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg font-medium",
      accent
        ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
        : "bg-white/5 text-slate-500 border border-white/5"
    )}>
      {icon}{label}
    </span>
  );
}
