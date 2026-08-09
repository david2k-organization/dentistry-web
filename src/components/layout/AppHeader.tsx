import { useState } from "react";
import { Bell, LogOut, Plus, Search, Settings, User } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

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
import { mockNotifications } from "@/features/notifications/data";

const TITLES: { match: (path: string) => boolean; title: string }[] = [
  { match: (p) => p === "/", title: "Tổng quan" },
  { match: (p) => p.startsWith("/appointments"), title: "Lịch hẹn" },
  { match: (p) => p.startsWith("/patients"), title: "Bệnh nhân" },
  { match: (p) => p.startsWith("/treatments"), title: "Điều trị" },
  { match: (p) => p.startsWith("/service-categories"), title: "Danh mục dịch vụ" },
  { match: (p) => p.startsWith("/services"), title: "Dịch vụ" },
  { match: (p) => p.startsWith("/invoices"), title: "Hóa đơn" },
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

export function AppHeader() {
  const navigate = useNavigate();
  const screenTitle = useScreenTitle();
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    clearTokens();
    navigate({ to: "/login" });
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <header className="flex h-[62px] shrink-0 items-center gap-4 border-b border-border bg-card px-6">
      <div className="flex items-baseline gap-3">
        <h1 className="text-[17px] font-semibold tracking-tight text-foreground">
          {screenTitle}
        </h1>
        <span className="text-[12.5px] capitalize text-muted-foreground">{todayLabel}</span>
      </div>

      <div className="flex-1" />

      {/* Ô tìm kiếm */}
      <div className="flex w-[260px] items-center gap-2.5 rounded-[10px] border border-border bg-muted px-3 py-2">
        <Search className="size-[18px] shrink-0 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm bệnh nhân, SĐT…"
          className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Nút đặt hẹn */}
      <Button
        className="gap-1.5"
        onClick={() => navigate({ to: "/appointments", search: { newAppt: true } })}
      >
        <Plus data-icon="inline-start" />
        Đặt hẹn
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
