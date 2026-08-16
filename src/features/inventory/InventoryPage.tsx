import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createWarehouseLog, deleteSupply, getSupplies } from "./api";
import { DeleteSupplyDialog } from "./DeleteSupplyDialog";
import { NewItemDialog } from "./NewItemDialog";
import { StockAdjustDialog } from "./StockAdjustDialog";
import { SupplyTable } from "./SupplyTable";
import type { Supply } from "./types";

function suggestedCodeFrom(supplies: Supply[]): string {
  const nums = supplies.map((s) => Number(s.code.replace(/\D/g, "")) || 0);
  return "VT" + String(Math.max(0, ...nums) + 1).padStart(3, "0");
}

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
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const lowStockCount = supplies.filter((s) => s.quantity < s.quota).length;

  const loadSupplies = useCallback(
    async (params: { searchKey: string; pageIndex: number; pageSize: number }) => {
      setLoading(true);
      setError(null);
      try {
        const { data, meta } = await getSupplies({
          searchKey: params.searchKey,
          page: params.pageIndex + 1,
          pageSize: params.pageSize,
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
      loadSupplies({ searchKey: debouncedSearch, pageIndex, pageSize });
    });
  }, [loadSupplies, debouncedSearch, pageIndex, pageSize]);

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

      <SupplyTable
        supplies={supplies}
        loading={loading}
        busyIds={busyIds}
        onAdjust={quickAdjust}
        onStockDialog={setStockItem}
        onDelete={setSupplyPendingDelete}
        emptyMessage={
          debouncedSearch ? "Không tìm thấy vật tư phù hợp." : "Chưa có vật tư nào."
        }
        countLabel={() => `${lowStockCount} mặt hàng dưới định mức`}
        pagination={{
          pageIndex,
          pageSize,
          total,
          onPaginationChange: ({ pageIndex: nextIndex, pageSize: nextSize }) => {
            setPageIndex(nextSize !== pageSize ? 0 : nextIndex);
            setPageSize(nextSize);
          },
        }}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
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
        }
      />

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
