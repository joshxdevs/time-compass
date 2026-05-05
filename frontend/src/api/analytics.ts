import api from './client';
import { SummaryData, DistributionItem, TrendPoint, TimelineItem, InsightsData } from '../types';

export const getSummary = async (range: 'daily' | 'weekly' | 'monthly' | 'all', date?: string): Promise<SummaryData> => {
  const { data } = await api.get('/analytics/summary', { params: { range, date } });
  return data;
};

export const getDistribution = async (start: string, end: string): Promise<DistributionItem[]> => {
  const { data } = await api.get('/analytics/distribution', { params: { start, end } });
  return data.data;
};

export const getTrend = async (
  start: string,
  end: string,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<TrendPoint[]> => {
  const { data } = await api.get('/analytics/trend', { params: { start, end, groupBy } });
  return data.data;
};

export const getTimeline = async (date?: string): Promise<TimelineItem[]> => {
  const { data } = await api.get('/analytics/timeline', { params: { date } });
  return data.data;
};

export const getInsights = async (start: string, end: string): Promise<InsightsData> => {
  const { data } = await api.get('/analytics/insights', { params: { start, end } });
  return data;
};
