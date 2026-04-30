import DailyClient from "@/app/components/DailyClient";

// 6개월치 날짜를 미리 생성 (정적 export용)
export function generateStaticParams() {
  const dates: { date: string }[] = [];
  const now = new Date();
  for (let i = -30; i <= 210; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push({ date: `${y}-${m}-${day}` });
  }
  return dates;
}

export default function Page() {
  return <DailyClient />;
}
