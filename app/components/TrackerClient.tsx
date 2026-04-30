"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/app/components/PageHeader";
import { getHabitTracker, saveHabitTracker, getStreakData } from "@/lib/storage";
import { daysInMonth, uid } from "@/lib/dateUtils";
import type { HabitTrackerData, Habit, HabitRecord, StreakData } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────

function prevYearMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextYearMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatTitle(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${y}년 ${m}월`;
}

function dateString(ym: string, day: number): string {
  return `${ym}-${String(day).padStart(2, "0")}`;
}

// ─── Main Component ──────────────────────────────────────

export default function TrackerPage() {
  const params = useParams();
  const yearMonth = params.yearMonth as string;
  const [tracker, setTracker] = useState<HabitTrackerData | null>(null);
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, lastCompletedDate: "", totalCompletedDays: 0 });
  const [addingHabit, setAddingHabit] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [year, month] = yearMonth.split("-").map(Number);
  const totalDays = daysInMonth(year, month);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  useEffect(() => {
    const saved = getHabitTracker(yearMonth);
    setTracker(saved ?? { id: uid(), yearMonth, habits: [], records: [], updatedAt: new Date().toISOString() });
    setStreak(getStreakData());
  }, [yearMonth]);

  useEffect(() => {
    if (addingHabit && inputRef.current) inputRef.current.focus();
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
      const existing = tracker.records.find((r) => r.habitId === habitId && r.date === date);
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
    const newHabit: Habit = { id: uid(), title, targetDays: totalDays, order: tracker.habits.length };
    save({ ...tracker, habits: [...tracker.habits, newHabit] });
    setNewHabitTitle("");
    setAddingHabit(false);
  }, [newHabitTitle, tracker, totalDays, save]);

  const deleteHabit = useCallback(
    (habitId: string) => {
      if (!tracker) return;
      save({
        ...tracker,
        habits: tracker.habits.filter((h) => h.id !== habitId),
        records: tracker.records.filter((r) => r.habitId !== habitId),
      });
    },
    [tracker, save]
  );

  if (!tracker) return null;

  // Stats
  const totalHabitDone = tracker.records.filter((r) => r.done).length;
  const totalPossible = tracker.habits.length * totalDays;
  const overallPct = totalPossible > 0 ? Math.round((totalHabitDone / totalPossible) * 100) : 0;

  // Average energy (placeholder — would need dailyLogs)
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div style={{ paddingBottom: 48 }}>
      <PageHeader
        title={formatTitle(yearMonth)}
        subtitle="Tracker"
        prevHref={`/tracker/${prevYearMonth(yearMonth)}`}
        nextHref={`/tracker/${nextYearMonth(yearMonth)}`}
      />

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: 10, padding: "0 20px 16px" }}>
        <SummaryCard label="연속" value={`${streak.currentStreak}일`} gradientIndex={0} />
        <SummaryCard label="달성률" value={`${overallPct}%`} gradientIndex={1} />
        <SummaryCard label="총 달성" value={`${streak.totalCompletedDays}일`} gradientIndex={2} />
      </div>

      {/* Habit Grid */}
      <div style={{
        margin: "0 0 4px", borderRadius: 24, background: "var(--color-card)",
        boxShadow: "var(--shadow-card)", overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed", minWidth: "max-content" }}>
            <colgroup>
              <col style={{ width: 120 }} />
              {days.map((d) => <col key={d} style={{ width: 30 }} />)}
              <col style={{ width: 52 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{
                  position: "sticky", left: 0, zIndex: 2, background: "var(--color-card)",
                  padding: "6px 8px", fontSize: 12, fontWeight: 600, color: "var(--color-muted)",
                  textAlign: "left", borderBottom: "1px solid var(--color-background)",
                }}>습관</th>
                {days.map((d) => {
                  const date = new Date(year, month - 1, d);
                  const dow = date.getDay();
                  const isWeekend = dow === 0 || dow === 6;
                  return (
                    <th key={d} style={{ padding: "4px 0", textAlign: "center", borderBottom: "1px solid var(--color-background)" }}>
                      <div style={{ fontSize: 9, color: isWeekend ? "var(--color-primary)" : "var(--color-muted)", fontWeight: 600 }}>{dayLabels[dow]}</div>
                      <div style={{ fontSize: 10, color: isWeekend ? "var(--color-primary)" : "var(--color-ink)", fontWeight: 600 }}>{d}</div>
                    </th>
                  );
                })}
                <th style={{ padding: "6px 4px", fontSize: 10, fontWeight: 600, color: "var(--color-muted)", textAlign: "center", borderBottom: "1px solid var(--color-background)" }}>달성</th>
              </tr>
            </thead>
            <tbody>
              {tracker.habits.length === 0 && (
                <tr>
                  <td colSpan={days.length + 2} style={{ textAlign: "center", padding: "32px 16px", fontSize: 14, color: "var(--color-muted)" }}>
                    아직 등록된 습관이 없어요
                  </td>
                </tr>
              )}
              {tracker.habits.map((habit) => {
                const done = tracker.records.filter((r) => r.habitId === habit.id && r.done).length;
                const pct = totalDays > 0 ? Math.round((done / totalDays) * 100) : 0;
                return (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    days={days}
                    yearMonth={yearMonth}
                    records={tracker.records}
                    onToggle={(day) => toggleRecord(habit.id, day)}
                    onDelete={() => deleteHabit(habit.id)}
                    pct={pct}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progress Bars */}
      {tracker.habits.length > 0 && (
        <div style={{ padding: "16px 20px" }}>
          <div style={{ background: "var(--color-card)", borderRadius: 24, padding: 20, boxShadow: "var(--shadow-card)" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 14, margin: "0 0 14px", color: "var(--color-ink)" }}>습관별 달성률</h3>
            {tracker.habits.map((habit) => {
              const done = tracker.records.filter((r) => r.habitId === habit.id && r.done).length;
              const pct = totalDays > 0 ? Math.round((done / totalDays) * 100) : 0;
              return (
                <div key={habit.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-body)" }}>{habit.title}</span>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: pct >= 80 ? "var(--color-success)" : pct >= 50 ? "var(--color-body)" : "var(--color-muted)",
                    }}>{pct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "var(--color-background)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 4, transition: "width 0.3s ease",
                      width: `${pct}%`,
                      background: pct >= 80 ? "var(--color-success)" : pct >= 50 ? "var(--color-primary)" : "var(--color-muted)",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Habit */}
      <div style={{ padding: "0 20px" }}>
        {addingHabit ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input ref={inputRef} type="text" value={newHabitTitle} onChange={(e) => setNewHabitTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addHabit(); if (e.key === "Escape") { setAddingHabit(false); setNewHabitTitle(""); } }}
              placeholder="습관 이름 입력..."
              style={{ flex: 1, background: "var(--color-background)", borderRadius: 12, padding: "12px 16px", fontSize: 15, border: "none" }} />
            <button onClick={addHabit} style={{ padding: "12px 20px", borderRadius: 12, background: "var(--color-primary)", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" }}>추가</button>
            <button onClick={() => { setAddingHabit(false); setNewHabitTitle(""); }}
              style={{ padding: "12px 16px", borderRadius: 12, background: "var(--color-background)", color: "var(--color-muted)", fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer" }}>취소</button>
          </div>
        ) : (
          <button onClick={() => setAddingHabit(true)} style={{
            width: "100%", padding: 16, borderRadius: 16, border: "2px dashed var(--color-border)",
            background: "transparent", color: "var(--color-muted)", fontSize: 15, fontWeight: 600, cursor: "pointer",
          }}>+ 습관 추가</button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

const SUMMARY_GRADIENTS = [
  "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",  // 연속 — 앰버
  "linear-gradient(135deg, #10B981 0%, #34D399 100%)",  // 달성률 — 그린
  "linear-gradient(135deg, #8B72CE 0%, #6B52AE 100%)",  // 총달성 — 라벤더
];

function SummaryCard({ label, value, gradientIndex }: { label: string; value: string; gradientIndex: number }) {
  return (
    <div style={{
      flex: 1,
      background: SUMMARY_GRADIENTS[gradientIndex],
      borderRadius: 24,
      padding: "20px 12px",
      textAlign: "center",
    }}>
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: 26,
        fontWeight: 700,
        color: "#FFFFFF",
        lineHeight: 1,
        marginBottom: 4,
        fontVariantNumeric: "tabular-nums",
      }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{label}</div>
    </div>
  );
}

function HabitRow({ habit, days, yearMonth, records, onToggle, onDelete, pct }: {
  habit: Habit; days: number[]; yearMonth: string; records: HabitRecord[];
  onToggle: (day: number) => void; onDelete: () => void; pct: number;
}) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
      <td style={{
        position: "sticky", left: 0, zIndex: 1, background: "var(--color-card)",
        padding: "0 8px", whiteSpace: "nowrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, height: 36 }}>
          <span onClick={() => setShowDelete((v) => !v)} style={{
            fontSize: 14, fontWeight: 500, color: "var(--color-body)", flex: 1,
            overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer", userSelect: "none",
          }}>{habit.title}</span>
          {showDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{
              flexShrink: 0, width: 20, height: 20, borderRadius: "50%", border: "none",
              background: "transparent", color: "var(--color-muted)", fontSize: 11, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
            }}>✕</button>
          )}
        </div>
      </td>
      {days.map((day) => {
        const date = dateString(yearMonth, day);
        const rec = records.find((r) => r.habitId === habit.id && r.date === date);
        const done = rec?.done ?? false;
        return (
          <td key={day} style={{ textAlign: "center", padding: "2px 0" }}>
            <button onClick={() => onToggle(day)} style={{
              width: 24, height: 24, borderRadius: "50%", border: "none", background: "transparent",
              cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: 0, fontSize: 16, color: done ? "var(--color-primary)" : "#B8B0A6",
            }}>
              {done ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="8" fill="var(--color-primary)"/>
                  <path d="M5.5 9L7.5 11L12.5 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7.5" stroke="var(--color-muted-soft)" strokeWidth="1.5"/>
                </svg>
              )}
            </button>
          </td>
        );
      })}
      <td style={{
        textAlign: "center", padding: "0 4px", fontSize: 11, fontWeight: 700,
        color: pct >= 80 ? "var(--color-success)" : pct >= 50 ? "var(--color-body)" : "var(--color-muted)",
      }}>{pct}%</td>
    </tr>
  );
}

