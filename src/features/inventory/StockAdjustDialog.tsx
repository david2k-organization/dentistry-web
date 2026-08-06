import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createWarehouseLog, getWarehouseLogs, updateSupply } from "./api";
import { formatShortDate, SUPPLY_UNIT_LABELS } from "./format";
import type { Supply, WarehouseLog } from "./types";

type StockMode = "in" | "out" | "count";

const MODES: { key: StockMode; label: string }[] = [
  { key: "in", label: "Nhập kho" },
  { key: "out", label: "Xuất dùng" },
  { key: "count", label: "Kiểm kê" },
];

const NOTE_PLACEHOLDER: Record<StockMode, string> = {
  in: "VD: nhập theo đơn hàng 07/2026",
  out: "VD: dùng cho ca trám R16",
  count: "VD: kiểm kê cuối tháng",
};

type StockAdjustDialogProps = {
  item: Supply | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (supply: Supply) => void;
};

export function StockAdjustDialog({ item, onOpenChange, onSaved }: StockAdjustDialogProps) {
  const [mode, setMode] = useState<StockMode>("in");
  const [amount, setAmount] = useState(10);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState<WarehouseLog[]>([]);

  const open = !!item;
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setMode("in");
      setAmount(10);
      setNote("");
      setLogs([]);
    }
  }

  useEffect(() => {
    if (!item) return;
    let cancelled = false;
    getWarehouseLogs({ suppliesId: item.id, pageSize: 5 })
      .then((res) => {
        if (!cancelled) setLogs(res.data);
      })
      .catch(() => {
        if (!cancelled) setLogs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [item]);

  const qty = item?.quantity ?? 0;
  const quota = item?.quota ?? 0;
  const unitLabel = item ? SUPPLY_UNIT_LABELS[item.unit] : "";
  const result =
    mode === "count" ? Math.max(0, amount) : mode === "out" ? qty - amount : qty + amount;
  const presets = mode === "count" ? [] : [1, 5, 10, 20, 50];
  const exportTooMuch = mode === "out" && amount > qty;

  const handleModeChange = (m: StockMode) => {
    setMode(m);
    if (m === "count") setAmount(qty);
  };

  const canSave = (() => {
    if (!item || submitting) return false;
    if (mode === "count") return amount !== qty;
    return amount > 0 && !exportTooMuch;
  })();

  const handleSave = async () => {
    if (!item || !canSave) return;
    setSubmitting(true);
    try {
      let updated: Supply;
      if (mode === "count") {
        updated = await updateSupply(item.id, {
          quantity: Math.max(0, amount),
          ...(note.trim() ? { note: note.trim() } : {}),
        });
        toast.success(`Đã cập nhật tồn "${item.name}" thành ${updated.quantity} ${unitLabel}`);
      } else {
        const type = mode === "in" ? "IMPORT" : "EXPORT";
        await createWarehouseLog({
          suppliesId: item.id,
          type,
          quantity: amount,
          note: note.trim() || undefined,
        });
        const newQty = mode === "in" ? qty + amount : qty - amount;
        updated = { ...item, quantity: newQty };
        toast.success(
          mode === "in"
            ? `Đã nhập ${amount} ${unitLabel} ${item.name}`
            : `Đã xuất ${amount} ${unitLabel} ${item.name}`,
        );
      }
      onSaved(updated);
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Không thể cập nhật tồn kho.")
          : "Không thể cập nhật tồn kho.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const saveLabel =
    mode === "in" ? "Xác nhận nhập kho" : mode === "out" ? "Xác nhận xuất kho" : "Lưu kết quả kiểm kê";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item?.name}</DialogTitle>
          <DialogDescription>
            {item && `${item.code} · ${item.supplier} · định mức ${item.quota} ${unitLabel}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5 rounded-xl border border-[#e6efee] bg-[#f2f7f7] p-1">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => handleModeChange(m.key)}
              className={`flex-1 cursor-pointer rounded-lg py-2 text-[12.5px] transition-colors ${
                mode === m.key
                  ? "bg-card font-semibold text-foreground shadow-sm"
                  : "font-normal text-[#5c7a78] hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3.5">
          <div className="flex-1">
            <div className="text-[11.5px] text-muted-foreground">
              {mode === "count" ? "Số lượng đếm thực tế" : "Số lượng"}
            </div>
            <div className="mt-1.5 flex w-[168px] items-center overflow-hidden rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setAmount((a) => Math.max(0, a - 1))}
                className="grid h-11 w-[42px] cursor-pointer place-items-center border-r border-[#eaf1f0] bg-[#f8fbfb] text-[#4a6664] hover:bg-[#eef4f3]"
              >
                <Minus className="size-[18px]" />
              </button>
              <Input
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0))}
                className="h-11 border-0 text-center text-[17px] font-semibold tabular-nums shadow-none focus-visible:ring-0"
              />
              <button
                type="button"
                onClick={() => setAmount((a) => a + 1)}
                className="grid h-11 w-[42px] cursor-pointer place-items-center border-l border-[#eaf1f0] bg-[#f8fbfb] text-primary hover:bg-accent"
              >
                <Plus className="size-[18px]" />
              </button>
            </div>
          </div>
          <div className="flex-1 rounded-xl border border-[#eef4f3] bg-[#f8fbfb] px-3.5 py-3">
            <div className="text-[11.5px] text-muted-foreground">Tồn sau thay đổi</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div
                className="text-xl font-semibold tabular-nums"
                style={{ color: result < quota ? "#a4553a" : undefined }}
              >
                {Math.max(0, result)}
              </div>
              <div className="text-xs text-muted-foreground">
                {unitLabel} · từ {qty}
              </div>
            </div>
          </div>
        </div>

        {exportTooMuch && (
          <div className="mt-2.5 text-[12px] text-[#a4553a]">
            Không đủ tồn kho để xuất. Tồn hiện tại: {qty} {unitLabel}.
          </div>
        )}

        {presets.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(p)}
                className="cursor-pointer rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-[#4a6664] hover:border-[#cfe0df] hover:bg-[#f2f7f7]"
              >
                +{p}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4">
          <div className="text-[11.5px] text-muted-foreground">Lý do / ghi chú</div>
          <Input
            className="mt-1.5"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={NOTE_PLACEHOLDER[mode]}
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-[#eef4f3]">
          <div className="bg-[#f7fbfa] px-3.5 py-2.5 text-[11.5px] font-medium text-muted-foreground">
            Lịch sử gần đây
          </div>
          {logs.length === 0 && (
            <div className="border-t border-[#f2f7f6] px-3.5 py-3 text-[12.5px] text-muted-foreground">
              Chưa có giao dịch nào.
            </div>
          )}
          {logs.map((h) => {
            const delta = h.type === "IMPORT" ? h.quantity : -h.quantity;
            return (
              <div
                key={h.id}
                className="flex items-center gap-3 border-t border-[#f2f7f6] px-3.5 py-2.5 text-[12.5px]"
              >
                <div className="w-[62px] text-muted-foreground tabular-nums">
                  {formatShortDate(h.createdAt)}
                </div>
                <div
                  className="w-[58px] font-semibold tabular-nums"
                  style={{ color: delta > 0 ? "#3f7a55" : "#a4553a" }}
                >
                  {delta > 0 ? "+" : ""}
                  {delta}
                </div>
                <div className="min-w-0 flex-1 truncate text-[#4a6664]">
                  {h.note || (h.type === "IMPORT" ? "Nhập kho" : "Xuất dùng")}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {submitting ? "Đang lưu..." : saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
