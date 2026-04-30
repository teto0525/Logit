import type { ValueCategory, TimeCategory } from "./types";

export const VALUE_CATEGORIES: {
  key: ValueCategory;
  label: string;
  description: string;
}[] = [
  { key: "self_direction", label: "자기 방향성", description: "독립적 사고와 행동, 창의성" },
  { key: "stimulation", label: "자극·도전", description: "흥분, 새로움, 도전" },
  { key: "hedonism", label: "즐거움", description: "기쁨, 감각적 만족" },
  { key: "achievement", label: "성취", description: "유능함을 통한 개인적 성공" },
  { key: "power", label: "영향력", description: "사회적 지위, 자원 통제" },
  { key: "security", label: "안전", description: "안전, 조화, 안정성" },
  { key: "conformity", label: "규범", description: "타인에게 해가 되는 행동 자제" },
  { key: "tradition", label: "전통", description: "문화적·종교적 관습 존중" },
  { key: "benevolence", label: "친절·돌봄", description: "가까운 사람들의 복지" },
  { key: "universalism", label: "보편적 가치", description: "모든 사람과 자연의 복지" },
];

export const TIME_CATEGORIES: {
  key: TimeCategory;
  label: string;
  color: string;
}[] = [
  { key: "focus", label: "집중", color: "#7B5EA7" },
  { key: "meeting", label: "미팅", color: "#3B82F6" },
  { key: "rest", label: "휴식", color: "#10B981" },
  { key: "routine", label: "루틴", color: "#F59E0B" },
  { key: "personal", label: "개인", color: "#EC4899" },
];

export const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6~23

export const DAYS_KO = ["월", "화", "수", "목", "금", "토", "일"];

export const OBJECTIVE_COLORS = [
  "#111111", // black
  "#6B7280", // gray
  "#10B981", // green
  "#8B5CF6", // purple
  "#3B82F6", // blue
  "#F59E0B", // amber
];

export const DEFAULT_ENERGY_LEVEL = 3;
