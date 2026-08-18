import { Link } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, RotateCcw } from "lucide-react";

import { iconActionButtonClass } from "@/lib/utils";
import { fmt, formatDateTime } from "./format";
import {
  isVoidedPayment,
  paymentAmount,
  PAYMENT_METHOD_META,
  type Payment,
} from "./payment-types";
import type { Order } from "./types";

/** Nhãn + màu trạng thái phiếu thu. */
function paymentStatusMeta(p: Payment): { label: string; className: string } {
  if (isVoidedPayment(p))
    return { label: "Đã huỷ", className: "bg-[#faeceb] text-[#a4553a]" };
  if (p.isRefund)
    return { label: "Hoàn tiền", className: "bg-[#fdf3e8] text-[#9a6524]" };
  return { label: "Đã thu", className: "bg-[#eef6f1] text-[#3f7a55]" };
}

const columnHelper = createColumnHelper<Payment>();

type PaymentColumnActions = {
  onEdit: (payment: Payment) => void;
  onRefund: (payment: Payment) => void;
};

export function createPaymentColumns(
  orderMap: Record<string, Order>,
  { onEdit, onRefund }: PaymentColumnActions,
) {
  return [
    columnHelper.accessor("code", {
      header: "Mã phiếu",
      cell: (info) => (
        <span className="tabular-nums text-[#4a6664]">{info.getValue()}</span>
      ),
    }),
    columnHelper.display({
      id: "invoice",
      header: "Hoá đơn",
      cell: (info) => {
        const order = orderMap[info.row.original.invoiceId];
        if (!order) return <span className="text-[#4a6664]">—</span>;
        return (
          <Link
            to="/invoices/$id"
            params={{ id: order.id }}
            className="font-medium text-foreground transition-colors hover:text-primary"
          >
            {order.code}
            {order.patient?.fullName ? ` · ${order.patient.fullName}` : ""}
          </Link>
        );
      },
    }),
    columnHelper.display({
      id: "amount",
      header: "Số tiền",
      cell: (info) => {
        const p = info.row.original;
        return (
          <span
            className="block text-right font-semibold tabular-nums"
            style={{
              color: p.isRefund ? "#a4553a" : "#16302e",
              textDecoration: isVoidedPayment(p) ? "line-through" : "none",
            }}
          >
            {p.isRefund ? "−" : ""}
            {fmt(paymentAmount(p))}
          </span>
        );
      },
    }),
    columnHelper.accessor("method", {
      header: "Phương thức",
      cell: (info) => (
        <span className="text-[#4a6664]">
          {PAYMENT_METHOD_META[info.getValue()].label}
        </span>
      ),
    }),
    columnHelper.accessor("paidAt", {
      header: "Thời điểm",
      cell: (info) => (
        <span className="tabular-nums text-[#4a6664]">
          {formatDateTime(info.getValue())}
        </span>
      ),
    }),
    columnHelper.display({
      id: "status",
      header: "Trạng thái",
      cell: (info) => {
        const meta = paymentStatusMeta(info.row.original);
        return (
          <span
            className={`inline-block rounded-full px-2.5 py-1 text-[11.5px] font-medium ${meta.className}`}
          >
            {meta.label}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const p = info.row.original;
        const voided = isVoidedPayment(p);
        // Chỉ hoàn tiền được với phiếu thu chưa huỷ và không phải phiếu hoàn.
        const refundable = !voided && !p.isRefund;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              title={voided ? "Phiếu đã huỷ, không sửa được" : "Sửa phiếu thu"}
              onClick={() => onEdit(p)}
              disabled={voided}
              className={`${iconActionButtonClass()} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Pencil className="size-[17px]" />
            </button>
            <button
              type="button"
              title={
                refundable
                  ? "Hoàn tiền"
                  : "Không thể hoàn tiền phiếu này"
              }
              onClick={() => onRefund(p)}
              disabled={!refundable}
              className={`${iconActionButtonClass()} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <RotateCcw className="size-[17px]" />
            </button>
          </div>
        );
      },
    }),
  ];
}
