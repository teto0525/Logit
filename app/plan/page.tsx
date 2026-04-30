"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/app/components/PageHeader";
import {
  getWeeklyPlan, saveWeeklyPlan,
  getMonthlyPlan, saveMonthlyPlan,
} from "@/lib/storage";
import {
  formatWeekId, weekIdToMonday, formatDate, formatYearMonth,
  firstDayOfMonth, daysInMonth, uid,
} from "@/lib/dateUtils";
import { DAYS_KO } from "@/lib/constants";
import type { WeeklyPlan, DayPlan, Task, MonthlyPlan, Appointment } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────

const APPOINTMENT_TYPES: { key: Appointment["type"]; label: string; color: string }[] = [
  { key: "meeting", label: "미팅", color: "#3B82F6" },
  { key: "deadline", label: "마감", color: "#EF4444" },
  { key: "personal", label: "개인", color: "#F59E0B" },
  { key: "health", label: "건강", color: "#10B981" },
];

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  high: "#EF4444", mid: "#F59E0B", low: "#9CA3AF",
};

function buildDefaultWeekly(weekId: string): WeeklyPlan {
  const monday = weekIdToMonday(weekId);
  const days: DayPlan[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { date: formatDate(d), tasks: [] };
  });
  return {
    id: uid(), weekId, startDate: formatDate(monday), days,
    weekReflection: "", linkedObjectiveIds: [], updatedAt: new Date().toISOString(),
  };
}

function createDefaultMonthly(yearMonth: string): MonthlyPlan {
  return {
    id: uid(), yearMonth, appointments: [], weeklyGoals: [],
    letGoItems: [], linkedObjectiveIds: [], updatedAt: new Date().toISOString(),
  };
}

function getPrevWeekId(weekId: string): string {
  const m = weekIdToMonday(weekId);
  m.setDate(m.getDate() - 7);
  return formatWeekId(m);
}

function getNextWeekId(weekId: string): string {
  const m = weekIdToMonday(weekId);
  m.setDate(m.getDate() + 7);
  return formatWeekId(m);
}

function formatWeekRange(weekId: string): string {
  const monday = weekIdToMonday(weekId);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${monday.getMonth() + 1}/${monday.getDate()} - ${sunday.getMonth() + 1}/${sunday.getDate()}`;
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Main Component ─────────────────────────────────────

export default function PlanPage() {
  const [segment, setSegment] = useState<"weekly" | "monthly">("weekly");
  const now = new Date();
  const [weekId, setWeekId] = useState(formatWeekId(now));
  const [yearMonth, setYearMonth] = useState(formatYearMonth(now));

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Underline Tab Control */}
      <div style={{ padding: "20px 20px 0", background: "var(--color-card)" }}>
        <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)" }}>
          {(["weekly", "monthly"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSegment(s)}
              style={{
                flex: 1,
                padding: "12px 0",
                fontSize: 15,
                fontWeight: 600,
                border: "none",
                borderBottom: segment === s ? "2px solid var(--color-primary)" : "2px solid transparent",
                cursor: "pointer",
                background: "transparent",
                color: segment === s ? "var(--color-ink)" : "var(--color-muted)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                marginBottom: -1,
              }}
            >
              {s === "weekly" ? "이번 주" : "이번 달"}
            </button>
          ))}
        </div>
      </div>

      {segment === "weekly" ? (
        <WeeklySection
          weekId={weekId}
          onPrev={() => setWeekId(getPrevWeekId(weekId))}
          onNext={() => setWeekId(getNextWeekId(weekId))}
        />
      ) : (
        <MonthlySection
          yearMonth={yearMonth}
          onPrev={() => setYearMonth(shiftMonth(yearMonth, -1))}
          onNext={() => setYearMonth(shiftMonth(yearMonth, 1))}
        />
      )}
    </div>
  );
}

// ─── Weekly Section ───────────────────────────────────────

function WeeklySection({ weekId, onPrev, onNext }: { weekId: string; onPrev: () => void; onNext: () => void }) {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [reflectionOpen, setReflectionOpen] = useState(false);

  useEffect(() => {
    const saved = getWeeklyPlan(weekId);
    setPlan(saved ?? buildDefaultWeekly(weekId));
    const dow = new Date().getDay();
    if (dow >= 5 || dow === 0) setReflectionOpen(true);
  }, [weekId]);

  const persist = useCallback((updated: WeeklyPlan) => {
    const stamped = { ...updated, updatedAt: new Date().toISOString() };
    setPlan(stamped);
    saveWeeklyPlan(stamped);
  }, []);

  const addTask = useCallback(
    (dayIndex: number, title: string, priority: Task["priority"]) => {
      if (!plan) return;
      const newTask: Task = { id: uid(), title, done: false, priority };
      const days = plan.days.map((day, i) =>
        i === dayIndex ? { ...day, tasks: [...day.tasks, newTask] } : day
      );
      persist({ ...plan, days });
    },
    [plan, persist]
  );

  const toggleTask = useCallback(
    (dayIndex: number, taskId: string) => {
      if (!plan) return;
      const days = plan.days.map((day, i) =>
        i === dayIndex
          ? { ...day, tasks: day.tasks.map((t) => t.id === taskId ? { ...t, done: !t.done } : t) }
          : day
      );
      persist({ ...plan, days });
    },
    [plan, persist]
  );

  const deleteTask = useCallback(
    (dayIndex: number, taskId: string) => {
      if (!plan) return;
      const days = plan.days.map((day, i) =>
        i === dayIndex ? { ...day, tasks: day.tasks.filter((t) => t.id !== taskId) } : day
      );
      persist({ ...plan, days });
    },
    [plan, persist]
  );

  if (!plan) return null;

  const weekLabel = weekId.match(/W(\d+)$/)?.[0] ?? weekId;
  const dateRange = formatWeekRange(weekId);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", background: "var(--color-card)",
        }}
      >
        <button onClick={onPrev} style={navBtnStyle}>‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-ink)" }}>{weekLabel}</div>
          <div style={{ fontSize: 13, color: "var(--color-muted)" }}>{dateRange}</div>
        </div>
        <button onClick={onNext} style={navBtnStyle}>›</button>
      </div>

      {/* Day cards */}
      <div style={{ padding: "8px 16px 0" }}>
        {plan.days.map((day, index) => (
          <DayCard
            key={day.date}
            day={day}
            dayIndex={index}
            onAddTask={(title, priority) => addTask(index, title, priority)}
            onToggleTask={(taskId) => toggleTask(index, taskId)}
            onDeleteTask={(taskId) => deleteTask(index, taskId)}
          />
        ))}
      </div>

      {/* Weekly reflection (collapsible) */}
      <div style={{ padding: "4px 16px 0" }}>
        <div style={{
          background: "var(--color-card)", borderRadius: 24, padding: 24,
          border: "1px solid var(--color-border)",
        }}>
          <button
            onClick={() => setReflectionOpen(!reflectionOpen)}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>주간 회고</h2>
            <span style={{
              fontSize: 18, color: "var(--color-muted)",
              transform: reflectionOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease", display: "inline-block",
            }}>▾</span>
          </button>
          {reflectionOpen && (
            <textarea
              value={plan.weekReflection ?? ""}
              onChange={(e) => persist({ ...plan, weekReflection: e.target.value })}
              placeholder="이번 주를 돌아보며 느낀 점, 배운 것, 다음 주에 개선할 것을 적어보세요."
              rows={4}
              style={{
                width: "100%", background: "var(--color-background)", border: "none",
                borderRadius: 12, padding: "14px 16px", fontSize: 14, fontWeight: 400,
                color: "var(--color-body)", resize: "vertical", fontFamily: "inherit",
                lineHeight: 1.6, boxSizing: "border-box", outline: "none", marginTop: 12,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Monthly Section ──────────────────────────────────────

function MonthlySection({ yearMonth, onPrev, onNext }: { yearMonth: string; onPrev: () => void; onNext: () => void }) {
  const [plan, setPlan] = useState<MonthlyPlan | null>(null);
  const [showAddAppt, setShowAddAppt] = useState(false);
  const [letGoOpen, setLetGoOpen] = useState(false);

  useEffect(() => {
    const saved = getMonthlyPlan(yearMonth);
    setPlan(saved ?? createDefaultMonthly(yearMonth));
  }, [yearMonth]);

  const save = useCallback((updated: MonthlyPlan) => {
    const withTs = { ...updated, updatedAt: new Date().toISOString() };
    setPlan(withTs);
    saveMonthlyPlan(withTs);
  }, []);

  if (!plan) return null;

  const [yearStr, monthStr] = yearMonth.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", background: "var(--color-card)",
      }}>
        <button onClick={onPrev} style={navBtnStyle}>‹</button>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-ink)" }}>
          {year}년 {month}월
        </div>
        <button onClick={onNext} style={navBtnStyle}>›</button>
      </div>

      {/* Calendar Grid */}
      <MiniCalendar year={year} month={month} appointments={plan.appointments} />

      <div style={{ padding: "0 20px" }}>
        {/* Goals */}
        <SectionCard
          title="이달의 목표"
          onAdd={() => save({ ...plan, weeklyGoals: [...plan.weeklyGoals, ""] })}
        >
          {plan.weeklyGoals.length === 0 && <EmptyHint text="이번 달 목표를 적어보세요" />}
          {plan.weeklyGoals.map((goal, idx) => (
            <EditableRow
              key={idx}
              value={goal}
              placeholder="목표를 입력하세요"
              onChange={(v) => {
                const goals = plan.weeklyGoals.map((g, i) => (i === idx ? v : g));
                save({ ...plan, weeklyGoals: goals });
              }}
              onRemove={() => save({ ...plan, weeklyGoals: plan.weeklyGoals.filter((_, i) => i !== idx) })}
            />
          ))}
        </SectionCard>

        {/* Appointments */}
        <SectionCard
          title="약속 / 일정"
          onAdd={() => setShowAddAppt(true)}
        >
          {plan.appointments.length === 0 && !showAddAppt && <EmptyHint text="이달의 일정을 추가하세요" />}
          {[...plan.appointments].sort((a, b) => a.date.localeCompare(b.date)).map((appt) => {
            const [, , dayStr] = appt.date.split("-");
            const d = new Date(appt.date + "T00:00:00");
            const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
            const color = APPOINTMENT_TYPES.find((t) => t.key === appt.type)?.color ?? "var(--color-muted)";
            return (
              <div key={appt.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                borderBottom: "1px solid var(--color-background)",
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, minWidth: 44, textAlign: "center", color: "var(--color-ink)" }}>
                  {Number(dayStr)}일 <span style={{ fontSize: 10, color: "var(--color-muted)" }}>{dow}</span>
                </span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, color: "var(--color-body)" }}>{appt.title}</span>
                <button
                  onClick={() => save({ ...plan, appointments: plan.appointments.filter((a) => a.id !== appt.id) })}
                  style={{ background: "transparent", border: "none", color: "var(--color-muted)", fontSize: 18, cursor: "pointer", padding: 0 }}
                >×</button>
              </div>
            );
          })}
          {showAddAppt && (
            <AddApptForm yearMonth={yearMonth} onAdd={(appt) => {
              save({ ...plan, appointments: [...plan.appointments, { id: uid(), ...appt }] });
              setShowAddAppt(false);
            }} onCancel={() => setShowAddAppt(false)} />
          )}
        </SectionCard>

        {/* Let Go (collapsible) */}
        <div style={{
          background: "var(--color-card)", borderRadius: 24, padding: 24,
          border: "1px solid var(--color-border)", marginBottom: 16,
        }}>
          <button
            onClick={() => setLetGoOpen(!letGoOpen)}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--color-ink)" }}>덜어낼 것</h2>
            <span style={{
              fontSize: 18, color: "var(--color-muted)",
              transform: letGoOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease", display: "inline-block",
            }}>▾</span>
          </button>
          {letGoOpen && (
            <div style={{ marginTop: 12 }}>
              {plan.letGoItems.map((item, idx) => (
                <EditableRow
                  key={idx}
                  value={item}
                  placeholder="덜어낼 것을 입력하세요"
                  onChange={(v) => {
                    const items = plan.letGoItems.map((g, i) => (i === idx ? v : g));
                    save({ ...plan, letGoItems: items });
                  }}
                  onRemove={() => save({ ...plan, letGoItems: plan.letGoItems.filter((_, i) => i !== idx) })}
                />
              ))}
              <button
                onClick={() => save({ ...plan, letGoItems: [...plan.letGoItems, ""] })}
                style={{
                  fontSize: 14, fontWeight: 600, color: "var(--color-muted)",
                  background: "transparent", border: "none", cursor: "pointer", padding: "4px 0",
                }}
              >+ 추가</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared Sub-components ─────────────────────────────────

const navBtnStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12, border: "none",
  background: "var(--color-background)", color: "var(--color-body)",
  fontSize: 18, fontWeight: 500, cursor: "pointer",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};

function DayCard({ day, dayIndex, onAddTask, onToggleTask, onDeleteTask }: {
  day: DayPlan; dayIndex: number;
  onAddTask: (title: string, priority: Task["priority"]) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("mid");

  const d = new Date(day.date + "T00:00:00");
  const label = `${DAYS_KO[dayIndex]} ${d.getMonth() + 1}/${d.getDate()}`;

  return (
    <div style={{
      background: "var(--color-card)", borderRadius: 24, padding: 24,
      marginBottom: 12, border: "1px solid var(--color-border)",
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-ink)", marginBottom: 10 }}>{label}</div>

      {day.tasks.map((task) => (
        <div key={task.id} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 0",
          borderBottom: "1px solid var(--color-background)",
        }}>
          <button onClick={() => onToggleTask(task.id)} style={{
            flexShrink: 0, width: 20, height: 20, borderRadius: "50%",
            border: task.done ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-muted-soft)",
            background: task.done ? "var(--color-primary)" : "transparent",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
          }}>
            {task.done && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </button>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_COLORS[task.priority], opacity: task.done ? 0.4 : 1, flexShrink: 0 }} />
          <span style={{
            flex: 1, fontSize: 14, color: task.done ? "var(--color-muted)" : "var(--color-body)",
            textDecoration: task.done ? "line-through" : "none",
          }}>{task.title}</span>
          <button onClick={() => onDeleteTask(task.id)} style={{
            background: "transparent", border: "none", color: "var(--color-muted-soft)", fontSize: 14, cursor: "pointer", padding: 0,
          }}>×</button>
        </div>
      ))}

      {isAdding ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--color-muted)" }}>우선순위</span>
            {(["high", "mid", "low"] as const).map((p) => (
              <button key={p} onClick={() => setNewPriority(p)} style={{
                width: 18, height: 18, borderRadius: 9999, background: PRIORITY_COLORS[p],
                border: newPriority === p ? "2px solid var(--color-ink)" : "2px solid transparent",
                cursor: "pointer", padding: 0, opacity: newPriority === p ? 1 : 0.45,
              }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input autoFocus type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTitle.trim()) { onAddTask(newTitle.trim(), newPriority); setNewTitle(""); setIsAdding(false); }
                if (e.key === "Escape") { setIsAdding(false); setNewTitle(""); }
              }}
              placeholder="할 일 입력..."
              style={{ flex: 1, fontSize: 14, padding: "10px 14px", borderRadius: 12, border: "none", background: "var(--color-background)", color: "var(--color-body)" }}
            />
            <button onClick={() => { if (newTitle.trim()) { onAddTask(newTitle.trim(), newPriority); setNewTitle(""); setIsAdding(false); } }}
              style={{ fontSize: 14, fontWeight: 700, padding: "10px 16px", borderRadius: 9999, border: "none", background: "var(--color-primary)", color: "#fff", cursor: "pointer" }}>추가</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsAdding(true)} style={{
          fontSize: 14, fontWeight: 600, color: "var(--color-muted)", background: "transparent", border: "none", cursor: "pointer", padding: "4px 0", marginTop: 4,
        }}>+ 할 일 추가</button>
      )}
    </div>
  );
}

function MiniCalendar({ year, month, appointments }: { year: number; month: number; appointments: Appointment[] }) {
  const totalDays = daysInMonth(year, month);
  const startDow = firstDayOfMonth(year, month);
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];

  const apptByDate: Record<string, Appointment[]> = {};
  for (const a of appointments) {
    if (!apptByDate[a.date]) apptByDate[a.date] = [];
    apptByDate[a.date].push(a);
  }

  const cells: (number | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ padding: "8px 20px 20px" }}>
      <div style={{ background: "var(--color-card)", borderRadius: 24, padding: 24, border: "1px solid var(--color-border)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
          {DOW.map((d, i) => (
            <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : "#9CA3AF", padding: "2px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} />;
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayAppts = apptByDate[dateStr] ?? [];
            const dow = (startDow + day - 1) % 7;
            return (
              <div key={day} style={{
                background: "var(--color-background)", borderRadius: 12,
                padding: "6px 4px 5px", minHeight: 46,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: dow === 0 ? "#EF4444" : dow === 6 ? "#3B82F6" : "var(--color-ink)" }}>{day}</span>
                {dayAppts.length > 0 && (
                  <div style={{ display: "flex", gap: 2 }}>
                    {dayAppts.slice(0, 3).map((a) => (
                      <span key={a.id} style={{ width: 6, height: 6, borderRadius: "50%", background: APPOINTMENT_TYPES.find((t) => t.key === a.type)?.color ?? "#9CA3AF" }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--color-card)", borderRadius: 24, padding: 24, marginBottom: 16, border: "1px solid var(--color-border)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--color-ink)" }}>{title}</h2>
        <button onClick={onAdd} style={{
          width: 36, height: 36, borderRadius: 9999, border: "none", background: "var(--color-primary)",
          color: "#fff", fontSize: 20, lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>+</button>
      </div>
      {children}
    </div>
  );
}

function EditableRow({ value, placeholder, onChange, onRemove }: {
  value: string; placeholder: string; onChange: (v: string) => void; onRemove: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-primary)", flexShrink: 0 }} />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ flex: 1, fontSize: 14, padding: "10px 14px", background: "var(--color-background)", border: "none", borderRadius: 12, color: "var(--color-ink)" }} />
      <button onClick={onRemove} style={{ background: "transparent", border: "none", color: "var(--color-muted)", fontSize: 18, cursor: "pointer", padding: 0 }}>×</button>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p style={{ fontSize: 14, color: "var(--color-muted-soft)", textAlign: "center", padding: "12px 0", margin: 0 }}>{text}</p>;
}

function AddApptForm({ yearMonth, onAdd, onCancel }: {
  yearMonth: string; onAdd: (a: Omit<Appointment, "id">) => void; onCancel: () => void;
}) {
  const [date, setDate] = useState(yearMonth + "-01");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Appointment["type"]>("personal");

  return (
    <div style={{ background: "var(--color-background)", borderRadius: 16, padding: 20, marginTop: 12, display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: 6 }}>날짜</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          style={{ fontSize: 14, padding: "10px 14px", background: "var(--color-card)", border: "none", borderRadius: 12, width: "100%", boxSizing: "border-box" }} />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: 6 }}>제목</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="약속 또는 일정명" autoFocus
          onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) onAdd({ date, title: title.trim(), type }); if (e.key === "Escape") onCancel(); }}
          style={{ fontSize: 14, padding: "10px 14px", background: "var(--color-card)", border: "none", borderRadius: 12, width: "100%", boxSizing: "border-box" }} />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: 8 }}>유형</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {APPOINTMENT_TYPES.map((t) => (
            <button key={t.key} onClick={() => setType(t.key)} style={{
              fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 9999,
              border: type === t.key ? `1.5px solid ${t.color}` : "1.5px solid transparent",
              background: type === t.key ? t.color + "20" : "var(--color-background)",
              color: type === t.key ? t.color : "var(--color-muted)", cursor: "pointer",
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ fontSize: 15, fontWeight: 600, padding: "10px 20px", borderRadius: 9999, border: "none", background: "var(--color-background)", color: "var(--color-muted)", cursor: "pointer" }}>취소</button>
        <button onClick={() => { if (title.trim()) onAdd({ date, title: title.trim(), type }); }}
          style={{ fontSize: 15, fontWeight: 700, padding: "10px 20px", borderRadius: 9999, border: "none", background: "var(--color-primary)", color: "#fff", cursor: "pointer" }}>추가</button>
      </div>
    </div>
  );
}
