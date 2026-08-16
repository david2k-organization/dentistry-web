import { createColumnHelper } from "@tanstack/react-table";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatShortDate, SUPPLY_UNIT_LABELS } from "./format";
import type { Supply } from "./types";

function stockLevel(qty: number, quota: number) {
  const ratio = quota === 0 ? 1 : qty / quota;
  const pct = Math.min(Math.round(ratio * 100), 100);
  if (ratio < 0.5) return { pct, bar: "#c2765b", text: "text-[#bd6446]" };
  if (ratio < 1) return { pct, bar: "#d99a3f", text: "text-[#9a6524]" };
  return { pct, bar: "#5da177", text: "text-[#3f7a55]" };
}

const columnHelper = createColumnHelper<Supply>();

type SupplyColumnActions = {
  onAdjust: (supply: Supply, delta: number) => void;
  onStockDialog: (supply: Supply) => void;
  onDelete: (supply: Supply) => void;
  busyIds: Set<string>;
};

export function createSupplyColumns({
  onAdjust,
  onStockDialog,
  onDelete,
  busyIds,
}: SupplyColumnActions) {
  return [
    columnHelper.accessor("name", {
      header: "Vật tư",
      cell: (info) => {
        const s = info.row.original;
        return (
          <div className="leading-tight">
            <div className="font-medium text-foreground">{s.name}</div>
            <div className="text-[11.5px] text-muted-foreground">
              {s.code} · cập nhật {formatShortDate(s.updatedAt)}
            </div>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "stockRatio",
      header: "Tồn / Định mức",
      cell: (info) => {
        const s = info.row.original;
        const level = stockLevel(s.quantity, s.quota);
        return (
          <span className={`font-medium tabular-nums ${level.text}`}>
            {s.quantity} / {s.quota} {SUPPLY_UNIT_LABELS[s.unit]}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "level",
      header: "Mức tồn",
      cell: (info) => {
        const level = stockLevel(info.row.original.quantity, info.row.original.quota);
        return (
          <div className="h-[7px] w-full max-w-[140px] overflow-hidden rounded-[4px] bg-[#eef4f3]">
            <div
              className="h-full rounded-[4px]"
              style={{ width: `${level.pct}%`, background: level.bar }}
            />
          </div>
        );
      },
    }),
    columnHelper.accessor("supplier", {
      header: "Nhà cung cấp",
      cell: (info) => (
        <span className="text-[12.5px] text-[#4a6664]">{info.getValue()}</span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Cập nhật số lượng",
      cell: (info) => {
        const s = info.row.original;
        const busy = busyIds.has(s.id);
        return (
          <div className="flex items-center justify-end gap-2">
            <div className="flex items-center overflow-hidden rounded-lg border border-border">
              <button
                type="button"
                disabled={busy || s.quantity <= 0}
                onClick={() => onAdjust(s, -1)}
                className="grid size-[30px] cursor-pointer place-items-center border-r border-[#eaf1f0] bg-card text-[#4a6664] hover:bg-[#f4f9f8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus className="size-[17px]" />
              </button>
              <div className="w-[42px] text-center text-[13px] font-semibold tabular-nums">
                {s.quantity}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => onAdjust(s, 1)}
                className="grid size-[30px] cursor-pointer place-items-center border-l border-[#eaf1f0] bg-card text-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="size-[17px]" />
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-primary"
              onClick={() => onStockDialog(s)}
            >
              Nhập / xuất
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              aria-label={`Xóa ${s.name}`}
              onClick={() => onDelete(s)}
            >
              <Trash2 className="size-[17px]" />
            </Button>
          </div>
        );
      },
    }),
  ];
}
