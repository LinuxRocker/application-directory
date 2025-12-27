import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '../services/api';
import { UserInfo } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserInfo | null;
  error: string | null;
  login: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await authApi.checkStatus();
      setIsAuthenticated(status.authenticated);
      setUser(status.user);
    } catch (err) {
      setError('Failed to check authentication status');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(() => {
    authApi.login();
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      setIsAuthenticated(false);
      setUser(null);
      window.location.href = '/login';
    } catch (err) {
      setError('Failed to logout');
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    error,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
