/** 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
export function today(): string {
  return formatDate(new Date());
}

/** Date → "YYYY-MM-DD" */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Date → "YYYY-MM" */
export function formatYearMonth(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Date → "YYYY-Wxx" (ISO 주차) */
export function formatWeekId(d: Date): string {
  const year = d.getFullYear();
  const week = getISOWeek(d);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** ISO 8601 주차 계산 */
export function getISOWeek(d: Date): number {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
}

/** weekId → 해당 주 월요일 Date */
export function weekIdToMonday(weekId: string): Date {
  const [yearStr, weekStr] = weekId.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  // 1월 4일이 항상 1주차에 포함됨 (ISO 8601)
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // 일요일=7
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  return monday;
}

/** 해당 월의 일수 반환 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 해당 월 1일의 요일 (0=일, 1=월, ..., 6=토) */
export function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/** 날짜에 days일 더하기 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/** 현재 반기 ID 반환 */
export function currentHalfId(): string {
  const now = new Date();
  const half = now.getMonth() < 6 ? "H1" : "H2";
  return `${now.getFullYear()}-${half}`;
}

/** UUID 생성 (간단 버전) */
export function uid(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}
