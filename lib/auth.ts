// ─── 인증 & 온보딩 상태 관리 ─────────────────────────
// localStorage 기반 — 서버 없이 클라이언트에서만 동작

export type AuthProvider = "kakao" | "google" | "naver";

export type SelectedFeature = "daily" | "planner" | "tracker" | "report";

export interface AuthState {
  isSignedUp: boolean;
  isOnboarded: boolean;
  provider?: AuthProvider;
  displayName?: string;
  selectedFeatures: SelectedFeature[];
  createdAt?: string;
}

const AUTH_KEY = "logit_auth";

function defaultAuth(): AuthState {
  return {
    isSignedUp: false,
    isOnboarded: false,
    selectedFeatures: [],
  };
}

export function getAuth(): AuthState {
  if (typeof window === "undefined") return defaultAuth();
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : defaultAuth();
  } catch {
    return defaultAuth();
  }
}

export function saveAuth(state: AuthState): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

// ─── 가입 ────────────────────────────────────────────

export function signUp(provider: AuthProvider, displayName: string): void {
  const auth = getAuth();
  auth.isSignedUp = true;
  auth.provider = provider;
  auth.displayName = displayName;
  auth.createdAt = new Date().toISOString();
  saveAuth(auth);
}

// ─── 온보딩 완료 ─────────────────────────────────────

export function completeOnboarding(features: SelectedFeature[]): void {
  const auth = getAuth();
  auth.isOnboarded = true;
  auth.selectedFeatures = features;
  saveAuth(auth);
}

// ─── 선택된 기능 조회 ────────────────────────────────

export function getSelectedFeatures(): SelectedFeature[] {
  return getAuth().selectedFeatures;
}

// ─── 탈퇴 (계정 초기화) ─────────────────────────────

export function deleteAccount(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem("bullet_journal_v1");
}

// ─── 설정에서 기능 변경 ──────────────────────────────

export function updateSelectedFeatures(features: SelectedFeature[]): void {
  const auth = getAuth();
  auth.selectedFeatures = features;
  saveAuth(auth);
}
