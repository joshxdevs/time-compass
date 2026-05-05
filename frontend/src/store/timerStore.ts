import { create } from 'zustand';
import { TimerStatus, TimeSession } from '../types';

interface TimerStore {
  status: TimerStatus;
  session: TimeSession | null;
  elapsedSeconds: number;
  heartbeatFailures: number;

  setStatus: (status: TimerStatus) => void;
  setSession: (session: TimeSession | null) => void;
  setElapsedSeconds: (seconds: number) => void;
  incrementElapsed: () => void;
  incrementHeartbeatFailures: () => void;
  resetHeartbeatFailures: () => void;
  reset: () => void;
}

export const useTimerStore = create<TimerStore>((set) => ({
  status: 'idle',
  session: null,
  elapsedSeconds: 0,
  heartbeatFailures: 0,

  setStatus: (status) => set({ status }),
  setSession: (session) => set({ session }),
  setElapsedSeconds: (elapsedSeconds) => set({ elapsedSeconds }),
  incrementElapsed: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
  incrementHeartbeatFailures: () =>
    set((state) => ({ heartbeatFailures: state.heartbeatFailures + 1 })),
  resetHeartbeatFailures: () => set({ heartbeatFailures: 0 }),
  reset: () => set({ status: 'idle', session: null, elapsedSeconds: 0, heartbeatFailures: 0 }),
}));
