import type {
  BulletJournalStore,
  DailyLog,
  DailyCompletion,
  StreakData,
  HabitTrackerData,
  MonthlyPlan,
  WeeklyPlan,
  ValueObjective,
  YearlyPlan,
} from "./types";

const STORAGE_KEY = "bullet_journal_v1";

function defaultStore(): BulletJournalStore {
  return {
    valueObjectives: [],
    yearlyPlans: [],
    monthlyPlans: [],
    habitTrackers: [],
    weeklyPlans: [],
    dailyLogs: [],
    streakData: { currentStreak: 0, longestStreak: 0, lastCompletedDate: "", totalCompletedDays: 0 },
    dailyCompletions: [],
    version: 1,
  };
}

export function loadStore(): BulletJournalStore {
  if (typeof window === "undefined") return defaultStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultStore();
  } catch {
    return defaultStore();
  }
}

export function saveStore(store: BulletJournalStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// ─── Daily ────────────────────────────────────────────

export function getDailyLog(date: string): DailyLog | undefined {
  return loadStore().dailyLogs.find((l) => l.date === date);
}

export function saveDailyLog(log: DailyLog): void {
  const store = loadStore();
  const idx = store.dailyLogs.findIndex((l) => l.date === log.date);
  if (idx >= 0) store.dailyLogs[idx] = log;
  else store.dailyLogs.push(log);
  saveStore(store);
}

// ─── Habit Tracker ────────────────────────────────────

export function getHabitTracker(yearMonth: string): HabitTrackerData | undefined {
  return loadStore().habitTrackers.find((h) => h.yearMonth === yearMonth);
}

export function saveHabitTracker(data: HabitTrackerData): void {
  const store = loadStore();
  const idx = store.habitTrackers.findIndex((h) => h.yearMonth === data.yearMonth);
  if (idx >= 0) store.habitTrackers[idx] = data;
  else store.habitTrackers.push(data);
  saveStore(store);
}

// ─── Monthly ──────────────────────────────────────────

export function getMonthlyPlan(yearMonth: string): MonthlyPlan | undefined {
  return loadStore().monthlyPlans.find((m) => m.yearMonth === yearMonth);
}

export function saveMonthlyPlan(plan: MonthlyPlan): void {
  const store = loadStore();
  const idx = store.monthlyPlans.findIndex((m) => m.yearMonth === plan.yearMonth);
  if (idx >= 0) store.monthlyPlans[idx] = plan;
  else store.monthlyPlans.push(plan);
  saveStore(store);
}

// ─── Weekly ───────────────────────────────────────────

export function getWeeklyPlan(weekId: string): WeeklyPlan | undefined {
  return loadStore().weeklyPlans.find((w) => w.weekId === weekId);
}

export function saveWeeklyPlan(plan: WeeklyPlan): void {
  const store = loadStore();
  const idx = store.weeklyPlans.findIndex((w) => w.weekId === plan.weekId);
  if (idx >= 0) store.weeklyPlans[idx] = plan;
  else store.weeklyPlans.push(plan);
  saveStore(store);
}

// ─── Value-Objective ──────────────────────────────────

export function getValueObjective(periodId: string): ValueObjective | undefined {
  return loadStore().valueObjectives.find((v) => v.periodId === periodId);
}

export function saveValueObjective(vo: ValueObjective): void {
  const store = loadStore();
  const idx = store.valueObjectives.findIndex((v) => v.periodId === vo.periodId);
  if (idx >= 0) store.valueObjectives[idx] = vo;
  else store.valueObjectives.push(vo);
  saveStore(store);
}

// ─── Yearly ───────────────────────────────────────────

export function getYearlyPlan(periodId: string): YearlyPlan | undefined {
  return loadStore().yearlyPlans.find((y) => y.periodId === periodId);
}

export function saveYearlyPlan(plan: YearlyPlan): void {
  const store = loadStore();
  const idx = store.yearlyPlans.findIndex((y) => y.periodId === plan.periodId);
  if (idx >= 0) store.yearlyPlans[idx] = plan;
  else store.yearlyPlans.push(plan);
  saveStore(store);
}

// ─── 전체 Objectives 조회 (다른 페이지에서 참조용) ─────

export function getAllObjectives() {
  const store = loadStore();
  return store.valueObjectives.flatMap((vo) => vo.objectives);
}

// ─── Streak & Completion ─────────────────────────────────

export function getStreakData(): StreakData {
  const store = loadStore();
  return store.streakData ?? { currentStreak: 0, longestStreak: 0, lastCompletedDate: "", totalCompletedDays: 0 };
}

export function getDailyCompletions(): DailyCompletion[] {
  const store = loadStore();
  return store.dailyCompletions ?? [];
}

export function saveDailyCompletion(completion: DailyCompletion): void {
  const store = loadStore();
  const completions = store.dailyCompletions ?? [];
  const idx = completions.findIndex((c) => c.date === completion.date);
  if (idx >= 0) completions[idx] = completion;
  else completions.push(completion);
  store.dailyCompletions = completions;

  // Recalculate streak
  const sorted = [...completions].filter((c) => c.isCompleted).sort((a, b) => b.date.localeCompare(a.date));
  let current = 0;
  if (sorted.length > 0) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    // Streak counts from today or yesterday backwards
    const latestDate = sorted[0].date;
    if (latestDate === todayStr || latestDate === yesterdayStr) {
      let checkDate = new Date(latestDate + "T00:00:00");
      for (const c of sorted) {
        const cDate = c.date;
        const expected = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
        if (cDate === expected) {
          current++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (cDate < expected) {
          break;
        }
      }
    }
  }

  store.streakData = {
    currentStreak: current,
    longestStreak: Math.max(store.streakData?.longestStreak ?? 0, current),
    lastCompletedDate: sorted.length > 0 ? sorted[0].date : "",
    totalCompletedDays: sorted.length,
  };

  saveStore(store);
}

// ─── 전체 DailyLogs 조회 ─────────────────────────────────

export function getAllDailyLogs(): DailyLog[] {
  return loadStore().dailyLogs;
}

export function getAllHabitTrackers(): HabitTrackerData[] {
  return loadStore().habitTrackers;
}
