import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import * as analyticsApi from '../api/analytics';
import { SummaryData, DistributionItem, TrendPoint, TimelineItem, InsightsData } from '../types';
import { formatDuration } from '../hooks/useTimer';
import { Clock, Zap, BarChart2, Target } from 'lucide-react';

type Range = 'daily' | 'weekly' | 'monthly' | 'all';

const CHART_COLORS = ['#7c6af7','#4ade80','#f87171','#fbbf24','#60a5fa','#f472b6','#34d399','#fb923c'];

const getRange = (range: Range) => {
  const now = new Date();
  const end = now.toISOString();
  if (range === 'daily') {
    const s = new Date(now); s.setHours(0,0,0,0);
    return { start: s.toISOString(), end, groupBy: 'day' as const };
  }
  if (range === 'weekly') {
    const s = new Date(now); s.setDate(now.getDate() - 6); s.setHours(0,0,0,0);
    return { start: s.toISOString(), end, groupBy: 'day' as const };
  }
  if (range === 'monthly') {
    const s = new Date(now); s.setDate(1); s.setHours(0,0,0,0);
    return { start: s.toISOString(), end, groupBy: 'day' as const };
  }
  return { start: new Date(0).toISOString(), end, groupBy: 'month' as const };
};

const formatHour = (h: number) => {
  if (h === 0) return '12a'; if (h < 12) return `${h}a`; if (h === 12) return '12p'; return `${h - 12}p`;
};

const Analytics: React.FC = () => {
  const [range, setRange] = useState<Range>('weekly');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { start, end, groupBy } = getRange(range);
      try {
        const [s, d, t, tl, i] = await Promise.all([
          analyticsApi.getSummary(range),
          analyticsApi.getDistribution(start, end),
          analyticsApi.getTrend(start, end, groupBy),
          analyticsApi.getTimeline(),
          analyticsApi.getInsights(start, end),
        ]);
        setSummary(s); setDistribution(d); setTrend(t); setTimeline(tl); setInsights(i);
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    load();
  }, [range]);

  const maxHour = insights ? Math.max(...insights.hourlySeconds, 1) : 1;

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Understand where your time goes</p>
          </div>
          <div className="range-tabs">
            {(['daily','weekly','monthly','all'] as Range[]).map((r) => (
              <button key={r} className={`range-tab${range === r ? ' active' : ''}`} onClick={() => setRange(r)}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { icon: Clock, label: 'Total time', value: summary ? formatDuration(summary.totalSeconds) : '—' },
          { icon: BarChart2, label: 'Sessions', value: String(summary?.totalSessions ?? '—') },
          { icon: Zap, label: 'Avg session', value: summary ? formatDuration(summary.avgSessionSeconds) : '—' },
          { icon: Target, label: 'Focus score', value: insights ? `${insights.focusScore}%` : '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="stat-card">
            <div className="stat-label"><Icon size={12} style={{ display: 'inline', marginRight: 4 }} />{label}</div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Trend */}
          <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
            <div className="chart-title">Time trend <span className="chart-subtitle">(hours per day)</span></div>
            {trend.length === 0 ? <div className="empty-state" style={{ padding: '24px 0' }}><div className="empty-state-title">No data for this range</div></div> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trend.map((p) => ({ ...p, hours: +(p.seconds / 3600).toFixed(2) }))}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c6af7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c6af7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#52525b' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#52525b' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v}h`, 'Time']} />
                  <Area type="monotone" dataKey="hours" stroke="#7c6af7" strokeWidth={2} fill="url(#areaGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Distribution */}
          <div className="chart-card">
            <div className="chart-title">Activity breakdown</div>
            {distribution.length === 0 ? <div className="empty-state" style={{ padding: '24px 0' }}><div className="empty-state-title">No data</div></div> : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={distribution} dataKey="seconds" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={38}>
                      {distribution.map((entry, i) => <Cell key={entry.id} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [formatDuration(v), 'Time']} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {distribution.slice(0, 5).map((d, i) => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color || CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                      <span style={{ flex: 1, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{formatDuration(d.seconds)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Peak hours */}
          <div className="chart-card">
            <div className="chart-title">Peak hours</div>
            {insights && (
              <>
                <div className="heatmap" style={{ marginBottom: 12 }}>
                  {insights.hourlySeconds.map((s, h) => (
                    <div key={h} className="heatmap-bar">
                      <div className="heatmap-fill" style={{ height: 60, background: `rgba(124,106,247,${0.1 + (s / maxHour) * 0.9})`, minHeight: 4 }} title={`${formatHour(h)}: ${formatDuration(s)}`} />
                      {h % 3 === 0 && <span className="heatmap-label">{formatHour(h)}</span>}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>{insights.focusScore}%</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Focus score</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>{formatHour(insights.peakHour)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Peak hour</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--success)' }}>{formatDuration(insights.totalFocusedSeconds)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Deep focus</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Timeline */}
          <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
            <div className="chart-title">Today's timeline</div>
            {timeline.length === 0 ? <div className="empty-state" style={{ padding: '24px 0' }}><div className="empty-state-title">No sessions today</div></div> : (
              <div className="timeline">
                {timeline.map((item) => {
                  const start = new Date(item.startedAt);
                  const end = item.stoppedAt ? new Date(item.stoppedAt) : new Date();
                  return (
                    <div key={item.id} className="timeline-item">
                      <span className="timeline-dot" style={{ background: item.activityColor || 'var(--accent)' }} />
                      <span className="timeline-name">{item.activityName}</span>
                      <span className="timeline-time">
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {item.isRunning ? 'now' : end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="timeline-dur">{item.durationSeconds ? formatDuration(item.durationSeconds) : '…'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
