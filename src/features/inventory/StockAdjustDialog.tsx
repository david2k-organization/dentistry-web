import { useState } from "react";
import { Minus, Plus } from "lucide-react";

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
import type { InventoryItem } from "./types";

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

export type StockAdjustResult = { delta: number; note: string };

type StockAdjustDialogProps = {
  item: InventoryItem | null;
  onOpenChange: (open: boolean) => void;
  onSave: (result: StockAdjustResult) => void;
};

export function StockAdjustDialog({ item, onOpenChange, onSave }: StockAdjustDialogProps) {
  const [mode, setMode] = useState<StockMode>("in");
  const [amount, setAmount] = useState(10);
  const [note, setNote] = useState("");

  // Đặt lại form mỗi khi dialog chuyển từ đóng sang mở (thay vì dùng effect).
  const open = !!item;
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setMode("in");
      setAmount(10);
      setNote("");
    }
  }

  const qty = item?.qty ?? 0;
  const min = item?.min ?? 0;
  const result = mode === "count" ? Math.max(0, amount) : mode === "out" ? Math.max(0, qty - amount) : qty + amount;
  const presets = mode === "count" ? [] : [1, 5, 10, 20, 50];

  const handleModeChange = (m: StockMode) => {
    setMode(m);
    if (m === "count") setAmount(qty);
  };

  const handleSave = () => {
    if (!item) return;
    const amt = Math.max(0, amount);
    let delta: number;
    let finalNote = note.trim();
    if (mode === "count") {
      delta = amt - item.qty;
      if (!finalNote) finalNote = "Kiểm kê thực tế";
    } else {
      if (!amt) return;
      delta = mode === "in" ? amt : -amt;
      if (!finalNote) finalNote = mode === "in" ? `Nhập kho từ ${item.supplier}` : "Xuất dùng tại phòng khám";
    }
    onSave({ delta, note: finalNote });
    onOpenChange(false);
  };

  const saveLabel =
    mode === "in" ? "Xác nhận nhập kho" : mode === "out" ? "Xác nhận xuất kho" : "Lưu kết quả kiểm kê";

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item?.name}</DialogTitle>
          <DialogDescription>
            {item && `${item.sku} · ${item.supplier} · định mức ${item.min} ${item.unit}`}
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
                style={{ color: result < min ? "#a4553a" : undefined }}
              >
                {result}
              </div>
              <div className="text-xs text-muted-foreground">
                {item?.unit} · từ {qty}
              </div>
            </div>
          </div>
        </div>

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
          {(!item || item.log.length === 0) && (
            <div className="border-t border-[#f2f7f6] px-3.5 py-3 text-[12.5px] text-muted-foreground">
              Chưa có giao dịch nào.
            </div>
          )}
          {item?.log.slice(0, 4).map((h, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 border-t border-[#f2f7f6] px-3.5 py-2.5 text-[12.5px]"
            >
              <div className="w-[62px] text-muted-foreground tabular-nums">{h.date}</div>
              <div
                className="w-[58px] font-semibold tabular-nums"
                style={{ color: h.delta > 0 ? "#3f7a55" : "#a4553a" }}
              >
                {h.delta > 0 ? "+" : ""}
                {h.delta}
              </div>
              <div className="min-w-0 flex-1 truncate text-[#4a6664]">{h.note}</div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={handleSave}>{saveLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
