import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

const createSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().optional(),
  color: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.string().nullable().optional(),
  color: z.string().optional(),
  order: z.number().optional(),
});

const mergeSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
});

// Build nested activity tree
const buildTree = (activities: any[], parentId: string | null = null): any[] => {
  return activities
    .filter((a) => a.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map((a) => ({ ...a, children: buildTree(activities, a.id) }));
};

export const getActivities = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const activities = await prisma.activity.findMany({
      where: { userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    const tree = buildTree(activities);
    res.json({ activities, tree });
  } catch (err) {
    next(err);
  }
};

export const createActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return next(createError(parsed.error.errors[0].message, 400));

    const { name, parentId, color } = parsed.data;

    if (parentId) {
      const parent = await prisma.activity.findFirst({ where: { id: parentId, userId } });
      if (!parent) return next(createError('Parent activity not found', 404));
    }

    // Get max order for siblings
    const siblings = await prisma.activity.findMany({
      where: { userId, parentId: parentId || null },
      orderBy: { order: 'desc' },
      take: 1,
    });
    const order = siblings.length > 0 ? siblings[0].order + 1 : 0;

    const activity = await prisma.activity.create({
      data: { userId, name, parentId, color, order },
    });

    res.status(201).json({ activity });
  } catch (err) {
    next(err);
  }
};

export const updateActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const existing = await prisma.activity.findFirst({ where: { id, userId } });
    if (!existing) return next(createError('Activity not found', 404));

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return next(createError(parsed.error.errors[0].message, 400));

    const activity = await prisma.activity.update({
      where: { id },
      data: parsed.data,
    });

    res.json({ activity });
  } catch (err) {
    next(err);
  }
};

export const deleteActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const existing = await prisma.activity.findFirst({ where: { id, userId } });
    if (!existing) return next(createError('Activity not found', 404));

    // Re-parent children to parent of deleted activity
    await prisma.activity.updateMany({
      where: { parentId: id, userId },
      data: { parentId: existing.parentId },
    });

    await prisma.activity.delete({ where: { id: id } });

    res.json({ message: 'Activity deleted' });
  } catch (err) {
    next(err);
  }
};

export const mergeActivities = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const parsed = mergeSchema.safeParse(req.body);
    if (!parsed.success) return next(createError(parsed.error.errors[0].message, 400));

    const { sourceId, targetId } = parsed.data;
    if (sourceId === targetId) return next(createError('Cannot merge activity with itself', 400));

    const [source, target] = await Promise.all([
      prisma.activity.findFirst({ where: { id: sourceId, userId } }),
      prisma.activity.findFirst({ where: { id: targetId, userId } }),
    ]);

    if (!source) return next(createError('Source activity not found', 404));
    if (!target) return next(createError('Target activity not found', 404));

    // Re-assign all sessions from source to target
    await prisma.timeSession.updateMany({
      where: { activityId: sourceId, userId },
      data: { activityId: targetId },
    });

    // Re-parent children of source to target
    await prisma.activity.updateMany({
      where: { parentId: sourceId, userId },
      data: { parentId: targetId },
    });

    await prisma.activity.delete({ where: { id: sourceId } });

    res.json({ message: 'Activities merged', target });
  } catch (err) {
    next(err);
  }
};
