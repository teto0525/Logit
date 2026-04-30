# Logit. Design Guidelines

> Scandinavian Minimal 디자인 언어 기반의 불렛저널 앱 디자인 시스템

---

## Brand Identity

### Wordmark

- **서체**: Fraunces 600 (Optical Size Variable)
- **Bullet Dot**: 라벤더(`#B4A0E5`) 원형 마커, 마침표 위치에 배치
- **표기**: `Logit.` — 마침표 대신 라벤더 dot 사용

```
Logit●   ← 라벤더 dot (#B4A0E5)
```

### App Icon

| 속성 | 값 |
|------|---|
| 배경 | `linear-gradient(135deg, #8B72CE 0%, #6B52AE 100%)` |
| 레터마크 | Fraunces 700, "L", `#FFFFFF` |
| Bullet Dot | 우상단, `rgba(255,255,255,0.45)`, 원형 |
| 모서리 | iOS 자동 마스킹 (superellipse) |
| 크기 | 1024×1024px (iOS universal) |

### Tagline

```
하루를 기록하고, 나를 발견하는 나만의 불렛저널
```

---

## Color System

### Core Palette

| 토큰 | HEX | 용도 |
|------|-----|------|
| `--color-background` | `#F7F5F0` | 앱 전체 배경 (Warm Ivory) |
| `--color-card` | `#FFFFFF` | 카드 배경 |
| `--color-surface-strong` | `#F0EDE8` | 강조 서피스, 호버 배경 |
| `--color-ink` | `#111111` | 최상위 헤딩 |
| `--color-body` | `#374151` | 본문 텍스트 |
| `--color-muted` | `#6B7280` | 보조 텍스트 |
| `--color-muted-soft` | `#9CA3AF` | 비활성/플레이스홀더 |

### Accent — Lavender

브랜드의 핵심 컬러. 앱 전체에서 액센트 포인트로 사용.

| 토큰 | HEX | 용도 |
|------|-----|------|
| `--color-accent` | `#B4A0E5` | 메인 액센트 (네비 인디케이터, 스트릭 카드) |
| `--color-accent-light` | `#EDE8F8` | 액센트 배경 tint |
| `--color-accent-text` | `#7B5EA7` | 액센트 텍스트 (활성 탭, 부제목) |

### Lavender Gradient Family

앱 아이콘, 스트릭 카드, My 페이지 헤더에 사용되는 브랜드 그라디언트.

| 용도 | 그라디언트 |
|------|-----------|
| 앱 아이콘 / 스트릭 카드 | `linear-gradient(135deg, #8B72CE 0%, #6B52AE 100%)` |
| My 페이지 헤더 | `linear-gradient(160deg, #8B72CE 0%, #B4A0E5 50%, #D4C5F0 100%)` |
| Report 헤더 | `linear-gradient(160deg, #8B72CE 0%, #B4A0E5 50%, #D4C5F0 100%)` |

### Status Colors

| 토큰 | HEX | 용도 |
|------|-----|------|
| `--color-success` | `#10B981` | 달성/완료 (에메랄드) |
| `--color-warning` | `#F59E0B` | 경고/진행 중 (앰버) |
| `--color-error` | `#EF4444` | 오류/위험 (레드) |

### Category Colors

시간 블록 카테고리에 사용. 각 색상은 대응하는 tint 배경을 가짐.

| 카테고리 | 색상 | Tint 배경 | CSS 클래스 |
|----------|------|-----------|-----------|
| 집중 | `#6B52AE` 라벤더 다크 | `#EEEAFC` | `.cat-focus` |
| 미팅 | `#7B5EA7` 라벤더 텍스트 | `#F0ECFA` | `.cat-meeting` |
| 휴식 | `#B4A0E5` 라벤더 | `#F5F2FC` | `.cat-rest` |
| 루틴 | `#8B72CE` 라벤더 딥 | `#F0ECFA` | `.cat-routine` |
| 개인 | `#D4C5F0` 라벤더 라이트 | `#F8F5FD` | `.cat-personal` |

### Objective Accent Palette

반기 목표, 프로젝트 색상에 순환 사용.

| 순서 | HEX | 이름 |
|------|-----|------|
| 1 | `#111111` | Black |
| 2 | `#6B7280` | Gray |
| 3 | `#10B981` | Green |
| 4 | `#8B5CF6` | Purple |
| 5 | `#3B82F6` | Blue |
| 6 | `#F59E0B` | Amber |

---

## Page Color Identity

각 페이지는 고유한 색상 온도를 가짐 — **"Color as Wayfinding"**

| 페이지 | 헤더/배경 | 색 온도 | 특징 |
|--------|-----------|---------|------|
| Daily | Warm Ivory (기본) + 시간대 아이콘 | 뉴트럴 | 아이콘으로 시간대 표현 |
| Weekly | 요일별 파스텔 헤더 띠 (7색) | 무지개 | 요일마다 다른 파스텔 |
| Monthly | Warm Ivory (기본) | 뉴트럴 | 달력 중심, 색상은 약속 도트에 집중 |
| Plan | Warm Ivory (기본) | 뉴트럴 | 프로젝트 컬러바가 색상 역할 |
| Tracker | 앰버 / 그린 / 라벤더 SummaryCard | 3색 | 달성감을 색으로 보상 |
| Report | 라벤더 그라디언트 배너 | 브랜드 퍼플 | 분석/데이터의 느낌 |
| My | 라벤더 그라디언트 배너 | 브랜드 퍼플 | 프로필 = 브랜드 아이덴티티 |
| Value | Warm Ivory (기본) | 뉴트럴 | 레이더 차트가 라벤더 액센트 |

### Daily Time Gradients

시간대에 따라 앱 배경이 자동 변경되어 "지금"의 감각을 부여.

| 시간대 | 그라디언트 | 분위기 |
|--------|-----------|--------|
| 새벽 (21~6시) | `180deg, #C8D0D4 → #D8D8CC` | 쿨 슬레이트 |
| 아침 (6~10시) | `180deg, #EDE8DE → #F2E0A8` | 아이보리 → 골드 |
| 점심 (10~14시) | `180deg, #C0D4F0 → #D8EAF8` | 블루 → 스카이 |
| 오후 (14~17시) | `180deg, #F0DCD4 → #F4DCC0` | 블러시 → 피치 |
| 저녁 (17~21시) | `180deg, #C8B8D4 → #E8C8A0` | 라벤더 → 피치 |

### Weekly Day Colors

| 요일 | 헤더 색상 | 이름 |
|------|-----------|------|
| 월 | `#EDE8F8` | 라벤더 |
| 화 | `#DBEAFE` | 블루 |
| 수 | `#D1FAE5` | 그린 |
| 목 | `#FEF3C7` | 앰버 |
| 금 | `#FCE7F3` | 핑크 |
| 토 | `#F3E8FF` | 퍼플 |
| 일 | `#FFF7ED` | 오렌지 |

### Tracker Summary Gradients

| 카드 | 그라디언트 | 용도 |
|------|-----------|------|
| 연속 | `135deg, #F59E0B → #FBBF24` | 앰버 — 스트릭 수 |
| 달성률 | `135deg, #10B981 → #34D399` | 그린 — 퍼센트 |
| 총 달성 | `135deg, #8B72CE → #6B52AE` | 라벤더 — 브랜드 앵커 |

---

## Typography

### Font Stack

| 역할 | 폰트 | Fallback |
|------|------|----------|
| Display | Fraunces (Variable, opsz 9–144) | DM Sans, serif |
| Body | DM Sans | Noto Sans KR, system-ui |
| Korean | Noto Sans KR | system-ui |

### Type Scale

| 요소 | 크기 | 무게 | 폰트 | 용도 |
|------|------|------|------|------|
| 페이지 제목 | 24–26px | 700 | Fraunces | h1 — 마이, 리포트 등 |
| 섹션 제목 | 18px | 700 | Fraunces | h2 — 카드 내 섹션 헤더 |
| 카드 제목 | 18px | 700 | Fraunces | h3 — 습관별 달성률 등 |
| 본문 | 14–15px | 400–500 | DM Sans | 일반 텍스트 |
| 캡션/라벨 | 11–13px | 500–600 | DM Sans | 부제목, 날짜, 태그 |
| 인사/그리팅 | 24px | 400 italic | Fraunces | Daily 상단 시간대 인사 |
| 수치 | 24–32px | 600–700 | Fraunces | 스트릭 수, 달성률 등 |

### Text Rules

- 제목: `text-wrap: balance` (줄바꿈 균형)
- 설명문: `text-wrap: pretty` (마지막 줄 고아 방지)
- 동적 숫자: `font-variant-numeric: tabular-nums` (자릿수 정렬)

---

## Spacing & Radius

### Border Radius Scale

| 토큰 | 값 | 용도 |
|------|---|------|
| `--radius-xs` | 8px | 아이콘 컨테이너, 작은 요소 |
| `--radius-sm` | 14px | 입력 필드, 태그 |
| `--radius-md` | 18px | 작은 카드 |
| `--radius-lg` | **24px** | 표준 카드 (모든 카드의 기본값) |
| `--radius-xl` | 28px | 큰 카드 |
| `--radius-full` | 9999px | 버튼, 아바타, pill 모양 |

### Card Standard

모든 카드는 다음 기본 스타일을 따름:

```css
background: var(--color-card);      /* #FFFFFF */
border-radius: 24px;                /* --radius-lg */
padding: 24px;
box-shadow: var(--shadow-card);     /* border 대신 shadow */
```

---

## Depth & Shadow

Border 대신 shadow로 깊이 표현 — 더 부드럽고 현대적인 느낌.

| 토큰 | 용도 | 구성 |
|------|------|------|
| `--shadow-card` | 카드 기본 | `0 0 0 1px rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.06), 0 2px 4px rgba(0,0,0,.04)` |
| `--shadow-card-hover` | 카드 호버 | `0 0 0 1px rgba(0,0,0,.08), 0 1px 2px -1px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.06)` |
| `--shadow-button` | 버튼/네비 | `0 0 0 1px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.05)` |

---

## Interactions

### Press Feedback

```css
button:active {
  transform: scale(0.96);
}
```

### Hover (Desktop Only)

```css
@media (hover: hover) {
  button:hover:not(:disabled) { opacity: 0.88; }
  .nav-btn:hover { background: var(--color-surface-strong); }
  .card-hover:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-1px); }
}
```

### Transition

- **절대 `transition: all` 사용 금지** — 구체적 속성만 지정
- 커브: `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design standard)
- 시간: 0.15s (transform), 0.2s (color/background/shadow)

---

## Icons

- **모든 아이콘은 inline SVG** — 유니코드 기호(●○×▾‹›) 사용 금지
- 체크박스: 원형 (`circle`) 통일
- 삭제: 14×14 SVG X
- 네비게이션: 18×18 SVG chevron
- 접기/펼치기: `.chevron` + `.chevron.open` CSS 클래스 (rotate 180deg)
- 카테고리: 10×10 SVG 도형 (circle, diamond, rounded-square 등)

---

## Bottom Navigation

글래스모피즘 기반의 하단 고정 네비게이션.

```css
.bottom-nav {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--color-border);
}

.bottom-nav a.active {
  color: var(--color-accent-text);    /* #7B5EA7 */
}

.bottom-nav a.active::before {
  background: var(--color-accent);    /* #B4A0E5 */
  width: 20px;
  height: 2px;                        /* 상단 라벤더 인디케이터 */
}
```

---

## Do / Don't

| Do | Don't |
|----|-------|
| Shadow로 깊이 표현 | Border로 카드 구분 |
| SVG inline 아이콘 | 유니코드 기호 (●○×▾‹›) |
| `transition: background 0.2s` | `transition: all 0.2s` |
| `tabular-nums` (동적 숫자) | 기본 proportional 숫자 |
| `text-wrap: balance` (제목) | 수동 `\n` 줄바꿈 |
| 40×40px 이상 터치 영역 | 작은 터치 타겟 |
| 페이지별 고유 색상 | 모든 페이지 동일한 흰색 |
| Fraunces = display only | Fraunces로 본문 작성 |
| 그라디언트 = Hero 카드에만 | 모든 요소에 그라디언트 |

---

## Tech Implementation

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Static Export) |
| Styling | CSS Custom Properties (`@theme inline`) + React inline styles |
| Native | Capacitor 8 (iOS WKWebView) |
| Storage | localStorage (client-side) |
| Design Tokens | `app/globals.css` 내 `@theme inline` 블록 |
| Category Colors | `lib/constants.ts` — `TIME_CATEGORIES` |

---

*Logit Design System v1.0 — Built with Claude Code*
