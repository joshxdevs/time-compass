// ─── Core Types ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface Activity {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  color: string | null;
  order: number;
  createdAt: string;
  children?: Activity[];
}

export interface TimeSession {
  id: string;
  activityId: string;
  activityName: string;
  activityColor?: string | null;
  startedAt: string;
  stoppedAt?: string | null;
  durationSeconds?: number | null;
  elapsedSeconds?: number;
  lastHeartbeatAt?: string;
}

// ─── Timer State ──────────────────────────────────────────────────────────────

export type TimerStatus = 'idle' | 'running' | 'syncing' | 'error' | 'offline';

export interface TimerState {
  status: TimerStatus;
  session: TimeSession | null;
  elapsedSeconds: number;
  isRunning: boolean;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TimerStatusResponse {
  isRunning: boolean;
  session: TimeSession | null;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface SummaryData {
  totalSeconds: number;
  totalSessions: number;
  avgSessionSeconds: number;
  start: string;
  end: string;
}

export interface DistributionItem {
  id: string;
  name: string;
  seconds: number;
  color: string | null;
  parentName?: string;
}

export interface TrendPoint {
  date: string;
  seconds: number;
}

export interface TimelineItem {
  id: string;
  activityId: string;
  activityName: string;
  activityColor: string | null;
  startedAt: string;
  stoppedAt: string | null;
  durationSeconds: number | null;
  isRunning: boolean;
}

export interface InsightsData {
  hourlySeconds: number[];
  peakHour: number;
  focusScore: number;
  totalFocusedSeconds: number;
  totalFragmentedSeconds: number;
  totalSessions: number;
}

// ─── SSE Events ──────────────────────────────────────────────────────────────

export interface SSEEvent {
  type: 'connected' | 'timer:start' | 'timer:stop' | 'timer:switch';
  isRunning?: boolean;
  session?: TimeSession | null;
}
