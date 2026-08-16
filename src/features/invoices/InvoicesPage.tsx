import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getPatients } from "@/features/patients/api";
import type { Patient } from "@/features/patients/types";
import { getServices } from "@/features/services/api";
import type { Service } from "@/features/services/types";
import { getUsers } from "@/features/users/api";
import type { User } from "@/features/users/types";
import { CancelInvoiceDialog } from "./CancelInvoiceDialog";
import { errMessage, fmt } from "./format";
import { InvoiceFormDialog, type InvoiceFormResult } from "./InvoiceFormDialog";
import { InvoiceTable } from "./InvoiceTable";
import { PaymentDialog } from "./PaymentDialog";
import { UpdateStatusDialog } from "./UpdateStatusDialog";
import { createOrder, getOrder, getOrders, updateOrder } from "./api";
import { netPaidByInvoice } from "./payment-types";
import { getPayments } from "./payments-api";
import {
  isEditable,
  isPaid,
  isPayable,
  isVoidable,
  isVoided,
  orderItemsToInput,
  ORDER_STATUS_META,
  orderTotal,
  type Order,
  type OrderItemInput,
  type OrderStatus,
} from "./types";

/** Dựng danh sách item cho payload từ các dòng của form. */
function linesToServices(lines: InvoiceFormResult["lines"]): OrderItemInput[] {
  return lines.map((l) => ({
    serviceId: l.serviceId,
    quantity: l.qty,
    unitPrice: l.price,
    amount: l.qty * l.price,
    ...(l.note?.trim() ? { note: l.note.trim() } : {}),
  }));
}

export function InvoicesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [paidMap, setPaidMap] = useState<Record<string, number>>({});

  const [formOpen, setFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Order | null>(null);
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = useState<Order | null>(
    null,
  );
  const [statusInvoice, setStatusInvoice] = useState<Order | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<Order | null>(null);

  useEffect(() => {
    Promise.all([
      getOrders({ pageSize: 50 }),
      getPatients({ pageSize: 100 }),
      getServices({ pageSize: 100 }),
      getUsers({ roleName: "Bác sĩ", pageSize: 100 }),
      getPayments({ pageSize: 200 }),
    ])
      .then(([orderPage, patientPage, servicePage, doctorPage, paymentPage]) => {
        setOrders(orderPage.data);
        setPatients(patientPage.data);
        setServices(servicePage.data);
        setDoctors(doctorPage.data);
        setPaidMap(netPaidByInvoice(paymentPage.data));
      })
      .catch((err) => {
        toast.error(errMessage(err, "Không thể tải danh sách hoá đơn."));
      })
      .finally(() => setLoading(false));
  }, []);

  /** Nạp lại tổng đã thu của một hoá đơn sau khi ghi nhận thanh toán mới. */
  const refreshPaidFor = (invoiceId: string) => {
    getPayments({ invoiceId, pageSize: 200 }).then((page) => {
      setPaidMap((prev) => ({
        ...prev,
        [invoiceId]: netPaidByInvoice(page.data)[invoiceId] ?? 0,
      }));
    });
  };

  const live = orders.filter((o) => !isVoided(o));
  const unpaid = live
    .filter((o) => !isPaid(o))
    .reduce((t, o) => t + orderTotal(o), 0);
  const paidTotal = live.filter(isPaid).reduce((t, o) => t + orderTotal(o), 0);

  const kpis = [
    { label: "Chờ thu", value: fmt(unpaid), color: "#a4553a" },
    { label: "Đã thu", value: fmt(paidTotal), color: undefined },
    { label: "Hoá đơn hiệu lực", value: String(live.length), color: undefined },
  ];

  const openEdit = async (order: Order) => {
    if (!isEditable(order)) {
      toast.error(
        `Hoá đơn đang ở trạng thái "${ORDER_STATUS_META[order.status].label}" — không sửa được`,
      );
      return;
    }
    if (editLoadingId) return;

    setEditLoadingId(order.id);
    try {
      const detail = await getOrder(order.id);
      if (!detail) {
        toast.error("Không tìm thấy hoá đơn.");
        return;
      }
      // Đồng bộ lại bản ghi trong danh sách với dữ liệu mới nhất.
      setOrders((prev) => prev.map((o) => (o.id === detail.id ? detail : o)));
      setEditingInvoice(detail);
      setFormOpen(true);
    } catch (err) {
      toast.error(errMessage(err, "Không thể tải chi tiết hoá đơn."));
    } finally {
      setEditLoadingId(null);
    }
  };

  const openCreate = () => {
    setEditingInvoice(null);
    setFormOpen(true);
  };

  const requestCancel = (order: Order) => {
    if (!isVoidable(order)) {
      toast.error(
        isVoided(order)
          ? "Hoá đơn đã huỷ"
          : `Hoá đơn đang ở trạng thái "${ORDER_STATUS_META[order.status].label}" — không thể huỷ`,
      );
      return;
    }
    setCancellingInvoice(order);
  };

  const requestPay = (order: Order) => {
    if (!isPayable(order)) {
      toast.error(
        `Hoá đơn đang ở trạng thái "${ORDER_STATUS_META[order.status].label}" — không thể thu tiền`,
      );
      return;
    }
    setPayingInvoice(order);
  };

  const handleSave = async (result: InvoiceFormResult) => {
    const servicesPayload = linesToServices(result.lines);
    const totalAmount = servicesPayload.reduce((t, s) => t + s.amount, 0);
    const note = result.note.trim();
    try {
      if (result.mode === "edit" && editingInvoice) {
        const updated = await updateOrder(editingInvoice.id, {
          patientId: result.patientId,
          doctorId: result.doctorId,
          totalAmount,
          note,
          services: servicesPayload,
          ...(result.markIssued ? { status: "ISSUED" as const } : {}),
        });
        setOrders((prev) =>
          prev.map((o) => (o.id === updated.id ? updated : o)),
        );
        toast.success(
          result.markIssued
            ? `Đã cập nhật và xuất hoá đơn ${updated.code}`
            : `Đã cập nhật hoá đơn ${updated.code}`,
        );
      } else {
        const created = await createOrder({
          patientId: result.patientId,
          doctorId: result.doctorId,
          totalAmount,
          note,
          services: servicesPayload,
        });

        const full = result.markIssued
          ? await updateOrder(created.id, {
              status: "ISSUED",
              totalAmount,
              note,
              services: servicesPayload,
            })
          : ((await getOrder(created.id)) ?? created);
        setOrders((prev) => [full, ...prev]);
        toast.success(
          result.markIssued
            ? `Đã tạo và xuất hoá đơn ${full.code} · ${fmt(totalAmount)}`
            : `Đã tạo hoá đơn ${full.code} · ${fmt(totalAmount)}`,
        );
      }
    } catch (err) {
      toast.error(errMessage(err, "Không thể lưu hoá đơn."));
    }
  };

  const handleConfirmCancel = async (reason: string, note: string) => {
    if (!cancellingInvoice) return;
    const cancelReason = [reason, note.trim()].filter(Boolean).join(" — ");
    try {
      const updated = await updateOrder(cancellingInvoice.id, {
        status: "VOIDED",
        cancelReason,
        services: orderItemsToInput(cancellingInvoice),
      });
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      toast.success(`Đã huỷ hoá đơn ${updated.code}`);
      setCancellingInvoice(null);
    } catch (err) {
      toast.error(errMessage(err, "Không thể huỷ hoá đơn."));
    }
  };

  const handleConfirmStatus = async (status: OrderStatus, reason: string) => {
    if (!statusInvoice) return;
    try {
      const updated = await updateOrder(statusInvoice.id, {
        status,
        services: orderItemsToInput(statusInvoice),
        ...(reason ? { cancelReason: reason } : {}),
      });
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      toast.success(
        `Đã chuyển ${updated.code} sang "${ORDER_STATUS_META[status].label}"`,
      );
      setStatusInvoice(null);
    } catch (err) {
      toast.error(errMessage(err, "Không thể cập nhật trạng thái."));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-[14px] border border-border bg-card px-4.5 py-4"
          >
            <div className="text-[12.5px] text-muted-foreground">{k.label}</div>
            <div
              className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums"
              style={{ color: k.color }}
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <InvoiceTable
        orders={orders}
        loading={loading}
        paidMap={paidMap}
        editLoadingId={editLoadingId}
        onChangeStatus={setStatusInvoice}
        onPay={requestPay}
        onEdit={openEdit}
        onCancel={requestCancel}
        countLabel={() =>
          `${live.length} hoá đơn hiệu lực · ${orders.filter(isVoided).length} đã huỷ`
        }
        actions={
          <Button onClick={openCreate} className="gap-1.5">
            <Receipt className="size-[17px]" />
            Tạo hoá đơn
          </Button>
        }
      />

      <InvoiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        invoice={editingInvoice}
        patients={patients}
        services={services}
        doctors={doctors}
        onSave={handleSave}
      />

      <CancelInvoiceDialog
        invoice={cancellingInvoice}
        onOpenChange={(open) => !open && setCancellingInvoice(null)}
        onConfirm={handleConfirmCancel}
      />

      <UpdateStatusDialog
        invoice={statusInvoice}
        onOpenChange={(open) => !open && setStatusInvoice(null)}
        onConfirm={handleConfirmStatus}
      />

      <PaymentDialog
        invoice={payingInvoice}
        onOpenChange={(open) => !open && setPayingInvoice(null)}
        onRecorded={(updated) => {
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? updated : o)),
          );
          refreshPaidFor(updated.id);
        }}
      />
    </div>
  );
}
