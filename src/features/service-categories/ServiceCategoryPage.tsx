import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const loadCategories = useCallback(
    async (params: { searchKey: string; pageIndex: number; pageSize: number }) => {
      setLoading(true);
      setError(null);
      try {
        const { data, meta } = await getServiceCategories({
          searchKey: params.searchKey,
          page: params.pageIndex + 1,
          pageSize: params.pageSize,
        });
        setCategories(data);
        setTotal(meta.total);
      } catch {
        setError("Không thể tải danh sách danh mục dịch vụ.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

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
      loadCategories({ searchKey: debouncedSearch, pageIndex, pageSize });
    });
  }, [loadCategories, debouncedSearch, pageIndex, pageSize]);

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
      if (index === -1) setTotal((t) => t + 1);
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
      setTotal((t) => Math.max(0, t - 1));
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
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <ServiceCategoryTable
        categories={categories}
        loading={loading}
        onRequestEdit={handleRequestEdit}
        onRequestDelete={setCategoryPendingDelete}
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
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên danh mục"
                className="h-9 w-56 pl-8"
              />
            </div>
            <Button onClick={handleOpenCreate} className="gap-1.5">
              <Plus className="size-[17px]" />
              Thêm danh mục
            </Button>
          </div>
        }
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
