import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Wallet,
  Settings,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Tags,
  Users,
  UsersRound,
  X,
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
  { label: "Thanh toán", to: "/payments", icon: Wallet },
  { label: "Kho vật tư", to: "/inventory", icon: Package },
  { label: "Nhân sự", to: "/staff", icon: UsersRound },
  { label: "Vai trò & phân quyền", to: "/roles", icon: ShieldCheck },
  { label: "Báo cáo", to: "/reports", icon: BarChart3 },
];

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function AppSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: AppSidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      {/* Lớp phủ nền khi mở drawer trên mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      <aside
        data-collapsed={collapsed}
        className={cn(
          // Mobile: drawer cố định trượt ngang. Desktop (lg+): cột tĩnh trong flow.
          "fixed inset-y-0 left-0 z-50 flex h-screen w-[244px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3.5 py-5 text-sidebar-foreground transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:translate-x-0 lg:transition-[width]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed && "lg:w-[68px] lg:px-2"
        )}
      >
        {/* Logo + tên phòng khám */}
        <div
          className={cn(
            "flex items-center gap-3 px-2 pb-5",
            collapsed && "lg:justify-center lg:px-0"
          )}
        >
          <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] bg-primary text-primary-foreground">
            <Stethoscope className="size-5" />
          </div>
          <div className={cn("min-w-0 leading-tight", collapsed && "lg:hidden")}>
            <div className="truncate text-[14.5px] font-semibold tracking-tight text-foreground">
              Nha Khoa Pasteur
            </div>
            <div className="truncate text-[11.5px] text-muted-foreground">
              Quản lý phòng khám
            </div>
          </div>
          {/* Nút đóng drawer — chỉ hiện trên mobile */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMobileClose}
            aria-label="Đóng menu"
            className="ml-auto text-muted-foreground lg:hidden"
          >
            <X />
          </Button>
        </div>

        {/* Nút thu gọn / mở rộng — chỉ trên desktop */}
        <div
          className={cn(
            "mb-1 hidden lg:flex",
            collapsed ? "lg:justify-center" : "lg:justify-end"
          )}
        >
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
            <SidebarNavLink
              key={item.to}
              item={item}
              collapsed={collapsed}
              onNavigate={onMobileClose}
            />
          ))}
        </nav>

        {/* Hồ sơ người dùng */}
        <div
          className={cn(
            "mt-2 flex items-center gap-2.5 border-t border-sidebar-border pt-3.5",
            collapsed && "lg:justify-center"
          )}
        >
          <div className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-primary">
            MA
          </div>
          <div
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2.5",
              collapsed && "lg:hidden"
            )}
          >
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[12.5px] font-semibold text-foreground">
                BS. Lê Minh Anh
              </div>
              <div className="text-[11px] text-muted-foreground">Chủ phòng khám</div>
            </div>
            <Settings className="size-[19px] shrink-0 text-muted-foreground" />
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function SidebarNavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "flex h-[38px] items-center gap-[11px] rounded-[10px] px-[11px] text-[13.5px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&.active]:bg-sidebar-accent [&.active]:font-semibold [&.active]:text-sidebar-accent-foreground",
        collapsed && "lg:justify-center lg:px-0"
      )}
      activeOptions={{ exact: item.to === "/" }}
    >
      <Icon className="size-5 shrink-0" />
      <span className={cn("flex-1 truncate", collapsed && "lg:hidden")}>
        {item.label}
      </span>
      {item.badge && (
        <span
          className={cn(
            "rounded-full bg-primary px-1.5 py-px text-[11px] font-semibold text-primary-foreground",
            collapsed && "lg:hidden"
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );

  // Tooltip nhãn chỉ cần khi thu gọn trên desktop; mobile luôn hiện nhãn đầy đủ.
  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="hidden lg:block">
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}
