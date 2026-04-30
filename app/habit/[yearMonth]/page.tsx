import HabitClient from "@/app/components/HabitClient";

// 12개월치 미리 생성
export function generateStaticParams() {
  const params: { yearMonth: string }[] = [];
  const now = new Date();
  for (let i = -2; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    params.push({ yearMonth: `${y}-${m}` });
  }
  return params;
}

export default function Page() {
  return <HabitClient />;
}
