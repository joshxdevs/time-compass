import { useState, useEffect, useCallback } from 'react';
import * as activitiesApi from '../api/activities';
import { Activity } from '../types';

export const useActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tree, setTree] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await activitiesApi.getActivities();
      setActivities(data.activities);
      setTree(data.tree);
    } catch {
      setError('Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const createActivity = async (name: string, parentId?: string, color?: string) => {
    const activity = await activitiesApi.createActivity({ name, parentId, color });
    await fetchActivities();
    return activity;
  };

  const updateActivity = async (
    id: string,
    payload: { name?: string; parentId?: string | null; color?: string; order?: number }
  ) => {
    await activitiesApi.updateActivity(id, payload);
    await fetchActivities();
  };

  const deleteActivity = async (id: string) => {
    await activitiesApi.deleteActivity(id);
    await fetchActivities();
  };

  const mergeActivities = async (sourceId: string, targetId: string) => {
    await activitiesApi.mergeActivities(sourceId, targetId);
    await fetchActivities();
  };

  return {
    activities,
    tree,
    isLoading,
    error,
    refetch: fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    mergeActivities,
  };
};

// Flatten tree for dropdown use
export const flattenTree = (activities: Activity[], depth = 0): Array<Activity & { depth: number }> => {
  const result: Array<Activity & { depth: number }> = [];
  for (const activity of activities) {
    result.push({ ...activity, depth });
    if (activity.children && activity.children.length > 0) {
      result.push(...flattenTree(activity.children, depth + 1));
    }
  }
  return result;
};
