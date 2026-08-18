import { useCallback, useEffect, useState } from "react";
import { Bell, LogOut, Menu, Plus, Search, Settings, User } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearTokens } from "@/features/auth/auth-storage";
import { NotificationPanel } from "@/features/notifications/NotificationPanel";
import {
  getNotifications,
  markNotificationRead,
  markNotificationsRead,
} from "@/features/notifications/api";
import { useNotificationSocket } from "@/features/notifications/useNotificationSocket";
import type { Notification } from "@/features/notifications/types";

const TITLES: { match: (path: string) => boolean; title: string }[] = [
  { match: (p) => p === "/", title: "Tổng quan" },
  { match: (p) => p.startsWith("/appointments"), title: "Lịch hẹn" },
  { match: (p) => p.startsWith("/patients"), title: "Bệnh nhân" },
  { match: (p) => p.startsWith("/tooth-chart"), title: "Sơ đồ răng" },
  { match: (p) => p.startsWith("/service-categories"), title: "Danh mục dịch vụ" },
  { match: (p) => p.startsWith("/services"), title: "Dịch vụ" },
  { match: (p) => p.startsWith("/invoices"), title: "Hóa đơn" },
  { match: (p) => p.startsWith("/payments"), title: "Thanh toán" },
  { match: (p) => p.startsWith("/inventory"), title: "Kho vật tư" },
  { match: (p) => p.startsWith("/staff"), title: "Nhân sự" },
  { match: (p) => p.startsWith("/roles"), title: "Vai trò & phân quyền" },
  { match: (p) => p.startsWith("/reports"), title: "Báo cáo" },
];

function useScreenTitle() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return TITLES.find((t) => t.match(pathname))?.title ?? "Tổng quan";
}

const todayLabel = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}).format(new Date());

export function AppHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const navigate = useNavigate();
  const screenTitle = useScreenTitle();
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    let active = true;
    getNotifications({ pageSize: 50 })
      .then((res) => {
        if (active) setNotifications(res.data);
      })
      .catch(() => {
        if (active) toast.error("Không tải được thông báo");
      })
      .finally(() => {
        if (active) setNotifLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Realtime: prepend notification mới đẩy qua socket + toast (bỏ qua nếu trùng id).
  const handleIncoming = useCallback((notification: Notification) => {
    setNotifications((prev) =>
      prev.some((n) => n.id === notification.id) ? prev : [notification, ...prev],
    );
    toast(notification.title, { description: notification.message });
  }, []);
  useNotificationSocket(handleIncoming);

  const handleLogout = () => {
    clearTokens();
    navigate({ to: "/login" });
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const now = new Date().toISOString();
    const prev = notifications;
    setNotifications((list) =>
      list.map((n) => (n.isRead ? n : { ...n, isRead: true, readAt: now })),
    );
    try {
      await markNotificationsRead(unreadIds);
    } catch {
      setNotifications(prev);
      toast.error("Không đánh dấu đã đọc được");
    }
  };

  const handleNotificationClick = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.isRead) return;
    const now = new Date().toISOString();
    const prev = notifications;
    setNotifications((list) =>
      list.map((n) => (n.id === id ? { ...n, isRead: true, readAt: now } : n)),
    );
    try {
      await markNotificationRead(id, true);
    } catch {
      setNotifications(prev);
      toast.error("Không đánh dấu đã đọc được");
    }
  };

  return (
    <header className="flex h-[62px] shrink-0 items-center gap-2 border-b border-border bg-card px-4 sm:gap-4 sm:px-6">
      {/* Nút mở menu — chỉ trên mobile/tablet */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenSidebar}
        aria-label="Mở menu"
        className="shrink-0 lg:hidden"
      >
        <Menu />
      </Button>

      <div className="flex min-w-0 items-baseline gap-3">
        <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground sm:text-[17px]">
          {screenTitle}
        </h1>
        <span className="hidden text-[12.5px] capitalize text-muted-foreground md:inline">
          {todayLabel}
        </span>
      </div>

      <div className="flex-1" />

      {/* Ô tìm kiếm — ẩn trên màn hình nhỏ */}
      <div className="hidden w-[180px] items-center gap-2.5 rounded-[10px] border border-border bg-muted px-3 py-2 md:flex lg:w-[240px]">
        <Search className="size-[18px] shrink-0 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm bệnh nhân, SĐT…"
          className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Nút đặt hẹn — thu gọn thành icon trên mobile */}
      <Button
        className="shrink-0 gap-1.5"
        onClick={() => navigate({ to: "/appointments", search: { newAppt: true } })}
      >
        <Plus data-icon="inline-start" />
        <span className="hidden sm:inline">Đặt hẹn</span>
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Thông báo">
            <Bell />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive ring-2 ring-card" />
            )}
          </Button>
        </PopoverTrigger>
        <NotificationPanel
          notifications={notifications}
          loading={notifLoading}
          onMarkAllRead={handleMarkAllRead}
          onItemClick={handleNotificationClick}
        />
      </Popover>

      {/* Người dùng */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg p-1 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-8">
              <AvatarImage src="" alt="Ảnh đại diện" />
              <AvatarFallback className="bg-accent text-primary">MA</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User />
            Hồ sơ cá nhân
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings />
            Cài đặt
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
            <LogOut />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
