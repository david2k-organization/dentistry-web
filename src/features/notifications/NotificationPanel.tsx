import { useState } from "react";
import { BellOff, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { PopoverContent } from "@/components/ui/popover";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "./types";

type FilterKey = "all" | "unread";

interface NotificationPanelProps {
  notifications: Notification[];
  loading?: boolean;
  onMarkAllRead: () => void;
  onItemClick: (id: string) => void;
}

export function NotificationPanel({
  notifications,
  loading = false,
  onMarkAllRead,
  onItemClick,
}: NotificationPanelProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const visibleNotifications = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <PopoverContent align="end" sideOffset={10} className="w-[360px] gap-0 p-0">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-semibold text-foreground">Thông báo</h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] leading-none font-medium text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-[12px] font-medium text-primary hover:underline"
          >
            Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 px-3 pt-2.5">
        {(["all", "unread"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors",
              filter === key
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {key === "all" ? "Tất cả" : `Chưa đọc${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
          </button>
        ))}
      </div>

      <div className="mt-1.5 max-h-[360px] overflow-y-auto px-1.5 pb-1.5">
        {loading ? (
          <div className="flex items-center justify-center px-4 py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground/60" />
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <BellOff className="size-7 text-muted-foreground/60" />
            <p className="text-[12.5px] text-muted-foreground">
              {filter === "unread" ? "Không có thông báo chưa đọc" : "Chưa có thông báo nào"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {visibleNotifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} onClick={onItemClick} />
            ))}
          </div>
        )}
      </div>
    </PopoverContent>
  );
}
