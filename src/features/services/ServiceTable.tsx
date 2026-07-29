import { useMemo } from "react";

import { DataTable } from "@/components/ui/DataTable";
import { createServiceColumns } from "./columns";
import type { Service } from "./types";

type ServiceTableProps = {
  services: Service[];
  loading?: boolean;
  onRequestEdit: (service: Service) => void;
  onRequestDelete: (service: Service) => void;
};

export function ServiceTable({
  services,
  loading,
  onRequestEdit,
  onRequestDelete,
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
      emptyMessage="Chưa có dịch vụ nào."
    />
  );
}
