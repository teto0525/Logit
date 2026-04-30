"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getValueObjective, saveValueObjective,
  getYearlyPlan, saveYearlyPlan,
  getAllObjectives,
} from "@/lib/storage";
import { getAuth, deleteAccount } from "@/lib/auth";
import { VALUE_CATEGORIES, OBJECTIVE_COLORS } from "@/lib/constants";
import { currentHalfId, uid } from "@/lib/dateUtils";
import type { ValueObjective, ValueRating, Objective, ValueCategory, YearlyPlan, Project } from "@/lib/types";
import type { AuthState } from "@/lib/auth";

// ─── Helpers ──────────────────────────────────────────────

const MONTH_LABELS_H1 = ["1월", "2월", "3월", "4월", "5월", "6월"];
const MONTH_LABELS_H2 = ["7월", "8월", "9월", "10월", "11월", "12월"];

function createDefaultValue(periodId: string): ValueObjective {
  return {
    id: uid(), periodId,
    valueRatings: VALUE_CATEGORIES.map((v) => ({ category: v.key, score: 3 })),
    objectives: [], updatedAt: new Date().toISOString(),
  };
}

function createDefaultYearly(periodId: string): YearlyPlan {
  return { id: uid(), periodId, projects: [], updatedAt: new Date().toISOString() };
}

// ─── Main Component ──────────────────────────────────────

export default function MyPage() {
  const periodId = currentHalfId();
  const isH1 = periodId.endsWith("H1");
  const monthLabels = isH1 ? MONTH_LABELS_H1 : MONTH_LABELS_H2;
  const year = periodId.split("-")[0];
  const halfLabel = isH1 ? "상반기" : "하반기";

  const router = useRouter();
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [valueData, setValueData] = useState<ValueObjective | null>(null);
  const [yearlyPlan, setYearlyPlan] = useState<YearlyPlan | null>(null);
  const [showValues, setShowValues] = useState(false);
  const [showGantt, setShowGantt] = useState(false);
  const [newObjTitle, setNewObjTitle] = useState("");
  const [addingProject, setAddingProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newStart, setNewStart] = useState(1);
  const [newEnd, setNewEnd] = useState(3);

  useEffect(() => {
    setAuth(getAuth());
    const savedValue = getValueObjective(periodId);
    setValueData(savedValue ?? createDefaultValue(periodId));
    const savedYearly = getYearlyPlan(periodId);
    setYearlyPlan(savedYearly ?? createDefaultYearly(periodId));
  }, [periodId]);

  const handleDeleteAccount = () => {
    if (confirm("정말 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 되돌릴 수 없습니다.")) {
      deleteAccount();
      router.replace("/auth");
    }
  };

  const saveValue = useCallback((updated: ValueObjective) => {
    const d = { ...updated, updatedAt: new Date().toISOString() };
    setValueData(d);
    saveValueObjective(d);
  }, []);

  const saveYearly = useCallback((updated: YearlyPlan) => {
    const d = { ...updated, updatedAt: new Date().toISOString() };
    setYearlyPlan(d);
    saveYearlyPlan(d);
  }, []);

  if (!valueData || !yearlyPlan) return null;

  // ─── Value handlers ─────────────────────────────────────

  const updateScore = (category: ValueCategory, score: number) => {
    const ratings = valueData.valueRatings.map((r) =>
      r.category === category ? { ...r, score } : r
    );
    saveValue({ ...valueData, valueRatings: ratings });
  };

  const addObjective = () => {
    if (!newObjTitle.trim()) return;
    const obj: Objective = {
      id: uid(), title: newObjTitle.trim(), linkedValues: [],
      color: OBJECTIVE_COLORS[valueData.objectives.length % OBJECTIVE_COLORS.length],
    };
    saveValue({ ...valueData, objectives: [...valueData.objectives, obj] });
    setNewObjTitle("");
  };

  const removeObjective = (id: string) => {
    saveValue({ ...valueData, objectives: valueData.objectives.filter((o) => o.id !== id) });
  };

  const toggleValueLink = (objId: string, valKey: ValueCategory) => {
    const objectives = valueData.objectives.map((o) => {
      if (o.id !== objId) return o;
      const linked = o.linkedValues.includes(valKey)
        ? o.linkedValues.filter((v) => v !== valKey)
        : [...o.linkedValues, valKey];
      return { ...o, linkedValues: linked };
    });
    saveValue({ ...valueData, objectives });
  };

  // ─── Yearly handlers ───────────────────────────────────

  const addProject = () => {
    if (!newProjectTitle.trim()) return;
    const project: Project = {
      id: uid(), title: newProjectTitle.trim(),
      color: OBJECTIVE_COLORS[yearlyPlan.projects.length % OBJECTIVE_COLORS.length],
      startMonth: newStart, endMonth: newEnd,
    };
    saveYearly({ ...yearlyPlan, projects: [...yearlyPlan.projects, project] });
    setNewProjectTitle("");
    setAddingProject(false);
  };

  const removeProject = (id: string) => {
    saveYearly({ ...yearlyPlan, projects: yearlyPlan.projects.filter((p) => p.id !== id) });
  };

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Header */}
      <header style={{ padding: "20px 20px 16px", background: "var(--color-card)" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600, margin: 0, color: "var(--color-ink)" }}>마이</h1>
        <p style={{ fontSize: 14, color: "var(--color-muted)", margin: "4px 0 0" }}>{year} {halfLabel}</p>
      </header>

      <div style={{ padding: "0 20px", marginTop: 16 }}>
        {/* ─── 내 정보 & 탈퇴 ─────────────────────────── */}
        {auth && (
          <div style={{
            background: "var(--color-card)", borderRadius: 20, padding: 20,
            boxShadow: "0 2px 12px rgba(28,25,23,0.06)", marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              {/* 프로필 아바타 */}
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "var(--color-primary)", color: "var(--color-on-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 700, flexShrink: 0,
              }}>
                {(auth.displayName ?? "U").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-ink)" }}>
                  {auth.displayName ?? "사용자"}
                </div>
                <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 2 }}>
                  {auth.provider === "kakao" ? "카카오" : auth.provider === "naver" ? "네이버" : "Google"} 로그인
                  {auth.createdAt && ` · ${auth.createdAt.slice(0, 10)} 가입`}
                </div>
              </div>
            </div>

            {/* 탈퇴 */}
            <button
              onClick={handleDeleteAccount}
              style={{
                width: "100%", padding: "12px 0",
                background: "transparent", border: "1px solid var(--color-border)",
                borderRadius: 12, fontSize: 14, fontWeight: 500,
                color: "var(--color-error)", cursor: "pointer",
              }}
            >
              탈퇴하기
            </button>
          </div>
        )}

        {/* ─── Radar Chart Card ─────────────────────────── */}
        <div style={{
          background: "var(--color-card)", borderRadius: 20, padding: 20,
          boxShadow: "0 2px 12px rgba(28,25,23,0.06)", marginBottom: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--color-ink)" }}>나의 가치</h2>
            <button
              onClick={() => setShowValues(!showValues)}
              style={{
                fontSize: 13, fontWeight: 600, color: "var(--color-primary)",
                background: "transparent", border: "none", cursor: "pointer",
              }}
            >
              {showValues ? "접기" : "점수 수정"}
            </button>
          </div>

          {/* Radar */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <RadarChart ratings={valueData.valueRatings} />
          </div>

          {/* Value sliders (collapsible) */}
          {showValues && (
            <div style={{ marginTop: 16 }}>
              {valueData.valueRatings.map((rating) => {
                const info = VALUE_CATEGORIES.find((v) => v.key === rating.category)!;
                return (
                  <div key={rating.category} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, width: 76, flexShrink: 0, color: "var(--color-body)" }}>{info.label}</span>
                    <input
                      type="range" min={1} max={5} value={rating.score}
                      onChange={(e) => updateScore(rating.category, Number(e.target.value))}
                      style={{ flex: 1, accentColor: "var(--color-primary)" }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 700, width: 20, textAlign: "center", color: "var(--color-primary)" }}>{rating.score}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Objectives ──────────────────────────────── */}
        <div style={{
          background: "var(--color-card)", borderRadius: 20, padding: 20,
          boxShadow: "0 2px 12px rgba(28,25,23,0.06)", marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 16px", color: "var(--color-ink)" }}>반기 목표</h2>

          {valueData.objectives.map((obj) => (
            <div key={obj.id} style={{
              background: "var(--color-background)", borderRadius: 16, padding: 16,
              marginBottom: 12, borderLeft: `4px solid ${obj.color}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--color-ink)" }}>{obj.title}</span>
                <button onClick={() => removeObjective(obj.id)} style={{
                  background: "transparent", border: "none", color: "var(--color-muted)", fontSize: 18, cursor: "pointer", padding: "0 4px",
                }}>×</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {VALUE_CATEGORIES.map((v) => {
                  const linked = obj.linkedValues.includes(v.key);
                  return (
                    <button key={v.key} onClick={() => toggleValueLink(obj.id, v.key)} style={{
                      fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 9999,
                      border: linked ? `1.5px solid ${obj.color}` : "1.5px solid transparent",
                      background: linked ? `${obj.color}15` : "var(--color-background)",
                      color: linked ? obj.color : "var(--color-muted)", cursor: "pointer",
                    }}>{v.label}</button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Add objective */}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <input type="text" value={newObjTitle} onChange={(e) => setNewObjTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addObjective()}
              placeholder="새 목표 추가..."
              style={{
                flex: 1, background: "var(--color-background)", border: "none", borderRadius: 12,
                padding: "12px 16px", fontSize: 14, outline: "none", color: "var(--color-ink)",
              }} />
            <button onClick={addObjective} style={{
              background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 12,
              padding: "0 20px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>추가</button>
          </div>
        </div>

        {/* ─── Gantt Mini ──────────────────────────────── */}
        <div style={{
          background: "var(--color-card)", borderRadius: 20, padding: 20,
          boxShadow: "0 2px 12px rgba(28,25,23,0.06)", marginBottom: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--color-ink)" }}>반기 프로젝트</h2>
            <button onClick={() => setShowGantt(!showGantt)} style={{
              fontSize: 13, fontWeight: 600, color: "var(--color-primary)",
              background: "transparent", border: "none", cursor: "pointer",
            }}>{showGantt ? "접기" : "전체 보기"}</button>
          </div>

          {/* Mini gantt - always show */}
          {yearlyPlan.projects.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--color-muted)", textAlign: "center", padding: "24px 0" }}>
              프로젝트를 추가해보세요
            </p>
          ) : (
            yearlyPlan.projects.map((project) => (
              <div key={project.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: project.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)", flex: 1 }}>{project.title}</span>
                  <button onClick={() => removeProject(project.id)} style={{
                    background: "transparent", border: "none", color: "var(--color-muted)", fontSize: 14, cursor: "pointer", padding: 0,
                  }}>×</button>
                </div>
                {/* Mini bar */}
                <div style={{ display: "flex", gap: 2 }}>
                  {monthLabels.map((_, i) => {
                    const m = i + 1;
                    const inRange = m >= project.startMonth && m <= project.endMonth;
                    const isStart = m === project.startMonth;
                    const isEnd = m === project.endMonth;
                    return (
                      <div key={m} style={{
                        flex: 1, height: 8,
                        background: inRange ? `${project.color}30` : "var(--color-background)",
                        borderTop: inRange ? `3px solid ${project.color}` : "3px solid transparent",
                        borderRadius: `${isStart ? 4 : 0}px ${isEnd ? 4 : 0}px ${isEnd ? 4 : 0}px ${isStart ? 4 : 0}px`,
                      }} />
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Full gantt with month headers (collapsible) */}
          {showGantt && yearlyPlan.projects.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
                {monthLabels.map((m) => (
                  <div key={m} style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--color-muted)" }}>{m}</div>
                ))}
              </div>
            </div>
          )}

          {/* Add project */}
          {addingProject ? (
            <div style={{ background: "var(--color-background)", borderRadius: 16, padding: 16, marginTop: 12 }}>
              <input type="text" value={newProjectTitle} onChange={(e) => setNewProjectTitle(e.target.value)}
                placeholder="프로젝트 이름"
                style={{
                  background: "var(--color-card)", border: "none", borderRadius: 12, padding: "10px 14px",
                  fontSize: 14, marginBottom: 10, width: "100%", boxSizing: "border-box", outline: "none",
                }} />
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)" }}>시작</label>
                <select value={newStart} onChange={(e) => setNewStart(Number(e.target.value))}
                  style={{ background: "var(--color-card)", border: "none", borderRadius: 12, padding: "8px 12px", fontSize: 13 }}>
                  {monthLabels.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)" }}>종료</label>
                <select value={newEnd} onChange={(e) => setNewEnd(Number(e.target.value))}
                  style={{ background: "var(--color-card)", border: "none", borderRadius: 12, padding: "8px 12px", fontSize: 13 }}>
                  {monthLabels.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addProject} style={{
                  background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 12,
                  padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>추가</button>
                <button onClick={() => setAddingProject(false)} style={{
                  background: "var(--color-background)", border: "none", borderRadius: 12,
                  padding: "10px 20px", fontSize: 14, fontWeight: 600, color: "var(--color-muted)", cursor: "pointer",
                }}>취소</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingProject(true)} style={{
              width: "100%", padding: 14, borderRadius: 14, border: "2px dashed var(--color-border)",
              background: "transparent", color: "var(--color-muted)", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8,
            }}>+ 프로젝트 추가</button>
          )}
        </div>

        {/* ─── Settings ────────────────────────────────── */}
        <div style={{
          background: "var(--color-card)", borderRadius: 20, padding: 20,
          boxShadow: "0 2px 12px rgba(28,25,23,0.06)", marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 16px", color: "var(--color-ink)" }}>설정</h2>

          <SettingRow label="데이터 내보내기 (JSON)" onClick={() => {
            const data = localStorage.getItem("bullet_journal_v1");
            if (!data) return;
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `bullet-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }} />
          <SettingRow label="데이터 가져오기 (JSON)" onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  JSON.parse(reader.result as string);
                  localStorage.setItem("bullet_journal_v1", reader.result as string);
                  window.location.reload();
                } catch {
                  alert("올바른 JSON 파일이 아닙니다.");
                }
              };
              reader.readAsText(file);
            };
            input.click();
          }} />
          <SettingRow label="데이터 초기화" danger onClick={() => {
            if (confirm("정말 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
              localStorage.removeItem("bullet_journal_v1");
              window.location.reload();
            }
          }} />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function SettingRow({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 0", background: "transparent", border: "none", borderBottom: "1px solid var(--color-background)",
      cursor: "pointer", textAlign: "left",
    }}>
      <span style={{ fontSize: 15, fontWeight: 500, color: danger ? "var(--color-error)" : "var(--color-body)" }}>{label}</span>
      <span style={{ fontSize: 16, color: "var(--color-muted)" }}>›</span>
    </button>
  );
}

function RadarChart({ ratings }: { ratings: ValueRating[] }) {
  const cx = 130;
  const cy = 130;
  const maxR = 100;
  const n = ratings.length;

  function point(i: number, r: number): [number, number] {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  const rings = [1, 2, 3, 4, 5];
  const dataPoints = ratings.map((r, i) => point(i, (r.score / 5) * maxR));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + "Z";

  return (
    <svg width={260} height={260} viewBox="0 0 260 260">
      {rings.map((r) => {
        const pts = Array.from({ length: n }, (_, i) => point(i, (r / 5) * maxR));
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + "Z";
        return <path key={r} d={path} fill="none" stroke="var(--color-border)" strokeWidth={0.8} />;
      })}
      {ratings.map((r, i) => {
        const [ex, ey] = point(i, maxR);
        const [lx, ly] = point(i, maxR + 18);
        const info = VALUE_CATEGORIES.find((v) => v.key === r.category)!;
        return (
          <g key={r.category}>
            <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="var(--color-border)" strokeWidth={0.5} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="var(--color-muted)">{info.label}</text>
          </g>
        );
      })}
      <path d={dataPath} fill="var(--color-primary)" fillOpacity={0.15} stroke="var(--color-primary)" strokeWidth={2} />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={4} fill="var(--color-primary)" />
      ))}
    </svg>
  );
}
