"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/app/components/PageHeader";
import {
  getDailyLog,
  saveDailyLog,
  getStreakData,
  getHabitTracker,
  saveHabitTracker,
  saveDailyCompletion,
} from "@/lib/storage";
import { addDays, uid, formatYearMonth } from "@/lib/dateUtils";
import { HOURS, TIME_CATEGORIES } from "@/lib/constants";
import type {
  DailyLog,
  TimeBlock,
  EveningReview,
  TimeCategory,
  StreakData,
  HabitTrackerData,
} from "@/lib/types";

// ─── Types (runtime only) ────────────────────────────────

interface VisualBlock {
  startHour: number;
  endHour: number;       // exclusive — first hour NOT in the block
  hours: number[];
  plan: string;
  actual: string;
  category: TimeCategory;
  done: boolean;
  blockIds: string[];
}

type SheetMode =
  | null
  | { mode: "add"; defaultHour: number }
  | { mode: "edit"; visualBlock: VisualBlock };

// ─── Helpers ──────────────────────────────────────────────

function createDefaultLog(date: string): DailyLog {
  return {
    id: uid(),
    date,
    timeBlocks: HOURS.map((hour) => ({
      id: uid(),
      hour,
      plan: "",
      actual: "",
      category: "routine" as TimeCategory,
      done: false,
    })),
    eveningReview: {
      wins: "",
      improvements: "",
      tomorrowFocus: "",
      energyLevel: 3 as const,
    },
    updatedAt: new Date().toISOString(),
  };
}

function formatHour(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${period}`;
}

function formatHourShort(h: number): { num: string; period: string } {
  const period = h < 12 ? "AM" : "PM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { num: String(display), period };
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "새벽이에요";
  if (hour < 12) return "좋은 아침이에요";
  if (hour < 17) return "좋은 오후예요";
  if (hour < 21) return "좋은 저녁이에요";
  return "오늘 하루 수고했어요";
}

function getTimeIcon(): React.ReactNode {
  const hour = new Date().getHours();
  if (hour < 6 || hour >= 21) {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B72CE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
        <path d="M17 4l.5 1.5L19 6l-1.5.5L17 8l-.5-1.5L15 6l1.5-.5L17 4z" fill="#B4A0E5" stroke="none"/>
      </svg>
    );
  }
  if (hour < 12) {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B72CE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 18a5 5 0 10-10 0"/><line x1="12" y1="9" x2="12" y2="2"/>
        <line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/>
        <line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/>
        <line x1="23" y1="22" x2="1" y2="22"/><polyline points="8 6 12 2 16 6"/>
      </svg>
    );
  }
  if (hour < 17) {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B72CE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B72CE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 18a5 5 0 10-10 0"/><line x1="12" y1="9" x2="12" y2="2"/>
      <line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/>
      <line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/>
      <line x1="23" y1="22" x2="1" y2="22"/><polyline points="16 6 12 10 8 6"/>
    </svg>
  );
}

function getStreakMessage(streak: number): string {
  if (streak === 0) return "오늘부터 시작해볼까요?";
  if (streak < 3) return "좋은 시작이에요!";
  if (streak < 7) return "멋진 페이스예요!";
  if (streak < 14) return "대단해요! 습관이 되어가고 있어요";
  if (streak < 30) return "놀라운 꾸준함이에요!";
  return "이미 거목 수준이에요!";
}

const CATEGORY_ICONS: Record<TimeCategory, React.ReactNode> = {
  focus: <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="1" y="1" width="8" height="8" rx="1.5"/></svg>,
  meeting: <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l4 8H1l4-8z"/></svg>,
  rest: <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="5" cy="5" r="3.5"/></svg>,
  routine: <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="1.5" width="7" height="7" rx="1"/></svg>,
  personal: <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="3.5"/></svg>,
};

// ─── VisualBlock Builder ─────────────────────────────────

function buildVisualBlocks(timeBlocks: TimeBlock[]): {
  visualBlocks: VisualBlock[];
  emptyHours: number[];
} {
  const sorted = HOURS.map((h) => timeBlocks.find((b) => b.hour === h)!);
  const visualBlocks: VisualBlock[] = [];
  const emptyHours: number[] = [];
  const consumed = new Set<number>();

  let i = 0;
  while (i < sorted.length) {
    const current = sorted[i];
    if (!current || !current.plan.trim()) {
      if (current) emptyHours.push(current.hour);
      i++;
      continue;
    }

    const groupHours = [current.hour];
    consumed.add(current.hour);
    let j = i + 1;
    while (j < sorted.length) {
      const next = sorted[j];
      if (
        next &&
        next.plan.trim() === current.plan.trim() &&
        next.category === current.category
      ) {
        groupHours.push(next.hour);
        consumed.add(next.hour);
        j++;
      } else {
        break;
      }
    }

    const endIdx = HOURS.indexOf(groupHours[groupHours.length - 1]) + 1;
    const endHour = endIdx < HOURS.length ? HOURS[endIdx] : (HOURS[HOURS.length - 1] + 1) % 24;

    visualBlocks.push({
      startHour: current.hour,
      endHour,
      hours: groupHours,
      plan: current.plan,
      actual: current.actual,
      category: current.category,
      done: groupHours.every((h) => timeBlocks.find((b) => b.hour === h)?.done ?? false),
      blockIds: groupHours.map((h) => timeBlocks.find((b) => b.hour === h)!.id),
    });

    i = j;
  }

  return { visualBlocks, emptyHours };
}

function getHourRange(startHour: number, endHour: number): number[] {
  const startIdx = HOURS.indexOf(startHour);
  const endIdx = HOURS.indexOf(endHour);
  if (startIdx === -1) return [];
  if (endIdx === -1 || endIdx <= startIdx) return [startHour];
  return HOURS.slice(startIdx, endIdx);
}

// ─── Main Component ───────────────────────────────────────

export default function DailyPage() {
  const params = useParams();
  const date = params.date as string;
  const [log, setLog] = useState<DailyLog | null>(null);
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, lastCompletedDate: "", totalCompletedDays: 0 });
  const [habitTracker, setHabitTracker] = useState<HabitTrackerData | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 20) setReviewOpen(true);
  }, []);

  useEffect(() => {
    const saved = getDailyLog(date);
    if (saved) {
      const blocks = saved.timeBlocks.map((b) => ({ ...b, done: b.done ?? false }));
      const existingHours = new Set(blocks.map((b) => b.hour));
      const missing = HOURS.filter((h) => !existingHours.has(h)).map((hour) => ({
        id: uid(), hour, plan: "", actual: "", category: "routine" as TimeCategory, done: false,
      }));
      const allBlocks = [...blocks, ...missing].sort((a, b) => HOURS.indexOf(a.hour) - HOURS.indexOf(b.hour));
      setLog({ ...saved, timeBlocks: allBlocks });
    } else {
      setLog(createDefaultLog(date));
    }
    setStreak(getStreakData());
    const d = new Date(date + "T00:00:00");
    setHabitTracker(getHabitTracker(formatYearMonth(d)) ?? null);
  }, [date]);

  const save = useCallback(
    (updated: DailyLog) => {
      const withTimestamp = { ...updated, updatedAt: new Date().toISOString() };
      setLog(withTimestamp);
      saveDailyLog(withTimestamp);

      const focusHours = withTimestamp.timeBlocks.filter((b) => b.done).length;
      const reviewDone = !!(withTimestamp.eveningReview.wins || withTimestamp.eveningReview.improvements || withTimestamp.eveningReview.tomorrowFocus);
      const focusOk = focusHours >= 4;

      const d = new Date(date + "T00:00:00");
      const ym = formatYearMonth(d);
      const ht = getHabitTracker(ym);
      let habitsOk = false;
      if (ht && ht.habits.length > 0) {
        const done = ht.records.filter((r) => r.date === date && r.done).length;
        habitsOk = done / ht.habits.length >= 0.5;
      }

      const completed = [focusOk, habitsOk, reviewDone].filter(Boolean).length >= 2;
      saveDailyCompletion({ date, focusHoursCompleted: focusOk, habitsCompleted: habitsOk, reviewCompleted: reviewDone, isCompleted: completed });
      setStreak(getStreakData());
    },
    [date]
  );

  // ── Event handlers for CalendarTimeline ──

  const handleSaveEvent = useCallback(
    (form: { plan: string; actual: string; category: TimeCategory; startHour: number; endHour: number; done: boolean }) => {
      if (!log) return;
      let blocks = [...log.timeBlocks];

      // If editing, clear old hours first
      if (sheetMode?.mode === "edit") {
        const vb = sheetMode.visualBlock;
        blocks = blocks.map((b) =>
          vb.hours.includes(b.hour) ? { ...b, plan: "", actual: "", done: false, category: "routine" as TimeCategory } : b
        );
      }

      // Write new values to target range
      const targetHours = getHourRange(form.startHour, form.endHour);
      blocks = blocks.map((b) =>
        targetHours.includes(b.hour)
          ? { ...b, plan: form.plan, actual: form.actual, category: form.category, done: form.done }
          : b
      );

      save({ ...log, timeBlocks: blocks });
      setSheetMode(null);
    },
    [log, save, sheetMode]
  );

  const handleDeleteEvent = useCallback(
    (vb: VisualBlock) => {
      if (!log) return;
      const blocks = log.timeBlocks.map((b) =>
        vb.hours.includes(b.hour) ? { ...b, plan: "", actual: "", done: false, category: "routine" as TimeCategory } : b
      );
      save({ ...log, timeBlocks: blocks });
      setSheetMode(null);
    },
    [log, save]
  );

  const toggleDoneVisual = useCallback(
    (vb: VisualBlock) => {
      if (!log) return;
      const newDone = !vb.done;
      const blocks = log.timeBlocks.map((b) =>
        vb.hours.includes(b.hour) ? { ...b, done: newDone } : b
      );
      save({ ...log, timeBlocks: blocks });
    },
    [log, save]
  );

  const updateReview = useCallback(
    (field: keyof EveningReview, value: string | number) => {
      if (!log) return;
      save({ ...log, eveningReview: { ...log.eveningReview, [field]: value } });
    },
    [log, save]
  );

  const toggleHabit = useCallback(
    (habitId: string) => {
      if (!habitTracker) return;
      const existing = habitTracker.records.find((r) => r.habitId === habitId && r.date === date);
      let records;
      if (existing) {
        records = habitTracker.records.map((r) =>
          r.habitId === habitId && r.date === date ? { ...r, done: !r.done } : r
        );
      } else {
        records = [...habitTracker.records, { habitId, date, done: true }];
      }
      const updated = { ...habitTracker, records, updatedAt: new Date().toISOString() };
      setHabitTracker(updated);
      saveHabitTracker(updated);
      if (log) save(log);
    },
    [habitTracker, date, log, save]
  );

  if (!log) return null;

  const focusHours = log.timeBlocks.filter((b) => b.done).length;
  const habits = habitTracker?.habits ?? [];
  const habitsDoneCount = habits.filter((h) => {
    const rec = habitTracker?.records.find((r) => r.habitId === h.id && r.date === date);
    return rec?.done ?? false;
  }).length;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(date + "T00:00:00");
    const dow = d.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + mondayOffset + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  return (
    <div style={{ paddingBottom: 40, background: "var(--color-background, #F7F5F0)", minHeight: "100%" }}>
      <PageHeader
        title={formatDateDisplay(date)}
        subtitle="Daily"
        prevHref={`/daily/${addDays(date, -1)}`}
        nextHref={`/daily/${addDays(date, 1)}`}
        transparent
      />

      {/* 인사 + 스트릭 카드 */}
      <div style={{ padding: "0 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 12px" }}>
          <span style={{ flexShrink: 0, display: "inline-flex" }}>{getTimeIcon()}</span>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 400, fontStyle: "italic", color: "var(--color-ink)", margin: 0, textWrap: "balance" as const }}>
            {getGreeting()}
          </p>
        </div>

        <div style={{ background: "linear-gradient(135deg, #8B72CE 0%, #6B52AE 100%)", borderRadius: 24, padding: "24px", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {streak.currentStreak}일
              </span>
              <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.85, marginLeft: 6 }}>연속 달성</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>
              최고 {streak.longestStreak}일
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {["월", "화", "수", "목", "금", "토", "일"].map((d, i) => {
              const dayDate = weekDays[i];
              const isToday = dayDate === date;
              return (
                <div key={d} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.6, marginBottom: 4 }}>{d}</div>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", margin: "0 auto",
                    background: isToday ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
                    border: isToday ? "2px solid #fff" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600,
                  }}>
                    {isToday ? "!" : ""}
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, opacity: 0.85, margin: 0 }}>{getStreakMessage(streak.currentStreak)}</p>
        </div>
      </div>

      {/* ── 오늘의 집중 — Calendar Timeline ── */}
      <div style={{ padding: "0 20px", marginBottom: 16 }}>
        <div style={{ background: "var(--color-card)", borderRadius: 24, padding: "24px", boxShadow: "var(--shadow-card)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--color-ink)", textWrap: "balance" as const }}>
              오늘의 집중
            </h2>
            <span style={{
              fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums",
              color: focusHours >= 4 ? "var(--color-success)" : "var(--color-primary)",
            }}>
              {focusHours}h / 4h
            </span>
          </div>

          <CalendarTimeline
            timeBlocks={log.timeBlocks}
            onAddAt={(hour) => setSheetMode({ mode: "add", defaultHour: hour })}
            onEdit={(vb) => setSheetMode({ mode: "edit", visualBlock: vb })}
            onToggleDone={toggleDoneVisual}
          />

          {/* FAB — + 일정 추가 */}
          <button
            onClick={() => setSheetMode({ mode: "add", defaultHour: new Date().getHours() })}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", marginTop: 16,
              borderRadius: 9999, border: "none",
              background: "linear-gradient(135deg, #8B72CE 0%, #6B52AE 100%)",
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(107,82,174,0.35)",
              transition: "transform 0.15s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            일정 추가
          </button>
        </div>
      </div>

      {/* ── EventFormSheet (bottom sheet) ── */}
      {sheetMode && (
        <EventFormSheet
          mode={sheetMode}
          onClose={() => setSheetMode(null)}
          onSave={handleSaveEvent}
          onDelete={sheetMode.mode === "edit" ? () => handleDeleteEvent(sheetMode.visualBlock) : undefined}
        />
      )}

      {/* 오늘의 습관 — 퀵 체크 */}
      {habits.length > 0 && (
        <div style={{ padding: "0 20px", marginBottom: 16 }}>
          <div style={{ background: "var(--color-card)", borderRadius: 24, padding: "24px", boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--color-ink)", textWrap: "balance" as const }}>오늘의 습관</h2>
              <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: habitsDoneCount === habits.length ? "var(--color-success)" : "var(--color-muted)" }}>
                {habitsDoneCount}/{habits.length}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {habits.map((habit) => {
                const rec = habitTracker?.records.find((r) => r.habitId === habit.id && r.date === date);
                const done = rec?.done ?? false;
                return (
                  <button key={habit.id} onClick={() => toggleHabit(habit.id)} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9999, border: "none",
                    background: done ? "var(--color-primary-light)" : "var(--color-background)",
                    color: done ? "var(--color-primary)" : "var(--color-muted)",
                    fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background 0.2s ease, color 0.2s ease",
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      {done ? <circle cx="8" cy="8" r="7" fill="currentColor" /> : <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1" />}
                    </svg>
                    {habit.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 저녁 리뷰 */}
      <div style={{ padding: "0 20px" }}>
        <div style={{ background: "var(--color-card)", borderRadius: 24, padding: "24px", boxShadow: "var(--shadow-card)" }}>
          <button onClick={() => setReviewOpen(!reviewOpen)} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
            background: "transparent", border: "none", cursor: "pointer", padding: 0,
          }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--color-ink)", textWrap: "balance" as const }}>저녁 리뷰</h2>
            <span className={`chevron${reviewOpen ? " open" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4.5 7L9 11.5L13.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
          {reviewOpen && (
            <div style={{ marginTop: 16 }}>
              <ReviewField label="잘한 것" value={log.eveningReview.wins} onChange={(v) => updateReview("wins", v)} placeholder="오늘 잘한 것은?" />
              <ReviewField label="개선할 것" value={log.eveningReview.improvements} onChange={(v) => updateReview("improvements", v)} placeholder="내일은 어떻게 더 나아질 수 있을까?" />
              <ReviewField label="내일 집중할 것" value={log.eveningReview.tomorrowFocus} onChange={(v) => updateReview("tomorrowFocus", v)} placeholder="내일 가장 중요한 한 가지?" />
              <div style={{ marginTop: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: 10 }}>에너지 레벨</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {([1, 2, 3, 4, 5] as const).map((level) => {
                    const isSelected = log.eveningReview.energyLevel === level;
                    return (
                      <button key={level} onClick={() => updateReview("energyLevel", level)} style={{
                        width: 44, height: 44, borderRadius: 9999, border: "none",
                        background: isSelected ? "var(--color-accent)" : "var(--color-background)",
                        color: isSelected ? "#FFFFFF" : "var(--color-muted)",
                        fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background 0.2s ease, color 0.2s ease",
                      }}>{level}</button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CalendarTimeline ────────────────────────────────────

function CalendarTimeline({ timeBlocks, onAddAt, onEdit, onToggleDone }: {
  timeBlocks: TimeBlock[];
  onAddAt: (hour: number) => void;
  onEdit: (vb: VisualBlock) => void;
  onToggleDone: (vb: VisualBlock) => void;
}) {
  const { visualBlocks, emptyHours } = useMemo(() => buildVisualBlocks(timeBlocks), [timeBlocks]);

  // Build render list: iterate HOURS, emit TimeSlotRow or EventBlock (only at startHour)
  const rendered = new Set<string>();
  const vbByHour = new Map<number, VisualBlock>();
  for (const vb of visualBlocks) {
    for (const h of vb.hours) vbByHour.set(h, vb);
  }

  const currentHour = new Date().getHours();

  return (
    <div>
      {HOURS.map((hour) => {
        const vb = vbByHour.get(hour);

        // Empty slot
        if (!vb) {
          return (
            <TimeSlotRow
              key={hour}
              hour={hour}
              isCurrentHour={hour === currentHour}
              onTap={() => onAddAt(hour)}
            />
          );
        }

        // Already rendered this visual block
        const vbKey = vb.blockIds[0];
        if (rendered.has(vbKey)) return null;
        rendered.add(vbKey);

        return (
          <EventBlockCard
            key={vbKey}
            vb={vb}
            isCurrentHour={vb.hours.includes(currentHour)}
            onTap={() => onEdit(vb)}
            onToggleDone={() => onToggleDone(vb)}
          />
        );
      })}
    </div>
  );
}

// ─── TimeSlotRow (empty slot) ────────────────────────────

function TimeSlotRow({ hour, isCurrentHour, onTap }: {
  hour: number; isCurrentHour: boolean; onTap: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const h = formatHourShort(hour);

  return (
    <div
      onClick={onTap}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "44px 1fr",
        gap: 8,
        minHeight: 44,
        cursor: "pointer",
        position: "relative",
      }}
    >
      {/* Current hour indicator line */}
      {isCurrentHour && (
        <div style={{
          position: "absolute", left: 44, right: 0, top: 0, height: 2,
          background: "var(--color-accent, #B4A0E5)", borderRadius: 1, zIndex: 1,
        }}>
          <div style={{
            position: "absolute", left: -5, top: -3, width: 8, height: 8,
            borderRadius: "50%", background: "var(--color-accent, #B4A0E5)",
          }} />
        </div>
      )}

      {/* Hour label */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
        paddingTop: 4,
      }}>
        <span style={{
          fontSize: 11, fontWeight: isCurrentHour ? 700 : 500,
          fontVariantNumeric: "tabular-nums",
          color: isCurrentHour ? "var(--color-accent-text, #7B5EA7)" : "var(--color-muted-soft)",
        }}>{h.num}</span>
        <span style={{
          fontSize: 8, fontWeight: 500,
          color: isCurrentHour ? "var(--color-accent-text, #7B5EA7)" : "var(--color-muted-soft)",
        }}>{h.period}</span>
      </div>

      {/* Empty area with border */}
      <div style={{
        borderBottom: "1px solid var(--color-border-soft, #F0EDE8)",
        display: "flex", alignItems: "center", padding: "4px 8px",
        transition: "background 0.15s ease",
        background: hovered ? "var(--color-background)" : "transparent",
        borderRadius: hovered ? 8 : 0,
      }}>
        {hovered && (
          <span style={{ fontSize: 12, color: "var(--color-muted-soft)", fontWeight: 500 }}>+ 추가</span>
        )}
      </div>
    </div>
  );
}

// ─── EventBlockCard ──────────────────────────────────────

function EventBlockCard({ vb, isCurrentHour, onTap, onToggleDone }: {
  vb: VisualBlock; isCurrentHour: boolean;
  onTap: () => void; onToggleDone: () => void;
}) {
  const catInfo = TIME_CATEGORIES.find((c) => c.key === vb.category)!;
  const span = vb.hours.length;
  const startLabel = formatHour(vb.startHour);
  const endLabel = formatHour(vb.endHour);

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "44px 1fr", gap: 8,
      minHeight: Math.max(span * 44, 56),
    }}>
      {/* Hour labels for spanned hours */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {vb.hours.map((h, i) => {
          const hr = formatHourShort(h);
          return (
            <div key={h} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "flex-start", paddingTop: 4, minHeight: 44,
            }}>
              <span style={{
                fontSize: 11, fontWeight: i === 0 ? 700 : 500,
                fontVariantNumeric: "tabular-nums", color: catInfo.color,
              }}>{hr.num}</span>
              <span style={{ fontSize: 8, fontWeight: 500, color: catInfo.color }}>{hr.period}</span>
            </div>
          );
        })}
      </div>

      {/* Event card */}
      <button
        onClick={onTap}
        style={{
          margin: "4px 0",
          borderRadius: 14,
          padding: "12px 14px",
          display: "flex", flexDirection: "column", gap: 4,
          textAlign: "left", border: "none", cursor: "pointer", width: "100%",
          alignItems: "flex-start",
          background: `${catInfo.color}15`,
          borderLeft: `3px solid ${catInfo.color}`,
          opacity: vb.done ? 0.55 : 1,
          transition: "transform 0.15s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease",
          position: "relative",
        }}
      >
        {/* Current hour dot */}
        {isCurrentHour && (
          <div style={{
            position: "absolute", top: 8, right: 8, width: 8, height: 8,
            borderRadius: "50%", background: "var(--color-accent, #B4A0E5)",
            boxShadow: "0 0 0 2px rgba(180,160,229,0.3)",
          }} />
        )}

        {/* Top row: category + checkbox */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 700, color: catInfo.color, letterSpacing: "0.04em",
          }}>
            <span style={{ display: "inline-flex" }}>{CATEGORY_ICONS[vb.category]}</span>
            {catInfo.label}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleDone(); }}
            style={{
              width: 22, height: 22, borderRadius: "50%",
              border: vb.done ? "none" : `2px solid ${catInfo.color}60`,
              background: vb.done ? catInfo.color : "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              padding: 0, flexShrink: 0, transition: "background 0.2s ease",
            }}
          >
            {vb.done && (
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>

        {/* Title */}
        <span style={{
          fontSize: 14, fontWeight: 600, color: "var(--color-ink)", lineHeight: 1.3,
          textDecoration: vb.done ? "line-through" : "none",
        }}>{vb.plan}</span>

        {/* Time range */}
        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-muted)" }}>
          {startLabel} – {endLabel}
        </span>

        {/* Actual (memo) if exists */}
        {vb.actual.trim() && (
          <span style={{ fontSize: 12, color: "var(--color-muted)", fontStyle: "italic", marginTop: 2 }}>
            {vb.actual}
          </span>
        )}
      </button>
    </div>
  );
}

// ─── EventFormSheet (bottom sheet) ───────────────────────

function EventFormSheet({ mode, onClose, onSave, onDelete }: {
  mode: NonNullable<SheetMode>;
  onClose: () => void;
  onSave: (form: { plan: string; actual: string; category: TimeCategory; startHour: number; endHour: number; done: boolean }) => void;
  onDelete?: () => void;
}) {
  const isEdit = mode.mode === "edit";
  const defaults = isEdit
    ? { plan: mode.visualBlock.plan, actual: mode.visualBlock.actual, category: mode.visualBlock.category, startHour: mode.visualBlock.startHour, endHour: mode.visualBlock.endHour, done: mode.visualBlock.done }
    : { plan: "", actual: "", category: "focus" as TimeCategory, startHour: mode.defaultHour, endHour: HOURS[(HOURS.indexOf(mode.defaultHour) + 1) % HOURS.length], done: false };

  const [plan, setPlan] = useState(defaults.plan);
  const [actual, setActual] = useState(defaults.actual);
  const [category, setCategory] = useState<TimeCategory>(defaults.category);
  const [startHour, setStartHour] = useState(defaults.startHour);
  const [endHour, setEndHour] = useState(defaults.endHour);
  const [done, setDone] = useState(defaults.done);

  const handleSubmit = () => {
    if (!plan.trim()) return;
    onSave({ plan: plan.trim(), actual, category, startHour, endHour, done });
  };

  // Available end hours (must be after startHour in HOURS order)
  const startIdx = HOURS.indexOf(startHour);
  const endOptions = HOURS.slice(startIdx + 1, Math.min(startIdx + 13, HOURS.length));

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 100,
      }} />

      {/* Sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--color-card)",
        borderRadius: "24px 24px 0 0", padding: "20px 24px",
        paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
        zIndex: 101, boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
        animation: "slideUp 0.25s cubic-bezier(0.4,0,0.2,1)",
        maxHeight: "85vh", overflowY: "auto",
      }}>
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, background: "var(--color-border)", borderRadius: 2, margin: "0 auto 20px" }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--color-ink)" }}>
            {isEdit ? "일정 편집" : "일정 추가"}
          </h3>
          {onDelete && (
            <button onClick={onDelete} style={{
              background: "var(--color-error, #EF4444)20", border: "none", borderRadius: 9999,
              padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "var(--color-error, #EF4444)",
              cursor: "pointer",
            }}>삭제</button>
          )}
        </div>

        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: 8 }}>제목</label>
          <input
            type="text" autoFocus value={plan} onChange={(e) => setPlan(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onClose(); }}
            placeholder="어떤 일정인가요?"
            style={{
              width: "100%", fontSize: 15, padding: "12px 16px", borderRadius: 14, border: "none",
              background: "var(--color-background)", color: "var(--color-ink)", boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: 8 }}>카테고리</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TIME_CATEGORIES.map((cat) => {
              const isActive = category === cat.key;
              return (
                <button key={cat.key} onClick={() => setCategory(cat.key)} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 9999,
                  border: isActive ? `1.5px solid ${cat.color}` : "1.5px solid transparent",
                  background: isActive ? `${cat.color}20` : "var(--color-background)",
                  color: isActive ? cat.color : "var(--color-muted)", cursor: "pointer",
                  transition: "background 0.2s ease, color 0.2s ease",
                }}>
                  <span style={{ display: "inline-flex", color: isActive ? cat.color : "var(--color-muted-soft)" }}>{CATEGORY_ICONS[cat.key]}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time range */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: 8 }}>시간</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center" }}>
            <select
              value={startHour}
              onChange={(e) => {
                const newStart = Number(e.target.value);
                setStartHour(newStart);
                const newStartIdx = HOURS.indexOf(newStart);
                const curEndIdx = HOURS.indexOf(endHour);
                if (curEndIdx <= newStartIdx) {
                  setEndHour(HOURS[Math.min(newStartIdx + 1, HOURS.length - 1)]);
                }
              }}
              style={{
                fontSize: 14, padding: "12px 14px", borderRadius: 14, border: "none",
                background: "var(--color-background)", color: "var(--color-ink)",
                appearance: "none", fontFamily: "inherit", cursor: "pointer",
              }}
            >
              {HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
            </select>
            <span style={{ fontSize: 14, color: "var(--color-muted)", fontWeight: 500 }}>→</span>
            <select
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              style={{
                fontSize: 14, padding: "12px 14px", borderRadius: 14, border: "none",
                background: "var(--color-background)", color: "var(--color-ink)",
                appearance: "none", fontFamily: "inherit", cursor: "pointer",
              }}
            >
              {endOptions.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
            </select>
          </div>
        </div>

        {/* Memo (actual) */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: 8 }}>메모 (선택)</label>
          <textarea
            value={actual} onChange={(e) => setActual(e.target.value)}
            placeholder="실제로 한 일이나 메모를 남겨보세요"
            rows={2}
            style={{
              width: "100%", fontSize: 14, padding: "12px 16px", borderRadius: 14, border: "none",
              background: "var(--color-background)", color: "var(--color-body)", resize: "vertical",
              boxSizing: "border-box", fontFamily: "inherit",
            }}
          />
        </div>

        {/* Done toggle */}
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setDone(!done)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
            borderRadius: 14, border: "none", width: "100%",
            background: done ? "var(--color-success, #10B981)15" : "var(--color-background)",
            cursor: "pointer", transition: "background 0.2s ease",
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              border: done ? "none" : "2px solid var(--color-muted-soft)",
              background: done ? "var(--color-success, #10B981)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {done && (
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: done ? "var(--color-success, #10B981)" : "var(--color-muted)" }}>
              {done ? "완료됨" : "완료 처리"}
            </span>
          </button>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, fontSize: 15, fontWeight: 600, padding: "14px 0", borderRadius: 9999,
            border: "none", background: "var(--color-background)", color: "var(--color-muted)", cursor: "pointer",
          }}>취소</button>
          <button onClick={handleSubmit} style={{
            flex: 2, fontSize: 15, fontWeight: 700, padding: "14px 0", borderRadius: 9999,
            border: "none", background: plan.trim() ? "var(--color-primary)" : "var(--color-muted-soft)",
            color: "#fff", cursor: plan.trim() ? "pointer" : "not-allowed",
            transition: "background 0.2s ease",
          }}>저장</button>
        </div>
      </div>
    </>
  );
}

// ─── Review Field ───────────────────────────────────────────

function ReviewField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: 8 }}>{label}</label>
      <textarea
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2}
        style={{
          background: "var(--color-background)", border: "none", borderRadius: 12, padding: "14px 16px",
          fontSize: 14, fontWeight: 400, color: "var(--color-body)", resize: "vertical",
          width: "100%", boxSizing: "border-box",
        }}
      />
    </div>
  );
}
