import {
  CalendarClock,
  CreditCard,
  PackageX,
  Receipt,
  Settings,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Notification, NotificationType } from "./types";
import { formatRelativeTime } from "./utils";

const TYPE_META: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  APPOINTMENT: { icon: CalendarClock, className: "bg-primary/10 text-primary" },
  ORDER: { icon: Receipt, className: "bg-amber-500/10 text-amber-600" },
  PAYMENT: { icon: CreditCard, className: "bg-emerald-500/10 text-emerald-600" },
  TREATMENT: { icon: Stethoscope, className: "bg-blue-500/10 text-blue-600" },
  INVENTORY: { icon: PackageX, className: "bg-orange-500/10 text-orange-600" },
  SYSTEM: { icon: Settings, className: "bg-muted text-muted-foreground" },
};

interface NotificationItemProps {
  notification: Notification;
  onClick: (id: string) => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { icon: Icon, className } = TYPE_META[notification.type];

  return (
    <button
      type="button"
      onClick={() => onClick(notification.id)}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-muted",
        !notification.isRead && "bg-accent/40"
      )}
    >
      <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full", className)}>
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-medium text-foreground">{notification.title}</span>
          {!notification.isRead && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />}
        </span>
        <span className="line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">
          {notification.message}
        </span>
        <span className="text-[11.5px] text-muted-foreground/80">
          {formatRelativeTime(notification.createdAt)}
        </span>
      </span>
    </button>
  );
}
