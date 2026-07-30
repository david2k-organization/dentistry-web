import { useMemo, type ComponentProps, type ReactNode } from "react";

import { DataTable } from "@/components/ui/DataTable";
import { createServiceColumns } from "./columns";
import type { Service } from "./types";

type ServiceTableProps = {
  services: Service[];
  loading?: boolean;
  onRequestEdit: (service: Service) => void;
  onRequestDelete: (service: Service) => void;
  pagination?: ComponentProps<typeof DataTable<Service>>["manualPagination"];
  actions?: ReactNode;
};

export function ServiceTable({
  services,
  loading,
  onRequestEdit,
  onRequestDelete,
  pagination,
  actions,
}: ServiceTableProps) {
  const columns = useMemo(
    () => createServiceColumns(onRequestEdit, onRequestDelete),
    [onRequestEdit, onRequestDelete]
  );

  return (
    <DataTable
      columns={columns}
      data={services}
      loading={loading}
      getRowId={(row) => row.id}
      title="Danh sách dịch vụ"
      countLabel={(n) => `${n} dịch vụ`}
      actions={actions}
      emptyMessage="Chưa có dịch vụ nào."
      manualPagination={pagination}
    />
  );
}
