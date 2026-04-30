"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/app/components/PageHeader";
import { getHabitTracker, saveHabitTracker } from "@/lib/storage";
import { daysInMonth, uid } from "@/lib/dateUtils";
import type { HabitTrackerData, Habit, HabitRecord } from "@/lib/types";

// ─── Helpers ───────────────────────────────────────────

function prevYearMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m - 2, 1); // subtract 1 month
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextYearMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m, 1); // add 1 month
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatHeaderTitle(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  return `${y}년 ${m}월`;
}

function createDefaultTracker(yearMonth: string): HabitTrackerData {
  return {
    id: uid(),
    yearMonth,
    habits: [],
    records: [],
    updatedAt: new Date().toISOString(),
  };
}

function recordKey(habitId: string, day: number, yearMonth: string): string {
  const mm = yearMonth.slice(5); // "04"
  const yyyy = yearMonth.slice(0, 4);
  return `${habitId}-${yyyy}-${mm}-${String(day).padStart(2, "0")}`;
}

function dateString(yearMonth: string, day: number): string {
  return `${yearMonth}-${String(day).padStart(2, "0")}`;
}

// ─── Main Page ─────────────────────────────────────────

export default function HabitTrackerPage() {
  const params = useParams();
  const yearMonth = params.yearMonth as string;

  const [tracker, setTracker] = useState<HabitTrackerData | null>(null);
  const [addingHabit, setAddingHabit] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse year and month once
  const [year, month] = yearMonth.split("-").map(Number);
  const totalDays = daysInMonth(year, month);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  useEffect(() => {
    const saved = getHabitTracker(yearMonth);
    setTracker(saved ?? createDefaultTracker(yearMonth));
  }, [yearMonth]);

  useEffect(() => {
    if (addingHabit && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addingHabit]);

  const save = useCallback((updated: HabitTrackerData) => {
    const withTs = { ...updated, updatedAt: new Date().toISOString() };
    setTracker(withTs);
    saveHabitTracker(withTs);
  }, []);

  const toggleRecord = useCallback(
    (habitId: string, day: number) => {
      if (!tracker) return;
      const date = dateString(yearMonth, day);
      const existing = tracker.records.find(
        (r) => r.habitId === habitId && r.date === date
      );
      let records: HabitRecord[];
      if (existing) {
        records = tracker.records.map((r) =>
          r.habitId === habitId && r.date === date ? { ...r, done: !r.done } : r
        );
      } else {
        records = [...tracker.records, { habitId, date, done: true }];
      }
      save({ ...tracker, records });
    },
    [tracker, yearMonth, save]
  );

  const addHabit = useCallback(() => {
    const title = newHabitTitle.trim();
    if (!title || !tracker) return;
    const newHabit: Habit = {
      id: uid(),
      title,
      targetDays: totalDays,
      order: tracker.habits.length,
    };
    save({ ...tracker, habits: [...tracker.habits, newHabit] });
    setNewHabitTitle("");
    setAddingHabit(false);
  }, [newHabitTitle, tracker, totalDays, save]);

  const deleteHabit = useCallback(
    (habitId: string) => {
      if (!tracker) return;
      const habits = tracker.habits.filter((h) => h.id !== habitId);
      const records = tracker.records.filter((r) => r.habitId !== habitId);
      save({ ...tracker, habits, records });
    },
    [tracker, save]
  );

  const isDone = useCallback(
    (habitId: string, day: number): boolean => {
      if (!tracker) return false;
      const date = dateString(yearMonth, day);
      const rec = tracker.records.find(
        (r) => r.habitId === habitId && r.date === date
      );
      return rec?.done ?? false;
    },
    [tracker, yearMonth]
  );

  const achievementPercent = useCallback(
    (habitId: string): number => {
      if (!tracker) return 0;
      const done = tracker.records.filter(
        (r) => r.habitId === habitId && r.done
      ).length;
      return totalDays > 0 ? Math.round((done / totalDays) * 100) : 0;
    },
    [tracker, totalDays]
  );

  if (!tracker) return null;

  // Day-of-week abbreviations for column headers
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div style={{ paddingBottom: 48 }}>
      <PageHeader
        title={formatHeaderTitle(yearMonth)}
        subtitle="Habit Tracker"
        prevHref={`/habit/${prevYearMonth(yearMonth)}`}
        nextHref={`/habit/${nextYearMonth(yearMonth)}`}
      />

      {/* ─── Grid ─────────────────────────────────────── */}
      <div
        style={{
          margin: "0 0 4px",
          borderRadius: 20,
          background: "var(--color-card)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            paddingBottom: 0,
          }}
        >
          <table
            style={{
              borderCollapse: "separate",
              borderSpacing: 0,
              tableLayout: "fixed",
              minWidth: "max-content",
            }}
          >
            {/* Column sizes */}
            <colgroup>
              {/* Sticky habit name column */}
              <col style={{ width: 120 }} />
              {/* Day columns */}
              {days.map((d) => (
                <col key={d} style={{ width: 30 }} />
              ))}
              {/* Achievement column */}
              <col style={{ width: 52 }} />
            </colgroup>

            <thead>
              <tr>
                {/* Habit name header */}
                <th
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    background: "var(--color-card)",
                    padding: "6px 8px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--color-muted)",
                    textAlign: "left",
                    borderBottom: "1px solid var(--color-background)",
                    whiteSpace: "nowrap",
                  }}
                >
                  습관
                </th>

                {/* Day number headers */}
                {days.map((d) => {
                  const date = new Date(year, month - 1, d);
                  const dow = date.getDay(); // 0=Sun, 6=Sat
                  const isWeekend = dow === 0 || dow === 6;
                  return (
                    <th
                      key={d}
                      style={{
                        padding: "4px 0",
                        textAlign: "center",
                        borderBottom: "1px solid var(--color-background)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: isWeekend
                            ? "var(--color-primary)"
                            : "var(--color-muted)",
                          lineHeight: 1.2,
                          fontWeight: 600,
                        }}
                      >
                        {dayLabels[dow]}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: isWeekend
                            ? "var(--color-primary)"
                            : "var(--color-muted)",
                          fontWeight: 600,
                          lineHeight: 1.4,
                        }}
                      >
                        {d}
                      </div>
                    </th>
                  );
                })}

                {/* Achievement header */}
                <th
                  style={{
                    padding: "6px 4px",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--color-muted)",
                    textAlign: "center",
                    borderBottom: "1px solid var(--color-background)",
                    whiteSpace: "nowrap",
                  }}
                >
                  달성
                </th>
              </tr>
            </thead>

            <tbody>
              {tracker.habits.length === 0 && (
                <tr>
                  <td
                    colSpan={days.length + 2}
                    style={{
                      textAlign: "center",
                      padding: "32px 16px",
                      fontSize: 14,
                      fontWeight: 400,
                      color: "var(--color-muted)",
                    }}
                  >
                    아직 등록된 습관이 없어요. 아래 버튼으로 추가해보세요.
                  </td>
                </tr>
              )}

              {tracker.habits.map((habit) => {
                const pct = achievementPercent(habit.id);
                return (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    days={days}
                    isDone={(day) => isDone(habit.id, day)}
                    onToggle={(day) => toggleRecord(habit.id, day)}
                    onDelete={() => deleteHabit(habit.id)}
                    achievementPct={pct}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Add Habit ────────────────────────────────── */}
      <div style={{ padding: "20px" }}>
        {addingHabit ? (
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addHabit();
                if (e.key === "Escape") {
                  setAddingHabit(false);
                  setNewHabitTitle("");
                }
              }}
              placeholder="습관 이름 입력..."
              style={{
                flex: 1,
                background: "var(--color-background)",
                borderRadius: 12,
                padding: "12px 16px",
                fontSize: 15,
                fontWeight: 400,
                color: "var(--color-ink)",
                border: "none",
                outline: "none",
              }}
            />
            <button
              onClick={addHabit}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                background: "var(--color-primary)",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              추가
            </button>
            <button
              onClick={() => {
                setAddingHabit(false);
                setNewHabitTitle("");
              }}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: "var(--color-background)",
                color: "var(--color-muted)",
                fontSize: 15,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingHabit(true)}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 16,
              border: "2px dashed var(--color-border)",
              background: "transparent",
              color: "var(--color-muted)",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            + 습관 추가
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────

function HabitRow({
  habit,
  days,
  isDone,
  onToggle,
  onDelete,
  achievementPct,
}: {
  habit: Habit;
  days: number[];
  isDone: (day: number) => boolean;
  onToggle: (day: number) => void;
  onDelete: () => void;
  achievementPct: number;
}) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <tr
      style={{
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {/* Sticky habit name cell */}
      <td
        style={{
          position: "sticky",
          left: 0,
          zIndex: 1,
          background: "var(--color-card)",
          padding: "0 8px",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            height: 36,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-body)",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              cursor: "pointer",
              userSelect: "none",
            }}
            onClick={() => setShowDelete((v) => !v)}
            title="탭하면 삭제 버튼 표시"
          >
            {habit.title}
          </span>
          {showDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="삭제"
              style={{
                flexShrink: 0,
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                color: "var(--color-muted)",
                fontSize: 11,
                lineHeight: 1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </td>

      {/* Day cells */}
      {days.map((day) => {
        const done = isDone(day);
        return (
          <td key={day} style={{ textAlign: "center", padding: "2px 0" }}>
            <button
              onClick={() => onToggle(day)}
              aria-label={`${day}일 ${done ? "완료" : "미완료"}`}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                fontSize: 16,
                lineHeight: 1,
                color: done ? "var(--color-primary)" : "#B0B8C1",
                transition: "color 0.15s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                {done ? (
                  <circle cx="7" cy="7" r="6" fill="currentColor" />
                ) : (
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1" />
                )}
              </svg>
            </button>
          </td>
        );
      })}

      {/* Achievement % cell */}
      <td
        style={{
          textAlign: "center",
          padding: "0 4px",
          fontSize: 11,
          fontWeight: 700,
          color:
            achievementPct >= 80
              ? "var(--color-success)"
              : achievementPct >= 50
              ? "var(--color-body)"
              : "var(--color-muted)",
          whiteSpace: "nowrap",
        }}
      >
        {achievementPct}%
      </td>
    </tr>
  );
}
