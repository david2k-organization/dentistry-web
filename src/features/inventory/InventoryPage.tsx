import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, Search, Trash2 } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createWarehouseLog, deleteSupply, getSupplies } from "./api";
import { DeleteSupplyDialog } from "./DeleteSupplyDialog";
import { formatShortDate, SUPPLY_UNIT_LABELS } from "./format";
import { NewItemDialog } from "./NewItemDialog";
import { StockAdjustDialog } from "./StockAdjustDialog";
import type { Supply } from "./types";

function stockLevel(qty: number, quota: number) {
  const ratio = quota === 0 ? 1 : qty / quota;
  const pct = Math.min(Math.round(ratio * 100), 100);
  if (ratio < 0.5) return { pct, bar: "#c2765b", text: "text-[#bd6446]" };
  if (ratio < 1) return { pct, bar: "#d99a3f", text: "text-[#9a6524]" };
  return { pct, bar: "#5da177", text: "text-[#3f7a55]" };
}

function suggestedCodeFrom(supplies: Supply[]): string {
  const nums = supplies.map((s) => Number(s.code.replace(/\D/g, "")) || 0);
  return "VT" + String(Math.max(0, ...nums) + 1).padStart(3, "0");
}

const COLS = "grid grid-cols-[2fr_1fr_1.4fr_1.2fr_1.5fr] gap-3";
const PAGE_SIZE = 20;

export function InventoryPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stockItem, setStockItem] = useState<Supply | null>(null);
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [supplyPendingDelete, setSupplyPendingDelete] = useState<Supply | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const lowStockCount = supplies.filter((s) => s.quantity < s.quota).length;

  const loadSupplies = useCallback(
    async (params: { searchKey: string; pageIndex: number }) => {
      setLoading(true);
      setError(null);
      try {
        const { data, meta } = await getSupplies({
          searchKey: params.searchKey,
          page: params.pageIndex + 1,
          pageSize: PAGE_SIZE,
        });
        setSupplies(data);
        setTotal(meta.total);
      } catch {
        setError("Không thể tải danh sách vật tư.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageIndex(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadSupplies({ searchKey: debouncedSearch, pageIndex });
    });
  }, [loadSupplies, debouncedSearch, pageIndex]);

  const handleSaved = (supply: Supply) => {
    setSupplies((prev) => {
      const index = prev.findIndex((s) => s.id === supply.id);
      if (index === -1) {
        setTotal((t) => t + 1);
        return [supply, ...prev];
      }
      return prev.with(index, supply);
    });
  };

  const quickAdjust = async (supply: Supply, delta: number) => {
    if (busyIds.has(supply.id)) return;
    if (delta < 0 && supply.quantity <= 0) return;
    setBusyIds((prev) => new Set(prev).add(supply.id));
    try {
      await createWarehouseLog({
        suppliesId: supply.id,
        type: delta > 0 ? "IMPORT" : "EXPORT",
        quantity: 1,
        note: delta > 0 ? "Điều chỉnh nhanh +1" : "Điều chỉnh nhanh −1",
      });
      handleSaved({ ...supply, quantity: supply.quantity + delta });
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Không thể cập nhật tồn kho.")
          : "Không thể cập nhật tồn kho.";
      toast.error(message);
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(supply.id);
        return next;
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!supplyPendingDelete) return;
    setDeleting(true);
    try {
      await deleteSupply(supplyPendingDelete.id);
      setSupplies((prev) => prev.filter((s) => s.id !== supplyPendingDelete.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success(`Đã xóa vật tư "${supplyPendingDelete.name}"`);
      setSupplyPendingDelete(null);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Không thể xóa vật tư.")
          : "Không thể xóa vật tư.";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-[#e6efee] px-[18px] py-[15px]">
          <div className="text-[14.5px] font-semibold text-foreground">Kho vật tư</div>
          <div className="text-xs text-muted-foreground">
            {lowStockCount} mặt hàng dưới định mức
          </div>
          <div className="flex-1" />
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, mã, NCC"
              className="h-9 w-56 pl-8"
            />
          </div>
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

        {loading && (
          <div className="px-[18px] py-10 text-center text-[13px] text-muted-foreground">
            Đang tải danh sách vật tư...
          </div>
        )}

        {!loading && supplies.length === 0 && (
          <div className="px-[18px] py-10 text-center text-[13px] text-muted-foreground">
            {debouncedSearch ? "Không tìm thấy vật tư phù hợp." : "Chưa có vật tư nào."}
          </div>
        )}

        {!loading &&
          supplies.map((s) => {
            const level = stockLevel(s.quantity, s.quota);
            const unitLabel = SUPPLY_UNIT_LABELS[s.unit];
            const busy = busyIds.has(s.id);
            return (
              <div
                key={s.id}
                className={`${COLS} items-center border-b border-[#f0f5f4] px-[18px] py-[13px] text-[13px] last:border-0`}
              >
                <div className="leading-tight">
                  <div className="font-medium text-foreground">{s.name}</div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {s.code} · cập nhật {formatShortDate(s.updatedAt)}
                  </div>
                </div>
                <div className={`font-medium tabular-nums ${level.text}`}>
                  {s.quantity} / {s.quota} {unitLabel}
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
                      disabled={busy || s.quantity <= 0}
                      onClick={() => quickAdjust(s, -1)}
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
                      onClick={() => quickAdjust(s, 1)}
                      className="grid size-[30px] cursor-pointer place-items-center border-l border-[#eaf1f0] bg-card text-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="size-[17px]" />
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary"
                    onClick={() => setStockItem(s)}
                  >
                    Nhập / xuất
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    aria-label={`Xóa ${s.name}`}
                    onClick={() => setSupplyPendingDelete(s)}
                  >
                    <Trash2 className="size-[17px]" />
                  </Button>
                </div>
              </div>
            );
          })}

        {!loading && total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-[#e6efee] px-[18px] py-3 text-[12.5px] text-muted-foreground">
            <div>
              Trang {pageIndex + 1} / {totalPages} · {total} vật tư
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pageIndex >= totalPages - 1}
                onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              >
                Sau
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <StockAdjustDialog
        item={stockItem}
        onOpenChange={(open) => !open && setStockItem(null)}
        onSaved={handleSaved}
      />

      <NewItemDialog
        open={newItemOpen}
        onOpenChange={setNewItemOpen}
        suggestedCode={suggestedCodeFrom(supplies)}
        onSaved={handleSaved}
      />

      <DeleteSupplyDialog
        supply={supplyPendingDelete}
        onOpenChange={(open) => !open && setSupplyPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>
  );
}
