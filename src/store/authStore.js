import { create } from 'zustand';
import { authApi } from '../api';
import { queryClient } from '../utils/queryClient';

export const useAuthStore = create((set, get) => ({
  user: (() => {
    try { return JSON.parse(localStorage.getItem('ims_user')); } catch { return null; }
  })(),
  token: localStorage.getItem('ims_token'),
  isAuthenticated: !!localStorage.getItem('ims_token'),
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authApi.login(credentials);
      queryClient.clear();
      localStorage.removeItem('ims_query_cache');
      localStorage.setItem('ims_token', data.token);
      localStorage.setItem('ims_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
      return { success: true, user: data.user };
    } catch (err) {
      const error = err.response?.data?.error || 'Login failed. Please try again.';
      set({ error, loading: false });
      return { success: false, error };
    }
  },

  committeeLogin: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authApi.committeeLogin(credentials);
      queryClient.clear();
      localStorage.removeItem('ims_query_cache');
      localStorage.setItem('ims_token', data.token);
      localStorage.setItem('ims_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
      return { success: true, user: data.user };
    } catch (err) {
      const error = err.response?.data?.error || 'Login failed. Please try again.';
      set({ error, loading: false });
      return { success: false, error };
    }
  },

  logout: () => {
    queryClient.clear();
    localStorage.removeItem('ims_token');
    localStorage.removeItem('ims_user');
    // Clear cached query data so a new user doesn't see stale data from previous session
    localStorage.removeItem('ims_query_cache');
    set({ user: null, token: null, isAuthenticated: false });
  },

  refreshUser: async () => {
    try {
      const { data } = await authApi.getMe();
      localStorage.setItem('ims_user', JSON.stringify(data));
      set({ user: data });
    } catch {}
  },
}));

// Role helpers
export const isAdmin = (user) => user?.role === 'system_admin';
export const isImc = (user) => user?.role === 'imc';
export const isHod = (user) => user?.role === 'hod';
export const isMd = (user) => user?.role === 'head_management';
export const isEmployee = (user) => user?.role === 'employee';
