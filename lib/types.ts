// ─── 공통 ─────────────────────────────────────────────

export type PeriodId = string; // "2026-H1", "2026-04", "2026-W18", "2026-04-27"

// ─── Setup 1: 가치-목표 ───────────────────────────────

export type ValueCategory =
  | "self_direction"
  | "stimulation"
  | "hedonism"
  | "achievement"
  | "power"
  | "security"
  | "conformity"
  | "tradition"
  | "benevolence"
  | "universalism";

export interface ValueRating {
  category: ValueCategory;
  score: number; // 1~5
}

export interface Objective {
  id: string;
  title: string;
  linkedValues: ValueCategory[];
  color: string;
}

export interface ValueObjective {
  id: string;
  periodId: string; // "2026-H1"
  valueRatings: ValueRating[];
  objectives: Objective[];
  updatedAt: string;
}

// ─── Setup 2: 연간/반기 계획 ──────────────────────────

export interface Project {
  id: string;
  title: string;
  objectiveId?: string;
  color: string;
  startMonth: number; // 1~6 (반기 내 순서)
  endMonth: number;
  notes?: string;
}

export interface YearlyPlan {
  id: string;
  periodId: string; // "2026-H1"
  projects: Project[];
  updatedAt: string;
}

// ─── Setup 3: 월간 ────────────────────────────────────

export interface Appointment {
  id: string;
  date: string; // "2026-04-15"
  title: string;
  type: "meeting" | "deadline" | "personal" | "health";
}

export interface MonthlyPlan {
  id: string;
  yearMonth: string; // "2026-04"
  appointments: Appointment[];
  weeklyGoals: string[];
  letGoItems: string[];
  linkedObjectiveIds: string[];
  updatedAt: string;
}

// ─── Setup 4: 습관 트래커 ─────────────────────────────

export interface Habit {
  id: string;
  title: string;
  icon?: string;
  targetDays: number;
  order: number;
}

export interface HabitRecord {
  habitId: string;
  date: string;
  done: boolean;
}

export interface HabitTrackerData {
  id: string;
  yearMonth: string;
  habits: Habit[];
  records: HabitRecord[];
  updatedAt: string;
}

// ─── Setup 5: 주간 ────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: "high" | "mid" | "low";
  linkedObjectiveId?: string;
}

export interface DayPlan {
  date: string;
  tasks: Task[];
}

export interface WeeklyPlan {
  id: string;
  weekId: string; // "2026-W18"
  startDate: string;
  days: DayPlan[];
  weekReflection?: string;
  linkedObjectiveIds: string[];
  updatedAt: string;
}

// ─── Setup 6: 일간 ────────────────────────────────────

export type TimeCategory = "focus" | "meeting" | "rest" | "routine" | "personal";

export interface TimeBlock {
  id: string;
  hour: number; // 6~23
  plan: string;
  actual: string;
  category: TimeCategory;
  done: boolean;
}

export interface EveningReview {
  wins: string;
  improvements: string;
  tomorrowFocus: string;
  energyLevel: 1 | 2 | 3 | 4 | 5;
}

export interface DailyLog {
  id: string;
  date: string; // "2026-04-27"
  timeBlocks: TimeBlock[];
  eveningReview: EveningReview;
  focusHours?: number;
  updatedAt: string;
}

// ─── 스트릭 & 달성 ───────────────────────────────────────

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
  totalCompletedDays: number;
}

export interface DailyCompletion {
  date: string;
  focusHoursCompleted: boolean;
  habitsCompleted: boolean;
  reviewCompleted: boolean;
  isCompleted: boolean;
}

// ─── 스토리지 루트 ─────────────────────────────────────

export interface BulletJournalStore {
  valueObjectives: ValueObjective[];
  yearlyPlans: YearlyPlan[];
  monthlyPlans: MonthlyPlan[];
  habitTrackers: HabitTrackerData[];
  weeklyPlans: WeeklyPlan[];
  dailyLogs: DailyLog[];
  streakData: StreakData;
  dailyCompletions: DailyCompletion[];
  version: number;
}
