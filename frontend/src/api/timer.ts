import api from './client';
import { TimerStatusResponse } from '../types';

export const getTimerStatus = async (): Promise<TimerStatusResponse> => {
  const { data } = await api.get('/timer/status');
  return data;
};

export const startTimer = async (activityId: string): Promise<TimerStatusResponse> => {
  const { data } = await api.post('/timer/start', { activityId });
  return data;
};

export const stopTimer = async (): Promise<TimerStatusResponse> => {
  const { data } = await api.post('/timer/stop');
  return data;
};

export const sendHeartbeat = async (): Promise<{ ok: boolean; timestamp: string }> => {
  const { data } = await api.post('/timer/heartbeat');
  return data;
};

export const switchTimer = async (activityId: string): Promise<TimerStatusResponse> => {
  const { data } = await api.post('/timer/switch', { activityId });
  return data;
};
