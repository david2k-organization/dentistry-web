/** Loại thông báo — khớp enum backend (xem docs/api/notifications.md). */
export type NotificationType =
  | "SYSTEM"
  | "APPOINTMENT"
  | "ORDER"
  | "TREATMENT"
  | "INVENTORY"
  | "PAYMENT";

/** Kênh gửi thông báo. Frontend hiện chỉ hiển thị kênh `IN_APP`. */
export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS" | "PUSH";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  entityType: string | null;
  entityId: string | null;
  channel: NotificationChannel;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
