"use client";
import axios from "axios";
import { getAccessToken, refreshSession, logout } from "../lib/auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const isAuthRoute = (url?: string) => {
  if (!url) return false;
  return url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');
};

let refreshing = false;
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { response, config } = error;
    if (!config || isAuthRoute(config.url)) return Promise.reject(error);

    if (response?.status === 401 && !config.__isRetry && !refreshing) {
      refreshing = true;
      try {
        await refreshSession();
        refreshing = false;
        config.__isRetry = true;
        return api(config);
      } catch {
        refreshing = false;
        await logout();
      }
    }
    return Promise.reject(error);
  },
);

export default api;
