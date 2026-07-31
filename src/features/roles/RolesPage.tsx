import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPermissions } from "@/features/permissions/api";
import type { Permission } from "@/features/permissions/types";
import { deleteRole, getRoles } from "./api";
import { DeleteRoleDialog } from "./DeleteRoleDialog";
import { RoleFormDialog } from "./RoleFormDialog";
import { RoleTable } from "./RoleTable";
import type { Role } from "./types";

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [rolePendingDelete, setRolePendingDelete] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const loadRoles = useCallback(
    async (params: {
      searchKey: string;
      pageIndex: number;
      pageSize: number;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const { data, meta } = await getRoles({
          searchKey: params.searchKey,
          page: params.pageIndex + 1,
          pageSize: params.pageSize,
        });
        setRoles(data);
        setTotal(meta.total);
      } catch {
        setError("Không thể tải danh sách vai trò.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    getPermissions({ pageSize: 100 })
      .then((res) => setPermissions(res.data))
      .catch(() => setError("Không thể tải danh sách quyền hệ thống."));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageIndex(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadRoles({ searchKey: debouncedSearch, pageIndex, pageSize });
    });
  }, [loadRoles, debouncedSearch, pageIndex, pageSize]);

  const handleOpenCreate = () => {
    setEditingRoleId(null);
    setFormOpen(true);
  };

  const handleRequestEdit = (role: Role) => {
    setEditingRoleId(role.id);
    setFormOpen(true);
  };

  const handleSaved = () => {
    loadRoles({ searchKey: debouncedSearch, pageIndex, pageSize });
  };

  const handleConfirmDelete = async () => {
    if (!rolePendingDelete) return;
    setDeleting(true);
    try {
      await deleteRole(rolePendingDelete.id);
      toast.success(`Đã xoá vai trò "${rolePendingDelete.name}"`);
      setRolePendingDelete(null);
      loadRoles({ searchKey: debouncedSearch, pageIndex, pageSize });
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Không thể xóa vai trò.")
          : "Không thể xóa vai trò.";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <RoleTable
        roles={roles}
        loading={loading}
        onRequestEdit={handleRequestEdit}
        onRequestDelete={setRolePendingDelete}
        pagination={{
          pageIndex,
          pageSize,
          total,
          onPaginationChange: ({
            pageIndex: nextIndex,
            pageSize: nextSize,
          }) => {
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
                placeholder="Tìm theo tên vai trò"
                className="h-9 w-56 pl-8"
              />
            </div>
            <Button onClick={handleOpenCreate} className="gap-1.5">
              <Plus className="size-4.25" />
              Thêm vai trò
            </Button>
          </div>
        }
      />

      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        roleId={editingRoleId}
        permissions={permissions}
        onSaved={handleSaved}
      />

      <DeleteRoleDialog
        role={rolePendingDelete}
        onOpenChange={(open) => !open && setRolePendingDelete(null)}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>
  );
}
