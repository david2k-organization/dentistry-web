import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { NewItemDialog, type NewItemResult } from "./NewItemDialog";
import { StockAdjustDialog, type StockAdjustResult } from "./StockAdjustDialog";
import type { InventoryItem } from "./types";

const initialInventory: InventoryItem[] = [
  { sku: "GT-M-100", name: "Găng tay y tế size M", qty: 2, min: 10, unit: "hộp", supplier: "Nam Khoa", updated: "26/07", log: [{ date: "26/07", delta: -3, note: "Xuất dùng phòng khám" }] },
  { sku: "KT-27G", name: "Kim tiêm nha khoa 27G", qty: 5, min: 12, unit: "vỉ", supplier: "Dentsply", updated: "28/07", log: [{ date: "28/07", delta: -4, note: "Xuất dùng trong tuần" }, { date: "12/07", delta: 12, note: "Nhập theo đơn T7" }] },
  { sku: "CP-A2", name: "Composite trám răng A2", qty: 1, min: 6, unit: "tuýp", supplier: "3M ESPE", updated: "26/07", log: [{ date: "26/07", delta: -2, note: "Trám R16" }] },
  { sku: "TT-LID2", name: "Thuốc tê Lidocaine 2%", qty: 14, min: 10, unit: "ống", supplier: "Septodont", updated: "20/07", log: [{ date: "20/07", delta: 24, note: "Nhập lô mới HSD 06/2027" }] },
  { sku: "BG-500", name: "Bông gòn cuộn tiệt trùng", qty: 24, min: 8, unit: "gói", supplier: "Bảo Thạch", updated: "18/07", log: [{ date: "18/07", delta: 20, note: "Nhập định kỳ" }] },
  { sku: "MK-DIA", name: "Mũi khoan kim cương", qty: 7, min: 15, unit: "cái", supplier: "Mani", updated: "24/07", log: [{ date: "24/07", delta: -5, note: "Thay mũi khoan mòn" }] },
  { sku: "NSM-500", name: "Nước súc miệng sát khuẩn", qty: 18, min: 10, unit: "chai", supplier: "Nam Khoa", updated: "18/07", log: [] },
];

function stockLevel(qty: number, min: number) {
  const ratio = min === 0 ? 1 : qty / min;
  const pct = Math.min(Math.round(ratio * 100), 100);
  if (ratio < 0.5) return { pct, bar: "#c2765b", text: "text-[#bd6446]" };
  if (ratio < 1) return { pct, bar: "#d99a3f", text: "text-[#9a6524]" };
  return { pct, bar: "#5da177", text: "text-[#3f7a55]" };
}

function nextSkuFrom(inventory: InventoryItem[]): string {
  const nums = inventory.map((i) => Number(i.sku.replace(/\D/g, "")) || 0);
  return "VT-" + String(Math.max(0, ...nums) + 1);
}

const COLS = "grid grid-cols-[2fr_1fr_1.4fr_1.2fr_1.5fr] gap-3";

export function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [stockItem, setStockItem] = useState<InventoryItem | null>(null);
  const [newItemOpen, setNewItemOpen] = useState(false);

  const lowStockCount = inventory.filter((s) => s.qty < s.min).length;

  const bumpQty = (sku: string, delta: number, note?: string) => {
    setInventory((prev) =>
      prev.map((x) => {
        if (x.sku !== sku) return x;
        const q = Math.max(0, x.qty + delta);
        if (q === x.qty) return x;
        const entry = { date: "29/07", delta: q - x.qty, note: note || (delta > 0 ? "Nhập kho" : "Xuất dùng") };
        return { ...x, qty: q, updated: "29/07", log: [entry, ...x.log] };
      })
    );
  };

  const handleStockSave = (result: StockAdjustResult) => {
    if (!stockItem) return;
    bumpQty(stockItem.sku, result.delta, result.note);
    const item = stockItem;
    if (result.delta > 0) toast.success(`Đã nhập ${result.delta} ${item.unit} ${item.name}`);
    else if (result.delta < 0) toast.success(`Đã xuất ${-result.delta} ${item.unit} ${item.name}`);
    else toast.success(`Đã kiểm kê ${item.name}`);
    setStockItem(null);
  };

  const handleNewItem = (result: NewItemResult) => {
    setInventory((prev) => [
      { ...result, log: [{ date: "29/07", delta: result.qty, note: "Khởi tạo vật tư mới" }] },
      ...prev,
    ]);
    toast.success(`Đã thêm "${result.name}" vào kho`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-[#e6efee] px-[18px] py-[15px]">
          <div className="text-[14.5px] font-semibold text-foreground">Kho vật tư</div>
          <div className="text-xs text-muted-foreground">
            {lowStockCount} mặt hàng dưới định mức
          </div>
          <div className="flex-1" />
          <Button onClick={() => setNewItemOpen(true)} className="gap-1.5">
            <Plus className="size-[17px]" />
            Thêm vật tư
          </Button>
        </div>

        <div
          className={`${COLS} border-b border-[#e6efee] bg-[#f7fbfa] px-[18px] py-3 text-[11.5px] font-medium tracking-[0.04em] text-muted-foreground uppercase`}
        >
          <div>Vật tư</div>
          <div>Tồn / Định mức</div>
          <div>Mức tồn</div>
          <div>Nhà cung cấp</div>
          <div className="text-right">Cập nhật số lượng</div>
        </div>

        {inventory.map((s) => {
          const level = stockLevel(s.qty, s.min);
          return (
            <div
              key={s.sku}
              className={`${COLS} items-center border-b border-[#f0f5f4] px-[18px] py-[13px] text-[13px] last:border-0`}
            >
              <div className="leading-tight">
                <div className="font-medium text-foreground">{s.name}</div>
                <div className="text-[11.5px] text-muted-foreground">
                  {s.sku} · cập nhật {s.updated}
                </div>
              </div>
              <div className={`font-medium tabular-nums ${level.text}`}>
                {s.qty} / {s.min} {s.unit}
              </div>
              <div>
                <div className="h-[7px] overflow-hidden rounded-[4px] bg-[#eef4f3]">
                  <div
                    className="h-full rounded-[4px]"
                    style={{ width: `${level.pct}%`, background: level.bar }}
                  />
                </div>
              </div>
              <div className="text-[12.5px] text-[#4a6664]">{s.supplier}</div>
              <div className="flex items-center justify-end gap-2">
                <div className="flex items-center overflow-hidden rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => bumpQty(s.sku, -1, "Điều chỉnh nhanh −1")}
                    className="grid size-[30px] cursor-pointer place-items-center border-r border-[#eaf1f0] bg-card text-[#4a6664] hover:bg-[#f4f9f8]"
                  >
                    <Minus className="size-[17px]" />
                  </button>
                  <div className="w-[42px] text-center text-[13px] font-semibold tabular-nums">
                    {s.qty}
                  </div>
                  <button
                    type="button"
                    onClick={() => bumpQty(s.sku, 1, "Điều chỉnh nhanh +1")}
                    className="grid size-[30px] cursor-pointer place-items-center border-l border-[#eaf1f0] bg-card text-primary hover:bg-accent"
                  >
                    <Plus className="size-[17px]" />
                  </button>
                </div>
                <Button variant="outline" size="sm" className="text-primary" onClick={() => setStockItem(s)}>
                  Nhập / xuất
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <StockAdjustDialog
        item={stockItem}
        onOpenChange={(open) => !open && setStockItem(null)}
        onSave={handleStockSave}
      />

      <NewItemDialog
        open={newItemOpen}
        onOpenChange={setNewItemOpen}
        nextSku={nextSkuFrom(inventory)}
        onSave={handleNewItem}
      />
    </div>
  );
}
