import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

const prisma = new PrismaClient();

const HEARTBEAT_TIMEOUT = parseInt(process.env.HEARTBEAT_TIMEOUT_SECONDS || '60', 10);

export const getActiveSession = async (userId: string) => {
  return prisma.timeSession.findFirst({
    where: { userId, stoppedAt: null },
    include: { activity: true },
  });
};

export const startSession = async (userId: string, activityId: string) => {
  // Enforce single active timer: reject if one is already running
  const existing = await getActiveSession(userId);
  if (existing) {
    throw Object.assign(new Error('A timer is already running. Stop it first.'), {
      statusCode: 409,
      existingSession: existing,
    });
  }

  const now = new Date();
  return prisma.timeSession.create({
    data: {
      userId,
      activityId,
      startedAt: now,
      lastHeartbeatAt: now,
    },
    include: { activity: true },
  });
};

export const stopSession = async (userId: string) => {
  const session = await getActiveSession(userId);
  if (!session) {
    throw Object.assign(new Error('No active timer to stop.'), { statusCode: 404 });
  }

  const now = new Date();
  const durationSeconds = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);

  return prisma.timeSession.update({
    where: { id: session.id },
    data: {
      stoppedAt: now,
      durationSeconds,
    },
    include: { activity: true },
  });
};

export const heartbeat = async (userId: string) => {
  const session = await getActiveSession(userId);
  if (!session) {
    throw Object.assign(new Error('No active timer found.'), { statusCode: 404 });
  }

  return prisma.timeSession.update({
    where: { id: session.id },
    data: { lastHeartbeatAt: new Date() },
  });
};

export const switchActivity = async (userId: string, newActivityId: string) => {
  const session = await getActiveSession(userId);
  if (!session) {
    // No active session — start a new one
    return startSession(userId, newActivityId);
  }

  const now = new Date();
  const durationSeconds = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);

  // Stop current session
  await prisma.timeSession.update({
    where: { id: session.id },
    data: { stoppedAt: now, durationSeconds },
  });

  // Start new session
  return prisma.timeSession.create({
    data: {
      userId,
      activityId: newActivityId,
      startedAt: now,
      lastHeartbeatAt: now,
    },
    include: { activity: true },
  });
};

// Cron job: every 30 seconds, auto-stop sessions with stale heartbeats
export const startHeartbeatCron = () => {
  cron.schedule('*/30 * * * * *', async () => {
    const timeout = new Date(Date.now() - HEARTBEAT_TIMEOUT * 1000);

    const staleSessions = await prisma.timeSession.findMany({
      where: {
        stoppedAt: null,
        lastHeartbeatAt: { lt: timeout },
      },
    });

    for (const session of staleSessions) {
      const now = new Date();
      const durationSeconds = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);

      await prisma.timeSession.update({
        where: { id: session.id },
        data: { stoppedAt: now, durationSeconds },
      });

      console.log(`[Heartbeat] Auto-stopped stale session ${session.id} for user ${session.userId}`);
    }
  });

  console.log('[Heartbeat] Cron job started — checking every 30s for stale sessions');
};

export default prisma;
