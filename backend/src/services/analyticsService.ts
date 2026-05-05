import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDailySummary = async (userId: string, date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return getSummaryForRange(userId, start, end);
};

export const getWeeklySummary = async (userId: string, date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return getSummaryForRange(userId, start, end);
};

export const getMonthlySummary = async (userId: string, date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return getSummaryForRange(userId, start, end);
};

export const getAllTimeSummary = async (userId: string) => {
  return getSummaryForRange(userId, new Date(0), new Date());
};

const getSummaryForRange = async (userId: string, start: Date, end: Date) => {
  const sessions = await prisma.timeSession.findMany({
    where: {
      userId,
      startedAt: { gte: start, lte: end },
      stoppedAt: { not: null },
    },
    include: { activity: true },
  });

  const totalSeconds = sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  const totalSessions = sessions.length;
  const avgSessionSeconds = totalSessions > 0 ? Math.floor(totalSeconds / totalSessions) : 0;

  return { totalSeconds, totalSessions, avgSessionSeconds, start, end };
};

export const getDistribution = async (userId: string, start: Date, end: Date) => {
  const sessions = await prisma.timeSession.findMany({
    where: {
      userId,
      startedAt: { gte: start, lte: end },
      stoppedAt: { not: null },
    },
    include: { activity: { include: { parent: true } } },
  });

  const activityMap: Record<string, { name: string; seconds: number; color: string | null; parentName?: string }> = {};

  for (const session of sessions) {
    const key = session.activityId;
    if (!activityMap[key]) {
      activityMap[key] = {
        name: session.activity.name,
        seconds: 0,
        color: session.activity.color,
        parentName: session.activity.parent?.name,
      };
    }
    activityMap[key].seconds += session.durationSeconds || 0;
  }

  return Object.entries(activityMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.seconds - a.seconds);
};

export const getTrend = async (userId: string, start: Date, end: Date, groupBy: 'day' | 'week' | 'month') => {
  const sessions = await prisma.timeSession.findMany({
    where: {
      userId,
      startedAt: { gte: start, lte: end },
      stoppedAt: { not: null },
    },
    orderBy: { startedAt: 'asc' },
  });

  const grouped: Record<string, number> = {};

  for (const session of sessions) {
    let key: string;
    const d = session.startedAt;
    if (groupBy === 'day') {
      key = d.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      const weekStart = new Date(d);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    grouped[key] = (grouped[key] || 0) + (session.durationSeconds || 0);
  }

  return Object.entries(grouped)
    .map(([date, seconds]) => ({ date, seconds }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const getTimeline = async (userId: string, date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const sessions = await prisma.timeSession.findMany({
    where: {
      userId,
      startedAt: { gte: start, lte: end },
    },
    include: { activity: true },
    orderBy: { startedAt: 'asc' },
  });

  return sessions.map((s) => ({
    id: s.id,
    activityId: s.activityId,
    activityName: s.activity.name,
    activityColor: s.activity.color,
    startedAt: s.startedAt,
    stoppedAt: s.stoppedAt,
    durationSeconds: s.durationSeconds,
    isRunning: !s.stoppedAt,
  }));
};

export const getInsights = async (userId: string, start: Date, end: Date) => {
  const sessions = await prisma.timeSession.findMany({
    where: {
      userId,
      startedAt: { gte: start, lte: end },
      stoppedAt: { not: null },
    },
    include: { activity: true },
  });

  // Productive hours heatmap (0-23)
  const hourlySeconds: number[] = Array(24).fill(0);
  let totalFocusedSeconds = 0; // sessions > 25 min
  let totalFragmentedSeconds = 0; // sessions < 5 min

  for (const session of sessions) {
    const hour = session.startedAt.getHours();
    const dur = session.durationSeconds || 0;
    hourlySeconds[hour] += dur;

    if (dur >= 1500) totalFocusedSeconds += dur;
    else if (dur < 300) totalFragmentedSeconds += dur;
  }

  const totalSeconds = sessions.reduce((s, sess) => s + (sess.durationSeconds || 0), 0);
  const focusScore = totalSeconds > 0
    ? Math.round((totalFocusedSeconds / totalSeconds) * 100)
    : 0;

  const peakHour = hourlySeconds.indexOf(Math.max(...hourlySeconds));

  return {
    hourlySeconds,
    peakHour,
    focusScore,
    totalFocusedSeconds,
    totalFragmentedSeconds,
    totalSessions: sessions.length,
  };
};
