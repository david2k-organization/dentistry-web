import {
  api,
  normalizePaginated,
  type ApiEnvelope,
  type Paginated,
} from "@/lib/api";
import type { Notification, NotificationType } from "./types";

const BASE = "/notifications";

export type NotificationListParams = {
  page?: number;
  pageSize?: number;
  /** Tìm gần đúng theo `title` / `message` (không phân biệt hoa/thường). */
  searchKey?: string;
  type?: NotificationType;
  isRead?: boolean;
};

/**
 * Danh sách thông báo của người dùng hiện tại (JWT), phân trang, mới nhất trước.
 */
export async function getNotifications(
  params: NotificationListParams = {},
): Promise<Paginated<Notification>> {
  const query: Record<string, string | number | boolean> = {};
  if (params.page) query.page = params.page;
  if (params.pageSize) query.pageSize = params.pageSize;
  if (params.searchKey?.trim()) query.searchKey = params.searchKey.trim();
  if (params.type) query.type = params.type;
  if (params.isRead !== undefined) query.isRead = params.isRead;
  const res = await api.get<ApiEnvelope<Paginated<Notification> | Notification[]>>(
    BASE,
    { params: query },
  );
  return normalizePaginated(res.data);
}

/** Chi tiết một thông báo. Trả `null` nếu không tồn tại. */
export async function getNotification(id: string): Promise<Notification | null> {
  const res = await api.get<ApiEnvelope<Notification | null>>(`${BASE}/${id}`);
  return res.data.data;
}

/** Đánh dấu đã đọc / chưa đọc. Trả về thông báo sau khi cập nhật. */
export async function markNotificationRead(
  id: string,
  isRead = true,
): Promise<Notification> {
  const res = await api.put<ApiEnvelope<Notification>>(`${BASE}/${id}`, {
    isRead,
  });
  return res.data.data;
}

/**
 * Đánh dấu đã đọc hàng loạt. Backend không có endpoint bulk nên gọi PUT lần lượt
 * cho từng id (thường chỉ truyền các id chưa đọc).
 */
export async function markNotificationsRead(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => markNotificationRead(id, true)));
}

/** Xoá một thông báo. */
export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}
