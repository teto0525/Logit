"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, completeOnboarding, type SelectedFeature } from "@/lib/auth";

// ─── 온보딩 인트로 슬라이드 데이터 ─────────────────────

const INTRO_SLIDES = [
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" stroke="#6D5344" strokeWidth="1.5" />
        <path d="M24 12v12l8 4" stroke="#6D5344" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="24" r="3" fill="#6D5344" />
      </svg>
    ),
    title: "시간대별 일정",
    subtitle: "하루의 흐름을 타임블록으로",
    description: "아침 6시부터 밤 11시까지,\n내 하루를 한눈에 설계하고 돌아봐요.",
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="8" y="10" width="32" height="28" rx="4" stroke="#6D5344" strokeWidth="1.5" />
        <path d="M8 18h32" stroke="#6D5344" strokeWidth="1.5" />
        <path d="M16 24h16M16 30h10" stroke="#6D5344" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="36" cy="34" r="6" fill="#7C9E6E" fillOpacity="0.3" stroke="#7C9E6E" strokeWidth="1.5" />
        <path d="M33.5 34l2 2 3-3.5" stroke="#7C9E6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "하루 리포트",
    subtitle: "기록이 쌓이면 패턴이 보여요",
    description: "집중 시간, 에너지 흐름, 습관 달성률.\n숫자가 아닌 나의 이야기로 읽어드려요.",
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <path d="M24 8l4 8h8l-6 5 2 9-8-5-8 5 2-9-6-5h8l4-8z" stroke="#C4894A" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="24" cy="35" r="8" stroke="#6D5344" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M20 35h8M24 31v8" stroke="#6D5344" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    title: "회고",
    subtitle: "오늘의 나에게 묻는 세 가지 질문",
    description: "잘한 점, 개선할 점, 내일의 포커스.\n매일 저녁 3분이 한 달을 바꿔요.",
  },
];

// ─── 기능 선택 데이터 ────────────────────────────────

const FEATURE_OPTIONS: {
  key: SelectedFeature;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "daily",
    label: "Daily Log",
    description: "시간대별 일정 기록과 저녁 리뷰",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6D5344" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    ),
  },
  {
    key: "planner",
    label: "Planner",
    description: "주간·월간 계획과 목표 관리",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6D5344" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    key: "tracker",
    label: "Habit Tracker",
    description: "습관 추적과 연속 달성 스트릭",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6D5344" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M9 4v16" />
      </svg>
    ),
  },
  {
    key: "report",
    label: "Report",
    description: "집중시간, 카테고리, 습관 분석",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6D5344" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0=hero, 1~3=intro slides, 4=feature select
  const [selectedFeatures, setSelectedFeatures] = useState<SelectedFeature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    if (!auth.isSignedUp) {
      router.replace("/auth");
      return;
    }
    if (auth.isOnboarded) {
      router.replace("/");
      return;
    }
    setLoading(false);
  }, [router]);

  const toggleFeature = (key: SelectedFeature) => {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const handleComplete = () => {
    const features = selectedFeatures.length > 0 ? selectedFeatures : ["daily", "planner", "tracker", "report"] as SelectedFeature[];
    completeOnboarding(features);
    router.replace("/");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div style={{ color: "var(--color-muted)", fontSize: 14 }}>불러오는 중...</div>
      </div>
    );
  }

  // ─── Step 0: 히어로 화면 ─────────────────────────────

  if (step === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100%",
          padding: "0 24px",
          background: "var(--color-background)",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          {/* 앱 아이콘 */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: "linear-gradient(135deg, #111111 0%, #2A2A2A 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 28,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
            }}
          >
            <span style={{ fontFamily: "var(--font-display)", fontSize: 38, color: "#fff", fontWeight: 600 }}>L</span>
          </div>

          {/* 메인 카피 */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 600,
              color: "var(--color-ink)",
              textAlign: "center",
              letterSpacing: -0.5,
              lineHeight: 1.3,
              marginBottom: 12,
            }}
          >
            당신만의 불렛저널
            <br />
            <span style={{ color: "var(--color-primary)" }}>Logit</span>
          </h1>

          <p
            style={{
              fontSize: 15,
              color: "var(--color-muted)",
              textAlign: "center",
              lineHeight: 1.7,
              maxWidth: 260,
              marginBottom: 8,
            }}
          >
            시간대별 일정 · 하루 리포트 · 회고를
            <br />
            하나로 담았어요.
          </p>
        </div>

        {/* 페이지 인디케이터 + CTA */}
        <div style={{ paddingBottom: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          {/* 도트 인디케이터 */}
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === step ? "var(--color-primary)" : "var(--color-border)",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>

          <button
            onClick={() => setStep(1)}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 14,
              border: "none",
              background: "var(--color-primary)",
              color: "var(--color-on-primary)",
              fontSize: 16,
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
            }}
          >
            시작하기
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 1~3: 앱 소개 슬라이드 ─────────────────────

  if (step >= 1 && step <= 3) {
    const slide = INTRO_SLIDES[step - 1];
    const isLast = step === 3;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100%",
          padding: "0 24px",
          background: "var(--color-background)",
        }}
      >
        {/* 건너뛰기 */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 16 }}>
          <button
            onClick={() => setStep(4)}
            style={{
              background: "none",
              border: "none",
              fontSize: 14,
              color: "var(--color-muted)",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              padding: "8px 4px",
            }}
          >
            건너뛰기
          </button>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          {/* 일러스트 카드 */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              background: "var(--color-card)",
              border: "1px solid var(--color-border-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 36,
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            {slide.icon}
          </div>

          {/* 타이틀 */}
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              fontWeight: 600,
              color: "var(--color-ink)",
              textAlign: "center",
              letterSpacing: -0.3,
              marginBottom: 8,
            }}
          >
            {slide.title}
          </h2>

          {/* 서브타이틀 */}
          <p
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "var(--color-primary)",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {slide.subtitle}
          </p>

          {/* 설명 */}
          <p
            style={{
              fontSize: 14,
              color: "var(--color-muted)",
              textAlign: "center",
              lineHeight: 1.8,
              maxWidth: 260,
              whiteSpace: "pre-line",
            }}
          >
            {slide.description}
          </p>
        </div>

        {/* 하단 네비게이션 */}
        <div style={{ paddingBottom: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          {/* 도트 인디케이터 */}
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === step ? "var(--color-primary)" : "var(--color-border)",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, width: "100%" }}>
            <button
              onClick={() => setStep(step - 1)}
              style={{
                flex: 1,
                height: 52,
                borderRadius: 14,
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                color: "var(--color-body)",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
              }}
            >
              이전
            </button>
            <button
              onClick={() => setStep(isLast ? 4 : step + 1)}
              style={{
                flex: 2,
                height: 52,
                borderRadius: 14,
                border: "none",
                background: "var(--color-primary)",
                color: "var(--color-on-primary)",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
              }}
            >
              {isLast ? "기능 선택하기" : "다음"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 4: 기능 선택 설문조사 ─────────────────────

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        padding: "0 24px",
        background: "var(--color-background)",
      }}
    >
      <div style={{ flex: 1, paddingTop: 48 }}>
        {/* 헤더 */}
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 600,
            color: "var(--color-ink)",
            letterSpacing: -0.3,
            marginBottom: 8,
          }}
        >
          핵심 기능 선택
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--color-muted)",
            lineHeight: 1.6,
            marginBottom: 28,
          }}
        >
          자주 사용할 기능을 골라주세요.
          <br />
          선택한 기능이 하단 탭에 표시돼요.
        </p>

        {/* 기능 카드 리스트 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FEATURE_OPTIONS.map((feature) => {
            const isSelected = selectedFeatures.includes(feature.key);
            return (
              <button
                key={feature.key}
                onClick={() => toggleFeature(feature.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  borderRadius: 16,
                  border: isSelected
                    ? "2px solid var(--color-primary)"
                    : "1.5px solid var(--color-border)",
                  background: isSelected ? "var(--color-primary-light)" : "var(--color-card)",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {/* 아이콘 */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: isSelected ? "rgba(17,17,17,0.06)" : "var(--color-surface-strong)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {feature.icon}
                </div>

                {/* 텍스트 */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-ink)", marginBottom: 2 }}>
                    {feature.label}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-muted)" }}>
                    {feature.description}
                  </div>
                </div>

                {/* 체크 */}
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    border: isSelected ? "none" : "1.5px solid var(--color-border)",
                    background: isSelected ? "var(--color-primary)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                  }}
                >
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7l3 3 5-5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 완료 버튼 */}
      <div style={{ paddingBottom: 48, paddingTop: 24 }}>
        <p
          style={{
            fontSize: 12,
            color: "var(--color-muted-soft)",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {selectedFeatures.length === 0
            ? "선택하지 않으면 모든 기능이 표시돼요"
            : `${selectedFeatures.length}개 선택됨`}
        </p>
        <button
          onClick={handleComplete}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 14,
            border: "none",
            background: "var(--color-primary)",
            color: "var(--color-on-primary)",
            fontSize: 16,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
          }}
        >
          Logit 시작하기
        </button>
      </div>
    </div>
  );
}
