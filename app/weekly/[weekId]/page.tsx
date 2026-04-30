import WeeklyClient from "@/app/components/WeeklyClient";

// 40주치 미리 생성
export function generateStaticParams() {
  const params: { weekId: string }[] = [];
  const now = new Date();
  for (let i = -4; i <= 36; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i * 7);
    // ISO week 계산
    const tmp = new Date(d.getTime());
    tmp.setHours(0, 0, 0, 0);
    tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
    const week1 = new Date(tmp.getFullYear(), 0, 4);
    const weekNum =
      1 +
      Math.round(
        ((tmp.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7
      );
    const year = tmp.getFullYear();
    params.push({ weekId: `${year}-W${String(weekNum).padStart(2, "0")}` });
  }
  // 중복 제거
  const seen = new Set<string>();
  return params.filter((p) => {
    if (seen.has(p.weekId)) return false;
    seen.add(p.weekId);
    return true;
  });
}

export default function Page() {
  return <WeeklyClient />;
}
