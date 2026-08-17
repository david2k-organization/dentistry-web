import { Link } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Ban, Loader2, Pencil, Wallet } from "lucide-react";

import { iconActionButtonClass } from "@/lib/utils";
import { fmt, formatDate } from "./format";
import {
  isEditable,
  isPayable,
  isVoidable,
  isVoided,
  ORDER_STATUS_META,
  orderTotal,
  type Order,
} from "./types";

function summaryOf(order: Order): string {
  if (isVoided(order))
    return order.voidedReason ? `Đã huỷ · ${order.voidedReason}` : "Đã huỷ";
  const names = order.services.map((s) => s.service?.name ?? "Dịch vụ");
  return names.length ? names.join(", ") : "—";
}

const columnHelper = createColumnHelper<Order>();

type InvoiceColumnActions = {
  onChangeStatus: (order: Order) => void;
  onPay: (order: Order) => void;
  onEdit: (order: Order) => void;
  onCancel: (order: Order) => void;
};

export function createInvoiceColumns(
  paidMap: Record<string, number>,
  editLoadingId: string | null,
  { onChangeStatus, onPay, onEdit, onCancel }: InvoiceColumnActions,
) {
  return [
    columnHelper.accessor("code", {
      header: "Số HĐ",
      cell: (info) => {
        const order = info.row.original;
        return (
          <Link
            to="/invoices/$id"
            params={{ id: order.id }}
            className="tabular-nums text-[#4a6664] transition-colors hover:text-primary"
            style={{ textDecoration: isVoided(order) ? "line-through" : "none" }}
          >
            {order.code}
          </Link>
        );
      },
    }),
    columnHelper.accessor((o) => o.patient?.fullName ?? "—", {
      id: "patient",
      header: "Bệnh nhân",
      cell: (info) => {
        const order = info.row.original;
        return (
          <Link
            to="/invoices/$id"
            params={{ id: order.id }}
            className="font-medium text-foreground transition-colors hover:text-primary"
          >
            {order.patient?.fullName ?? "—"}
          </Link>
        );
      },
    }),
    columnHelper.display({
      id: "summary",
      header: "Nội dung",
      cell: (info) => (
        <span className="block max-w-[260px] truncate text-[#4a6664]">
          {summaryOf(info.row.original)}
        </span>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: "Ngày",
      cell: (info) => (
        <span className="tabular-nums text-[#4a6664]">
          {formatDate(info.getValue())}
        </span>
      ),
    }),
    columnHelper.display({
      id: "total",
      header: "Tổng tiền",
      cell: (info) => {
        const order = info.row.original;
        return (
          <span
            className="block text-right font-semibold tabular-nums text-foreground"
            style={{ textDecoration: isVoided(order) ? "line-through" : "none" }}
          >
            {fmt(orderTotal(order))}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "paid",
      header: "Đã thanh toán",
      cell: (info) => (
        <span className="block text-right font-semibold tabular-nums text-[#3f7a55]">
          {fmt(paidMap[info.row.original.id] ?? 0)}
        </span>
      ),
    }),
    columnHelper.display({
      id: "status",
      header: "Trạng thái",
      cell: (info) => {
        const order = info.row.original;
        const status = ORDER_STATUS_META[order.status];
        return (
          <div className="text-right">
            <button
              type="button"
              title="Đổi trạng thái"
              onClick={() => onChangeStatus(order)}
              className={`inline-block cursor-pointer rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-[filter] hover:brightness-95 ${status.className}`}
            >
              {status.label}
            </button>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const order = info.row.original;
        const payable = isPayable(order);
        const editable = isEditable(order);
        const voidable = isVoidable(order);
        const editLoading = editLoadingId === order.id;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              title={payable ? "Thanh toán" : "Không thể thu tiền"}
              onClick={() => onPay(order)}
              disabled={!payable}
              className={`${iconActionButtonClass()} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Wallet className="size-[17px]" />
            </button>
            <button
              type="button"
              title={editable ? "Sửa hoá đơn" : "Không thể sửa"}
              onClick={() => onEdit(order)}
              disabled={editLoading}
              className={`${iconActionButtonClass()} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {editLoading ? (
                <Loader2 className="size-[17px] animate-spin" />
              ) : (
                <Pencil className="size-[17px]" />
              )}
            </button>
            <button
              type="button"
              title={voidable ? "Huỷ hoá đơn" : "Không thể huỷ"}
              onClick={() => onCancel(order)}
              className={iconActionButtonClass("danger")}
            >
              <Ban className="size-[17px]" />
            </button>
          </div>
        );
      },
    }),
  ];
}
