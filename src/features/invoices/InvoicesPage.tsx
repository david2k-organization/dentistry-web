import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Ban, Loader2, Pencil, Receipt } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getPatients } from "@/features/patients/api";
import type { Patient } from "@/features/patients/types";
import { getServices } from "@/features/services/api";
import type { Service } from "@/features/services/types";
import { getUsers } from "@/features/users/api";
import type { User } from "@/features/users/types";
import { CancelInvoiceDialog } from "./CancelInvoiceDialog";
import { InvoiceFormDialog, type InvoiceFormResult } from "./InvoiceFormDialog";
import { UpdateStatusDialog } from "./UpdateStatusDialog";
import { createOrder, getOrder, getOrders, updateOrder } from "./api";
import {
  isPaid,
  isVoided,
  orderItemsToInput,
  ORDER_STATUS_META,
  orderTotal,
  type Order,
  type OrderItemInput,
  type OrderStatus,
} from "./types";

const vnd = new Intl.NumberFormat("vi-VN");
const fmt = (n: number) => `${vnd.format(n)} đ`;
const dateFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
};

const errMessage = (err: unknown, fallback: string) =>
  (err instanceof AxiosError
    ? (err.response?.data as { message?: string } | undefined)?.message
    : undefined) ?? fallback;

function summaryOf(order: Order): string {
  if (isVoided(order))
    return order.cancelReason ? `Đã huỷ · ${order.cancelReason}` : "Đã huỷ";
  const names = order.services.map((s) => s.service?.name ?? "Dịch vụ");
  return names.length ? names.join(", ") : "—";
}

function statusOf(order: Order): { label: string; className: string } {
  return ORDER_STATUS_META[order.status];
}

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

const COLS = "grid grid-cols-[1fr_1.5fr_1.8fr_1fr_1fr_0.9fr_88px] gap-3";

export function InvoicesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Order | null>(null);
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = useState<Order | null>(
    null,
  );
  const [statusInvoice, setStatusInvoice] = useState<Order | null>(null);

  useEffect(() => {
    Promise.all([
      getOrders({ pageSize: 50 }),
      getPatients({ pageSize: 100 }),
      getServices({ pageSize: 100 }),
      getUsers({ roleName: "Bác sĩ", pageSize: 100 }),
    ])
      .then(([orderPage, patientPage, servicePage, doctorPage]) => {
        setOrders(orderPage.data);
        setPatients(patientPage.data);
        setServices(servicePage.data);
        setDoctors(doctorPage.data);
      })
      .catch((err) => {
        toast.error(errMessage(err, "Không thể tải danh sách hoá đơn."));
      })
      .finally(() => setLoading(false));
  }, []);

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
    if (isPaid(order)) {
      toast.error("Hoá đơn đã thu — không sửa được");
      return;
    }
    if (isVoided(order)) {
      toast.error("Hoá đơn đã huỷ — không sửa được");
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
    if (isPaid(order)) {
      toast.error("Hoá đơn đã thu — cần hoàn tiền thay vì huỷ");
      return;
    }
    if (isVoided(order)) {
      toast.error("Hoá đơn đã huỷ");
      return;
    }
    setCancellingInvoice(order);
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
          ...(result.markPaid ? { status: "PAID" as const } : {}),
        });
        setOrders((prev) =>
          prev.map((o) => (o.id === updated.id ? updated : o)),
        );
        toast.success(
          result.markPaid
            ? `Đã cập nhật và thu ${fmt(totalAmount)}`
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

        const full = result.markPaid
          ? await updateOrder(created.id, {
              status: "PAID",
              totalAmount,
              note,
              services: servicesPayload,
            })
          : ((await getOrder(created.id)) ?? created);
        setOrders((prev) => [full, ...prev]);
        toast.success(
          result.markPaid
            ? `Đã tạo và thu ${fmt(totalAmount)} — ${result.patientName}`
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
        status: "CANCELLED",
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

      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-[#e6efee] px-[18px] py-[15px]">
          <div className="text-[14.5px] font-semibold text-foreground">
            Danh sách hoá đơn
          </div>
          <div className="text-xs text-muted-foreground">
            {live.length} hoá đơn hiệu lực · {orders.filter(isVoided).length} đã
            huỷ
          </div>
          <div className="flex-1" />
          <Button onClick={openCreate} className="gap-1.5">
            <Receipt className="size-[17px]" />
            Tạo hoá đơn
          </Button>
        </div>

        <div
          className={`${COLS} border-b border-[#e6efee] bg-[#f7fbfa] px-[18px] py-3 text-[11.5px] font-medium tracking-[0.04em] text-muted-foreground uppercase`}
        >
          <div>Số HĐ</div>
          <div>Bệnh nhân</div>
          <div>Nội dung</div>
          <div>Ngày</div>
          <div className="text-right">Số tiền</div>
          <div className="text-right">Trạng thái</div>
          <div className="text-right">Thao tác</div>
        </div>

        {loading && (
          <div className="px-[18px] py-8 text-center text-[13px] text-muted-foreground">
            Đang tải hoá đơn…
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="px-[18px] py-8 text-center text-[13px] text-muted-foreground">
            Chưa có hoá đơn nào.
          </div>
        )}

        {!loading &&
          orders.map((o) => {
            const status = statusOf(o);
            const voided = isVoided(o);
            const locked = isPaid(o) || voided;
            return (
              <div
                key={o.id}
                className={`${COLS} items-center border-b border-[#f0f5f4] px-[18px] py-[13px] text-[13px] last:border-0 hover:bg-[#f7fbfa]`}
                style={{ opacity: voided ? 0.72 : 1 }}
              >
                <div
                  className="cursor-pointer tabular-nums text-[#4a6664]"
                  style={{ textDecoration: voided ? "line-through" : "none" }}
                  onClick={() => openEdit(o)}
                >
                  {o.code}
                </div>
                <div
                  className="cursor-pointer font-medium text-foreground"
                  onClick={() => openEdit(o)}
                >
                  {o.patient?.fullName ?? "—"}
                </div>
                <div className="truncate text-[#4a6664]">{summaryOf(o)}</div>
                <div className="tabular-nums text-[#4a6664]">
                  {formatDate(o.createdAt)}
                </div>
                <div
                  className="text-right font-semibold tabular-nums text-foreground"
                  style={{ textDecoration: voided ? "line-through" : "none" }}
                >
                  {fmt(orderTotal(o))}
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    title="Đổi trạng thái"
                    onClick={() => setStatusInvoice(o)}
                    className={`inline-block cursor-pointer rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-[filter] hover:brightness-95 ${status.className}`}
                  >
                    {status.label}
                  </button>
                </div>
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    title={locked ? "Không thể sửa" : "Sửa hoá đơn"}
                    onClick={() => openEdit(o)}
                    disabled={editLoadingId === o.id}
                    className="grid size-[30px] cursor-pointer place-items-center rounded-[9px] border border-border bg-card text-[#4a6664] hover:border-[#cfe0df] hover:bg-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {editLoadingId === o.id ? (
                      <Loader2 className="size-[17px] animate-spin" />
                    ) : (
                      <Pencil className="size-[17px]" />
                    )}
                  </button>
                  <button
                    type="button"
                    title={locked ? "Không thể huỷ" : "Huỷ hoá đơn"}
                    onClick={() => requestCancel(o)}
                    className="grid size-[30px] cursor-pointer place-items-center rounded-[9px] border border-border bg-card text-[#4a6664] hover:border-[#e6cdbf] hover:bg-[#fbeeea] hover:text-[#a4553a]"
                  >
                    <Ban className="size-[17px]" />
                  </button>
                </div>
              </div>
            );
          })}
      </div>

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
    </div>
  );
}
