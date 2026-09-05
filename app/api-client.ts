"use client";

import axios, { InternalAxiosRequestConfig } from "axios";
import { getAccessToken, refreshSession, logout } from "../lib/auth";

type RetryableRequestConfig = InternalAxiosRequestConfig<unknown> & {
  __isRetry?: boolean;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const isAuthRoute = (url?: string) =>
  Boolean(url && ["/auth/login", "/auth/refresh", "/auth/logout"].some((route) => url.includes(route)));

let refreshing = false;
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const config = error.config as RetryableRequestConfig | undefined;
    if (!config || isAuthRoute(config.url)) return Promise.reject(error);

    if (error.response?.status === 401 && !config.__isRetry && !refreshing) {
      refreshing = true;
      try {
        await refreshSession();
        config.__isRetry = true;
        return await api.request(config);
      } catch {
        await logout({ notifyOnNetworkError: false });
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
