import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ServiceCategory } from "./types";

const columnHelper = createColumnHelper<ServiceCategory>();

export function createServiceCategoryColumns(
  onRequestEdit: (category: ServiceCategory) => void,
  onRequestDelete: (category: ServiceCategory) => void
) {
  return [
    columnHelper.accessor("displayOrder", {
      header: "Thứ tự",
      cell: (info) => (
        <span className="tabular-nums text-muted-foreground">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("code", {
      header: "Mã",
      cell: (info) => (
        <span className="font-mono text-sm text-muted-foreground">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("name", {
      header: "Tên danh mục",
      cell: (info) => (
        <span className="font-medium text-foreground">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("description", {
      header: "Mô tả",
      cell: (info) => {
        const description = info.getValue();
        return (
          <span
            className="block max-w-[280px] truncate text-muted-foreground"
            title={description ?? undefined}
          >
            {description ?? "—"}
          </span>
        );
      },
    }),
    columnHelper.accessor("isActive", {
      header: "Trạng thái",
      cell: (info) =>
        info.getValue() ? (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Đang hoạt động
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Đã vô hiệu hóa
          </span>
        ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const category = info.row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Sửa danh mục"
              onClick={() => onRequestEdit(category)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Xóa danh mục"
              className="hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onRequestDelete(category)}
            >
              <Trash2 />
            </Button>
          </div>
        );
      },
    }),
  ];
}
