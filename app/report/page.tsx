"use client";

import { useState, useEffect } from "react";
import { getAllDailyLogs, getAllHabitTrackers, getStreakData } from "@/lib/storage";
import { formatYearMonth } from "@/lib/dateUtils";
import { TIME_CATEGORIES } from "@/lib/constants";
import type { DailyLog, HabitTrackerData, StreakData, TimeCategory } from "@/lib/types";

// ─── Main Component ──────────────────────────────────────

export default function ReportPage() {
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [trackers, setTrackers] = useState<HabitTrackerData[]>([]);
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, lastCompletedDate: "", totalCompletedDays: 0 });

  useEffect(() => {
    setLogs(getAllDailyLogs());
    setTrackers(getAllHabitTrackers());
    setStreak(getStreakData());
  }, []);

  // Filter logs by period
  const now = new Date();
  const filteredLogs = logs.filter((log) => {
    const d = new Date(log.date + "T00:00:00");
    if (period === "week") {
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff < 7;
    }
    if (period === "month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Focus hours by day
  const focusByDay = filteredLogs.map((log) => ({
    date: log.date,
    hours: log.timeBlocks.filter((b) => b.done).length,
    label: new Date(log.date + "T00:00:00").toLocaleDateString("ko-KR", { weekday: "short" }),
  }));

  const avgFocus = focusByDay.length > 0
    ? (focusByDay.reduce((s, d) => s + d.hours, 0) / focusByDay.length).toFixed(1)
    : "0";

  // Category distribution
  const catCounts: Record<TimeCategory, number> = { focus: 0, meeting: 0, rest: 0, routine: 0, personal: 0 };
  filteredLogs.forEach((log) => {
    log.timeBlocks.forEach((b) => {
      if (b.done) catCounts[b.category]++;
    });
  });
  const catTotal = Object.values(catCounts).reduce((s, v) => s + v, 0);

  // Energy by day of week
  const energyByDow: Record<number, number[]> = {};
  filteredLogs.forEach((log) => {
    if (log.eveningReview?.energyLevel) {
      const dow = new Date(log.date + "T00:00:00").getDay();
      if (!energyByDow[dow]) energyByDow[dow] = [];
      energyByDow[dow].push(log.eveningReview.energyLevel);
    }
  });
  const DOW_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
  const avgEnergyByDow = DOW_LABELS.map((label, i) => {
    const vals = energyByDow[i] ?? [];
    const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    return { label, avg: Math.round(avg * 10) / 10 };
  });

  const overallEnergy = filteredLogs.length > 0
    ? (filteredLogs.filter((l) => l.eveningReview?.energyLevel).reduce((s, l) => s + (l.eveningReview?.energyLevel ?? 0), 0) /
       filteredLogs.filter((l) => l.eveningReview?.energyLevel).length).toFixed(1)
    : "—";

  // Habit achievement for current month
  const currentYM = formatYearMonth(now);
  const currentTracker = trackers.find((t) => t.yearMonth === currentYM);
  const habitStats = currentTracker?.habits.map((habit) => {
    const done = currentTracker.records.filter((r) => r.habitId === habit.id && r.done).length;
    const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return { title: habit.title, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }) ?? [];

  const bestHabit = habitStats.length > 0 ? habitStats.reduce((a, b) => a.pct > b.pct ? a : b) : null;
  const worstHabit = habitStats.length > 0 ? habitStats.reduce((a, b) => a.pct < b.pct ? a : b) : null;

  // Best energy day
  const bestEnergyDay = avgEnergyByDow.reduce((a, b) => a.avg > b.avg ? a : b, { label: "—", avg: 0 });

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Header */}
      <header style={{ padding: "20px 20px 0", background: "linear-gradient(160deg, #8B72CE 0%, #B4A0E5 50%, #D4C5F0 100%)" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, fontStyle: "italic", margin: "0 0 4px", color: "#FFFFFF" }}>리포트</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500, margin: "0 0 16px" }}>나의 패턴을 분석해보세요</p>

        {/* Period Underline Tab */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
          {(["week", "month", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                flex: 1, padding: "12px 0", fontSize: 15, fontWeight: 600,
                border: "none",
                borderBottom: period === p ? "2px solid #FFFFFF" : "2px solid transparent",
                cursor: "pointer",
                background: "transparent",
                color: period === p ? "#FFFFFF" : "rgba(255,255,255,0.6)",
                transition: "color 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                marginBottom: -1,
              }}
            >
              {p === "week" ? "이번 주" : p === "month" ? "이번 달" : "전체"}
            </button>
          ))}
        </div>
      </header>

      <div style={{ padding: "0 20px", marginTop: 16 }}>
        {/* Focus Hours Chart */}
        <div style={{
          background: "var(--color-card)", borderRadius: 24, padding: 20,
          boxShadow: "var(--shadow-card)", marginBottom: 16,
        }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: "0 0 16px", color: "var(--color-ink)" }}>집중 시간 추이</h3>

          {/* Simple bar chart */}
          {focusByDay.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--color-muted)", textAlign: "center", padding: "24px 0" }}>
              아직 기록된 데이터가 없어요
            </p>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, marginBottom: 8 }}>
                {focusByDay.map((d) => {
                  const maxH = Math.max(...focusByDay.map((x) => x.hours), 1);
                  const height = (d.hours / maxH) * 100;
                  return (
                    <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-primary)", marginBottom: 4 }}>
                        {d.hours > 0 ? `${d.hours}h` : ""}
                      </span>
                      <div style={{
                        width: "100%", maxWidth: 32, height: `${height}%`, minHeight: d.hours > 0 ? 4 : 0,
                        background: d.hours >= 4 ? "var(--color-primary)" : "var(--color-primary-light)",
                        borderRadius: "6px 6px 0 0", transition: "height 0.3s ease",
                      }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {focusByDay.map((d) => (
                  <div key={d.date} style={{ flex: 1, textAlign: "center", fontSize: 10, color: "var(--color-muted)", fontWeight: 600 }}>
                    {d.label}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 16 }}>
                <span style={{ fontSize: 13, color: "var(--color-body)" }}>
                  평균: <strong style={{ color: "var(--color-primary)" }}>{avgFocus}h / 일</strong>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Category Distribution */}
        <div style={{
          background: "var(--color-card)", borderRadius: 24, padding: 20,
          boxShadow: "var(--shadow-card)", marginBottom: 16,
        }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: "0 0 16px", color: "var(--color-ink)" }}>카테고리 분포</h3>

          {catTotal === 0 ? (
            <p style={{ fontSize: 14, color: "var(--color-muted)", textAlign: "center", padding: "24px 0" }}>데이터가 없어요</p>
          ) : (
            <>
              {/* Horizontal stacked bar */}
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 24, marginBottom: 16 }}>
                {TIME_CATEGORIES.map((cat) => {
                  const pct = catTotal > 0 ? (catCounts[cat.key] / catTotal) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <div key={cat.key} style={{
                      width: `${pct}%`, background: cat.color, transition: "width 0.3s ease",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {pct >= 12 && <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{Math.round(pct)}%</span>}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {TIME_CATEGORIES.map((cat) => {
                  const pct = catTotal > 0 ? Math.round((catCounts[cat.key] / catTotal) * 100) : 0;
                  return (
                    <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: cat.color }} />
                      <span style={{ fontSize: 13, color: "var(--color-body)" }}>{cat.label} {pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Habit Achievement */}
        {habitStats.length > 0 && (
          <div style={{
            background: "var(--color-card)", borderRadius: 24, padding: 20,
            boxShadow: "var(--shadow-card)", marginBottom: 16,
          }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: "0 0 12px", color: "var(--color-ink)" }}>습관 달성 트렌드</h3>

            {bestHabit && (
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{
                  flex: 1, background: "var(--color-accent-light, #EDE8F8)", borderRadius: 12, padding: "12px 14px",
                  borderLeft: "3px solid var(--color-accent-text, #7B5EA7)",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-accent-text, #7B5EA7)", marginBottom: 2 }}>베스트</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-body)" }}>{bestHabit.title} ({bestHabit.pct}%)</div>
                </div>
                {worstHabit && worstHabit.title !== bestHabit.title && (
                  <div style={{
                    flex: 1, background: "var(--color-background, #F7F5F0)", borderRadius: 12, padding: "12px 14px",
                    borderLeft: "3px solid var(--color-muted-soft, #9CA3AF)",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-muted, #6B7280)", marginBottom: 2 }}>개선 필요</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-body)" }}>{worstHabit.title} ({worstHabit.pct}%)</div>
                  </div>
                )}
              </div>
            )}

            {habitStats.map((h) => (
              <div key={h.title} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "var(--color-body)" }}>{h.title}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: h.pct >= 80 ? "var(--color-accent-text, #7B5EA7)" : "var(--color-body)" }}>{h.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "var(--color-background)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 3, width: `${h.pct}%`,
                    background: h.pct >= 80 ? "var(--color-accent-text, #7B5EA7)" : h.pct >= 50 ? "var(--color-accent, #B4A0E5)" : "var(--color-muted-soft, #9CA3AF)",
                    transition: "width 0.3s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Energy Pattern */}
        <div style={{
          background: "var(--color-card)", borderRadius: 24, padding: 20,
          boxShadow: "var(--shadow-card)", marginBottom: 16,
        }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: "var(--color-ink)" }}>에너지 패턴</h3>
          <p style={{ fontSize: 13, color: "var(--color-muted)", margin: "0 0 16px" }}>
            평균 에너지: <strong style={{ color: "var(--color-ink)" }}>{overallEnergy} / 5</strong>
          </p>

          <div style={{ display: "flex", gap: 6 }}>
            {avgEnergyByDow.map((d) => (
              <div key={d.label} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-muted)", marginBottom: 8 }}>{d.label}</div>
                {/* Vertical bar */}
                <div style={{
                  height: 60, background: "var(--color-background)", borderRadius: 6,
                  display: "flex", flexDirection: "column", justifyContent: "flex-end",
                }}>
                  <div style={{
                    height: `${d.avg > 0 ? (d.avg / 5) * 100 : 0}%`,
                    background: d.avg >= 4 ? "var(--color-success)" : d.avg >= 3 ? "var(--color-primary)" : d.avg > 0 ? "var(--color-warning)" : "transparent",
                    borderRadius: "6px 6px 0 0", transition: "height 0.3s ease", minHeight: d.avg > 0 ? 4 : 0,
                  }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-body)", marginTop: 4 }}>
                  {d.avg > 0 ? d.avg : "—"}
                </div>
              </div>
            ))}
          </div>

          {bestEnergyDay.avg > 0 && (
            <div style={{
              marginTop: 16, padding: "12px 14px",
              background: "var(--color-primary-light)", borderRadius: 12,
              fontSize: 13, color: "var(--color-primary)", fontWeight: 500,
            }}>
              {bestEnergyDay.label}요일에 에너지가 가장 높아요. 중요한 집중 업무를 {bestEnergyDay.label}요일에 배치해보세요!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
