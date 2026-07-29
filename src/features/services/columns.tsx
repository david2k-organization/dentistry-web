import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Syringe, Trash2 } from "lucide-react";

import { iconActionButtonClass } from "@/lib/utils";
import { formatDuration, formatPrice, unitLabels } from "./format";
import type { Service } from "./types";

const columnHelper = createColumnHelper<Service>();

export function createServiceColumns(
  onRequestEdit: (service: Service) => void,
  onRequestDelete: (service: Service) => void
) {
  return [
    columnHelper.accessor("name", {
      header: "Tên dịch vụ",
      cell: (info) => {
        const service = info.row.original;
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="grid size-8 shrink-0 place-items-center rounded-full text-white"
              style={{ background: service.color ?? "#9fb3b1" }}
            >
              <Syringe className="size-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate font-medium text-foreground">{service.name}</div>
              <div className="text-[11.5px] text-muted-foreground">
                {service.category?.name ?? "—"} · {service.code}
              </div>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("price", {
      header: "Giá",
      cell: (info) => (
        <span className="tabular-nums font-medium text-foreground">
          {formatPrice(info.getValue(), info.row.original.priceMax)}
        </span>
      ),
    }),
    columnHelper.accessor("unit", {
      header: "Đơn vị",
      cell: (info) => (
        <span className="text-[#4a6664]">{unitLabels[info.getValue()]}</span>
      ),
    }),
    columnHelper.accessor("durationMinutes", {
      header: "Thời lượng",
      cell: (info) => (
        <span className="tabular-nums text-[#4a6664]">
          {formatDuration(info.getValue())}
        </span>
      ),
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
            Đã ẩn
          </span>
        ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const service = info.row.original;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              title="Sửa dịch vụ"
              onClick={() => onRequestEdit(service)}
              className={iconActionButtonClass()}
            >
              <Pencil className="size-[17px]" />
            </button>
            <button
              type="button"
              title="Xoá dịch vụ"
              onClick={() => onRequestDelete(service)}
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
