import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Settings,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Tags,
  Users,
  UsersRound,
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
  badge?: string;
};

const navItems: NavItem[] = [
  { label: "Tổng quan", to: "/", icon: LayoutDashboard },
  { label: "Lịch hẹn", to: "/appointments", icon: CalendarDays },
  { label: "Bệnh nhân", to: "/patients", icon: Users },
  { label: "Sơ đồ răng", to: "/tooth-chart", icon: Stethoscope },
  { label: "Danh mục dịch vụ", to: "/service-categories", icon: Tags },
  { label: "Dịch vụ", to: "/services", icon: Syringe },
  { label: "Hóa đơn", to: "/invoices", icon: Receipt },
  { label: "Kho vật tư", to: "/inventory", icon: Package },
  { label: "Nhân sự", to: "/staff", icon: UsersRound },
  { label: "Vai trò & phân quyền", to: "/roles", icon: ShieldCheck },
  { label: "Báo cáo", to: "/reports", icon: BarChart3 },
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
          collapsed ? "w-[68px] px-2 py-5" : "w-[244px] px-3.5 py-5"
        )}
      >
        {/* Logo + tên phòng khám */}
        <div
          className={cn(
            "flex items-center gap-3 px-2 pb-5",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] bg-primary text-primary-foreground">
            <Stethoscope className="size-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[14.5px] font-semibold tracking-tight text-foreground">
                Nha Khoa Pasteur
              </div>
              <div className="truncate text-[11.5px] text-muted-foreground">
                Quản lý phòng khám
              </div>
            </div>
          )}
        </div>

        {/* Nút thu gọn / mở rộng */}
        <div className={cn("mb-1 flex", collapsed ? "justify-center" : "justify-end")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggle}
                aria-label={collapsed ? "Mở rộng menu" : "Thu nhỏ menu"}
                className="text-muted-foreground"
              >
                {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Mở rộng menu" : "Thu nhỏ menu"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Menu điều hướng */}
        <nav className="flex flex-1 flex-col gap-[3px] overflow-y-auto">
          {navItems.map((item) => (
            <SidebarNavLink key={item.to} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Hồ sơ người dùng */}
        <div
          className={cn(
            "mt-2 flex items-center gap-2.5 border-t border-sidebar-border pt-3.5",
            collapsed && "justify-center"
          )}
        >
          <div className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-primary">
            MA
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12.5px] font-semibold text-foreground">
                  BS. Lê Minh Anh
                </div>
                <div className="text-[11px] text-muted-foreground">Chủ phòng khám</div>
              </div>
              <Settings className="size-[19px] shrink-0 text-muted-foreground" />
            </>
          )}
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
        "flex h-[38px] items-center gap-[11px] rounded-[10px] px-[11px] text-[13.5px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&.active]:bg-sidebar-accent [&.active]:font-semibold [&.active]:text-sidebar-accent-foreground",
        collapsed && "justify-center px-0"
      )}
      activeOptions={{ exact: item.to === "/" }}
    >
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="rounded-full bg-primary px-1.5 py-px text-[11px] font-semibold text-primary-foreground">
          {item.badge}
        </span>
      )}
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
