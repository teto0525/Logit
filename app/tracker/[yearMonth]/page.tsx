import TrackerClient from "@/app/components/TrackerClient";

export function generateStaticParams() {
  const params: { yearMonth: string }[] = [];
  const now = new Date();
  for (let i = -2; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    params.push({ yearMonth: ym });
  }
  return params;
}

export default function Page() {
  return <TrackerClient />;
}
