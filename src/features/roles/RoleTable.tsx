import { useMemo, type ComponentProps, type ReactNode } from "react";

import { DataTable } from "@/components/ui/DataTable";
import { createRoleColumns } from "./columns";
import type { Role } from "./types";

type RoleTableProps = {
  roles: Role[];
  loading?: boolean;
  onRequestEdit: (role: Role) => void;
  onRequestDelete: (role: Role) => void;
  pagination?: ComponentProps<typeof DataTable<Role>>["manualPagination"];
  actions?: ReactNode;
};

export function RoleTable({
  roles,
  loading,
  onRequestEdit,
  onRequestDelete,
  pagination,
  actions,
}: RoleTableProps) {
  const columns = useMemo(
    () => createRoleColumns(onRequestEdit, onRequestDelete),
    [onRequestEdit, onRequestDelete]
  );

  return (
    <DataTable
      columns={columns}
      data={roles}
      loading={loading}
      getRowId={(row) => String(row.id)}
      title="Vai trò & phân quyền"
      countLabel={(n) => `${n} vai trò`}
      actions={actions}
      emptyMessage="Chưa có vai trò nào."
      manualPagination={pagination}
    />
  );
}
