import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// Envelope response chung của backend (TransformInterceptor)
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
  const token = localStorage.getItem("accessToken");
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
      // TODO: gọi endpoint /auth/refresh để lấy access token mới
      // Hoặc redirect về /login
      localStorage.removeItem("accessToken");
    }
    return Promise.reject(error);
  }
);