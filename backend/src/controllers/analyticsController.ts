import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as analyticsService from '../services/analyticsService';

const parseDateParam = (dateStr: string | undefined): Date => {
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
};

export const getSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const date = parseDateParam(req.query.date as string);
    const range = (req.query.range as string) || 'daily';

    let summary;
    switch (range) {
      case 'weekly':
        summary = await analyticsService.getWeeklySummary(userId, date);
        break;
      case 'monthly':
        summary = await analyticsService.getMonthlySummary(userId, date);
        break;
      case 'all':
        summary = await analyticsService.getAllTimeSummary(userId);
        break;
      default:
        summary = await analyticsService.getDailySummary(userId, date);
    }

    res.json(summary);
  } catch (err) {
    next(err);
  }
};

export const getDistribution = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const start = parseDateParam(req.query.start as string);
    const end = parseDateParam(req.query.end as string);

    // Default end of day
    if (!req.query.end) {
      end.setHours(23, 59, 59, 999);
    }

    const data = await analyticsService.getDistribution(userId, start, end);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const getTrend = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const start = parseDateParam(req.query.start as string);
    const end = parseDateParam(req.query.end as string);
    const groupBy = (req.query.groupBy as 'day' | 'week' | 'month') || 'day';

    if (!req.query.end) {
      end.setHours(23, 59, 59, 999);
    }

    const data = await analyticsService.getTrend(userId, start, end, groupBy);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const getTimeline = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const date = parseDateParam(req.query.date as string);
    const data = await analyticsService.getTimeline(userId, date);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const getInsights = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const start = parseDateParam(req.query.start as string);
    const end = parseDateParam(req.query.end as string);

    if (!req.query.end) {
      end.setHours(23, 59, 59, 999);
    }

    const data = await analyticsService.getInsights(userId, start, end);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
