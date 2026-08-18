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

export type PaginationMeta = {
  total: number;
  page: number;
  pageSize: number;
};

/** Payload cho endpoint danh sách có phân trang phía server: `{ data, meta }`. */
export type Paginated<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ListParams = {
  searchKey?: string;
  page?: number;
  pageSize?: number;
  /** Lọc theo khoảng ngày (ISO). VD /appointments dùng để lấy lịch theo tuần/ngày. */
  startDate?: string;
  endDate?: string;
};

/** Chuẩn hóa query cho endpoint danh sách; bỏ qua field rỗng/không truyền. */
export function listQuery(params: ListParams = {}): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  if (params.searchKey?.trim()) query.searchKey = params.searchKey.trim();
  if (params.page) query.page = params.page;
  if (params.pageSize) query.pageSize = params.pageSize;
  if (params.startDate) query.startDate = params.startDate;
  if (params.endDate) query.endDate = params.endDate;
  return query;
}

/**
 * Chuẩn hóa payload danh sách về `{ data, meta }`, chấp nhận cả 3 kiểu response
 * mà backend có thể trả:
 *  1. `data: { data: T[], meta }` — đã phân trang, lồng trong `data` (như /patient).
 *  2. `data: T[]` + `meta` cùng cấp trong envelope.
 *  3. `data: T[]` — mảng thuần (endpoint chưa phân trang, theo docs cũ).
 * Với kiểu 3 thì tổng số suy ra từ độ dài mảng để bảng vẫn hiển thị đúng.
 */
export function normalizePaginated<T>(
  envelope: ApiEnvelope<Paginated<T> | T[]> & { meta?: PaginationMeta }
): Paginated<T> {
  const payload = envelope.data;
  if (Array.isArray(payload)) {
    const meta =
      envelope.meta ??
      ({ total: payload.length, page: 1, pageSize: payload.length || 20 } satisfies PaginationMeta);
    return { data: payload, meta };
  }
  return payload;
}

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
