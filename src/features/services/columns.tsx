import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDuration, formatPrice, unitLabels } from "./format";
import type { Service } from "./types";

const columnHelper = createColumnHelper<Service>();

export function createServiceColumns(
  onRequestEdit: (service: Service) => void,
  onRequestDelete: (service: Service) => void
) {
  return [
    columnHelper.accessor("code", {
      header: "Mã",
      cell: (info) => (
        <span className="font-mono text-sm text-muted-foreground">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("name", {
      header: "Tên dịch vụ",
      cell: (info) => {
        const service = info.row.original;
        return (
          <div className="flex items-center gap-2.5">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: service.color ?? "#cfe0df" }}
            />
            <div className="min-w-0 leading-tight">
              <div className="font-medium text-foreground">{service.name}</div>
              <div className="text-[11.5px] text-muted-foreground">
                {service.category?.name ?? "—"}
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
        <span className="text-muted-foreground">{unitLabels[info.getValue()]}</span>
      ),
    }),
    columnHelper.accessor("durationMinutes", {
      header: "Thời lượng",
      cell: (info) => (
        <span className="tabular-nums text-muted-foreground">
          {formatDuration(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor("isActive", {
      header: "Trạng thái",
      cell: (info) =>
        info.getValue() ? (
          <span className="inline-flex items-center rounded-full bg-[#eef6f1] px-2 py-0.5 text-xs font-medium text-[#3f7a55]">
            Đang hoạt động
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
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
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Sửa dịch vụ"
              onClick={() => onRequestEdit(service)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Xóa dịch vụ"
              className="hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onRequestDelete(service)}
            >
              <Trash2 />
            </Button>
          </div>
        );
      },
    }),
  ];
}
