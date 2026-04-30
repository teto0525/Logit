"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/app/components/PageHeader";
import { getValueObjective, saveValueObjective } from "@/lib/storage";
import { VALUE_CATEGORIES, OBJECTIVE_COLORS } from "@/lib/constants";
import { currentHalfId, uid } from "@/lib/dateUtils";
import type { ValueObjective, ValueRating, Objective, ValueCategory } from "@/lib/types";

function createDefault(periodId: string): ValueObjective {
  return {
    id: uid(),
    periodId,
    valueRatings: VALUE_CATEGORIES.map((v) => ({ category: v.key, score: 3 })),
    objectives: [],
    updatedAt: new Date().toISOString(),
  };
}

export default function ValuePage() {
  const periodId = currentHalfId();
  const [data, setData] = useState<ValueObjective | null>(null);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    const saved = getValueObjective(periodId);
    setData(saved ?? createDefault(periodId));
  }, [periodId]);

  const save = useCallback(
    (updated: ValueObjective) => {
      const d = { ...updated, updatedAt: new Date().toISOString() };
      setData(d);
      saveValueObjective(d);
    },
    []
  );

  const updateScore = useCallback(
    (category: ValueCategory, score: number) => {
      if (!data) return;
      const ratings = data.valueRatings.map((r) =>
        r.category === category ? { ...r, score } : r
      );
      save({ ...data, valueRatings: ratings });
    },
    [data, save]
  );

  const addObjective = useCallback(() => {
    if (!data || !newTitle.trim()) return;
    const obj: Objective = {
      id: uid(),
      title: newTitle.trim(),
      linkedValues: [],
      color: OBJECTIVE_COLORS[data.objectives.length % OBJECTIVE_COLORS.length],
    };
    save({ ...data, objectives: [...data.objectives, obj] });
    setNewTitle("");
  }, [data, save, newTitle]);

  const removeObjective = useCallback(
    (id: string) => {
      if (!data) return;
      save({ ...data, objectives: data.objectives.filter((o) => o.id !== id) });
    },
    [data, save]
  );

  const toggleValueLink = useCallback(
    (objId: string, valKey: ValueCategory) => {
      if (!data) return;
      const objectives = data.objectives.map((o) => {
        if (o.id !== objId) return o;
        const linked = o.linkedValues.includes(valKey)
          ? o.linkedValues.filter((v) => v !== valKey)
          : [...o.linkedValues, valKey];
        return { ...o, linkedValues: linked };
      });
      save({ ...data, objectives });
    },
    [data, save]
  );

  if (!data) return null;

  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh", paddingBottom: 40 }}>
      <PageHeader
        title="가치 · 목표"
        subtitle={periodId.replace("-", " ")}
      />

      {/* 레이더 차트 */}
      <div
        style={{
          background: "var(--color-card)",
          borderRadius: 24,
          boxShadow: "var(--shadow-card)",
          margin: "0 20px 16px",
          padding: 20,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <RadarChart ratings={data.valueRatings} />
      </div>

      {/* 나의 가치 슬라이더 */}
      <div
        style={{
          background: "var(--color-card)",
          borderRadius: 24,
          boxShadow: "var(--shadow-card)",
          margin: "0 20px 16px",
          padding: 20,
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.3px",
            marginBottom: 16,
          }}
        >
          나의 가치
        </h3>
        {data.valueRatings.map((rating) => {
          const info = VALUE_CATEGORIES.find((v) => v.key === rating.category)!;
          return (
            <div
              key={rating.category}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  width: 80,
                  flexShrink: 0,
                  color: "var(--color-foreground)",
                }}
              >
                {info.label}
              </span>
              <input
                type="range"
                min={1}
                max={5}
                value={rating.score}
                onChange={(e) => updateScore(rating.category, Number(e.target.value))}
                style={{ flex: 1, accentColor: "var(--color-primary)" }}
              />
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  width: 20,
                  textAlign: "center",
                  color: "var(--color-primary)",
                }}
              >
                {rating.score}
              </span>
            </div>
          );
        })}
      </div>

      {/* 반기 목표 */}
      <div
        style={{
          background: "var(--color-card)",
          borderRadius: 24,
          boxShadow: "var(--shadow-card)",
          margin: "0 20px 16px",
          padding: 20,
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.3px",
            marginBottom: 16,
          }}
        >
          반기 목표
        </h3>

        {data.objectives.map((obj) => (
          <div
            key={obj.id}
            style={{
              background: "var(--color-background)",
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderLeft: `4px solid ${obj.color}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{obj.title}</span>
              <button
                onClick={() => removeObjective(obj.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-muted)",
                  fontSize: 18,
                  cursor: "pointer",
                  padding: "0 4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            {/* 가치 연결 태그 */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {VALUE_CATEGORIES.map((v) => {
                const linked = obj.linkedValues.includes(v.key);
                return (
                  <button
                    key={v.key}
                    onClick={() => toggleValueLink(obj.id, v.key)}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 9999,
                      border: linked
                        ? `1.5px solid ${obj.color}`
                        : "1.5px solid transparent",
                      background: linked
                        ? `${obj.color}15`
                        : "var(--color-background)",
                      color: linked ? obj.color : "var(--color-muted)",
                      cursor: "pointer",
                    }}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* 목표 추가 */}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addObjective()}
            placeholder="새 목표 추가..."
            style={{
              flex: 1,
              background: "var(--color-background)",
              border: "none",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 15,
              fontWeight: 400,
              outline: "none",
            }}
          />
          <button
            onClick={addObjective}
            style={{
              background: "var(--color-primary)",
              color: "#ffffff",
              border: "none",
              borderRadius: 9999,
              padding: "0 20px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 레이더 차트 (순수 SVG) ─────────────────────────────

function RadarChart({ ratings }: { ratings: ValueRating[] }) {
  const cx = 135;
  const cy = 135;
  const maxR = 105;
  const n = ratings.length;

  function point(i: number, r: number): [number, number] {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  // 배경 동심원
  const rings = [1, 2, 3, 4, 5];

  // 데이터 다각형
  const dataPoints = ratings.map((r, i) => point(i, (r.score / 5) * maxR));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + "Z";

  return (
    <svg width={270} height={270} viewBox="0 0 270 270">
      {/* 배경 링 */}
      {rings.map((r) => {
        const pts = Array.from({ length: n }, (_, i) => point(i, (r / 5) * maxR));
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + "Z";
        return <path key={r} d={path} fill="none" stroke="var(--color-border)" strokeWidth={0.8} />;
      })}

      {/* 축선 + 라벨 */}
      {ratings.map((r, i) => {
        const [ex, ey] = point(i, maxR);
        const [lx, ly] = point(i, maxR + 18);
        const info = VALUE_CATEGORIES.find((v) => v.key === r.category)!;
        return (
          <g key={r.category}>
            <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="var(--color-border)" strokeWidth={0.5} />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fill="var(--color-muted)"
            >
              {info.label}
            </text>
          </g>
        );
      })}

      {/* 데이터 영역 */}
      <path
        d={dataPath}
        fill="var(--color-primary)"
        fillOpacity={0.15}
        stroke="var(--color-primary)"
        strokeWidth={2}
      />

      {/* 데이터 포인트 */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={4} fill="var(--color-primary)" />
      ))}
    </svg>
  );
}
