import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Tags, Trash2 } from "lucide-react";

import { iconActionButtonClass } from "@/lib/utils";
import type { ServiceCategory } from "./types";

const columnHelper = createColumnHelper<ServiceCategory>();

export function createServiceCategoryColumns(
  onRequestEdit: (category: ServiceCategory) => void,
  onRequestDelete: (category: ServiceCategory) => void
) {
  return [
    columnHelper.accessor("name", {
      header: "Tên danh mục",
      cell: (info) => {
        const category = info.row.original;
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-primary">
              <Tags className="size-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate font-medium text-foreground">{category.name}</div>
              <div className="font-mono text-[11.5px] text-muted-foreground">{category.code}</div>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("displayOrder", {
      header: "Thứ tự",
      cell: (info) => (
        <span className="tabular-nums text-[#4a6664]">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("description", {
      header: "Mô tả",
      cell: (info) => {
        const description = info.getValue();
        return (
          <span className="block max-w-70 truncate text-muted-foreground" title={description ?? undefined}>
            {description ?? "—"}
          </span>
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
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              title="Sửa danh mục"
              onClick={() => onRequestEdit(category)}
              className={iconActionButtonClass()}
            >
              <Pencil className="size-[17px]" />
            </button>
            <button
              type="button"
              title="Xoá danh mục"
              onClick={() => onRequestDelete(category)}
              className={iconActionButtonClass("danger")}
            >
              <Trash2 className="size-[17px]" />
            </button>
          </div>
        );
      },
    }),
  ];
}
