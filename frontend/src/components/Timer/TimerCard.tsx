import React, { useEffect, useCallback } from 'react';
import { Play, Square, RotateCw } from 'lucide-react';
import { useTimer, formatTime } from '../../hooks/useTimer';
import { Activity } from '../../types';
import ActivitySelector from './ActivitySelector';
import { flattenTree } from '../../hooks/useActivities';

interface Props {
  tree: Activity[];
  selectedActivityId: string | null;
  onSelectActivity: (id: string) => void;
  onCreateActivity?: (name: string) => Promise<void>;
}

const STATUS_LABELS: Record<string, string> = {
  running: 'Running',
  idle: 'Ready',
  syncing: 'Syncing…',
  error: 'Sync error',
  offline: 'Reconnecting…',
};

const TimerCard: React.FC<Props> = ({ tree, selectedActivityId, onSelectActivity, onCreateActivity }) => {
  const { status, session, elapsedSeconds, start, stop, isLoading, syncFromServer } = useTimer();
  const flat = flattenTree(tree);
  const selected = flat.find((a) => a.id === selectedActivityId);
  const activeActivity = session ? flat.find((a) => a.id === session.activityId) : null;

  // Initial sync
  useEffect(() => { syncFromServer(); }, [syncFromServer]);

  // Keyboard shortcut: Space to start/stop
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      if (status === 'running') stop();
      else if (selectedActivityId) start(selectedActivityId);
    }
  }, [status, selectedActivityId, start, stop]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleStart = () => {
    if (!selectedActivityId) return;
    start(selectedActivityId);
  };

  const displayColor = (activeActivity || selected)?.color || 'var(--accent)';
  const displayName = session ? activeActivity?.name || session.activityName : selected?.name;

  return (
    <div className="timer-card">
      {/* Status badge */}
      <div className={`status-badge ${status}`}>
        <span className={`status-dot${status === 'running' ? ' pulse' : ''}`} />
        {STATUS_LABELS[status] || status}
      </div>

      {/* Timer display */}
      <div className={`timer-display${status === 'running' ? ' running timer-pulse' : ' idle'}`}>
        {formatTime(elapsedSeconds)}
      </div>

      {/* Current activity */}
      {displayName && (
        <div className="timer-activity-label">
          <span className="activity-dot" style={{ background: displayColor }} />
          {displayName}
        </div>
      )}

      {/* Activity selector (only shown when idle or to switch) */}
      {status !== 'running' && (
        <ActivitySelector
          tree={tree}
          selectedId={selectedActivityId}
          onSelect={onSelectActivity}
          onCreate={onCreateActivity}
        />
      )}

      {/* Controls */}
      <div className="timer-controls">
        {status === 'error' ? (
          <button className="btn btn-ghost" onClick={syncFromServer} id="retry-sync-btn">
            <RotateCw size={14} /> Retry sync
          </button>
        ) : status === 'running' ? (
          <button
            className="timer-btn timer-btn-stop"
            onClick={stop}
            disabled={isLoading}
            id="stop-timer-btn"
            title="Stop timer"
          >
            {isLoading ? <span className="spinner" /> : <Square size={20} fill="currentColor" />}
          </button>
        ) : (
          <button
            className="timer-btn timer-btn-start"
            onClick={handleStart}
            disabled={!selectedActivityId || isLoading}
            id="start-timer-btn"
            title="Start timer"
          >
            {isLoading ? <span className="spinner" /> : <Play size={20} fill="currentColor" />}
          </button>
        )}

        <span className="timer-shortcut-hint">
          Press <kbd className="kbd">Space</kbd> to {status === 'running' ? 'stop' : 'start'}
        </span>
      </div>
    </div>
  );
};

export default TimerCard;
