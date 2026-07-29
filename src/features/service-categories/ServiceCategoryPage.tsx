import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import {
  deleteServiceCategory,
  getServiceCategories,
} from "@/features/service-categories/api";
import { DeleteServiceCategoryDialog } from "@/features/service-categories/DeleteServiceCategoryDialog";
import { ServiceCategoryFormDialog } from "@/features/service-categories/ServiceCategoryFormDialog";
import { ServiceCategoryTable } from "@/features/service-categories/ServiceCategoryTable";
import type { ServiceCategory } from "@/features/service-categories/types";

export function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<ServiceCategory | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getServiceCategories();
      setCategories(data);
    } catch {
      setError("Không thể tải danh sách danh mục dịch vụ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadCategories();
    });
  }, [loadCategories]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const handleRequestEdit = (category: ServiceCategory) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleSaved = (category: ServiceCategory) => {
    setCategories((prev) => {
      const index = prev.findIndex((c) => c.id === category.id);
      const next = index === -1 ? [...prev, category] : prev.with(index, category);
      return next.sort((a, b) => a.displayOrder - b.displayOrder);
    });
  };

  const handleConfirmDelete = async () => {
    if (!categoryPendingDelete) return;
    setDeleting(true);
    try {
      await deleteServiceCategory(categoryPendingDelete.id);
      setCategories((prev) => prev.filter((c) => c.id !== categoryPendingDelete.id));
      setCategoryPendingDelete(null);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Không thể xóa danh mục dịch vụ.")
          : "Không thể xóa danh mục dịch vụ.";
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Danh mục dịch vụ</h1>
          <p className="text-muted-foreground">
            Quản lý danh mục dịch vụ nha khoa của phòng khám.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus data-icon="inline-start" />
          Thêm danh mục
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <ServiceCategoryTable
        categories={categories}
        loading={loading}
        onRequestEdit={handleRequestEdit}
        onRequestDelete={setCategoryPendingDelete}
      />

      <ServiceCategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editingCategory}
        onSaved={handleSaved}
      />

      <DeleteServiceCategoryDialog
        category={categoryPendingDelete}
        onOpenChange={(open) => !open && setCategoryPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>
  );
}
