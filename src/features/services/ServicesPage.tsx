import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [serviceList, categoryList] = await Promise.all([
        getServices(),
        getServiceCategories(),
      ]);
      setServices(sortServices(serviceList));
      setCategories(categoryList);
    } catch {
      setError("Không thể tải danh sách dịch vụ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadData();
    });
  }, [loadData]);

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
        actions={
          <Button onClick={handleOpenCreate} disabled={categories.length === 0} className="gap-1.5">
            <Plus className="size-[17px]" />
            Thêm dịch vụ
          </Button>
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
