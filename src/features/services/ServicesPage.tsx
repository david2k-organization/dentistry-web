import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getServiceCategories } from "@/features/service-categories/api";
import type { ServiceCategory } from "@/features/service-categories/types";
import { deleteService, getServices } from "@/features/services/api";
import { DeleteServiceDialog } from "@/features/services/DeleteServiceDialog";
import { ServiceFormDialog } from "@/features/services/ServiceFormDialog";
import { ServiceTable } from "@/features/services/ServiceTable";
import type { Service } from "@/features/services/types";

function sortServices(list: Service[]): Service[] {
  return [...list].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "vi")
  );
}

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [servicePendingDelete, setServicePendingDelete] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const loadServices = useCallback(
    async (params: { searchKey: string; pageIndex: number; pageSize: number }) => {
      setLoading(true);
      setError(null);
      try {
        const { data, meta } = await getServices({
          searchKey: params.searchKey,
          page: params.pageIndex + 1,
          pageSize: params.pageSize,
        });
        setServices(sortServices(data));
        setTotal(meta.total);
      } catch {
        setError("Không thể tải danh sách dịch vụ.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Danh mục dùng cho dropdown trong form — tải toàn bộ một lần.
  useEffect(() => {
    getServiceCategories({ pageSize: 1000 })
      .then((res) => setCategories(res.data))
      .catch(() => setError("Không thể tải danh mục dịch vụ."));
  }, []);

  // Debounce ô tìm kiếm; đổi từ khóa thì quay về trang đầu.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageIndex(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadServices({ searchKey: debouncedSearch, pageIndex, pageSize });
    });
  }, [loadServices, debouncedSearch, pageIndex, pageSize]);

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormOpen(true);
  };

  const handleRequestEdit = (service: Service) => {
    setEditingService(service);
    setFormOpen(true);
  };

  const handleSaved = (service: Service) => {
    setServices((prev) => {
      const index = prev.findIndex((s) => s.id === service.id);
      if (index === -1) setTotal((t) => t + 1);
      const next = index === -1 ? [...prev, service] : prev.with(index, service);
      return sortServices(next);
    });
  };

  const handleConfirmDelete = async () => {
    if (!servicePendingDelete) return;
    setDeleting(true);
    try {
      await deleteService(servicePendingDelete.id);
      setServices((prev) => prev.filter((s) => s.id !== servicePendingDelete.id));
      setTotal((t) => Math.max(0, t - 1));
      setServicePendingDelete(null);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Không thể xóa dịch vụ.")
          : "Không thể xóa dịch vụ.";
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && categories.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Cần tạo ít nhất một danh mục dịch vụ trước khi thêm dịch vụ.
        </p>
      )}

      <ServiceTable
        services={services}
        loading={loading}
        onRequestEdit={handleRequestEdit}
        onRequestDelete={setServicePendingDelete}
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
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên dịch vụ"
                className="h-9 w-full pl-8 sm:w-56"
              />
            </div>
            <Button
              onClick={handleOpenCreate}
              disabled={categories.length === 0}
              className="gap-1.5"
            >
              <Plus className="size-[17px]" />
              Thêm dịch vụ
            </Button>
          </div>
        }
      />

      <ServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        service={editingService}
        categories={categories}
        onSaved={handleSaved}
      />

      <DeleteServiceDialog
        service={servicePendingDelete}
        onOpenChange={(open) => !open && setServicePendingDelete(null)}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>
  );
}
