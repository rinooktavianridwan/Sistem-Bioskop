import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './auth.context';
import type { User, LoginResponse } from '../types/model.type';
import axiosInstance from '../config/api.config';
import axios from 'axios';

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

type ApiWrapper<T> = {
  status_code?: number;
  message?: string;
  version?: string;
  data: T;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const raw = sessionStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  });
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('user');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setToken(token);
      } catch (error) {
        console.error('Error parsing user data:', error);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post<ApiWrapper<LoginResponse>>('/auth/login', { email, password });
      const payload = response.data?.data;
      if (!payload || !payload.token || !payload.user) {
        throw new Error('Invalid login response from server');
      }

      sessionStorage.setItem('token', payload.token);
      sessionStorage.setItem('user', JSON.stringify(payload.user));
      setUser(payload.user);
      setToken(payload.token);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Login failed');
      }
      throw new Error('Login failed');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      await axiosInstance.post('/auth/register', { name, email, password });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Registration failed');
      }
      throw new Error('Registration failed');
    }
  };

  const logout = () => {
    axiosInstance.post('/auth/logout').catch(() => {
    });

    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};