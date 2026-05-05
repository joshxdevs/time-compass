import api from './client';
import { AuthResponse } from '../types';

export const register = async (email: string, password: string, name: string): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/register', { email, password, name });
  return data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
};

export const logout = async (refreshToken: string) => {
  await api.post('/auth/logout', { refreshToken });
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data.user;
};
