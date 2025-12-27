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
    // Don't handle 401s in the interceptor - let individual components handle them
    // The ProtectedRoute will handle redirecting to login based on auth state
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
