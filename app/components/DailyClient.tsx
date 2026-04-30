"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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

function formatHour(h: number): { num: string; period: string } {
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
  if (hour < 6) {
    // 새벽 — 달+별
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B72CE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
        <path d="M17 4l.5 1.5L19 6l-1.5.5L17 8l-.5-1.5L15 6l1.5-.5L17 4z" fill="#B4A0E5" stroke="none"/>
      </svg>
    );
  }
  if (hour < 12) {
    // 아침 — 일출
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B72CE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 18a5 5 0 10-10 0"/>
        <line x1="12" y1="9" x2="12" y2="2"/>
        <line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/>
        <line x1="1" y1="18" x2="3" y2="18"/>
        <line x1="21" y1="18" x2="23" y2="18"/>
        <line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/>
        <line x1="23" y1="22" x2="1" y2="22"/>
        <polyline points="8 6 12 2 16 6"/>
      </svg>
    );
  }
  if (hour < 17) {
    // 오후 — 태양
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B72CE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    );
  }
  if (hour < 21) {
    // 저녁 — 일몰
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B72CE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 18a5 5 0 10-10 0"/>
        <line x1="12" y1="9" x2="12" y2="2"/>
        <line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/>
        <line x1="1" y1="18" x2="3" y2="18"/>
        <line x1="21" y1="18" x2="23" y2="18"/>
        <line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/>
        <line x1="23" y1="22" x2="1" y2="22"/>
        <polyline points="16 6 12 10 8 6"/>
      </svg>
    );
  }
  // 밤 — 달+별
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B72CE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
      <path d="M17 4l.5 1.5L19 6l-1.5.5L17 8l-.5-1.5L15 6l1.5-.5L17 4z" fill="#B4A0E5" stroke="none"/>
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
  focus: (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="1" y="1" width="8" height="8" rx="1.5"/></svg>
  ),
  meeting: (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l4 8H1l4-8z"/></svg>
  ),
  rest: (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="5" cy="5" r="3.5"/></svg>
  ),
  routine: (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="1.5" width="7" height="7" rx="1"/></svg>
  ),
  personal: (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="3.5"/></svg>
  ),
};

// ─── Main Component ───────────────────────────────────────

export default function DailyPage() {
  const params = useParams();
  const date = params.date as string;
  const [log, setLog] = useState<DailyLog | null>(null);
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, lastCompletedDate: "", totalCompletedDays: 0 });
  const [habitTracker, setHabitTracker] = useState<HabitTrackerData | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<number | null>(null);

  // Auto-open review after 20:00
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 20) setReviewOpen(true);
  }, []);

  useEffect(() => {
    const saved = getDailyLog(date);
    if (saved) {
      const blocks = saved.timeBlocks.map((b) => ({
        ...b,
        done: b.done ?? false,
      }));
      // Backfill missing hours (e.g. 0-5 added after upgrade)
      const existingHours = new Set(blocks.map((b) => b.hour));
      const missing = HOURS.filter((h) => !existingHours.has(h)).map((hour) => ({
        id: uid(),
        hour,
        plan: "",
        actual: "",
        category: "routine" as TimeCategory,
        done: false,
      }));
      const allBlocks = [...blocks, ...missing].sort((a, b) => {
        return HOURS.indexOf(a.hour) - HOURS.indexOf(b.hour);
      });
      setLog({ ...saved, timeBlocks: allBlocks });
    } else {
      setLog(createDefaultLog(date));
    }
    setStreak(getStreakData());

    // Load habits for quick check
    const d = new Date(date + "T00:00:00");
    const ym = formatYearMonth(d);
    setHabitTracker(getHabitTracker(ym) ?? null);
  }, [date]);

  const save = useCallback(
    (updated: DailyLog) => {
      const withTimestamp = { ...updated, updatedAt: new Date().toISOString() };
      setLog(withTimestamp);
      saveDailyLog(withTimestamp);

      // Update daily completion
      const focusHours = withTimestamp.timeBlocks.filter((b) => b.done).length;
      const reviewDone = !!(withTimestamp.eveningReview.wins || withTimestamp.eveningReview.improvements || withTimestamp.eveningReview.tomorrowFocus);
      const focusOk = focusHours >= 4;

      // Check habits completion
      const d = new Date(date + "T00:00:00");
      const ym = formatYearMonth(d);
      const ht = getHabitTracker(ym);
      let habitsOk = false;
      if (ht && ht.habits.length > 0) {
        const done = ht.records.filter((r) => r.date === date && r.done).length;
        habitsOk = done / ht.habits.length >= 0.5;
      }

      const completed = [focusOk, habitsOk, reviewDone].filter(Boolean).length >= 2;
      saveDailyCompletion({
        date,
        focusHoursCompleted: focusOk,
        habitsCompleted: habitsOk,
        reviewCompleted: reviewDone,
        isCompleted: completed,
      });
      setStreak(getStreakData());
    },
    [date]
  );

  const updateBlock = useCallback(
    (hour: number, field: "plan" | "actual", value: string) => {
      if (!log) return;
      const blocks = log.timeBlocks.map((b) =>
        b.hour === hour ? { ...b, [field]: value } : b
      );
      save({ ...log, timeBlocks: blocks });
    },
    [log, save]
  );

  const toggleDone = useCallback(
    (hour: number) => {
      if (!log) return;
      const blocks = log.timeBlocks.map((b) =>
        b.hour === hour ? { ...b, done: !b.done } : b
      );
      save({ ...log, timeBlocks: blocks });
    },
    [log, save]
  );

  const updateCategory = useCallback(
    (hour: number, category: TimeCategory) => {
      if (!log) return;
      const blocks = log.timeBlocks.map((b) =>
        b.hour === hour ? { ...b, category } : b
      );
      save({ ...log, timeBlocks: blocks });
      setEditingBlock(null);
    },
    [log, save]
  );

  const updateReview = useCallback(
    (field: keyof EveningReview, value: string | number) => {
      if (!log) return;
      save({
        ...log,
        eveningReview: { ...log.eveningReview, [field]: value },
      });
    },
    [log, save]
  );

  // Quick habit toggle
  const toggleHabit = useCallback(
    (habitId: string) => {
      if (!habitTracker) return;
      const dateStr = date;
      const existing = habitTracker.records.find(
        (r) => r.habitId === habitId && r.date === dateStr
      );
      let records;
      if (existing) {
        records = habitTracker.records.map((r) =>
          r.habitId === habitId && r.date === dateStr ? { ...r, done: !r.done } : r
        );
      } else {
        records = [...habitTracker.records, { habitId, date: dateStr, done: true }];
      }
      const updated = { ...habitTracker, records, updatedAt: new Date().toISOString() };
      setHabitTracker(updated);
      saveHabitTracker(updated);

      // Re-trigger completion check
      if (log) save(log);
    },
    [habitTracker, date, log, save]
  );

  if (!log) return null;

  const focusHours = log.timeBlocks.filter((b) => b.done).length;
  const filledBlocks = log.timeBlocks.filter((b) => b.plan.trim() !== "");

  // Habit stats for quick view
  const habits = habitTracker?.habits ?? [];
  const habitsDoneCount = habits.filter((h) => {
    const rec = habitTracker?.records.find((r) => r.habitId === h.id && r.date === date);
    return rec?.done ?? false;
  }).length;

  // Week progress for streak card
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(date + "T00:00:00");
    const dow = d.getDay(); // 0=일
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
        {/* Greeting */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 12px" }}>
          <span style={{ flexShrink: 0, display: "inline-flex" }}>{getTimeIcon()}</span>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 400, fontStyle: "italic", color: "var(--color-ink)", margin: 0, textWrap: "balance" as const }}>
            {getGreeting()}
          </p>
        </div>

        {/* Streak Card — lavender gradient */}
        <div
          style={{
            background: "linear-gradient(135deg, #8B72CE 0%, #6B52AE 100%)",
            borderRadius: 24,
            padding: "24px",
            color: "#fff",
          }}
        >
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

          {/* Week dots */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {["월", "화", "수", "목", "금", "토", "일"].map((d, i) => {
              const dayDate = weekDays[i];
              const isToday = dayDate === date;
              // Simple check: just show placeholder dots
              return (
                <div key={d} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.6, marginBottom: 4 }}>{d}</div>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      margin: "0 auto",
                      background: isToday ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
                      border: isToday ? "2px solid #fff" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {isToday ? "!" : ""}
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: 13, fontWeight: 500, opacity: 0.85, margin: 0 }}>
            {getStreakMessage(streak.currentStreak)}
          </p>
        </div>
      </div>

      {/* 오늘의 집중 — 타임블록 */}
      <div style={{ padding: "0 20px", marginBottom: 16 }}>
        <div
          style={{
            background: "var(--color-card)",
            borderRadius: 24,
            padding: "24px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* Section header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--color-ink)", textWrap: "balance" as const }}>
              오늘의 집중
            </h2>
            <span style={{
              fontSize: 15,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              color: focusHours >= 4 ? "var(--color-success)" : "var(--color-primary)",
            }}>
              {focusHours}h / 4h
            </span>
          </div>

          {/* Column headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "46px 1fr 32px 1fr",
            gap: 4,
            marginBottom: 6,
          }}>
            <div />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: "var(--color-accent-text, #7B5EA7)" }}>Plan</span>
            <div />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: "var(--color-muted, #6B7280)" }}>Do</span>
          </div>

          {/* Timeblock rows */}
          {log.timeBlocks.map((block) => (
            <TimeBlockRow
              key={block.hour}
              block={block}
              isEditing={editingBlock === block.hour}
              onTapHour={() => setEditingBlock(editingBlock === block.hour ? null : block.hour)}
              onPlanChange={(v) => updateBlock(block.hour, "plan", v)}
              onActualChange={(v) => updateBlock(block.hour, "actual", v)}
              onToggleDone={() => toggleDone(block.hour)}
              onCategoryChange={(c) => updateCategory(block.hour, c)}
            />
          ))}
        </div>
      </div>

      {/* 오늘의 습관 — 퀵 체크 */}
      {habits.length > 0 && (
        <div style={{ padding: "0 20px", marginBottom: 16 }}>
          <div
            style={{
              background: "var(--color-card)",
              borderRadius: 24,
              padding: "24px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--color-ink)", textWrap: "balance" as const }}>
                오늘의 습관
              </h2>
              <span style={{
                fontSize: 14,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                color: habitsDoneCount === habits.length ? "var(--color-success)" : "var(--color-muted)",
              }}>
                {habitsDoneCount}/{habits.length}
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {habits.map((habit) => {
                const rec = habitTracker?.records.find((r) => r.habitId === habit.id && r.date === date);
                const done = rec?.done ?? false;
                return (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      borderRadius: 9999,
                      border: "none",
                      background: done ? "var(--color-primary-light)" : "var(--color-background)",
                      color: done ? "var(--color-primary)" : "var(--color-muted)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "background 0.2s ease, color 0.2s ease",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      {done ? (
                        <circle cx="8" cy="8" r="7" fill="currentColor" />
                      ) : (
                        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1" />
                      )}
                    </svg>
                    {habit.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 저녁 리뷰 — 접힘/펼침 */}
      <div style={{ padding: "0 20px" }}>
        <div
          style={{
            background: "var(--color-card)",
            borderRadius: 24,
            padding: "24px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <button
            onClick={() => setReviewOpen(!reviewOpen)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--color-ink)", textWrap: "balance" as const }}>
              저녁 리뷰
            </h2>
            <span className={`chevron${reviewOpen ? " open" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4.5 7L9 11.5L13.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>

          {reviewOpen && (
            <div style={{ marginTop: 16 }}>
              <ReviewField
                label="잘한 것"
                value={log.eveningReview.wins}
                onChange={(v) => updateReview("wins", v)}
                placeholder="오늘 잘한 것은?"
              />
              <ReviewField
                label="개선할 것"
                value={log.eveningReview.improvements}
                onChange={(v) => updateReview("improvements", v)}
                placeholder="내일은 어떻게 더 나아질 수 있을까?"
              />
              <ReviewField
                label="내일 집중할 것"
                value={log.eveningReview.tomorrowFocus}
                onChange={(v) => updateReview("tomorrowFocus", v)}
                placeholder="내일 가장 중요한 한 가지?"
              />

              {/* Energy Level */}
              <div style={{ marginTop: 16 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--color-muted)",
                    display: "block",
                    marginBottom: 10,
                  }}
                >
                  에너지 레벨
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  {([1, 2, 3, 4, 5] as const).map((level) => {
                    const isSelected = log.eveningReview.energyLevel === level;
                    return (
                      <button
                        key={level}
                        onClick={() => updateReview("energyLevel", level)}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 9999,
                          border: "none",
                          background: isSelected
                            ? "var(--color-accent)"
                            : "var(--color-background)",
                          color: isSelected ? "#FFFFFF" : "var(--color-muted)",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "background 0.2s ease, color 0.2s ease",
                        }}
                      >
                        {level}
                      </button>
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

// ─── Auto-shrink Cell ───────────────────────────────────────

function AutoShrinkCell({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Reset height to measure scrollHeight
    el.style.height = "auto";
    // Clamp to 2 lines max (2 lines × lineHeight 1.4 × fontSize)
    const fontSize = parseFloat(getComputedStyle(el).fontSize);
    const maxHeight = Math.ceil(fontSize * 1.4 * 2) + 2;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";

    // Auto-shrink font if content overflows at 2 lines
    if (el.scrollHeight > maxHeight) {
      const shrunk = Math.max(9, Math.floor(fontSize - 1));
      el.style.fontSize = shrunk + "px";
      el.style.height = "auto";
      const newMax = Math.ceil(shrunk * 1.4 * 2) + 2;
      el.style.height = Math.min(el.scrollHeight, newMax) + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      style={{
        fontSize: 12,
        fontWeight: 400,
        padding: 0,
        width: "100%",
        border: "none",
        background: "transparent",
        resize: "none",
        outline: "none",
        lineHeight: 1.4,
        fontFamily: "inherit",
        color: "inherit",
        overflow: "hidden",
      }}
    />
  );
}

// ─── TimeBlock Row ──────────────────────────────────────────

function TimeBlockRow({
  block,
  isEditing,
  onTapHour,
  onPlanChange,
  onActualChange,
  onToggleDone,
  onCategoryChange,
}: {
  block: TimeBlock;
  isEditing: boolean;
  onTapHour: () => void;
  onPlanChange: (v: string) => void;
  onActualChange: (v: string) => void;
  onToggleDone: () => void;
  onCategoryChange: (c: TimeCategory) => void;
}) {
  const catInfo = TIME_CATEGORIES.find((c) => c.key === block.category);

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "46px 1fr 32px 1fr",
          gap: 4,
          marginBottom: 2,
          alignItems: "center",
        }}
      >
        {/* Hour + category icon */}
        <button
          onClick={onTapHour}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            fontSize: 11,
            fontWeight: 600,
            color: catInfo?.color ?? "var(--color-muted)",
            textAlign: "center",
            padding: "8px 0",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span style={{ display: "inline-flex" }}>{CATEGORY_ICONS[block.category]}</span>
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 1 }}>
            <span>{formatHour(block.hour).num}</span>
            <span style={{ fontSize: 8, fontWeight: 500, opacity: 0.7 }}>{formatHour(block.hour).period}</span>
          </span>
        </button>

        {/* PLAN */}
        <div
          className={`cat-${block.category}`}
          style={{ padding: "4px 8px", borderRadius: 12 }}
        >
          <AutoShrinkCell
            value={block.plan}
            onChange={onPlanChange}
            placeholder="—"
          />
        </div>

        {/* Checkbox — 22px visible, 40px hit area via position:relative */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={onToggleDone}
            aria-label={block.done ? "완료 취소" : "완료 처리"}
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: block.done ? "none" : "2px solid var(--color-muted-soft, #9CA3AF)",
              background: block.done ? "var(--color-primary)" : "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              transition: "background 0.2s ease, border-color 0.2s ease",
              flexShrink: 0,
              position: "relative",
            }}
          >
            {block.done && (
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* DO */}
        <div style={{ padding: "4px 8px", borderRadius: 12, background: "var(--color-background)" }}>
          <AutoShrinkCell
            value={block.actual}
            onChange={onActualChange}
            placeholder="—"
          />
        </div>
      </div>

      {/* Category selector (shown when editing) */}
      {isEditing && (
        <div style={{ display: "flex", gap: 6, padding: "6px 0 10px 46px", flexWrap: "wrap" }}>
          {TIME_CATEGORIES.map((cat) => {
            const isActive = block.category === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => onCategoryChange(cat.key)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "8px 12px",
                  borderRadius: 9999,
                  border: "none",
                  background: isActive ? cat.color : "var(--color-background)",
                  color: isActive ? "#FFFFFF" : "var(--color-muted)",
                  cursor: "pointer",
                  transition: "background 0.2s ease, color 0.2s ease",
                }}
              >
                <span style={{ display: "inline-flex" }}>{CATEGORY_ICONS[cat.key]}</span> {cat.label}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── Review Field ───────────────────────────────────────────

function ReviewField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--color-muted)",
          display: "block",
          marginBottom: 8,
        }}
      >
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        style={{
          background: "var(--color-background)",
          border: "none",
          borderRadius: 12,
          padding: "14px 16px",
          fontSize: 14,
          fontWeight: 400,
          color: "var(--color-body)",
          resize: "vertical",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
