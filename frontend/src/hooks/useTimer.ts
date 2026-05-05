import { useEffect, useRef, useCallback } from 'react';
import { useTimerStore } from '../store/timerStore';
import { getTimerStatus, startTimer, stopTimer, switchTimer } from '../api/timer';
import { TimeSession } from '../types';


const HEARTBEAT_INTERVAL = 15000; // 15 seconds
const MAX_HEARTBEAT_FAILURES = 3;

export const useTimer = () => {
  const {
    status,
    session,
    elapsedSeconds,
    heartbeatFailures,
    setStatus,
    setSession,
    setElapsedSeconds,
    incrementElapsed,
    incrementHeartbeatFailures,
    resetHeartbeatFailures,
    reset,
  } = useTimerStore();

  const tickRef = useRef<number | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // ── Sync from server ───────────────────────────────────────────────────────
  const syncFromServer = useCallback(async () => {
    try {
      const data = await getTimerStatus();
      if (data.isRunning && data.session) {
        const elapsed = data.session.elapsedSeconds ?? 0;
        setSession(data.session);
        setElapsedSeconds(elapsed);
        setStatus('running');
      } else {
        setSession(null);
        setElapsedSeconds(0);
        setStatus('idle');
      }
      resetHeartbeatFailures();
    } catch {
      setStatus('error');
    }
  }, [setSession, setElapsedSeconds, setStatus, resetHeartbeatFailures]);

  // ── Broadcast channel for multi-tab ───────────────────────────────────────
  useEffect(() => {
    const bc = new BroadcastChannel('timecompass_timer');
    broadcastRef.current = bc;

    bc.onmessage = (event) => {
      if (event.data?.type === 'timer:change') {
        syncFromServer();
      }
    };

    return () => bc.close();
  }, [syncFromServer]);

  const broadcastChange = () => {
    broadcastRef.current?.postMessage({ type: 'timer:change' });
  };

  // ── Tick (client-side increment, server-authoritative) ────────────────────
  // Use a ref for the callback to avoid re-creating the interval on every tick.
  const incrementRef = useRef(incrementElapsed);
  useEffect(() => { incrementRef.current = incrementElapsed; });

  useEffect(() => {
    if (status === 'running') {
      tickRef.current = window.setInterval(() => {
        incrementRef.current();
      }, 1000);
    } else {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    }
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [status]); // ← status only! No incrementElapsed here.

  // ── Heartbeat ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'running') {
      heartbeatRef.current = window.setInterval(async () => {
        try {
          // Re-sync elapsed from server on each heartbeat
          const data = await getTimerStatus();
          if (data.isRunning && data.session) {
            setElapsedSeconds(data.session.elapsedSeconds ?? 0);
            setSession(data.session);
            resetHeartbeatFailures();
            setStatus('running');
          } else {
            // Server says timer stopped (heartbeat timeout hit on server side)
            setStatus('idle');
            setSession(null);
            setElapsedSeconds(0);
            reset();
          }
        } catch {
          incrementHeartbeatFailures();
          if (heartbeatFailures + 1 >= MAX_HEARTBEAT_FAILURES) {
            setStatus('offline');
          }
        }
      }, HEARTBEAT_INTERVAL);
    } else {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }

      // Try to reconnect if offline
      if (status === 'offline') {
        const retryTimeout = window.setTimeout(async () => {
          try {
            await syncFromServer();
          } catch {
            // still offline
          }
        }, 5000);
        return () => clearTimeout(retryTimeout);
      }
    }

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [
    status,
    heartbeatFailures,
    setElapsedSeconds,
    setSession,
    setStatus,
    resetHeartbeatFailures,
    incrementHeartbeatFailures,
    reset,
    syncFromServer,
  ]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const start = useCallback(
    async (activityId: string) => {
      setStatus('syncing');
      try {
        const data = await startTimer(activityId);
        if (data.session) {
          setSession(data.session);
          setElapsedSeconds(0);
          setStatus('running');
          resetHeartbeatFailures();
          broadcastChange();
        }
      } catch (err: any) {
        if (err.response?.status === 409) {
          // Already running — sync from server
          await syncFromServer();
        } else {
          setStatus('error');
        }
      }
    },
    [setStatus, setSession, setElapsedSeconds, resetHeartbeatFailures, syncFromServer]
  );

  const stop = useCallback(async () => {
    setStatus('syncing');
    try {
      await stopTimer();
      reset();
      broadcastChange();
    } catch {
      setStatus('error');
      await syncFromServer();
    }
  }, [setStatus, reset, syncFromServer]);

  const switchActivity = useCallback(
    async (activityId: string) => {
      setStatus('syncing');
      try {
        const data = await switchTimer(activityId);
        if (data.session) {
          setSession(data.session);
          setElapsedSeconds(data.session.elapsedSeconds ?? 0);
          setStatus('running');
          broadcastChange();
        }
      } catch {
        setStatus('error');
        await syncFromServer();
      }
    },
    [setStatus, setSession, setElapsedSeconds, syncFromServer]
  );

  return {
    status,
    session,
    elapsedSeconds,
    isRunning: status === 'running',
    isLoading: status === 'syncing',
    isOffline: status === 'offline',
    isError: status === 'error',
    syncFromServer,
    start,
    stop,
    switchActivity,
  };
};

export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};
