"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/app/components/PageHeader";
import { getYearlyPlan, saveYearlyPlan, getAllObjectives } from "@/lib/storage";
import { currentHalfId, uid } from "@/lib/dateUtils";
import type { YearlyPlan, Project, Objective } from "@/lib/types";

const MONTH_LABELS_H1 = ["1월", "2월", "3월", "4월", "5월", "6월"];
const MONTH_LABELS_H2 = ["7월", "8월", "9월", "10월", "11월", "12월"];

function createDefault(periodId: string): YearlyPlan {
  return {
    id: uid(),
    periodId,
    projects: [],
    updatedAt: new Date().toISOString(),
  };
}

export default function YearlyPage() {
  const periodId = currentHalfId();
  const isH1 = periodId.endsWith("H1");
  const monthLabels = isH1 ? MONTH_LABELS_H1 : MONTH_LABELS_H2;

  const [plan, setPlan] = useState<YearlyPlan | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStart, setNewStart] = useState(1);
  const [newEnd, setNewEnd] = useState(3);

  useEffect(() => {
    const saved = getYearlyPlan(periodId);
    setPlan(saved ?? createDefault(periodId));
    setObjectives(getAllObjectives());
  }, [periodId]);

  const save = useCallback(
    (updated: YearlyPlan) => {
      const d = { ...updated, updatedAt: new Date().toISOString() };
      setPlan(d);
      saveYearlyPlan(d);
    },
    []
  );

  const addProject = useCallback(() => {
    if (!plan || !newTitle.trim()) return;
    const colors = ["#3B82F6", "#F59E0B", "#10B981", "#8B5CF6", "#FB923C", "#EF4444"];
    const project: Project = {
      id: uid(),
      title: newTitle.trim(),
      color: colors[plan.projects.length % colors.length],
      startMonth: newStart,
      endMonth: newEnd,
    };
    save({ ...plan, projects: [...plan.projects, project] });
    setNewTitle("");
    setAdding(false);
  }, [plan, save, newTitle, newStart, newEnd]);

  const removeProject = useCallback(
    (id: string) => {
      if (!plan) return;
      save({ ...plan, projects: plan.projects.filter((p) => p.id !== id) });
    },
    [plan, save]
  );

  const updateProjectRange = useCallback(
    (id: string, startMonth: number, endMonth: number) => {
      if (!plan) return;
      const projects = plan.projects.map((p) =>
        p.id === id ? { ...p, startMonth, endMonth } : p
      );
      save({ ...plan, projects });
    },
    [plan, save]
  );

  if (!plan) return null;

  const year = periodId.split("-")[0];
  const halfLabel = isH1 ? "상반기" : "하반기";

  return (
    <div style={{ paddingBottom: 40, background: "var(--color-background)", minHeight: "100%" }}>
      <PageHeader title={`${year} ${halfLabel}`} subtitle="Yearly Plan" />

      {/* Gantt 차트 */}
      <div
        style={{
          background: "var(--color-card)",
          borderRadius: 24,
          padding: 24,
          border: "1px solid var(--color-border)",
          margin: "0 20px 16px",
          overflowX: "auto",
        }}
      >
        {/* 월 헤더 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "100px repeat(6, 1fr)",
            gap: 1,
            marginBottom: 8,
          }}
        >
          <div />
          {monthLabels.map((m) => (
            <div
              key={m}
              style={{
                textAlign: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--color-muted)",
                padding: "4px 0",
              }}
            >
              {m}
            </div>
          ))}
        </div>

        {/* 프로젝트 행 */}
        {plan.projects.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 0",
              color: "var(--color-muted)",
              fontSize: 14,
              fontWeight: 400,
            }}
          >
            프로젝트를 추가해보세요
          </div>
        ) : (
          plan.projects.map((project) => (
            <div
              key={project.id}
              style={{
                display: "grid",
                gridTemplateColumns: "100px repeat(6, 1fr)",
                gap: 1,
                marginBottom: 4,
                alignItems: "center",
              }}
            >
              {/* 프로젝트명 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  paddingRight: 8,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: project.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {project.title}
                </span>
                <button
                  onClick={() => removeProject(project.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--color-muted)",
                    fontSize: 14,
                    cursor: "pointer",
                    padding: 0,
                    marginLeft: "auto",
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>

              {/* 6개 월 셀 */}
              {monthLabels.map((_, monthIdx) => {
                const m = monthIdx + 1;
                const inRange = m >= project.startMonth && m <= project.endMonth;
                const isStart = m === project.startMonth;
                const isEnd = m === project.endMonth;
                return (
                  <div
                    key={m}
                    onClick={() => {
                      // 간단 토글: 범위 안이면 제거, 밖이면 확장
                      if (inRange && project.startMonth !== project.endMonth) {
                        if (m === project.startMonth)
                          updateProjectRange(project.id, m + 1, project.endMonth);
                        else if (m === project.endMonth)
                          updateProjectRange(project.id, project.startMonth, m - 1);
                      } else if (!inRange) {
                        const newStart = Math.min(project.startMonth, m);
                        const newEnd = Math.max(project.endMonth, m);
                        updateProjectRange(project.id, newStart, newEnd);
                      }
                    }}
                    style={{
                      height: 32,
                      background: inRange ? `${project.color}15` : "var(--color-background)",
                      borderTop: inRange ? `3px solid ${project.color}` : "3px solid transparent",
                      borderRadius: `${isStart ? 8 : 0}px ${isEnd ? 8 : 0}px ${isEnd ? 8 : 0}px ${isStart ? 8 : 0}px`,
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                  />
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* 프로젝트 추가 */}
      <div style={{ padding: "0 20px" }}>
        {adding ? (
          <div
            style={{
              background: "var(--color-card)",
              borderRadius: 24,
              padding: 24,
              border: "1px solid var(--color-border)",
            }}
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="프로젝트 이름"
              style={{
                background: "var(--color-background)",
                border: "none",
                borderRadius: 14,
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: 400,
                marginBottom: 10,
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)" }}>시작</label>
              <select
                value={newStart}
                onChange={(e) => setNewStart(Number(e.target.value))}
                style={{
                  background: "var(--color-background)",
                  border: "none",
                  borderRadius: 14,
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 400,
                }}
              >
                {monthLabels.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)" }}>종료</label>
              <select
                value={newEnd}
                onChange={(e) => setNewEnd(Number(e.target.value))}
                style={{
                  background: "var(--color-background)",
                  border: "none",
                  borderRadius: 14,
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 400,
                }}
              >
                {monthLabels.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={addProject}
                style={{
                  background: "var(--color-primary)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 9999,
                  padding: "10px 20px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                추가
              </button>
              <button
                onClick={() => setAdding(false)}
                style={{
                  background: "var(--color-background)",
                  border: "none",
                  borderRadius: 9999,
                  padding: "10px 20px",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--color-muted)",
                  cursor: "pointer",
                }}
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{
              width: "100%",
              padding: "16px 0",
              background: "transparent",
              border: "2px dashed var(--color-border)",
              borderRadius: 9999,
              fontSize: 15,
              fontWeight: 600,
              color: "var(--color-muted)",
              cursor: "pointer",
            }}
          >
            + 프로젝트 추가
          </button>
        )}
      </div>

      {/* 연결된 목표 참고 */}
      {objectives.length > 0 && (
        <div
          style={{
            background: "var(--color-card)",
            borderRadius: 24,
            padding: 24,
            border: "1px solid var(--color-border)",
            margin: "16px 20px 0",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-muted)", marginBottom: 8, margin: "0 0 8px 0" }}>
            설정된 반기 목표
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {objectives.map((obj) => (
              <span
                key={obj.id}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "5px 14px",
                  borderRadius: 9999,
                  background: `${obj.color}12`,
                  color: obj.color,
                  border: `1px solid ${obj.color}25`,
                }}
              >
                {obj.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
