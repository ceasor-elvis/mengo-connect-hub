import axios from 'axios';
import { setupMockApi } from './mockApi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Conditionally setup mock API for local development
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  console.log("Initializing Mock API for Local Environment");
  setupMockApi(api);
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If we get a 401 Unauthorized and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/token/') {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${API_URL}/token/refresh/`, { refresh: refreshToken });
          if (res.data.access) {
            localStorage.setItem('access_token', res.data.access);
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh token failed, clear auth and redirect payload
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
