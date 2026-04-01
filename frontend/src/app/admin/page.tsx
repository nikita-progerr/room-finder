"use client";

import { useEffect, useState } from "react";
import { useRoomStore } from "@/store/roomStore";
import { TIME_SLOTS, DAYS_RU, DAYS_FULL_RU, LESSON_TYPE_LABELS } from "@/types";
import type { ScheduleEntryCreate, ScheduleEntry } from "@/types";
import { ChevronLeft, ChevronRight, Calendar, Trash2, Edit3, Save, X, Lock, User } from "lucide-react";
import clsx from "clsx";

function getWeekRange(offset: number = 0): { start: Date; end: Date; label: string; weekStartDate: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const formatDate = (d: Date) => d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayNum}`;
  };
  
  return {
    start: monday,
    end: sunday,
    label: `${formatDate(monday)} — ${formatDate(sunday)}`,
    weekStartDate: formatLocalDate(monday),
  };
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

function getDayDate(weekStartDate: string, dayIndex: number): string {
  const start = new Date(weekStartDate);
  start.setDate(start.getDate() + dayIndex);
  return start.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

const VALID_LOGIN = "Green4";
const VALID_PASSWORD = "262626";

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login === VALID_LOGIN && password === VALID_PASSWORD) {
      onLogin();
    } else {
      setError("Неверный логин или пароль");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div 
          className={`w-full max-w-md p-8 rounded-2xl border transition-all duration-300 animate-fade-in-up
            ${isShaking ? 'shake' : ''}`}
          style={{
            background: "linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)",
            borderColor: "rgba(59, 130, 246, 0.3)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.1)",
          }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" 
              style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}>
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              Админ-панель
            </h2>
            <p className="text-sm mt-2" style={{ color: "#94a3b8" }}>Введите учетные данные</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#64748b" }} />
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Логин"
                className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  background: "rgba(51, 65, 85, 0.5)",
                  border: "1px solid rgba(100, 116, 139, 0.3)",
                }}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#64748b" }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  background: "rgba(51, 65, 85, 0.5)",
                  border: "1px solid rgba(100, 116, 139, 0.3)",
                }}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm" 
                style={{ 
                  background: "rgba(239, 68, 68, 0.1)", 
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#fca5a5"
                }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                boxShadow: "0 4px 15px rgba(37, 99, 235, 0.4)",
              }}
            >
              Войти
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm hover:underline" style={{ color: "#64748b" }}>
              ← На главную
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  }

  return <AdminContent />;
}

function AdminContent() {
  const {
    buildings,
    allRooms,
    teachers,
    isLoading,
    error,
    loadBuildings,
    loadAllRooms,
    loadTeachers,
    addScheduleEntry,
    loadSchedule,
    scheduleEntries,
    updateScheduleEntry,
    removeScheduleEntry,
  } = useRoomStore();

  const [formData, setFormData] = useState<ScheduleEntryCreate>({
    room_id: 0,
    day_of_week: 0,
    week_start_date: "",
    time_start: "08:30",
    time_end: "10:05",
    subject: "",
    teacher_id: undefined,
    group_name: "",
    lesson_type: "",
    is_recurring: true,
  });

  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [editingEntry, setEditingEntry] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<ScheduleEntryCreate | null>(null);
  
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const weekInfo = getWeekRange(weekOffset);

  const allGroups = Array.from(new Set(scheduleEntries
    .map(e => e.group_name)
    .filter((g): g is string => !!g)
  )).sort();

  useEffect(() => {
    loadBuildings();
    loadAllRooms();
    loadTeachers();
    loadSchedule();
  }, []);

  useEffect(() => {
    setFormData(prev => ({ ...prev, week_start_date: weekInfo.weekStartDate }));
  }, [weekOffset]);

  const filteredRooms = selectedBuilding
    ? allRooms.filter((r) => r.building === selectedBuilding)
    : allRooms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addScheduleEntry({
        ...formData,
        week_start_date: weekInfo.weekStartDate,
      });
      setSuccessMessage("Занятие добавлено!");
      setTimeout(() => setSuccessMessage(""), 3000);
      setFormData({
        ...formData,
        subject: "",
        group_name: "",
        teacher_id: undefined,
      });
    } catch {
      // Error handled by store
    }
  };

  const handleEdit = (entry: ScheduleEntry) => {
    setEditingEntry(entry.id);
    const room = allRooms.find(r => r.id === entry.room_id);
    setEditFormData({
      room_id: entry.room_id,
      day_of_week: entry.day_of_week,
      week_start_date: entry.week_start_date || "",
      time_start: entry.time_start.slice(0, 5),
      time_end: entry.time_end.slice(0, 5),
      subject: entry.subject,
      teacher_id: entry.teacher_id || undefined,
      group_name: entry.group_name || "",
      lesson_type: entry.lesson_type || "",
      is_recurring: entry.is_recurring,
    });
    setSelectedBuilding(room?.building?.toString() || "");
  };

  const handleSaveEdit = async () => {
    if (!editFormData || !editingEntry) return;
    try {
      await updateScheduleEntry(editingEntry, editFormData);
      setSuccessMessage("Занятие обновлено!");
      setTimeout(() => setSuccessMessage(""), 3000);
      setEditingEntry(null);
      setEditFormData(null);
    } catch {
      // Error handled by store
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditFormData(null);
  };

  const handleDelete = async (entryId: number) => {
    if (!confirm("Вы уверены, что хотите удалить это занятие?")) return;
    try {
      await removeScheduleEntry(entryId);
      setSuccessMessage("Занятие удалено!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      // Error handled by store
    }
  };

  const filteredSchedule = scheduleEntries.filter((e) => {
    if (selectedGroup && e.group_name !== selectedGroup) return false;
    if (e.week_start_date && e.week_start_date !== weekInfo.weekStartDate) return false;
    return true;
  });

  const byDay: Record<number, ScheduleEntry[]> = {};
  filteredSchedule.forEach((e) => {
    if (!byDay[e.day_of_week]) byDay[e.day_of_week] = [];
    byDay[e.day_of_week].push(e);
  });

  const LESSON_LABELS: Record<string, string> = {
    lecture: "Лекция", practice: "Практика", lab: "Лаб.", seminar: "Семинар",
  };

  const DAY_COLORS = [
    "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "bg-teal-500/20 text-teal-400 border-teal-500/30",
    "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "bg-red-500/20 text-red-400 border-red-500/30",
    "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Админ-панель</h1>
              <p className="text-sm text-slate-400">Управление расписанием</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
              >
                Выйти
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
              >
                На главную
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-[450px_1fr] gap-8">
            {/* Форма добавления */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10 h-fit">
              <h2 className="text-xl font-semibold text-white mb-6">Добавить занятие</h2>
              <p className="text-sm text-slate-400 mb-4">Неделя: {weekInfo.label}</p>

              {successMessage && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                  {successMessage}
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Корпус</label>
                  <select
                    value={selectedBuilding}
                    onChange={(e) => {
                      setSelectedBuilding(e.target.value);
                      setFormData({ ...formData, room_id: 0 });
                    }}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Выберите корпус</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.code}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Аудитория</label>
                  <select
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value={0}>Выберите аудиторию</option>
                    {filteredRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        к{r.building}. {r.name} ауд.
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">День недели</label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {DAYS_RU.map((day, i) => (
                      <option key={i} value={i}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Пара</label>
                  <select
                    value={`${formData.time_start}-${formData.time_end}`}
                    onChange={(e) => {
                      const [start, end] = e.target.value.split("-");
                      setFormData({ ...formData, time_start: start, time_end: end });
                    }}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.slot} value={`${slot.start}-${slot.end}`}>
                        {slot.label} ({slot.start} - {slot.end})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Преподаватель</label>
                  <select
                    value={formData.teacher_id || ""}
                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Без преподавателя</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Группа</label>
                  <input
                    type="text"
                    value={formData.group_name || ""}
                    onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                    placeholder="Например: АВТ-15"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Дисциплина</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Название предмета"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Тип занятия</label>
                  <select
                    value={formData.lesson_type || ""}
                    onChange={(e) => setFormData({ ...formData, lesson_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Не указано</option>
                    {Object.entries(LESSON_TYPE_LABELS).map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !formData.room_id || !formData.subject}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
                >
                  {isLoading ? "Добавление..." : "Добавить занятие"}
                </button>
              </form>
            </div>

            {/* Текущее расписание */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10 flex flex-col" style={{ maxHeight: "calc(100vh - 150px)" }}>
              <h2 className="text-xl font-semibold text-white mb-4">Текущее расписание</h2>
              
              <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWeekOffset(w => w - 1)}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col items-center px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-bold text-white">{weekInfo.label}</span>
                    </div>
                    <span className="text-xs text-slate-400 mt-0.5">{formatDateDisplay(weekInfo.weekStartDate)}</span>
                  </div>
                  <button
                    onClick={() => setWeekOffset(w => w + 1)}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  {weekOffset !== 0 && (
                    <button
                      onClick={() => setWeekOffset(0)}
                      className="px-3 py-2 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/20 transition"
                    >
                      Сегодня
                    </button>
                  )}
                </div>
                
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 min-w-[150px]"
                >
                  <option value="">Все группы</option>
                  {allGroups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              
              {isLoading && <p className="text-slate-400">Загрузка...</p>}
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {filteredSchedule.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Calendar className="w-16 h-16 text-slate-600 mb-4" />
                    <p className="text-lg font-medium text-slate-400">Расписание отсутствует</p>
                    <p className="text-sm text-slate-600 mt-1">Нажмите "Добавить занятие" для этой недели</p>
                  </div>
                ) : (
                  [0,1,2,3,4,5].map((day) => {
                    const entries = byDay[day];
                    if (!entries?.length) return null;
                    return (
                      <div key={day} className="animate-slide-up">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={clsx("text-sm font-bold px-4 py-2 rounded-xl inline-block border", DAY_COLORS[day])}>
                            {DAYS_FULL_RU[day]}
                          </span>
                          <span className="text-sm text-slate-500">
                            {getDayDate(weekInfo.weekStartDate, day)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {entries.sort((a,b) => a.time_start.localeCompare(b.time_start)).map((entry) => {
                            const room = allRooms.find((r) => r.id === entry.room_id);
                            const isEditing = editingEntry === entry.id;
                            
                            return (
                              <div key={entry.id} className="p-4 bg-slate-700/50 rounded-xl border border-slate-600 hover:border-slate-500 transition-all">
                                {isEditing && editFormData ? (
                                  <div className="space-y-3">
                                    <select
                                      value={editFormData.room_id}
                                      onChange={(e) => setEditFormData({ ...editFormData, room_id: parseInt(e.target.value) })}
                                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                                    >
                                      <option value={0}>Выберите аудиторию</option>
                                      {allRooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                          к{r.building}. {r.name} ауд.
                                        </option>
                                      ))}
                                    </select>
                                    <div className="grid grid-cols-2 gap-2">
                                      <select
                                        value={editFormData.day_of_week}
                                        onChange={(e) => setEditFormData({ ...editFormData, day_of_week: parseInt(e.target.value) })}
                                        className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                                      >
                                        {DAYS_RU.map((d, i) => <option key={i} value={i}>{d}</option>)}
                                      </select>
                                      <input
                                        type="date"
                                        value={editFormData.week_start_date || ""}
                                        onChange={(e) => setEditFormData({ ...editFormData, week_start_date: e.target.value })}
                                        className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                                      />
                                    </div>
                                    <select
                                      value={`${editFormData.time_start}-${editFormData.time_end}`}
                                      onChange={(e) => {
                                        const [start, end] = e.target.value.split("-");
                                        setEditFormData({ ...editFormData, time_start: start, time_end: end });
                                      }}
                                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                                    >
                                      {TIME_SLOTS.map((slot) => (
                                        <option key={slot.slot} value={`${slot.start}-${slot.end}`}>
                                          {slot.label} ({slot.start} - {slot.end})
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      type="text"
                                      value={editFormData.subject}
                                      onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                                    />
                                    <input
                                      type="text"
                                      value={editFormData.group_name || ""}
                                      onChange={(e) => setEditFormData({ ...editFormData, group_name: e.target.value })}
                                      placeholder="Группа"
                                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm placeholder-slate-400"
                                    />
                                    <select
                                      value={editFormData.teacher_id || ""}
                                      onChange={(e) => setEditFormData({ ...editFormData, teacher_id: e.target.value ? parseInt(e.target.value) : undefined })}
                                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                                    >
                                      <option value="">Без преподавателя</option>
                                      {teachers.map((t) => (
                                        <option key={t.id} value={t.id}>{t.full_name}</option>
                                      ))}
                                    </select>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={handleSaveEdit}
                                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                                      >
                                        <Save className="w-4 h-4" />
                                        Сохранить
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="flex-1 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                                      >
                                        <X className="w-4 h-4" />
                                        Отмена
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex gap-4 items-start">
                                    <div className="flex flex-col items-center justify-center w-16 h-14 rounded-lg bg-slate-600/50 border border-slate-500 shrink-0">
                                      <span className="text-sm font-bold text-white">{entry.time_start.slice(0,5)}</span>
                                      <div className="w-6 h-px bg-slate-500 my-1" />
                                      <span className="text-xs text-slate-400">{entry.time_end.slice(0,5)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-white mb-1">{entry.subject}</p>
                                      <p className="text-sm text-slate-400">
                                        {room ? `к${room.building}, ${room.name}` : `Ауд. ${entry.room_id}`}
                                        {entry.group_name && ` • ${entry.group_name}`}
                                      </p>
                                      {entry.teacher && (
                                        <p className="text-xs text-slate-500 mt-0.5">{entry.teacher}</p>
                                      )}
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        {entry.lesson_type && (
                                          <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                            {LESSON_LABELS[entry.lesson_type] ?? entry.lesson_type}
                                          </span>
                                        )}
                                        {entry.teacher && (
                                          <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                            {entry.teacher}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1 shrink-0">
                                      <button
                                        onClick={() => handleEdit(entry)}
                                        className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition"
                                        title="Изменить"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(entry.id)}
                                        className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition"
                                        title="Удалить"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}