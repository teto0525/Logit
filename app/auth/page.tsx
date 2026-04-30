"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signUp, type AuthProvider } from "@/lib/auth";

export default function AuthPage() {
  const router = useRouter();
  const [isReturning, setIsReturning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    if (auth.isSignedUp && auth.isOnboarded) {
      router.replace("/");
      return;
    }
    setIsReturning(auth.isSignedUp);
    setLoading(false);
  }, [router]);

  const handleSocialAuth = (provider: AuthProvider) => {
    const names: Record<AuthProvider, string> = {
      kakao: "카카오 사용자",
      google: "Google User",
      naver: "네이버 사용자",
    };
    signUp(provider, names[provider]);

    const auth = getAuth();
    if (!auth.isOnboarded) {
      router.push("/onboarding");
    } else {
      router.replace("/");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div style={{ color: "var(--color-muted)", fontSize: 14 }}>불러오는 중...</div>
      </div>
    );
  }

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
      {/* 상단 여백 + 로고 영역 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", paddingTop: 60 }}>
        {/* 앱 아이콘 */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: "linear-gradient(135deg, #111111 0%, #2A2A2A 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
          }}
        >
          <span style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "#fff", fontWeight: 600 }}>L</span>
        </div>

        {/* 앱 이름 */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 36,
            fontWeight: 600,
            color: "var(--color-ink)",
            letterSpacing: -0.5,
            marginBottom: 8,
          }}
        >
          Logit
        </h1>

        {/* 서브 텍스트 */}
        <p
          style={{
            fontSize: 15,
            color: "var(--color-muted)",
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: 240,
          }}
        >
          {isReturning
            ? "다시 만나서 반가워요.\n로그인하고 이어서 기록해보세요."
            : "하루를 기록하고, 나를 발견하는\n나만의 불렛저널"}
        </p>
      </div>

      {/* 소셜 로그인 버튼 영역 */}
      <div style={{ paddingBottom: 48, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* 안내 텍스트 */}
        <p
          style={{
            fontSize: 13,
            color: "var(--color-muted)",
            textAlign: "center",
            marginBottom: 4,
          }}
        >
          {isReturning ? "로그인" : "가입하기"}
        </p>

        {/* 카카오 */}
        <button
          onClick={() => handleSocialAuth("kakao")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            height: 52,
            borderRadius: 12,
            border: "none",
            background: "#FEE500",
            color: "#191919",
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#191919">
            <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67-.15.56-.96 3.6-.99 3.83 0 0-.02.17.09.23.11.07.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.56.08 1.14.12 1.72.12 5.52 0 10-3.58 10-7.94S17.52 3 12 3z" />
          </svg>
          카카오로 {isReturning ? "로그인" : "시작하기"}
        </button>

        {/* 구글 */}
        <button
          onClick={() => handleSocialAuth("google")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            height: 52,
            borderRadius: 12,
            border: "1px solid var(--color-border)",
            background: "#FFFFFF",
            color: "var(--color-ink)",
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google로 {isReturning ? "로그인" : "시작하기"}
        </button>

        {/* 네이버 */}
        <button
          onClick={() => handleSocialAuth("naver")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            height: 52,
            borderRadius: 12,
            border: "none",
            background: "#03C75A",
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
            <path d="M16.27 3H7.73A4.73 4.73 0 003 7.73v8.54A4.73 4.73 0 007.73 21h8.54A4.73 4.73 0 0021 16.27V7.73A4.73 4.73 0 0016.27 3zm-1.4 12.63h-2.3l-2.5-3.54v3.54H7.77V8.37h2.3l2.5 3.54V8.37h2.3v7.26z" />
          </svg>
          네이버로 {isReturning ? "로그인" : "시작하기"}
        </button>

        {/* 하단 약관 안내 */}
        <p
          style={{
            fontSize: 11,
            color: "var(--color-muted-soft)",
            textAlign: "center",
            lineHeight: 1.6,
            marginTop: 8,
          }}
        >
          {isReturning ? "" : "가입 시 이용약관 및 개인정보처리방침에 동의하게 됩니다."}
        </p>
      </div>
    </div>
  );
}
