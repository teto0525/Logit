"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { today, formatYearMonth } from "@/lib/dateUtils";
import { getSelectedFeatures, type SelectedFeature } from "@/lib/auth";

const now = new Date();

// ─── 기능별 탭 정의 ────────────────────────────────────

interface NavItem {
  featureKey: SelectedFeature | "my";
  href: string;
  label: string;
  match: string;
  icon: React.ReactNode;
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    featureKey: "daily",
    href: `/daily/${today()}`,
    label: "오늘",
    match: "/daily",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    ),
  },
  {
    featureKey: "planner",
    href: "/plan",
    label: "플랜",
    match: "/plan",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    featureKey: "tracker",
    href: `/tracker/${formatYearMonth(now)}`,
    label: "트래커",
    match: "/tracker",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M9 4v16" />
      </svg>
    ),
  },
  {
    featureKey: "report",
    href: "/report",
    label: "리포트",
    match: "/report",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    featureKey: "my",
    href: "/my",
    label: "마이",
    match: "/my",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    const selected = getSelectedFeatures();

    if (selected.length === 0) {
      // 온보딩 미완료 또는 전체 선택 → 기존 5탭 모두 표시
      setNavItems(ALL_NAV_ITEMS);
    } else {
      // 선택된 기능 + 항상 표시되는 마이 탭
      const filtered = ALL_NAV_ITEMS.filter(
        (item) => selected.includes(item.featureKey as SelectedFeature) || item.featureKey === "my"
      );
      setNavItems(filtered);
    }
  }, [pathname]); // pathname 변경 시 재계산 (설정에서 기능 변경 가능)

  // 인증/온보딩 페이지에서는 BottomNav 숨김
  if (pathname.startsWith("/auth") || pathname.startsWith("/onboarding")) {
    return null;
  }

  if (navItems.length === 0) return null;

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.match);
        return (
          <Link
            key={item.match}
            href={item.href}
            className={isActive ? "active" : ""}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
