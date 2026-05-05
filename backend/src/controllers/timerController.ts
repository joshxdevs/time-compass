import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import * as timerService from '../services/timerService';

// SSE clients per user
export const sseClients: Map<string, Response[]> = new Map();

const notifyUser = (userId: string, data: object) => {
  const clients = sseClients.get(userId) || [];
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach((client) => {
    try {
      client.write(payload);
    } catch {
      // client disconnected
    }
  });
};

export const getStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const session = await timerService.getActiveSession(userId);

    if (!session) {
      return res.json({ isRunning: false, session: null });
    }

    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);

    res.json({
      isRunning: true,
      session: {
        id: session.id,
        activityId: session.activityId,
        activityName: session.activity.name,
        activityColor: session.activity.color,
        startedAt: session.startedAt,
        elapsedSeconds,
        lastHeartbeatAt: session.lastHeartbeatAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const startTimer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { activityId } = req.body;

    if (!activityId) return next(createError('activityId is required', 400));

    let session;
    try {
      session = await timerService.startSession(userId, activityId);
    } catch (err: any) {
      if (err.statusCode === 409) {
        return res.status(409).json({ error: err.message, existingSession: err.existingSession });
      }
      throw err;
    }

    const responseData = {
      isRunning: true,
      session: {
        id: session.id,
        activityId: session.activityId,
        activityName: session.activity.name,
        activityColor: session.activity.color,
        startedAt: session.startedAt,
        elapsedSeconds: 0,
        lastHeartbeatAt: session.lastHeartbeatAt,
      },
    };

    notifyUser(userId, { type: 'timer:start', ...responseData });
    res.status(201).json(responseData);
  } catch (err) {
    next(err);
  }
};

export const stopTimer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    let session;
    try {
      session = await timerService.stopSession(userId);
    } catch (err: any) {
      if (err.statusCode === 404) {
        return res.status(404).json({ error: err.message });
      }
      throw err;
    }

    const responseData = {
      isRunning: false,
      session: {
        id: session.id,
        activityId: session.activityId,
        activityName: session.activity.name,
        stoppedAt: session.stoppedAt,
        durationSeconds: session.durationSeconds,
      },
    };

    notifyUser(userId, { type: 'timer:stop', ...responseData });
    res.json(responseData);
  } catch (err) {
    next(err);
  }
};

export const heartbeatTimer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    try {
      await timerService.heartbeat(userId);
    } catch (err: any) {
      if (err.statusCode === 404) {
        return res.status(404).json({ error: err.message });
      }
      throw err;
    }

    res.json({ ok: true, timestamp: new Date() });
  } catch (err) {
    next(err);
  }
};

export const switchTimer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { activityId } = req.body;
    if (!activityId) return next(createError('activityId is required', 400));

    const session = await timerService.switchActivity(userId, activityId);

    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);

    const responseData = {
      isRunning: true,
      session: {
        id: session.id,
        activityId: session.activityId,
        activityName: session.activity.name,
        activityColor: session.activity.color,
        startedAt: session.startedAt,
        elapsedSeconds,
        lastHeartbeatAt: session.lastHeartbeatAt,
      },
    };

    notifyUser(userId, { type: 'timer:switch', ...responseData });
    res.json(responseData);
  } catch (err) {
    next(err);
  }
};

// SSE endpoint
export const timerStream = (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Add client
  const clients = sseClients.get(userId) || [];
  clients.push(res);
  sseClients.set(userId, clients);

  // Send initial ping
  res.write('data: {"type":"connected"}\n\n');

  // Keepalive every 25s
  const keepAlive = setInterval(() => {
    res.write(':keepalive\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    const remaining = (sseClients.get(userId) || []).filter((c) => c !== res);
    sseClients.set(userId, remaining);
  });
};
