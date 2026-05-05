import React, { useState, useEffect } from 'react';
import { useTimer, formatDuration } from '../hooks/useTimer';
import { useActivities } from '../hooks/useActivities';
import { getSummary } from '../api/analytics';
import { SummaryData } from '../types';
import TimerCard from '../components/Timer/TimerCard';
import { Clock, Zap } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { tree, activities, isLoading, createActivity } = useActivities();
  const { session } = useTimer();
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  useEffect(() => {
    getSummary('daily').then(setSummary).catch(() => {});
  }, []);

  useEffect(() => {
    if (session?.activityId) setSelectedActivityId(session.activityId);
  }, [session]);

  const handleCreate = async (name: string) => {
    await createActivity(name);
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">{todayStr}</p>
      </div>

      <div className="dashboard-grid">
        {/* Left: Timer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {isLoading ? (
            <div className="timer-card" style={{ minHeight: 320 }}>
              <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
          ) : (
            <TimerCard
              tree={tree}
              selectedActivityId={selectedActivityId}
              onSelectActivity={setSelectedActivityId}
              onCreateActivity={handleCreate}
            />
          )}
        </div>

        {/* Right: Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-title">Today's stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="stat-card">
              <div className="stat-label">
                <Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> Time tracked
              </div>
              <div className="stat-value">{summary ? formatDuration(summary.totalSeconds) : '—'}</div>
              <div className="stat-sub">{summary?.totalSessions ?? 0} sessions</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">
                <Zap size={12} style={{ display: 'inline', marginRight: 4 }} /> Avg session
              </div>
              <div className="stat-value">{summary ? formatDuration(summary.avgSessionSeconds) : '—'}</div>
            </div>
          </div>

          {activities.length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: 8 }}>Quick start</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {activities.slice(0, 5).map((a) => (
                  <button
                    key={a.id}
                    className="sidebar-link"
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => setSelectedActivityId(a.id)}
                    id={`quick-${a.id}`}
                  >
                    <span className="activity-dot" style={{ background: a.color || 'var(--accent)', width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
                    {a.name}
                  </button>
                ))}
              </div>
            </>
          )}

          {activities.length === 0 && !isLoading && (
            <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                No activities yet.<br />Create one to start tracking.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
