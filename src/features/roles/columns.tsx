import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, ShieldCheck, Trash2 } from "lucide-react";

import { iconActionButtonClass } from "@/lib/utils";
import type { Role } from "./types";

const columnHelper = createColumnHelper<Role>();

export function createRoleColumns(
  onRequestEdit: (role: Role) => void,
  onRequestDelete: (role: Role) => void
) {
  return [
    columnHelper.accessor("name", {
      header: "Vai trò",
      cell: (info) => {
        const role = info.row.original;
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-primary">
              <ShieldCheck className="size-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate font-medium text-foreground">{role.name}</div>
              <div className="truncate text-[11.5px] text-muted-foreground">
                {role.description || "Chưa có mô tả"}
              </div>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("isActive", {
      header: "Trạng thái",
      cell: (info) =>
        info.getValue() ? (
          <span className="inline-flex items-center rounded-full bg-[#eef6f1] px-2.5 py-1 text-[11.5px] font-medium text-[#3f7a55]">
            Đang hoạt động
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground">
            Tạm khoá
          </span>
        ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const role = info.row.original;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              title="Sửa vai trò"
              onClick={() => onRequestEdit(role)}
              className={iconActionButtonClass()}
            >
              <Pencil className="size-4.25" />
            </button>
            <button
              type="button"
              title="Xoá vai trò"
              onClick={() => onRequestDelete(role)}
              className={iconActionButtonClass("danger")}
            >
              <Trash2 className="size-4.25" />
            </button>
          </div>
        );
      },
    }),
  ];
}
