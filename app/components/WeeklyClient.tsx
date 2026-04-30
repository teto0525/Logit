"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/app/components/PageHeader";
import { getWeeklyPlan, saveWeeklyPlan } from "@/lib/storage";
import { weekIdToMonday, formatDate, formatWeekId, uid } from "@/lib/dateUtils";
import { DAYS_KO } from "@/lib/constants";
import type { WeeklyPlan, DayPlan, Task } from "@/lib/types";

// ─── 헬퍼 함수 ──────────────────────────────────────────

function buildDefaultPlan(weekId: string): WeeklyPlan {
  const monday = weekIdToMonday(weekId);
  const days: DayPlan[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { date: formatDate(d), tasks: [] };
  });
  return {
    id: uid(),
    weekId,
    startDate: formatDate(monday),
    days,
    weekReflection: "",
    linkedObjectiveIds: [],
    updatedAt: new Date().toISOString(),
  };
}

function parseWeekLabel(weekId: string): string {
  // "2026-W18" → "W18"
  const match = weekId.match(/W(\d+)$/);
  return match ? `W${match[1]}` : weekId;
}

function formatDayLabel(dateStr: string, index: number): string {
  const d = new Date(dateStr + "T00:00:00");
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${DAYS_KO[index]} ${month}/${day}`;
}

function formatDateRange(weekId: string): string {
  const monday = weekIdToMonday(weekId);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const mM = monday.getMonth() + 1;
  const mD = monday.getDate();
  const sM = sunday.getMonth() + 1;
  const sD = sunday.getDate();
  return `${mM}/${mD} - ${sM}/${sD}`;
}

function getPrevWeekId(weekId: string): string {
  const monday = weekIdToMonday(weekId);
  const prevMonday = new Date(monday);
  prevMonday.setDate(monday.getDate() - 7);
  return formatWeekId(prevMonday);
}

function getNextWeekId(weekId: string): string {
  const monday = weekIdToMonday(weekId);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  return formatWeekId(nextMonday);
}

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  high: "#EF4444",
  mid: "#F59E0B",
  low: "#9CA3AF",
};

const PRIORITY_LABELS: Record<Task["priority"], string> = {
  high: "높음",
  mid: "중간",
  low: "낮음",
};

// ─── 메인 페이지 ─────────────────────────────────────────

export default function WeeklyPage() {
  const params = useParams();
  const weekId = params.weekId as string;
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);

  useEffect(() => {
    const saved = getWeeklyPlan(weekId);
    setPlan(saved ?? buildDefaultPlan(weekId));
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
          ? {
              ...day,
              tasks: day.tasks.map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t
              ),
            }
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
        i === dayIndex
          ? { ...day, tasks: day.tasks.filter((t) => t.id !== taskId) }
          : day
      );
      persist({ ...plan, days });
    },
    [plan, persist]
  );

  const updateReflection = useCallback(
    (value: string) => {
      if (!plan) return;
      persist({ ...plan, weekReflection: value });
    },
    [plan, persist]
  );

  if (!plan) return null;

  const weekLabel = parseWeekLabel(weekId);
  const dateRange = formatDateRange(weekId);
  const prevWeekId = getPrevWeekId(weekId);
  const nextWeekId = getNextWeekId(weekId);

  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh", paddingBottom: 48 }}>
      <PageHeader
        title={`${weekLabel} · ${dateRange}`}
        subtitle="Weekly"
        prevHref={`/weekly/${prevWeekId}`}
        nextHref={`/weekly/${nextWeekId}`}
      />

      {/* 7일 카드 레이아웃 */}
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

      {/* 주간 회고 */}
      <div style={{ padding: "4px 16px 0" }}>
        <div
          style={{
            background: "var(--color-card)",
            borderRadius: 24,
            padding: "24px",
            border: "1px solid var(--color-border)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--color-ink)",
              margin: "0 0 12px 0",
            }}
          >
            주간 회고
          </h2>
          <textarea
            value={plan.weekReflection ?? ""}
            onChange={(e) => updateReflection(e.target.value)}
            placeholder="이번 주를 돌아보며 느낀 점, 배운 것, 다음 주에 개선할 것을 적어보세요."
            rows={4}
            style={{
              width: "100%",
              background: "var(--color-background)",
              border: "none",
              borderRadius: 12,
              padding: "14px 16px",
              fontSize: 14,
              fontWeight: 400,
              color: "var(--color-body)",
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.6,
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── DayCard 컴포넌트 ────────────────────────────────────

function DayCard({
  day,
  dayIndex,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: {
  day: DayPlan;
  dayIndex: number;
  onAddTask: (title: string, priority: Task["priority"]) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("mid");

  const handleAdd = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onAddTask(trimmed, newPriority);
    setNewTitle("");
    setNewPriority("mid");
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") {
      setIsAdding(false);
      setNewTitle("");
      setNewPriority("mid");
    }
  };

  return (
    <div
      style={{
        background: "var(--color-card)",
        borderRadius: 24,
        padding: "24px",
        marginBottom: 12,
        border: "1px solid var(--color-border)",
      }}
    >
      {/* 날짜 라벨 */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--color-ink)",
          marginBottom: 10,
          letterSpacing: "-0.3px",
        }}
      >
        {formatDayLabel(day.date, dayIndex)}
      </div>

      {/* 태스크 목록 */}
      {day.tasks.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {day.tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => onToggleTask(task.id)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </div>
      )}

      {/* 태스크 추가 인풋 */}
      {isAdding ? (
        <div>
          {/* 우선순위 선택 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-muted)" }}>우선순위</span>
            {(["high", "mid", "low"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setNewPriority(p)}
                title={PRIORITY_LABELS[p]}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9999,
                  background: PRIORITY_COLORS[p],
                  border: newPriority === p ? "2px solid var(--color-ink)" : "2px solid transparent",
                  cursor: "pointer",
                  padding: 0,
                  opacity: newPriority === p ? 1 : 0.45,
                  transition: "all 0.2s ease",
                }}
              />
            ))}
          </div>

          {/* 제목 입력 */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="할 일 입력..."
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: 400,
                padding: "10px 14px",
                borderRadius: 12,
                border: "none",
                background: "var(--color-background)",
                color: "var(--color-body)",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <button
              onClick={handleAdd}
              style={{
                fontSize: 14,
                fontWeight: 700,
                padding: "10px 16px",
                borderRadius: 9999,
                border: "none",
                background: "var(--color-primary)",
                color: "#ffffff",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              추가
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewTitle("");
                setNewPriority("mid");
              }}
              style={{
                fontSize: 14,
                fontWeight: 600,
                padding: "10px 14px",
                borderRadius: 9999,
                border: "none",
                background: "var(--color-background)",
                color: "var(--color-muted)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--color-muted)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "2px 0",
            transition: "all 0.2s ease",
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          <span>할 일 추가</span>
        </button>
      )}
    </div>
  );
}

// ─── TaskRow 컴포넌트 ────────────────────────────────────

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
        borderBottom: "1px solid var(--color-background)",
      }}
    >
      {/* 체크박스 */}
      <button
        onClick={onToggle}
        aria-label={task.done ? "완료 취소" : "완료 처리"}
        style={{
          flexShrink: 0,
          width: 20,
          height: 20,
          borderRadius: 6,
          border: task.done ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-muted-soft, #B0B8C1)",
          background: task.done ? "var(--color-primary)" : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          transition: "all 0.2s ease",
        }}
      >
        {task.done && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path
              d="M1 4.5L4 7.5L10 1.5"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* 우선순위 점 */}
      <span
        title={PRIORITY_LABELS[task.priority]}
        style={{
          flexShrink: 0,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: PRIORITY_COLORS[task.priority],
          opacity: task.done ? 0.4 : 1,
        }}
      />

      {/* 제목 */}
      <span
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: 400,
          color: task.done ? "var(--color-muted)" : "var(--color-body)",
          textDecoration: task.done ? "line-through" : "none",
          lineHeight: 1.4,
        }}
      >
        {task.title}
      </span>

      {/* 삭제 버튼 */}
      <button
        onClick={onDelete}
        aria-label="삭제"
        style={{
          flexShrink: 0,
          width: 20,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--color-muted-soft, #B0B8C1)",
          fontSize: 14,
          lineHeight: 1,
          padding: 0,
          opacity: 1,
          transition: "all 0.2s ease",
        }}
      >
        ×
      </button>
    </div>
  );
}
