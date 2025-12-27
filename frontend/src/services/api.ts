import axios from 'axios';
import { AuthStatus, UserProfile, CategoryWithApps } from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 for auth status checks - that's expected when not logged in
    const isAuthStatusCheck = error.config?.url?.includes('/auth/status');

    if (error.response?.status === 401 && !isAuthStatusCheck) {
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  checkStatus: async (): Promise<AuthStatus> => {
    const response = await api.get<AuthStatus>('/auth/status');
    return response.data;
  },

  login: () => {
    window.location.href = '/api/auth/login';
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};

export const userApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/user/profile');
    return response.data;
  },

  getGroups: async (): Promise<{ groups: string[] }> => {
    const response = await api.get<{ groups: string[] }>('/user/groups');
    return response.data;
  },
};

export const appsApi = {
  getApps: async (): Promise<{ categories: CategoryWithApps[] }> => {
    const response = await api.get<{ categories: CategoryWithApps[] }>('/apps');
    return response.data;
  },

  searchApps: async (query: string): Promise<{ results: any[] }> => {
    const response = await api.get(`/apps/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

export default api;
