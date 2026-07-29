import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearTokens, getAccessToken } from "@/features/auth/auth-storage";

export type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp?: string;
  path?: string;
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  withCredentials: true, // gửi cookie (cho refresh token httpOnly)
  timeout: 15_000,
});

// Request interceptor — gắn JWT access token vào header
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — xử lý 401, redirect login, v.v.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearTokens();
      if (location.pathname !== "/login") {
        location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);
