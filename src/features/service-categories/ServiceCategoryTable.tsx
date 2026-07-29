import { useMemo } from "react";

import { DataTable } from "@/components/ui/DataTable";
import { createServiceCategoryColumns } from "./columns";
import type { ServiceCategory } from "./types";

type ServiceCategoryTableProps = {
  categories: ServiceCategory[];
  loading?: boolean;
  onRequestEdit: (category: ServiceCategory) => void;
  onRequestDelete: (category: ServiceCategory) => void;
};

export function ServiceCategoryTable({
  categories,
  loading,
  onRequestEdit,
  onRequestDelete,
}: ServiceCategoryTableProps) {
  const columns = useMemo(
    () => createServiceCategoryColumns(onRequestEdit, onRequestDelete),
    [onRequestEdit, onRequestDelete]
  );

  return (
    <DataTable
      columns={columns}
      data={categories}
      loading={loading}
      getRowId={(row) => row.id}
      title="Danh mục dịch vụ"
      countLabel={(n) => `${n} danh mục`}
      emptyMessage="Chưa có danh mục dịch vụ nào."
    />
  );
}
