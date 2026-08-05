import { useMemo, type ComponentProps, type ReactNode } from "react";

import { DataTable } from "@/components/ui/DataTable";
import type { Role } from "@/features/roles/types";
import { createUserColumns } from "./columns";
import type { User } from "./types";

type UserTableProps = {
  users: User[];
  roles: Role[];
  loading?: boolean;
  onAssignRole: (user: User) => void;
  pagination?: ComponentProps<typeof DataTable<User>>["manualPagination"];
  actions?: ReactNode;
};

export function UserTable({
  users,
  roles,
  loading,
  onAssignRole,
  pagination,
  actions,
}: UserTableProps) {
  const columns = useMemo(
    () => createUserColumns(roles, onAssignRole),
    [roles, onAssignRole],
  );

  return (
    <DataTable
      columns={columns}
      data={users}
      loading={loading}
      getRowId={(row) => row.id}
      title="Nhân sự"
      countLabel={(n) => `${n} người dùng`}
      actions={actions}
      emptyMessage="Chưa có người dùng nào."
      manualPagination={pagination}
    />
  );
}
