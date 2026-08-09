export type NotificationType = "appointment" | "invoice" | "inventory" | "patient" | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
}
