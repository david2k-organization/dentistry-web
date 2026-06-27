import { Bell, LogOut, Settings, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-end gap-1 border-b border-border bg-background px-4">
      {/* Thông báo */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label="Thông báo"
      >
        <Bell />
        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
      </Button>

      {/* Cài đặt */}
      <Button variant="ghost" size="icon" aria-label="Cài đặt">
        <Settings />
      </Button>

      <div className="mx-2 h-6 w-px bg-border" />

      {/* Người dùng */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg py-1 pr-2 pl-1 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar>
              <AvatarImage src="" alt="Ảnh đại diện" />
              <AvatarFallback>BS</AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start text-left sm:flex">
              <span className="text-sm leading-tight font-medium">
                BS. Nguyễn Văn A
              </span>
              <span className="text-xs leading-tight text-muted-foreground">
                Quản trị viên
              </span>
            </div>
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
          <DropdownMenuItem variant="destructive">
            <LogOut />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
