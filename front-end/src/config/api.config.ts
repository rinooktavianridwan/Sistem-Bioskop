import axios, { AxiosHeaders, type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: new AxiosHeaders({
    'Content-Type': 'application/json',
  }),
});

// Interceptors
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers = config.headers || new AxiosHeaders();
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  async (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;