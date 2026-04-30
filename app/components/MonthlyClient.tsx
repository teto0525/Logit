"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/app/components/PageHeader";
import { getMonthlyPlan, saveMonthlyPlan } from "@/lib/storage";
import { firstDayOfMonth, daysInMonth, uid } from "@/lib/dateUtils";
import type { MonthlyPlan, Appointment } from "@/lib/types";

// ─── 약속 타입별 색상 ─────────────────────────────────

const APPOINTMENT_TYPES: {
  key: Appointment["type"];
  label: string;
  color: string;
}[] = [
  { key: "meeting", label: "미팅", color: "#3B82F6" },
  { key: "deadline", label: "마감", color: "#EF4444" },
  { key: "personal", label: "개인", color: "#F59E0B" },
  { key: "health", label: "건강", color: "#10B981" },
];

function appointmentColor(type: Appointment["type"]): string {
  return APPOINTMENT_TYPES.find((t) => t.key === type)?.color ?? "var(--color-muted)";
}

// ─── 이전/다음 달 yearMonth 계산 ─────────────────────

function shiftMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const ny = d.getFullYear();
  const nm = String(d.getMonth() + 1).padStart(2, "0");
  return `${ny}-${nm}`;
}

// ─── 기본 MonthlyPlan 생성 ────────────────────────────

function createDefaultPlan(yearMonth: string): MonthlyPlan {
  return {
    id: uid(),
    yearMonth,
    appointments: [],
    weeklyGoals: [],
    letGoItems: [],
    linkedObjectiveIds: [],
    updatedAt: new Date().toISOString(),
  };
}

// ─── 메인 페이지 ──────────────────────────────────────

export default function MonthlyPage() {
  const params = useParams();
  const yearMonth = params.yearMonth as string; // "2026-04"

  const [plan, setPlan] = useState<MonthlyPlan | null>(null);
  const [showAddAppt, setShowAddAppt] = useState(false);

  useEffect(() => {
    const saved = getMonthlyPlan(yearMonth);
    setPlan(saved ?? createDefaultPlan(yearMonth));
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
  const prevHref = `/monthly/${shiftMonth(yearMonth, -1)}`;
  const nextHref = `/monthly/${shiftMonth(yearMonth, +1)}`;
  const title = `${year}년 ${month}월`;

  // ─── 핸들러 ─────────────────────────────────────────

  function addGoal() {
    save({ ...plan!, weeklyGoals: [...plan!.weeklyGoals, ""] });
  }

  function updateGoal(idx: number, value: string) {
    const goals = plan!.weeklyGoals.map((g, i) => (i === idx ? value : g));
    save({ ...plan!, weeklyGoals: goals });
  }

  function removeGoal(idx: number) {
    save({ ...plan!, weeklyGoals: plan!.weeklyGoals.filter((_, i) => i !== idx) });
  }

  function addLetGo() {
    save({ ...plan!, letGoItems: [...plan!.letGoItems, ""] });
  }

  function updateLetGo(idx: number, value: string) {
    const items = plan!.letGoItems.map((g, i) => (i === idx ? value : g));
    save({ ...plan!, letGoItems: items });
  }

  function removeLetGo(idx: number) {
    save({ ...plan!, letGoItems: plan!.letGoItems.filter((_, i) => i !== idx) });
  }

  function addAppointment(appt: Omit<Appointment, "id">) {
    save({
      ...plan!,
      appointments: [...plan!.appointments, { id: uid(), ...appt }],
    });
    setShowAddAppt(false);
  }

  function removeAppointment(id: string) {
    save({ ...plan!, appointments: plan!.appointments.filter((a) => a.id !== id) });
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeader
        title={title}
        subtitle="Monthly"
        prevHref={prevHref}
        nextHref={nextHref}
      />

      {/* ─── 달력 그리드 ─────────────────────────────── */}
      <CalendarGrid
        year={year}
        month={month}
        appointments={plan.appointments}
      />

      <div style={{ padding: "0 20px" }}>
        {/* ─── 이달의 목표 ───────────────────────────── */}
        <Section
          title="이달의 목표"
          onAdd={addGoal}
        >
          {plan.weeklyGoals.length === 0 && (
            <EmptyHint text="이번 달 이루고 싶은 목표를 적어보세요" />
          )}
          {plan.weeklyGoals.map((goal, idx) => (
            <EditableRow
              key={idx}
              value={goal}
              placeholder="목표를 입력하세요"
              onChange={(v) => updateGoal(idx, v)}
              onRemove={() => removeGoal(idx)}
              bulletColor="var(--color-primary)"
            />
          ))}
        </Section>

        {/* ─── 덜어낼 것 ────────────────────────────── */}
        <Section
          title="덜어낼 것"
          onAdd={addLetGo}
        >
          {plan.letGoItems.length === 0 && (
            <EmptyHint text="내려놓을 것, 줄여나갈 것을 적어보세요" />
          )}
          {plan.letGoItems.map((item, idx) => (
            <EditableRow
              key={idx}
              value={item}
              placeholder="덜어낼 것을 입력하세요"
              onChange={(v) => updateLetGo(idx, v)}
              onRemove={() => removeLetGo(idx)}
              bulletColor="var(--color-primary)"
            />
          ))}
        </Section>

        {/* ─── 약속/일정 ────────────────────────────── */}
        <Section
          title="약속 / 일정"
          onAdd={() => setShowAddAppt(true)}
        >
          {/* 타입 범례 */}
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            {APPOINTMENT_TYPES.map((t) => (
              <span
                key={t.key}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--color-muted)" }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: t.color,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {t.label}
              </span>
            ))}
          </div>

          {plan.appointments.length === 0 && !showAddAppt && (
            <EmptyHint text="이달의 약속과 일정을 추가하세요" />
          )}

          {/* 날짜 순 정렬 */}
          {[...plan.appointments]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((appt) => (
              <AppointmentRow
                key={appt.id}
                appt={appt}
                onRemove={() => removeAppointment(appt.id)}
              />
            ))}

          {/* 약속 추가 폼 */}
          {showAddAppt && (
            <AddAppointmentForm
              yearMonth={yearMonth}
              onAdd={addAppointment}
              onCancel={() => setShowAddAppt(false)}
            />
          )}
        </Section>
      </div>
    </div>
  );
}

// ─── 달력 그리드 ──────────────────────────────────────

function CalendarGrid({
  year,
  month,
  appointments,
}: {
  year: number;
  month: number;
  appointments: Appointment[];
}) {
  const totalDays = daysInMonth(year, month);
  const startDow = firstDayOfMonth(year, month); // 0=일 ~ 6=토
  const DOW_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

  // 날짜별 약속 맵
  const apptByDate: Record<string, Appointment[]> = {};
  for (const appt of appointments) {
    if (!apptByDate[appt.date]) apptByDate[appt.date] = [];
    apptByDate[appt.date].push(appt);
  }

  // 달력 셀 배열: null = 빈 칸, number = 날짜
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // 6주 그리드 채우기
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ padding: "8px 20px 20px" }}>
      {/* 달력 카드 래퍼 */}
      <div
        style={{
          background: "var(--color-card, #FFFFFF)",
          borderRadius: 20,
          padding: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* 요일 헤더 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            marginBottom: 6,
          }}
        >
          {DOW_LABELS.map((dow, i) => (
            <div
              key={dow}
              style={{
                textAlign: "center",
                fontSize: 12,
                fontWeight: 700,
                color:
                  i === 0
                    ? "#EF4444"
                    : i === 6
                    ? "#3B82F6"
                    : "var(--color-muted)",
                padding: "2px 0",
              }}
            >
              {dow}
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
          }}
        >
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} />;
            }

            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayAppts = apptByDate[dateStr] ?? [];
            const dow = (startDow + day - 1) % 7;
            const isSun = dow === 0;
            const isSat = dow === 6;

            return (
              <div
                key={day}
                style={{
                  background: "var(--color-background, #F2F4F6)",
                  borderRadius: 12,
                  padding: "6px 4px 5px",
                  minHeight: 46,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    lineHeight: 1,
                    color: isSun
                      ? "#EF4444"
                      : isSat
                      ? "#3B82F6"
                      : "var(--color-foreground)",
                  }}
                >
                  {day}
                </span>

                {/* 약속 도트 (최대 3개) */}
                {dayAppts.length > 0 && (
                  <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                    {dayAppts.slice(0, 3).map((appt) => (
                      <span
                        key={appt.id}
                        title={appt.title}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: appointmentColor(appt.type),
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                    ))}
                    {dayAppts.length > 3 && (
                      <span style={{ fontSize: 9, color: "var(--color-muted)", lineHeight: "6px" }}>
                        +{dayAppts.length - 3}
                      </span>
                    )}
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

// ─── Section 래퍼 ─────────────────────────────────────

function Section({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--color-card, #FFFFFF)",
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            margin: 0,
            color: "var(--color-ink, var(--color-foreground))",
          }}
        >
          {title}
        </h2>
        <button
          onClick={onAdd}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            border: "none",
            background: "var(--color-primary, #3B82F6)",
            color: "#fff",
            fontSize: 20,
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          +
        </button>
      </div>
      {children}
    </div>
  );
}

// ─── 편집 가능한 목록 행 ──────────────────────────────

function EditableRow({
  value,
  placeholder,
  onChange,
  onRemove,
  bulletColor,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  bulletColor: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: bulletColor,
          flexShrink: 0,
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: 400,
          padding: "10px 14px",
          background: "var(--color-background, #F2F4F6)",
          border: "none",
          borderRadius: 12,
          color: "var(--color-foreground)",
          outline: "none",
        }}
      />
      <button
        onClick={onRemove}
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          color: "var(--color-muted)",
          fontSize: 18,
          lineHeight: 1,
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ×
      </button>
    </div>
  );
}

// ─── 약속 행 ─────────────────────────────────────────

function AppointmentRow({
  appt,
  onRemove,
}: {
  appt: Appointment;
  onRemove: () => void;
}) {
  const [, , dayStr] = appt.date.split("-");
  const d = new Date(appt.date + "T00:00:00");
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const color = appointmentColor(appt.type);
  const typeLabel = APPOINTMENT_TYPES.find((t) => t.key === appt.type)?.label ?? appt.type;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid var(--color-background, #F2F4F6)",
      }}
    >
      {/* 날짜 */}
      <div
        style={{
          minWidth: 44,
          textAlign: "center",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--color-foreground)",
          lineHeight: 1.2,
        }}
      >
        <div>{Number(dayStr)}일</div>
        <div style={{ fontSize: 10, color: "var(--color-muted)", fontWeight: 400 }}>{dow}</div>
      </div>

      {/* 색상 도트 */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />

      {/* 제목 + 타입 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: "var(--color-foreground)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {appt.title}
        </div>
        <div style={{ fontSize: 11, color, marginTop: 2, fontWeight: 500 }}>{typeLabel}</div>
      </div>

      {/* 삭제 */}
      <button
        onClick={onRemove}
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          color: "var(--color-muted)",
          fontSize: 18,
          lineHeight: 1,
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ×
      </button>
    </div>
  );
}

// ─── 약속 추가 폼 ─────────────────────────────────────

function AddAppointmentForm({
  yearMonth,
  onAdd,
  onCancel,
}: {
  yearMonth: string;
  onAdd: (appt: Omit<Appointment, "id">) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(yearMonth + "-01");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Appointment["type"]>("personal");

  function handleSubmit() {
    if (!title.trim()) return;
    onAdd({ date, title: title.trim(), type });
  }

  return (
    <div
      style={{
        background: "var(--color-background, #F2F4F6)",
        borderRadius: 16,
        padding: 20,
        marginTop: 12,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* 날짜 */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: 6 }}>
          날짜
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            fontSize: 14,
            fontWeight: 400,
            padding: "10px 14px",
            background: "var(--color-card, #FFFFFF)",
            border: "none",
            borderRadius: 12,
            color: "var(--color-foreground)",
            width: "100%",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* 제목 */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: 6 }}>
          제목
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="약속 또는 일정명"
          style={{
            fontSize: 14,
            fontWeight: 400,
            padding: "10px 14px",
            background: "var(--color-card, #FFFFFF)",
            border: "none",
            borderRadius: 12,
            color: "var(--color-foreground)",
            width: "100%",
            outline: "none",
            boxSizing: "border-box",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") onCancel();
          }}
          autoFocus
        />
      </div>

      {/* 유형 */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: 8 }}>
          유형
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {APPOINTMENT_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 9999,
                border: type === t.key ? `1.5px solid ${t.color}` : "1.5px solid transparent",
                background: type === t.key ? t.color + "20" : "var(--color-background, #F2F4F6)",
                color: type === t.key ? t.color : "var(--color-muted)",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 버튼 */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          style={{
            fontSize: 15,
            fontWeight: 600,
            padding: "10px 20px",
            borderRadius: 12,
            border: "none",
            background: "var(--color-background, #F2F4F6)",
            color: "var(--color-muted)",
            cursor: "pointer",
          }}
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          style={{
            fontSize: 15,
            fontWeight: 700,
            padding: "10px 20px",
            borderRadius: 12,
            border: "none",
            background: "var(--color-primary, #3B82F6)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          추가
        </button>
      </div>
    </div>
  );
}

// ─── 빈 상태 힌트 ─────────────────────────────────────

function EmptyHint({ text }: { text: string }) {
  return (
    <p
      style={{
        fontSize: 14,
        fontWeight: 400,
        color: "var(--color-muted-soft, var(--color-muted))",
        textAlign: "center",
        padding: "12px 0 6px",
        margin: 0,
        fontStyle: "normal",
      }}
    >
      {text}
    </p>
  );
}
