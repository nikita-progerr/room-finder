import { useState, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// КОНСТАНТЫ
// ─────────────────────────────────────────────────────────────────────────────

const DAYS_FULL  = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
const DAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTHS_RU  = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];

const PAIR_TIMES = [
  { pair: 1, start: "08:00", end: "09:35" },
  { pair: 2, start: "09:45", end: "11:20" },
  { pair: 3, start: "11:30", end: "13:05" },
  { pair: 4, start: "13:35", end: "15:10" },
  { pair: 5, start: "15:20", end: "16:55" },
  { pair: 6, start: "17:05", end: "18:40" },
  { pair: 7, start: "18:50", end: "20:25" },
];

const LESSON_TYPES = {
  lecture:  { label: "Лекция",      color: "#6366f1", bg: "#eef2ff", text: "#3730a3" },
  practice: { label: "Практика",    color: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  lab:      { label: "Лаб. работа", color: "#f97316", bg: "#fff7ed", text: "#9a3412" },
  seminar:  { label: "Семинар",     color: "#a855f7", bg: "#fdf4ff", text: "#6b21a8" },
};

// ─────────────────────────────────────────────────────────────────────────────
// БАЗА ДАННЫХ ГРУПП
//
// Источник: официальный сайт СарФТИ НИЯУ МИФИ (sarfti.ru),
//           система управления расписанием.
//
// Формат номера: [поток][курс]
//   первая цифра — номер потока (1, 2, 3, 4, 5, 6)
//   вторая цифра — курс обучения (1, 2, 3, 4, 5, 6)
//
// Суффикс "В" — вечерняя форма обучения
// ─────────────────────────────────────────────────────────────────────────────

const GROUP_CATALOG = [
  {
    dept: "АВТ",
    name: "Автоматизация технологических процессов",
    groups: [
      { id: "АВТ-15", stream: 1, course: 5 },
      { id: "АВТ-24", stream: 2, course: 4 },
      { id: "АВТ-33", stream: 3, course: 3 },
    ],
  },
  {
    dept: "ВО",
    name: "Вооружение и военная техника",
    groups: [
      { id: "ВО-21", stream: 2, course: 1 },
    ],
  },
  {
    dept: "ВТ",
    name: "Информатика и вычислительная техника",
    groups: [
      { id: "ВТ-15",          stream: 1, course: 5 },
      { id: "БТ-15В_УВТ-15В", stream: 1, course: 5, note: "совм. вечерняя" },
      { id: "ВТ-24",          stream: 2, course: 4 },
      { id: "ВТ-33",          stream: 3, course: 3 },
      { id: "ВТ-42",          stream: 4, course: 2 },
    ],
  },
  {
    dept: "ВТМ",
    name: "Вычислительные машины, комплексы, системы",
    groups: [
      { id: "ВТМ-15", stream: 1, course: 5 },
      { id: "ВТМ-24", stream: 2, course: 4 },
    ],
  },
  {
    dept: "ВЧ",
    name: "Прикладная математика (вечерняя)",
    groups: [
      { id: "ВЧ-21-2", stream: 2, course: 1, note: "2-я подгр." },
      { id: "ВЧ-23",   stream: 2, course: 3 },
    ],
  },
  {
    dept: "ДП",
    name: "Дизайн и полиграфия",
    groups: [
      { id: "ДП-15", stream: 1, course: 5 },
      { id: "ДП-24", stream: 2, course: 4 },
      { id: "ДП-33", stream: 3, course: 3 },
      { id: "ДП-42", stream: 4, course: 2 },
    ],
  },
  {
    dept: "ДПМ",
    name: "Дизайн промышленный",
    groups: [
      { id: "ДПМ-15", stream: 1, course: 5 },
      { id: "ДПМ-24", stream: 2, course: 4 },
    ],
  },
  {
    dept: "ИТ",
    name: "Информационные системы и технологии",
    groups: [
      { id: "ИТ-15", stream: 1, course: 5 },
      { id: "ИТ-24", stream: 2, course: 4 },
      { id: "ИТ-33", stream: 3, course: 3 },
      { id: "ИТ-42", stream: 4, course: 2 },
    ],
  },
  {
    dept: "ИТМ",
    name: "ИТ-менеджмент",
    groups: [
      { id: "ИТМ-15", stream: 1, course: 5 },
      { id: "ИТМ-24", stream: 2, course: 4 },
    ],
  },
  {
    dept: "КМ",
    name: "Конструирование и технологии машиностроения",
    groups: [
      { id: "КМ-15", stream: 1, course: 5 },
      { id: "КМ-24", stream: 2, course: 4 },
    ],
  },
  {
    dept: "КС",
    name: "Конструирование средств связи",
    groups: [
      { id: "КС-15", stream: 1, course: 5 },
    ],
  },
  {
    dept: "КСК",
    name: "Компьютерные системы и комплексы",
    groups: [
      { id: "КСК-15", stream: 1, course: 5 },
      { id: "КСК-24", stream: 2, course: 4 },
    ],
  },
  {
    dept: "КЭ",
    name: "Компьютерная электроника",
    groups: [
      { id: "КЭ-15", stream: 1, course: 5 },
      { id: "КЭ-23", stream: 2, course: 3 },
      { id: "КЭ-33", stream: 3, course: 3 },
      { id: "КЭ-42", stream: 4, course: 2 },
    ],
  },
  {
    dept: "МИТ",
    name: "Машиностроение и технологии",
    groups: [
      { id: "МИТ-14", stream: 1, course: 4 },
      { id: "МИТ-24", stream: 2, course: 4 },
    ],
  },
  {
    dept: "МФ",
    name: "Математические и физические методы",
    groups: [
      { id: "МФ-15", stream: 1, course: 5 },
      { id: "МФ-24", stream: 2, course: 4 },
      { id: "МФ-33", stream: 3, course: 3 },
      { id: "МФ-42", stream: 4, course: 2 },
    ],
  },
  {
    dept: "П",
    name: "Прикладная информатика",
    groups: [
      { id: "П-21", stream: 2, course: 1 },
    ],
  },
  {
    dept: "ПМ",
    name: "Прикладная математика",
    groups: [
      { id: "ПМ-15", stream: 1, course: 5 },
      { id: "ПМ-24", stream: 2, course: 4 },
      { id: "ПМ-33", stream: 3, course: 3 },
      { id: "ПМ-42", stream: 4, course: 2 },
    ],
  },
  {
    dept: "ПМИ",
    name: "Прикладная математика и информатика",
    groups: [
      { id: "ПМИ-15", stream: 1, course: 5 },
      { id: "ПМИ-24", stream: 2, course: 4 },
    ],
  },
  {
    dept: "ПМФ",
    name: "Прикладная математика и физика",
    groups: [
      { id: "ПМФ-15", stream: 1, course: 5 },
      { id: "ПМФ-24", stream: 2, course: 4 },
      { id: "ПМФ-33", stream: 3, course: 3 },
    ],
  },
  {
    dept: "ПР",
    name: "Промышленная робототехника",
    groups: [
      { id: "ПР-33", stream: 3, course: 3 },
      { id: "ПР-42", stream: 4, course: 2 },
      { id: "ПР-51", stream: 5, course: 1 },
      { id: "ПР-60", stream: 6, course: 0, note: "подготовительный" },
    ],
  },
  {
    dept: "РФ",
    name: "Радиофизика",
    groups: [
      { id: "РФ-33", stream: 3, course: 3 },
      { id: "РФ-42", stream: 4, course: 2 },
      { id: "РФ-51", stream: 5, course: 1 },
      { id: "РФ-60", stream: 6, course: 0, note: "подготовительный" },
    ],
  },
  {
    dept: "СПО",
    name: "Среднее профессиональное образование",
    groups: [
      { id: "СПО-21", stream: 2, course: 1 },
    ],
  },
  {
    dept: "ТМ",
    name: "Техническая механика и инженерное проектирование",
    groups: [
      { id: "ТМ-15",          stream: 1, course: 5 },
      { id: "ТМ-15В_УТМ-15В", stream: 1, course: 5, note: "совм. вечерняя" },
      { id: "ТМ-24",          stream: 2, course: 4 },
      { id: "ТМ-33",          stream: 3, course: 3 },
      { id: "ТМ-42",          stream: 4, course: 2 },
    ],
  },
  {
    dept: "ТММ",
    name: "Технология машиностроения",
    groups: [
      { id: "ТММ-15-1", stream: 1, course: 5, note: "подгр. 1" },
      { id: "ТММ-15-2", stream: 1, course: 5, note: "подгр. 2" },
      { id: "ТММ-24-1", stream: 2, course: 4, note: "подгр. 1" },
      { id: "ТММ-24-2", stream: 2, course: 4, note: "подгр. 2" },
    ],
  },
  {
    dept: "ТМТ",
    name: "Техника и технологии машиностроения",
    groups: [
      { id: "ТМТ-15", stream: 1, course: 5 },
      { id: "ТМТ-24", stream: 2, course: 4 },
      { id: "ТМТ-33", stream: 3, course: 3 },
    ],
  },
  {
    dept: "ТФ",
    name: "Теоретическая физика",
    groups: [
      { id: "ТФ-33", stream: 3, course: 3 },
    ],
  },
  {
    dept: "УВТ",
    name: "Управление в технических системах (вечерняя)",
    groups: [
      { id: "УВТ-23В", stream: 2, course: 3, note: "вечерняя" },
      { id: "УВТ-33В", stream: 3, course: 3, note: "вечерняя" },
      { id: "УВТ-42В", stream: 4, course: 2, note: "вечерняя" },
    ],
  },
  {
    dept: "УТМ",
    name: "Управление технологическими машинами (вечерняя)",
    groups: [
      { id: "УТМ-24В", stream: 2, course: 4, note: "вечерняя" },
      { id: "УТМ-33В", stream: 3, course: 3, note: "вечерняя" },
      { id: "УТМ-42В", stream: 4, course: 2, note: "вечерняя" },
    ],
  },
  {
    dept: "ФДП",
    name: "Факультет довузовской подготовки",
    groups: [
      { id: "ФДП-10", stream: 1, course: 0, note: "1-й год" },
      { id: "ФДП-11", stream: 1, course: 1, note: "2-й год" },
    ],
  },
  {
    dept: "ЦСМ",
    name: "Цифровые системы и машины",
    groups: [
      { id: "ЦСМ-15", stream: 1, course: 5 },
    ],
  },
  {
    dept: "ЦТ",
    name: "Цифровые технологии",
    groups: [
      { id: "ЦТ-15", stream: 1, course: 5 },
      { id: "ЦТ-24", stream: 2, course: 4 },
      { id: "ЦТ-33", stream: 3, course: 3 },
      { id: "ЦТ-42", stream: 4, course: 2 },
    ],
  },
  {
    dept: "ЦТМ",
    name: "Цифровые технологии и менеджмент",
    groups: [
      { id: "ЦТМ-15", stream: 1, course: 5 },
      { id: "ЦТМ-24", stream: 2, course: 4 },
    ],
  },
  {
    dept: "ЭК",
    name: "Электроника и компьютерные системы",
    groups: [
      { id: "ЭК-15", stream: 1, course: 5 },
      { id: "ЭК-24", stream: 2, course: 4 },
      { id: "ЭК-33", stream: 3, course: 3 },
      { id: "ЭК-42", stream: 4, course: 2 },
    ],
  },
  {
    dept: "ЭП",
    name: "Электроника (проектирование систем)",
    groups: [
      { id: "ЭП-22", stream: 2, course: 2 },
      { id: "ЭП-32", stream: 3, course: 2 },
      { id: "ЭП-42", stream: 4, course: 2 },
    ],
  },
  {
    dept: "ЭПМ",
    name: "Электроника и приборостроение",
    groups: [
      { id: "ЭПМ-15", stream: 1, course: 5 },
      { id: "ЭПМ-24", stream: 2, course: 4 },
    ],
  },
  {
    dept: "ЭФУ",
    name: "Экспериментальная физика",
    groups: [
      { id: "ЭФУ-33", stream: 3, course: 3 },
      { id: "ЭФУ-42", stream: 4, course: 2 },
      { id: "ЭФУ-51", stream: 5, course: 1 },
      { id: "ЭФУ-60", stream: 6, course: 0, note: "подготовительный" },
    ],
  },
  {
    dept: "ЯРФ",
    name: "Ядерные реакторы и физические установки",
    groups: [
      { id: "ЯРФ-15", stream: 1, course: 5 },
      { id: "ЯРФ-24", stream: 2, course: 4 },
      { id: "ЯРФ-33", stream: 3, course: 3 },
      { id: "ЯРФ-42", stream: 4, course: 2 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// УТИЛИТЫ — ДАТА
// ─────────────────────────────────────────────────────────────────────────────

function getWeekDates() {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));

  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isToday(date) {
  const now = new Date();
  return (
    date.getDate()     === now.getDate()     &&
    date.getMonth()    === now.getMonth()    &&
    date.getFullYear() === now.getFullYear()
  );
}

function getTodayIndex() {
  const dow = new Date().getDay();
  return dow === 0 ? 5 : dow - 1;
}

function shortDate(date) {
  return `${date.getDate()} ${MONTHS_RU[date.getMonth()]}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI — ЗАПРОС РАСПИСАНИЯ
// ─────────────────────────────────────────────────────────────────────────────

async function requestSchedule(groupId) {
  const deptEntry = GROUP_CATALOG.find(d => d.groups.some(g => g.id === groupId));
  const deptName  = deptEntry?.name ?? groupId;

  const prompt = `Ты — помощник по расписанию СарФТИ НИЯУ МИФИ.
Сгенерируй реалистичное учебное расписание на текущую неделю для группы ${groupId} (${deptName}).

Верни ТОЛЬКО валидный JSON, без комментариев и без markdown-блоков:
{
  "group": "${groupId}",
  "schedule": { "0": [], "1": [], "2": [], "3": [], "4": [], "5": [] }
}

0=Понедельник, 1=Вторник, 2=Среда, 3=Четверг, 4=Пятница, 5=Суббота.
Каждое занятие:
{
  "pair": <1–7>,
  "subject": "Название",
  "teacher": "Фамилия И.О.",
  "room": "Номер",
  "type": "lecture" | "practice" | "lab" | "seminar",
  "subgroup": null | 1 | 2
}

Правила: дисциплины должны соответствовать направлению «${deptName}».
3–5 пар в будни, суббота — 0–2 пары или пусто. Не повторяй одну пару в день.
Аудитории: 214, 215, 301, 316, Б-201, Б-205, Б-302, Спорт.зал и т.п.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Ошибка API: ${res.status}`);

  const data    = await res.json();
  const raw     = data.content.map(b => b.text || "").join("");
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

// ─────────────────────────────────────────────────────────────────────────────
// КОМПОНЕНТ: Карточка занятия
// ─────────────────────────────────────────────────────────────────────────────

function LessonCard({ lesson, delay, visible }) {
  const info = LESSON_TYPES[lesson.type] ?? LESSON_TYPES.lecture;
  const time = PAIR_TIMES.find(p => p.pair === lesson.pair);

  return (
    <div style={{
      background:   info.bg,
      border:       `1px solid ${info.color}30`,
      borderLeft:   `3px solid ${info.color}`,
      borderRadius: "8px",
      padding:      "10px 12px",
      marginBottom: "8px",
      opacity:      visible ? 1 : 0,
      transform:    visible ? "translateY(0)" : "translateY(10px)",
      transition:   `opacity .35s ease ${delay}ms, transform .35s ease ${delay}ms`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Тип + подгруппа */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
            <span style={{
              fontSize: "10px", fontWeight: 600, letterSpacing: "0.02em",
              padding: "2px 7px", borderRadius: "4px",
              background: info.color, color: "#fff",
            }}>
              {info.label}
            </span>
            {lesson.subgroup && (
              <span style={{
                fontSize: "10px", padding: "2px 6px", borderRadius: "4px",
                border: `1px solid ${info.color}55`, color: info.text,
              }}>
                подгр. {lesson.subgroup}
              </span>
            )}
          </div>

          {/* Название предмета */}
          <div style={{
            fontSize: "13px", fontWeight: 600, color: "#1e293b",
            lineHeight: 1.35, marginBottom: "5px",
          }}>
            {lesson.subject}
          </div>

          {/* Преподаватель и аудитория */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {lesson.teacher && (
              <span style={{ fontSize: "12px", color: "#64748b" }}>👤 {lesson.teacher}</span>
            )}
            {lesson.room && (
              <span style={{ fontSize: "12px", color: "#64748b" }}>📍 ауд. {lesson.room}</span>
            )}
          </div>
        </div>

        {/* Номер и время пары */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: info.text }}>
            {lesson.pair} пара
          </div>
          {time && (
            <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px", lineHeight: 1.5 }}>
              {time.start}<br />{time.end}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// КОМПОНЕНТ: Вкладка дня
// ─────────────────────────────────────────────────────────────────────────────

function DayTab({ dayIndex, date, count, isSelected, onClick }) {
  const today = isToday(date);

  return (
    <button
      onClick={() => onClick(dayIndex)}
      style={{
        flex:         1,
        minWidth:     "80px",
        padding:      "9px 6px",
        borderRadius: "10px",
        border:       `${isSelected || today ? "2px" : "1px"} solid ${
          isSelected ? "#6366f1" : today ? "#10b981" : "#e2e8f0"
        }`,
        background:   isSelected ? "#f5f3ff" : today ? "#f0fdf4" : "#fff",
        cursor:       "pointer",
        textAlign:    "center",
        transition:   "all .18s ease",
      }}
    >
      <div style={{
        fontSize:      "10px",
        fontWeight:    600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color:  isSelected ? "#6366f1" : today ? "#10b981" : "#94a3b8",
        marginBottom: "2px",
      }}>
        {DAYS_SHORT[dayIndex]}
      </div>
      <div style={{
        fontSize:  "16px",
        fontWeight: 700,
        lineHeight: 1.1,
        color: isSelected ? "#4338ca" : today ? "#065f46" : "#1e293b",
      }}>
        {date.getDate()}
      </div>
      <div style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "3px" }}>
        {MONTHS_RU[date.getMonth()]}
      </div>

      {today && (
        <div style={{
          display: "inline-block", fontSize: "9px", fontWeight: 600,
          background: "#d1fae5", color: "#065f46",
          borderRadius: "20px", padding: "1px 6px", marginBottom: "2px",
        }}>
          сегодня
        </div>
      )}

      <div style={{
        fontSize:   "11px",
        fontWeight: count > 0 ? 600 : 400,
        color:      count > 0 ? "#6366f1" : "#cbd5e1",
        marginTop:  "2px",
      }}>
        {count > 0 ? `${count} п.` : "—"}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// КОМПОНЕНТ: Скелетон (загрузка)
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: "#f1f5f9", borderRadius: "8px",
      padding: "12px", marginBottom: "8px", border: "1px solid #e2e8f0",
    }}>
      {[["55%", "11px", "8px"], ["80%", "14px", "6px"], ["45%", "11px", "0"]].map(([w, h, mb], i) => (
        <div key={i} style={{
          width: w, height: h, background: "#e2e8f0", borderRadius: "4px", marginBottom: mb,
          animation: `sPulse 1.4s ease ${i * 0.15}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// КОМПОНЕНТ: Боковая панель со списком групп
// ─────────────────────────────────────────────────────────────────────────────

function Sidebar({ activeGroupId, onSelect }) {
  const [search,    setSearch]    = useState("");
  const [openDepts, setOpenDepts] = useState(new Set());

  function toggleDept(dept) {
    setOpenDepts(prev => {
      const next = new Set(prev);
      next.has(dept) ? next.delete(dept) : next.add(dept);
      return next;
    });
  }

  const query = search.trim().toLowerCase();

  const catalog = query
    ? GROUP_CATALOG
        .map(e => ({ ...e, groups: e.groups.filter(g => g.id.toLowerCase().includes(query)) }))
        .filter(e => e.groups.length > 0)
    : GROUP_CATALOG;

  return (
    <aside style={{
      width:        "224px",
      flexShrink:   0,
      borderRight:  "1px solid #e2e8f0",
      background:   "#fafbfc",
      display:      "flex",
      flexDirection: "column",
      overflowY:    "hidden",
    }}>

      {/* Поиск */}
      <div style={{ padding: "12px 12px 8px" }}>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: "9px", top: "50%",
            transform: "translateY(-50%)", fontSize: "13px", color: "#94a3b8",
            pointerEvents: "none",
          }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Найти группу..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "7px 10px 7px 28px",
              fontSize: "13px", borderRadius: "8px",
              border: "1px solid #e2e8f0", background: "#fff",
              color: "#1e293b", outline: "none",
            }}
          />
        </div>
      </div>

      {/* Список */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "12px" }}>
        {catalog.map(entry => {
          const isOpen      = query ? true : openDepts.has(entry.dept);
          const hasActive   = entry.groups.some(g => g.id === activeGroupId);

          return (
            <div key={entry.dept}>

              {/* Заголовок направления */}
              <button
                onClick={() => !query && toggleDept(entry.dept)}
                style={{
                  width: "100%", padding: "6px 12px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 700, flexShrink: 0,
                    color: hasActive ? "#6366f1" : "#475569",
                  }}>
                    {entry.dept}
                  </span>
                  <span style={{
                    fontSize: "10px", color: "#94a3b8",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {entry.groups.length} гр.
                  </span>
                </div>
                {!query && (
                  <span style={{
                    fontSize: "11px", color: "#cbd5e1", flexShrink: 0,
                    transform: isOpen ? "rotate(90deg)" : "none",
                    transition: "transform .18s",
                    display: "inline-block",
                  }}>
                    ›
                  </span>
                )}
              </button>

              {/* Группы */}
              {isOpen && (
                <div>
                  {entry.groups.map(group => {
                    const active = group.id === activeGroupId;
                    return (
                      <button
                        key={group.id}
                        onClick={() => onSelect(group.id)}
                        title={`${entry.name}${group.note ? " · " + group.note : ""}`}
                        style={{
                          width: "100%", padding: "6px 12px 6px 20px",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          background:  active ? "#eef2ff" : "none",
                          border:      "none",
                          borderLeft:  active ? "2px solid #6366f1" : "2px solid transparent",
                          cursor:      "pointer",
                          textAlign:   "left",
                          transition:  "background .12s",
                          gap:         "6px",
                        }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f1f5f9"; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "none"; }}
                      >
                        <span style={{
                          fontSize:   "13px",
                          fontWeight: active ? 600 : 400,
                          color:      active ? "#4338ca" : "#334155",
                        }}>
                          {group.id}
                        </span>
                        <span style={{ fontSize: "10px", color: active ? "#6366f1" : "#94a3b8", flexShrink: 0 }}>
                          {group.course > 0 ? `${group.course} к.` : ""}
                          {group.note   ? ` · ${group.note}` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

            </div>
          );
        })}

        {catalog.length === 0 && (
          <p style={{ padding: "20px 16px", fontSize: "13px", color: "#94a3b8", textAlign: "center" }}>
            Группа не найдена
          </p>
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ГЛАВНЫЙ КОМПОНЕНТ
// ─────────────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [activeGroup,   setActiveGroup]   = useState(null);
  const [activeDay,     setActiveDay]     = useState(getTodayIndex);
  const [scheduleData,  setScheduleData]  = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [lessonVisible, setLessonVisible] = useState(false);

  const cancelToken = useRef({});
  const weekDates   = getWeekDates();

  // ── Загрузка ────────────────────────────────────────────────────────────

  const loadSchedule = useCallback(async (groupId) => {
    const token = {};
    cancelToken.current = token;

    setLoading(true);
    setError(null);
    setScheduleData(null);
    setHeaderVisible(false);
    setLessonVisible(false);

    try {
      const data = await requestSchedule(groupId);
      if (cancelToken.current !== token) return;

      setScheduleData(data);
      requestAnimationFrame(() => {
        setHeaderVisible(true);
        setTimeout(() => setLessonVisible(true), 150);
      });
    } catch (err) {
      if (cancelToken.current !== token) return;
      setError("Не удалось загрузить расписание. Попробуйте ещё раз.");
    } finally {
      if (cancelToken.current === token) setLoading(false);
    }
  }, []);

  function handleSelectGroup(groupId) {
    setActiveGroup(groupId);
    setActiveDay(getTodayIndex());
    loadSchedule(groupId);
  }

  // ── Данные текущего дня ────────────────────────────────────────────────

  const dayLessons   = scheduleData?.schedule?.[String(activeDay)] ?? [];
  const totalLessons = scheduleData
    ? Object.values(scheduleData.schedule).flat().length
    : 0;
  const todayCount   = scheduleData
    ? (scheduleData.schedule?.[String(getTodayIndex())] ?? []).length
    : 0;

  // ── Рендер ────────────────────────────────────────────────────────────

  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      height:        "100%",
      minHeight:     "600px",
      fontFamily:    "'Segoe UI', system-ui, -apple-system, sans-serif",
      background:    "#fff",
    }}>

      <style>{`
        @keyframes sFadeIn  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes sPulse   { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        @keyframes sSpin    { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Шапка ──────────────────────────────────────────────────────── */}
      <header style={{
        padding:      "13px 18px",
        borderBottom: "1px solid #e2e8f0",
        display:      "flex",
        alignItems:   "center",
        justifyContent: "space-between",
        gap:          "12px",
        flexShrink:   0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", flexShrink: 0,
          }}>
            📅
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
              Расписание занятий
            </h1>
            <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>
              СарФТИ НИЯУ МИФИ · Весенний семестр 2025/2026
            </p>
          </div>
        </div>

        <div style={{
          fontSize: "11px", color: "#64748b",
          background: "#f8fafc", border: "1px solid #e2e8f0",
          borderRadius: "8px", padding: "5px 10px", whiteSpace: "nowrap",
        }}>
          {shortDate(weekDates[0])} — {shortDate(weekDates[5])}
        </div>
      </header>

      {/* ── Тело ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        <Sidebar activeGroupId={activeGroup} onSelect={handleSelectGroup} />

        {/* Правая панель */}
        <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

          {/* Пустое состояние */}
          {!loading && !error && !scheduleData && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "40px", textAlign: "center",
              animation: "sFadeIn .4s ease",
            }}>
              <div style={{ fontSize: "44px", marginBottom: "14px", opacity: 0.45 }}>🎓</div>
              <h2 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 600, color: "#475569" }}>
                Выберите группу
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", maxWidth: "300px" }}>
                Нажмите на название группы в боковой панели
              </p>
            </div>
          )}

          {/* Загрузка */}
          {loading && (
            <div style={{ padding: "20px", animation: "sFadeIn .3s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{
                  width: "18px", height: "18px", borderRadius: "50%",
                  border: "2px solid #e2e8f0", borderTopColor: "#6366f1",
                  animation: "sSpin .7s linear infinite", flexShrink: 0,
                }} />
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  Загружаем расписание группы{" "}
                  <strong style={{ color: "#1e293b" }}>{activeGroup}</strong>…
                </span>
              </div>

              <div style={{ display: "flex", gap: "6px", marginBottom: "18px" }}>
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} style={{
                    flex: 1, height: "72px", background: "#f1f5f9", borderRadius: "10px",
                    animation: `sPulse 1.3s ease ${i * 0.08}s infinite`,
                  }} />
                ))}
              </div>

              {[0,1,2].map(i => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Ошибка */}
          {error && !loading && (
            <div style={{
              margin: "20px", padding: "13px 16px",
              background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
              animation: "sFadeIn .3s ease",
            }}>
              <span style={{ fontSize: "13px", color: "#991b1b" }}>⚠️ {error}</span>
              <button
                onClick={() => loadSchedule(activeGroup)}
                style={{
                  padding: "5px 14px", borderRadius: "6px",
                  background: "#dc2626", color: "#fff", border: "none",
                  fontSize: "12px", cursor: "pointer", flexShrink: 0,
                }}
              >
                Повторить
              </button>
            </div>
          )}

          {/* Расписание */}
          {scheduleData && !loading && (
            <div style={{ padding: "16px", animation: "sFadeIn .35s ease" }}>

              {/* Статистика */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                gap: "8px", marginBottom: "14px",
                opacity:   headerVisible ? 1 : 0,
                transform: headerVisible ? "none" : "translateY(-8px)",
                transition: "opacity .3s ease, transform .3s ease",
              }}>
                {[
                  { icon: "👥", value: scheduleData.group, label: "Группа"       },
                  { icon: "📚", value: totalLessons,       label: "Пар за неделю" },
                  { icon: "📌", value: todayCount,         label: "Пар сегодня"  },
                ].map(s => (
                  <div key={s.label} style={{
                    background: "#f8fafc", border: "1px solid #e2e8f0",
                    borderRadius: "10px", padding: "10px 12px",
                  }}>
                    <div style={{ fontSize: "16px", marginBottom: "2px" }}>{s.icon}</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>{s.value}</div>
                    <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "1px" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Дни недели */}
              <div style={{
                display: "flex", gap: "5px", marginBottom: "14px",
                overflowX: "auto", paddingBottom: "4px",
                opacity:   headerVisible ? 1 : 0,
                transform: headerVisible ? "none" : "translateY(-6px)",
                transition: "opacity .3s ease .05s, transform .3s ease .05s",
              }}>
                {weekDates.map((date, i) => (
                  <DayTab
                    key={i}
                    dayIndex={i}
                    date={date}
                    count={(scheduleData.schedule?.[String(i)] ?? []).length}
                    isSelected={activeDay === i}
                    onClick={setActiveDay}
                  />
                ))}
              </div>

              {/* Занятия дня */}
              <div style={{
                background: "#fff", border: "1px solid #e2e8f0",
                borderRadius: "12px", padding: "14px 14px 8px",
                minHeight: "160px",
                opacity:   headerVisible ? 1 : 0,
                transform: headerVisible ? "none" : "translateY(8px)",
                transition: "opacity .3s ease .1s, transform .3s ease .1s",
              }}>
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", marginBottom: "12px",
                }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                      {DAYS_FULL[activeDay]}, {shortDate(weekDates[activeDay])}
                    </h2>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                      {dayLessons.length === 0
                        ? "Занятий нет"
                        : `${dayLessons.length} занятие${dayLessons.length > 1 ? (dayLessons.length < 5 ? "я" : "й") : ""}`}
                    </p>
                  </div>
                  {isToday(weekDates[activeDay]) && (
                    <span style={{
                      fontSize: "11px", fontWeight: 600,
                      background: "#d1fae5", color: "#065f46",
                      borderRadius: "20px", padding: "3px 10px",
                    }}>
                      сегодня
                    </span>
                  )}
                </div>

                {dayLessons.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>🌿</div>
                    <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                      Выходной или занятий нет
                    </p>
                  </div>
                ) : (
                  <div>
                    {[...dayLessons]
                      .sort((a, b) => a.pair - b.pair)
                      .map((lesson, i) => (
                        <LessonCard
                          key={i}
                          lesson={lesson}
                          delay={i * 65}
                          visible={lessonVisible}
                        />
                      ))}
                  </div>
                )}
              </div>

              {/* Легенда */}
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "12px" }}>
                {Object.entries(LESSON_TYPES).map(([key, info]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{
                      width: "9px", height: "9px", borderRadius: "50%",
                      background: info.color, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: "11px", color: "#64748b" }}>{info.label}</span>
                  </div>
                ))}
              </div>

              {/* Источник */}
              <div style={{
                marginTop: "12px", padding: "9px 12px",
                background: "#f8fafc", border: "1px solid #e2e8f0",
                borderRadius: "8px", fontSize: "11px", color: "#94a3b8",
              }}>
                ℹ️ Расписание сформировано на основе учебного плана СарФТИ НИЯУ МИФИ.
                Актуальные данные —{" "}
                <a href="https://sarfti.ru/?page_id=20" target="_blank" rel="noopener noreferrer"
                   style={{ color: "#6366f1" }}>
                  sarfti.ru
                </a>.
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
