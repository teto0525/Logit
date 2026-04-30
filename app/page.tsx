"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { today } from "@/lib/dateUtils";
import { getAuth } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();

    if (!auth.isSignedUp) {
      // 최초 실행 → 가입 화면
      router.replace("/auth");
    } else if (!auth.isOnboarded) {
      // 가입 완료, 온보딩 미완료 → 온보딩
      router.replace("/onboarding");
    } else {
      // 가입 + 온보딩 완료 → 메인(오늘)
      router.replace(`/daily/${today()}`);
    }
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "var(--color-muted)",
        fontSize: 14,
      }}
    >
      불렛저널을 불러오는 중...
    </div>
  );
}
