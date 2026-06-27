import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { label: "Tổng quan", to: "/", icon: LayoutDashboard },
  { label: "Bệnh nhân", to: "/patients", icon: Users },
  { label: "Lịch hẹn", to: "/appointments", icon: CalendarDays },
  { label: "Điều trị", to: "/treatments", icon: Stethoscope },
  { label: "Hóa đơn", to: "/invoices", icon: Receipt },
  { label: "Hồ sơ", to: "/records", icon: FileText },
];

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        data-collapsed={collapsed}
        className={cn(
          "flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center gap-2 border-b border-sidebar-border px-3",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Stethoscope className="size-5" />
          </div>
          {!collapsed && (
            <>
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-semibold">
                  Dental Clinic
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Quản lý nha khoa
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggle}
                aria-label="Thu nhỏ menu"
              >
                <PanelLeftClose />
              </Button>
            </>
          )}
        </div>

        {/* Expand toggle (collapsed state) */}
        {collapsed && (
          <div className="flex justify-center py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onToggle}
                  aria-label="Mở rộng menu"
                >
                  <PanelLeftOpen />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Mở rộng menu</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {navItems.map((item) => (
            <SidebarNavLink key={item.to} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2">
          <SidebarLogout collapsed={collapsed} />
        </div>
      </aside>
    </TooltipProvider>
  );
}

function SidebarNavLink({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      to={item.to}
      className={cn(
        "flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&.active]:bg-sidebar-accent [&.active]:font-semibold [&.active]:text-sidebar-accent-foreground",
        collapsed && "justify-center px-0"
      )}
      activeOptions={{ exact: item.to === "/" }}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function SidebarLogout({ collapsed }: { collapsed: boolean }) {
  const handleLogout = () => {
    // TODO: kết nối với luồng xác thực thực tế
    console.log("Đăng xuất");
  };

  const button = (
    <Button
      variant="ghost"
      onClick={handleLogout}
      aria-label="Đăng xuất"
      className={cn(
        "w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-destructive/10 hover:text-destructive",
        collapsed && "justify-center px-0"
      )}
    >
      <LogOut className="size-4 shrink-0" />
      {!collapsed && <span>Đăng xuất</span>}
    </Button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">Đăng xuất</TooltipContent>
    </Tooltip>
  );
}
