import { createColumnHelper } from "@tanstack/react-table";
import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Role } from "@/features/roles/types";
import type { User } from "./types";

const columnHelper = createColumnHelper<User>();

/** Chữ cái đầu của họ tên, dùng cho avatar chữ. */
function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  const last = parts[parts.length - 1][0] ?? "";
  const first = parts[0][0] ?? "";
  return (parts.length === 1 ? first : first + last).toUpperCase();
}

export function roleNameOf(user: User, roles: Role[]): string | null {
  if (user.role?.name) return user.role.name;
  return roles.find((r) => r.id === user.roleId)?.name ?? null;
}

export function createUserColumns(
  roles: Role[],
  onAssignRole: (user: User) => void,
) {
  return [
    columnHelper.accessor("fullName", {
      header: "Nhân sự",
      cell: (info) => {
        const user = info.row.original;
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-semibold text-primary">
              {initials(user.fullName)}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate font-medium text-foreground">
                {user.fullName}
              </div>
              <div className="truncate text-[11.5px] text-muted-foreground">
                @{user.userName}
              </div>
            </div>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "contact",
      header: "Liên hệ",
      cell: (info) => {
        const user = info.row.original;
        return (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-foreground">{user.email || "—"}</div>
            <div className="truncate text-[11.5px] text-muted-foreground">
              {user.phone || "—"}
            </div>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "role",
      header: "Vai trò",
      cell: (info) => {
        const name = roleNameOf(info.row.original, roles);
        return name ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[11.5px] font-medium text-primary">
            <ShieldCheck className="size-3.5" />
            {name}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground">
            Chưa gán
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onAssignRole(info.row.original)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border border-[#dde8e7] bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-accent hover:text-primary",
            )}
          >
            <ShieldCheck className="size-4" />
            Phân quyền
          </button>
        </div>
      ),
    }),
  ];
}
