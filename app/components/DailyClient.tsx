"use client";

import { useState, useEffect, useCallback } from "react";
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

function formatHour(h: number): string {
  return `${String(h).padStart(2, "0")}`;
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

function getTimeGradient(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) {
    // 아침 — 일출: 아이보리 → 골드
    return "linear-gradient(180deg, #EDE8DE 0%, #F2E0A8 100%)";
  }
  if (hour >= 10 && hour < 14) {
    // 점심 — 맑은 하늘: 블루 → 스카이블루
    return "linear-gradient(180deg, #C0D4F0 0%, #D8EAF8 100%)";
  }
  if (hour >= 14 && hour < 17) {
    // 낮 — 골든아워: 블러시핑크 → 피치
    return "linear-gradient(180deg, #F0DCD4 0%, #F4DCC0 100%)";
  }
  if (hour >= 17 && hour < 21) {
    // 저녁 — 석양: 더스티 라벤더 → 피치 오렌지
    return "linear-gradient(180deg, #C8B8D4 0%, #E8C8A0 100%)";
  }
  // 새벽 (21시~6시) — 밤하늘: 쿨 슬레이트 → 세이지
  return "linear-gradient(180deg, #C8D0D4 0%, #D8D8CC 100%)";
}

function getStreakMessage(streak: number): string {
  if (streak === 0) return "오늘부터 시작해볼까요?";
  if (streak < 3) return "좋은 시작이에요!";
  if (streak < 7) return "멋진 페이스예요!";
  if (streak < 14) return "대단해요! 습관이 되어가고 있어요";
  if (streak < 30) return "놀라운 꾸준함이에요!";
  return "이미 거목 수준이에요!";
}

const CATEGORY_ICONS: Record<TimeCategory, string> = {
  focus: "■",
  meeting: "◆",
  rest: "○",
  routine: "□",
  personal: "●",
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
      setLog({ ...saved, timeBlocks: blocks });
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
    <div style={{ paddingBottom: 40, background: getTimeGradient(), minHeight: "100%" }}>
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
        <p style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 400, fontStyle: "italic", color: "var(--color-ink)", margin: "0 0 12px" }}>
          {getGreeting()}
        </p>

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
              <span style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600, lineHeight: 1 }}>
                {streak.currentStreak}일
              </span>
              <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.85, marginLeft: 6 }}>연속 달성</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.7 }}>
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
            border: "1px solid var(--color-border)",
          }}
        >
          {/* Section header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--color-ink)" }}>
              오늘의 집중
            </h2>
            <span style={{
              fontSize: 15,
              fontWeight: 700,
              color: focusHours >= 4 ? "var(--color-success)" : "var(--color-primary)",
            }}>
              {focusHours}h / 4h
            </span>
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
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--color-ink)" }}>
                오늘의 습관
              </h2>
              <span style={{
                fontSize: 14,
                fontWeight: 600,
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
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{done ? "●" : "○"}</span>
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
            border: "1px solid var(--color-border)",
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
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--color-ink)" }}>
              저녁 리뷰
            </h2>
            <span style={{
              fontSize: 18,
              color: "var(--color-muted)",
              transform: reviewOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              display: "inline-block",
            }}>
              ▾
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
                          transition: "all 0.2s ease",
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
          <span style={{ fontSize: 12 }}>{CATEGORY_ICONS[block.category]}</span>
          <span>{formatHour(block.hour)}</span>
        </button>

        {/* PLAN */}
        <div
          className={`cat-${block.category}`}
          style={{ padding: "6px 8px", borderRadius: 12 }}
        >
          <input
            type="text"
            value={block.plan}
            onChange={(e) => onPlanChange(e.target.value)}
            placeholder="—"
            style={{ fontSize: 12, fontWeight: 400, padding: 0 }}
          />
        </div>

        {/* Checkbox */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={onToggleDone}
            aria-label={block.done ? "완료 취소" : "완료 처리"}
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: block.done ? "none" : "2px solid var(--color-muted-soft, #B8B0A6)",
              background: block.done ? "var(--color-primary)" : "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              transition: "all 0.2s ease",
              flexShrink: 0,
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
        <div style={{ padding: "6px 8px", borderRadius: 12, background: "var(--color-background)" }}>
          <input
            type="text"
            value={block.actual}
            onChange={(e) => onActualChange(e.target.value)}
            placeholder="—"
            style={{ fontSize: 12, fontWeight: 400, padding: 0 }}
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
                  padding: "5px 12px",
                  borderRadius: 9999,
                  border: "none",
                  background: isActive ? cat.color : "var(--color-background)",
                  color: isActive ? "#FFFFFF" : "var(--color-muted)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {CATEGORY_ICONS[cat.key]} {cat.label}
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
