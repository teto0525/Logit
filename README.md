# Logit.

하루를 기록하고, 나를 발견하는 나만의 불렛저널

<p align="center">
  <img src="https://img.shields.io/badge/iOS-000000?style=flat&logo=apple&logoColor=white" alt="iOS" />
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Capacitor_8-119EFF?style=flat&logo=capacitor&logoColor=white" alt="Capacitor" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## Overview

**Logit**은 아날로그 불렛저널의 구조화된 기록 방식을 디지털로 옮긴 iOS 앱입니다. 하루의 시간 사용을 기록하고, 습관을 추적하며, 자신의 가치관을 발견해나가는 데 초점을 맞춥니다.

## Features

| 기능 | 설명 |
|------|------|
| **Daily** | 시간대별 집중 기록 + 습관 체크 + 저녁 리뷰 (에너지/감사/내일 목표) |
| **Weekly** | 요일별 할 일 관리 + 주간 회고 |
| **Monthly** | 달력 뷰 + 할 일/약속 관리 |
| **Plan** | 반기 목표(OKR) + 프로젝트 간트 차트 |
| **Tracker** | 습관 달성률 그리드 + 스트릭 추적 |
| **Report** | 주간/월간/전체 분석 (집중 시간, 카테고리 분포, 에너지 패턴) |
| **Value** | Schwartz 가치 모델 기반 자기 가치관 레이더 차트 |
| **My** | 프로필 + 가치 차트 + 반기 목표 + 프로젝트 관리 |

## Design

Tiimo에서 영감을 받은 Scandinavian Minimal 디자인 언어를 사용합니다.

- **Typography**: Fraunces (display) + DM Sans (body)
- **Color**: Lavender accent (`#B4A0E5`) + Warm ivory background (`#F7F5F0`)
- **Pages**: 각 페이지마다 고유한 색상 아이덴티티 (Daily=시간대별 그라디언트, Weekly=요일별 파스텔, Report=쿨블루, My=라벤더)
- **Interactions**: `scale(0.96)` press feedback, shadow-based depth, SVG inline icons

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Static Export) |
| Language | TypeScript |
| Styling | CSS Custom Properties + Inline Styles |
| Native | Capacitor 8 (iOS WKWebView) |
| Storage | localStorage (client-side) |
| Font | Google Fonts (Fraunces, DM Sans, Noto Sans KR) |

## Getting Started

```bash
# 의존성 설치
npm install

# 개발 서버
npm run dev

# iOS 빌드 + Xcode 동기화
npm run ios:build

# Xcode 열기
npm run ios:open
```

## Project Structure

```
app/
├── auth/              # 소셜 로그인 (카카오/구글/네이버)
├── onboarding/        # 온보딩 플로우
├── components/        # 공유 컴포넌트
│   ├── DailyClient    # 일일 기록
│   ├── WeeklyClient   # 주간 할 일
│   ├── MonthlyClient  # 월간 달력
│   ├── TrackerClient  # 습관 트래커
│   ├── HabitClient    # 습관 상세
│   └── PageHeader     # 공통 헤더
├── daily/[date]/      # 날짜별 일일 페이지
├── weekly/[weekId]/   # 주차별 주간 페이지
├── monthly/[yearMonth]/ # 월별 달력
├── tracker/[yearMonth]/ # 월별 습관 트래커
├── plan/              # 반기 계획
├── report/            # 리포트/분석
├── value/             # 가치관 설정
├── my/                # 마이 페이지
└── yearly/            # 연간 프로젝트
lib/
├── types.ts           # TypeScript 타입 정의
├── constants.ts       # 상수 (카테고리, 색상)
├── store.ts           # localStorage 기반 데이터 저장
└── auth.ts            # 인증 유틸리티
ios/                   # Capacitor iOS 프로젝트
```

---

Built with Claude Code
