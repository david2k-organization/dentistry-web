import { useMemo, type ReactNode } from "react";

import { DataTable } from "@/components/ui/DataTable";
import { createInvoiceColumns } from "./columns";
import type { Order } from "./types";

type InvoiceTableProps = {
  orders: Order[];
  loading?: boolean;
  paidMap: Record<string, number>;
  editLoadingId: string | null;
  onChangeStatus: (order: Order) => void;
  onPay: (order: Order) => void;
  onEdit: (order: Order) => void;
  onCancel: (order: Order) => void;
  countLabel?: (total: number) => string;
  actions?: ReactNode;
};

export function InvoiceTable({
  orders,
  loading,
  paidMap,
  editLoadingId,
  onChangeStatus,
  onPay,
  onEdit,
  onCancel,
  countLabel,
  actions,
}: InvoiceTableProps) {
  const columns = useMemo(
    () =>
      createInvoiceColumns(paidMap, editLoadingId, {
        onChangeStatus,
        onPay,
        onEdit,
        onCancel,
      }),
    [paidMap, editLoadingId, onChangeStatus, onPay, onEdit, onCancel],
  );

  return (
    <DataTable
      columns={columns}
      data={orders}
      loading={loading}
      getRowId={(row) => row.id}
      title="Danh sách hoá đơn"
      countLabel={countLabel}
      actions={actions}
      emptyMessage="Chưa có hoá đơn nào."
    />
  );
}
