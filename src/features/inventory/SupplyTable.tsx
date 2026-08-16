import { useMemo, type ComponentProps, type ReactNode } from "react";

import { DataTable } from "@/components/ui/DataTable";
import { createSupplyColumns } from "./columns";
import type { Supply } from "./types";

type SupplyTableProps = {
  supplies: Supply[];
  loading?: boolean;
  busyIds: Set<string>;
  onAdjust: (supply: Supply, delta: number) => void;
  onStockDialog: (supply: Supply) => void;
  onDelete: (supply: Supply) => void;
  emptyMessage?: string;
  pagination?: ComponentProps<typeof DataTable<Supply>>["manualPagination"];
  countLabel?: (total: number) => string;
  actions?: ReactNode;
};

export function SupplyTable({
  supplies,
  loading,
  busyIds,
  onAdjust,
  onStockDialog,
  onDelete,
  emptyMessage,
  pagination,
  countLabel,
  actions,
}: SupplyTableProps) {
  const columns = useMemo(
    () => createSupplyColumns({ onAdjust, onStockDialog, onDelete, busyIds }),
    [onAdjust, onStockDialog, onDelete, busyIds],
  );

  return (
    <DataTable
      columns={columns}
      data={supplies}
      loading={loading}
      getRowId={(row) => row.id}
      title="Kho vật tư"
      countLabel={countLabel}
      actions={actions}
      emptyMessage={emptyMessage ?? "Chưa có vật tư nào."}
      manualPagination={pagination}
    />
  );
}
