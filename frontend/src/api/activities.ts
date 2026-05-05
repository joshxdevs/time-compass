import api from './client';
import { Activity } from '../types';

export const getActivities = async (): Promise<{ activities: Activity[]; tree: Activity[] }> => {
  const { data } = await api.get('/activities');
  return data;
};

export const createActivity = async (payload: {
  name: string;
  parentId?: string;
  color?: string;
}): Promise<Activity> => {
  const { data } = await api.post('/activities', payload);
  return data.activity;
};

export const updateActivity = async (
  id: string,
  payload: { name?: string; parentId?: string | null; color?: string; order?: number }
): Promise<Activity> => {
  const { data } = await api.patch(`/activities/${id}`, payload);
  return data.activity;
};

export const deleteActivity = async (id: string): Promise<void> => {
  await api.delete(`/activities/${id}`);
};

export const mergeActivities = async (sourceId: string, targetId: string): Promise<void> => {
  await api.post('/activities/merge', { sourceId, targetId });
};
